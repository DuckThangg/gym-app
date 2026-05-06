<?php
// ============================================================
//  FILE: gym-api/api/members/update.php
//  PUT ?route=members&action=update&id=1
// ============================================================

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    sendError('Chỉ hỗ trợ PUT', 405);
}

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) sendError('ID không hợp lệ', 422);

$db   = getDB();
$body = getRequestBody();

// Kiểm tra hội viên tồn tại
$check = $db->prepare("SELECT id FROM members WHERE id = :id");
$check->execute([':id' => $id]);
if (!$check->fetch()) sendNotFound('Không tìm thấy hội viên');

// Kiểm tra SĐT trùng với người khác
if (!empty($body['phone'])) {
    $dupCheck = $db->prepare("SELECT id FROM members WHERE phone = :phone AND id != :id");
    $dupCheck->execute([':phone' => $body['phone'], ':id' => $id]);
    if ($dupCheck->fetch()) {
        sendError('Số điện thoại đã được dùng bởi hội viên khác', 409);
    }
}

$stmt = $db->prepare("
    UPDATE members SET
        full_name     = COALESCE(:full_name,    full_name),
        phone         = COALESCE(:phone,         phone),
        email         = :email,
        gender        = COALESCE(:gender,        gender),
        date_of_birth = :dob,
        address       = :address,
        package_id    = :package_id,
        start_date    = :start_date,
        end_date      = :end_date,
        status        = COALESCE(:status,        status),
        notes         = :notes,
        updated_at    = NOW()
    WHERE id = :id
");

$stmt->execute([
    ':full_name'  => $body['full_name']    ?? null,
    ':phone'      => $body['phone']        ?? null,
    ':email'      => $body['email']        ?? null,
    ':gender'     => $body['gender']       ?? null,
    ':dob'        => $body['date_of_birth'] ?? null,
    ':address'    => $body['address']      ?? null,
    ':package_id' => $body['package_id']   ?? null,
    ':start_date' => $body['start_date']   ?? null,
    ':end_date'   => $body['end_date']     ?? null,
    ':status'     => $body['status']       ?? null,
    ':notes'      => $body['notes']        ?? null,
    ':id'         => $id,
]);

sendSuccess(null, 'Cập nhật hội viên thành công');
