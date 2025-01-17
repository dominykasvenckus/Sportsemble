import { memo } from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  TextStyle,
  ViewStyle,
} from "react-native";
import { Text } from "react-native-paper";
import { VariantProp } from "react-native-paper/lib/typescript/components/Typography/types";

type MultilineButtonProps = {
  style?: StyleProp<ViewStyle>;
  pressedStyle?: StyleProp<ViewStyle>;
  firstLineVariant?: VariantProp<never>;
  firstLineText: string;
  firstLineStyle?: StyleProp<TextStyle>;
  secondLineVariant?: VariantProp<never>;
  secondLineText: string;
  secondLineStyle?: StyleProp<TextStyle>;
  onPress: () => void;
};

export default memo(
  ({
    style,
    pressedStyle,
    firstLineVariant,
    firstLineText,
    firstLineStyle,
    secondLineVariant,
    secondLineText,
    secondLineStyle,
    onPress,
  }: MultilineButtonProps) => {
    return (
      <Pressable
        style={({ pressed }) => [
          style,
          pressed && [styles.containerPressed, pressedStyle],
        ]}
        onPress={onPress}
      >
        <Text variant={firstLineVariant} style={[styles.text, firstLineStyle]}>
          {firstLineText}
        </Text>
        <Text
          variant={secondLineVariant}
          style={[styles.text, secondLineStyle]}
        >
          {secondLineText}
        </Text>
      </Pressable>
    );
  },
);

const styles = StyleSheet.create({
  containerPressed: {
    opacity: 0.6,
  },
  text: {
    textAlign: "center",
  },
});
