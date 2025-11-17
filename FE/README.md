# DATN FE QLBH – POS Frontend

Ứng dụng quản lý bán hàng chuyên cho **cửa hàng tạp hoá / văn phòng phẩm**. Mục tiêu là cung cấp cho thu ngân một POS đa hoá đơn, đồng thời hỗ trợ quản lý sản phẩm, khách hàng, nhà cung cấp, nhập hàng và nhân sự. Dự án xây dựng bằng React + Vite. README này mô tả đầy đủ kiến trúc, nghiệp vụ, cấu hình và API.

---

## 1. Nghiệp vụ chính

### 1.1 Bán lẻ tạp hoá/văn phòng phẩm
- Thu ngân có thể mở nhiều **hoá đơn tạm** song song (khách chờ thanh toán).
- Mỗi tab lưu riêng: danh sách mặt hàng (có barcode, đơn vị, giảm giá từng dòng), ghi chú, khách hàng, phương thức thanh toán, giảm giá hoá đơn.
- Hỗ trợ tìm nhanh sản phẩm theo tên, mã; quét barcode hoặc thêm thủ công.
- Cho phép ghi chú đơn hàng, ghi chú từng sản phẩm (nhu cầu bọc sách, đóng gói…).
- Với văn phòng phẩm, nhiều sản phẩm có **đơn vị khác nhau** (hộp, cái, bộ), hệ thống hiển thị rõ tồn kho.

### 1.2 Quản lý khách hàng
- Lưu thông tin khách mua sỉ, khách thân thiết (tên, số điện thoại, địa chỉ, email, giới tính).
- POS cho phép chọn khách đã có hoặc thêm nhanh khách mới ngay tại quầy.
- Danh sách khách đồng bộ với backend để tái sử dụng ở các hệ thống khác (CRM, báo cáo công nợ).

### 1.3 Nhà cung cấp – nhập hàng
- Theo dõi nhà cung cấp (cả cửa hàng tạp hoá và NPP văn phòng phẩm).
- Xử lý đơn nhập, nhập kho, đối chiếu tồn kho.

### 1.4 Nhân sự – phân quyền
- Quản lý danh sách nhân viên, phân quyền truy cập cho thu ngân, quản lý cửa hàng…

### 1.5 Thiết kế hướng đến thực tế cửa hàng nhỏ
- **Chốt đơn linh hoạt**: các phương thức thanh toán “Tiền mặt / Chuyển khoản / Quét mã QR”.
- **Theo dõi tồn kho**: thông tin giá vốn, giá bán, số lượng thực tế.
- **Tự động phục hồi hoá đơn**: khi tạm thời chuyển sang màn hình khác hoặc log out, quay lại vẫn có các draft trước đó.
- **In hoá đơn** dạng PDF/A4 (có thể tùy chỉnh để in mini POS).

## 2. Công nghệ sử dụng

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

## 3. Chuẩn bị môi trường

- Node.js 18 trở lên
- npm 9 trở lên (hoặc pnpm/yarn)
- Backend REST chạy cùng mạng (xem API phía dưới)

---

## 4. Cài đặt & chạy

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

### 4.1 Cấu hình kết nối backend

File `src/services/api.js` chứa `API_BASE_URL`:

```js
export const API_BASE_URL = "http://192.168.1.208:8080/api";
```

- Sửa giá trị này để trỏ vào môi trường BE bạn muốn.
- Token đăng nhập được lưu trong `localStorage` với key `accessToken`. Axios tự động đọc token khi gọi API.

### 4.2 FE ↔ BE hoạt động thế nào?

1. Người dùng đăng nhập (`/auth/login`) → lưu token.
2. Các trang protected nằm trong `ProtectedRoute`, chỉ render khi token hợp lệ.
3. Trang POS (`SalesPage`) khởi chạy:
   - `GET /order/drafts/me`: lấy danh sách draft của thu ngân → mỗi tab tương ứng 1 draft, chứa `items`, `customerId`, `paymentMethod`, `invoiceDiscount`, `orderNote`.
   - `GET /customer`: cache danh sách khách để map `customerId` → `selectedCustomer`.
4. Người dùng chỉnh dữ liệu → FE cập nhật state tab hiện tại. Một effect debounce (600 ms) gọi `PUT /order/draft` **chỉ khi dữ liệu khác snapshot** nên tránh spam.
5. Lưu đơn tạm (`PUT /order/pending`), xoá draft (`DELETE /order/draft/{id}`) hay thanh toán → FE reset tab tương ứng.
6. Khi quay lại trang (focus/visibility), `loadDraftTabs` chạy lại để đảm bảo dữ liệu luôn mới nhất.

---

## 5. Cấu trúc thư mục

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

## 6. Danh sách API

> **Lưu ý:** FE kỳ vọng draft trả kèm `orderItemDTOs`, `orderNote`, `customerId`, `invoiceDiscount`, `paymentMethod`. Nếu backend trả thiếu, POS không thể khôi phục chính xác.

### 6.1 Auth & Nhân sự

| Endpoint                         | Method | Mô tả                                 |
|----------------------------------|--------|---------------------------------------|
| `/auth/login`                    | POST   | Đăng nhập, trả token                  |
| `/auth/users/me`                 | GET    | Lấy thông tin người dùng hiện tại     |
| `/auth/users/me`                 | PUT    | Cập nhật thông tin cá nhân            |
| `/auth/users/all`                | GET    | Danh sách nhân viên (StaffPage)       |
| `/auth/users/create` *(tùy BE)*  | POST   | Tạo nhân viên                         |
| `/auth/users/{id}`               | DELETE | Xoá nhân viên                         |

### 6.2 Khách hàng

| Endpoint                     | Method | Mô tả                        |
|------------------------------|--------|------------------------------|
| `/customer`                  | GET    | Danh sách khách hàng         |
| `/customer`                  | POST   | Thêm khách                   |
| `/customer/{id}`             | PUT    | Sửa khách                    |
| `/customer/{id}`             | DELETE | Xoá khách                    |

### 6.3 Sản phẩm & tồn kho

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

### 6.4 Draft / Order

| Endpoint                  | Method | Mô tả                                                                 |
|---------------------------|--------|------------------------------------------------------------------------|
| `/order/drafts/me`        | GET    | Lấy danh sách draft của thu ngân đang đăng nhập                       |
| `/order/draft`            | POST   | Tạo draft mới (server trả `orderId`)                                   |
| `/order/draft`            | PUT    | Cập nhật draft (`orderId`, `orderItemDTOs`, `customerId`, `orderNote`, `paymentMethod`, `invoiceDiscount`) |
| `/order/draft/{orderId}`  | DELETE | Xoá draft                                                              |
| `/order/pending`          | PUT    | Lưu đơn pending (giữ nguyên trạng thái trên server)                    |

### 6.5 Các API khác

- `/finance/...` – trang FinancePage.
- `/home/analytics/...` – Dashboard/ HomePage.
- Các component “add” trong thư mục `components/**` cũng gọi API tương ứng đã liệt kê.

Để liệt kê toàn bộ endpoint thực tế, có thể chạy `rg "API_BASE_URL" -n` trong project.

---

## 7. Các điểm cần nhớ khi phát triển

1. **i18n**: tất cả text hiển thị phải dùng `t("key", { defaultValue })`.
2. **State tab độc lập**: mỗi tab có `items`, `orderNote`, `customerId`, `paymentMethod`, `invoiceDiscount` riêng. Không share state toàn cục.
3. **Auto-sync**: Debounce 600ms; chỉ PUT `/order/draft` khi dữ liệu khác snapshot để tránh 403/Spam.
4. **Khôi phục dữ liệu**: khi FE nhận `customerId`, effect sẽ tìm trong cache `customers` để hiển thị lại khách đã chọn. Nếu backend không trả `customerId` hoặc `orderItemDTOs`, UI sẽ trống.
5. **Note & Order Note**: BE cần trả `orderItemDTOs[].note` và `orderNote` nếu muốn hiển thị lại; FE đã đọc sẵn.

---

## 8. Quy trình đóng góp

1. Fork hoặc tạo branch mới.
2. Thực hiện thay đổi trong `src/`.
3. `npm run lint` trước khi mở PR.
4. Khi thêm endpoint mới, cập nhật README (mục API) để người khác dễ theo dõi.

---

Chúc bạn triển khai hệ thống POS DATN thành công! Nếu cần thêm tài liệu (mock data/Postman collection), hãy bổ sung vào repo hoặc mở issue mới. 🚀
