import type { SkPath } from '@shopify/react-native-skia'

import type {
  BaselineFillExtents,
  BuildIndicatorStrokeAndBaselineFillsParams,
  BuildIndicatorStrokePathParams,
  IndicatorPoint,
} from '../types'
import { indexToX, valueToY } from './coordinates'

export function rewindPaths(paths: SkPath[]) {
  'worklet'
  for (let i = 0; i < paths.length; i++) {
    paths[i]?.rewind()
  }
}

export function findLastValidPointIndex(series: IndicatorPoint[] | undefined) {
  'worklet'
  if (!series || series.length === 0) return -1
  for (let i = series.length - 1; i >= 0; i--) {
    const v = series[i]?.value
    if (typeof v === 'number' && Number.isFinite(v)) return i
  }
  return -1
}

export function buildIndicatorStrokePath({
  path,
  series,
  from,
  to,
  candleWidth,
  translateX,
  min,
  max,
  height,
  yOffset,
}: BuildIndicatorStrokePathParams) {
  'worklet'

  if (!series || series.length === 0) return

  const safeFrom = Math.max(0, from)
  const safeTo = Math.min(series.length, Math.max(safeFrom, to))
  if (safeTo - safeFrom <= 0) return

  let strokeStarted = false

  for (let i = safeFrom; i < safeTo; i++) {
    const v = series[i]?.value
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      strokeStarted = false
      continue
    }

    const x = indexToX(i, candleWidth, translateX) + candleWidth / 2
    const y = valueToY(v, min, max, height, yOffset)

    if (!strokeStarted) {
      path.moveTo(x, y)
      strokeStarted = true
    } else {
      path.lineTo(x, y)
    }
  }
}

export function buildIndicatorStrokeAndBaselineFills({
  linePath,
  positiveFillPath,
  negativeFillPath,
  series,
  from,
  to,
  candleWidth,
  translateX,
  min,
  max,
  height,
  yOffset,
  baselineY,
}: BuildIndicatorStrokeAndBaselineFillsParams): BaselineFillExtents {
  'worklet'

  if (!series || series.length === 0) {
    return { minYPositive: Infinity, maxYNegative: -Infinity }
  }

  const safeFrom = Math.max(0, from)
  const safeTo = Math.min(series.length, Math.max(safeFrom, to))
  if (safeTo - safeFrom <= 0) {
    return { minYPositive: Infinity, maxYNegative: -Infinity }
  }

  let strokeStarted = false

  let minYPositive = Infinity
  let maxYNegative = -Infinity

  let hasPrev = false
  let prevX = 0
  let prevY = 0

  let segStartX = 0
  let segIsPositive = true
  let currentFillPath: SkPath = positiveFillPath

  for (let i = safeFrom; i < safeTo; i++) {
    const v = series[i]?.value
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      // Break in series: close current fill segment and restart later.
      if (hasPrev) {
        currentFillPath.lineTo(prevX, baselineY)
        currentFillPath.lineTo(segStartX, baselineY)
        currentFillPath.close()
      }
      hasPrev = false
      strokeStarted = false
      continue
    }

    const x = indexToX(i, candleWidth, translateX) + candleWidth / 2
    const y = valueToY(v, min, max, height, yOffset)

    if (y < baselineY && y < minYPositive) minYPositive = y
    if (y > baselineY && y > maxYNegative) maxYNegative = y

    // Stroke path (can have breaks)
    if (!strokeStarted) {
      linePath.moveTo(x, y)
      strokeStarted = true
    } else {
      linePath.lineTo(x, y)
    }

    // Fill paths (positive/negative areas vs baseline)
    const currIsPositive = y < baselineY

    if (!hasPrev) {
      segIsPositive = currIsPositive
      currentFillPath = currIsPositive ? positiveFillPath : negativeFillPath

      segStartX = x
      currentFillPath.moveTo(x, y)

      hasPrev = true
      prevX = x
      prevY = y
      continue
    }

    if (currIsPositive === segIsPositive) {
      currentFillPath.lineTo(x, y)
    } else {
      const dy = y - prevY
      const t = dy === 0 ? 0 : (baselineY - prevY) / dy // 0..1
      const ix = prevX + (x - prevX) * t

      // Close previous segment at baseline intersection
      currentFillPath.lineTo(ix, baselineY)
      currentFillPath.lineTo(segStartX, baselineY)
      currentFillPath.close()

      // Start new segment from baseline intersection
      segIsPositive = currIsPositive
      currentFillPath = currIsPositive ? positiveFillPath : negativeFillPath
      segStartX = ix
      currentFillPath.moveTo(ix, baselineY)
      currentFillPath.lineTo(x, y)
    }

    prevX = x
    prevY = y
    hasPrev = true
  }

  // Close last open fill segment (if any)
  if (hasPrev) {
    currentFillPath.lineTo(prevX, baselineY)
    currentFillPath.lineTo(segStartX, baselineY)
    currentFillPath.close()
  }

  return { minYPositive, maxYNegative }
}
