// utils/pricing.ts
// Utility functions for bulk discount price calculations

interface BulkDiscountTier {
  min_quantity: number;
  discount_percent: number;
}

/**
 * Get the applicable discount percentage for a given quantity
 * @param bulkDiscountTiers - Array of discount tiers (max 2)
 * @param quantity - Order quantity
 * @returns Discount percentage (0-100) or 0 if no discount applies
 */
export function getBulkDiscountPercent(
  bulkDiscountTiers: BulkDiscountTier[] | null | undefined,
  quantity: number,
): number {
  if (!bulkDiscountTiers || bulkDiscountTiers.length === 0) return 0;

  // Sort tiers by min_quantity descending to find highest applicable tier
  const sortedTiers = [...bulkDiscountTiers].sort(
    (a, b) => b.min_quantity - a.min_quantity,
  );

  // Find first tier where quantity meets minimum
  const applicableTier = sortedTiers.find(
    (tier) => quantity >= tier.min_quantity,
  );

  return applicableTier ? applicableTier.discount_percent : 0;
}

/**
 * Calculate discounted price per unit
 * @param basePrice - Original price per unit
 * @param bulkDiscountTiers - Array of discount tiers
 * @param quantity - Order quantity
 * @returns Price per unit after discount
 */
export function calculateBulkPrice(
  basePrice: number,
  bulkDiscountTiers: BulkDiscountTier[] | null | undefined,
  quantity: number,
): number {
  const discountPercent = getBulkDiscountPercent(bulkDiscountTiers, quantity);

  if (discountPercent === 0) return basePrice;

  const discountMultiplier = 1 - discountPercent / 100;
  return basePrice * discountMultiplier;
}

/**
 * Calculate total price for an order with bulk discount
 * @param basePrice - Original price per unit
 * @param bulkDiscountTiers - Array of discount tiers
 * @param quantity - Order quantity
 * @returns Object with breakdown
 */
export function calculateOrderTotal(
  basePrice: number,
  bulkDiscountTiers: BulkDiscountTier[] | null | undefined,
  quantity: number,
): {
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  pricePerUnit: number;
  savings: number;
} {
  const subtotal = basePrice * quantity;
  const discountPercent = getBulkDiscountPercent(bulkDiscountTiers, quantity);
  const discountAmount = (subtotal * discountPercent) / 100;
  const total = subtotal - discountAmount;
  const pricePerUnit = calculateBulkPrice(basePrice, bulkDiscountTiers, quantity);
  const savings = subtotal - total;

  return {
    subtotal,
    discountPercent,
    discountAmount,
    total,
    pricePerUnit,
    savings,
  };
}

/**
 * Get the next discount tier the customer could unlock
 * @param bulkDiscountTiers - Array of discount tiers
 * @param currentQuantity - Current order quantity
 * @returns Next tier info or null
 */
export function getNextDiscountTier(
  bulkDiscountTiers: BulkDiscountTier[] | null | undefined,
  currentQuantity: number,
): {
  min_quantity: number;
  discount_percent: number;
  unitsToGo: number;
} | null {
  if (!bulkDiscountTiers || bulkDiscountTiers.length === 0) return null;

  // Sort tiers by min_quantity ascending
  const sortedTiers = [...bulkDiscountTiers].sort(
    (a, b) => a.min_quantity - b.min_quantity,
  );

  // Find first tier with higher quantity than current
  const nextTier = sortedTiers.find(
    (tier) => tier.min_quantity > currentQuantity,
  );

  if (!nextTier) return null;

  return {
    ...nextTier,
    unitsToGo: nextTier.min_quantity - currentQuantity,
  };
}

/**
 * Format discount tier for display
 * @param tier - Discount tier
 * @param unit - Product unit (kg, pieces, etc.)
 * @returns Formatted string like "Buy 10+ kg, get 10% off"
 */
export function formatDiscountTier(
  tier: BulkDiscountTier,
  unit: string,
): string {
  return `Buy ${tier.min_quantity}+ ${unit}, get ${tier.discount_percent}% off`;
}

/**
 * Check if quantity qualifies for any discount
 * @param bulkDiscountTiers - Array of discount tiers
 * @param quantity - Order quantity
 * @returns true if discount applies
 */
export function hasActiveDiscount(
  bulkDiscountTiers: BulkDiscountTier[] | null | undefined,
  quantity: number,
): boolean {
  return getBulkDiscountPercent(bulkDiscountTiers, quantity) > 0;
}

/**
 * Get the best possible discount percentage (highest tier)
 * @param bulkDiscountTiers - Array of discount tiers
 * @returns Maximum discount percentage available
 */
export function getBestDiscount(
  bulkDiscountTiers: BulkDiscountTier[] | null | undefined,
): number {
  if (!bulkDiscountTiers || bulkDiscountTiers.length === 0) return 0;
  return Math.max(...bulkDiscountTiers.map((t) => t.discount_percent));
}
