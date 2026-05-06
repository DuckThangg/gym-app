<?php
// ============================================================
//  FILE: gym-api/api/packages/create.php
// ============================================================
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/response.php';

$db   = getDB();
$body = getRequestBody();
requireFields($body, ['name', 'duration_days', 'price']);

$stmt = $db->prepare("
    INSERT INTO packages (name, duration_days, price, description, is_active)
    VALUES (:name, :days, :price, :desc, :active)
");
$stmt->execute([
    ':name'   => trim($body['name']),
    ':days'   => (int)$body['duration_days'],
    ':price'  => (int)$body['price'],
    ':desc'   => $body['description'] ?? null,
    ':active' => isset($body['is_active']) ? (int)$body['is_active'] : 1,
]);

sendSuccess(['id' => (int)$db->lastInsertId()], 'Tạo gói tập thành công', 201);
