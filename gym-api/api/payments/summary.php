<?php
// ============================================================
//  FILE: gym-api/api/payments/summary.php
//  GET → Tóm tắt doanh thu theo tháng / năm
// ============================================================
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') sendError('Chỉ hỗ trợ GET', 405);

$db   = getDB();
$year = (int)($_GET['year'] ?? date('Y'));

// Doanh thu 12 tháng trong năm
$monthlyStmt = $db->prepare("
    SELECT
        MONTH(payment_date)    AS month,
        COUNT(*)               AS total_payments,
        SUM(amount)            AS total_revenue,
        SUM(discount)          AS total_discount,
        SUM(amount - discount) AS net_revenue
    FROM payments
    WHERE YEAR(payment_date) = :year
    GROUP BY MONTH(payment_date)
    ORDER BY month ASC
");
$monthlyStmt->execute([':year' => $year]);
$monthly = $monthlyStmt->fetchAll();

// Tổng năm
$yearStmt = $db->prepare("
    SELECT
        SUM(amount)            AS total_revenue,
        SUM(discount)          AS total_discount,
        SUM(amount - discount) AS net_revenue,
        COUNT(*)               AS total_payments
    FROM payments
    WHERE YEAR(payment_date) = :year
");
$yearStmt->execute([':year' => $year]);
$yearSummary = $yearStmt->fetch();

// Gói bán chạy nhất
$topPkgStmt = $db->prepare("
    SELECT p.name, COUNT(*) AS sold_count, SUM(pay.amount) AS revenue
    FROM payments pay
    JOIN packages p ON pay.package_id = p.id
    WHERE YEAR(pay.payment_date) = :year
    GROUP BY pay.package_id
    ORDER BY sold_count DESC
    LIMIT 5
");
$topPkgStmt->execute([':year' => $year]);
$topPackages = $topPkgStmt->fetchAll();

sendSuccess([
    'year'         => $year,
    'monthly'      => $monthly,
    'year_summary' => $yearSummary,
    'top_packages' => $topPackages,
]);
