import {
  DashPathEffect,
  Group,
  Path,
  Rect,
  Skia,
  Text,
} from "@shopify/react-native-skia";
import { useDerivedValue, useSharedValue } from "react-native-reanimated";

import type { GridLabelProps, GridRendererProps } from "../types";
import { formatPrice, priceToY } from "../utils/coordinates";
import { generatePriceLevels } from "../utils/priceGrid";

export function GridRenderer({
  width,
  height,
  chartHeight,
  adjustedPriceRange,
  rightZoneWidth,
  colors,
  font,
}: GridRendererProps) {
  const maxLines = 40;
  const lineIndices = Array.from({ length: maxLines }, (_, i) => i);

  const priceLevels = useDerivedValue(() => {
    return generatePriceLevels(
      adjustedPriceRange.value.min,
      adjustedPriceRange.value.max,
      height,
    );
  });

  const rect = useDerivedValue(() => ({
    x: width.value,
    y: 0,
    width: rightZoneWidth.value,
    height: chartHeight,
  }));

  const gridPath = useSharedValue(Skia.Path.Make());

  useDerivedValue(() => {
    gridPath.value.rewind();

    const levels = priceLevels.value;
    const min = adjustedPriceRange.value.min;
    const max = adjustedPriceRange.value.max;
    const chartWidth = width.value;

    for (let i = 0; i < levels.length && i < maxLines; i++) {
      const price = levels[i];
      if (price === 0) continue;

      const y = priceToY(price, min, max, height);

      // Only add visible lines
      if (y >= -10 && y <= height + 10) {
        gridPath.value.moveTo(0, y);
        gridPath.value.lineTo(chartWidth, y);
      }
    }
  });

  return (
    <>
      <Group zIndex={0}>
        <Path
          path={gridPath}
          color={colors.grid}
          strokeWidth={2}
          style="stroke"
          strokeCap="round"
        >
          <DashPathEffect intervals={[5, 5]} />
        </Path>
      </Group>

      <Rect rect={rect} color={colors.bg} zIndex={3}>
        {lineIndices.map((index) => (
          <GridLabel
            key={index}
            index={index}
            adjustedPriceRange={adjustedPriceRange}
            rightZoneWidth={rightZoneWidth}
            priceLevels={priceLevels}
            width={width}
            height={height}
            font={font}
            colors={colors}
          />
        ))}
      </Rect>
    </>
  );
}

function GridLabel({
  index,
  priceLevels,
  adjustedPriceRange,
  rightZoneWidth,
  width,
  height,
  font,
  colors,
}: GridLabelProps) {
  const price = useDerivedValue(() => {
    const levels = priceLevels.value;
    return index < levels.length ? levels[index] : 0;
  });

  const y = useDerivedValue(() => {
    if (price.value === 0) return -100;
    return priceToY(
      price.value,
      adjustedPriceRange.value.min,
      adjustedPriceRange.value.max,
      height,
    );
  });

  const opacity = useDerivedValue(() => {
    const isVisible =
      y.value >= -10 && y.value <= height + 10 && price.value !== 0;
    return isVisible ? 0.4 : 0;
  });

  const textY = useDerivedValue(() => y.value + 4);

  const priceText = useDerivedValue(() => formatPrice(price.value));

  const textX = useDerivedValue(
    () =>
      width.value +
      (rightZoneWidth.value / 2 - font.measureText(priceText.value).width / 2),
  );

  if (!font) return null;

  return (
    <Text
      x={textX}
      y={textY}
      text={priceText}
      font={font}
      color={colors.text}
      opacity={opacity}
    />
  );
}
