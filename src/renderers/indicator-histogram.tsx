import { Group, Path, Skia } from "@shopify/react-native-skia";
import { useDerivedValue, useSharedValue } from "react-native-reanimated";

import type { IndicatorHistogramRendererProps } from "../types";
import { indexToX, valueToY } from "../utils/coordinates";

const DEFAULT_BAR_WIDTH_FACTOR = 0.7;
const TRANSPARENT_OPACITY = 0.5;

/**
 * MACD histogram renderer (bars) for the indicator pane.
 *
 * Builds 4 paths in a single `useDerivedValue`:
 * - positive/negative × opaque/transparent
 * Transparent means magnitude decreased vs previous bar with the same sign.
 */
export function IndicatorHistogramRenderer({
  series,
  translateX,
  candleWidth,
  adjustedValueRange,
  visibleRange,
  height,
  yOffset,
  colors,
  barWidthFactor = DEFAULT_BAR_WIDTH_FACTOR,
}: IndicatorHistogramRendererProps) {
  const positiveOpaquePath = useSharedValue(Skia.Path.Make());
  const positiveTransparentPath = useSharedValue(Skia.Path.Make());
  const negativeOpaquePath = useSharedValue(Skia.Path.Make());
  const negativeTransparentPath = useSharedValue(Skia.Path.Make());

  useDerivedValue(() => {
    positiveOpaquePath.value.rewind();
    positiveTransparentPath.value.rewind();
    negativeOpaquePath.value.rewind();
    negativeTransparentPath.value.rewind();

    const { start, end } = visibleRange.value;
    const from = Math.max(0, start);
    const to = Math.max(from, end);

    const cWidth = candleWidth.value;
    const tx = translateX.value;

    const min = adjustedValueRange.value.min;
    const max = adjustedValueRange.value.max;

    const y0 = valueToY(0, min, max, height, yOffset);

    let prevFinite = Number.NaN;

    const bw = Math.max(1, cWidth * barWidthFactor);

    const safeTo = Math.min(series.length, to);
    for (let i = from; i < safeTo; i++) {
      const v = series[i]?.value;
      if (typeof v !== "number" || !Number.isFinite(v)) {
        continue;
      }

      const prevV = Number.isFinite(prevFinite) ? prevFinite : 0;
      const isMagnitudeDecreasing =
        Math.abs(v) < Math.abs(prevV) && Math.sign(v) === Math.sign(prevV);

      const x = indexToX(i, cWidth, tx) + cWidth / 2;
      const left = x - bw / 2;
      const right = x + bw / 2;

      const y = valueToY(v, min, max, height, yOffset);
      const rectY = Math.min(y0, y);
      const rectH = Math.max(1, Math.abs(y - y0));

      if (v > 0) {
        const target = isMagnitudeDecreasing
          ? positiveTransparentPath.value
          : positiveOpaquePath.value;
        target.addRect(Skia.XYWHRect(left, rectY, right - left, rectH));
      } else if (v < 0) {
        const target = isMagnitudeDecreasing
          ? negativeTransparentPath.value
          : negativeOpaquePath.value;
        target.addRect(Skia.XYWHRect(left, rectY, right - left, rectH));
      }

      prevFinite = v;
    }
  });

  return (
    <Group zIndex={1}>
      <Path
        path={positiveOpaquePath}
        color={colors.macdPositiveHistogram}
        style="fill"
      />
      <Path
        path={positiveTransparentPath}
        color={colors.macdPositiveHistogram}
        style="fill"
        opacity={TRANSPARENT_OPACITY}
      />

      <Path
        path={negativeOpaquePath}
        color={colors.macdNegativeHistogram}
        style="fill"
      />
      <Path
        path={negativeTransparentPath}
        color={colors.macdNegativeHistogram}
        style="fill"
        opacity={TRANSPARENT_OPACITY}
      />
    </Group>
  );
}
