export const formatCurrency = (amount: number | string, currency = "NPR") => {
  const value =
    typeof amount === "string" ? parseFloat(amount) : Number(amount);

  // Handle NPR specifically if needed, or rely on Intl
  return new Intl.NumberFormat("en-NP", {
    // 'en-NP' formats nicely for Nepal
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0, // NPR usually doesn't need cents visually in lists
    maximumFractionDigits: 2,
  }).format(value);
};

export const CURRENCIES = [
  { code: "NPR", label: "NPR (Rs.)" }, // Moved to top
  { code: "USD", label: "USD ($)" },
  { code: "EUR", label: "EUR (€)" },
  { code: "INR", label: "INR (₹)" },
];
