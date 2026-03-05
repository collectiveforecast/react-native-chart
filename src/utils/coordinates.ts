import { Kline } from '../types'
import { TOP_PADDING_PX } from './constants'

/**
 * Calculate min and max prices from candle data
 */
export function calculatePriceRange(
  data: Kline[],
  startIdx: number,
  endIdx: number,
): { min: number; max: number } {
  'worklet'

  if (data.length === 0) {
    return { min: 0, max: 100 }
  }

  const start = Math.max(0, startIdx)
  const end = Math.min(data.length, endIdx)

  let min = Infinity
  let max = -Infinity

  for (let i = start; i < end; i++) {
    const candle = data[i]
    if (candle) {
      min = Math.min(min, candle.low)
      max = Math.max(max, candle.high)
    }
  }

  // Add 0.5% padding to price range (reduced from 2% to prevent gaps in grid coverage)
  const padding = (max - min) * 0.005
  min -= padding
  max += padding

  return { min, max }
}

/**
 * Convert price to Y coordinate
 */
export function priceToY(
  price: number,
  minPrice: number,
  maxPrice: number,
  height: number,
): number {
  'worklet'

  const priceRange = maxPrice - minPrice
  if (priceRange === 0) return height / 2 + TOP_PADDING_PX

  return height - ((price - minPrice) / priceRange) * height + TOP_PADDING_PX
}

/**
 * Convert an arbitrary value to Y coordinate inside a pane.
 * Unlike `priceToY`, this function does NOT add `TOP_PADDING_PX`.
 */
export function valueToY(
  value: number,
  min: number,
  max: number,
  height: number,
  yOffset: number,
): number {
  'worklet'

  const span = max - min
  const raw =
    span === 0
      ? yOffset + height / 2
      : yOffset + height - ((value - min) / span) * height

  // Clamp to pane bounds to avoid visible overflow (stroke/text may still extend a bit).
  return Math.max(yOffset, Math.min(yOffset + height, raw))
}

/**
 * Convert an arbitrary value to Y coordinate inside a pane (without clamping).
 * Useful for visibility checks to avoid collapsing multiple values to same edge.
 */
export function valueToYRaw(
  value: number,
  min: number,
  max: number,
  height: number,
  yOffset: number,
): number {
  'worklet'

  const span = max - min
  const raw =
    span === 0
      ? yOffset + height / 2
      : yOffset + height - ((value - min) / span) * height

  return raw
}

/**
 * Convert Y coordinate to price
 */
export function yToPrice(
  y: number,
  minPrice: number,
  maxPrice: number,
  height: number,
): number {
  'worklet'

  const priceRange = maxPrice - minPrice
  return minPrice + ((height - (y - TOP_PADDING_PX)) / height) * priceRange
}

/**
 * Calculate X coordinate for a candle index
 */
export function indexToX(
  index: number,
  candleWidth: number,
  translateX: number,
): number {
  'worklet'

  return index * candleWidth + translateX
}

/**
 * Calculate candle index from X coordinate
 */
export function xToIndex(
  x: number,
  candleWidth: number,
  translateX: number,
): number {
  'worklet'

  return Math.floor((x - translateX) / candleWidth)
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  'worklet'

  if (!Number.isFinite(price)) return '0'
  if (price === 0) return '0'

  const abs = Math.abs(price)
  const sign = price < 0 ? '-' : ''

  const trimZeros = (s: string) =>
    s.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')
  const formatFixed = (n: number, decimals: number) =>
    `${sign}${trimZeros(n.toFixed(decimals))}`

  if (abs >= 1000) return formatFixed(abs, 2)
  if (abs >= 1) return formatFixed(abs, 3)
  if (abs >= 0.01) return formatFixed(abs, 4)
  if (abs >= 0.000001) return formatFixed(abs, 8)
  return formatFixed(abs, 10)
}

/**
 * Calculate visible candle range
 */
export function calculateVisibleRange(
  translateX: number,
  candleWidth: number,
  width: number,
  totalCandles: number,
  buffer: number,
): { start: number; end: number } {
  'worklet'

  const startIdx = Math.floor(-translateX / candleWidth) - buffer
  const visibleCount = Math.ceil(width / candleWidth) + buffer * 2
  const endIdx = startIdx + visibleCount

  return {
    start: Math.max(0, startIdx),
    end: Math.min(totalCandles, endIdx),
  }
}

export function snapToCandle(
  x: number,
  candleWidth: number,
  translateX: number,
  totalCandles: number,
): number {
  'worklet'
  // Convert X to candle index
  let index = xToIndex(x, candleWidth, translateX)

  // Clamp index to valid range
  index = Math.max(0, Math.min(totalCandles - 1, index))

  // Convert back to X coordinate at candle center
  return indexToX(index, candleWidth, translateX) + candleWidth / 2
}
