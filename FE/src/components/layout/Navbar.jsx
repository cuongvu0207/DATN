import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

export default function Navbar() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    const dropdowns = document.querySelectorAll(".nav-item.dropdown");
    dropdowns.forEach((dropdown) => {
      const menu = dropdown.querySelector(".dropdown-menu");

      const openMenu = () => {
        dropdown.classList.add("show");
        if (menu) menu.classList.add("show");
      };

      const closeMenu = () => {
        dropdown.classList.remove("show");
        if (menu) menu.classList.remove("show");
      };

      dropdown.addEventListener("mouseenter", openMenu);
      dropdown.addEventListener("mouseleave", closeMenu);
      
    });
  }, []);

  const buttonClass = (path) =>
    `btn btn-${theme} text-white px-3 py-2 border-0 ${
      location.pathname === path ? "fw-bold" : ""
    }`;

  return (
    <nav className={`navbar navbar-expand-lg navbar-dark bg-${theme}`}>
      <div className="container-fluid">
        {/* Nội dung lùi 1/12 mỗi bên */}
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
              <li className="nav-item">
                <Link className={buttonClass("/")} to="/">
                  {t("menu.overview")}
                </Link>
              </li>

              {/* Hàng hoá */}
              <li className="nav-item dropdown">
                <a className={buttonClass("/products")} href="#">
                  {t("menu.products")}
                </a>
                <ul className="dropdown-menu ">
                  <li>
                    <h6 className="dropdown-header fw-bold text-black">{t("menu.groups.products")}</h6>
                  </li>
                  <li>
                    <Link className="dropdown-item dropdown-${theme}-subtle" to="/products/list">
                      {t("menu.productList")}
                    </Link>
                  </li>
                  <li>
                    <a className="dropdown-item" href="#">
                      {t("menu.priceSetup")}
                    </a>
                  </li>
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <h6 className="dropdown-header fw-bold text-black">{t("menu.groups.import")}</h6>
                  </li>
                  <li>
                    <a className="dropdown-item" href="#">
                      {t("menu.supplier")}
                    </a>
                  </li>
                  <li>
                    <a className="dropdown-item" href="import">
                      {t("menu.importGoods")}
                    </a>
                  </li>
                </ul>
              </li>

              {/* Đơn hàng */}
              <li className="nav-item dropdown">
                <a className={buttonClass("/orders")} href="#">
                  {t("menu.orders")}
                </a>
                <ul className="dropdown-menu">
                  <li>
                    <a className="dropdown-item" href="#">
                      {t("menu.invoice")}
                    </a>
                  </li>
                  <li>
                    <a className="dropdown-item" href="#">
                      {t("menu.returns")}
                    </a>
                  </li>
                </ul>
              </li>

              {/* Khách hàng */}
              <li className="nav-item">
                <a className={buttonClass("/customers")} href="#">
                  {t("menu.customers")}
                </a>
              </li>

              {/* Nhân viên */}
              <li className="nav-item">
                <a className={buttonClass("/staff")} href="#">
                  {t("menu.staff")}
                </a>
              </li>
            </ul>

            {/* Nút bán hàng */}
            <div className="d-flex ms-auto">
              <Link
                className="btn btn-light fw-bold d-flex align-items-center"
                to="/sales"
              >
                <i className="bi bi-cart me-2"></i> {t("menu.sales")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
