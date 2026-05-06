<?php
// ============================================================
//  FILE: gym-api/api/attendance/index.php
//  GET → Lịch sử điểm danh (có filter theo ngày, hội viên)
// ============================================================

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Chỉ hỗ trợ GET', 405);
}

$db        = getDB();
$date      = $_GET['date']      ?? date('Y-m-d');   // Mặc định hôm nay
$memberId  = $_GET['member_id'] ?? '';
$page      = max(1, (int)($_GET['page']  ?? 1));
$limit     = min(100, (int)($_GET['limit'] ?? 50));
$offset    = ($page - 1) * $limit;

$where  = ['1=1'];
$params = [];

if ($date) {
    $where[]       = 'DATE(a.check_in) = :date';
    $params[':date'] = $date;
}

if ($memberId !== '') {
    $where[]            = 'a.member_id = :member_id';
    $params[':member_id'] = (int)$memberId;
}

$whereSQL = implode(' AND ', $where);

// Đếm tổng
$countStmt = $db->prepare("SELECT COUNT(*) FROM attendance a WHERE $whereSQL");
$countStmt->execute($params);
$total = (int)$countStmt->fetchColumn();

// Lấy dữ liệu
$stmt = $db->prepare("
    SELECT
        a.id,
        a.member_id,
        m.full_name,
        m.phone,
        m.avatar,
        a.check_in,
        a.check_out,
        a.method,
        a.notes,
        CASE
            WHEN a.check_out IS NULL THEN 'in_gym'
            ELSE 'left'
        END AS current_status,
        CASE
            WHEN a.check_out IS NOT NULL
            THEN TIMESTAMPDIFF(MINUTE, a.check_in, a.check_out)
            ELSE TIMESTAMPDIFF(MINUTE, a.check_in, NOW())
        END AS duration_minutes
    FROM attendance a
    JOIN members m ON a.member_id = m.id
    WHERE $whereSQL
    ORDER BY a.check_in DESC
    LIMIT :limit OFFSET :offset
");

foreach ($params as $key => $val) {
    $stmt->bindValue($key, $val);
}
$stmt->bindValue(':limit',  $limit,  PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();
$records = $stmt->fetchAll();

// Thống kê nhanh cho ngày được chọn
$statsStmt = $db->prepare("
    SELECT
        COUNT(DISTINCT member_id)                                           AS unique_members,
        COUNT(*)                                                            AS total_checkins,
        SUM(CASE WHEN check_out IS NULL THEN 1 ELSE 0 END)                 AS currently_in_gym,
        AVG(TIMESTAMPDIFF(MINUTE, check_in, IFNULL(check_out, NOW())))     AS avg_duration_minutes
    FROM attendance
    WHERE DATE(check_in) = :date
");
$statsStmt->execute([':date' => $date]);
$stats = $statsStmt->fetch();

sendSuccess([
    'records'     => $records,
    'stats'       => $stats,
    'total'       => $total,
    'page'        => $page,
    'limit'       => $limit,
    'total_pages' => ceil($total / $limit),
    'date'        => $date,
]);
