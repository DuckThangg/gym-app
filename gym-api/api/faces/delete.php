<?php
// ============================================================
//  FILE: gym-api/api/faces/delete.php
//  DELETE ?route=faces&action=delete&id={member_id}
// ============================================================
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') sendError('Chỉ hỗ trợ DELETE', 405);

$memberId = (int)($_GET['id'] ?? 0);
if ($memberId <= 0) sendError('ID không hợp lệ', 422);

$db = getDB();

$check = $db->prepare("SELECT face_image FROM member_faces WHERE member_id = :id");
$check->execute([':id' => $memberId]);
$face = $check->fetch();
if (!$face) sendNotFound('Không tìm thấy dữ liệu khuôn mặt');

// Xóa file ảnh nếu có
if (!empty($face['face_image'])) {
    $imgPath = __DIR__ . '/../../uploads/faces/' . basename($face['face_image']);
    if (file_exists($imgPath)) unlink($imgPath);
}

$stmt = $db->prepare("DELETE FROM member_faces WHERE member_id = :id");
$stmt->execute([':id' => $memberId]);

// Xóa avatar hội viên
$db->prepare("UPDATE members SET avatar = NULL WHERE id = :id")->execute([':id' => $memberId]);

sendSuccess(null, 'Đã xóa dữ liệu khuôn mặt');
