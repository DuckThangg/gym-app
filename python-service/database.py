# ============================================================
#  FILE: python-service/database.py
#  Mô tả: Kết nối MySQL từ Python để lấy encoding khuôn mặt
#         và ghi nhận check-in trực tiếp
# ============================================================

import mysql.connector
import json
import numpy as np
from datetime import datetime

DB_CONFIG = {
    "host":     "localhost",
    "user":     "root",
    "password": "",           # Mặc định XAMPP không có password
    "database": "gym_management",
    "charset":  "utf8mb4",
}


def get_connection():
    return mysql.connector.connect(**DB_CONFIG)


def load_all_face_encodings() -> list[dict]:
    """
    Tải toàn bộ encoding khuôn mặt từ DB.
    Trả về list[{ member_id, full_name, avatar, encoding: np.array }]
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT
            mf.member_id,
            mf.face_encoding,
            m.full_name,
            m.avatar,
            m.status,
            m.end_date
        FROM member_faces mf
        JOIN members m ON mf.member_id = m.id
        WHERE m.status = 'active'
    """)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    result = []
    for row in rows:
        try:
            encoding = np.array(json.loads(row["face_encoding"]), dtype=np.float64)
            result.append({
                "member_id": row["member_id"],
                "full_name": row["full_name"],
                "avatar":    row["avatar"],
                "status":    row["status"],
                "end_date":  str(row["end_date"]) if row["end_date"] else None,
                "encoding":  encoding,
            })
        except Exception:
            continue  # bỏ qua encoding lỗi

    return result


def save_face_encoding(member_id: int, encoding: np.ndarray, image_path: str = None):
    """Lưu hoặc cập nhật encoding khuôn mặt vào DB."""
    conn = get_connection()
    cursor = conn.cursor()
    encoding_json = json.dumps(encoding.tolist())
    cursor.execute("""
        INSERT INTO member_faces (member_id, face_encoding, face_image)
        VALUES (%s, %s, %s)
        ON DUPLICATE KEY UPDATE
            face_encoding = VALUES(face_encoding),
            face_image    = VALUES(face_image)
    """, (member_id, encoding_json, image_path))
    conn.commit()
    cursor.close()
    conn.close()


def record_checkin(member_id: int, method: str = "face") -> dict | None:
    """
    Ghi check-in trực tiếp vào DB (bypass PHP API).
    Trả về bản ghi vừa tạo hoặc None nếu đã check-in rồi.
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Kiểm tra đã check-in chưa
    cursor.execute("""
        SELECT id FROM attendance
        WHERE member_id = %s
          AND DATE(check_in) = CURDATE()
          AND check_out IS NULL
    """, (member_id,))
    if cursor.fetchone():
        cursor.close()
        conn.close()
        return None  # đã check-in

    cursor.execute("""
        INSERT INTO attendance (member_id, check_in, method)
        VALUES (%s, NOW(), %s)
    """, (member_id, method))
    conn.commit()
    attendance_id = cursor.lastrowid
    cursor.close()
    conn.close()
    return {"attendance_id": attendance_id, "check_in": datetime.now().isoformat()}


def get_member_info(member_id: int) -> dict | None:
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT m.id, m.full_name, m.phone, m.status, m.end_date,
               m.avatar, p.name AS package_name
        FROM members m
        LEFT JOIN packages p ON m.package_id = p.id
        WHERE m.id = %s
    """, (member_id,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    return row