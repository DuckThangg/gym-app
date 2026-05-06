<?php
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;

if ($_SERVER['REQUEST_METHOD'] !== 'GET') sendError('Chỉ hỗ trợ GET', 405);

$type  = $_GET['type']  ?? 'members';   // members | attendance | payments
$month = $_GET['month'] ?? date('Y-m');
$year  = (int)($_GET['year'] ?? date('Y'));

$db = getDB();

$spreadsheet = new Spreadsheet();
$spreadsheet->getProperties()
    ->setCreator('Gym Manager')
    ->setTitle('Báo cáo phòng gym');

// ── Style chung ───────────────────────────────────────────
$headerStyle = [
    'font'      => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 11],
    'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '15803D']],
    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
    'borders'   => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'FFFFFF']]],
];

$rowStyle = [
    'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'DDDDDD']]],
    'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
];

$titleStyle = [
    'font'      => ['bold' => true, 'size' => 14, 'color' => ['rgb' => '14532D']],
    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
];

// ── Xuất theo loại ────────────────────────────────────────
if ($type === 'members') {
    $sheet = $spreadsheet->getActiveSheet();
    $sheet->setTitle('Danh sách hội viên');

    // Tiêu đề
    $sheet->mergeCells('A1:H1');
    $sheet->setCellValue('A1', 'DANH SÁCH HỘI VIÊN - ' . date('d/m/Y'));
    $sheet->getStyle('A1')->applyFromArray($titleStyle);
    $sheet->getRowDimension(1)->setRowHeight(30);

    // Header
    $headers = ['STT', 'Họ và tên', 'Số điện thoại', 'Gói tập', 'Ngày bắt đầu', 'Ngày hết hạn', 'Còn lại (ngày)', 'Trạng thái'];
    foreach ($headers as $i => $h) {
        $col = chr(65 + $i);
        $sheet->setCellValue($col . '2', $h);
    }
    $sheet->getStyle('A2:H2')->applyFromArray($headerStyle);
    $sheet->getRowDimension(2)->setRowHeight(22);

    // Data
    $stmt = $db->query("
        SELECT m.full_name, m.phone, p.name AS package_name,
               m.start_date, m.end_date,
               DATEDIFF(m.end_date, CURDATE()) AS days_remaining,
               m.status
        FROM members m
        LEFT JOIN packages p ON m.package_id = p.id
        ORDER BY m.full_name ASC
    ");
    $members = $stmt->fetchAll();

    $row = 3;
    foreach ($members as $i => $m) {
        $sheet->setCellValue('A' . $row, $i + 1);
        $sheet->setCellValue('B' . $row, $m['full_name']);
        $sheet->setCellValue('C' . $row, $m['phone']);
        $sheet->setCellValue('D' . $row, $m['package_name'] ?? '—');
        $sheet->setCellValue('E' . $row, $m['start_date'] ? date('d/m/Y', strtotime($m['start_date'])) : '—');
        $sheet->setCellValue('F' . $row, $m['end_date']   ? date('d/m/Y', strtotime($m['end_date']))   : '—');
        $sheet->setCellValue('G' . $row, $m['days_remaining'] ?? '—');
        $sheet->setCellValue('H' . $row, match($m['status']) {
            'active'    => 'Còn hạn',
            'expired'   => 'Hết hạn',
            'suspended' => 'Tạm khóa',
            default     => $m['status'],
        });

        // Màu nền xen kẽ
        if ($i % 2 === 0) {
            $sheet->getStyle("A{$row}:H{$row}")
                  ->getFill()->setFillType(Fill::FILL_SOLID)
                  ->getStartColor()->setRGB('F0FDF4');
        }

        // Màu đỏ nếu hết hạn
        if ($m['status'] === 'expired') {
            $sheet->getStyle("A{$row}:H{$row}")
                  ->getFont()->getColor()->setRGB('DC2626');
        }

        $sheet->getStyle("A{$row}:H{$row}")->applyFromArray($rowStyle);
        $sheet->getRowDimension($row)->setRowHeight(18);
        $row++;
    }

    // Căn chỉnh cột
    $sheet->getColumnDimension('A')->setWidth(6);
    $sheet->getColumnDimension('B')->setWidth(25);
    $sheet->getColumnDimension('C')->setWidth(16);
    $sheet->getColumnDimension('D')->setWidth(18);
    $sheet->getColumnDimension('E')->setWidth(14);
    $sheet->getColumnDimension('F')->setWidth(14);
    $sheet->getColumnDimension('G')->setWidth(16);
    $sheet->getColumnDimension('H')->setWidth(14);

    $filename = 'danh-sach-hoi-vien-' . date('d-m-Y') . '.xlsx';

} elseif ($type === 'attendance') {
    $sheet = $spreadsheet->getActiveSheet();
    $sheet->setTitle('Điểm danh');

    $sheet->mergeCells('A1:G1');
    $sheet->setCellValue('A1', 'LỊCH SỬ ĐIỂM DANH - THÁNG ' . $month);
    $sheet->getStyle('A1')->applyFromArray($titleStyle);
    $sheet->getRowDimension(1)->setRowHeight(30);

    $headers = ['STT', 'Họ và tên', 'Số điện thoại', 'Giờ vào', 'Giờ ra', 'Thời gian (phút)', 'Phương thức'];
    foreach ($headers as $i => $h) {
        $sheet->setCellValue(chr(65 + $i) . '2', $h);
    }
    $sheet->getStyle('A2:G2')->applyFromArray($headerStyle);
    $sheet->getRowDimension(2)->setRowHeight(22);

    $stmt = $db->prepare("
        SELECT m.full_name, m.phone,
               a.check_in, a.check_out, a.method,
               TIMESTAMPDIFF(MINUTE, a.check_in, IFNULL(a.check_out, NOW())) AS duration
        FROM attendance a
        JOIN members m ON a.member_id = m.id
        WHERE DATE_FORMAT(a.check_in, '%Y-%m') = :month
        ORDER BY a.check_in DESC
    ");
    $stmt->execute([':month' => $month]);
    $records = $stmt->fetchAll();

    $row = 3;
    foreach ($records as $i => $r) {
        $sheet->setCellValue('A' . $row, $i + 1);
        $sheet->setCellValue('B' . $row, $r['full_name']);
        $sheet->setCellValue('C' . $row, $r['phone']);
        $sheet->setCellValue('D' . $row, $r['check_in']  ? date('d/m/Y H:i', strtotime($r['check_in']))  : '—');
        $sheet->setCellValue('E' . $row, $r['check_out'] ? date('d/m/Y H:i', strtotime($r['check_out'])) : 'Đang ở');
        $sheet->setCellValue('F' . $row, $r['duration'] ?? '—');
        $sheet->setCellValue('G' . $row, $r['method'] === 'face' ? 'Nhận diện khuôn mặt' : 'Thủ công');

        if ($i % 2 === 0) {
            $sheet->getStyle("A{$row}:G{$row}")
                  ->getFill()->setFillType(Fill::FILL_SOLID)
                  ->getStartColor()->setRGB('F0FDF4');
        }
        $sheet->getStyle("A{$row}:G{$row}")->applyFromArray($rowStyle);
        $sheet->getRowDimension($row)->setRowHeight(18);
        $row++;
    }

    $sheet->getColumnDimension('A')->setWidth(6);
    $sheet->getColumnDimension('B')->setWidth(25);
    $sheet->getColumnDimension('C')->setWidth(16);
    $sheet->getColumnDimension('D')->setWidth(18);
    $sheet->getColumnDimension('E')->setWidth(18);
    $sheet->getColumnDimension('F')->setWidth(18);
    $sheet->getColumnDimension('G')->setWidth(22);

    $filename = 'diem-danh-' . $month . '.xlsx';

} elseif ($type === 'payments') {
    $sheet = $spreadsheet->getActiveSheet();
    $sheet->setTitle('Thanh toán');

    $sheet->mergeCells('A1:H1');
    $sheet->setCellValue('A1', 'BÁO CÁO DOANH THU - THÁNG ' . $month);
    $sheet->getStyle('A1')->applyFromArray($titleStyle);
    $sheet->getRowDimension(1)->setRowHeight(30);

    $headers = ['STT', 'Họ và tên', 'Số điện thoại', 'Gói tập', 'Số tiền', 'Giảm giá', 'Phương thức', 'Ngày thu'];
    foreach ($headers as $i => $h) {
        $sheet->setCellValue(chr(65 + $i) . '2', $h);
    }
    $sheet->getStyle('A2:H2')->applyFromArray($headerStyle);
    $sheet->getRowDimension(2)->setRowHeight(22);

    $stmt = $db->prepare("
        SELECT m.full_name, m.phone, p.name AS package_name,
               pay.amount, pay.discount, pay.payment_method, pay.payment_date
        FROM payments pay
        JOIN members  m ON pay.member_id  = m.id
        JOIN packages p ON pay.package_id = p.id
        WHERE DATE_FORMAT(pay.payment_date, '%Y-%m') = :month
        ORDER BY pay.payment_date DESC
    ");
    $stmt->execute([':month' => $month]);
    $payments = $stmt->fetchAll();

    $row = 3;
    $totalAmount = 0;
    foreach ($payments as $i => $p) {
        $sheet->setCellValue('A' . $row, $i + 1);
        $sheet->setCellValue('B' . $row, $p['full_name']);
        $sheet->setCellValue('C' . $row, $p['phone']);
        $sheet->setCellValue('D' . $row, $p['package_name']);
        $sheet->setCellValue('E' . $row, number_format($p['amount'], 0, ',', '.') . ' ₫');
        $sheet->setCellValue('F' . $row, $p['discount'] > 0 ? number_format($p['discount'], 0, ',', '.') . ' ₫' : '—');
        $sheet->setCellValue('G' . $row, match($p['payment_method']) {
            'cash'     => 'Tiền mặt',
            'transfer' => 'Chuyển khoản',
            default    => 'Khác',
        });
        $sheet->setCellValue('H' . $row, date('d/m/Y', strtotime($p['payment_date'])));

        if ($i % 2 === 0) {
            $sheet->getStyle("A{$row}:H{$row}")
                  ->getFill()->setFillType(Fill::FILL_SOLID)
                  ->getStartColor()->setRGB('F0FDF4');
        }
        $sheet->getStyle("A{$row}:H{$row}")->applyFromArray($rowStyle);
        $sheet->getRowDimension($row)->setRowHeight(18);
        $totalAmount += $p['amount'];
        $row++;
    }

    // Dòng tổng cộng
    $sheet->setCellValue('D' . $row, 'TỔNG CỘNG');
    $sheet->setCellValue('E' . $row, number_format($totalAmount, 0, ',', '.') . ' ₫');
    $sheet->getStyle("A{$row}:H{$row}")->applyFromArray([
        'font' => ['bold' => true],
        'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'DCFCE7']],
    ]);

    $sheet->getColumnDimension('A')->setWidth(6);
    $sheet->getColumnDimension('B')->setWidth(25);
    $sheet->getColumnDimension('C')->setWidth(16);
    $sheet->getColumnDimension('D')->setWidth(18);
    $sheet->getColumnDimension('E')->setWidth(16);
    $sheet->getColumnDimension('F')->setWidth(14);
    $sheet->getColumnDimension('G')->setWidth(16);
    $sheet->getColumnDimension('H')->setWidth(14);

    $filename = 'doanh-thu-' . $month . '.xlsx';
}

// ── Xuất file ─────────────────────────────────────────────
// Xóa output buffer để tránh lỗi file Excel bị hỏng
while (ob_get_level()) ob_end_clean();

header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Cache-Control: max-age=0');

$writer = new Xlsx($spreadsheet);
$writer->save('php://output');
exit;