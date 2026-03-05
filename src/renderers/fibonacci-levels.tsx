import {
  DashPathEffect,
  DiffRect,
  Group,
  Path,
  RoundedRect,
  rrect,
  Skia,
  Text,
} from '@shopify/react-native-skia'
import React, { useMemo } from 'react'
import { useDerivedValue, useSharedValue } from 'react-native-reanimated'

import type { FibonacciLevelsRendererProps } from '../types'
import { TOP_PADDING_PX } from '../utils/constants'
import { indexToX, priceToY } from '../utils/coordinates'
import { findNearestCandleIndexByTimestamp } from '../utils/diver'
import { formatCompactUsd, getLevelColor } from '../utils/fibonacci'

const LABEL_PADDING_X = 4
const LABEL_PADDING_Y = 1
const BAND_OPACITY = 0.1
const STROKE_WIDTH = 1

type PreparedLevel = {
  level: number
  price: number
  color: string
  label: string
  textWidth: number
  textHeight: number
}

export function FibonacciLevelsRenderer({
  data,
  fibonacciLevels,
  translateX,
  candleWidth,
  adjustedPriceRange,
  chartWidth,
  height,
  font,
  colors,
}: FibonacciLevelsRendererProps) {
  const levelsPrepared = useMemo<PreparedLevel[]>(() => {
    const levels = fibonacciLevels.levels ?? []
    return levels.map((lvl) => {
      const label = `${lvl.level.toFixed(3)} (${formatCompactUsd(lvl.price)})`
      const metrics = font ? font.measureText(label) : { width: 0, height: 0 }
      const color = getLevelColor(lvl.level, 'red')
      return {
        level: lvl.level,
        price: lvl.price,
        color,
        label,
        textWidth: metrics.width,
        textHeight: metrics.height,
      }
    })
  }, [fibonacciLevels.levels, font])

  const diagPath = useSharedValue(Skia.Path.Make())
  const levelYs = useSharedValue<number[]>([])
  const sortedIndices = useSharedValue<number[]>([])
  const xLeft = useSharedValue(0)
  const xRight = useSharedValue(0)

  useDerivedValue(() => {
    'worklet'
    diagPath.value.rewind()

    const range = adjustedPriceRange.value
    const cWidth = candleWidth.value
    const tx = translateX.value

    const startIndex = findNearestCandleIndexByTimestamp(
      data,
      fibonacciLevels.startTime,
    )
    const endIndex = findNearestCandleIndexByTimestamp(
      data,
      fibonacciLevels.endTime,
    )

    const x1 = indexToX(startIndex, cWidth, tx) + cWidth / 2
    const x2 = indexToX(endIndex, cWidth, tx) + cWidth / 2

    const left = Math.min(x1, x2)
    const right = Math.max(x1, x2)
    xLeft.value = left
    xRight.value = right

    const yStart = priceToY(
      fibonacciLevels.startPrice,
      range.min,
      range.max,
      height,
    )
    const yEnd = priceToY(
      fibonacciLevels.endPrice,
      range.min,
      range.max,
      height,
    )

    diagPath.value.moveTo(left, yStart)
    diagPath.value.lineTo(right, yEnd)

    const n = levelsPrepared.length
    const ys = new Array(n)
    for (let i = 0; i < n; i++) {
      const p = levelsPrepared[i]?.price ?? 0
      ys[i] = priceToY(p, range.min, range.max, height)
    }
    levelYs.value = ys

    // Determine drawing order similar to legacy implementation.
    let zeroIndex = -1
    for (let i = 0; i < n; i++) {
      if (levelsPrepared[i]?.level === 0) {
        zeroIndex = i
        break
      }
    }
    let zeroAtTop = false
    if (zeroIndex >= 0 && n > 0) {
      let minY = ys[0]
      for (let i = 1; i < n; i++) {
        if (ys[i] < minY) minY = ys[i]
      }
      zeroAtTop = ys[zeroIndex] === minY
    }

    const drawBottomToTop = Boolean(fibonacciLevels.isUptrend) && zeroAtTop

    const indices = new Array(n)
    for (let i = 0; i < n; i++) indices[i] = i

    indices.sort((a, b) => (ys[a] ?? 0) - (ys[b] ?? 0))
    if (drawBottomToTop) indices.reverse()

    sortedIndices.value = indices
  })

  if (!font) return null

  return (
    <Group
      clip={Skia.XYWHRect(0, 0, chartWidth, height + TOP_PADDING_PX)}
      zIndex={1}
    >
      <Path
        path={diagPath}
        color={colors.text}
        strokeWidth={STROKE_WIDTH}
        style='stroke'
        opacity={0.5}
        strokeCap='round'
      >
        <DashPathEffect intervals={[5, 5]} />
      </Path>

      {levelsPrepared.length > 0
        ? levelsPrepared.map((_, rawIndex) => (
            <FibLevelLabel
              key={`fib-label-${rawIndex}`}
              index={rawIndex}
              levels={levelsPrepared}
              levelYs={levelYs}
              xRight={xRight}
              chartWidth={chartWidth}
              font={font}
            />
          ))
        : null}

      {levelsPrepared.length > 1
        ? levelsPrepared.map((_, bandIdx) => (
            <FibBand
              // bands are between sortedIndices[bandIdx] and [bandIdx+1]
              key={`fib-band-${bandIdx}`}
              bandIdx={bandIdx}
              levels={levelsPrepared}
              levelYs={levelYs}
              sortedIndices={sortedIndices}
              xLeft={xLeft}
              xRight={xRight}
            />
          ))
        : null}
    </Group>
  )
}

function FibBand({
  bandIdx,
  levels,
  levelYs,
  sortedIndices,
  xLeft,
  xRight,
}: {
  bandIdx: number
  levels: PreparedLevel[]
  levelYs: { value: number[] }
  sortedIndices: { value: number[] }
  xLeft: { value: number }
  xRight: { value: number }
}) {
  const defaultRect = rrect({ x: 0, y: -1000, width: 0, height: 0 }, 4, 4)
  const bandRect = useSharedValue(defaultRect)
  const rectOuter = useSharedValue(defaultRect)

  useDerivedValue(() => {
    const order = sortedIndices.value
    if (bandIdx >= order.length - 1) {
      bandRect.value = defaultRect
      rectOuter.value = defaultRect
      return
    }

    const a = order[bandIdx]
    const b = order[bandIdx + 1]
    const y1 = levelYs.value[a] ?? 0
    const y2 = levelYs.value[b] ?? 0

    const y = Math.min(y1, y2)
    const h = Math.max(1, Math.abs(y2 - y1))
    const x = xLeft.value
    const w = Math.max(0, xRight.value - xLeft.value)

    bandRect.value = rrect({ x, y, width: w, height: h }, 4, 4)
    rectOuter.value = rrect({ x, y, width: w, height: h + 1.5 }, 4, 4)
  })

  const color = useDerivedValue(() => {
    const order = sortedIndices.value
    if (bandIdx >= order.length - 1) return '#000000'
    const idx = order[bandIdx]
    return levels[idx]?.color ?? '#000000'
  })

  const opacity = useDerivedValue(() => {
    const order = sortedIndices.value
    return bandIdx >= order.length - 1 ? 0 : 1
  })

  return (
    <Group opacity={opacity}>
      <RoundedRect rect={bandRect} color={color} opacity={BAND_OPACITY} />

      <DiffRect
        inner={bandRect}
        outer={rectOuter}
        color={color}
        style='fill'
        strokeWidth={STROKE_WIDTH}
        strokeCap='round'
      />
    </Group>
  )
}

function FibLevelLabel({
  index,
  levels,
  levelYs,
  xRight,
  chartWidth,
  font,
}: {
  index: number
  levels: PreparedLevel[]
  levelYs: { value: number[] }
  xRight: { value: number }
  chartWidth: number
  font: NonNullable<FibonacciLevelsRendererProps['font']>
}) {
  const level = levels[index]

  const y = useDerivedValue(() => (levelYs.value[index] ?? 0) - 3)

  const textX = useDerivedValue(() => {
    // Place labels to the RIGHT of the fib segment end.
    const desired = xRight.value + 12

    return desired
  })

  const text = useDerivedValue(() => level.label)

  const labelRect = useDerivedValue(() =>
    rrect(
      {
        x: textX.value - LABEL_PADDING_X,
        y: y.value - level.textHeight + 3 - LABEL_PADDING_Y,
        width: level.textWidth + LABEL_PADDING_X * 2,
        height: level.textHeight + LABEL_PADDING_Y * 2,
      },
      4,
      4,
    ),
  )

  return (
    <Group>
      <RoundedRect rect={labelRect} color={level.color} />
      <Text x={textX} y={y} text={text} font={font} color={'#fff'} />
    </Group>
  )
}
