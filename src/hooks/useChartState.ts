import { useDerivedValue, useSharedValue } from 'react-native-reanimated'

import type { UseChartStateParams } from '../types'
import {
  RIGHT_PADDING_PX,
  TIME_LABEL_AREA_HEIGHT,
  TOP_PADDING_PX,
} from '../utils/constants'
import { formatPrice } from '../utils/coordinates'
import { useChartCoordinates } from './useChartCoordinates'
import { useChartGestures } from './useChartGestures'
import { useIndicatorCoordinates } from './useIndicatorCoordinates'

export function useChartState({
  data,
  width,
  height,
  indicatorData,
  indicatorHeight,
  indicatorFixedMin,
  indicatorFixedMax,
  labelFont,
  indicatorTopEmptySpace,
  disableYAxisPan,
  indicatorContainerPadding = 0,
}: UseChartStateParams) {
  const chartWidth = useSharedValue(width - RIGHT_PADDING_PX)
  const rightZoneWidth = useSharedValue(0)

  const chartPlotHeight = Math.max(
    0,
    height - TIME_LABEL_AREA_HEIGHT - TOP_PADDING_PX,
  )
  const indicatorPlotHeight =
    Math.max(0, indicatorHeight ?? 0) -
    indicatorTopEmptySpace -
    indicatorContainerPadding

  const hasIndicator =
    indicatorPlotHeight > 0 &&
    Boolean(indicatorData?.length) &&
    Boolean(indicatorData?.some((s) => (s?.length ?? 0) > 0))
  const indicatorTopY = height + indicatorTopEmptySpace

  const totalCanvasHeight = hasIndicator
    ? height + (indicatorHeight ?? 0)
    : height

  const chart = useChartCoordinates({
    data,
    width: chartWidth,
    height: chartPlotHeight,
  })

  const indicator = useIndicatorCoordinates({
    data: indicatorData,
    width: chartWidth,
    height: indicatorPlotHeight,
    translateX: chart.translateX,
    candleWidth: chart.candleWidth,
    enabled: hasIndicator,
    fixedMin: indicatorFixedMin,
    fixedMax: indicatorFixedMax,
  })

  const gesture = useChartGestures({
    translateX: chart.translateX,
    translateY: chart.translateY,
    candleWidth: chart.candleWidth,
    scaleY: chart.scaleY,
    isFreeScroll: chart.isFreeScroll,
    enterFreeScroll: chart.enterFreeScroll,
    exitFreeScroll: chart.exitFreeScroll,
    totalCandles: data.length,
    chartWidth,
    minVisiblePoints: 3,
    rightZoneWidth,
    enterRangeSelector: chart.enterRangeSelector,
    exitRangeSelector: chart.exitRangeSelector,
    isRangeSelector: chart.isRangeSelector,
    firstFingerX: chart.firstFingerX,
    secondFingerX: chart.secondFingerX,
    enterCrosshair: chart.enterCrosshair,
    exitCrosshair: chart.exitCrosshair,
    isCrosshairVisible: chart.isCrosshairVisible,
    crosshairPosition: chart.crosshairPosition,
    disableYAxisPan,
    indicator: hasIndicator
      ? {
          scaleY: indicator.scaleY,
          translateY: indicator.translateY,
          isFreeScroll: indicator.isFreeScroll,
          enterFreeScroll: indicator.enterFreeScroll,
          exitFreeScroll: indicator.exitFreeScroll,
          topY: indicatorTopY,
          height: indicatorPlotHeight,
        }
      : undefined,
  })

  useDerivedValue(() => {
    const minPriceWidth = labelFont.measureText(
      formatPrice(chart.adjustedPriceRange.value.min),
    ).width
    const maxPriceWidth = labelFont.measureText(
      formatPrice(chart.adjustedPriceRange.value.max),
    ).width
    let required = Math.max(minPriceWidth, maxPriceWidth)

    if (hasIndicator) {
      const minIndWidth = labelFont.measureText(
        formatPrice(indicator.adjustedRange.value.min),
      ).width
      const maxIndWidth = labelFont.measureText(
        formatPrice(indicator.adjustedRange.value.max),
      ).width
      required = Math.max(required, minIndWidth, maxIndWidth)
    }

    if (rightZoneWidth.value < required) rightZoneWidth.value = required + 20
    chartWidth.value = width - rightZoneWidth.value
  })

  return {
    chart,
    indicator,
    gesture,
    chartWidth,
    rightZoneWidth,
    pricePlotHeight: chartPlotHeight,
    indicatorPlotHeight,
    hasIndicator,
    indicatorTopY,
    totalCanvasHeight,
  }
}
