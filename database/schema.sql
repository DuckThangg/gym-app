-- ============================================================
--  GYM MANAGEMENT SYSTEM - DATABASE SCHEMA
--  File: database/schema.sql
--  Mô tả: Toàn bộ cấu trúc bảng cho hệ thống quản lý phòng gym
--  Cách dùng: Import file này vào phpMyAdmin
-- ============================================================

-- Tạo và chọn database
CREATE DATABASE IF NOT EXISTS gym_management
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE gym_management;

-- ============================================================
-- BẢNG 1: packages (Gói tập)
-- Tạo trước vì members tham chiếu tới bảng này
-- ============================================================
CREATE TABLE IF NOT EXISTS packages (
    id              INT             NOT NULL AUTO_INCREMENT,
    name            VARCHAR(100)    NOT NULL,               -- Tên gói: "1 tháng", "3 tháng", "1 năm"
    duration_days   INT             NOT NULL,               -- Số ngày hiệu lực
    price           DECIMAL(12, 0)  NOT NULL,               -- Giá tiền (VNĐ)
    description     TEXT            NULL,                   -- Mô tả thêm
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,     -- 1 = đang bán, 0 = ngừng bán
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- BẢNG 2: members (Hội viên)
-- ============================================================
CREATE TABLE IF NOT EXISTS members (
    id              INT             NOT NULL AUTO_INCREMENT,
    full_name       VARCHAR(150)    NOT NULL,               -- Họ và tên
    phone           VARCHAR(20)     NOT NULL,               -- Số điện thoại
    email           VARCHAR(150)    NULL,                   -- Email (không bắt buộc)
    gender          ENUM('male','female','other') NOT NULL DEFAULT 'male',
    date_of_birth   DATE            NULL,
    address         VARCHAR(255)    NULL,
    avatar          VARCHAR(255)    NULL,                   -- Đường dẫn ảnh đại diện
    package_id      INT             NULL,                   -- Gói tập hiện tại
    start_date      DATE            NULL,                   -- Ngày bắt đầu gói hiện tại
    end_date        DATE            NULL,                   -- Ngày hết hạn gói hiện tại
    status          ENUM('active','expired','suspended') NOT NULL DEFAULT 'active',
    notes           TEXT            NULL,                   -- Ghi chú của chủ gym
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_members_phone (phone),
    KEY idx_members_status (status),
    KEY idx_members_end_date (end_date),
    CONSTRAINT fk_members_package
        FOREIGN KEY (package_id) REFERENCES packages (id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- BẢNG 3: member_faces (Dữ liệu khuôn mặt hội viên)
-- Lưu encoding vector từ face_recognition
-- ============================================================
CREATE TABLE IF NOT EXISTS member_faces (
    id              INT             NOT NULL AUTO_INCREMENT,
    member_id       INT             NOT NULL,
    face_encoding   LONGTEXT        NOT NULL,               -- JSON array 128 số từ face_recognition
    face_image      VARCHAR(255)    NULL,                   -- Đường dẫn ảnh khuôn mặt gốc
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_face_member (member_id),                  -- Mỗi hội viên chỉ 1 khuôn mặt
    CONSTRAINT fk_faces_member
        FOREIGN KEY (member_id) REFERENCES members (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- BẢNG 4: attendance (Lịch sử điểm danh)
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance (
    id              INT             NOT NULL AUTO_INCREMENT,
    member_id       INT             NOT NULL,
    check_in        DATETIME        NOT NULL,               -- Giờ vào
    check_out       DATETIME        NULL,                   -- Giờ ra (NULL nếu chưa ra)
    method          ENUM('face','manual') NOT NULL DEFAULT 'face', -- Cách điểm danh
    notes           VARCHAR(255)    NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_attendance_member (member_id),
    KEY idx_attendance_checkin (check_in),
    CONSTRAINT fk_attendance_member
        FOREIGN KEY (member_id) REFERENCES members (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- BẢNG 5: payments (Thanh toán)
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
    id              INT             NOT NULL AUTO_INCREMENT,
    member_id       INT             NOT NULL,
    package_id      INT             NOT NULL,
    amount          DECIMAL(12, 0)  NOT NULL,               -- Số tiền thực thu
    discount        DECIMAL(12, 0)  NOT NULL DEFAULT 0,     -- Số tiền giảm giá
    payment_date    DATE            NOT NULL,               -- Ngày thanh toán
    payment_method  ENUM('cash','transfer','other') NOT NULL DEFAULT 'cash',
    start_date      DATE            NOT NULL,               -- Ngày bắt đầu gói được mua
    end_date        DATE            NOT NULL,               -- Ngày hết hạn gói được mua
    notes           VARCHAR(255)    NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_payments_member (member_id),
    KEY idx_payments_date (payment_date),
    CONSTRAINT fk_payments_member
        FOREIGN KEY (member_id) REFERENCES members (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_payments_package
        FOREIGN KEY (package_id) REFERENCES packages (id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- BẢNG 6: notifications (Cảnh báo / Thông báo nội bộ)
-- Lưu các cảnh báo hội viên sắp hết hạn, đã hết hạn
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id              INT             NOT NULL AUTO_INCREMENT,
    member_id       INT             NOT NULL,
    type            ENUM('expiring_soon','expired','payment_received') NOT NULL,
    message         VARCHAR(255)    NOT NULL,
    is_read         TINYINT(1)      NOT NULL DEFAULT 0,     -- 0 = chưa đọc
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_notif_member (member_id),
    KEY idx_notif_read (is_read),
    CONSTRAINT fk_notif_member
        FOREIGN KEY (member_id) REFERENCES members (id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- BẢNG 7: settings (Cài đặt hệ thống)
-- Lưu thông tin phòng gym, cấu hình chung
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
    id              INT             NOT NULL AUTO_INCREMENT,
    setting_key     VARCHAR(100)    NOT NULL,
    setting_value   TEXT            NULL,
    description     VARCHAR(255)    NULL,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- DỮ LIỆU MẶC ĐỊNH: Settings
-- ============================================================
INSERT INTO settings (setting_key, setting_value, description) VALUES
('gym_name',            'Phòng Gym',        'Tên phòng gym'),
('gym_address',         '',                 'Địa chỉ phòng gym'),
('gym_phone',           '',                 'Số điện thoại liên hệ'),
('expiry_warning_days', '7',                'Cảnh báo hội viên sắp hết hạn trước bao nhiêu ngày'),
('currency',            'VND',              'Đơn vị tiền tệ'),
('open_time',           '06:00',            'Giờ mở cửa'),
('close_time',          '22:00',            'Giờ đóng cửa');


-- ============================================================
-- DỮ LIỆU MẪU: Packages
-- ============================================================
INSERT INTO packages (name, duration_days, price, description) VALUES
('Gói 1 tháng',     30,     300000,     'Tập không giới hạn trong 1 tháng'),
('Gói 3 tháng',     90,     800000,     'Tiết kiệm hơn gói tháng, tập 3 tháng liên tục'),
('Gói 6 tháng',     180,    1400000,    'Dành cho hội viên lâu dài, giá ưu đãi'),
('Gói 1 năm',       365,    2500000,    'Gói tiết kiệm nhất, tập cả năm');


-- ============================================================
-- VIEW: Hội viên sắp hết hạn (dùng cho cảnh báo)
-- ============================================================
CREATE OR REPLACE VIEW v_expiring_members AS
SELECT
    m.id,
    m.full_name,
    m.phone,
    m.end_date,
    DATEDIFF(m.end_date, CURDATE()) AS days_remaining,
    p.name AS package_name
FROM members m
LEFT JOIN packages p ON m.package_id = p.id
WHERE
    m.status = 'active'
    AND m.end_date IS NOT NULL
    AND DATEDIFF(m.end_date, CURDATE()) BETWEEN 0 AND 7
ORDER BY m.end_date ASC;


-- ============================================================
-- VIEW: Thống kê điểm danh hôm nay
-- ============================================================
CREATE OR REPLACE VIEW v_today_attendance AS
SELECT
    a.id,
    a.member_id,
    m.full_name,
    m.avatar,
    a.check_in,
    a.check_out,
    a.method,
    CASE
        WHEN a.check_out IS NULL THEN 'Đang trong phòng'
        ELSE 'Đã ra'
    END AS current_status,
    CASE
        WHEN a.check_out IS NOT NULL
        THEN TIMESTAMPDIFF(MINUTE, a.check_in, a.check_out)
        ELSE TIMESTAMPDIFF(MINUTE, a.check_in, NOW())
    END AS duration_minutes
FROM attendance a
JOIN members m ON a.member_id = m.id
WHERE DATE(a.check_in) = CURDATE()
ORDER BY a.check_in DESC;


-- ============================================================
-- VIEW: Doanh thu theo tháng
-- ============================================================
CREATE OR REPLACE VIEW v_monthly_revenue AS
SELECT
    YEAR(payment_date)      AS year,
    MONTH(payment_date)     AS month,
    COUNT(*)                AS total_payments,
    SUM(amount)             AS total_revenue,
    SUM(discount)           AS total_discount,
    SUM(amount - discount)  AS net_revenue
FROM payments
GROUP BY YEAR(payment_date), MONTH(payment_date)
ORDER BY year DESC, month DESC;
