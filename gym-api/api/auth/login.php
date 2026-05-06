<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/response.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') sendError('Chỉ hỗ trợ POST', 405);

$body = getRequestBody();
requireFields($body, ['username', 'password']);

$db   = getDB();
$stmt = $db->prepare("SELECT * FROM users WHERE username = :username LIMIT 1");
$stmt->execute([':username' => trim($body['username'])]);
$user = $stmt->fetch();

if (!$user || $user['password'] !== $body['password']) {
    sendError('Tên đăng nhập hoặc mật khẩu không đúng', 401);
}

// Lưu thông tin vào session
$_SESSION['user_id']   = $user['id'];
$_SESSION['username']  = $user['username'];
$_SESSION['full_name'] = $user['full_name'];

sendSuccess([
    'full_name' => $user['full_name'],
    'username'  => $user['username'],
], 'Đăng nhập thành công');