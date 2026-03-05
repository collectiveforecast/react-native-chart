import { RoundedRect, rrect } from '@shopify/react-native-skia'

import type { IndicatorContainerProps } from '../types'

export function IndicatorContainer({
  chartWidth,
  chartHeight,
  indicatorHeight,
  colors,
  indicatorContainerPadding,
}: IndicatorContainerProps) {
  const rect = rrect(
    {
      width: chartWidth - indicatorContainerPadding * 2,
      height: indicatorHeight ?? 0,
      x: indicatorContainerPadding,
      y: chartHeight,
    },
    12,
    12,
  )

  return (
    <RoundedRect rect={rect} zIndex={-1} color={colors.indicatorContainerBg} />
  )
}
