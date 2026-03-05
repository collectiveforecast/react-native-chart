import { Canvas, Group, rrect } from "@shopify/react-native-skia";
import { View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import { useAnimatedReaction, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { useChartState } from "./hooks/useChartState";
import {
  CandlestickRenderer,
  Crosshair,
  DiversRenderer,
  FibonacciLevelsRenderer,
  GridRenderer,
  IndicatorContainer,
  IndicatorGap,
  IndicatorGridRenderer,
  IndicatorHistogramRenderer,
  IndicatorLineRenderer,
  LastPriceMarker,
  LineRenderer,
  RangeSelector,
  RangeSelectorInfo,
  ScrollBtn,
  TimeGridRenderer,
  Tooltip,
} from "./renderers";
import type { IChartProps } from "./types";
import { DEFAULT_COLORS_CONFIG } from "./utils/constants";

/*
 * Z-index:
 * 4 - Range selector info
 *
 * 3 - Crosshair
 * 3 - Last price marker
 * 3 - Price grid labels
 *
 * 2 - Time grid labels
 * 2 - Indicator value labels
 * 2 - Indicator gap
 * 2 - Fibonacci levels
 *
 * 1 - Indicator line
 * 1 - Range selector
 * 1 - Chart content (candlestick, line)
 *
 * 0 - Grid
 * 0 - Indicator grid
 */

export function Chart({
  data,
  width,
  height,
  fontRegular,
  fontMedium,
  divers,
  fibonacciLevels,
  chartType = "line",
  onLoadMore,
  indicatorData,
  indicatorVariant = "default",
  indicatorHeight,
  indicatorShowGradient,
  indicatorContainerPadding = 0,
  additionalContent,
  indicatorFixedMin,
  indicatorFixedMax,
  disableYAxisPan,
  indicatorTopEmptySpace = 0,
  extraContainerStyle,
  colors = DEFAULT_COLORS_CONFIG,
}: IChartProps) {
  const isLoadingMoreRef = useSharedValue(false);

  const lastChartValue =
    data.length > 0
      ? chartType === "line"
        ? data[data.length - 1]?.value
        : data[data.length - 1]?.close
      : undefined;

  const lastIndicatorValue =
    indicatorData && indicatorData.length > 0
      ? (() => {
          const firstNonEmpty = indicatorData.find((s) => (s?.length ?? 0) > 0);
          if (!firstNonEmpty) return undefined;
          for (let i = firstNonEmpty.length - 1; i >= 0; i--) {
            const v = firstNonEmpty[i]?.value;
            if (typeof v === "number" && Number.isFinite(v)) return v;
          }
          return undefined;
        })()
      : undefined;

  const {
    chart,
    indicator,
    gesture,
    chartWidth,
    rightZoneWidth,
    pricePlotHeight,
    indicatorPlotHeight,
    hasIndicator,
    indicatorTopY,
    totalCanvasHeight,
  } = useChartState({
    data,
    width,
    height,
    indicatorData,
    indicatorHeight,
    indicatorFixedMin,
    indicatorFixedMax,
    labelFont: fontMedium,
    indicatorTopEmptySpace,
    disableYAxisPan,
    indicatorContainerPadding,
  });

  useAnimatedReaction(
    () => chart.visibleRange.value.start,
    (startIndex, previousStartIndex) => {
      // Check if we've reached the beginning (start === 0)
      // and we haven't already triggered a load
      if (
        startIndex < 20 &&
        previousStartIndex !== undefined &&
        previousStartIndex !== 0 &&
        data.length > 0 &&
        onLoadMore
      ) {
        // Get timestamp of first candle
        const firstCandleTimestamp = data[0]?.timestamp;
        if (firstCandleTimestamp && !isLoadingMoreRef.value) {
          isLoadingMoreRef.value = true;
          scheduleOnRN(onLoadMore, firstCandleTimestamp);
        }
      }
      // Reset loading flag when startIndex changes away from 0
      if (startIndex !== 0 && isLoadingMoreRef.value) {
        isLoadingMoreRef.value = false;
      }
    },
    [data, onLoadMore],
  );

  const indicatorClip = indicatorContainerPadding
    ? rrect(
        {
          width: width - indicatorContainerPadding * 4,
          height: (indicatorHeight ?? 0) - 8 - indicatorTopEmptySpace,
          x: indicatorContainerPadding * 2,
          y: height + indicatorTopEmptySpace,
        },
        8,
        8,
      )
    : undefined;

  return (
    <View
      style={[{ width, minHeight: totalCanvasHeight }, extraContainerStyle]}
    >
      <ScrollBtn
        colors={colors}
        initialTranslateX={chart.initialTranslateX}
        chartWidth={chartWidth}
        translateX={chart.translateX}
        translateY={chart.translateY}
        indicatorTranslateY={indicator.translateY}
        plotHeight={pricePlotHeight}
        width={width}
      />

      {additionalContent}

      <GestureDetector gesture={gesture}>
        <Canvas style={{ width, height: totalCanvasHeight }}>
          <Group>
            <RangeSelectorInfo
              firstFingerX={chart.firstFingerX}
              secondFingerX={chart.secondFingerX}
              isRangeSelector={chart.isRangeSelector}
              font={fontMedium}
              data={data}
              colors={colors}
              translateX={chart.translateX}
              candleWidth={chart.candleWidth}
            />

            <GridRenderer
              width={chartWidth}
              height={pricePlotHeight}
              chartHeight={height}
              adjustedPriceRange={chart.adjustedPriceRange}
              rightZoneWidth={rightZoneWidth}
              colors={colors}
              font={fontMedium}
            />

            <TimeGridRenderer
              data={data}
              chartWidth={width}
              chartHeight={height + (indicatorHeight ?? 0)}
              width={chartWidth}
              height={pricePlotHeight}
              pricePlotHeight={totalCanvasHeight}
              colors={colors}
              translateX={chart.translateX}
              candleWidth={chart.candleWidth}
              visibleRange={chart.visibleRange}
              font={fontRegular}
              indicatorContainerPadding={indicatorContainerPadding}
            />

            {hasIndicator && indicatorData ? (
              <>
                {indicatorHeight && !!indicatorContainerPadding && (
                  <IndicatorContainer
                    colors={colors}
                    chartWidth={width}
                    chartHeight={height}
                    indicatorHeight={indicatorHeight}
                    indicatorContainerPadding={indicatorContainerPadding}
                  />
                )}

                <IndicatorGap
                  width={width}
                  colors={colors}
                  chartHeight={height}
                  indicatorTopEmptySpace={indicatorTopEmptySpace}
                />

                <IndicatorGridRenderer
                  clip={indicatorClip}
                  width={chartWidth}
                  widthOffset={indicatorContainerPadding * 2}
                  height={indicatorPlotHeight}
                  yOffset={indicatorTopY}
                  adjustedValueRange={indicator.adjustedRange}
                  rightZoneWidth={rightZoneWidth}
                  colors={colors}
                  font={fontMedium}
                />

                {divers && (
                  <DiversRenderer
                    data={data}
                    divers={divers}
                    target="indicator"
                    yOffset={indicatorTopY}
                    chartWidth={width}
                    height={indicatorPlotHeight}
                    colors={colors}
                    translateX={chart.translateX}
                    candleWidth={chart.candleWidth}
                    adjustedPriceRange={indicator.adjustedRange}
                  />
                )}

                {indicatorVariant === "macd" && indicatorData.length >= 3 ? (
                  <IndicatorHistogramRenderer
                    series={indicatorData[2] ?? []}
                    translateX={chart.translateX}
                    candleWidth={chart.candleWidth}
                    adjustedValueRange={indicator.adjustedRange}
                    visibleRange={chart.visibleRange}
                    height={indicatorPlotHeight}
                    yOffset={indicatorTopY}
                    colors={colors}
                  />
                ) : null}

                <IndicatorLineRenderer
                  data={
                    indicatorVariant === "macd"
                      ? indicatorData.slice(0, 2)
                      : indicatorData
                  }
                  translateX={chart.translateX}
                  candleWidth={chart.candleWidth}
                  adjustedValueRange={indicator.adjustedRange}
                  visibleRange={chart.visibleRange}
                  height={indicatorPlotHeight}
                  clip={indicatorClip}
                  yOffset={indicatorTopY}
                  colors={colors}
                  showGradient={indicatorShowGradient}
                />

                {indicatorData.length === 1 && (
                  <LastPriceMarker
                    value={lastIndicatorValue}
                    clip={indicatorClip}
                    isRangeSelector={chart.isRangeSelector}
                    isCrosshairVisible={chart.isCrosshairVisible}
                    rightZoneWidth={rightZoneWidth}
                    widthOffset={indicatorContainerPadding * 2}
                    font={fontMedium}
                    chartWidth={chartWidth}
                    adjustedRange={indicator.adjustedRange}
                    height={indicatorPlotHeight}
                    yOffset={indicatorTopY}
                    colors={colors}
                  />
                )}
              </>
            ) : null}

            {chartType === "candlestick" ? (
              <>
                <CandlestickRenderer
                  data={data}
                  chartWidth={width}
                  translateX={chart.translateX}
                  candleWidth={chart.candleWidth}
                  adjustedPriceRange={chart.adjustedPriceRange}
                  visibleRange={chart.visibleRange}
                  height={pricePlotHeight}
                  colors={colors}
                />

                {fibonacciLevels ? (
                  <FibonacciLevelsRenderer
                    data={data}
                    fibonacciLevels={fibonacciLevels}
                    chartWidth={width}
                    height={pricePlotHeight}
                    font={fontRegular}
                    translateX={chart.translateX}
                    candleWidth={chart.candleWidth}
                    adjustedPriceRange={chart.adjustedPriceRange}
                    colors={colors}
                  />
                ) : null}

                {divers && (
                  <DiversRenderer
                    data={data}
                    divers={divers}
                    target="price"
                    chartWidth={width}
                    height={pricePlotHeight}
                    colors={colors}
                    translateX={chart.translateX}
                    candleWidth={chart.candleWidth}
                    adjustedPriceRange={chart.adjustedPriceRange}
                  />
                )}
              </>
            ) : (
              <LineRenderer
                data={data}
                translateX={chart.translateX}
                candleWidth={chart.candleWidth}
                adjustedPriceRange={chart.adjustedPriceRange}
                visibleRange={chart.visibleRange}
                height={pricePlotHeight}
                chartWidth={width}
                colors={colors}
              />
            )}

            <LastPriceMarker
              value={lastChartValue}
              isRangeSelector={chart.isRangeSelector}
              isCrosshairVisible={chart.isCrosshairVisible}
              rightZoneWidth={rightZoneWidth}
              font={fontMedium}
              chartWidth={chartWidth}
              adjustedRange={chart.adjustedPriceRange}
              height={pricePlotHeight}
              colors={colors}
            />

            <RangeSelector
              height={pricePlotHeight}
              colors={colors}
              firstFingerX={chart.firstFingerX}
              secondFingerX={chart.secondFingerX}
              isRangeSelector={chart.isRangeSelector}
            />

            <Crosshair
              font={fontRegular}
              chartWidth={chartWidth}
              chartHeight={pricePlotHeight}
              rightZoneWidth={rightZoneWidth}
              crosshairPosition={chart.crosshairPosition}
              isCrosshairVisible={chart.isCrosshairVisible}
              adjustedPriceRange={chart.adjustedPriceRange}
              colors={colors}
            />

            <Tooltip
              data={data}
              chartType={chartType}
              translateX={chart.translateX}
              candleWidth={chart.candleWidth}
              crosshairPosition={chart.crosshairPosition}
              isCrosshairVisible={chart.isCrosshairVisible}
              font={fontMedium}
              chartWidth={width}
              chartHeight={pricePlotHeight}
              colors={colors}
            />
          </Group>
        </Canvas>
      </GestureDetector>
    </View>
  );
}
