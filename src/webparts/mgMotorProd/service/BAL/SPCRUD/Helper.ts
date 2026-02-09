import { useEffect, useState } from "react";

export const sanitize = (obj: any) =>
  Object.fromEntries(
    Object.entries(obj || {}).filter(
      ([_, v]) => v !== null && v !== undefined
    )
  );

export const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // This gives dd/mm/yyyy format
};

export const parseAmount = (value) => {
  if (value == null) return 0;

  return Number(String(value).replace(/,/g, ''));
};

export const formatAmount = (value: any): string => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const num = Number(value);

  if (isNaN(num)) {
    return "-";
  }

  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const ConvertDatetoInputValue = (dateValue) => {
  if (!dateValue) return '';

  const date = new Date(dateValue);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
};

export const dateInputToISO = (dateValue) => {
  if (!dateValue) return null;

  const [y, m, d] = dateValue.split('-');
  return new Date(y, m - 1, d).toISOString();
};


export const useDebounce = <T>(value: T, delay = 500): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}