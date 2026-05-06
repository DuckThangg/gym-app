import cv2
import numpy as np
import threading
import time
import base64
import os
from PIL import ImageFont, ImageDraw, Image
from face_engine import FaceEngine

COLOR_MATCHED = (34, 197, 94)
COLOR_UNKNOWN = (239, 68, 68)
DETECT_EVERY_N_FRAMES = 10

FONT_PATHS = [
    "C:/Windows/Fonts/arial.ttf",
    "C:/Windows/Fonts/segoeui.ttf",
    "C:/Windows/Fonts/tahoma.ttf",
    "C:/Windows/Fonts/calibri.ttf",
]


def _load_fonts():
    for fp in FONT_PATHS:
        if os.path.exists(fp):
            return (
                ImageFont.truetype(fp, 17),
                ImageFont.truetype(fp, 14),
                ImageFont.truetype(fp, 13),
            )
    d = ImageFont.load_default()
    return d, d, d


FONT_NAME, FONT_INFO, FONT_SMALL = _load_fonts()


class CameraManager:
    def __init__(self, engine: FaceEngine, camera_index: int = 0):
        self.engine            = engine
        self.camera_index      = camera_index
        self._cap              = None
        self._running          = False
        self._lock             = threading.Lock()
        self._raw_frame        = None
        self._drawn_frame      = None
        self._last_results     = []
        self._frame_count      = 0
        self._last_frame_time  = time.time()
        self.on_recognized     = None

    def start(self):
        if self._running:
            return
        self._open_camera()
        self._running = True
        threading.Thread(target=self._capture_loop, daemon=True).start()
        threading.Thread(target=self._watchdog,     daemon=True).start()
        print(f"[Camera] Đã khởi động camera {self.camera_index}")

    def _open_camera(self):
        if self._cap:
            self._cap.release()
        self._cap = cv2.VideoCapture(self.camera_index, cv2.CAP_DSHOW)
        self._cap.set(cv2.CAP_PROP_FRAME_WIDTH,  640)
        self._cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        self._cap.set(cv2.CAP_PROP_FPS, 30)
        self._cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        if not self._cap.isOpened():
            raise RuntimeError(f"Không thể mở camera index={self.camera_index}")

    def _watchdog(self):
        while self._running:
            time.sleep(5)
            if not self._running:
                break
            elapsed = time.time() - self._last_frame_time
            if elapsed > 8:
                print(f"[Camera] Watchdog: không có frame {elapsed:.0f}s — restart...")
                try:
                    self._open_camera()
                    self._last_frame_time = time.time()
                    print("[Camera] Restart thành công")
                except Exception as e:
                    print(f"[Camera] Restart thất bại: {e}")

    def stop(self):
        self._running = False
        if self._cap:
            self._cap.release()
            self._cap = None
        print("[Camera] Đã dừng camera")

    @property
    def is_running(self):
        return self._running

    def _capture_loop(self):
        consecutive_fails = 0
        while self._running:
            if self._cap is None or not self._cap.isOpened():
                time.sleep(0.1)
                continue

            ret, frame = self._cap.read()
            if not ret:
                consecutive_fails += 1
                if consecutive_fails > 30:
                    print(f"[Camera] Thất bại {consecutive_fails} lần — restart...")
                    try:
                        self._open_camera()
                        consecutive_fails = 0
                    except Exception as e:
                        print(f"[Camera] Không restart được: {e}")
                time.sleep(0.05)
                continue

            consecutive_fails = 0
            self._last_frame_time = time.time()
            self._frame_count += 1

            if self._frame_count % DETECT_EVERY_N_FRAMES == 0:
                try:
                    rgb    = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    small  = cv2.resize(rgb, (0, 0), fx=0.5, fy=0.5)
                    results = self.engine.identify(small)
                    scaled  = []
                    for r in results:
                        top, right, bottom, left = r["location"]
                        r["location"] = (top*2, right*2, bottom*2, left*2)
                        scaled.append(r)
                    with self._lock:
                        self._last_results = scaled
                    if self.on_recognized:
                        for r in scaled:
                            if r["matched"]:
                                self.on_recognized(
                                    r["member_id"], r["full_name"],
                                    r["confidence"], r.get("end_date")
                                )
                except Exception as e:
                    print(f"[Camera] Lỗi nhận diện: {e}")

            drawn = self._draw(frame.copy())
            with self._lock:
                self._raw_frame   = frame
                self._drawn_frame = drawn

    def _draw(self, frame):
        with self._lock:
            results = list(self._last_results)

        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        pil_img   = Image.fromarray(frame_rgb)
        draw      = ImageDraw.Draw(pil_img)

        for r in results:
            top, right, bottom, left = r["location"]

            if r["matched"]:
                box_color = (34, 197, 94)
                bg_color  = (5,  46,  22)

                # Khung xanh
                draw.rectangle(
                    [(left, top), (right, bottom)],
                    outline=box_color, width=2
                )

                line1 = "✓  Hội viên"
                line2 = f"   {r['full_name']}"
                line3 = f"   {r['confidence']}% chính xác"

                b1 = draw.textbbox((0, 0), line1, font=FONT_INFO)
                b2 = draw.textbbox((0, 0), line2, font=FONT_NAME)
                b3 = draw.textbbox((0, 0), line3, font=FONT_SMALL)
                max_w = max(b1[2]-b1[0], b2[2]-b2[0], b3[2]-b3[0])

                bx1 = left
                by1 = bottom + 4
                bx2 = left + max_w + 20
                by2 = bottom + 74

                # Nền thẻ
                draw.rectangle(
                    [(bx1, by1), (bx2, by2)],
                    fill=bg_color, outline=box_color, width=1
                )
                # Dòng 1: tích + Hội viên
                draw.text((bx1+10, by1+5),  line1, font=FONT_INFO,  fill=(100, 220, 130))
                # Dòng 2: Tên
                draw.text((bx1+10, by1+25), line2, font=FONT_NAME,  fill=(200, 255, 210))
                # Dòng 3: Độ chính xác
                draw.text((bx1+10, by1+50), line3, font=FONT_SMALL, fill=(80, 180, 100))

            else:
                box_color = (239, 68, 68)
                bg_color  = (45,  10, 10)

                draw.rectangle(
                    [(left, top), (right, bottom)],
                    outline=box_color, width=2
                )
                label = "✗  Không nhận ra"
                bbox  = draw.textbbox((0, 0), label, font=FONT_INFO)
                tw    = bbox[2] - bbox[0]

                draw.rectangle(
                    [(left, bottom+4), (left+tw+20, bottom+30)],
                    fill=bg_color, outline=box_color, width=1
                )
                draw.text(
                    (left+10, bottom+8),
                    label, font=FONT_INFO, fill=(239, 68, 68)
                )

        # Thanh thông tin góc trái trên
        info = f"● Gym Manager  |  {self.engine.total_registered} khuôn mặt"
        bbox = draw.textbbox((0, 0), info, font=FONT_SMALL)
        draw.rectangle([(6, 6), (bbox[2]+14, 26)], fill=(0, 0, 0))
        draw.text((10, 8), info, font=FONT_SMALL, fill=(100, 220, 130))

        return cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

    def get_jpeg_bytes(self):
        with self._lock:
            frame = self._drawn_frame
        if frame is None:
            return None
        _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
        return buf.tobytes()

    def get_frame_base64(self):
        data = self.get_jpeg_bytes()
        return base64.b64encode(data).decode("utf-8") if data else None

    def capture_snapshot(self):
        with self._lock:
            frame = self._raw_frame
        return frame.copy() if frame is not None else None

    def get_latest_results(self):
        with self._lock:
            return [
                {k: v for k, v in r.items() if k != "encoding"}
                for r in self._last_results
            ]