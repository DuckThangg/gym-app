<?php
// ============================================================
//  FILE: gym-api/api/payments/index.php
//  GET → Lịch sử thanh toán
// ============================================================
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Chỉ hỗ trợ GET', 405);
}

$db       = getDB();
$memberId = $_GET['member_id'] ?? '';
$month    = $_GET['month']     ?? date('Y-m');
$page     = max(1, (int)($_GET['page']  ?? 1));
$limit    = min(100, (int)($_GET['limit'] ?? 20));
$offset   = ($page - 1) * $limit;

$where  = ["DATE_FORMAT(pay.payment_date, '%Y-%m') = :month"];
$params = [':month' => $month];

if ($memberId !== '') {
    $where[]            = 'pay.member_id = :member_id';
    $params[':member_id'] = (int)$memberId;
}

$whereSQL = implode(' AND ', $where);

$countStmt = $db->prepare("SELECT COUNT(*) FROM payments pay WHERE $whereSQL");
$countStmt->execute($params);
$total = (int)$countStmt->fetchColumn();

$stmt = $db->prepare("
    SELECT
        pay.*,
        m.full_name,
        m.phone,
        p.name AS package_name
    FROM payments pay
    JOIN members  m ON pay.member_id  = m.id
    JOIN packages p ON pay.package_id = p.id
    WHERE $whereSQL
    ORDER BY pay.payment_date DESC
    LIMIT :limit OFFSET :offset
");

foreach ($params as $key => $val) {
    $stmt->bindValue($key, $val);
}
$stmt->bindValue(':limit',  $limit,  PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();

sendSuccess([
    'payments'    => $stmt->fetchAll(),
    'total'       => $total,
    'page'        => $page,
    'total_pages' => ceil($total / $limit),
]);
