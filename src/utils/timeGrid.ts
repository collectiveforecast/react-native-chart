import {
  MAX_TIME_GRID_PIXEL_STEP,
  MIN_TIME_GRID_PIXEL_STEP,
  TARGET_TIME_GRID_PIXEL_STEP,
  TIME_GRID_HYSTERESIS_LOWER,
  TIME_GRID_HYSTERESIS_UPPER,
} from './constants'

/**
 * Preferred steps for smooth transitions (not nice numbers, just stable intervals)
 */
const PREFERRED_STEPS = [
  1, 2, 3, 5, 7, 10, 15, 20, 30, 40, 50, 75, 100, 150, 200, 300, 500,
]

/**
 * Find closest preferred step to target
 */
function findPreferredStep(rawStep: number): number {
  'worklet'

  if (rawStep <= 1) return 1

  let closest = PREFERRED_STEPS[0]
  let minDiff = Math.abs(rawStep - closest)

  for (let i = 1; i < PREFERRED_STEPS.length; i++) {
    const step = PREFERRED_STEPS[i]
    const diff = Math.abs(rawStep - step)
    if (diff < minDiff) {
      minDiff = diff
      closest = step
    } else {
      break
    }
  }

  return closest
}

/**
 * Calculate candle step for vertical grid lines
 * Uses preferred steps for smooth transitions with hysteresis
 */
export function calculateCandleStep(
  candleWidth: number,
  targetPixelStep?: number,
): number {
  'worklet'

  if (candleWidth <= 0) return 1

  const target = targetPixelStep ?? TARGET_TIME_GRID_PIXEL_STEP

  const rawStep = target / candleWidth
  let step = findPreferredStep(rawStep)

  const resultingPixelStep = step * candleWidth

  if (
    resultingPixelStep <
    MIN_TIME_GRID_PIXEL_STEP * TIME_GRID_HYSTERESIS_LOWER
  ) {
    const nextStepIndex = PREFERRED_STEPS.indexOf(step) + 1
    if (nextStepIndex < PREFERRED_STEPS.length) {
      step = PREFERRED_STEPS[nextStepIndex]
    } else {
      step = Math.max(1, Math.round(rawStep * 1.5))
    }
  } else if (
    resultingPixelStep >
    MAX_TIME_GRID_PIXEL_STEP * TIME_GRID_HYSTERESIS_UPPER
  ) {
    const prevStepIndex = PREFERRED_STEPS.indexOf(step) - 1
    if (prevStepIndex >= 0) {
      step = PREFERRED_STEPS[prevStepIndex]
    } else {
      step = Math.max(1, Math.round(rawStep / 1.5))
    }
  }

  return step
}

/**
 * Generate indices for vertical grid lines
 */
export function generateTimeGridIndices(
  startIdx: number,
  endIdx: number,
  candleStep: number,
): number[] {
  'worklet'

  if (candleStep <= 0) return []

  const aligned = Math.floor(startIdx / candleStep) * candleStep
  const indices: number[] = []

  for (let i = aligned; i <= endIdx + candleStep; i += candleStep) {
    if (i >= startIdx - candleStep) {
      indices.push(i)
    }
  }

  return indices
}
