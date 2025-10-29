import React, { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../layouts/MainLayout";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";

export default function AccountPage() {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [account, setAccount] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const API_URL = "http://192.168.1.208:8080/api/auth/users/me";
  const token = localStorage.getItem("accessToken");

  // ✅ Hàm định dạng ngày sang dd/MM/yyyy
  const formatDate = (dateValue) => {
    if (!dateValue) return "";
    const date = new Date(dateValue);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // ✅ Chuyển từ dd/MM/yyyy → yyyy-MM-dd (để hiển thị trong input date)
  const parseDateForInput = (dateStr) => {
    if (!dateStr) return "";
    const [day, month, year] = dateStr.split("/");
    if (!day || !month || !year) return "";
    return `${year}-${month}-${day}`;
  };

  // 🔹 Lấy thông tin tài khoản
  const fetchAccount = async () => {
    try {
      if (!token) {
        setError(t("account.noToken") || "Không tìm thấy accessToken!");
        setLoading(false);
        return;
      }

      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const formatted = {
        ...res.data,
        dateOfBirth: formatDate(res.data.dateOfBirth),
      };

      setAccount(formatted);
    } catch (err) {
      console.error(err);
      setError(t("account.loadError") || "Không thể tải thông tin tài khoản!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccount();
  }, []);

  // 🔹 Cập nhật state khi chỉnh sửa
  const handleChange = (e) => {
    setAccount({
      ...account,
      [e.target.name]: e.target.value,
    });
  };

  // 🔹 Lưu cập nhật
  const handleUpdate = async () => {
    try {
      if (!token) {
        setError(t("account.noToken") || "Không có token, vui lòng đăng nhập lại!");
        return;
      }

      const payload = {
        ...account,
        gender:
          account.gender === "Nam" || account.gender === 1
            ? 1
            : account.gender === "Nữ" || account.gender === 0
            ? 0
            : account.gender,
        // ✅ Chuyển ngày sang ISO (yyyy-MM-dd)
        dateOfBirth: (() => {
          const [d, m, y] = account.dateOfBirth.split("/");
          return `${y}-${m}-${d}`;
        })(),
      };

      await axios.put(API_URL, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      await fetchAccount();
      setMessage(t("account.updateSuccess") || "✅ Cập nhật thông tin thành công!");
      setEditing(false);
    } catch (err) {
      console.error(err);
      setMessage(t("account.updateFail") || "❌ Cập nhật thất bại, vui lòng thử lại!");
    }
  };

  if (loading) return <p>{t("loading") || "Đang tải dữ liệu..."}</p>;

  return (
    <MainLayout>
      <div className="container-fluid py-3 px-4">
        {/* === Tiêu đề === */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h4 className={`fw-bold text-${theme} mb-0`}>
            {t("account.title") || "Thông tin tài khoản"}
          </h4>
        </div>

        {/* === Khung nội dung === */}
        <div className="bg-white border rounded-3 shadow-sm p-4">
          {error && <p className="text-danger mb-2">{error}</p>}
          {message && <p className="text-success mb-2">{message}</p>}

          {account && (
            <div className="row g-3">
              {[
                { label: t("account.username") || "Tên đăng nhập", name: "username" },
                { label: t("account.fullName") || "Họ và tên", name: "fullName" },
                { label: t("account.email") || "Email", name: "email" },
                { label: t("account.phoneNumber") || "Số điện thoại", name: "phoneNumber" },
                { label: t("account.role") || "Vai trò", name: "role" },
                { label: t("account.gender") || "Giới tính", name: "gender" },
                { label: t("account.address") || "Địa chỉ", name: "address" },
                { label: t("account.dateOfBirth") || "Ngày sinh", name: "dateOfBirth" },
              ].map((field) => (
                <div key={field.name} className="col-md-6">
                  <label className="form-label fw-semibold">{field.label}</label>

                  {editing ? (
                    field.name === "gender" ? (
                      <select
                        name="gender"
                        className="form-select"
                        value={
                          account.gender === 1 ||
                          account.gender === "1" ||
                          account.gender === "Nam"
                            ? "Nam"
                            : "Nữ"
                        }
                        onChange={(e) =>
                          setAccount({
                            ...account,
                            gender: e.target.value,
                          })
                        }
                      >
                        <option value="Nam">{t("account.male") || "Nam"}</option>
                        <option value="Nữ">{t("account.female") || "Nữ"}</option>
                      </select>
                    ) : field.name === "dateOfBirth" ? (
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={parseDateForInput(account.dateOfBirth)}
                        onChange={(e) =>
                          setAccount({
                            ...account,
                            dateOfBirth: formatDate(e.target.value),
                          })
                        }
                        className="form-control"
                      />
                    ) : (
                      <input
                        type="text"
                        name={field.name}
                        value={account[field.name] || ""}
                        onChange={handleChange}
                        className="form-control"
                      />
                    )
                  ) : (
                    <p className="form-control mb-0 bg-light">
                      {field.name === "gender"
                        ? account.gender === 1 ||
                          account.gender === "1" ||
                          account.gender === "Nam"
                          ? t("account.male") || "Nam"
                          : t("account.female") || "Nữ"
                        : field.name === "dateOfBirth"
                        ? account.dateOfBirth
                        : account[field.name]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* === Nút hành động === */}
          <div className="mt-4 d-flex justify-content-end gap-2">
            {!editing ? (
              <button
                className={`btn btn-${theme}`}
                onClick={() => setEditing(true)}
              >
                {t("account.edit") || "Chỉnh sửa"}
              </button>
            ) : (
              <>
                <button className={`btn btn-${theme}`} onClick={handleUpdate}>
                  {t("account.save") || "Lưu thay đổi"}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setEditing(false)}
                >
                  {t("account.cancel") || "Hủy"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
