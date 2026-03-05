import {
  BackdropBlur,
  Group,
  RoundedRect,
  rrect,
  Text,
} from "@shopify/react-native-skia";
import { useDerivedValue, withTiming } from "react-native-reanimated";

import type { ITooltipProps } from "../types";
import {
  TOOLTIP_CORNER_RADIUS,
  TOOLTIP_ITEM_SPACING,
  TOOLTIP_LABEL_VALUE_SPACING,
  TOOLTIP_PADDING,
} from "../utils/constants";
import { formatPrice, xToIndex } from "../utils/coordinates";

export function Tooltip({
  data,
  chartType,
  translateX,
  candleWidth,
  crosshairPosition,
  isCrosshairVisible,
  font,
  chartWidth,
  chartHeight,
  colors,
}: ITooltipProps) {
  const lineHeight = font.measureText("A").height;

  const maxLabelWidth = Math.max(
    ...["O", "H", "L", "C", "Vol:", "Cng:", "%Cng:"].map(
      (label) => font.measureText(label).width,
    ),
  );

  const candleIndex = useDerivedValue(() => {
    "worklet";
    const index = xToIndex(
      crosshairPosition.value.x,
      candleWidth.value,
      translateX.value,
    );
    return Math.max(0, Math.min(data.length - 1, index));
  });

  const candle = useDerivedValue(() => {
    "worklet";
    const index = candleIndex.value;
    if (index < 0 || index >= data.length) return null;
    return data[index];
  });

  const opacity = useDerivedValue(() => {
    "worklet";
    if (!candle.value) return 0;
    return withTiming(isCrosshairVisible.value, { duration: 150 });
  });

  const bullCandle = colors.bullCandle ?? "";
  const bearCandle = colors.bearCandle ?? "";

  // Combine all text formatting into a single derived value to reduce computations
  const tooltipData = useDerivedValue(() => {
    "worklet";
    if (!candle.value) {
      return {
        isBullish: true,
        candleColor: bullCandle,
        openText: "",
        highText: "",
        lowText: "",
        closeText: "",
        volumeText: "",
        changeText: "",
        changePercentText: "",
        dateText: "",
        timeText: "",
      };
    }

    const currentCandle = candle.value;
    const index = candleIndex.value;
    const previousClose = data[index - 1]?.close ?? 0;
    const change = currentCandle.close - previousClose;
    const changePercent =
      ((currentCandle.close - currentCandle.open) / currentCandle.open) * 100;

    // Create Date once and reuse
    const date = new Date(currentCandle.timestamp);

    // Format volume
    let volumeText = "";
    const vol = currentCandle.volume;
    if (vol >= 1000000) {
      volumeText = (vol / 1000000).toFixed(2) + "M";
    } else if (vol >= 1000) {
      volumeText = (vol / 1000).toFixed(2) + "K";
    } else {
      volumeText = vol.toFixed(2);
    }

    const isBullish = currentCandle.close >= currentCandle.open;

    return {
      isBullish,
      candleColor: isBullish ? bullCandle : bearCandle,
      openText: formatPrice(currentCandle.open),
      highText: formatPrice(currentCandle.high),
      lowText: formatPrice(currentCandle.low),
      closeText: formatPrice(currentCandle.close),
      volumeText,
      changeText: formatPrice(change),
      changePercentText: changePercent.toFixed(2) + "%",
      dateText: date.toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
      }),
      timeText: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  });

  const candleColor = useDerivedValue(() => tooltipData.value.candleColor);
  const openText = useDerivedValue(() => tooltipData.value.openText);
  const highText = useDerivedValue(() => tooltipData.value.highText);
  const lowText = useDerivedValue(() => tooltipData.value.lowText);
  const closeText = useDerivedValue(() => tooltipData.value.closeText);
  const volumeText = useDerivedValue(() => tooltipData.value.volumeText);
  const changeText = useDerivedValue(() => tooltipData.value.changeText);
  const changePercentText = useDerivedValue(
    () => tooltipData.value.changePercentText,
  );
  const dateText = useDerivedValue(() => tooltipData.value.dateText);
  const timeText = useDerivedValue(() => tooltipData.value.timeText);

  // Calculate tooltip width based on actual text content
  const tooltipWidth = useDerivedValue(() => {
    "worklet";
    const data = tooltipData.value;
    if (!data.closeText) return 0;

    let maxWidth = 0;

    // Helper to calculate row width (label + spacing + value)
    const getRowWidth = (label: string, valueText: string) => {
      const labelWidth = font.measureText(label).width;
      const valueWidth = font.measureText(valueText).width;
      return (
        labelWidth +
        TOOLTIP_LABEL_VALUE_SPACING +
        valueWidth +
        TOOLTIP_PADDING * 2 +
        12
      );
    };

    if (chartType === "candlestick") {
      // Candlestick: O, H, L, C, Vol, Cng, %Cng, Date, Time
      maxWidth = Math.max(
        maxWidth,
        getRowWidth("O", data.openText),
        getRowWidth("H", data.highText),
        getRowWidth("L", data.lowText),
        getRowWidth("C", data.closeText),
        getRowWidth("Vol:", data.volumeText),
        getRowWidth("Cng:", data.changeText),
        getRowWidth("%Cng:", data.changePercentText),
        getRowWidth("", data.dateText),
        getRowWidth("", data.timeText),
      );
    } else {
      // Line: Price, Cng, %Cng, Date, Time
      maxWidth = Math.max(
        maxWidth,
        getRowWidth("Price", data.closeText),
        getRowWidth("Cng:", data.changeText),
        getRowWidth("%Cng:", data.changePercentText),
        getRowWidth("", data.dateText),
        getRowWidth("", data.timeText),
      );
    }

    return maxWidth;
  });

  // Position tooltip to the right of crosshair, or left if too close to edge
  const tooltipX = useDerivedValue(() => {
    "worklet";
    const x = crosshairPosition.value.x;
    const halfWidth = chartWidth / 2;
    if (x < halfWidth) {
      return x + 20;
    } else {
      return x - 20 - tooltipWidth.value;
    }
  });

  // Static Y position at the top of the chart
  const tooltipY = 20;

  // Calculate label width (for alignment) - static, calculated once above
  const labelX = useDerivedValue(() => {
    return tooltipX.value + TOOLTIP_PADDING;
  });

  // Calculate tooltip height - use cached lineHeight
  const itemsCount = chartType === "candlestick" ? 9 : 5;
  const tooltipHeight = useDerivedValue(() => {
    "worklet";
    return (
      TOOLTIP_PADDING * 2 +
      lineHeight * itemsCount +
      TOOLTIP_ITEM_SPACING * (itemsCount - 1) -
      8
    );
  });

  const valueX = useDerivedValue(() => {
    return (
      tooltipX.value +
      TOOLTIP_PADDING +
      maxLabelWidth +
      TOOLTIP_LABEL_VALUE_SPACING
    );
  });

  // Cache startY calculation
  const startY = tooltipY + TOOLTIP_PADDING + lineHeight;
  const lineSpacing = lineHeight + TOOLTIP_ITEM_SPACING;

  const getTextY = (line: number) => {
    "worklet";
    return startY + line * lineSpacing - lineHeight / 2;
  };

  const openY = useDerivedValue(() => getTextY(0));
  const highY = useDerivedValue(() => getTextY(1));
  const lowY = useDerivedValue(() => getTextY(2));
  const closeY = useDerivedValue(() => getTextY(chartType === "line" ? 0 : 3));
  const volumeY = useDerivedValue(() => getTextY(4));
  const changeY = useDerivedValue(() => getTextY(chartType === "line" ? 1 : 5));
  const changePercentY = useDerivedValue(() =>
    getTextY(chartType === "line" ? 2 : 6),
  );
  const dateY = useDerivedValue(() => getTextY(chartType === "line" ? 3 : 7));
  const timeY = useDerivedValue(() => getTextY(chartType === "line" ? 4 : 8));

  const rect = useDerivedValue(() => {
    return rrect(
      {
        x: tooltipX.value,
        y: 20,
        width: tooltipWidth.value,
        height: tooltipHeight.value,
      },
      TOOLTIP_CORNER_RADIUS,
      TOOLTIP_CORNER_RADIUS,
    );
  });

  const transform = useDerivedValue(() => {
    return [{ translateY: isCrosshairVisible.value ? 0 : -400 }];
  });

  return (
    <Group opacity={opacity} zIndex={5} transform={transform}>
      <RoundedRect rect={rect} color={colors.bg} opacity={0.96} />
      <BackdropBlur blur={10} clip={rect} />

      {chartType === "candlestick" && (
        <>
          <Text
            x={labelX}
            y={openY}
            text="O"
            font={font}
            color={colors.text}
            opacity={0.5}
          />
          <Text
            x={valueX}
            y={openY}
            text={openText}
            font={font}
            color={colors.text}
          />

          <Text
            x={labelX}
            y={highY}
            text="H"
            font={font}
            color={colors.text}
            opacity={0.5}
          />
          <Text
            x={valueX}
            y={highY}
            text={highText}
            font={font}
            color={colors.text}
          />

          <Text
            x={labelX}
            y={lowY}
            text="L"
            font={font}
            color={colors.text}
            opacity={0.5}
          />
          <Text
            x={valueX}
            y={lowY}
            text={lowText}
            font={font}
            color={colors.text}
          />

          <Text
            x={labelX}
            y={volumeY}
            text="Vol:"
            font={font}
            color={colors.text}
            opacity={0.5}
          />
          <Text
            x={valueX}
            y={volumeY}
            text={volumeText}
            font={font}
            color={colors.text}
          />
        </>
      )}

      <Text
        x={labelX}
        y={closeY}
        text={chartType === "line" ? "Price" : "C"}
        font={font}
        color={colors.text}
        opacity={0.5}
      />
      <Text
        x={valueX}
        y={closeY}
        text={closeText}
        font={font}
        color={colors.text}
      />

      <Text
        x={labelX}
        y={changeY}
        text="Cng:"
        font={font}
        color={colors.text}
        opacity={0.5}
      />
      <Text
        x={valueX}
        y={changeY}
        text={changeText}
        font={font}
        color={candleColor}
      />

      <Text
        x={labelX}
        y={changePercentY}
        text="%Cng:"
        font={font}
        color={colors.text}
        opacity={0.5}
      />
      <Text
        x={valueX}
        y={changePercentY}
        text={changePercentText}
        font={font}
        color={candleColor}
      />

      <Text
        x={labelX}
        y={dateY}
        text={dateText}
        font={font}
        color={colors.text}
        opacity={0.5}
      />
      <Text
        x={labelX}
        y={timeY}
        text={timeText}
        font={font}
        color={colors.text}
        opacity={0.5}
      />
    </Group>
  );
}
