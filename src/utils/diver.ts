import type { Kline, Swing } from '../types'
import { indexToX, priceToY, valueToY } from './coordinates'

export const findNearestCandleIndexByTimestamp = (
  data: Kline[],
  timestamp: number,
) => {
  'worklet'
  const length = data.length
  if (length <= 0) return 0

  let left = 0
  let right = length - 1

  while (left <= right) {
    const mid = (left + right) >> 1
    const midTimestamp = data[mid]?.timestamp ?? 0

    if (midTimestamp === timestamp) return mid
    if (midTimestamp < timestamp) left = mid + 1
    else right = mid - 1
  }

  // Insertion point is `left`. Choose nearest between `left` and `left-1`.
  const a = Math.max(0, Math.min(length - 1, left))
  const b = Math.max(0, Math.min(length - 1, left - 1))

  const tA = data[a]?.timestamp ?? 0
  const tB = data[b]?.timestamp ?? 0

  return Math.abs(tA - timestamp) < Math.abs(tB - timestamp) ? a : b
}

export const mapSwingToPricePoint = ({
  data,
  swing,
  candleWidth,
  translateX,
  min,
  max,
  plotHeight,
}: {
  data: Kline[]
  swing: Swing
  candleWidth: number
  translateX: number
  min: number
  max: number
  plotHeight: number
}) => {
  'worklet'
  const candleIndex = findNearestCandleIndexByTimestamp(data, swing.time)
  const x = indexToX(candleIndex, candleWidth, translateX) + candleWidth / 2
  const y = priceToY(swing.value, min, max, plotHeight)
  return { x, y }
}

export const mapSwingToIndicatorPoint = ({
  data,
  swing,
  candleWidth,
  translateX,
  min,
  max,
  plotHeight,
  yOffset,
}: {
  data: Kline[]
  swing: Swing
  candleWidth: number
  translateX: number
  min: number
  max: number
  plotHeight: number
  yOffset: number
}) => {
  'worklet'
  const candleIndex = findNearestCandleIndexByTimestamp(data, swing.time)
  const x = indexToX(candleIndex, candleWidth, translateX) + candleWidth / 2
  const y = valueToY(swing.value, min, max, plotHeight, yOffset)
  return { x, y }
}
