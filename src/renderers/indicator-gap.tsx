import { Rect, rect } from '@shopify/react-native-skia'

import type { IndicatorGapProps } from '../types'

export function IndicatorGap({
  width,
  colors,
  chartHeight,
  indicatorTopEmptySpace,
}: IndicatorGapProps) {
  const rectValue = rect(0, chartHeight, width, indicatorTopEmptySpace)

  return <Rect rect={rectValue} color={colors.bg} style='fill' zIndex={2} />
}
