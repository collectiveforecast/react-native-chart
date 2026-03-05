import {
  DashPathEffect,
  Group,
  Path,
  RoundedRect,
  Skia,
  Text,
} from "@shopify/react-native-skia";
import { useDerivedValue, withTiming } from "react-native-reanimated";

import type { ICrosshairProps } from "../types";
import {
  LAST_PRICE_MARKER_RECT_HEIGHT,
  LAST_PRICE_MARKER_RECT_PADDING,
  TOP_PADDING_PX,
} from "../utils/constants";
import { formatPrice, yToPrice } from "../utils/coordinates";

export function Crosshair({
  font,
  chartWidth,
  chartHeight,
  adjustedPriceRange,
  rightZoneWidth,
  crosshairPosition,
  isCrosshairVisible,
  colors,
}: ICrosshairProps) {
  const clampedY = useDerivedValue(() => {
    const y = crosshairPosition.value.y;
    const minY = TOP_PADDING_PX;
    const maxY = chartHeight + TOP_PADDING_PX;
    return Math.max(minY, Math.min(maxY, y));
  });

  const horizontalPath = useDerivedValue(() => {
    const path = Skia.Path.Make();

    return path
      .moveTo(0, clampedY.value)
      .lineTo(chartWidth.value, clampedY.value);
  });

  const verticalPath = useDerivedValue(() => {
    const path = Skia.Path.Make();

    return path
      .moveTo(crosshairPosition.value.x, TOP_PADDING_PX)
      .lineTo(crosshairPosition.value.x, chartHeight + TOP_PADDING_PX);
  });

  const opacity = useDerivedValue(() => {
    return withTiming(isCrosshairVisible.value, { duration: 150 });
  });

  const text = useDerivedValue(() => {
    const price = yToPrice(
      clampedY.value,
      adjustedPriceRange.value.min,
      adjustedPriceRange.value.max,
      chartHeight,
    );
    return formatPrice(price);
  });

  const textX = useDerivedValue(() => {
    return chartWidth.value + LAST_PRICE_MARKER_RECT_PADDING + 4;
  });

  const rect = useDerivedValue(() => {
    const r = { x: 4, y: 4 };
    return {
      rect: {
        x: chartWidth.value,
        y: clampedY.value - LAST_PRICE_MARKER_RECT_HEIGHT / 2,
        width: rightZoneWidth.value,
        height: LAST_PRICE_MARKER_RECT_HEIGHT,
      },
      topLeft: r,
      topRight: r,
      bottomRight: r,
      bottomLeft: r,
    };
  });

  const textY = useDerivedValue(() => {
    return (
      rect.value.rect.y +
      rect.value.rect.height / 2 +
      font.measureText(text.value).height / 2 -
      2
    );
  });
  return (
    <Group opacity={opacity} zIndex={3}>
      <Path
        path={horizontalPath}
        style="stroke"
        strokeWidth={2}
        strokeCap="round"
        color={colors.text}
      >
        <DashPathEffect intervals={[5, 5]} />
      </Path>

      <RoundedRect rect={rect} color={colors.stroke}>
        <Text x={textX} y={textY} text={text} font={font} color={colors.text} />
      </RoundedRect>
      <Path
        path={verticalPath}
        style="stroke"
        strokeWidth={2}
        strokeCap="round"
        color={colors.text}
      >
        <DashPathEffect intervals={[5, 5]} />
      </Path>
    </Group>
  );
}
