import face_recognition
import numpy as np
import pickle
import os
import time
import threading
from database import load_all_face_encodings, save_face_encoding

CACHE_FILE   = os.path.join(os.path.dirname(__file__), "known_faces", "encodings.pkl")
TOLERANCE    = 0.42   # Giảm từ 0.5 xuống 0.42 — chặt hơn, ít nhầm hơn
RELOAD_EVERY = 60


class FaceEngine:
    def __init__(self):
        self._known     = []
        self._lock      = threading.Lock()
        self._last_load = 0
        self.load_encodings()
        threading.Thread(target=self._auto_reload, daemon=True).start()

    def load_encodings(self):
        print("[FaceEngine] Đang tải encodings từ database...")
        try:
            data = load_all_face_encodings()
            with self._lock:
                self._known = data
            self._last_load = time.time()
            self._save_cache(data)
            print(f"[FaceEngine] Đã tải {len(data)} khuôn mặt")
        except Exception as e:
            print(f"[FaceEngine] Lỗi tải DB: {e} — thử dùng cache...")
            self._load_from_cache()

    def _save_cache(self, data):
        os.makedirs(os.path.dirname(CACHE_FILE), exist_ok=True)
        with open(CACHE_FILE, "wb") as f:
            serializable = [
                {k: (v.tolist() if isinstance(v, np.ndarray) else v) for k, v in d.items()}
                for d in data
            ]
            pickle.dump(serializable, f)

    def _load_from_cache(self):
        if not os.path.exists(CACHE_FILE):
            return
        with open(CACHE_FILE, "rb") as f:
            raw = pickle.load(f)
        data = [
            {k: (np.array(v, dtype=np.float64) if k == "encoding" else v) for k, v in d.items()}
            for d in raw
        ]
        with self._lock:
            self._known = data
        print(f"[FaceEngine] Đã tải {len(data)} khuôn mặt từ cache")

    def _auto_reload(self):
        while True:
            time.sleep(RELOAD_EVERY)
            self.load_encodings()

    def reload(self):
        self.load_encodings()

    def identify(self, frame_rgb: np.ndarray) -> list[dict]:
        results   = []
        locations = face_recognition.face_locations(
            frame_rgb,
            model="hog",
            number_of_times_to_upsample=1
        )
        if not locations:
            return results

        encodings = face_recognition.face_encodings(
            frame_rgb, locations,
            num_jitters=1,
            model="small"
        )

        with self._lock:
            known_list = list(self._known)

        if not known_list:
            return results

        known_encodings = [k["encoding"] for k in known_list]

        for face_enc, location in zip(encodings, locations):
            distances = face_recognition.face_distance(known_encodings, face_enc)
            best_idx  = int(np.argmin(distances))
            best_dist = float(distances[best_idx])

            if best_dist <= TOLERANCE:
                person     = known_list[best_idx]
                confidence = round((1 - best_dist) * 100, 1)
                results.append({
                    "member_id":  person["member_id"],
                    "full_name":  person["full_name"],
                    "avatar":     person["avatar"],
                    "end_date":   person.get("end_date"),
                    "confidence": confidence,
                    "location":   location,
                    "matched":    True,
                })
            else:
                results.append({
                    "member_id":  None,
                    "full_name":  "Không nhận ra",
                    "avatar":     None,
                    "confidence": 0,
                    "location":   location,
                    "matched":    False,
                })

        return results

    def register(self, image_path: str, member_id: int) -> dict:
        image     = face_recognition.load_image_file(image_path)
        locations = face_recognition.face_locations(image, model="hog")

        if not locations:
            return {"success": False, "message": "Không phát hiện khuôn mặt trong ảnh"}
        if len(locations) > 1:
            return {"success": False, "message": "Ảnh có nhiều hơn 1 khuôn mặt"}

        # Đăng ký với num_jitters=5 để encoding chính xác hơn
        encoding = face_recognition.face_encodings(
            image, locations,
            num_jitters=5,
            model="large"
        )[0]
        save_face_encoding(member_id, encoding, image_path)
        self.reload()
        return {"success": True, "message": "Đăng ký khuôn mặt thành công"}

    def register_from_frame(self, frame_rgb: np.ndarray, member_id: int) -> dict:
        locations = face_recognition.face_locations(frame_rgb, model="hog")

        if not locations:
            return {"success": False, "message": "Không phát hiện khuôn mặt"}
        if len(locations) > 1:
            return {"success": False, "message": "Phát hiện nhiều khuôn mặt"}

        encoding = face_recognition.face_encodings(
            frame_rgb, locations,
            num_jitters=5,
            model="large"
        )[0]
        save_face_encoding(member_id, encoding)
        self.reload()
        return {"success": True, "message": "Đăng ký thành công"}

    @property
    def total_registered(self) -> int:
        with self._lock:
            return len(self._known)