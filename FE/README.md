# DATN FE QLBH – POS Frontend

Giao diện bán hàng cho đồ án tốt nghiệp (DATN). Ứng dụng cung cấp màn hình POS đa hoá đơn với khả năng quản lý khách, sản phẩm, đơn hàng tạm và đồng bộ các dữ liệu với backend thông qua hệ thống REST API hiện có.

## Kiến trúc & công nghệ

- [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) (HMR, bundling siêu nhanh)
- React Router v6 cho điều hướng
- Context API cho theme và bảo vệ route
- Axios cho kết nối REST
- Bootstrap 5 + custom components cho UI
- i18next cho đa ngôn ngữ

## Các tính năng nổi bật

- **Đăng nhập & bảo vệ route** thông qua token lưu trong `localStorage`.
- **Trang bán hàng (POS)** với nhiều tab hoá đơn, tìm kiếm sản phẩm, quét barcode, giảm giá từng item/hoá đơn, quản lý ghi chú, in hoá đơn.
- **Đồng bộ hoá đơn tạm (draft)**: tự động lấy danh sách draft của thu ngân, cập nhật draft theo từng tab, và giữ trạng thái item/khách/ghi chú sau khi điều hướng.
- **Quản lý khách hàng**: thêm/sửa/xoá, đồng bộ khách vào POS.
- **Các module bổ trợ**: quản lý sản phẩm, nhân sự, nhà cung cấp, phiếu nhập, báo cáo… (từ các trang khác trong thư mục `src/pages`). 

## Kết nối API backend

Backend được cấu hình thông qua `src/services/api.js`:

```js
export const API_BASE_URL = "http://192.168.1.208:8080/api";
```

Thay đổi giá trị này để trỏ vào môi trường mong muốn (thấp nhất cần các endpoint dưới đây):

| Chức năng                        | Endpoint                                    | Phương thức |
|----------------------------------|---------------------------------------------|-------------|
| Đăng nhập                        | `/auth/login` *(tuỳ backend)*               | `POST`      |
| Lấy sản phẩm POS                 | `/inventory/products`                       | `GET`       |
| Lấy danh sách draft của thu ngân| `/order/drafts/me`                          | `GET`       |
| Tạo draft mới                    | `/order/draft`                              | `POST`      |
| Đồng bộ draft                    | `/order/draft`                              | `PUT`       |
| Xoá draft                        | `/order/draft/{orderId}`                    | `DELETE`    |
| Lưu đơn tạm (pending)            | `/order/pending`                            | `PUT`       |
| Quản lý khách hàng               | `/customer` (GET/POST/PUT/DELETE)           |             |

> **Lưu ý:** frontend mong đợi các draft trả `orderItemDTOs`, `customerId`, `invoiceDiscount`, `orderNote`, `paymentMethod`. Nếu backend trả thiếu, giao diện sẽ không khôi phục đầy đủ dữ liệu.

## Cài đặt & chạy dự án

### 1. Yêu cầu

- Node.js 18+
- npm 9+ (hoặc pnpm/yarn, tuỳ bạn chọn)

### 2. Clone & cài đặt

```bash
git clone <repo-url> DATN_FE_QLBH_FE
cd DATN_FE_QLBH_FE
npm install
```

### 3. Biến môi trường

- Sao chép `.env.example` (nếu có) sang `.env`.
- Hoặc sửa trực tiếp `src/services/api.js` để thay endpoint.
- Token truy cập hiện được lưu trong `localStorage` (`accessToken`).

### 4. Chạy dự án

```bash
npm run dev              # chạy development server (mặc định http://localhost:5173)
npm run build            # build production
npm run preview          # chạy preview sau khi build
npm run lint             # kiểm tra ESLint
```

## Cấu trúc thư mục chính

```
src/
 ├─ components/        # component chia nhỏ (sale cart, layout, modal, ...)
 ├─ pages/             # từng màn hình (SalesPage, CustomerPage, ...)
 ├─ services/api.js    # cấu hình base URL
 ├─ context/           # ThemeContext, Auth context
 ├─ layouts/           # layout chính
 └─ utils/             # helper (formatCurrency, export Excel,...)
```

## Quy ước & best-practice

- Sử dụng `i18next` cho mọi text hiển thị (`t("key", { defaultValue })`).
- Không chia sẻ state giữa các tab POS: mỗi tab lưu `items`, `customerId`, `paymentMethod`, `invoiceDiscount` riêng.
- Auto-sync draft debounce 600ms; tránh gọi khi không thay đổi dữ liệu (snapshot trong `draftSnapshotRef`).
- Khi BE thiếu dữ liệu, cần cập nhật API trước khi expect UI hiển thị đúng.

## Đóng góp / phát triển tiếp

1. Fork repo (hoặc tạo branch mới).
2. Làm việc trong `src/` – dùng `npm run lint` trước khi mở PR.
3. Mọi bug liên quan đến dữ liệu nên kiểm tra cả BE vì FE phụ thuộc chặt vào JSON trả về.

---
Nếu bạn cần thêm thông tin (mock data, postman collection, tài liệu BE,...), hãy cập nhật README này hoặc tạo issue mới. Chúc bạn triển khai thành công hệ thống POS DATN! 🚀
