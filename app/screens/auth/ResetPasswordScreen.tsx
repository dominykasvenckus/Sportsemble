import { SCREEN_SPACING } from "@constants";
import { useMessageDialogContext } from "@contexts";
import { AuthError, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "firebaseConfig";
import { memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, StyleSheet } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Button, HelperText, Text, TextInput } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default memo(() => {
  const { bottom } = useSafeAreaInsets();
  const { t } = useTranslation();
  const { showDialog } = useMessageDialogContext();

  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleEmailChange = useCallback((email: string) => {
    setEmail(email);
  }, []);

  const validate = useCallback(() => {
    const errors: Record<string, string> = {};

    if (!email) {
      errors.email = t("errors.emailNotEntered");
    }

    setErrors(errors);

    return Object.keys(errors)?.length === 0;
  }, [email, t]);

  const handleResetPasswordPress = useCallback(async () => {
    Keyboard.dismiss();

    if (!validate()) {
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      showDialog(t("success.passwordResetLinkSent"));
    } catch (error) {
      const authError = error as AuthError;
      switch (authError.code) {
        case "auth/invalid-email":
          setErrors({ email: t("errors.invalidEmail") });
          break;
        case "auth/too-many-requests":
          showDialog(t("errors.tooManyRequests"));
          break;
        case "auth/network-request-failed":
          showDialog(t("errors.networkRequestFailed"));
          break;
        default:
          showDialog(t("errors.generic"));
          break;
      }
    }
  }, [validate, email, showDialog, t]);

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={[
        styles.container,
        { paddingBottom: bottom + SCREEN_SPACING },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text variant="bodyLarge" style={[styles.text, styles.body]}>
        {t("screens.resetPassword.body")}
      </Text>
      <TextInput
        label={t("labels.email")}
        mode="outlined"
        style={[styles.textInput, errors.email ? styles.textInputError : null]}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={handleEmailChange}
        value={email}
        error={!!errors.email}
      />
      {errors.email && (
        <HelperText type="error" style={styles.helperText}>
          {errors.email}
        </HelperText>
      )}
      <Button
        mode="contained"
        style={styles.resetPasswordButton}
        onPress={handleResetPasswordPress}
      >
        {t("buttons.getResetLink")}
      </Button>
    </KeyboardAwareScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: SCREEN_SPACING,
    paddingHorizontal: SCREEN_SPACING,
  },
  text: {
    textAlign: "center",
  },
  body: {
    marginBottom: 30,
  },
  textInput: {
    maxWidth: 500,
    width: "100%",
    marginBottom: 20,
  },
  textInputError: {
    marginBottom: 0,
  },
  helperText: {
    maxWidth: 500,
    width: "100%",
    marginBottom: 10,
  },
  resetPasswordButton: {
    maxWidth: 500,
    width: "100%",
    marginTop: 10,
  },
});
