// utils/format.ts
import getSymbolFromCurrency from "currency-symbol-map";

export const formatCurrency = (
  currencyCode: string,
  amount: number | string
): string => {
  const numericValue =
    typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(numericValue)) return "0.00";

  try {
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 20, // keep all decimals from API
    }).format(numericValue);

    // Check if it included symbol or just currency code (AFN issue)
    if (formatted.includes(currencyCode)) {
      const symbol = getSymbolFromCurrency(currencyCode) || currencyCode;
      return `${symbol} ${numericValue}`;
    }

    return formatted;
  } catch {
    const symbol = getSymbolFromCurrency(currencyCode) || currencyCode;
    return `${symbol} ${numericValue}`;
  }
};
 