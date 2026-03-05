import { Group, Path, rect, Skia } from '@shopify/react-native-skia'
import { useDerivedValue, useSharedValue } from 'react-native-reanimated'

import type { DivergenceSegmentProps, DiversRendererProps } from '../types'
import { TOP_PADDING_PX } from '../utils/constants'
import { mapSwingToIndicatorPoint, mapSwingToPricePoint } from '../utils/diver'

export function DiversRenderer({
  data,
  divers,
  target,
  colors,
  chartWidth,
  height: plotHeight,
  yOffset,
  translateX,
  candleWidth,
  adjustedPriceRange,
}: DiversRendererProps) {
  const effectiveYOffset = yOffset ?? 0

  const sharedProps: Omit<DivergenceSegmentProps, 'divergence'> = {
    data,
    target,
    height: plotHeight,
    yOffset: effectiveYOffset,
    translateX,
    candleWidth,
    adjustedRange: adjustedPriceRange,
    colors,
  }

  const clipHeight =
    target === 'price' ? plotHeight + TOP_PADDING_PX : plotHeight
  const clipY = target === 'price' ? 0 : effectiveYOffset

  return (
    <Group clip={rect(0, clipY, chartWidth, clipHeight)}>
      {divers.map((divergence) => (
        <DivergenceSegment
          key={divergence.type + divergence.indicatorSwing1.time}
          divergence={divergence}
          {...sharedProps}
        />
      ))}
    </Group>
  )
}

function DivergenceSegment({
  divergence,
  target,
  colors,
  data,
  translateX,
  candleWidth,
  adjustedRange,
  height,
  yOffset,
}: DivergenceSegmentProps) {
  const path = useSharedValue(Skia.Path.Make())

  useDerivedValue(() => {
    'worklet'
    path.value.rewind()

    const point1 =
      target === 'indicator'
        ? divergence.indicatorSwing1
        : divergence.priceSwing1
    const point2 =
      target === 'indicator'
        ? divergence.indicatorSwing2
        : divergence.priceSwing2

    const range = adjustedRange.value
    const candleW = candleWidth.value
    const translateXPx = translateX.value

    const p1 =
      target === 'indicator'
        ? mapSwingToIndicatorPoint({
            data,
            swing: point1,
            candleWidth: candleW,
            translateX: translateXPx,
            min: range.min,
            max: range.max,
            plotHeight: height,
            yOffset,
          })
        : mapSwingToPricePoint({
            data,
            swing: point1,
            candleWidth: candleW,
            translateX: translateXPx,
            min: range.min,
            max: range.max,
            plotHeight: height,
          })

    const p2 =
      target === 'indicator'
        ? mapSwingToIndicatorPoint({
            data,
            swing: point2,
            candleWidth: candleW,
            translateX: translateXPx,
            min: range.min,
            max: range.max,
            plotHeight: height,
            yOffset,
          })
        : mapSwingToPricePoint({
            data,
            swing: point2,
            candleWidth: candleW,
            translateX: translateXPx,
            min: range.min,
            max: range.max,
            plotHeight: height,
          })

    path.value.moveTo(p1.x, p1.y)
    path.value.lineTo(p2.x, p2.y)
  })

  const color =
    divergence.type === 'bullish' ? colors.bullishDiver : colors.bearishDiver
  return <Path path={path} style='stroke' color={color} strokeWidth={2} />
}
