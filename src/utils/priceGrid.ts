import {
  GRID_HYSTERESIS_LOWER,
  GRID_HYSTERESIS_UPPER,
  INDICATOR_MAX_GRID_PIXEL_STEP,
  INDICATOR_MIN_GRID_PIXEL_STEP,
  INDICATOR_TARGET_GRID_PIXEL_STEP,
  MAX_GRID_PIXEL_STEP,
  MIN_GRID_PIXEL_STEP,
  TARGET_GRID_PIXEL_STEP,
} from './constants'

/**
 * Convert a number to a "nice" number (1, 2, 5 × 10^n)
 * Used for generating human-readable grid intervals
 */
function calculateNiceNumber(range: number, round: boolean): number {
  'worklet'

  if (range <= 0) return 1

  // Get magnitude (power of 10)
  const exponent = Math.floor(Math.log10(range))
  const fraction = range / Math.pow(10, exponent)

  // Round to nice number: 1, 2, or 5
  let niceFraction: number
  if (round) {
    if (fraction < 1.5) niceFraction = 1
    else if (fraction < 3) niceFraction = 2
    else if (fraction < 7) niceFraction = 5
    else niceFraction = 10
  } else {
    if (fraction <= 1) niceFraction = 1
    else if (fraction <= 2) niceFraction = 2
    else if (fraction <= 5) niceFraction = 5
    else niceFraction = 10
  }

  return niceFraction * Math.pow(10, exponent)
}

/**
 * Calculate adaptive grid step based on price range and height
 * Uses nice numbers (1, 2, 5 × 10^n) for human-readable intervals
 */
export function calculateGridStep(priceRange: number, height: number): number {
  'worklet'

  if (priceRange <= 0 || height <= 0) return 1

  // Calculate ideal tick count based on pixel spacing
  const idealTickCount = Math.floor(height / TARGET_GRID_PIXEL_STEP)

  if (idealTickCount <= 0) return priceRange

  // Calculate raw step
  const rawStep = priceRange / idealTickCount

  // Convert to nice number
  const niceStep = calculateNiceNumber(rawStep, true)

  // Safety check with hysteresis to prevent flickering
  const resultingPixelStep = (niceStep / priceRange) * height

  // Apply correction only if significantly outside acceptable range
  if (resultingPixelStep < MIN_GRID_PIXEL_STEP * GRID_HYSTERESIS_LOWER) {
    // Way too many lines - increase step
    return calculateNiceNumber(rawStep * 2, true)
  } else if (resultingPixelStep > MAX_GRID_PIXEL_STEP * GRID_HYSTERESIS_UPPER) {
    // Way too few lines - decrease step
    return calculateNiceNumber(rawStep / 2, true)
  }

  return niceStep
}

export function calculateIndicatorGridStep(
  valueRange: number,
  height: number,
): number {
  'worklet'

  if (valueRange <= 0 || height <= 0) return 1

  const idealTickCount = Math.floor(height / INDICATOR_TARGET_GRID_PIXEL_STEP)
  if (idealTickCount <= 0) return valueRange

  const rawStep = valueRange / idealTickCount
  const niceStep = calculateNiceNumber(rawStep, true)

  const resultingPixelStep = (niceStep / valueRange) * height

  if (
    resultingPixelStep <
    INDICATOR_MIN_GRID_PIXEL_STEP * GRID_HYSTERESIS_LOWER
  ) {
    return calculateNiceNumber(rawStep * 2, true)
  } else if (
    resultingPixelStep >
    INDICATOR_MAX_GRID_PIXEL_STEP * GRID_HYSTERESIS_UPPER
  ) {
    return calculateNiceNumber(rawStep / 2, true)
  }

  return niceStep
}

/**
 * Generate array of price levels for grid lines
 * Lines are anchored to price values and move with the chart
 */
export function generatePriceLevels(
  minPrice: number,
  maxPrice: number,
  height: number,
): number[] {
  'worklet'

  const priceRange = maxPrice - minPrice
  if (priceRange <= 0) return []

  const priceStep = calculateGridStep(priceRange, height)
  if (priceStep <= 0) return []

  // Start from a price level below minPrice (aligned to step)
  const startPrice = Math.floor(minPrice / priceStep) * priceStep
  const levels: number[] = []

  // Generate levels with larger buffer (5 steps) to ensure full coverage at all zoom levels
  const BUFFER_STEPS = 5
  for (
    let price = startPrice - priceStep * BUFFER_STEPS;
    price <= maxPrice + priceStep * BUFFER_STEPS;
    price += priceStep
  ) {
    levels.push(price)
  }

  return levels
}

/**
 * Generate array of indicator value levels for grid lines.
 * Uses indicator-specific pixel spacing constants and supports negative values.
 */
export function generateIndicatorLevels(
  minValue: number,
  maxValue: number,
  height: number,
): number[] {
  'worklet'

  const valueRange = maxValue - minValue
  if (!Number.isFinite(valueRange) || valueRange <= 0) return []

  const step = calculateIndicatorGridStep(valueRange, height)
  if (!Number.isFinite(step) || step <= 0) return []

  const start = Math.floor(minValue / step) * step
  const levels: number[] = []

  const BUFFER_STEPS = 4
  const epsilon = step * 1e-6

  for (
    let v = start - step * BUFFER_STEPS;
    v <= maxValue + step * BUFFER_STEPS;
    v += step
  ) {
    // Avoid rendering "-0.00" labels due to floating point noise.
    if (Math.abs(v) < epsilon) {
      levels.push(0)
    } else {
      levels.push(v)
    }
  }

  return levels
}
