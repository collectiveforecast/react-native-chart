import {
  Circle,
  Group,
  LinearGradient,
  Path,
  rect,
  Skia,
  vec,
} from "@shopify/react-native-skia";
import { useDerivedValue, useSharedValue } from "react-native-reanimated";

import type { LineRendererProps } from "../types";
import { LINE_WIDTH, TOP_PADDING_PX } from "../utils/constants";
import { indexToX, priceToY } from "../utils/coordinates";

export function LineRenderer({
  data,
  translateX,
  candleWidth,
  adjustedPriceRange,
  visibleRange,
  height,
  chartWidth,
  colors,
}: LineRendererProps) {
  const color = colors.line ?? "";
  const linePath = useSharedValue(Skia.Path.Make());
  const gradientPath = useSharedValue(Skia.Path.Make());
  const circlePosition = useSharedValue({ x: 0, y: 0 });

  useDerivedValue(() => {
    linePath.value.rewind();

    const { start, end } = visibleRange.value;

    const cWidth = candleWidth.value;
    const tx = translateX.value;
    const min = adjustedPriceRange.value.min;
    const max = adjustedPriceRange.value.max;

    const first = data[start];
    const firstX = indexToX(start, cWidth, tx) + cWidth / 2;
    const firstY = priceToY(first.close, min, max, height);
    linePath.value.moveTo(firstX, firstY);

    for (let i = start + 1; i < end; i++) {
      const point = data[i];
      if (!point) continue;
      const x = indexToX(i, cWidth, tx) + cWidth / 2;
      const y = priceToY(point.close, min, max, height);
      linePath.value.lineTo(x, y);
    }

    gradientPath.value.rewind();
    gradientPath.value.addPath(linePath.value);

    const lastX = indexToX(end - 1, cWidth, tx) + cWidth / 2;
    const firstXGradient = indexToX(start, cWidth, tx) + cWidth / 2;

    gradientPath.value.lineTo(lastX, height + TOP_PADDING_PX);
    gradientPath.value.lineTo(firstXGradient, height + TOP_PADDING_PX);
    gradientPath.value.close();

    const endData = data.length - 1;
    const endY = priceToY(data[endData].close, min, max, height);
    const endX = indexToX(endData, cWidth, tx) + cWidth / 2;
    circlePosition.value = { x: endX, y: endY };
  });

  return (
    <Group zIndex={1} clip={rect(0, 0, chartWidth, height + TOP_PADDING_PX)}>
      <Path
        path={linePath}
        color={color}
        style="stroke"
        zIndex={1}
        strokeWidth={LINE_WIDTH}
        strokeJoin="round"
        strokeCap="round"
      />

      <Path path={gradientPath} style="fill" color={color} zIndex={1}>
        <LinearGradient
          start={vec(0, TOP_PADDING_PX)}
          end={vec(0, height + TOP_PADDING_PX)}
          colors={[color + "80", color + "00"]}
        />
      </Path>

      <Circle c={circlePosition} r={4} color={color} zIndex={1} />
    </Group>
  );
}
