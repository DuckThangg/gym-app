<?php
// ============================================================
//  FILE: gym-api/api/packages/index.php
//  GET  → Danh sách gói tập
//  POST → Tạo gói mới (dùng create.php)
// ============================================================

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/response.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $onlyActive = $_GET['active'] ?? '1';

    $where = $onlyActive === '1' ? 'WHERE is_active = 1' : '';

    $stmt = $db->query("
        SELECT
            p.*,
            COUNT(m.id) AS member_count
        FROM packages p
        LEFT JOIN members m ON m.package_id = p.id AND m.status = 'active'
        $where
        GROUP BY p.id
        ORDER BY p.price ASC
    ");

    sendSuccess($stmt->fetchAll());
}

sendError('Phương thức không được hỗ trợ', 405);
