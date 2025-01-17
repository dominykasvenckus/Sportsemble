import { ProfileForm } from "@components";
import { SCREEN_SPACING } from "@constants";
import { memo } from "react";
import { StyleSheet } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default memo(() => {
  const { bottom } = useSafeAreaInsets();

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={[
        styles.container,
        { paddingBottom: bottom + SCREEN_SPACING },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <ProfileForm mode="edit" />
    </KeyboardAwareScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingTop: SCREEN_SPACING,
    paddingHorizontal: SCREEN_SPACING,
  },
});
