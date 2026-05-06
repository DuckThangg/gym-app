<?php
// ============================================================
//  FILE: gym-api/api/faces/register.php
//  POST → Lưu encoding khuôn mặt từ Python service vào DB
// ============================================================
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') sendError('Chỉ hỗ trợ POST', 405);

$db   = getDB();
$body = getRequestBody();
requireFields($body, ['member_id', 'face_encoding']);

$memberId = (int)$body['member_id'];

// Kiểm tra hội viên tồn tại
$check = $db->prepare("SELECT id FROM members WHERE id = :id");
$check->execute([':id' => $memberId]);
if (!$check->fetch()) sendNotFound('Không tìm thấy hội viên');

// Upsert: nếu đã có thì cập nhật, chưa có thì thêm mới
$stmt = $db->prepare("
    INSERT INTO member_faces (member_id, face_encoding, face_image)
    VALUES (:member_id, :encoding, :image)
    ON DUPLICATE KEY UPDATE
        face_encoding = VALUES(face_encoding),
        face_image    = VALUES(face_image)
");
$stmt->execute([
    ':member_id' => $memberId,
    ':encoding'  => $body['face_encoding'],
    ':image'     => $body['face_image'] ?? null,
]);

// Cập nhật avatar hội viên nếu có ảnh
if (!empty($body['face_image'])) {
    $updStmt = $db->prepare("UPDATE members SET avatar = :avatar WHERE id = :id");
    $updStmt->execute([':avatar' => $body['face_image'], ':id' => $memberId]);
}

sendSuccess(null, 'Đăng ký khuôn mặt thành công', 201);
