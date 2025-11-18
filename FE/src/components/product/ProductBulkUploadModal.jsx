import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
import { API_BASE_URL } from "../../services/api";

export default function ProductBulkUploadModal({
  show,
  onClose,
  onFileSelect,
  onSheetImport,
  templateLink,
  isProcessing = false,
  status,
}) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [activeSource, setActiveSource] = useState(null); // "file" | "sheet"
  const [selectedFile, setSelectedFile] = useState(null);
  const [sheetUrl, setSheetUrl] = useState("");
  const [templateCategories, setTemplateCategories] = useState([]);
  const [templateBrands, setTemplateBrands] = useState([]);
  const [templateLoading, setTemplateLoading] = useState(false);
  const fileInputRef = useRef(null);
  const sheetInputRef = useRef(null);

  useEffect(() => {
    const fetchTaxonomies = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;
        const [catRes, brandRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/inventory/category`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE_URL}/inventory/brand`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setTemplateCategories(
          (catRes.data || []).map((cat, idx) => ({
            id: String(cat.categoryId ?? cat.id ?? idx),
            name: cat.categoryName ?? cat.name ?? "",
          }))
        );
        setTemplateBrands(
          (brandRes.data || []).map((brand, idx) => ({
            id: String(brand.brandId ?? brand.id ?? idx),
            name: brand.brandName ?? brand.name ?? "",
          }))
        );
      } catch (err) {
        console.error("Failed to fetch template taxonomies", err);
      }
    };

    if (!show) {
      setActiveSource(null);
      setSelectedFile(null);
      setSheetUrl("");
    } else {
      fetchTaxonomies();
    }
  }, [show]);

  const handleSelectFileClick = () => {
    setActiveSource("file");
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setActiveSource("file");
    event.target.value = "";
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    if (activeSource === "file") {
      setActiveSource(null);
    }
  };

  const handleLinkClick = () => {
    setActiveSource("sheet");
    setTimeout(() => sheetInputRef.current?.focus(), 50);
  };

  const handleSheetChange = (value) => {
    setSheetUrl(value);
    if (value && activeSource !== "sheet") {
      setActiveSource("sheet");
    }
  };

  const handleClearSheet = () => {
    setSheetUrl("");
    if (activeSource === "sheet") {
      setActiveSource(null);
    }
  };

  const confirmDisabled =
    isProcessing ||
    (activeSource === "file"
      ? !selectedFile
      : activeSource === "sheet"
      ? !sheetUrl.trim()
      : true);

  const handleDownloadTemplate = () => {
    setTemplateLoading(true);
    try {
      const headerRow = [
        t("products.barcode") || "Mã vạch",
        t("products.productName") || "Tên sản phẩm",
        t("products.category") || "Danh mục",
        t("products.brand") || "Thương hiệu",
        t("products.unit") || "Đơn vị tính",
        t("products.costOfCapital") || "Giá nhập",
        t("products.sellingPrice") || "Giá bán",
        t("products.quantityInStock") || "Tồn kho",
      ];

      const sampleRow = [
        "BARCODE001",
        "Áo thun ví dụ",
        templateCategories[0]?.name || "",
        templateBrands[0]?.name || "",
        "Cái",
        120000,
        180000,
        50,
      ];

      const formSheet = XLSX.utils.aoa_to_sheet([headerRow, sampleRow]);
      formSheet["!cols"] = headerRow.map(() => ({ wch: 20 }));

      const dataValidation = [];
      if (templateCategories.length) {
        dataValidation.push({
          sqref: "C2:C500",
          type: "list",
          allowBlank: 1,
          formula1: `=Categories!$A$2:$A$${templateCategories.length + 1}`,
        });
      }
      if (templateBrands.length) {
        dataValidation.push({
          sqref: "D2:D500",
          type: "list",
          allowBlank: 1,
          formula1: `=Brands!$A$2:$A$${templateBrands.length + 1}`,
        });
      }
      if (dataValidation.length) formSheet["!dataValidation"] = dataValidation;

      const categoriesSheet = XLSX.utils.aoa_to_sheet([
        [t("products.category") || "Danh mục"],
        ...templateCategories.map((cat) => [cat.name]),
      ]);
      const brandsSheet = XLSX.utils.aoa_to_sheet([
        [t("products.brand") || "Thương hiệu"],
        ...templateBrands.map((brand) => [brand.name]),
      ]);

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, formSheet, "Form");
      XLSX.utils.book_append_sheet(workbook, categoriesSheet, "Categories");
      XLSX.utils.book_append_sheet(workbook, brandsSheet, "Brands");

      const fileName = `form_nhap_san_pham_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (err) {
      console.error("Failed to export template", err);
    } finally {
      setTemplateLoading(false);
    }
  };

  const handleConfirm = () => {
    if (confirmDisabled) return;
    if (activeSource === "file" && selectedFile && onFileSelect) {
      onFileSelect(selectedFile);
      setSelectedFile(null);
    } else if (activeSource === "sheet" && sheetUrl.trim() && onSheetImport) {
      onSheetImport(sheetUrl.trim());
      setSheetUrl("");
    }
    setActiveSource(null);
  };

  const handleKeyActivate = (event, action) => {
    if (!action) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      action();
    }
  };

  if (!show) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center px-2"
      style={{ background: "rgba(0,0,0,0.45)", zIndex: 1060 }}
    >
      <div
        className="bg-white rounded-4 shadow-lg w-100"
        style={{ maxWidth: 560, maxHeight: "92vh", overflow: "hidden" }}
      >
        <div className="d-flex justify-content-between align-items-center border-bottom px-3 py-3">
          <div>
            <h5 className="mb-0 fw-bold">
              <i className="bi bi-cloud-arrow-up me-2" />
              {t("products.bulkUpload.title") || "Thêm sản phẩm từ file"}
            </h5>
          </div>
          <button type="button" className="btn-close shadow-none" onClick={onClose}></button>
        </div>

        <div
          className="px-3 py-3"
          style={{ maxHeight: "calc(92vh - 150px)", overflowY: "auto" }}
        >
          <p className="text-muted small mb-3">
            {t("products.bulkUpload.description") ||
              "Chọn một trong hai cách bên dưới: tải file Excel/CSV hoặc gắn link Google Sheet."}
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="d-none"
            onChange={handleFileChange}
          />

          <div className="d-flex flex-column gap-3">
            <div
              role="button"
              tabIndex={0}
              className={`w-100 border rounded-4 p-3 text-start d-flex align-items-center gap-3 ${
                activeSource === "file"
                  ? `border-${theme} bg-${theme} bg-opacity-10`
                  : "border-secondary-subtle bg-white"
              }`}
              onClick={handleSelectFileClick}
              onKeyDown={(event) => handleKeyActivate(event, handleSelectFileClick)}
            >
              <span
                className={`rounded-circle d-inline-flex align-items-center justify-content-center text-${theme}`}
                style={{ width: 40, height: 40, background: "rgba(0,0,0,0.05)" }}
              >
                <i className="bi bi-upload" />
              </span>
              <div className="w-100">
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <p className="fw-semibold mb-0 flex-grow-1">
                    {t("products.bulkUpload.uploadFile") || "Nhập bằng file Excel"}
                  </p>
                  {selectedFile && (
                    <button
                      type="button"
                      className="btn btn-link btn-sm text-decoration-none px-0"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleClearFile();
                      }}
                    >
                      {t("common.clear") || "Bỏ chọn"}
                    </button>
                  )}
                </div>
                <small className="text-muted d-block text-truncate">
                  {selectedFile
                    ? `${selectedFile.name} • ${(
                        selectedFile.size / 1024
                      ).toFixed(1)} KB`
                    : t("products.bulkUpload.selectFile") ||
                      "Nhấn để chọn file .xlsx, .xls, .csv"}
                </small>
              </div>
            </div>

            <div
              className={`w-100 border rounded-4 p-3 ${
                activeSource === "sheet"
                  ? `border-${theme} bg-${theme} bg-opacity-10`
                  : "border-secondary-subtle bg-white"
              }`}
              onClick={handleLinkClick}
            >
              <div className="d-flex align-items-center gap-3 mb-2">
                <span
                  className={`rounded-circle d-inline-flex align-items-center justify-content-center text-${theme}`}
                  style={{ width: 40, height: 40, background: "rgba(0,0,0,0.05)" }}
                >
                  <i className="bi bi-link-45deg" />
                </span>
                <div className="w-100 d-flex justify-content-between align-items-start gap-2">
                  <p className="fw-semibold mb-0 flex-grow-1">
                    {t("products.bulkUpload.sheetTitle") || "Gắn link Google Sheet"}
                  </p>
                  {sheetUrl && (
                    <button
                      type="button"
                      className="btn btn-link btn-sm text-decoration-none px-0"
                      onClick={handleClearSheet}
                    >
                      {t("common.clear") || "Bỏ chọn"}
                    </button>
                  )}
                </div>
              </div>
              <div className="input-group input-group-sm">
                <input
                  ref={sheetInputRef}
                  type="url"
                  className="form-control"
                  placeholder={
                    t("products.bulkUpload.sheetPlaceholder") ||
                    "https://docs.google.com/spreadsheets/..."
                  }
                  value={sheetUrl}
                  onChange={(e) => handleSheetChange(e.target.value)}
                  onFocus={() => setActiveSource("sheet")}
                />
              </div>
              <small className="text-muted d-block mt-2">
              </small>
            </div>
          </div>

          {status?.message && (
            <div
              className={`alert alert-${
                status.type === "error" ? "danger" : "success"
              } py-2 small mt-3`}
            >
              {status.message}
            </div>
          )}
        </div>

        <div className="d-flex justify-content-between align-items-center px-3 py-3 border-top flex-wrap gap-2">
          <button
            type="button"
            className={`btn btn-outline-${theme} d-flex align-items-center gap-2`}
            onClick={handleDownloadTemplate}
            disabled={templateLoading}
          >
            {templateLoading && (
              <span
                className="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
              />
            )}
            <i className="bi bi-filetype-xlsx" />
            <span>{t("products.downloadTemplate") || "Tải file mẫu"}</span>
          </button>
          <button
            type="button"
            className={`btn btn-${theme}`}
            onClick={handleConfirm}
            disabled={confirmDisabled}
          >
            {isProcessing && (
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              />
            )}
            {t("common.confirm") || "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
}
