# DATN FE QLBH – POS Frontend

Ứng dụng bán hàng (POS) cho đồ án tốt nghiệp, được xây dựng bằng React + Vite. Tài liệu này giúp bạn hiểu toàn bộ dự án: kiến trúc, cách cài đặt, cấu trúc thư mục, cách kết nối backend, cũng như danh sách API hoàn chỉnh.

---

## 1. Công nghệ sử dụng

| Thành phần          | Công nghệ                                                       |
|---------------------|-----------------------------------------------------------------|
| UI                  | React 18 + Vite (HMR, build nhanh)                              |
| Routing             | React Router v6                                                 |
| State/Context       | Context API (Theme, Auth), local hooks                          |
| HTTP Client         | Axios                                                           |
| UI Kit              | Bootstrap 5 + custom component                                  |
| i18n                | i18next                                                         |
| Tooling             | ESLint, npm scripts                                             |

POS hỗ trợ nhiều tab hoá đơn, tìm kiếm sản phẩm, quét barcode, giảm giá item/hoá đơn, ghi chú, in hoá đơn, quản lý khách hàng, nhân sự, nhà cung cấp, nhập hàng…

---

## 2. Chuẩn bị môi trường

- Node.js 18 trở lên
- npm 9 trở lên (hoặc pnpm/yarn)
- Backend REST chạy cùng mạng (xem API phía dưới)

---

## 3. Cài đặt & chạy

```bash
git clone <repo-url> DATN_FE_QLBH_FE
cd DATN_FE_QLBH_FE
npm install
npm run dev          # http://localhost:5173
```

Các script khác:

```bash
npm run build        # build production
npm run preview      # chạy thử sau build
npm run lint         # kiểm tra ESLint
```

### 3.1 Cấu hình kết nối backend

File `src/services/api.js` chứa `API_BASE_URL`:

```js
export const API_BASE_URL = "http://192.168.1.208:8080/api";
```

- Sửa giá trị này để trỏ vào môi trường BE bạn muốn.
- Token đăng nhập được lưu trong `localStorage` với key `accessToken`. Axios tự động đọc token khi gọi API.

### 3.2 FE ↔ BE hoạt động thế nào?

1. Người dùng đăng nhập (`/auth/login`) → lưu token.
2. Các trang protected nằm trong `ProtectedRoute`, chỉ render khi token hợp lệ.
3. Trang POS (`SalesPage`) khởi chạy:
   - `GET /order/drafts/me`: lấy danh sách draft của thu ngân → mỗi tab tương ứng 1 draft, chứa `items`, `customerId`, `paymentMethod`, `invoiceDiscount`, `orderNote`.
   - `GET /customer`: cache danh sách khách để map `customerId` → `selectedCustomer`.
4. Người dùng chỉnh dữ liệu → FE cập nhật state tab hiện tại. Một effect debounce (600 ms) gọi `PUT /order/draft` **chỉ khi dữ liệu khác snapshot** nên tránh spam.
5. Lưu đơn tạm (`PUT /order/pending`), xoá draft (`DELETE /order/draft/{id}`) hay thanh toán → FE reset tab tương ứng.
6. Khi quay lại trang (focus/visibility), `loadDraftTabs` chạy lại để đảm bảo dữ liệu luôn mới nhất.

---

## 4. Cấu trúc thư mục

```
src/
 ├─ components/        # Các block UI dùng lại (sale cart, modal, filter…)
 ├─ pages/             # Màn hình chính (SalesPage, CustomerPage, ImportPage…)
 ├─ layouts/           # MainLayout, Header, Sidebar…
 ├─ context/           # ThemeContext, Auth utilities
 ├─ services/api.js    # Cấu hình base URL
 ├─ utils/             # Helper (formatter, export Excel…)
 └─ assets/            # Logo, hình ảnh
```

`SalesPage.jsx` là phần phức tạp nhất (quản lý draft/tabs, auto sync). Các trang khác (Customer, Staff, Supplier, Import, Finance, Product…) cung cấp CRUD cơ bản cho từng module.

---

## 5. Danh sách API

> **Lưu ý:** FE kỳ vọng draft trả kèm `orderItemDTOs`, `orderNote`, `customerId`, `invoiceDiscount`, `paymentMethod`. Nếu backend trả thiếu, POS không thể khôi phục chính xác.

### 5.1 Auth & Nhân sự

| Endpoint                         | Method | Mô tả                                 |
|----------------------------------|--------|---------------------------------------|
| `/auth/login`                    | POST   | Đăng nhập, trả token                  |
| `/auth/users/me`                 | GET    | Lấy thông tin người dùng hiện tại     |
| `/auth/users/me`                 | PUT    | Cập nhật thông tin cá nhân            |
| `/auth/users/all`                | GET    | Danh sách nhân viên (StaffPage)       |
| `/auth/users/create` *(tùy BE)*  | POST   | Tạo nhân viên                         |
| `/auth/users/{id}`               | DELETE | Xoá nhân viên                         |

### 5.2 Khách hàng

| Endpoint                     | Method | Mô tả                        |
|------------------------------|--------|------------------------------|
| `/customer`                  | GET    | Danh sách khách hàng         |
| `/customer`                  | POST   | Thêm khách                   |
| `/customer/{id}`             | PUT    | Sửa khách                    |
| `/customer/{id}`             | DELETE | Xoá khách                    |

### 5.3 Sản phẩm & tồn kho

| Endpoint                                   | Method | Ghi chú                                   |
|--------------------------------------------|--------|-------------------------------------------|
| `/inventory/products`                      | GET    | Danh sách sản phẩm POS                    |
| `/inventory/products`                      | POST   | Thêm sản phẩm mới                         |
| `/inventory/products/{segment}` + body     | PUT    | Cập nhật giá/thuộc tính (SetPrice)        |
| `/inventory/category` / `/inventory/brand` | GET    | Danh mục, thương hiệu                     |
| `/inventory/category` / `/inventory/brand` | POST   | Thêm danh mục/thương hiệu                 |
| `/inventory/supplier`                      | GET    | Danh sách nhà cung cấp                    |
| `/inventory/supplier`                      | POST   | Thêm nhà cung cấp                         |
| `/inventory/supplier/{id}`                 | DELETE | Xoá nhà cung cấp                          |
| `/inventory/import-product`                | GET    | Danh sách phiếu nhập                      |
| `/inventory/import-product`                | POST   | Tạo phiếu nhập                            |

### 5.4 Draft / Order

| Endpoint                  | Method | Mô tả                                                                 |
|---------------------------|--------|------------------------------------------------------------------------|
| `/order/drafts/me`        | GET    | Lấy danh sách draft của thu ngân đang đăng nhập                       |
| `/order/draft`            | POST   | Tạo draft mới (server trả `orderId`)                                   |
| `/order/draft`            | PUT    | Cập nhật draft (`orderId`, `orderItemDTOs`, `customerId`, `orderNote`, `paymentMethod`, `invoiceDiscount`) |
| `/order/draft/{orderId}`  | DELETE | Xoá draft                                                              |
| `/order/pending`          | PUT    | Lưu đơn pending (giữ nguyên trạng thái trên server)                    |

### 5.5 Các API khác

- `/finance/...` – trang FinancePage.
- `/home/analytics/...` – Dashboard/ HomePage.
- Các component “add” trong thư mục `components/**` cũng gọi API tương ứng đã liệt kê.

Để liệt kê toàn bộ endpoint thực tế, có thể chạy `rg "API_BASE_URL" -n` trong project.

---

## 6. Các điểm cần nhớ khi phát triển

1. **i18n**: tất cả text hiển thị phải dùng `t("key", { defaultValue })`.
2. **State tab độc lập**: mỗi tab có `items`, `orderNote`, `customerId`, `paymentMethod`, `invoiceDiscount` riêng. Không share state toàn cục.
3. **Auto-sync**: Debounce 600ms; chỉ PUT `/order/draft` khi dữ liệu khác snapshot để tránh 403/Spam.
4. **Khôi phục dữ liệu**: khi FE nhận `customerId`, effect sẽ tìm trong cache `customers` để hiển thị lại khách đã chọn. Nếu backend không trả `customerId` hoặc `orderItemDTOs`, UI sẽ trống.
5. **Note & Order Note**: BE cần trả `orderItemDTOs[].note` và `orderNote` nếu muốn hiển thị lại; FE đã đọc sẵn.

---

## 7. Quy trình đóng góp

1. Fork hoặc tạo branch mới.
2. Thực hiện thay đổi trong `src/`.
3. `npm run lint` trước khi mở PR.
4. Khi thêm endpoint mới, cập nhật README (mục API) để người khác dễ theo dõi.

---

Chúc bạn triển khai hệ thống POS DATN thành công! Nếu cần thêm tài liệu (mock data/Postman collection), hãy bổ sung vào repo hoặc mở issue mới. 🚀
