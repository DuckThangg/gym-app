<?php
// ============================================================
//  FILE: gym-api/api/attendance/checkin.php
//  POST → Ghi nhận hội viên vào phòng gym
//  Được gọi từ Python service sau khi nhận diện khuôn mặt
//  Hoặc từ dashboard khi điểm danh thủ công
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
$method   = in_array($body['method'] ?? '', ['face', 'manual']) ? $body['method'] : 'manual';

// Kiểm tra hội viên tồn tại và còn hạn
$memberStmt = $db->prepare("
    SELECT id, full_name, status, end_date, avatar
    FROM members
    WHERE id = :id
");
$memberStmt->execute([':id' => $memberId]);
$member = $memberStmt->fetch();

if (!$member) sendNotFound('Không tìm thấy hội viên');

if ($member['status'] === 'suspended') {
    sendError('Hội viên đang bị tạm khóa', 403);
}

if ($member['status'] === 'expired' || (
    $member['end_date'] && strtotime($member['end_date']) < strtotime('today')
)) {
    sendError('Hội viên đã hết hạn gói tập. Vui lòng gia hạn trước khi vào tập.', 403);
}

// Kiểm tra đã check-in chưa (chưa check-out)
$existStmt = $db->prepare("
    SELECT id FROM attendance
    WHERE member_id = :id
      AND DATE(check_in) = CURDATE()
      AND check_out IS NULL
");
$existStmt->execute([':id' => $memberId]);
if ($existStmt->fetch()) {
    sendError('Hội viên đang ở trong phòng gym (chưa check-out)', 409);
}

// Ghi check-in
$stmt = $db->prepare("
    INSERT INTO attendance (member_id, check_in, method, notes)
    VALUES (:member_id, NOW(), :method, :notes)
");
$stmt->execute([
    ':member_id' => $memberId,
    ':method'    => $method,
    ':notes'     => $body['notes'] ?? null,
]);

$attendanceId = $db->lastInsertId();

sendSuccess([
    'attendance_id' => (int)$attendanceId,
    'member_id'     => $memberId,
    'full_name'     => $member['full_name'],
    'avatar'        => $member['avatar'],
    'check_in'      => date('Y-m-d H:i:s'),
    'end_date'      => $member['end_date'],
], 'Check-in thành công', 201);
