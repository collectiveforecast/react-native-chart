import { Path, Rect, Skia, Text } from "@shopify/react-native-skia";
import { Dimensions } from "react-native";
import { useDerivedValue, withTiming } from "react-native-reanimated";

import type { IRangeSelectorInfoProps } from "../types";
import { formatPrice, xToIndex } from "../utils/coordinates";

export function RangeSelectorInfo({
  data,
  font,
  colors,
  translateX,
  candleWidth,
  firstFingerX,
  secondFingerX,
  isRangeSelector,
}: IRangeSelectorInfoProps) {
  // Find candle indices based on finger positions
  const firstCandleIndex = useDerivedValue(() => {
    "worklet";
    if (isRangeSelector.value === 0) return -1;

    const index = xToIndex(
      firstFingerX.value,
      candleWidth.value,
      translateX.value,
    );

    // Clamp to valid range
    return Math.max(0, Math.min(data.length - 1, index));
  });

  const secondCandleIndex = useDerivedValue(() => {
    "worklet";
    if (isRangeSelector.value === 0) return -1;

    const index = xToIndex(
      secondFingerX.value,
      candleWidth.value,
      translateX.value,
    );

    // Clamp to valid range
    return Math.max(0, Math.min(data.length - 1, index));
  });

  // Get actual candle data
  const firstCandle = useDerivedValue(() => {
    "worklet";
    const index = firstCandleIndex.value;
    if (index < 0 || index >= data.length) return null;
    return data[index];
  });

  const secondCandle = useDerivedValue(() => {
    "worklet";
    const index = secondCandleIndex.value;
    if (index < 0 || index >= data.length) return null;
    return data[index];
  });

  // Calculate range (start and end indices, ensuring start < end)
  const rangeIndices = useDerivedValue(() => {
    "worklet";
    if (isRangeSelector.value === 0) {
      return { start: -1, end: -1 };
    }

    const first = firstCandleIndex.value;
    const second = secondCandleIndex.value;

    return {
      start: Math.min(first, second),
      end: Math.max(first, second),
    };
  });

  // Get all candles in the selected range
  const rangeCandles = useDerivedValue(() => {
    "worklet";
    const { start, end } = rangeIndices.value;

    if (start < 0 || end < 0 || start >= data.length || end >= data.length) {
      return [];
    }

    const candles = [];
    for (let i = start; i <= end; i++) {
      if (data[i]) {
        candles.push(data[i]);
      }
    }

    return candles;
  });

  const priceChange = useDerivedValue(() => {
    const candles = rangeCandles.value;
    const first = candles.length > 0 ? (candles[0]?.close ?? 0) : 0;
    const second =
      candles.length > 0 ? (candles[candles.length - 1]?.close ?? 0) : 0;
    return formatPrice(second - first) + " USDT";
  });

  const candlesCount = useDerivedValue(() => {
    return "Candles: " + rangeCandles.value.length;
  });

  const timeRange = useDerivedValue(() => {
    const first = firstCandle.value?.timestamp ?? 0;
    const second = secondCandle.value?.timestamp ?? 0;

    const dif = Math.abs(second - first);
    const hours = Math.floor(dif / (1000 * 60 * 60));
    const minutes = Math.floor((dif % (1000 * 60 * 60)) / (1000 * 60));
    const day = Math.floor(hours / 24);
    const dayStr = day > 0 ? day + "d " : "";
    const hoursStr = hours % 24 > 0 ? (hours % 24) + "h " : "";
    const minutesStr = minutes % 60 > 0 ? (minutes % 60) + "m" : "";
    return "Time: " + dayStr + hoursStr + minutesStr;
  });

  const changePercent = useDerivedValue(() => {
    const candles = rangeCandles.value;
    const first = candles.length > 0 ? (candles[0]?.close ?? 0) : 0;
    const second =
      candles.length > 0 ? (candles[candles.length - 1]?.close ?? 0) : 0;
    const value = ((second - first) / first) * 100 || 0;
    return value.toFixed(2) + "%";
  });

  const changeColor = useDerivedValue(() => {
    const candles = rangeCandles.value;
    const first = candles.length > 0 ? (candles[0]?.close ?? 0) : 0;
    const second =
      candles.length > 0 ? (candles[candles.length - 1]?.close ?? 0) : 0;
    return second - first > 0 ? colors.bullCandle : colors.bearCandle;
  });

  const opacity = useDerivedValue(() => {
    return withTiming(isRangeSelector.value ? 1 : 0, { duration: 150 });
  });

  const changePriceX = useDerivedValue(() => {
    return width / 2 - font.measureText(priceChange.value).width - 8;
  });

  const timeRangeX = useDerivedValue(() => {
    return width - font.measureText(timeRange.value).width - 8;
  });

  const separatorPath = useDerivedValue(() => {
    return Skia.Path.Make()
      .moveTo(width * 0.2, 0)
      .lineTo(width * 0.2, 12)
      .moveTo(width / 2, 0)
      .lineTo(width / 2, 12)
      .moveTo(width * 0.75, 0)
      .lineTo(width * 0.75, 12);
  });

  return (
    <Rect
      rect={{ x: 0, y: 0, width: width, height: 16 }}
      opacity={opacity}
      color={colors.bg}
      zIndex={4}
    >
      <Path
        path={separatorPath}
        style="stroke"
        strokeWidth={1.5}
        color={colors.stroke}
      />
      <Text text={changePercent} x={8} y={10} font={font} color={changeColor} />
      <Text
        text={priceChange}
        x={changePriceX}
        y={10}
        font={font}
        color={changeColor}
      />
      <Text
        text={candlesCount}
        x={width / 2 + 8}
        y={10}
        font={font}
        color={colors.text}
      />
      <Text
        text={timeRange}
        x={timeRangeX}
        y={10}
        font={font}
        color={colors.text}
      />
    </Rect>
  );
}

const { width } = Dimensions.get("window");
