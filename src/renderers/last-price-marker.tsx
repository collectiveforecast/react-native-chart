import {
  DashPathEffect,
  Group,
  Path,
  RoundedRect,
  rrect,
  Skia,
  Text,
} from "@shopify/react-native-skia";
import {
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import type { ILastPriceMarkerProps } from "../types";
import {
  LAST_PRICE_MARKER_RECT_HEIGHT,
  LAST_PRICE_MARKER_RECT_PADDING,
  TOP_PADDING_PX,
} from "../utils/constants";
import { formatPrice, valueToY } from "../utils/coordinates";

export function LastPriceMarker({
  value,
  font,
  rightZoneWidth,
  chartWidth,
  adjustedRange,
  widthOffset = 0,
  clip,
  height,
  yOffset = TOP_PADDING_PX,
  isRangeSelector,
  isCrosshairVisible,
  colors,
}: ILastPriceMarkerProps) {
  const hasValue = typeof value === "number" && Number.isFinite(value);
  const safeValue = hasValue ? (value as number) : 0;

  const path = useSharedValue(Skia.Path.Make());

  const y = useDerivedValue(() =>
    valueToY(
      safeValue,
      adjustedRange.value.min,
      adjustedRange.value.max,
      height,
      yOffset,
    ),
  );

  useDerivedValue(() => {
    const line = path.value;
    line.rewind();

    line.moveTo(0, y.value);
    line.lineTo(chartWidth.value - widthOffset, y.value);
  });

  const priceRect = useDerivedValue(() =>
    rrect(
      {
        x: chartWidth.value - widthOffset + LAST_PRICE_MARKER_RECT_PADDING,
        y: Math.max(
          yOffset,
          Math.min(
            yOffset + height - LAST_PRICE_MARKER_RECT_HEIGHT,
            y.value - LAST_PRICE_MARKER_RECT_HEIGHT / 2,
          ),
        ),
        width: rightZoneWidth.value - LAST_PRICE_MARKER_RECT_PADDING * 2,
        height: LAST_PRICE_MARKER_RECT_HEIGHT,
      },
      4,
      4,
    ),
  );

  const text = useDerivedValue(() => {
    return hasValue ? formatPrice(safeValue) : "";
  });

  const textTransform = useDerivedValue(() => {
    const rect = priceRect.value.rect;

    const metrics = font.measureText(text.value);

    return [
      { translateX: rect.x + rect.width / 2 - metrics.width / 2 },
      { translateY: rect.y + rect.height / 2 + metrics.height / 2 - 2 },
    ];
  });

  const groupOpacity = useDerivedValue(() => {
    return withTiming(
      !hasValue || isRangeSelector.value || isCrosshairVisible.value ? 0 : 1,
      { duration: 150 },
    );
  });

  return (
    <Group zIndex={3} opacity={groupOpacity} clip={clip}>
      <Path
        path={path}
        color={colors.text}
        strokeWidth={1}
        strokeCap="round"
        style="stroke"
        opacity={0.5}
      >
        <DashPathEffect intervals={[5, 5]} />
      </Path>

      <RoundedRect rect={priceRect} color={colors.stroke}>
        <Group transform={textTransform}>
          <Text x={0} y={0} text={text} font={font} color={colors.text} />
        </Group>
      </RoundedRect>
    </Group>
  );
}
