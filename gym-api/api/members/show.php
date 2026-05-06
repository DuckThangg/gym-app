<?php
// ============================================================
//  FILE: gym-api/api/members/show.php
//  GET ?route=members&action=show&id=1
//  Trả về toàn bộ thông tin 1 hội viên + lịch sử thanh toán
// ============================================================

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Chỉ hỗ trợ GET', 405);
}

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) sendError('ID không hợp lệ', 422);

$db = getDB();

// Thông tin hội viên
$stmt = $db->prepare("
    SELECT
        m.*,
        p.name AS package_name,
        p.duration_days,
        p.price AS package_price,
        DATEDIFF(m.end_date, CURDATE()) AS days_remaining,
        mf.face_image
    FROM members m
    LEFT JOIN packages p  ON m.package_id = p.id
    LEFT JOIN member_faces mf ON mf.member_id = m.id
    WHERE m.id = :id
");
$stmt->execute([':id' => $id]);
$member = $stmt->fetch();

if (!$member) sendNotFound('Không tìm thấy hội viên');

// Lịch sử thanh toán
$payStmt = $db->prepare("
    SELECT
        pay.*,
        p.name AS package_name
    FROM payments pay
    JOIN packages p ON pay.package_id = p.id
    WHERE pay.member_id = :id
    ORDER BY pay.payment_date DESC
");
$payStmt->execute([':id' => $id]);
$payments = $payStmt->fetchAll();

// Thống kê điểm danh
$attStmt = $db->prepare("
    SELECT
        COUNT(*) AS total_visits,
        SUM(CASE WHEN DATE(check_in) = CURDATE() THEN 1 ELSE 0 END) AS visited_today,
        MAX(check_in) AS last_visit
    FROM attendance
    WHERE member_id = :id
");
$attStmt->execute([':id' => $id]);
$attStats = $attStmt->fetch();

sendSuccess([
    'member'     => $member,
    'payments'   => $payments,
    'attendance' => $attStats,
]);
