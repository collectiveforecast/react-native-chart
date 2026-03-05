import { Group, Path, rect, Skia } from "@shopify/react-native-skia";

import { useDerivedValue, useSharedValue } from "react-native-reanimated";

import type { CandlestickRendererProps } from "../types";
import {
  TOP_PADDING_PX,
  VISIBLE_CANDLES_BUFFER,
  WICK_WIDTH,
} from "../utils/constants";
import { indexToX } from "../utils/coordinates";

export function CandlestickRenderer({
  data,
  translateX,
  candleWidth,
  adjustedPriceRange,
  chartWidth,
  visibleRange,
  height,
  colors,
}: CandlestickRendererProps) {
  // Shared paths reused between renders
  const bullCandlesPath = useSharedValue(Skia.Path.Make());
  const bearCandlesPath = useSharedValue(Skia.Path.Make());

  useDerivedValue(() => {
    bullCandlesPath.value.rewind();
    bearCandlesPath.value.rewind();
    const { start, end } = visibleRange.value;

    const cWidth = candleWidth.value;
    const bodyWidth = Math.max(1, cWidth * 0.7);
    const bodyInset = (cWidth - bodyWidth) / 2;

    const min = adjustedPriceRange.value.min;
    const max = adjustedPriceRange.value.max;
    const span = Math.max(1e-9, max - min);
    const inv = height / span;

    // Buffer to reduce popping at edges + hard cap on rendered candles
    const buffer = VISIBLE_CANDLES_BUFFER;
    let from = Math.max(0, start - buffer);
    let to = Math.min(data.length, end + buffer);

    for (let i = from; i < to; i++) {
      const candle = data[i];
      if (!candle) continue;

      const isBullish = candle.close >= candle.open;
      const x = indexToX(i, cWidth, translateX.value);
      const wickX = x + cWidth / 2 - WICK_WIDTH / 2;

      const base = height + TOP_PADDING_PX + min * inv;

      const highY = base - candle.high * inv;
      const lowY = base - candle.low * inv;
      const openY = base - candle.open * inv;
      const closeY = base - candle.close * inv;

      // Wick
      const targetWick = isBullish
        ? bullCandlesPath.value
        : bearCandlesPath.value;
      targetWick.addRect(Skia.XYWHRect(wickX, highY, WICK_WIDTH, lowY - highY));

      // Body
      const y = Math.min(openY, closeY);
      const h = Math.max(1, Math.abs(closeY - openY));
      const targetBody = isBullish
        ? bullCandlesPath.value
        : bearCandlesPath.value;
      targetBody.addRect(Skia.XYWHRect(x + bodyInset, y, bodyWidth, h));
    }
  });

  return (
    <Group zIndex={1} clip={rect(0, 0, chartWidth, height + TOP_PADDING_PX)}>
      <Path
        path={bullCandlesPath}
        color={colors.bullCandle}
        style="fill"
        strokeWidth={WICK_WIDTH}
      />

      <Path
        path={bearCandlesPath}
        color={colors.bearCandle}
        style="fill"
        strokeWidth={WICK_WIDTH}
      />
    </Group>
  );
}
