<?php
// ============================================================
//  FILE: gym-api/api/packages/update.php
// ============================================================
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/response.php';

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) sendError('ID không hợp lệ', 422);

$db   = getDB();
$body = getRequestBody();

$check = $db->prepare("SELECT id FROM packages WHERE id = :id");
$check->execute([':id' => $id]);
if (!$check->fetch()) sendNotFound('Không tìm thấy gói tập');

$stmt = $db->prepare("
    UPDATE packages SET
        name          = COALESCE(:name,  name),
        duration_days = COALESCE(:days,  duration_days),
        price         = COALESCE(:price, price),
        description   = :desc,
        is_active     = COALESCE(:active, is_active),
        updated_at    = NOW()
    WHERE id = :id
");
$stmt->execute([
    ':name'   => $body['name']          ?? null,
    ':days'   => isset($body['duration_days']) ? (int)$body['duration_days'] : null,
    ':price'  => isset($body['price'])  ? (int)$body['price'] : null,
    ':desc'   => $body['description']   ?? null,
    ':active' => isset($body['is_active']) ? (int)$body['is_active'] : null,
    ':id'     => $id,
]);

sendSuccess(null, 'Cập nhật gói tập thành công');
