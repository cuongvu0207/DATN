import React, { useState, useEffect, useMemo } from "react";
import MainLayout from "../layouts/MainLayout";
import { useTranslation } from "react-i18next";
import axios from "axios";

import { exportInvoicesToExcel } from "../utils/exportInvoicesUtils";
import InvoiceHeaderBar from "../components/invoice/InvoiceHeaderBar";
import InvoiceFilterPanel from "../components/invoice/InvoiceFilterPanel";
import InvoiceTable from "../components/invoice/InvoiceTable";
import { API_BASE_URL } from "../services/api";

// Component Modal hiển thị chi tiết hoá đơn
const InvoiceDetailModal = ({ invoice, onClose, t }) => {
  if (!invoice) return null;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  // Hàm dịch phương thức thanh toán
  const translatePaymentMethod = (method) => {
    if (!method) return t("paymentMethod.unknown", "Không xác định");
    
    const methodLower = method.toLowerCase();
    
    if (methodLower.includes('cash') || methodLower === 'cash') {
      return t("paymentMethod.cash", "Tiền mặt");
    } else if (methodLower.includes('bank') || methodLower === 'bank' || methodLower.includes('transfer')) {
      return t("paymentMethod.bank", "Chuyển khoản");
    } else if (methodLower.includes('card') || methodLower.includes('credit')) {
      return t("paymentMethod.card", "Thẻ thanh toán");
    } else if (methodLower.includes('momo') || methodLower.includes('zalopay') || methodLower.includes('vnpay')) {
      return t("paymentMethod.eWallet", "Ví điện tử");
    }
    
    return method;
  };

  // Hàm dịch trạng thái
  const translateStatus = (status) => {
    if (status === 'COMPLETED') return t("status.completed", "Hoàn thành");
    if (status === 'PENDING') return t("status.pending", "Đang xử lý");
    if (status === 'CANCELLED') return t("status.cancelled", "Đã hủy");
    return status;
  };

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-receipt me-2"></i>
              {t("invoice.detail.title")} - {invoice.id}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            <div className="row">
              {/* Thông tin hoá đơn */}
              <div className="col-md-6">
                <div className="card mb-3">
                  <div className="card-header bg-light">
                    <h6 className="mb-0">{t("invoice.detail.info")}</h6>
                  </div>
                  <div className="card-body">
                    <div className="row mb-2">
                      <div className="col-5 text-muted">{t("invoice.table.id")}:</div>
                      <div className="col-7 fw-semibold">{invoice.id}</div>
                    </div>
                    <div className="row mb-2">
                      <div className="col-5 text-muted">{t("invoice.table.customer")}:</div>
                      <div className="col-7">{invoice.customer}</div>
                    </div>
                    <div className="row mb-2">
                      <div className="col-5 text-muted">{t("invoice.table.phone")}:</div>
                      <div className="col-7">{invoice.phone || "N/A"}</div>
                    </div>
                    <div className="row mb-2">
                      <div className="col-5 text-muted">{t("invoice.table.status")}:</div>
                      <div className="col-7">
                        <span className={`badge bg-${invoice.status === 'COMPLETED' ? 'success' : invoice.status === 'CANCELLED' ? 'danger' : 'warning'}`}>
                          {translateStatus(invoice.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thông tin thanh toán */}
              <div className="col-md-6">
                <div className="card mb-3">
                  <div className="card-header bg-light">
                    <h6 className="mb-0">{t("invoice.detail.payment")}</h6>
                  </div>
                  <div className="card-body">
                    <div className="row mb-2">
                      <div className="col-5 text-muted">{t("invoice.table.paymentMethod")}:</div>
                      <div className="col-7">
                        <span className="badge bg-info">
                          {translatePaymentMethod(invoice.paymentMethod)}
                        </span>
                      </div>
                    </div>
                    <div className="row mb-2">
                      <div className="col-5 text-muted">{t("invoice.table.total")}:</div>
                      <div className="col-7 fw-bold text-primary">
                        {formatCurrency(invoice.total)}
                      </div>
                    </div>
                    <div className="row mb-2">
                      <div className="col-5 text-muted">{t("invoice.table.createdAt")}:</div>
                      <div className="col-7">{invoice.createdAt}</div>
                    </div>
                    <div className="row mb-2">
                      <div className="col-5 text-muted">{t("invoice.table.seller")}:</div>
                      <div className="col-7">{invoice.seller}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chi tiết sản phẩm */}
            <div className="card">
              <div className="card-header bg-light">
                <h6 className="mb-0">{t("invoice.detail.items")}</h6>
              </div>
              <div className="card-body">
                {invoice.items && invoice.items.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-sm table-hover">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>{t("invoice.detail.productName")}</th>
                          <th className="text-end">{t("invoice.detail.quantity")}</th>
                          <th className="text-end">{t("invoice.detail.price")}</th>
                          <th className="text-end">{t("invoice.detail.subtotal")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.items.map((item, index) => (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td>
                              <div className="fw-semibold">{item.productName}</div>
                              {item.barcode && (
                                <div className="small text-muted">{item.barcode}</div>
                              )}
                            </td>
                            <td className="text-end">{item.quantity}</td>
                            <td className="text-end">
                              {formatCurrency(item.price)}
                            </td>
                            <td className="text-end fw-semibold">
                              {formatCurrency(item.subTotal || (item.price * item.quantity))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="4" className="text-end fw-bold">
                            {t("invoice.table.total")}:
                          </td>
                          <td className="text-end fw-bold text-primary">
                            {formatCurrency(invoice.total)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="text-center text-muted py-3">
                    <i className="bi bi-box-seam fs-1 mb-2"></i>
                    <p>{t("invoice.detail.noItems")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              {t("common.close")}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                // Tạo cửa sổ in
                const printContent = document.createElement('div');
                printContent.innerHTML = `
                  <style>
                    @media print {
                      body { font-family: Arial, sans-serif; }
                      .invoice-header { text-align: center; margin-bottom: 20px; }
                      .invoice-details { margin-bottom: 20px; }
                      .invoice-table { width: 100%; border-collapse: collapse; }
                      .invoice-table th, .invoice-table td { border: 1px solid #ddd; padding: 8px; }
                      .invoice-table th { background-color: #f2f2f2; }
                      .text-right { text-align: right; }
                      .text-center { text-align: center; }
                      .total-row { font-weight: bold; }
                    }
                  </style>
                  <div class="invoice-header">
                    <h2>${t("invoice.detail.title")}</h2>
                    <h3>${invoice.id}</h3>
                  </div>
                  <div class="invoice-details">
                    <p><strong>${t("invoice.table.customer")}:</strong> ${invoice.customer}</p>
                    <p><strong>${t("invoice.table.phone")}:</strong> ${invoice.phone || "N/A"}</p>
                    <p><strong>${t("invoice.table.createdAt")}:</strong> ${invoice.createdAt}</p>
                    <p><strong>${t("invoice.table.paymentMethod")}:</strong> ${translatePaymentMethod(invoice.paymentMethod)}</p>
                  </div>
                  <table class="invoice-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>${t("invoice.detail.productName")}</th>
                        <th class="text-right">${t("invoice.detail.quantity")}</th>
                        <th class="text-right">${t("invoice.detail.price")}</th>
                        <th class="text-right">${t("invoice.detail.subtotal")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${invoice.items && invoice.items.length > 0 ? 
                        invoice.items.map((item, index) => `
                          <tr>
                            <td class="text-center">${index + 1}</td>
                            <td>${item.productName}</td>
                            <td class="text-right">${item.quantity}</td>
                            <td class="text-right">${formatCurrency(item.price)}</td>
                            <td class="text-right">${formatCurrency(item.subTotal || (item.price * item.quantity))}</td>
                          </tr>
                        `).join('') : 
                        `<tr><td colspan="5" class="text-center">${t("invoice.detail.noItems")}</td></tr>`
                      }
                    </tbody>
                    <tfoot>
                      <tr class="total-row">
                        <td colspan="4" class="text-right"><strong>${t("invoice.table.total")}:</strong></td>
                        <td class="text-right">${formatCurrency(invoice.total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                `;
                
                const printWindow = window.open('', '_blank');
                printWindow.document.write(`
                  <html>
                    <head>
                      <title>${t("invoice.detail.title")} - ${invoice.id}</title>
                    </head>
                    <body>
                      ${printContent.innerHTML}
                      <script>
                        window.onload = function() {
                          window.print();
                          window.onafterprint = function() {
                            window.close();
                          };
                        };
                      </script>
                    </body>
                  </html>
                `);
                printWindow.document.close();
              }}
            >
              <i className="bi bi-printer me-1"></i>
              {t("invoice.detail.print")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function InvoiceListPage() {
  const { t } = useTranslation();
  const token = localStorage.getItem("accessToken");

  const [invoices, setInvoices] = useState([]);
  const [customerList, setCustomerList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [query, setQuery] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInvoices, setSelectedInvoices] = useState([]);

  const [filters, setFilters] = useState({
    status: "",
    paymentMethod: "",
    seller: "",
    createdAt: "",
  });

  // Hàm dịch phương thức thanh toán
  const translatePaymentMethod = (method) => {
    if (!method) return t("paymentMethod.unknown", "Không xác định");
    
    const methodLower = method.toLowerCase();
    
    if (methodLower.includes('cash') || methodLower === 'cash') {
      return t("paymentMethod.cash", "Tiền mặt");
    } else if (methodLower.includes('bank') || methodLower === 'bank' || methodLower.includes('transfer')) {
      return t("paymentMethod.bank", "Chuyển khoản");
    } else if (methodLower.includes('card') || methodLower.includes('credit')) {
      return t("paymentMethod.card", "Thẻ thanh toán");
    } else if (methodLower.includes('momo') || methodLower.includes('zalopay') || methodLower.includes('vnpay')) {
      return t("paymentMethod.eWallet", "Ví điện tử");
    }
    
    return method;
  };

  // Hàm dịch trạng thái
  const translateStatus = (status) => {
    if (status === 'COMPLETED') return t("status.completed", "Hoàn thành");
    if (status === 'PENDING') return t("status.pending", "Đang xử lý");
    if (status === 'CANCELLED') return t("status.cancelled", "Đã hủy");
    return status;
  };

  // Hàm fetch chi tiết hoá đơn
  const fetchInvoiceDetail = async (invoiceId) => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/order/${invoiceId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const invoiceData = res.data;
      const customer = getCustomerInfo(invoiceData.customerId);
      const staff = staffList.find((s) => s.username === invoiceData.cashierId);
      
      return {
        id: invoiceData.orderId,
        customer: customer.name,
        phone: customer.phone,
        total: Number(invoiceData.totalPrice || 0),
        paymentMethod: translatePaymentMethod(invoiceData.paymentMethod),
        status: translateStatus(invoiceData.status),
        createdAt: new Date(invoiceData.createdAt).toLocaleString("vi-VN", { hour12: false }),
        seller: staff?.fullName || invoiceData.cashierId || "unknown",
        items: invoiceData.orderItemDTOs || []
      };
    } catch (err) {
      console.error("Failed to fetch invoice detail", err);
      return null;
    }
  };

  // Xử lý click vào hoá đơn
  const handleInvoiceClick = async (invoice) => {
    const detail = await fetchInvoiceDetail(invoice.id);
    if (detail) {
      setSelectedInvoice(detail);
    }
  };

  const closeModal = () => {
    setSelectedInvoice(null);
  };

  /* =====================================
     1) LOAD CUSTOMER LIST
  ===================================== */
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/customer`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCustomerList(res.data || []);
      } catch (err) {
        console.error("Failed to fetch customers", err);
      }
    };
    fetchCustomers();
  }, [token]);

  const getCustomerInfo = (customerId) => {
    if (!customerId || customerId === "default_customer_id") {
      return { name: t("customer.walkIn", "Khách lẻ"), phone: "" };
    }
    const found = customerList.find((c) => c.id === customerId);
    return found
      ? { 
          name: found.name || found.fullName || t("customer.defaultName", "Khách hàng"), 
          phone: found.phone || found.phoneNumber || "" 
        }
      : { name: t("customer.defaultName", "Khách hàng"), phone: "" };
  };

  /* =====================================
     2) LOAD STAFF LIST
  ===================================== */
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/auth/users/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStaffList(res.data || []);
      } catch (err) {
        console.error("Failed to fetch staff", err);
      }
    };
    fetchStaff();
  }, [token]);

  /* =====================================
     3) MAP SELLER LIST CHO BỘ LỌC
  ===================================== */
  const sellerList = useMemo(() => {
    const usernames = [...new Set(invoices.map((i) => i.seller))];

    return usernames.map((username) => {
      const staff = staffList.find((s) => s.username === username);
      return {
        value: username,
        label: staff?.fullName || staff?.username || username,
      };
    });
  }, [invoices, staffList]);

  /* =====================================
     4) LOAD INVOICES — chỉ fetch sau khi có customers
  ===================================== */
  useEffect(() => {
    if (customerList.length === 0) return;

    const fetchInvoices = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/order/static/all`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const raw = Array.isArray(res.data) ? res.data : [];

        const mapped = raw
          .map((item) => {
            const customer = getCustomerInfo(item.customerId);
            const dateObj = new Date(item.createdAt);
            const staff = staffList.find((s) => s.username === item.cashierId);

            return {
              id: item.orderId,
              customer: customer.name,
              phone: customer.phone,
              total: Number(item.totalPrice || 0),
              paymentMethod: translatePaymentMethod(item.paymentMethod),
              status: translateStatus(item.status),
              createdAt: dateObj.toLocaleString("vi-VN", { hour12: false }),
              createdAtRaw: dateObj.getTime(), 
              seller: staff?.fullName || item.cashierId || "unknown",
              originalStatus: item.status,
              originalPaymentMethod: item.paymentMethod
            };
          })
          .sort((a, b) => b.createdAtRaw - a.createdAtRaw); 

        setInvoices(mapped);
      } catch (err) {
        console.error("Failed to fetch invoices", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [token, customerList, staffList]);

  /* =====================================
     5) FILTER
  ===================================== */
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const filtered = invoices.filter((inv) => {
    const q = query.toLowerCase();

    const matchQuery =
      inv.id.toLowerCase().includes(q) ||
      inv.customer.toLowerCase().includes(q) ||
      inv.phone.includes(q);

    const matchStatus = !filters.status || inv.originalStatus === filters.status;
    const matchPayment = !filters.paymentMethod || inv.originalPaymentMethod === filters.paymentMethod;
    const matchSeller = !filters.seller || inv.seller === filters.seller;

    const matchDate =
      !filters.createdAt ||
      inv.createdAt.startsWith(
        new Date(filters.createdAt).toLocaleDateString("vi-VN")
      );

    return matchQuery && matchStatus && matchPayment && matchSeller && matchDate;
  });

  /* =====================================
     6) RENDER
  ===================================== */
  return (
    <MainLayout>
      <div className="container-fluid py-3">
        {/* HEADER BAR */}
        <InvoiceHeaderBar
          query={query}
          setQuery={setQuery}
          onExport={() => exportInvoicesToExcel(filtered, t)}
        />

        <div className="row g-3 mt-1">
          {/* FILTER PANEL */}
          <InvoiceFilterPanel
            filters={filters}
            onChange={handleFilterChange}
            sellerList={sellerList}
            translatePaymentMethod={translatePaymentMethod}
            translateStatus={translateStatus}
          />

          {/* DATA TABLE - Thêm onInvoiceClick */}
          <InvoiceTable
            invoices={filtered}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            selectedInvoices={selectedInvoices}
            onSelectOne={(id) =>
              setSelectedInvoices((prev) =>
                prev.includes(id)
                  ? prev.filter((x) => x !== id)
                  : [...prev, id]
              )
            }
            onSelectAll={(checked, items) => {
              const ids = items.map((i) => i.id);
              setSelectedInvoices((prev) =>
                checked
                  ? [...new Set([...prev, ...ids])]
                  : prev.filter((id) => !ids.includes(id))
              );
            }}
            loading={loading}
            onInvoiceClick={handleInvoiceClick}
          />
        </div>

        {/* MODAL CHI TIẾT HOÁ ĐƠN */}
        {selectedInvoice && (
          <InvoiceDetailModal
            invoice={selectedInvoice}
            onClose={closeModal}
            t={t}
          />
        )}
      </div>
    </MainLayout>
  );
}