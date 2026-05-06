<?php
// ============================================================
//  FILE: gym-api/helpers/response.php
//  Mô tả: Chuẩn hóa toàn bộ JSON response trả về cho React
// ============================================================

function sendSuccess(mixed $data = null, string $message = 'Thành công', int $code = 200): void {
    http_response_code($code);
    echo json_encode([
        'success' => true,
        'message' => $message,
        'data'    => $data,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

function sendError(string $message = 'Có lỗi xảy ra', int $code = 400, mixed $errors = null): void {
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'message' => $message,
        'errors'  => $errors,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

function sendNotFound(string $message = 'Không tìm thấy'): void {
    sendError($message, 404);
}

function sendServerError(string $message = 'Lỗi server'): void {
    sendError($message, 500);
}

// Lấy body JSON từ request (POST/PUT)
function getRequestBody(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

// Validate các field bắt buộc
function requireFields(array $data, array $fields): void {
    $missing = [];
    foreach ($fields as $field) {
        if (empty($data[$field]) && $data[$field] !== '0') {
            $missing[] = $field;
        }
    }
    if (!empty($missing)) {
        sendError('Thiếu thông tin bắt buộc: ' . implode(', ', $missing), 422);
    }
}
