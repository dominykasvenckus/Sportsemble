import { ProfileForm } from "@components";
import { SCREEN_SPACING } from "@constants";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default memo(() => {
  const { bottom } = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={[
        styles.container,
        { paddingBottom: bottom + SCREEN_SPACING },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text variant="headlineMedium" style={[styles.text, styles.headline]}>
        {t("screens.profileSetup.headline")}
      </Text>
      <ProfileForm mode="setup" />
    </KeyboardAwareScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingTop: SCREEN_SPACING,
    paddingHorizontal: SCREEN_SPACING,
  },
  text: {
    textAlign: "center",
  },
  headline: {
    marginTop: 20,
    marginBottom: 35,
    fontWeight: "bold",
  },
});
