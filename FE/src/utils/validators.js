export const isValidCurrency = (v) => /^(\d{1,15})(\.\d{3})*$/.test(String(v));

export const isValidDate = (v) => /^(0?[1-9]|[12][0-9]|3[01])\/(0?[1-9]|1[012])\/\d{4}$/.test(String(v));

export const isValidNumber = (v) => /^\d+$/.test(String(v));

export const isValidDecimal = (v) => /^\d+(\.\d{1,2})?$/.test(String(v));

export const validators = {
  currency: isValidCurrency,
  date: isValidDate,
  number: isValidNumber,
  decimal: isValidDecimal,
};

