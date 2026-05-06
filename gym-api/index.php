<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/helpers/response.php';

$route  = $_GET['route']  ?? '';
$action = $_GET['action'] ?? 'index';
$id     = $_GET['id']     ?? null;
$method = $_SERVER['REQUEST_METHOD'];

if ($route === 'auth') {
    $action = $_GET['action'] ?? 'login';
    $file   = __DIR__ . "/api/auth/{$action}.php";
    if (!file_exists($file)) sendError("Auth action không tồn tại: $action", 404);
    require $file;
    exit;
}

require_once __DIR__ . '/middleware/auth.php';
requireAuth();

$routes = [
    'members'    => __DIR__ . '/api/members/',
    'attendance' => __DIR__ . '/api/attendance/',
    'packages'   => __DIR__ . '/api/packages/',
    'payments'   => __DIR__ . '/api/payments/',
    'reports'    => __DIR__ . '/api/reports/',
    'faces'      => __DIR__ . '/api/faces/',
];

if (!array_key_exists($route, $routes)) {
    sendError('Route không tồn tại: ' . $route, 404);
}

$basePath = $routes[$route];

$fileMap = [
    'GET'    => [
        'index'   => 'index.php',
        'show'    => 'show.php',
        'summary' => 'summary.php',
        'daily'   => 'daily.php',
        'monthly' => 'monthly.php',
        'export'  => 'export.php',
    ],
    'POST'   => [
        'index'    => 'index.php',
        'create'   => 'create.php',
        'checkin'  => 'checkin.php',
        'checkout' => 'checkout.php',
        'register' => 'register.php',
    ],
    'PUT'    => ['update' => 'update.php'],
    'DELETE' => ['delete' => 'delete.php'],
];

$file = $fileMap[$method][$action] ?? null;
if (!$file) sendError("Không hỗ trợ $method $action", 405);

$fullPath = $basePath . $file;
if (!file_exists($fullPath)) sendError("Handler chưa được triển khai: $route/$file", 501);

require $fullPath;