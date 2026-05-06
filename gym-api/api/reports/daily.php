<?php
// ============================================================
//  FILE: gym-api/api/reports/daily.php
//  GET → Báo cáo tổng quan ngày hôm nay
// ============================================================
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') sendError('Chỉ hỗ trợ GET', 405);

$db   = getDB();
$date = $_GET['date'] ?? date('Y-m-d');

// Số người vào hôm nay
$attStmt = $db->prepare("
    SELECT COUNT(DISTINCT member_id) AS unique_visitors,
           COUNT(*) AS total_checkins,
           SUM(CASE WHEN check_out IS NULL THEN 1 ELSE 0 END) AS currently_in
    FROM attendance
    WHERE DATE(check_in) = :date
");
$attStmt->execute([':date' => $date]);
$attStats = $attStmt->fetch();

// Doanh thu hôm nay
$revStmt = $db->prepare("
    SELECT COUNT(*) AS payments_count,
           COALESCE(SUM(amount), 0) AS revenue,
           COALESCE(SUM(discount), 0) AS discount
    FROM payments
    WHERE payment_date = :date
");
$revStmt->execute([':date' => $date]);
$revenue = $revStmt->fetch();

// Hội viên mới hôm nay
$newMemberStmt = $db->prepare("
    SELECT COUNT(*) AS new_members FROM members WHERE DATE(created_at) = :date
");
$newMemberStmt->execute([':date' => $date]);
$newMembers = $newMemberStmt->fetchColumn();

// Hội viên sắp hết hạn (7 ngày tới)
$expiringStmt = $db->query("SELECT * FROM v_expiring_members LIMIT 20");
$expiring = $expiringStmt->fetchAll();

// Danh sách vào phòng hôm nay
$visitorsStmt = $db->prepare("SELECT * FROM v_today_attendance");
$visitorsStmt->execute();
$visitors = $visitorsStmt->fetchAll();

sendSuccess([
    'date'       => $date,
    'attendance' => $attStats,
    'revenue'    => $revenue,
    'new_members' => (int)$newMembers,
    'expiring'   => $expiring,
    'visitors'   => $visitors,
]);
