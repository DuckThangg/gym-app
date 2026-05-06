# FILE: python-service/app.py

import os, time, uuid, cv2
from datetime import datetime, date
from flask import Flask, Response, jsonify, request
from flask_cors import CORS
from face_engine import FaceEngine
from camera      import CameraManager
from database    import record_checkin, get_member_info

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://localhost:3000"],
     supports_credentials=True)

engine = FaceEngine()
camera = CameraManager(engine, camera_index=0)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "gym-api", "uploads", "faces")
os.makedirs(UPLOAD_DIR, exist_ok=True)

_checkin_cooldown: dict[int, float] = {}
COOLDOWN_SECONDS = 10

def _ok(data=None, message="Thành công", code=200):
    return jsonify({"success": True, "message": message, "data": data}), code

def _err(message="Lỗi", code=400):
    return jsonify({"success": False, "message": message}), code

def _can_checkin(mid):
    return (time.time() - _checkin_cooldown.get(mid, 0)) >= COOLDOWN_SECONDS


def on_face_recognized(member_id, full_name, confidence, end_date):
    if not _can_checkin(member_id):
        return
    if end_date:
        try:
            if datetime.strptime(end_date, "%Y-%m-%d").date() < date.today():
                return
        except ValueError:
            pass
    result = record_checkin(member_id, method="face")
    _checkin_cooldown[member_id] = time.time()
    if result:
        print(f"[AutoCheckin] ✅ {full_name} ({confidence}%)")

camera.on_recognized = on_face_recognized


@app.route("/status")
def status():
    return _ok({"camera_running": camera.is_running,
                "faces_registered": engine.total_registered,
                "timestamp": datetime.now().isoformat()})

@app.route("/stream")
def stream():
    if not camera.is_running:
        return _err("Camera chưa bật", 503)
    def generate():
        while True:
            jpeg = camera.get_jpeg_bytes()
            if jpeg:
                yield b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + jpeg + b"\r\n"
            time.sleep(0.033)
    return Response(generate(), mimetype="multipart/x-mixed-replace; boundary=frame")

@app.route("/snapshot")
def snapshot():
    b64 = camera.get_frame_base64()
    return _ok({"frame": b64}) if b64 else _err("Không có frame", 503)

@app.route("/results")
def results():
    return _ok(camera.get_latest_results())

@app.route("/camera/start", methods=["POST"])
def camera_start():
    if camera.is_running:
        return _ok(message="Camera đang chạy rồi")
    try:
        camera.start()
        return _ok(message="Đã bật camera")
    except RuntimeError as e:
        return _err(str(e), 500)

@app.route("/camera/stop", methods=["POST"])
def camera_stop():
    camera.stop()
    return _ok(message="Đã tắt camera")

@app.route("/reload", methods=["POST"])
def reload_encodings():
    engine.reload()
    return _ok({"total": engine.total_registered})

@app.route("/register", methods=["POST"])
def register_face():
    member_id  = request.form.get("member_id")
    image_file = request.files.get("image")
    if not member_id: return _err("Thiếu member_id")
    if not image_file: return _err("Thiếu file ảnh")
    member_id = int(member_id)
    ext       = os.path.splitext(image_file.filename)[1] or ".jpg"
    filename  = f"member_{member_id}_{uuid.uuid4().hex[:8]}{ext}"
    save_path = os.path.join(UPLOAD_DIR, filename)
    image_file.save(save_path)
    result = engine.register(save_path, member_id)
    if not result["success"]:
        os.remove(save_path)
        return _err(result["message"])
    return _ok({"image_path": f"uploads/faces/{filename}"}, result["message"], 201)

@app.route("/register/capture", methods=["POST", "OPTIONS"])
def register_from_webcam():
    if request.method == "OPTIONS":
        return _ok()
    if not camera.is_running:
        return _err("Camera chưa bật", 503)

    data      = request.get_json(silent=True) or {}
    member_id = data.get("member_id") or request.form.get("member_id")

    if not member_id:
        return _err('Thiếu member_id')

    member_id = int(member_id)

    try:
        member = get_member_info(member_id)
        if not member:
            return _err(f"Không tìm thấy hội viên ID={member_id}", 404)

        # Chụp nhiều frame liên tiếp, lấy frame ổn định nhất
        frame = None
        for _ in range(5):
            frame = camera.capture_snapshot()
            if frame is not None:
                break
            time.sleep(0.2)

        if frame is None:
            return _err("Không lấy được frame — thử lại")

        filename  = f"member_{member_id}_{uuid.uuid4().hex[:8]}.jpg"
        save_path = os.path.join(UPLOAD_DIR, filename)
        cv2.imwrite(save_path, frame)

        # Chạy face_recognition trong thread riêng để tránh block
        import face_recognition as fr
        import concurrent.futures

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Scale nhỏ lại để detect nhanh hơn, ít bị treo hơn
        small_rgb = cv2.resize(rgb, (320, 240))

        print("[Register] Đang detect khuôn mặt (thread riêng)...")

        def detect():
            locs = fr.face_locations(small_rgb, model="hog", number_of_times_to_upsample=1)
            return locs

        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(detect)
            try:
                locations = future.result(timeout=15)
            except concurrent.futures.TimeoutError:
                if os.path.exists(save_path): os.remove(save_path)
                return _err("Nhận diện quá lâu (timeout 15s) — thử lại")

        print(f"[Register] Phát hiện {len(locations)} khuôn mặt")

        if not locations:
            if os.path.exists(save_path): os.remove(save_path)
            return _err("Không phát hiện khuôn mặt — đứng gần hơn và đảm bảo đủ sáng")

        if len(locations) > 1:
            if os.path.exists(save_path): os.remove(save_path)
            return _err("Phát hiện nhiều khuôn mặt — chỉ để 1 người trước camera")

        print("[Register] Đang tính encoding...")

        def encode():
            # Scale location về kích thước gốc
            top, right, bottom, left = locations[0]
            scale = 2  # vì đã resize 320/640 = 0.5
            full_loc = [(top*scale, right*scale, bottom*scale, left*scale)]
            return fr.face_encodings(rgb, full_loc)

        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(encode)
            try:
                encodings = future.result(timeout=15)
            except concurrent.futures.TimeoutError:
                if os.path.exists(save_path): os.remove(save_path)
                return _err("Tính encoding quá lâu — thử lại")

        if not encodings:
            return _err("Không tính được encoding — thử lại")

        print("[Register] Đang lưu vào database...")
        from database import save_face_encoding
        save_face_encoding(member_id, encodings[0], f"uploads/faces/{filename}")
        engine.reload()

        print(f"[Register] ✅ Hoàn tất — {member['full_name']}")
        return _ok(
            {"image_path": f"uploads/faces/{filename}"},
            "Đăng ký khuôn mặt thành công",
            201
        )

    except Exception as e:
        import traceback
        print(f"[Register] ❌ LỖI: {e}")
        traceback.print_exc()
        return _err(f"Lỗi: {str(e)}", 500)


if __name__ == "__main__":
    print("=" * 50)
    print("  GYM Face Recognition Service")
    print("  http://localhost:5000")
    print("=" * 50)
    try:
        camera.start()
    except Exception as e:
        print(f"[Warning] {e}")
    app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)