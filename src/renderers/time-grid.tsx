import {
  DashPathEffect,
  Group,
  Path,
  Rect,
  rect,
  Skia,
  Text,
} from "@shopify/react-native-skia";
import { useDerivedValue, useSharedValue } from "react-native-reanimated";

import type { TimeGridLineProps, TimeGridRendererProps } from "../types";
import { TIME_LABEL_AREA_HEIGHT, TOP_PADDING_PX } from "../utils/constants";
import { indexToX } from "../utils/coordinates";
import {
  calculateCandleStep,
  generateTimeGridIndices,
} from "../utils/timeGrid";

export function TimeGridRenderer({
  data,
  width,
  height,
  colors,
  pricePlotHeight,
  translateX,
  candleWidth,
  visibleRange,
  font,
  indicatorContainerPadding,
  chartHeight,
  chartWidth,
}: TimeGridRendererProps) {
  // Calculate grid indices dynamically
  const gridIndices = useDerivedValue(() => {
    const { start, end } = visibleRange.value;
    const step = calculateCandleStep(candleWidth.value);
    return generateTimeGridIndices(start, end, step);
  });

  const maxLines = 20;
  const lineIndices = Array.from({ length: maxLines }, (_, i) => i);

  const labelRect = useDerivedValue(() => ({
    x: 0,
    y: height + TIME_LABEL_AREA_HEIGHT,
    width: width.value,
    height: TIME_LABEL_AREA_HEIGHT,
  }));

  const gridPath = useSharedValue(Skia.Path.Make());

  useDerivedValue(() => {
    gridPath.value.rewind();

    const indices = gridIndices.value;
    const chartWidth = width.value;
    const cWidth = candleWidth.value;
    const tx = translateX.value;

    for (let i = 0; i < indices.length && i < maxLines; i++) {
      const idx = indices[i];
      if (idx < 0 || idx >= data.length) continue;

      // Center line on candle (indexToX returns left edge)
      const x = indexToX(idx, cWidth, tx) + cWidth / 2;

      // Only add visible lines
      if (x >= -10 && x <= chartWidth + 10) {
        gridPath.value.moveTo(x, 0);
        gridPath.value.lineTo(x, pricePlotHeight);
      }
    }
  });

  return (
    <>
      <Group
        zIndex={0}
        clip={rect(
          0,
          0,
          chartWidth,
          chartHeight - indicatorContainerPadding * 2,
        )}
      >
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

      <Rect rect={labelRect} color={colors.bg} zIndex={2}>
        {lineIndices.map((idx) => (
          <TimeGridLabel
            key={idx}
            index={idx}
            gridIndices={gridIndices}
            data={data}
            translateX={translateX}
            candleWidth={candleWidth}
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

function TimeGridLabel({
  index,
  gridIndices,
  data,
  translateX,
  candleWidth,
  width,
  height,
  font,
  colors,
}: TimeGridLineProps) {
  const candleIndex = useDerivedValue(() => {
    const indices = gridIndices.value;
    return index < indices.length ? indices[index] : -1;
  });

  const x = useDerivedValue(() => {
    const idx = candleIndex.value;
    if (idx < 0 || idx >= data.length) return -100;
    // Center line on candle (indexToX returns left edge)
    return (
      indexToX(idx, candleWidth.value, translateX.value) + candleWidth.value / 2
    );
  });

  const opacity = useDerivedValue(() => {
    const isVisible =
      x.value >= -10 && x.value <= width.value + 10 && candleIndex.value >= 0;
    return isVisible ? 0.4 : 0;
  });

  const timeText = useDerivedValue(() => {
    const idx = candleIndex.value;
    if (idx < 0 || idx >= data.length) return "";
    const candle = data[idx];
    if (!candle) return "";

    const date = new Date(candle.timestamp);
    return date.toLocaleTimeString("ru", {
      hour: "2-digit",
      minute: "2-digit",
    });
  });

  const textWidth = useDerivedValue(() => {
    if (!font) return 0;
    const text = timeText.value;
    return font.getTextWidth(text);
  });

  const textX = useDerivedValue(() => x.value - textWidth.value / 2);
  const textY = height + TIME_LABEL_AREA_HEIGHT + TOP_PADDING_PX;

  return (
    <Text
      x={textX}
      y={textY}
      text={timeText}
      font={font}
      color={colors.text}
      opacity={opacity}
    />
  );
}
