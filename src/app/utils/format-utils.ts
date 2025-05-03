/**
 * Format a number as currency
 * @param value Number to format
 * @param currency Currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, currency = "USD"): string {
  // Handle large numbers (billions)
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`
  }

  // Handle millions
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`
  }

  // Handle thousands
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`
  }

  // Format regular numbers
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: value >= 1 ? 2 : 4,
    maximumFractionDigits: value >= 1 ? 2 : 4,
  }).format(value)
}

/**
 * Format a number as percentage
 * @param value Number to format (e.g., 0.0567 for 5.67%)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number): string {
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`
}

/**
 * Format a date
 * @param date Date to format
 * @param format Format style
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, format: "short" | "medium" | "long" = "medium"): string {
  const dateObj = typeof date === "string" ? new Date(date) : date

  switch (format) {
    case "short":
      return dateObj.toLocaleDateString()
    case "long":
      return dateObj.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    case "medium":
    default:
      return dateObj.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
  }
}
