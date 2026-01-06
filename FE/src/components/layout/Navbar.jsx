import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";

export default function Navbar() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const location = useLocation();


  useEffect(() => {
    document.documentElement.style.setProperty("--bs-current-theme", `var(--bs-${theme})`);
  }, [theme]);


  useEffect(() => {
    const dropdowns = document.querySelectorAll(".nav-item.dropdown");
    dropdowns.forEach((dropdown) => {
      dropdown.addEventListener("mouseenter", () => {
        dropdown.classList.add("show");
        dropdown.querySelector(".dropdown-menu")?.classList.add("show");
      });
      dropdown.addEventListener("mouseleave", () => {
        dropdown.classList.remove("show");
        dropdown.querySelector(".dropdown-menu")?.classList.remove("show");
      });
    });
  }, []);

  const buttonClass = (path) => {
    const isActive = location.pathname.startsWith(path);
    return `btn text-white px-3 py-2 border-0 ${
      isActive ? `bg-${theme} bg-opacity-75 fw-semibold` : "fw-normal"
    }`;
  };

  const dropdownItemClass = (path) => {
    const isActive = location.pathname === path;
    return `dropdown-item ${isActive ? "text-white" : ""}`;
  };

  const dropdownItemStyle = (path) => {
    const isActive = location.pathname === path;
    if (!isActive) return {};
    return {
      backgroundColor: `var(--bs-${theme})`,
      color: "#fff",
    };
  };

  return (
    <>
      <style>
        {`
          .dropdown-item:active,
          .dropdown-item.active {
            background-color: var(--bs-current-theme) !important;
            color: #fff !important;
          }
        `}
      </style>

      <nav className={`navbar navbar-expand-lg navbar-dark bg-${theme}`}>
        <div className="container-fluid">
          <div className="container" style={{ maxWidth: "83.33%" }}>
            {/* Toggle mobile */}
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarContent"
              aria-controls="navbarContent"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>

            <div className="collapse navbar-collapse" id="navbarContent">
              <ul className="navbar-nav mb-2 mb-lg-0 gap-2">
                {/* Tổng quan */}
                <li className="nav-item">
                  <Link className={buttonClass("/")} to="/">
                    {t("menu.overview")}
                  </Link>
                </li>

                {/* Hàng hóa */}
                <li className="nav-item dropdown">
                  <button
                    className={`${buttonClass("/products")} dropdown-toggle`}
                    type="button"
                    data-bs-toggle="dropdown"
                  >
                    {t("menu.products")}
                  </button>
                  <ul className="dropdown-menu">
                    <li>
                      <h6 className="dropdown-header text-black">
                        {t("menu.groups.products")}
                      </h6>
                    </li>
                    <li>
                      <Link
                        className={dropdownItemClass("/products/list")}
                        style={dropdownItemStyle("/products/list")}
                        to="/products/list"
                      >
                        {t("menu.productList")}
                      </Link>
                    </li>
                    <li>
                      <Link
                        className={dropdownItemClass("/forecast")}
                        style={dropdownItemStyle("/forecast")}
                        to="/forecast"
                      >
                        {t("menu.forecast")}
                      </Link>
                    </li>
                    <li>
                      <hr className="dropdown-divider" />
                    </li>
                    <li>
                      <h6 className="dropdown-header text-black">
                        {t("menu.groups.import")}
                      </h6>
                    </li>
                    <li>
                      <Link
                        className={dropdownItemClass("/products/supplier")}
                        style={dropdownItemStyle("/products/supplier")}
                        to="/products/supplier"
                      >
                        {t("menu.supplier")}
                      </Link>
                    </li>
                    <li>
                      <Link
                        className={dropdownItemClass("/products/import")}
                        style={dropdownItemStyle("/products/import")}
                        to="/products/import"
                      >
                        {t("menu.importGoods")}
                      </Link>
                    </li>
                  </ul>
                </li>

                {/* Đơn hàng */}
                <li className="nav-item dropdown">
                  <button
                    className={`${buttonClass("/orders")} dropdown-toggle`}
                    type="button"
                    data-bs-toggle="dropdown"
                  >
                    {t("menu.orders")}
                  </button>
                  <ul className="dropdown-menu">
                    <li>
                      <Link
                        className={dropdownItemClass("/sales/invoices")}
                        style={dropdownItemStyle("/sales/invoices")}
                        to="/sales/invoices"
                      >
                        {t("menu.invoice")}
                      </Link>
                    </li>
                    <li>
                      <Link
                        className={dropdownItemClass("/orders/returns")}
                        style={dropdownItemStyle("/orders/returns")}
                        to="/orders/returns"
                      >
                        {t("menu.returns")}
                      </Link>
                    </li>
                  </ul>
                </li>

                {/* Khách hàng */}
                <li className="nav-item">
                  <Link className={buttonClass("/customers")} to="/customers">
                    {t("menu.customers")}
                  </Link>
                </li>

                {/* Nhân viên */}
                <li className="nav-item">
                  <Link className={buttonClass("/staff")} to="/staff">
                    {t("menu.staff")}
                  </Link>
                </li>

                {/* Tài chính & kế toán */}
                <li className="nav-item">
                  <Link className={buttonClass("/finance")} to="/finance">
                    {t("menu.finace")}
                  </Link>
                </li>
              </ul>

              {/* Nút bán hàng */}
              <div className="d-flex ms-auto">
                <Link
                  className="btn btn-light fw-semibold d-flex align-items-center"
                  to="/sales"
                >
                  <i className="bi bi-cart me-2"></i>
                  {t("menu.sales")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
