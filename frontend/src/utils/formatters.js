/**
 * Agricultural and Financial Formatting Utilities
 */

/**
 * Format currency in Indian Rupees (INR)
 * @param {number} amount
 * @returns {string}
 */
export function formatINR(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format weight in Quintals or Kilograms
 * @param {number} weightKg
 * @returns {string}
 */
export function formatWeight(weightKg) {
  if (!weightKg) return '0 Qtl';
  const quintals = weightKg / 100;
  return `${quintals.toFixed(1)} Qtl (${weightKg} kg)`;
}
