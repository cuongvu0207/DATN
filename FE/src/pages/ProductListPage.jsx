import React from "react";
import MainLayout from "../layouts/MainLayout";
import { useTranslation } from "react-i18next";

export default function ProductListPage({ theme, setTheme }) {
  const { t } = useTranslation();

  return (
    <MainLayout theme={theme} setTheme={setTheme}>
      <div className="d-flex" style={{ width: "100%" }}>
        {/* Sidebar bộ lọc */}
        <aside
          className="p-3 border-end"
          style={{
            minWidth: "260px",
            backgroundColor: "var(--bs-light-bg-subtle)",
          }}
        >
          <h5 className="fw-bold mb-3">{t("products.title")}</h5>

          {/* Nhóm hàng */}
          <div className="mb-3">
            <label className="form-label">{t("products.group")}</label>
            <select className="form-select">
              <option>{t("products.all")}</option>
            </select>
            <a href="#" className="small text-primary">
              {t("products.create")}
            </a>
          </div>

          {/* Tồn kho */}
          <div className="mb-3">
            <label className="form-label">{t("products.stock")}</label>
            <select className="form-select">
              <option>{t("products.all")}</option>
            </select>
          </div>

          {/* Thời gian tạo */}
          <div className="mb-3">
            <label className="form-label">{t("products.createdAt")}</label>
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="created"
                defaultChecked
              />
              <label className="form-check-label">{t("products.allTime")}</label>
            </div>
            <div className="form-check d-flex align-items-center gap-2">
              <input className="form-check-input" type="radio" name="created" />
              <input type="date" className="form-control form-control-sm" />
            </div>
          </div>

          {/* Nhà cung cấp */}
          <div className="mb-3">
            <label className="form-label">{t("products.supplier")}</label>
            <select className="form-select">
              <option>{t("products.chooseSupplier")}</option>
            </select>
          </div>

          {/* Vị trí */}
          <div className="mb-3">
            <label className="form-label">{t("products.location")}</label>
            <select className="form-select">
              <option>{t("products.chooseLocation")}</option>
            </select>
          </div>

          {/* Loại hàng */}
          <div className="mb-3">
            <label className="form-label">{t("products.category")}</label>
            <select className="form-select">
              <option>{t("products.chooseCategory")}</option>
            </select>
          </div>
        </aside>

        {/* Nội dung chính */}
        <main className="flex-grow-1 p-3">
          {/* Thanh tìm kiếm + nút hành động */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            {/* Search bar */}
            <div className="input-group" style={{ maxWidth: "380px" }}>
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder={t("products.searchPlaceholder")}
              />
              <button className={`btn btn-outline-${theme}`}>
                <i className="bi bi-sliders"></i>
              </button>
            </div>

            {/* Action buttons */}
            <div className="d-flex gap-2">
              <button className={`btn btn-${theme} d-flex align-items-center`}>
                <i className="bi bi-plus-lg me-1"></i>
                {t("products.create")}
              </button>
              <button className="btn btn-outline-secondary d-flex align-items-center">
                <i className="bi bi-upload me-1"></i>
                {t("products.import")}
              </button>
              <button className="btn btn-outline-secondary d-flex align-items-center">
                <i className="bi bi-download me-1"></i>
                {t("products.export")}
              </button>
              <button className="btn btn-outline-secondary">
                <i className="bi bi-grid"></i>
              </button>
              <button className="btn btn-outline-secondary">
                <i className="bi bi-gear"></i>
              </button>
              <button className="btn btn-outline-secondary">
                <i className="bi bi-question-circle"></i>
              </button>
            </div>
          </div>

          {/* Bảng sản phẩm */}
          <table className="table table-hover align-middle">
            <thead className={`table-${theme}-subtle`}>
              <tr>
                <th>
                  <input type="checkbox" />
                </th>
                <th></th>
                <th>{t("products.productId")}</th>
                <th>{t("products.productName")}</th>
                <th>{t("products.sellingPrice")}</th>
                <th>{t("products.costOfCapital")}</th>
                <th>{t("products.quantityInStock")}</th>
                <th>{t("products.createdAt")}</th>
              </tr>
            </thead>
            <tbody>
              {/* Demo trống - sau này sẽ map API */}
              <tr>
                <td colSpan="10" className="text-center text-muted">
                  {t("products.noData")}
                </td>
              </tr>
            </tbody>
          </table>
        </main>
      </div>
    </MainLayout>
  );
}
