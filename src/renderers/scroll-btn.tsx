import { Pressable, StyleSheet } from "react-native";
import {
  createAnimatedComponent,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Path, Svg } from "react-native-svg";

import type { IScrollBtnProps } from "../types";

const APresssable = createAnimatedComponent(Pressable);

export function ScrollBtn({
  colors,
  translateY,
  indicatorTranslateY,
  initialTranslateX,
  chartWidth,
  translateX,
  plotHeight,
  width,
}: IScrollBtnProps) {
  const firstRender = useSharedValue(true);

  const handlePress = () => {
    "worklet";
    translateX.set(withTiming(initialTranslateX.value, { duration: 300 }));
    translateY.set(withTiming(0, { duration: 300 }));
    if (indicatorTranslateY) {
      indicatorTranslateY.set(withTiming(0, { duration: 300 }));
    }
  };

  const translateXValue = useSharedValue(width);

  useDerivedValue(() => {
    if (firstRender.value) {
      firstRender.value = false;
      return;
    }

    const isStart = initialTranslateX.value >= translateX.value;

    const endX = chartWidth.value - 20 - 10;

    if (
      (isStart && translateXValue.value === width) ||
      (!isStart && translateXValue.value === endX)
    )
      return;

    translateXValue.value = withTiming(isStart ? width : endX, {
      duration: 300,
    });
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateXValue.value },
      { translateY: plotHeight - 10 },
    ],
  }));

  return (
    <APresssable
      onPress={handlePress}
      style={[
        { backgroundColor: colors.text },
        styles.container,
        animatedStyle,
      ]}
    >
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M9.21934 7.21934C9.35997 7.07889 9.55059 7 9.74934 7C9.94809 7 10.1387 7.07889 10.2793 7.21934L14.5293 11.4693C14.6698 11.61 14.7487 11.8006 14.7487 11.9993C14.7487 12.1981 14.6698 12.3887 14.5293 12.5293L10.2793 16.7793C10.1372 16.9118 9.94912 16.9839 9.75482 16.9805C9.56052 16.9771 9.37513 16.8984 9.23772 16.761C9.10031 16.6235 9.02159 16.4382 9.01816 16.2439C9.01474 16.0496 9.08686 15.8615 9.21934 15.7193L12.9393 11.9993L9.21934 8.27934C9.07889 8.13871 9 7.94809 9 7.74934C9 7.55059 9.07889 7.35997 9.21934 7.21934Z"
          fill={colors.bg}
        />
      </Svg>
    </APresssable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 20,
    height: 20,
    position: "absolute",
    zIndex: 1000,
    borderRadius: 2,
  },
});
