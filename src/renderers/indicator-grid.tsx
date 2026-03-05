import {
  DashPathEffect,
  Group,
  Path,
  Rect,
  RoundedRect,
  Skia,
  SkRRect,
  Text,
} from "@shopify/react-native-skia";
import { useDerivedValue, useSharedValue } from "react-native-reanimated";

import type {
  IndicatorGridLabelProps,
  IndicatorGridRendererProps,
} from "../types";
import { formatPrice, valueToYRaw } from "../utils/coordinates";
import { generateIndicatorLevels } from "../utils/priceGrid";

export function IndicatorGridRenderer({
  clip,
  font,
  width,
  height,
  colors,
  yOffset,
  widthOffset = 0,
  rightZoneWidth,
  adjustedValueRange,
}: IndicatorGridRendererProps) {
  const maxLines = 20;
  const lineIndices = Array.from({ length: maxLines }, (_, i) => i);

  const valueLevels = useDerivedValue(() => {
    return generateIndicatorLevels(
      adjustedValueRange.value.min,
      adjustedValueRange.value.max,
      height,
    );
  });

  const rect = useDerivedValue(() => ({
    x: width.value - widthOffset,
    y: yOffset,
    width: rightZoneWidth.value,
    height,
  }));

  const gridPath = useSharedValue(Skia.Path.Make());

  useDerivedValue(() => {
    gridPath.value.rewind();

    const levels = valueLevels.value;
    const min = adjustedValueRange.value.min;
    const max = adjustedValueRange.value.max;
    const chartWidth = width.value - widthOffset;

    for (let i = 0; i < levels.length && i < maxLines; i++) {
      const v = levels[i];
      if (!Number.isFinite(v)) continue;

      const y = valueToYRaw(v, min, max, height, yOffset);
      if (y >= yOffset && y <= yOffset + height) {
        gridPath.value.moveTo(0, y);
        gridPath.value.lineTo(chartWidth, y);
      }
    }
  });

  return (
    <>
      <PathContainer clip={clip} bgColor={colors.bg}>
        <Path
          path={gridPath}
          color={colors.grid}
          strokeWidth={2}
          style="stroke"
          strokeCap="round"
        >
          <DashPathEffect intervals={[5, 5]} />
        </Path>
      </PathContainer>

      <Rect rect={rect} color={colors.bg} zIndex={2} clip={clip}>
        {lineIndices.map((index) => (
          <IndicatorGridLabel
            key={index}
            index={index}
            widthOffset={widthOffset}
            adjustedValueRange={adjustedValueRange}
            rightZoneWidth={rightZoneWidth}
            valueLevels={valueLevels}
            width={width}
            height={height}
            yOffset={yOffset}
            font={font}
            colors={colors}
          />
        ))}
      </Rect>
    </>
  );
}

function PathContainer({
  clip,
  bgColor,
  children,
}: {
  clip?: SkRRect;
  bgColor?: string;
  children: React.ReactNode;
}) {
  if (clip) {
    return (
      <RoundedRect zIndex={-1} rect={clip} color={bgColor} clip={clip}>
        {children}
      </RoundedRect>
    );
  } else {
    return <Group zIndex={0}>{children}</Group>;
  }
}

function IndicatorGridLabel({
  font,
  index,
  width,
  height,
  yOffset,
  widthOffset = 0,
  valueLevels,
  rightZoneWidth,
  adjustedValueRange,
  colors,
}: IndicatorGridLabelProps) {
  const value = useDerivedValue(() => {
    const levels = valueLevels.value;
    return index < levels.length ? levels[index] : NaN;
  });

  const y = useDerivedValue(() => {
    if (!Number.isFinite(value.value)) return -100;
    return valueToYRaw(
      value.value,
      adjustedValueRange.value.min,
      adjustedValueRange.value.max,
      height,
      yOffset,
    );
  });

  const opacity = useDerivedValue(() => {
    const isVisible =
      y.value >= yOffset &&
      y.value <= yOffset + height &&
      Number.isFinite(value.value);
    return isVisible ? 0.4 : 0;
  });

  const textY = useDerivedValue(() => y.value + 4);
  const valueText = useDerivedValue(() => formatPrice(value.value));

  const textX = useDerivedValue(
    () =>
      width.value -
      widthOffset +
      (rightZoneWidth.value / 2 - font.measureText(valueText.value).width / 2),
  );

  if (!font) return null;

  return (
    <Text
      x={textX}
      y={textY}
      text={valueText}
      font={font}
      color={colors.text}
      opacity={opacity}
    />
  );
}
