import React from "react";
import { useTranslation } from "react-i18next";

export default function DropdownFilter({ value, onChange }) {
  const { t } = useTranslation();
  return (
    <select
      className="form-select w-auto"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="today">{t("filters.today")}</option>
      <option value="yesterday">{t("filters.yesterday")}</option>
      <option value="7days">{t("filters.last7days")}</option>
      <option value="month">{t("filters.thisMonth")}</option>
      <option value="lastMonth">{t("filters.lastMonth")}</option>
    </select>
  );
}
