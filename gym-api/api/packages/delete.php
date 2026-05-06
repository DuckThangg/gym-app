<?php
// ============================================================
//  FILE: gym-api/api/packages/delete.php
// ============================================================
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/response.php';

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) sendError('ID không hợp lệ', 422);

$db = getDB();

// Không cho xóa nếu còn hội viên đang dùng
$inUse = $db->prepare("SELECT COUNT(*) FROM members WHERE package_id = :id AND status = 'active'");
$inUse->execute([':id' => $id]);
if ((int)$inUse->fetchColumn() > 0) {
    sendError('Không thể xóa gói đang có hội viên sử dụng. Hãy ẩn gói thay vì xóa.', 409);
}

$stmt = $db->prepare("DELETE FROM packages WHERE id = :id");
$stmt->execute([':id' => $id]);

sendSuccess(null, 'Đã xóa gói tập');
