<?php
// ============================================================
//  FILE: gym-api/api/attendance/checkout.php
//  POST → Ghi nhận hội viên ra khỏi phòng gym
// ============================================================

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Chỉ hỗ trợ POST', 405);
}

$db   = getDB();
$body = getRequestBody();
requireFields($body, ['member_id']);

$memberId = (int)$body['member_id'];

// Tìm bản ghi check-in chưa có check-out hôm nay
$findStmt = $db->prepare("
    SELECT a.id, a.check_in, m.full_name, m.avatar
    FROM attendance a
    JOIN members m ON a.member_id = m.id
    WHERE a.member_id = :id
      AND DATE(a.check_in) = CURDATE()
      AND a.check_out IS NULL
    ORDER BY a.check_in DESC
    LIMIT 1
");
$findStmt->execute([':id' => $memberId]);
$record = $findStmt->fetch();

if (!$record) {
    sendError('Hội viên chưa check-in hôm nay hoặc đã check-out rồi', 404);
}

// Cập nhật check-out
$stmt = $db->prepare("
    UPDATE attendance
    SET check_out = NOW()
    WHERE id = :id
");
$stmt->execute([':id' => $record['id']]);

$duration = (int)((time() - strtotime($record['check_in'])) / 60);

sendSuccess([
    'attendance_id'    => (int)$record['id'],
    'member_id'        => $memberId,
    'full_name'        => $record['full_name'],
    'avatar'           => $record['avatar'],
    'check_in'         => $record['check_in'],
    'check_out'        => date('Y-m-d H:i:s'),
    'duration_minutes' => $duration,
], 'Check-out thành công');
