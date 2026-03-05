import { IColorsConfig } from '../types'

// Chart dimensions and constraints
export const MIN_CANDLE_WIDTH = 2
export const MAX_CANDLE_WIDTH = 40
export const INIT_CANDLE_WIDTH = 12
export const RIGHT_PADDING_PX = 150
export const TOP_PADDING_PX = 16 // Top padding for chart area
export const TIME_LABEL_AREA_HEIGHT = 16 // Height of the time grid labels area
export const BUFFER_CANDLES = 10 // Extra candles to render beyond viewport

// Scale constraints (horizontal - candle width)
export const MIN_SCALE = 0.5
export const MAX_SCALE = 3.0

// Scale constraints (vertical - price spread)
export const MIN_SCALE_Y = 0.02 // Zoom out max (see 2x more price range)
export const MAX_SCALE_Y = 4.0 // Zoom in max (see 4x less price range)

// Colors
export const WICK_WIDTH = 1
export const LINE_WIDTH = 2

// Animation
export const SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
  mass: 0.5,
}

// Grid - adaptive spacing
export const MIN_GRID_PIXEL_STEP = 50 // Minimum pixels between lines → remove lines
export const MAX_GRID_PIXEL_STEP = 60 // Maximum pixels between lines → add lines
export const TARGET_GRID_PIXEL_STEP = 55 // Target pixel spacing

// Hysteresis factors to prevent grid line flickering during zoom
export const GRID_HYSTERESIS_LOWER = 0.7 // Trigger correction only if < MIN * 0.7
export const GRID_HYSTERESIS_UPPER = 1.3 // Trigger correction only if > MAX * 1.3

// Candles render limits
export const VISIBLE_CANDLES_BUFFER = 10

// Indicator grid - adaptive spacing (indicator pane is smaller)
export const INDICATOR_MIN_GRID_PIXEL_STEP = 20
export const INDICATOR_MAX_GRID_PIXEL_STEP = 40
export const INDICATOR_TARGET_GRID_PIXEL_STEP = 30

// Time grid (vertical lines)
export const TARGET_TIME_GRID_PIXEL_STEP = 100 // Целевое расстояние
export const MIN_TIME_GRID_PIXEL_STEP = 80 // Минимум
export const MAX_TIME_GRID_PIXEL_STEP = 120 // Максимум

// Time grid hysteresis to prevent flickering
export const TIME_GRID_HYSTERESIS_LOWER = 0.4 // Trigger correction only if < MIN * 0.7
export const TIME_GRID_HYSTERESIS_UPPER = 0.9 // Trigger correction only if > MAX * 1.3

export const LAST_PRICE_MARKER_RECT_HEIGHT = 20
export const LAST_PRICE_MARKER_RECT_PADDING = 6

export const LONG_PRESS_DURATION = 500

export const TOOLTIP_CORNER_RADIUS = 12
export const TOOLTIP_PADDING = 12
export const TOOLTIP_ITEM_SPACING = 10
export const TOOLTIP_LABEL_VALUE_SPACING = 10

export const DEFAULT_COLORS_CONFIG: IColorsConfig = {
  bg: '#fff',
  text: '#000',
  stroke: '#666',
  grid: '#eee',
  indicator: '#8b5cf6',
  indicators: ['#000', '#8b5cf6', '#5100ff'],
  line: '#33d1ff',
  macdPositiveHistogram: '#0A9700',
  macdNegativeHistogram: '#C90003',
  bullishDiver: '#0A9700',
  bearishDiver: '#C90003',
  bullCandle: '#0A9700',
  bearCandle: '#C90003',
}
