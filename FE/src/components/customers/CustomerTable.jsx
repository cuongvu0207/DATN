import React from "react";
import { useTranslation } from "react-i18next";

export default function CustomerTable({
  customers,
  loading,
  theme,
  onDelete,
  onEdit,
}) {
  const { t } = useTranslation();

  const outerScrollStyle = {
    borderRadius: 16,
    overflow: "hidden",
    paddingRight: 8,
    paddingBottom: 8,
    backgroundColor: "#fff",
  };
  const scrollStyle = {
    maxHeight: "60vh",
    overflowX: "auto",
    overflowY: "auto",
    borderRadius: 12,
  };

  const renderGender = (gender) => {
    if (gender === "male") return t("customer.genderMale") || "Nam";
    if (gender === "female") return t("customer.genderFemale") || "Nữ";
    return t("customer.genderUnknown") || "-";
  };

  return (
    <div
      className="table-responsive rounded-3 shadow-sm"
      style={outerScrollStyle}
    >
      <div style={scrollStyle}>
        <table className="table table-hover align-middle mb-0">
          <thead
            className={`table-${theme}`}
            style={{ position: "sticky", top: 0, zIndex: 2 }}
          >
            <tr>
              <th>#</th>
              <th>{t("customer.fullName") || "Họ và tên"}</th>
              <th>{t("customer.email") || "Email"}</th>
              <th>{t("customer.phoneNumber") || "Số điện thoại"}</th>
              <th>{t("customer.gender") || "Giới tính"}</th>
              <th>{t("customer.address") || "Địa chỉ"}</th>
              <th className="text-center" aria-label="actions" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-4">
                  <div className="spinner-border text-primary" role="status" />
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
                  <td>{renderGender(c.gender)}</td>
                  <td>{c.address}</td>
                  <td className="text-center">
                    <div className="d-inline-flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn btn-sm d-flex align-items-center gap-2 px-3 rounded-3 text-white"
                        style={{ backgroundColor: "#1d68f2" }}
                        onClick={() => onEdit?.(c)}
                      >
                        <i className="bi bi-pencil-square" />
                        <span>{t("common.edit") || "Chỉnh sửa"}</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm d-flex align-items-center gap-2 px-3 rounded-3 text-white"
                        style={{ backgroundColor: "#d93f3f" }}
                        onClick={() => onDelete(c.id)}
                      >
                        <i className="bi bi-trash3" />
                        <span>{t("common.delete") || "Xóa"}</span>
                      </button>
                    </div>
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
    </div>
  );
}
