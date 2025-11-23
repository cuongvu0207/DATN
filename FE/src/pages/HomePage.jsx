import React, { useEffect, useMemo, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { API_BASE_URL } from "../services/api";
import { formatCurrency, formatters } from "../utils/formatters";

export default function HomePage() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const token = localStorage.getItem("accessToken");

  const [period, setPeriod] = useState("day"); // "day" | "week" | "month"
  const [summary, setSummary] = useState({ revenue: 0, cost: 0, profit: 0 });
  const [trend, setTrend] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [activities, setActivities] = useState([]); // tạm thời để trống, nếu sau này có /audit/logs thì gắn vào
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const axiosInstance = useMemo(
    () =>
      axios.create({
        baseURL: API_BASE_URL,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }),
    [token]
  );

  // Giới hạn thời gian theo period (day / week / month)
  const getFromDateByPeriod = () => {
    const now = new Date();
    const from = new Date(now);

    if (period === "day") {
      from.setHours(0, 0, 0, 0);
    } else if (period === "week") {
      from.setDate(from.getDate() - 6); // 7 ngày gần nhất (bao gồm hôm nay)
      from.setHours(0, 0, 0, 0);
    } else if (period === "month") {
      from.setDate(from.getDate() - 29); // 30 ngày gần nhất
      from.setHours(0, 0, 0, 0);
    }

    return from;
  };

  const fetchDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      // Gọi 3 API: orders, products, customers
      const [ordersRes, productsRes, customersRes] = await Promise.all([
        axiosInstance.get("/order/static/allCompleted"),
        axiosInstance.get("/inventory/products"),
        axiosInstance.get("/customer"),
      ]);

      const allOrders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
      const products = Array.isArray(productsRes.data) ? productsRes.data : [];
      const customers = Array.isArray(customersRes.data) ? customersRes.data : [];

      // Map barcode -> giá vốn
      const costMap = {};
      products.forEach((p) => {
        if (p.barcode) {
          costMap[p.barcode] = Number(p.costOfCapital || p.costPrice || 0);
        }
      });

      // Map customerId -> info
      const customerMap = {};
      customers.forEach((c) => {
        if (c.id) {
          customerMap[c.id] = {
            name: c.name || c.fullName || "Khách hàng",
            phone: c.phone || c.phoneNumber || "",
          };
        }
      });

      // Lọc orders theo period
      const now = new Date();
      const fromDate = getFromDateByPeriod();

      const orders = allOrders.filter((o) => {
        const d = new Date(o.createdAt);
        if (isNaN(d.getTime())) return false;
        return d >= fromDate && d <= now;
      });

      // ===== TÍNH SUMMARY: DOANH THU / CHI PHÍ / LỢI NHUẬN =====
      const revenue = orders.reduce(
        (sum, o) => sum + Number(o.totalPrice || 0),
        0
      );

      let cost = 0;
      orders.forEach((o) => {
        (o.orderItemDTOs || []).forEach((item) => {
          const barcode = item.barcode;
          const qty = Number(item.quantity || 0);
          const unitCost = costMap[barcode] ?? 0;
          cost += qty * unitCost;
        });
      });

      const profit = revenue - cost;

      setSummary({ revenue, cost, profit });

      // ===== TÍNH TREND REVENUE =====
      let trendData = [];
      if (period === "day") {
        // group by hour trong ngày
        const byHour = {};
        orders.forEach((o) => {
          const d = new Date(o.createdAt);
          const h = d.getHours();
          const key = h; // 0-23
          byHour[key] = (byHour[key] || 0) + Number(o.totalPrice || 0);
        });

        const today = new Date();
        trendData = Object.entries(byHour)
          .map(([hStr, rev]) => {
            const h = Number(hStr);
            const d = new Date(
              today.getFullYear(),
              today.getMonth(),
              today.getDate(),
              h
            );
            return { date: d.toISOString(), revenue: rev };
          })
          .sort((a, b) => new Date(a.date) - new Date(b.date));
      } else {
        // group by day (YYYY-MM-DD)
        const byDay = {};
        orders.forEach((o) => {
          const d = new Date(o.createdAt);
          d.setHours(0, 0, 0, 0);
          const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
          byDay[key] = (byDay[key] || 0) + Number(o.totalPrice || 0);
        });

        trendData = Object.entries(byDay)
          .map(([dateStr, rev]) => {
            const d = new Date(dateStr);
            return { date: d.toISOString(), revenue: rev };
          })
          .sort((a, b) => new Date(a.date) - new Date(b.date));
      }

      setTrend(trendData);

      // ===== TÍNH TOP PRODUCTS =====
      const prodAgg = {};
      orders.forEach((o) => {
        (o.orderItemDTOs || []).forEach((item) => {
          const key = item.barcode || item.productName;
          if (!key) return;
          if (!prodAgg[key]) {
            prodAgg[key] = {
              name: item.productName || "Sản phẩm",
              barcode: item.barcode || "",
              revenue: 0,
              qty: 0,
            };
          }
          const subTotal =
            item.subTotal || Number(item.price || 0) * Number(item.quantity || 0);
          prodAgg[key].revenue += subTotal;
          prodAgg[key].qty += Number(item.quantity || 0);
        });
      });

      const topProdArr = Object.values(prodAgg)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setTopProducts(topProdArr);

      // ===== TÍNH TOP CUSTOMERS =====
      const custAgg = {};
      orders.forEach((o) => {
        const cid = o.customerId || "default_customer_id";
        if (!custAgg[cid]) {
          const info = customerMap[cid] || {};
          custAgg[cid] = {
            id: cid,
            name:
              cid === "default_customer_id"
                ? "Khách lẻ"
                : info.name || `Khách #${cid.substring(0, 6)}`,
            phone: info.phone || "",
            revenue: 0,
            orders: 0,
          };
        }
        custAgg[cid].revenue += Number(o.totalPrice || 0);
        custAgg[cid].orders += 1;
      });

      const topCustArr = Object.values(custAgg)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setTopCustomers(topCustArr);

      // Activity: hiện tại chưa có API, để rỗng
      setActivities([]);
    } catch (err) {
      console.error("Dashboard fetch failed:", err);
      setError("Không tải được dữ liệu dashboard");
      setSummary({ revenue: 0, cost: 0, profit: 0 });
      setTrend([]);
      setTopProducts([]);
      setTopCustomers([]);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const maxRevenue =
    trend.reduce((m, d) => Math.max(m, d.revenue || 0), 0) || 1;
  const maxProdRevenue =
    topProducts.reduce((m, p) => Math.max(m, p.revenue || 0), 0) || 1;
  const maxCustRevenue =
    topCustomers.reduce((m, c) => Math.max(m, c.revenue || 0), 0) || 1;

  return (
    <MainLayout>
      <div className="container-fluid py-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="fw-bold mb-0">{t("dashboard.title")}</h4>
          <div className="btn-group">
            {[
              { k: "day", l: "Ngày" },
              { k: "week", l: "Tuần" },
              { k: "month", l: "Tháng" },
            ].map((x) => (
              <button
                key={x.k}
                className={`btn btn-${period === x.k ? theme : "outline-" + theme
                  }`}
                onClick={() => setPeriod(x.k)}
              >
                {x.l}
              </button>
            ))}
          </div>
        </div>

        {/* THÔNG BÁO LỖI (nếu có) */}
        {error && (
          <div className="alert alert-warning py-2 small">{error}</div>
        )}

        {/* SUMMARY CARDS */}
        <div className="row g-3 mb-3">
          {[
            {
              label: t("dashboard.revenue"),
              value: formatCurrency(summary.revenue),
              icon: "bi-graph-up",
              cls: "text-success",
            },
            {
              label: t("dashboard.cost"),
              value: formatCurrency(summary.cost),
              icon: "bi-cash-stack",
              cls: "text-danger",
            },
            {
              label: t("dashboard.profit"),
              value: formatCurrency(summary.profit),
              icon: "bi-wallet2",
              cls: "text-primary",
            },
          ].map((c, i) => (
            <div key={i} className="col-12 col-md-4">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body d-flex align-items-center justify-content-between">
                  <div>
                    <div className="text-muted small">{c.label}</div>
                    <div className={`fw-bold fs-4 ${c.cls}`}>{c.value}</div>
                  </div>
                  <i className={`bi ${c.icon} fs-2 ${c.cls}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* REVENUE TREND + ACTIVITY (activity tạm rỗng) */}
        <div className="row g-3">
          <div className="col-12 col-xl-8">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-white border-0 fw-semibold">
                {t("dashboard.revenueTrend")}
              </div>
              <div className="card-body">
                {loading && (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" />
                  </div>
                )}
                {!loading && (
                  <div
                    className="d-flex align-items-end"
                    style={{ height: 220, gap: 6, overflowX: "auto" }}
                  >
                    {trend.map((d, i) => {
                      const h = Math.max(
                        6,
                        Math.round((d.revenue / maxRevenue) * 200)
                      );
                      const dateObj = new Date(d.date);
                      const label =
                        period === "day"
                          ? `${dateObj.getHours()}:00`
                          : `${dateObj.getDate()
                          }/${dateObj.getMonth() + 1}`;
                      return (
                        <div
                          key={i}
                          className="text-center"
                          style={{ width: 22 }}
                        >
                          <div
                            className={`bg-${theme}`}
                            style={{
                              height: h,
                              borderRadius: 4,
                            }}
                            title={`${formatCurrency(
                              d.revenue
                            )} (${label})`}
                          />
                          <small
                            className="text-muted"
                            style={{
                              fontSize: 10,
                              marginTop: 4,
                              display: "inline-block",
                              width: "100%",
                              textAlign: "center",
                              whiteSpace: "nowrap"   // ⭐ KHÔNG CHO XUỐNG DÒNG
                            }}
                          >
                            {label}
                          </small>

                        </div>
                      );
                    })}
                    {trend.length === 0 && !loading && (
                      <div className="text-muted small">
                        {t("common.noData")}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activity feed (hiện tạm không có dữ liệu) */}
          <div className="col-12 col-xl-4">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-white border-0 fw-semibold">
                {t("dashboard.activity")}
              </div>
              <div
                className="card-body"
                style={{ maxHeight: 320, overflowY: "auto" }}
              >
                {activities.length === 0 && (
                  <div className="text-muted text-center py-3">
                    {t("common.noData")}
                  </div>
                )}
                <ul className="list-group list-group-flush">
                  {activities.map((a, i) => (
                    <li key={i} className="list-group-item">
                      <div className="d-flex justify-content-between">
                        <div>
                          <span className="badge bg-light text-dark border me-2">
                            {a.action}
                          </span>
                          <span className="fw-semibold">{a.user}</span>
                        </div>
                        <small className="text-muted">
                          {formatters.date.toDisplay(a.time)}
                        </small>
                      </div>
                      {a.detail && (
                        <div className="small text-muted mt-1">
                          {a.detail}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* TOP PRODUCTS & TOP CUSTOMERS */}
        <div className="row g-3 mt-1">
          {/* Top products */}
          <div className="col-12 col-xl-6">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-white border-0 fw-semibold">
                {t("dashboard.topProducts")}
              </div>
              <div className="card-body">
                {topProducts.map((p, i) => (
                  <div
                    key={p.barcode || i}
                    className="d-flex align-items-center mb-2"
                  >
                    <div
                      className="text-truncate"
                      style={{ width: 120 }}
                      title={p.name || p.productName}
                    >
                      {p.name || p.productName}
                    </div>
                    <div
                      className="flex-grow-1 mx-2 bg-light rounded"
                      style={{ height: 8 }}
                    >
                      <div
                        className={`bg-${theme} rounded`}
                        style={{
                          width: `${Math.round(
                            ((p.revenue || 0) / maxProdRevenue) * 100
                          )}%`,
                          height: 8,
                        }}
                      ></div>
                    </div>
                    <small className="text-muted">
                      {formatCurrency(p.revenue || 0)}
                    </small>
                  </div>
                ))}

                <div
                  className="table-responsive rounded-3 mt-3"
                  style={{
                    borderRadius: 16,
                    overflow: "hidden",
                    paddingRight: 8,
                    paddingBottom: 8,
                    backgroundColor: "#fff",
                  }}
                >
                  <div
                    style={{
                      maxHeight: "60vh",
                      overflowX: "auto",
                      overflowY: "auto",
                      borderRadius: 12,
                    }}
                  >
                    <table className="table table-hover align-middle mb-0">
                      <thead
                        className="table-light"
                        style={{ position: "sticky", top: 0, zIndex: 2 }}
                      >
                        <tr>
                          <th>#</th>
                          <th>{t("products.name")}</th>
                          <th className="text-end">
                            {t("dashboard.revenue")}
                          </th>
                          <th className="text-end">SL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topProducts.map((p, i) => (
                          <tr key={p.barcode || i}>
                            <td>{i + 1}</td>
                            <td>{p.name || p.productName}</td>
                            <td className="text-end">{formatCurrency(p.revenue || 0)}</td>
                            <td className="text-end">{p.qty || p.quantity || 0}</td>
                          </tr>
                        ))}

                        {topProducts.length === 0 && (
                          <tr>
                            <td colSpan={4} className="text-center text-muted py-3">
                              {t("common.noData")}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Top customers */}
          <div className="col-12 col-xl-6">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-white border-0 fw-semibold">
                {t("dashboard.topCustomers")}
              </div>

              <div className="card-body">
                {topCustomers.map((c, i) => (
                  <div
                    key={c.id || i}
                    className="d-flex align-items-center mb-2"
                  >
                    <div
                      className="text-truncate"
                      style={{ width: 120 }}
                      title={c.name}
                    >
                      {c.name}
                    </div>

                    <div
                      className="flex-grow-1 mx-2 bg-light rounded"
                      style={{ height: 8 }}
                    >
                      <div
                        className={`bg-${theme} rounded`}
                        style={{
                          width: `${Math.round(
                            ((c.revenue || 0) / maxCustRevenue) * 100
                          )}%`,
                          height: 8,
                        }}
                      ></div>
                    </div>

                    <small className="text-muted">
                      {formatCurrency(c.revenue || 0)}
                    </small>
                  </div>
                ))}

                {/* TABLE */}
                <div
                  className="table-responsive rounded-3 mt-3"
                  style={{
                    borderRadius: 16,
                    overflow: "hidden",
                    paddingRight: 8,
                    paddingBottom: 8,
                    backgroundColor: "#fff",
                  }}
                >
                  <div
                    style={{
                      maxHeight: "60vh",
                      overflowX: "auto",
                      overflowY: "auto",
                      borderRadius: 12,
                    }}
                  >
                    <table className="table table-hover align-middle mb-0">
                      <thead
                        className="table-light"
                        style={{ position: "sticky", top: 0, zIndex: 2 }}
                      >
                        <tr>
                          <th>#</th>
                          <th>{t("customer.fullName")}</th>
                          <th>{t("customer.phoneNumber")}</th>
                          <th className="text-end">{t("dashboard.revenue")}</th>
                        </tr>
                      </thead>

                      <tbody>
                        {topCustomers.map((c, i) => (
                          <tr key={c.id || i}>
                            <td>{i + 1}</td>
                            <td>{c.name}</td>
                            <td>{c.phone}</td>
                            <td className="text-end">
                              {formatCurrency(c.revenue || 0)}
                            </td>
                          </tr>
                        ))}

                        {topCustomers.length === 0 && (
                          <tr>
                            <td colSpan={4} className="text-center text-muted py-3">
                              {t("common.noData")}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div> {/* END ROW */}
      </div> {/* END container */}
    </MainLayout>
  );
}

