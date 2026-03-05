import { Gesture } from 'react-native-gesture-handler'
import { withDecay, withSpring } from 'react-native-reanimated'

import type { BinaryFlag, UseChartGesturesOptions } from '../types'
import {
  LONG_PRESS_DURATION,
  MAX_CANDLE_WIDTH,
  MAX_SCALE_Y,
  MIN_CANDLE_WIDTH,
  MIN_SCALE_Y,
  SPRING_CONFIG,
} from '../utils/constants'
import { snapToCandle } from '../utils/coordinates'

export function useChartGestures({
  translateX,
  translateY,
  candleWidth,
  scaleY,
  isFreeScroll,
  enterFreeScroll,
  exitFreeScroll,
  totalCandles,
  chartWidth,
  rightZoneWidth,
  minVisiblePoints = 3,
  enterRangeSelector,
  exitRangeSelector,
  isRangeSelector,
  firstFingerX,
  secondFingerX,
  enterCrosshair,
  exitCrosshair,
  isCrosshairVisible,
  crosshairPosition,
  indicator,
  disableYAxisPan,
}: UseChartGesturesOptions) {
  const indicatorScaleY = indicator?.scaleY
  const indicatorTranslateY = indicator?.translateY
  const indicatorIsFreeScroll = indicator?.isFreeScroll
  const enterIndicatorFreeScroll = indicator?.enterFreeScroll
  const exitIndicatorFreeScroll = indicator?.exitFreeScroll
  const indicatorTopY = indicator?.topY ?? 0
  const indicatorHeight = indicator?.height ?? 0
  // Store initial values for gestures
  const startTranslateX = { value: 0 }
  const startTranslateY = { value: 0 }
  const startIndicatorTranslateY = { value: 0 }
  const startCandleWidth = { value: 0 }
  const startScaleY = { value: 0 }
  const startFocalX = { value: 0 }
  const startFocalY = { value: 0 }
  const startedInRightZone = { value: 0 as BinaryFlag }
  const startedInIndicatorPane = { value: 0 as BinaryFlag }
  const freeScrollActivated = { value: 0 as BinaryFlag }
  const startScaleYPan = { value: 0 }
  const startIndicatorScaleYPan = { value: 0 }

  const getTranslateXBounds = (cWidth: number) => {
    'worklet'

    const n = Math.max(0, totalCandles)
    const minVisible = Math.max(1, Math.min(minVisiblePoints, n))

    const minVisibleWidth = minVisible * cWidth
    const contentWidth = n * cWidth

    // Hard clamp with empty space allowed on both sides:
    // Ensure at least `minVisibleWidth` of content overlaps the viewport.
    const maxX = Math.max(0, chartWidth.value - minVisibleWidth)
    const minX = Math.min(0, minVisibleWidth - contentWidth)

    return { minX, maxX }
  }

  const clampTranslateX = (x: number, cWidth: number) => {
    'worklet'
    const { minX, maxX } = getTranslateXBounds(cWidth)
    return Math.max(minX, Math.min(maxX, x))
  }

  const tapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((event) => {
      'worklet'
      const x = (event as any).x ?? (event as any).absoluteX ?? 0
      const y = (event as any).y ?? (event as any).absoluteY ?? 0

      if (x <= chartWidth.value) return

      const inIndicatorPane =
        Boolean(indicatorIsFreeScroll) &&
        indicatorHeight > 0 &&
        y >= indicatorTopY &&
        y <= indicatorTopY + indicatorHeight

      if (inIndicatorPane && exitIndicatorFreeScroll) {
        exitIndicatorFreeScroll()
      } else {
        exitFreeScroll()
      }
    })

  // Pan gesture for 2D scrolling (hard clamped horizontally, infinite vertically)
  const panGesture = Gesture.Pan()
    .onStart((event) => {
      'worklet'
      if (isCrosshairVisible.value === 1) {
        exitCrosshair()
      }
      startTranslateX.value = translateX.value
      startTranslateY.value = translateY.value
      startIndicatorTranslateY.value = indicatorTranslateY?.value ?? 0
      freeScrollActivated.value = 0

      const x = (event as any).x ?? (event as any).absoluteX ?? 0
      const y = (event as any).y ?? (event as any).absoluteY ?? 0
      startedInRightZone.value = x >= chartWidth.value ? 1 : 0
      startedInIndicatorPane.value =
        Boolean(indicatorIsFreeScroll) &&
        indicatorHeight > 0 &&
        y >= indicatorTopY &&
        y <= indicatorTopY + indicatorHeight
          ? 1
          : 0
      startScaleYPan.value = scaleY.value
      startIndicatorScaleYPan.value = indicatorScaleY?.value ?? 0
    })
    .onUpdate((event) => {
      'worklet'
      // Hard-clamped horizontal scrolling (keep >= minVisiblePoints visible)
      if (startedInRightZone.value === 0) {
        const nextX = startTranslateX.value + event.translationX
        translateX.value = clampTranslateX(nextX, candleWidth.value)
      }

      // Y behavior:
      // - In right zone: vertical pan adjusts scaleY (price) OR indicatorScaleY (indicator) and enables FreeScroll.
      // - Not in right zone: if FreeScroll enabled, vertical pan translates Y (price or indicator respectively).
      if (startedInRightZone.value === 1) {
        // Indicator pane: adjust indicator scale independently and enable indicator FreeScroll.
        if (startedInIndicatorPane.value === 1) {
          if (
            Math.abs(event.translationY) > 4 &&
            freeScrollActivated.value === 0
          ) {
            if (
              indicatorIsFreeScroll &&
              indicatorIsFreeScroll.value === 0 &&
              enterIndicatorFreeScroll
            ) {
              enterIndicatorFreeScroll()
            }
            freeScrollActivated.value = 1
          }

          const k = 0.0015
          const factor = Math.exp(-k * event.translationY)
          const newScaleY = startIndicatorScaleYPan.value * factor
          if (indicatorScaleY) {
            indicatorScaleY.value = Math.max(
              MIN_SCALE_Y,
              Math.min(MAX_SCALE_Y, newScaleY),
            )
          }
          if (indicatorTranslateY) {
            indicatorTranslateY.value = startIndicatorTranslateY.value
          }
          return
        }

        if (
          Math.abs(event.translationY) > 4 &&
          freeScrollActivated.value === 0
        ) {
          if (isFreeScroll.value === 0) {
            enterFreeScroll()
          }
          freeScrollActivated.value = 1
        }

        if (isFreeScroll.value === 1) {
          // deltaY < 0 -> zoom in (ближе), deltaY > 0 -> zoom out (дальше)
          const k = 0.0015
          const factor = Math.exp(-k * event.translationY)
          const newScaleY = startScaleYPan.value * factor
          const clampedScaleY = Math.max(
            MIN_SCALE_Y,
            Math.min(MAX_SCALE_Y, newScaleY),
          )
          scaleY.value = clampedScaleY
        }

        translateY.value = startTranslateY.value
        return
      }

      // Not in right zone: apply vertical pan to the active pane
      if (startedInIndicatorPane.value === 1) {
        if (indicatorIsFreeScroll?.value === 1 && indicatorTranslateY) {
          indicatorTranslateY.value =
            startIndicatorTranslateY.value + -event.translationY
        } else {
          if (indicatorTranslateY) indicatorTranslateY.value = 0
        }
      } else {
        if (isFreeScroll.value === 1) {
          translateY.value = startTranslateY.value + -event.translationY
        } else {
          translateY.value = 0
        }
      }
    })
    .onEnd((event) => {
      'worklet'
      const { minX, maxX } = getTranslateXBounds(candleWidth.value)

      // Apply decay animation for inertia (hard-clamped horizontally)
      translateX.value = withDecay({
        velocity: event.velocityX,
        deceleration: 0.998,
        clamp: [minX, maxX],
      })

      // No Y decay; spread adjusted via pan when in right zone
      if (isFreeScroll.value === 0) {
        translateY.value = 0
      }
      if (indicatorIsFreeScroll?.value === 0 && indicatorTranslateY) {
        indicatorTranslateY.value = 0
      }
    })

  // Pinch gesture for zooming (both horizontal and vertical)
  const pinchGesture = Gesture.Pinch()
    .onStart((event) => {
      'worklet'
      startCandleWidth.value = candleWidth.value
      startScaleY.value = scaleY.value
      startTranslateX.value = translateX.value
      startFocalX.value = event.focalX
      startFocalY.value = event.focalY
    })
    .onUpdate((event) => {
      'worklet'
      // Horizontal zoom (candle width)
      const newCandleWidth = startCandleWidth.value * event.scale
      const clampedWidth = Math.max(
        MIN_CANDLE_WIDTH,
        Math.min(MAX_CANDLE_WIDTH, newCandleWidth),
      )

      // Apply horizontal zoom relative to focal point
      const focalX = event.focalX
      // Use initial values to prevent drift during pinch
      const scaleRatioX = clampedWidth / startCandleWidth.value
      const nextX = focalX - (focalX - startTranslateX.value) * scaleRatioX
      translateX.value = clampTranslateX(nextX, clampedWidth)
      candleWidth.value = clampedWidth

      // Vertical zoom (price spread)
      // Disabled per requirements: vertical pinch is off in all zones/modes
    })
    .onEnd(() => {
      'worklet'
      // Bounce back if exceeded limits
      if (candleWidth.value < MIN_CANDLE_WIDTH) {
        candleWidth.value = withSpring(MIN_CANDLE_WIDTH, SPRING_CONFIG)
      } else if (candleWidth.value > MAX_CANDLE_WIDTH) {
        candleWidth.value = withSpring(MAX_CANDLE_WIDTH, SPRING_CONFIG)
      }

      if (scaleY.value < MIN_SCALE_Y) {
        scaleY.value = withSpring(MIN_SCALE_Y, SPRING_CONFIG)
      } else if (scaleY.value > MAX_SCALE_Y) {
        scaleY.value = withSpring(MAX_SCALE_Y, SPRING_CONFIG)
      }

      if (indicatorScaleY) {
        if (indicatorScaleY.value < MIN_SCALE_Y) {
          indicatorScaleY.value = withSpring(MIN_SCALE_Y, SPRING_CONFIG)
        } else if (indicatorScaleY.value > MAX_SCALE_Y) {
          indicatorScaleY.value = withSpring(MAX_SCALE_Y, SPRING_CONFIG)
        }
      }
    })

  const doublePanGesture = Gesture.Pan()
    .activateAfterLongPress(LONG_PRESS_DURATION)
    .shouldCancelWhenOutside(true)
    .minPointers(2)
    .onStart((e) => {
      if (e.numberOfPointers !== 2) return
      enterRangeSelector()
    })
    .onEnd(() => {
      exitRangeSelector()
    })
    .onTouchesDown((event) => {
      const touches = event.allTouches

      if (touches[0]) {
        firstFingerX.value = snapToCandle(
          touches[0].x,
          candleWidth.value,
          translateX.value,
          totalCandles,
        )
      }
      if (touches[1]) {
        secondFingerX.value = snapToCandle(
          touches[1].x,
          candleWidth.value,
          translateX.value,
          totalCandles,
        )
      }
    })
    .onTouchesMove((event) => {
      if (isRangeSelector.value === 0) {
        return
      }
      const touches = event.allTouches

      if (touches[0]) {
        firstFingerX.value = snapToCandle(
          touches[0].x,
          candleWidth.value,
          translateX.value,
          totalCandles,
        )
      }
      if (touches[1]) {
        secondFingerX.value = snapToCandle(
          touches[1].x,
          candleWidth.value,
          translateX.value,
          totalCandles,
        )
      }
    })

  const crosshairGesture = Gesture.Pan()
    .activateAfterLongPress(LONG_PRESS_DURATION)
    .shouldCancelWhenOutside(true)
    .onStart((event) => {
      if (event.numberOfPointers > 1) return
      enterCrosshair()
    })
    .onUpdate((event) => {
      crosshairPosition.value = {
        x: Math.min(
          snapToCandle(
            event.x,
            candleWidth.value,
            translateX.value,
            totalCandles,
          ),
          chartWidth.value,
        ),
        y: event.y,
      }
    })
    .onEnd(() => {
      exitCrosshair()
    })
    .onFinalize(() => {
      exitCrosshair()
    })

  if (disableYAxisPan) {
    panGesture.activeOffsetX([-10, 10])
    panGesture.failOffsetY([-10, 10])
  }

  const composedGesture = Gesture.Race(
    Gesture.Simultaneous(crosshairGesture, doublePanGesture),
    Gesture.Race(panGesture, pinchGesture, tapGesture),
  )

  return composedGesture
}
