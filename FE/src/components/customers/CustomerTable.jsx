import React from "react";
import { useTranslation } from "react-i18next";

export default function CustomerTable({
  customers,
  loading,
  theme,
  onDelete,
}) {
  const { t } = useTranslation();

  return (
    <div className={`table-responsive rounded-2 border border-${theme} shadow-sm`}>
      <table className="table table-hover align-middle mb-0">
        <thead className={`table-${theme}`}>
          <tr>
            <th>#</th>
            <th>{t("customer.fullName") || "Họ và tên"}</th>
            <th>{t("customer.email") || "Email"}</th>
            <th>{t("customer.phoneNumber") || "Số điện thoại"}</th>
            <th>{t("customer.gender") || "Giới tính"}</th>
            <th>{t("customer.dateOfBirth") || "Ngày sinh"}</th>
            <th>{t("customer.address") || "Địa chỉ"}</th>
            <th className="text-center">{t("customer.actions") || "Hành động"}</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan="8" className="text-center py-4">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-2">{t("common.loading") || "Đang tải..."}</p>
              </td>
            </tr>
          ) : customers.length > 0 ? (
            customers.map((c, i) => (
              <tr key={c.id}>
                <td>{i + 1}</td>
                <td>{c.fullName}</td>
                <td>{c.email}</td>
                <td>{c.phoneNumber}</td>
                <td>{c.gender}</td>
                <td>{c.dateOfBirth}</td>
                <td>{c.address}</td>
                <td className="text-center">
                  <button
                    className="btn btn-sm btn-outline-danger px-3"
                    onClick={() => onDelete(c.id)}
                  >
                    <i className="bi bi-trash me-1"></i>
                    {t("actions.delete") || "Xóa"}
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" className="text-center text-muted py-4">
                {t("customer.noData") || "Không có khách hàng nào"}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
