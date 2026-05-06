<?php
// ============================================================
//  FILE: gym-api/api/payments/create.php
//  POST → Tạo thanh toán + gia hạn gói cho hội viên
// ============================================================
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/response.php';

$db   = getDB();
$body = getRequestBody();
requireFields($body, ['member_id', 'package_id', 'amount']);

$memberId  = (int)$body['member_id'];
$packageId = (int)$body['package_id'];

// Lấy thông tin gói tập
$pkgStmt = $db->prepare("SELECT * FROM packages WHERE id = :id AND is_active = 1");
$pkgStmt->execute([':id' => $packageId]);
$package = $pkgStmt->fetch();
if (!$package) sendNotFound('Không tìm thấy gói tập');

// Tính ngày bắt đầu / kết thúc
$startDate = $body['start_date'] ?? date('Y-m-d');
$endDate   = date('Y-m-d', strtotime($startDate . ' +' . $package['duration_days'] . ' days'));

// Ghi thanh toán
$payStmt = $db->prepare("
    INSERT INTO payments
        (member_id, package_id, amount, discount, payment_date,
         payment_method, start_date, end_date, notes)
    VALUES
        (:member_id, :pkg, :amount, :discount, :pay_date,
         :method, :start, :end, :notes)
");
$payStmt->execute([
    ':member_id' => $memberId,
    ':pkg'       => $packageId,
    ':amount'    => (int)$body['amount'],
    ':discount'  => (int)($body['discount'] ?? 0),
    ':pay_date'  => $body['payment_date']   ?? date('Y-m-d'),
    ':method'    => $body['payment_method'] ?? 'cash',
    ':start'     => $startDate,
    ':end'       => $endDate,
    ':notes'     => $body['notes']          ?? null,
]);

// Cập nhật hội viên
$updStmt = $db->prepare("
    UPDATE members SET
        package_id = :pkg,
        start_date = :start,
        end_date   = :end,
        status     = 'active',
        updated_at = NOW()
    WHERE id = :id
");
$updStmt->execute([
    ':pkg'   => $packageId,
    ':start' => $startDate,
    ':end'   => $endDate,
    ':id'    => $memberId,
]);

// Ghi notification
$notifStmt = $db->prepare("
    INSERT INTO notifications (member_id, type, message)
    VALUES (:id, 'payment_received', :msg)
");
$notifStmt->execute([
    ':id'  => $memberId,
    ':msg' => "Thanh toán {$package['name']} thành công. Hạn đến: $endDate",
]);

sendSuccess([
    'payment_id' => (int)$db->lastInsertId(),
    'start_date' => $startDate,
    'end_date'   => $endDate,
], 'Thanh toán thành công', 201);
