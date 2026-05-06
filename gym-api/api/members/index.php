<?php
// ============================================================
//  FILE: gym-api/api/members/index.php
//  GET  → Lấy danh sách hội viên (có filter, search, phân trang)
//  POST → Tạo hội viên mới
// ============================================================

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/response.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// ── GET: Danh sách hội viên ──────────────────────────────────
if ($method === 'GET') {
    $search  = $_GET['search']  ?? '';
    $status  = $_GET['status']  ?? '';
    $page    = max(1, (int)($_GET['page']  ?? 1));
    $limit   = min(100, max(1, (int)($_GET['limit'] ?? 20)));
    $offset  = ($page - 1) * $limit;

    $where  = ['1=1'];
    $params = [];

    if ($search !== '') {
        $where[]  = '(m.full_name LIKE :search OR m.phone LIKE :search)';
        $params[':search'] = '%' . $search . '%';
    }

    if (in_array($status, ['active', 'expired', 'suspended'])) {
        $where[]          = 'm.status = :status';
        $params[':status'] = $status;
    }

    $whereSQL = implode(' AND ', $where);

    // Đếm tổng
    $countStmt = $db->prepare("SELECT COUNT(*) FROM members m WHERE $whereSQL");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    // Lấy dữ liệu
    $stmt = $db->prepare("
        SELECT
            m.id,
            m.full_name,
            m.phone,
            m.email,
            m.gender,
            m.avatar,
            m.status,
            m.start_date,
            m.end_date,
            m.notes,
            m.created_at,
            p.id   AS package_id,
            p.name AS package_name,
            DATEDIFF(m.end_date, CURDATE()) AS days_remaining
        FROM members m
        LEFT JOIN packages p ON m.package_id = p.id
        WHERE $whereSQL
        ORDER BY m.created_at DESC
        LIMIT :limit OFFSET :offset
    ");

    foreach ($params as $key => $val) {
        $stmt->bindValue($key, $val);
    }
    $stmt->bindValue(':limit',  $limit,  PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $members = $stmt->fetchAll();

    sendSuccess([
        'members'    => $members,
        'total'      => $total,
        'page'       => $page,
        'limit'      => $limit,
        'total_pages' => ceil($total / $limit),
    ]);
}

// ── POST: Tạo hội viên mới ───────────────────────────────────
if ($method === 'POST') {
    $body = getRequestBody();
    requireFields($body, ['full_name', 'phone']);

    // Kiểm tra SĐT trùng
    $check = $db->prepare("SELECT id FROM members WHERE phone = :phone");
    $check->execute([':phone' => $body['phone']]);
    if ($check->fetch()) {
        sendError('Số điện thoại đã tồn tại trong hệ thống', 409);
    }

    $stmt = $db->prepare("
        INSERT INTO members
            (full_name, phone, email, gender, date_of_birth, address,
             package_id, start_date, end_date, status, notes)
        VALUES
            (:full_name, :phone, :email, :gender, :dob, :address,
             :package_id, :start_date, :end_date, :status, :notes)
    ");

    $stmt->execute([
        ':full_name'   => trim($body['full_name']),
        ':phone'       => trim($body['phone']),
        ':email'       => $body['email']        ?? null,
        ':gender'      => $body['gender']       ?? 'male',
        ':dob'         => $body['date_of_birth'] ?? null,
        ':address'     => $body['address']      ?? null,
        ':package_id'  => $body['package_id']   ?? null,
        ':start_date'  => $body['start_date']   ?? null,
        ':end_date'    => $body['end_date']      ?? null,
        ':status'      => $body['status']        ?? 'active',
        ':notes'       => $body['notes']         ?? null,
    ]);

    $newId = $db->lastInsertId();

    // Ghi payment nếu có package
    if (!empty($body['package_id']) && !empty($body['amount'])) {
        $pay = $db->prepare("
            INSERT INTO payments
                (member_id, package_id, amount, discount, payment_date,
                 payment_method, start_date, end_date, notes)
            VALUES
                (:member_id, :pkg, :amount, :discount, CURDATE(),
                 :method, :start_date, :end_date, :notes)
        ");
        $pay->execute([
            ':member_id'  => $newId,
            ':pkg'        => $body['package_id'],
            ':amount'     => $body['amount'],
            ':discount'   => $body['discount']        ?? 0,
            ':method'     => $body['payment_method']  ?? 'cash',
            ':start_date' => $body['start_date']      ?? null,
            ':end_date'   => $body['end_date']        ?? null,
            ':notes'      => $body['payment_notes']   ?? null,
        ]);
    }

    sendSuccess(['id' => (int)$newId], 'Thêm hội viên thành công', 201);
}

sendError('Phương thức không được hỗ trợ', 405);
