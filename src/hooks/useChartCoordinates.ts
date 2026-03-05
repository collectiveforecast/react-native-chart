import { useDerivedValue, useSharedValue } from 'react-native-reanimated'

import type { BinaryFlag, UseChartCoordinatesProps, XYPoint } from '../types'
import {
  BUFFER_CANDLES,
  INIT_CANDLE_WIDTH,
  MAX_CANDLE_WIDTH,
  MAX_SCALE_Y,
  MIN_CANDLE_WIDTH,
  MIN_SCALE_Y,
} from '../utils/constants'
import {
  calculatePriceRange,
  calculateVisibleRange,
} from '../utils/coordinates'

export function useChartCoordinates({
  data,
  width,
  height,
}: UseChartCoordinatesProps) {
  // Core shared values for coordinate system
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const candleWidth = useSharedValue(INIT_CANDLE_WIDTH)
  const scaleY = useSharedValue(1) // Vertical zoom (price spread)
  const isFreeScroll = useSharedValue<BinaryFlag>(0)
  const freeCenterPrice = useSharedValue(0)
  const freeBaseSpan = useSharedValue(0)
  const isRangeSelector = useSharedValue<BinaryFlag>(0)
  const firstFingerX = useSharedValue(0)
  const secondFingerX = useSharedValue(0)
  const isCrosshairVisible = useSharedValue<BinaryFlag>(0)
  const crosshairPosition = useSharedValue<XYPoint>({
    x: 0,
    y: 0,
  })
  const isTranslateXInitialized = useSharedValue(false)
  const previousDataLength = useSharedValue(data.length)

  // Initialize position to show last N candles
  const initialTranslateX = useDerivedValue(() => {
    const visibleCandles = Math.floor(width.value / candleWidth.value)
    const startIndex = Math.max(0, data.length - visibleCandles)
    return -startIndex * candleWidth.value
  })

  // Initialize translateX immediately with initialTranslateX value
  useDerivedValue(() => {
    if (!isTranslateXInitialized.value) {
      translateX.value = initialTranslateX.value
      isTranslateXInitialized.value = true
      previousDataLength.value = data.length
    }
  })

  // Preserve position when data is added to the beginning
  useDerivedValue(() => {
    if (
      isTranslateXInitialized.value &&
      data.length > previousDataLength.value
    ) {
      const addedCandles = data.length - previousDataLength.value
      // Adjust translateX to maintain visual position when data is prepended
      translateX.value = translateX.value - addedCandles * candleWidth.value
      previousDataLength.value = data.length
    } else if (data.length !== previousDataLength.value) {
      // Update length even if it decreased (data was replaced)
      previousDataLength.value = data.length
    }
  })

  // Calculate pure visible range (NO buffer) - for price scale calculation
  const visibleRangePure = useDerivedValue(() => {
    return calculateVisibleRange(
      translateX.value,
      candleWidth.value,
      width.value,
      data.length,
      0, // No buffer - only truly visible candles
    )
  })

  // Calculate visible range with buffer - for rendering
  const visibleRange = useDerivedValue(() => {
    return calculateVisibleRange(
      translateX.value,
      candleWidth.value,
      width.value,
      data.length,
      BUFFER_CANDLES,
    )
  })

  // Calculate base price range using ONLY visible candles (no buffer)
  const priceRange = useDerivedValue(() => {
    const range = visibleRangePure.value
    return calculatePriceRange(data, range.start, range.end)
  })

  // Calculate adjusted price range with vertical offset and scale
  const adjustedPriceRange = useDerivedValue(() => {
    // AutoFit mode: follow visible candles range
    if (isFreeScroll.value === 0) {
      const baseRange = priceRange.value
      const basePriceSpan = baseRange.max - baseRange.min

      // Apply vertical scale (zoom) - smaller scale = more price range visible
      const scaledPriceSpan = basePriceSpan / scaleY.value
      const midPrice = (baseRange.max + baseRange.min) / 2

      const scaledMin = midPrice - scaledPriceSpan / 2
      const scaledMax = midPrice + scaledPriceSpan / 2

      return { min: scaledMin, max: scaledMax }
    }

    // FreeScroll mode: fixed base range + infinite vertical coordinates
    const baseSpan = Math.max(1e-9, freeBaseSpan.value)
    const span = baseSpan / scaleY.value

    const verticalOffset = (-translateY.value / height) * span

    return {
      min: freeCenterPrice.value - span / 2 + verticalOffset,
      max: freeCenterPrice.value + span / 2 + verticalOffset,
    }
  })

  const enterFreeScroll = () => {
    'worklet'

    const baseRange = priceRange.value
    const span = Math.max(1e-9, baseRange.max - baseRange.min)
    const center = (baseRange.max + baseRange.min) / 2

    isFreeScroll.value = 1
    freeBaseSpan.value = span
    freeCenterPrice.value = center

    // Reset vertical offset so the gesture can start from 0
    translateY.value = 0
  }

  const exitFreeScroll = () => {
    'worklet'

    // Exit FreeScroll mode back to AutoFit
    isFreeScroll.value = 0
    translateY.value = 0
    scaleY.value = 1
  }

  const enterRangeSelector = () => {
    'worklet'
    isRangeSelector.value = 1
  }

  const exitRangeSelector = () => {
    'worklet'
    isRangeSelector.value = 0
  }

  const enterCrosshair = () => {
    'worklet'
    isCrosshairVisible.value = 1
  }

  const exitCrosshair = () => {
    'worklet'
    isCrosshairVisible.value = 0
  }

  // Clamp candle width to valid range
  const clampCandleWidth = (value: number): number => {
    'worklet'
    return Math.max(MIN_CANDLE_WIDTH, Math.min(MAX_CANDLE_WIDTH, value))
  }

  // Clamp scaleY to valid range
  const clampScaleY = (value: number): number => {
    'worklet'
    return Math.max(MIN_SCALE_Y, Math.min(MAX_SCALE_Y, value))
  }

  // Update candle width with clamping
  const updateCandleWidth = (newWidth: number) => {
    'worklet'
    candleWidth.value = clampCandleWidth(newWidth)
  }

  // Update scaleY with clamping
  const updateScaleY = (newScale: number) => {
    'worklet'
    scaleY.value = clampScaleY(newScale)
  }

  return {
    translateX,
    translateY,
    candleWidth,
    scaleY,
    isFreeScroll,
    enterFreeScroll,
    exitFreeScroll,
    visibleRange,
    priceRange,
    adjustedPriceRange,
    initialTranslateX,
    updateCandleWidth,
    updateScaleY,
    totalCandles: data.length,
    enterRangeSelector,
    exitRangeSelector,
    isRangeSelector,
    firstFingerX,
    secondFingerX,
    enterCrosshair,
    exitCrosshair,
    isCrosshairVisible,
    crosshairPosition,
  }
}
