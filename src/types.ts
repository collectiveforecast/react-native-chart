import type {
  SkFont,
  SkPath,
  SkRect,
  SkRRect,
} from "@shopify/react-native-skia";
import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import type { SharedValue } from "react-native-reanimated";

// =========================
// Shared primitives
// =========================

export type BinaryFlag = 0 | 1;

export type ChartType = "line" | "candlestick";

export type MinMaxRange = { min: number; max: number };
export type StartEndRange = { start: number; end: number };
export type XYPoint = { x: number; y: number };

// =========================
// Indicator data model
// =========================

export type IndicatorPoint = { value: number; timestamp: number };

export type Swing = {
  direction?: string;
  value: number;
  time: number;
};

export type FibLevel = {
  level: number;
  price: number;
  percentage: number;
};

export type FibLevelData = {
  startTime: number;
  startPrice: number;
  endTime: number;
  endPrice: number;
  isUptrend: boolean;
  levels: FibLevel[];
};

export type Diver = {
  type: string;
  indicatorSwing1: Swing;
  indicatorSwing2: Swing;
  priceSwing1: Swing;
  priceSwing2: Swing;
  strength: string;
};

// 1..3 series (lines) for indicator renderer
export type IndicatorSeries = IndicatorPoint[];
export type IndicatorData = IndicatorSeries[];

// =========================
// Chart
// =========================

export interface Kline {
  low: number;
  high: number;
  open: number;
  close: number;
  value: number;
  volume: number;
  timestamp: number;
}

export interface IColorsConfig {
  bg?: string;
  text?: string;
  stroke?: string;
  grid?: string;
  indicator?: string;
  indicators?: string[];
  indicatorContainerBg?: string;
  line?: string;
  macdPositiveHistogram?: string;
  macdNegativeHistogram?: string;
  bullishDiver?: string;
  bearishDiver?: string;
  bullCandle?: string;
  bearCandle?: string;
}

export interface IChartProps {
  data: Kline[];
  width: number;
  height: number;
  fontRegular: SkFont;
  fontMedium: SkFont;
  chartType?: ChartType;
  onLoadMore?: (firstItemTimestamp: number) => void;
  indicatorData?: IndicatorData;
  fibonacciLevels?: FibLevelData;
  /**
   * How to interpret and render `indicatorData`.
   * - `default`: 1..3 line series rendered by `IndicatorLineRenderer`
   * - `macd`: `[macdLine, signalLine, histogram]` (2 lines + histogram bars)
   */
  indicatorContainerPadding?: number;
  indicatorVariant?: "default" | "macd";
  indicatorHeight?: number;
  indicatorShowGradient?: boolean;
  indicatorFixedMin?: number;
  additionalContent?: ReactNode;
  divers?: Diver[];
  indicatorFixedMax?: number;
  disableYAxisPan?: boolean;
  indicatorTopEmptySpace?: number;
  extraContainerStyle?: StyleProp<ViewStyle>;
  colors?: IColorsConfig;
}

// =========================
// Hooks
// =========================

export interface UseChartStateParams {
  data: Kline[];
  width: number;
  height: number;
  indicatorData?: IndicatorData;
  indicatorHeight?: number;
  indicatorFixedMin?: number;
  indicatorFixedMax?: number;
  labelFont: SkFont;
  disableYAxisPan?: boolean;
  indicatorTopEmptySpace: number;
  indicatorContainerPadding?: number;
}

export interface UseChartCoordinatesProps {
  data: Kline[];
  width: SharedValue<number>;
  height: number;
}

export type ChartGestureIndicatorPane = {
  scaleY: SharedValue<number>;
  translateY: SharedValue<number>;
  isFreeScroll: SharedValue<BinaryFlag>;
  enterFreeScroll: () => void;
  exitFreeScroll: () => void;
  topY: number;
  height: number;
};

export interface UseChartGesturesOptions {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  candleWidth: SharedValue<number>;
  scaleY: SharedValue<number>;
  isFreeScroll: SharedValue<BinaryFlag>;
  enterFreeScroll: () => void;
  exitFreeScroll: () => void;
  totalCandles: number;
  chartWidth: SharedValue<number>;
  rightZoneWidth: SharedValue<number>;
  minVisiblePoints?: number;
  enterRangeSelector: () => void;
  exitRangeSelector: () => void;
  isRangeSelector: SharedValue<BinaryFlag>;
  firstFingerX: SharedValue<number>;
  secondFingerX: SharedValue<number>;
  enterCrosshair: () => void;
  exitCrosshair: () => void;
  isCrosshairVisible: SharedValue<BinaryFlag>;
  crosshairPosition: SharedValue<XYPoint>;
  indicator?: ChartGestureIndicatorPane;
  disableYAxisPan?: boolean;
}

export interface UseIndicatorCoordinatesParams {
  data: IndicatorData | undefined;
  width: SharedValue<number>;
  height: number;
  translateX: SharedValue<number>;
  candleWidth: SharedValue<number>;
  enabled: boolean;
  fixedMin?: number;
  fixedMax?: number;
}

// =========================
// Renderers
// =========================

export interface LineRendererProps {
  data: Kline[];
  translateX: SharedValue<number>;
  candleWidth: SharedValue<number>;
  adjustedPriceRange: SharedValue<MinMaxRange>;
  visibleRange: SharedValue<StartEndRange>;
  height: number;
  chartWidth: number;
  colors: IColorsConfig;
}

export interface CandlestickRendererProps {
  data: Kline[];
  translateX: SharedValue<number>;
  candleWidth: SharedValue<number>;
  adjustedPriceRange: SharedValue<MinMaxRange>;
  visibleRange: SharedValue<StartEndRange>;
  height: number;
  chartWidth: number;
  colors: IColorsConfig;
}

export interface DiversRendererProps {
  data: Kline[];
  divers: Diver[];
  /**
   * Which divergence segment to render:
   * - `price`: uses `priceSwing1/2` (plotted in the main price pane)
   * - `indicator`: uses `indicatorSwing1/2` (plotted in the indicator pane)
   */
  target: "price" | "indicator";
  colors: IColorsConfig;
  chartWidth: number;
  height: number;
  /**
   * Y offset of the pane (only relevant for `target: 'indicator'`).
   */
  yOffset?: number;
  translateX: SharedValue<number>;
  candleWidth: SharedValue<number>;
  adjustedPriceRange: SharedValue<MinMaxRange>;
}

export interface DivergenceSegmentProps {
  divergence: Diver;
  target: DiversRendererProps["target"];
  data: Kline[];
  translateX: SharedValue<number>;
  candleWidth: SharedValue<number>;
  adjustedRange: SharedValue<MinMaxRange>;
  height: number;
  yOffset: number;
  colors: IColorsConfig;
}

export interface FibonacciLevelsRendererProps {
  data: Kline[];
  fibonacciLevels: FibLevelData;
  translateX: SharedValue<number>;
  candleWidth: SharedValue<number>;
  adjustedPriceRange: SharedValue<MinMaxRange>;
  chartWidth: number;
  height: number;
  font: SkFont;
  colors: IColorsConfig;
}

export interface GridRendererProps {
  width: SharedValue<number>;
  height: number;
  chartHeight: number;
  adjustedPriceRange: SharedValue<MinMaxRange>;
  rightZoneWidth: SharedValue<number>;
  colors: IColorsConfig;
  font: SkFont;
}

export interface GridLabelProps {
  index: number;
  rightZoneWidth: SharedValue<number>;
  priceLevels: SharedValue<number[]>;
  adjustedPriceRange: SharedValue<MinMaxRange>;
  width: SharedValue<number>;
  height: number;
  font: SkFont;
  colors: IColorsConfig;
}

export interface TimeGridRendererProps {
  data: Kline[];
  width: SharedValue<number>;
  height: number;
  chartHeight: number;
  chartWidth: number;
  colors: IColorsConfig;
  pricePlotHeight: number;
  translateX: SharedValue<number>;
  candleWidth: SharedValue<number>;
  visibleRange: SharedValue<StartEndRange>;
  font: SkFont;
  indicatorContainerPadding: number;
}

export interface TimeGridLineProps {
  index: number;
  gridIndices: SharedValue<number[]>;
  data: Kline[];
  translateX: SharedValue<number>;
  candleWidth: SharedValue<number>;
  width: SharedValue<number>;
  height: number;
  font: SkFont;
  colors: IColorsConfig;
}

export interface IndicatorContainerProps {
  chartWidth: number;
  chartHeight: number;
  indicatorHeight: number;
  colors: IColorsConfig;
  indicatorContainerPadding: number;
}

export interface IndicatorLineRendererProps {
  data: IndicatorData;
  translateX: SharedValue<number>;
  candleWidth: SharedValue<number>;
  adjustedValueRange: SharedValue<MinMaxRange>;
  visibleRange: SharedValue<StartEndRange>;
  height: number;
  yOffset: number;
  clip?: SkRRect | SkRect;
  colors: IColorsConfig;
  baselineValue?: number;
  showGradient?: boolean;
  containerBgColor?: string;
  containerHorizontalInset?: number;
  containerBorderRadius?: number;
  containerWidth?: number;
  containerTopY?: number;
  containerHeight?: number;
}

export interface IndicatorHistogramRendererProps {
  series: IndicatorSeries;
  translateX: SharedValue<number>;
  candleWidth: SharedValue<number>;
  adjustedValueRange: SharedValue<MinMaxRange>;
  visibleRange: SharedValue<StartEndRange>;
  height: number;
  yOffset: number;
  colors: IColorsConfig;
  barWidthFactor?: number;
}

export interface IndicatorGridRendererProps {
  width: SharedValue<number>;
  height: number;
  widthOffset?: number;
  clip?: SkRRect;
  yOffset: number;
  adjustedValueRange: SharedValue<MinMaxRange>;
  rightZoneWidth: SharedValue<number>;
  colors: IColorsConfig;
  font: SkFont;
}

export interface IndicatorGridLabelProps {
  index: number;
  widthOffset?: number;
  rightZoneWidth: SharedValue<number>;
  valueLevels: SharedValue<number[]>;
  adjustedValueRange: SharedValue<MinMaxRange>;
  width: SharedValue<number>;
  height: number;
  yOffset: number;
  font: SkFont;
  colors: IColorsConfig;
}

export interface ILastPriceMarkerProps {
  value?: number;
  font: SkFont;
  chartWidth: SharedValue<number>;
  adjustedRange: SharedValue<MinMaxRange>;
  rightZoneWidth: SharedValue<number>;
  height: number;
  widthOffset?: number;
  clip?: SkRRect | SkRect;
  yOffset?: number;
  isRangeSelector: SharedValue<BinaryFlag>;
  isCrosshairVisible: SharedValue<BinaryFlag>;
  colors: IColorsConfig;
}

export interface ICrosshairProps {
  font: SkFont;
  chartWidth: SharedValue<number>;
  chartHeight: number;
  adjustedPriceRange: SharedValue<MinMaxRange>;
  rightZoneWidth: SharedValue<number>;
  crosshairPosition: SharedValue<XYPoint>;
  isCrosshairVisible: SharedValue<BinaryFlag>;
  colors: IColorsConfig;
}

export interface ITooltipProps {
  data: Kline[];
  chartType: ChartType;
  translateX: SharedValue<number>;
  candleWidth: SharedValue<number>;
  isCrosshairVisible: SharedValue<BinaryFlag>;
  crosshairPosition: SharedValue<XYPoint>;
  font: SkFont;
  chartWidth: number;
  chartHeight: number;
  colors: IColorsConfig;
}

export interface IScrollBtnProps {
  colors: IColorsConfig;
  translateY: SharedValue<number>;
  indicatorTranslateY?: SharedValue<number>;
  initialTranslateX: SharedValue<number>;
  chartWidth: SharedValue<number>;
  translateX: SharedValue<number>;
  plotHeight: number;
  width: number;
}

export interface IRangeSelectorProps {
  height: number;
  colors: IColorsConfig;
  firstFingerX: SharedValue<number>;
  secondFingerX: SharedValue<number>;
  isRangeSelector: SharedValue<BinaryFlag>;
}

export interface IRangeSelectorInfoProps {
  data: Kline[];
  font: SkFont;
  colors: IColorsConfig;
  translateX: SharedValue<number>;
  candleWidth: SharedValue<number>;
  firstFingerX: SharedValue<number>;
  secondFingerX: SharedValue<number>;
  isRangeSelector: SharedValue<BinaryFlag>;
}

export interface IndicatorGapProps {
  width: number;
  colors: IColorsConfig;
  chartHeight: number;
  indicatorTopEmptySpace: number;
}

// =========================
// Utils: indicator paths
// =========================

export type BuildIndicatorStrokePathParams = {
  path: SkPath;
  series: IndicatorPoint[] | undefined;
  from: number;
  to: number;
  candleWidth: number;
  translateX: number;
  min: number;
  max: number;
  height: number;
  yOffset: number;
};

export type BuildIndicatorStrokeAndBaselineFillsParams = {
  linePath: SkPath;
  positiveFillPath: SkPath;
  negativeFillPath: SkPath;
  series: IndicatorPoint[] | undefined;
  from: number;
  to: number;
  candleWidth: number;
  translateX: number;
  min: number;
  max: number;
  height: number;
  yOffset: number;
  baselineY: number;
};

export type BaselineFillExtents = {
  minYPositive: number;
  maxYNegative: number;
};
