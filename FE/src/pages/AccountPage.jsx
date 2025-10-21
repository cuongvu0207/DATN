import React, { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../layouts/MainLayout";

export default function AccountPage({ theme, setTheme }) {
  const [account, setAccount] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("Không tìm thấy accessToken, vui lòng đăng nhập lại!");
          setLoading(false);
          return;
        }

        const res = await axios.get(
          "https://aerobiotically-supereffective-marcus.ngrok-free.dev/api/users/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "ngrok-skip-browser-warning": "true",
            },
          }
        );

        setAccount(res.data);
      } catch (err) {
        console.error(err);
        setError("Không thể tải thông tin tài khoản!");
      } finally {
        setLoading(false);
      }
    };

    fetchAccount();
  }, []);

  const handleChange = (e) => {
    setAccount({
      ...account,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Không có token, vui lòng đăng nhập lại!");
        return;
      }

      const res = await axios.put(
        "https://aerobiotically-supereffective-marcus.ngrok-free.dev/api/users/me",
        account,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      setMessage("Cập nhật thông tin thành công!");
      setEditing(false);
      setAccount(res.data);
    } catch (err) {
      console.error(err);
      setMessage("Cập nhật thất bại, vui lòng thử lại!");
    }
  };

  if (loading) return <p>Đang tải dữ liệu...</p>;

  return (
    <MainLayout theme={theme} setTheme={setTheme}>
      <div className={`p-4 border rounded bg-${theme} bg-opacity-25`}>
        <h2 className={`text-${theme} mb-3`}>Thông tin tài khoản</h2>

        {error && <p className="text-danger">{error}</p>}
        {message && <p className="text-success">{message}</p>}

        {account && (
          <div className="row g-3">
            {[
              { label: "Tên đăng nhập", name: "username" },
              { label: "Họ và tên", name: "fullName" },
              { label: "Email", name: "email" },
              { label: "Số điện thoại", name: "phoneNumber" },
              { label: "Vai trò", name: "role" },
              { label: "Giới tính", name: "gender" },
              { label: "Địa chỉ", name: "address" },
              { label: "Ngày sinh", name: "dateOfBirth" },
            ].map((field) => (
              <div key={field.name} className="col-md-6">
                <label className="form-label fw-bold">{field.label}:</label>
                {editing ? (
                  <input
                    type="text"
                    name={field.name}
                    value={account[field.name] || ""}
                    onChange={handleChange}
                    className="form-control"
                  />
                ) : (
                  <p className="form-control">{account[field.name]}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4">
          {!editing ? (
            <button
              className={`btn btn-${theme}`}
              onClick={() => setEditing(true)}
            >
              Chỉnh sửa
            </button>
          ) : (
            <>
              <button
                className={`btn btn-success me-2`}
                onClick={handleUpdate}
              >
                Lưu thay đổi
              </button>
              <button
                className={`btn btn-secondary`}
                onClick={() => setEditing(false)}
              >
                Hủy
              </button>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
