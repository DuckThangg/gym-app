<?php
// ============================================================
//  FILE: gym-api/api/members/delete.php
//  DELETE ?route=members&action=delete&id=1
// ============================================================

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    sendError('Chỉ hỗ trợ DELETE', 405);
}

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) sendError('ID không hợp lệ', 422);

$db = getDB();

// Kiểm tra tồn tại
$check = $db->prepare("SELECT id, avatar FROM members WHERE id = :id");
$check->execute([':id' => $id]);
$member = $check->fetch();
if (!$member) sendNotFound('Không tìm thấy hội viên');

// Xóa ảnh avatar nếu có
if (!empty($member['avatar'])) {
    $avatarPath = __DIR__ . '/../../uploads/faces/' . basename($member['avatar']);
    if (file_exists($avatarPath)) {
        unlink($avatarPath);
    }
}

// Xóa hội viên (cascade sẽ tự xóa faces, attendance, payments, notifications)
$stmt = $db->prepare("DELETE FROM members WHERE id = :id");
$stmt->execute([':id' => $id]);

sendSuccess(null, 'Đã xóa hội viên thành công');
