const pad2 = (n) => String(n).padStart(2, "0");

export const formatCurrency = (v) => {
  if (v === null || v === undefined || v === "") return "";
  const num = typeof v === "number" ? v : Number(String(v).replace(/\./g, ""));
  if (Number.isNaN(num)) return "";
  return num.toLocaleString("vi-VN");
};

export const dateToDisplay = (iso) => {
  if (!iso) return "";
  try {
    if (iso instanceof Date) {
      const d = iso;
      return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
    }
    // Expecting YYYY-MM-DD or ISO-like
    const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) {
      return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
    }
    return "";
  } catch {
    return "";
  }
};

export const dateToISO = (display) => {
  if (!display) return "";
  const m = String(display).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return "";
  const dd = pad2(m[1]);
  const mm = pad2(m[2]);
  const yyyy = m[3];
  return `${yyyy}-${mm}-${dd}`;
};

export const formatters = {
  currency: formatCurrency,
  date: {
    toDisplay: dateToDisplay,
    toISO: dateToISO,
  },
};

