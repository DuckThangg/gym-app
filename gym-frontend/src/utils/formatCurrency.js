export const fmtVND = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n ?? 0)

export const fmtNum = (n) =>
  new Intl.NumberFormat('vi-VN').format(n ?? 0)
