import {
  Circle,
  Group,
  LinearGradient,
  Path,
  Skia,
  vec,
} from "@shopify/react-native-skia";
import { useDerivedValue, useSharedValue } from "react-native-reanimated";

import type { IndicatorLineRendererProps, IndicatorPoint } from "../types";
import { LINE_WIDTH } from "../utils/constants";
import { indexToX, valueToY, valueToYRaw } from "../utils/coordinates";
import {
  buildIndicatorStrokeAndBaselineFills,
  buildIndicatorStrokePath,
  findLastValidPointIndex,
} from "../utils/indicator-paths";

export function IndicatorLineRenderer({
  data,
  clip,
  translateX,
  candleWidth,
  adjustedValueRange,
  visibleRange,
  height,
  yOffset,
  colors,
  baselineValue = 0,
  showGradient,
}: IndicatorLineRendererProps) {
  const linePath1 = useSharedValue(Skia.Path.Make());
  const linePath2 = useSharedValue(Skia.Path.Make());
  const linePath3 = useSharedValue(Skia.Path.Make());
  const positiveBaselineGradientPath = useSharedValue(Skia.Path.Make());
  const negativeBaselineGradientPath = useSharedValue(Skia.Path.Make());
  const circlePosition = useSharedValue({ x: 0, y: 0 });

  const positiveGradientStart = useSharedValue(vec(0, 0));
  const positiveGradientEnd = useSharedValue(vec(0, 0));
  const negativeGradientStart = useSharedValue(vec(0, 0));
  const negativeGradientEnd = useSharedValue(vec(0, 0));

  useDerivedValue(() => {
    linePath1.value.rewind();
    linePath2.value.rewind();
    linePath3.value.rewind();
    positiveBaselineGradientPath.value.rewind();
    negativeBaselineGradientPath.value.rewind();

    const { start, end } = visibleRange.value;
    const cWidth = candleWidth.value;
    const tx = translateX.value;
    const min = adjustedValueRange.value.min;
    const max = adjustedValueRange.value.max;

    const from = Math.max(0, start);
    const to = Math.max(from, end);

    const s0 = data[0];
    const s1 = data[1];
    const s2 = data[2];

    // Primary series: optional baseline fills (gradient)
    const shouldComputeGradient = Boolean(showGradient);

    if (shouldComputeGradient) {
      const baselineRawY = valueToYRaw(
        baselineValue,
        min,
        max,
        height,
        yOffset,
      );
      const baselineY = Math.max(
        yOffset,
        Math.min(yOffset + height, baselineRawY),
      );

      const { minYPositive, maxYNegative } =
        buildIndicatorStrokeAndBaselineFills({
          linePath: linePath1.value,
          positiveFillPath: positiveBaselineGradientPath.value,
          negativeFillPath: negativeBaselineGradientPath.value,
          series: s0,
          from,
          to,
          candleWidth: cWidth,
          translateX: tx,
          min,
          max,
          height,
          yOffset,
          baselineY,
        });

      if (minYPositive !== Infinity) {
        positiveGradientStart.value = vec(0, minYPositive);
        positiveGradientEnd.value = vec(0, baselineY);
      } else {
        positiveGradientStart.value = vec(0, baselineY);
        positiveGradientEnd.value = vec(0, baselineY);
      }

      if (maxYNegative !== -Infinity) {
        negativeGradientStart.value = vec(0, baselineY);
        negativeGradientEnd.value = vec(0, maxYNegative);
      } else {
        negativeGradientStart.value = vec(0, baselineY);
        negativeGradientEnd.value = vec(0, baselineY);
      }
    } else {
      buildIndicatorStrokePath({
        path: linePath1.value,
        series: s0,
        from,
        to,
        candleWidth: cWidth,
        translateX: tx,
        min,
        max,
        height,
        yOffset,
      });
    }

    // Secondary series (no gradient)
    buildIndicatorStrokePath({
      path: linePath2.value,
      series: s1,
      from,
      to,
      candleWidth: cWidth,
      translateX: tx,
      min,
      max,
      height,
      yOffset,
    });
    buildIndicatorStrokePath({
      path: linePath3.value,
      series: s2,
      from,
      to,
      candleWidth: cWidth,
      translateX: tx,
      min,
      max,
      height,
      yOffset,
    });

    // Primary series marker (last valid point)
    const lastValidIdx = findLastValidPointIndex(s0);
    if (lastValidIdx >= 0) {
      const p: IndicatorPoint | undefined = s0?.[lastValidIdx];
      const v = p?.value;
      if (typeof v === "number" && Number.isFinite(v)) {
        const endY = valueToY(v, min, max, height, yOffset);
        const endX = indexToX(lastValidIdx, cWidth, tx) + cWidth / 2;
        circlePosition.value = { x: endX, y: endY };
      }
    }
  });

  const c1 = colors.indicators?.[0] ?? colors.indicator ?? "";
  const c2 = colors.indicators?.[1] ?? colors.indicator ?? "";
  const c3 = colors.indicators?.[2] ?? colors.indicator ?? "";

  return (
    <Group zIndex={1} clip={clip}>
      {showGradient ? (
        <>
          <Path path={positiveBaselineGradientPath} style="fill">
            <LinearGradient
              start={positiveGradientStart}
              end={positiveGradientEnd}
              colors={["#0A970099", "#0A970000"]}
              positions={[0, 1]}
            />
          </Path>

          <Path path={negativeBaselineGradientPath} style="fill">
            <LinearGradient
              start={negativeGradientStart}
              end={negativeGradientEnd}
              colors={["#C9000000", "#C9004099"]}
              positions={[0, 1]}
            />
          </Path>
        </>
      ) : null}

      <Path
        path={linePath1}
        color={c1}
        style="stroke"
        strokeWidth={LINE_WIDTH}
        strokeJoin="round"
        strokeCap="round"
      />

      <Path
        path={linePath2}
        color={c2}
        style="stroke"
        strokeWidth={LINE_WIDTH}
        strokeJoin="round"
        strokeCap="round"
      />

      <Path
        path={linePath3}
        color={c3}
        style="stroke"
        strokeWidth={LINE_WIDTH}
        strokeJoin="round"
        strokeCap="round"
      />

      {data.length === 1 ? (
        <Circle c={circlePosition} r={4} color={c1} />
      ) : null}
    </Group>
  );
}
