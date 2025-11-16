
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

  const [period, setPeriod] = useState("day");
  const [summary, setSummary] = useState({ revenue: 0, cost: 0, profit: 0 });
  const [trend, setTrend] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const axiosInstance = useMemo(
    () =>
      axios.create({
        baseURL: API_BASE_URL,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      }),
    [token]
  );

  const filterTrend = (arr) => {
    try {
      if (!Array.isArray(arr)) return [];
      if (period !== "day") return arr;
      return arr.filter((d) => {
        const h = new Date(d.date).getHours();
        return h >= 8 && h <= 20 && h % 2 === 0;
      });
    } catch {
      return arr || [];
    }
  };

  const fetchDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const [sum, tr, prod, cust, logs] = await Promise.all([
        axiosInstance.get("/finance/summary", { params: { period } }),
        axiosInstance.get("/analytics/revenue-trend", { params: { period, points: period === "day" ? 7 : 12 } }),
        axiosInstance.get("/analytics/top-products", { params: { period, limit: 5 } }),
        axiosInstance.get("/analytics/top-customers", { params: { period, limit: 5 } }),
        axiosInstance.get("/audit/logs", { params: { limit: 20 } }),
      ]);

      setSummary({
        revenue: Number(sum.data?.revenue || 0),
        cost: Number(sum.data?.cost || 0),
        profit: Number(sum.data?.profit || 0),
      });
      setTrend(filterTrend(Array.isArray(tr.data) ? tr.data : []));
      setTopProducts(Array.isArray(prod.data) ? prod.data : []);
      setTopCustomers(Array.isArray(cust.data) ? cust.data : []);
      setActivities(Array.isArray(logs.data) ? logs.data : []);
    } catch (err) {
      console.warn("Dashboard fetch failed, using demo data", err);
      setSummary({ revenue: 125000000, cost: 83000000, profit: 42000000 });
      const now = new Date();
      if (period === "day") {
        const hours = [8, 10, 12, 14, 16, 18, 20];
        setTrend(
          hours.map((h) => ({
            date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), h).toISOString(),
            revenue: Math.max(0, Math.round(5_000_000 + Math.random() * 20_000_000)),
          }))
        );
      } else {
        const pts = 12;
        setTrend(
          Array.from({ length: pts }, (_, i) => ({
            date: new Date(now.getFullYear(), now.getMonth() - (pts - 1 - i), 1).toISOString(),
            revenue: Math.max(0, Math.round(5_000_000 + Math.random() * 20_000_000)),
          }))
        );
      }
      setTopProducts(
        Array.from({ length: 5 }, (_, i) => ({
          name: `S?n ph?m ${i + 1}`,
          barcode: `SP${String(1000 + i)}`,
          revenue: Math.round(10_000_000 + Math.random() * 20_000_000),
          qty: Math.round(50 + Math.random() * 300),
        }))
      );
      setTopCustomers(
        Array.from({ length: 5 }, (_, i) => ({
          name: `Kh�ch h�ng ${i + 1}`,
          phone: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
          revenue: Math.round(15_000_000 + Math.random() * 25_000_000),
          orders: Math.round(1 + Math.random() * 10),
        }))
      );
      setActivities(
        Array.from({ length: 10 }, (_, i) => ({
          time: new Date(Date.now() - i * 3600_000).toISOString(),
          user: i % 2 === 0 ? "manager" : "staff01",
          action: i % 3 === 0 ? "CREATE_INVOICE" : i % 3 === 1 ? "IMPORT_STOCK" : "UPDATE_PRICE",
          detail: `Ho?t d?ng ${i + 1}`,
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [period]);

  const maxRevenue = trend.reduce((m, d) => Math.max(m, d.revenue || 0), 0) || 1;
  const maxProdRevenue = topProducts.reduce((m, p) => Math.max(m, p.revenue || 0), 0) || 1;
  const maxCustRevenue = topCustomers.reduce((m, c) => Math.max(m, c.revenue || 0), 0) || 1;

  return (
    <MainLayout>
      <div className="container-fluid py-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="fw-bold mb-0">{t("dashboard.title")}</h4>
          <div className="btn-group">
            {[{k:"day",l:"Ng�y"},{k:"week",l:"Tu?n"},{k:"month",l:"Th�ng"}].map(x => (
              <button key={x.k} className={`btn btn-${period===x.k?theme:"outline-"+theme}`} onClick={() => setPeriod(x.k)}>
                {x.l}
              </button>
            ))}
          </div>
        </div>

        <div className="row g-3 mb-3">
          {[{label:t("dashboard.revenue"), value:formatCurrency(summary.revenue), icon:"bi-graph-up", cls:"text-success"},
            {label:t("dashboard.cost"), value:formatCurrency(summary.cost), icon:"bi-cash-stack", cls:"text-danger"},
            {label:t("dashboard.profit"), value:formatCurrency(summary.profit), icon:"bi-wallet2", cls:"text-primary"}]
            .map((c,i)=> (
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

        <div className="row g-3">
          <div className="col-12 col-xl-8">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-white border-0 fw-semibold">{t("dashboard.revenueTrend")}</div>
              <div className="card-body">
                {loading && <div className="text-center py-4"><div className="spinner-border text-primary" /></div>}
                {!loading && (
                  <div className="d-flex align-items-end" style={{ height: 220, gap: 6, overflowX: 'auto' }}>
                    {trend.map((d, i) => {
                      const h = Math.max(6, Math.round((d.revenue / maxRevenue) * 200));
                      const label = period === 'day' ? new Date(d.date).getHours()+':00' : (new Date(d.date).getMonth()+1)+'/'+new Date(d.date).getFullYear();
                      return (
                        <div key={i} className="text-center" style={{ width: 22 }}>
                          <div className={`bg-${theme}`} style={{ height: h, borderRadius: 4 }} title={`${formatCurrency(d.revenue)} (${label})`} />
                          <small className="text-muted d-block mt-1" style={{ fontSize: 10 }}>{label}</small>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Activity feed pinned on the right */}
          <div className="col-12 col-xl-4">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-white border-0 fw-semibold">{t("dashboard.activity")}</div>
              <div className="card-body" style={{ maxHeight: 320, overflowY: 'auto' }}>
                {activities.length === 0 && <div className="text-muted text-center py-3">{t("common.noData")}</div>}
                <ul className="list-group list-group-flush">
                  {activities.map((a, i) => (
                    <li key={i} className="list-group-item">
                      <div className="d-flex justify-content-between">
                        <div>
                          <span className="badge bg-light text-dark border me-2">{a.action}</span>
                          <span className="fw-semibold">{a.user}</span>
                        </div>
                        <small className="text-muted">{formatters.date.toDisplay(a.time)}</small>
                      </div>
                      {a.detail && <div className="small text-muted mt-1">{a.detail}</div>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-3 mt-1">
          <div className="col-12 col-xl-6">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-white border-0 fw-semibold">{t("dashboard.topProducts")}</div>
              <div className="card-body">
                {/* Mini chart */}
                {topProducts.map((p, i) => (
                  <div key={p.barcode || i} className="d-flex align-items-center mb-2">
                    <div className="text-truncate" style={{ width: 120 }} title={p.name || p.productName}>{p.name || p.productName}</div>
                    <div className="flex-grow-1 mx-2 bg-light rounded" style={{ height: 8 }}>
                      <div className={`bg-${theme} rounded`} style={{ width: `${Math.round(((p.revenue||0)/maxProdRevenue)*100)}%`, height: 8 }}></div>
                    </div>
                    <small className="text-muted">{formatCurrency(p.revenue || 0)}</small>
                  </div>
                ))}
                <div className="table-responsive rounded-3 mt-3" style={{ borderRadius: 16, overflow: "hidden", paddingRight: 8, paddingBottom: 8, backgroundColor: "#fff" }}>
                  <div style={{ maxHeight: "60vh", overflowX: "auto", overflowY: "auto", borderRadius: 12 }}>
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 2 }}>
                      <tr>
                        <th>#</th><th>{t("products.name")}</th><th className="text-end">{t("dashboard.revenue")}</th><th className="text-end">SL</th>
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
                        <tr><td colSpan={4} className="text-center text-muted py-3">{t("common.noData")}</td></tr>
                      )}
                    </tbody>
                  </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-xl-6">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-white border-0 fw-semibold">{t("dashboard.topCustomers")}</div>
              <div className="card-body">
                {/* Mini chart */}
                {topCustomers.map((c, i) => (
                  <div key={c.phone || i} className="d-flex align-items-center mb-2">
                    <div className="text-truncate" style={{ width: 120 }} title={c.name || c.fullName}>{c.name || c.fullName}</div>
                    <div className="flex-grow-1 mx-2 bg-light rounded" style={{ height: 8 }}>
                      <div className={`bg-${theme} rounded`} style={{ width: `${Math.round(((c.revenue||0)/maxCustRevenue)*100)}%`, height: 8 }}></div>
                    </div>
                    <small className="text-muted">{formatCurrency(c.revenue || 0)}</small>
                  </div>
                ))}
                <div className="table-responsive rounded-3 mt-3" style={{ borderRadius: 16, overflow: "hidden", paddingRight: 8, paddingBottom: 8, backgroundColor: "#fff" }}>
                  <div style={{ maxHeight: "60vh", overflowX: "auto", overflowY: "auto", borderRadius: 12 }}>
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 2 }}>
                      <tr>
                        <th>#</th><th>{t("customer.fullName")}</th><th>{t("customer.phoneNumber")}</th><th className="text-end">{t("dashboard.revenue")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topCustomers.map((c, i) => (
                        <tr key={c.phone || i}>
                          <td>{i + 1}</td>
                          <td>{c.name || c.fullName}</td>
                          <td>{c.phone}</td>
                          <td className="text-end">{formatCurrency(c.revenue || 0)}</td>
                        </tr>
                      ))}
                      {topCustomers.length === 0 && (
                        <tr><td colSpan={4} className="text-center text-muted py-3">{t("common.noData")}</td></tr>
                      )}
                    </tbody>
                  </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}






