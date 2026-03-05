import {
  DashPathEffect,
  Group,
  Path,
  Rect,
  Skia,
} from '@shopify/react-native-skia'
import { useDerivedValue, withTiming } from 'react-native-reanimated'

import type { IRangeSelectorProps } from '../types'
import { TOP_PADDING_PX } from '../utils/constants'

export function RangeSelector({
  height,
  colors,
  firstFingerX,
  secondFingerX,
  isRangeSelector,
}: IRangeSelectorProps) {
  const firstPath = useDerivedValue(() => {
    return Skia.Path.Make()
      .moveTo(firstFingerX.value, TOP_PADDING_PX)
      .lineTo(firstFingerX.value, height + TOP_PADDING_PX)
      .close()
  })

  const secondPath = useDerivedValue(() => {
    return Skia.Path.Make()
      .moveTo(secondFingerX.value, TOP_PADDING_PX)
      .lineTo(secondFingerX.value, height + TOP_PADDING_PX)
      .close()
  })

  const firstRect = useDerivedValue(() => {
    const x = Math.min(firstFingerX.value, secondFingerX.value)
    return Skia.XYWHRect(x, TOP_PADDING_PX, -x, height)
  })

  const secondRect = useDerivedValue(() => {
    const x = Math.max(firstFingerX.value, secondFingerX.value)
    return Skia.XYWHRect(x + 1, TOP_PADDING_PX, x, height)
  })

  const groupOpacity = useDerivedValue(() => {
    return withTiming(isRangeSelector.value ? 1 : 0, { duration: 150 })
  })

  return (
    <Group zIndex={1} opacity={groupOpacity}>
      <Rect rect={firstRect} color={colors.bg} opacity={0.7} />

      <Path path={firstPath} style='stroke' strokeWidth={2} color={colors.text}>
        <DashPathEffect intervals={[5, 5]} />
      </Path>

      <Path
        path={secondPath}
        style='stroke'
        strokeWidth={2}
        color={colors.text}
      >
        <DashPathEffect intervals={[5, 5]} />
      </Path>

      <Rect rect={secondRect} color={colors.bg} opacity={0.7} />
    </Group>
  )
}
