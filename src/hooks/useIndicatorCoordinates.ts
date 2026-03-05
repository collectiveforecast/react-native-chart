import { useDerivedValue, useSharedValue } from 'react-native-reanimated'

import type { BinaryFlag, UseIndicatorCoordinatesParams } from '../types'
import { calculateVisibleRange } from '../utils/coordinates'

export function useIndicatorCoordinates({
  data,
  width,
  height,
  translateX,
  candleWidth,
  enabled,
  fixedMin,
  fixedMax,
}: UseIndicatorCoordinatesParams) {
  const scaleY = useSharedValue(1)
  const translateY = useSharedValue(0)

  const isFreeScroll = useSharedValue<BinaryFlag>(0)
  const freeCenterValue = useSharedValue(0)
  const freeBaseSpan = useSharedValue(0)

  const maxSeriesLength = useDerivedValue(() => {
    'worklet'
    if (!data || data.length === 0) return 0
    let maxLen = 0
    for (let s = 0; s < data.length; s++) {
      const len = data[s]?.length ?? 0
      if (len > maxLen) maxLen = len
    }
    return maxLen
  })

  const visibleRangePure = useDerivedValue(() => {
    return calculateVisibleRange(
      translateX.value,
      candleWidth.value,
      width.value,
      maxSeriesLength.value,
      0,
    )
  })

  const baseRange = useDerivedValue(() => {
    'worklet'

    if (
      typeof fixedMin === 'number' &&
      typeof fixedMax === 'number' &&
      Number.isFinite(fixedMin) &&
      Number.isFinite(fixedMax) &&
      fixedMax > fixedMin &&
      !isFreeScroll.value
    ) {
      return { min: fixedMin, max: fixedMax }
    }

    if (!enabled || !data || data.length === 0) {
      return { min: 0, max: 1 }
    }

    const { start, end } = visibleRangePure.value
    let min = Infinity
    let max = -Infinity

    const from = Math.max(0, start)
    const to = Math.max(from, end)

    for (let s = 0; s < data.length; s++) {
      const series = data[s]
      if (!series || series.length === 0) continue
      const seriesTo = Math.min(series.length, to)
      for (let i = from; i < seriesTo; i++) {
        const v = series[i]?.value
        if (typeof v !== 'number' || !Number.isFinite(v)) continue
        if (v < min) min = v
        if (v > max) max = v
      }
    }

    if (min === Infinity || max === -Infinity) {
      return { min: 0, max: 1 }
    }

    const span = Math.max(1e-9, max - min)
    const padding = span * 0.005

    return { min: min - padding, max: max + padding }
  })

  const adjustedRange = useDerivedValue(() => {
    'worklet'
    if (
      typeof fixedMin === 'number' &&
      typeof fixedMax === 'number' &&
      Number.isFinite(fixedMin) &&
      Number.isFinite(fixedMax) &&
      fixedMax > fixedMin &&
      !isFreeScroll.value
    ) {
      return { min: fixedMin, max: fixedMax }
    }

    const base = baseRange.value
    const baseSpan = Math.max(1e-9, base.max - base.min)

    // AutoFit mode
    if (isFreeScroll.value === 0) {
      const span = baseSpan / Math.max(1e-9, scaleY.value)
      const mid = (base.max + base.min) / 2
      return { min: mid - span / 2, max: mid + span / 2 }
    }

    // FreeScroll mode
    const fb = Math.max(1e-9, freeBaseSpan.value)
    const span = fb / Math.max(1e-9, scaleY.value)
    const offset = (-translateY.value / Math.max(1e-9, height)) * span

    return {
      min: freeCenterValue.value - span / 2 + offset,
      max: freeCenterValue.value + span / 2 + offset,
    }
  })

  const enterFreeScroll = () => {
    'worklet'

    const base = baseRange.value
    const span = Math.max(1e-9, base.max - base.min)
    const center = (base.max + base.min) / 2

    isFreeScroll.value = 1
    freeBaseSpan.value = span
    freeCenterValue.value = center
    translateY.value = 0
  }

  const exitFreeScroll = () => {
    'worklet'
    isFreeScroll.value = 0
    translateY.value = 0
    scaleY.value = 1
  }

  return {
    scaleY,
    translateY,
    isFreeScroll,
    enterFreeScroll,
    exitFreeScroll,
    visibleRangePure,
    baseRange,
    adjustedRange,
  }
}
