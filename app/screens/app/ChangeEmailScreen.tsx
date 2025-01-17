import { SCREEN_SPACING } from "@constants";
import { useMessageDialogContext } from "@contexts";
import {
  AuthError,
  EmailAuthProvider,
  reauthenticateWithCredential,
  verifyBeforeUpdateEmail,
} from "firebase/auth";
import { auth } from "firebaseConfig";
import { memo, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, StyleSheet } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Button, HelperText, Text, TextInput } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default memo(() => {
  const { bottom } = useSafeAreaInsets();
  const { t } = useTranslation();
  const { showDialog } = useMessageDialogContext();

  const [textInputValues, setTextInputValues] = useState({
    password: "",
    newEmail: "",
  });
  const [isPasswordShown, setIsPasswordShown] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      if (!auth.currentUser) {
        return;
      }

      try {
        await auth.currentUser.reload();
      } catch (error) {
        const authError = error as AuthError;
        switch (authError.code) {
          case "auth/user-token-expired":
            showDialog(t("errors.userTokenExpired"));
            break;
          case "auth/network-request-failed":
            showDialog(t("errors.networkRequestFailed"));
            break;
          default:
            showDialog(t("errors.generic"));
            break;
        }
      }
    })();
  }, [showDialog, t]);

  const handleTextInputChangeText = useCallback(
    (inputIdentifier: string) => (text: string) => {
      setTextInputValues((prev) => ({
        ...prev,
        [inputIdentifier]: text,
      }));
    },
    [],
  );

  const handleShowPasswordPress = useCallback(() => {
    setIsPasswordShown((prev) => !prev);
  }, []);

  const validate = useCallback(() => {
    const errors: Record<string, string> = {};

    if (!textInputValues.password) {
      errors.password = t("errors.passwordNotEntered");
    }

    if (!textInputValues.newEmail) {
      errors.newEmail = t("errors.newEmailNotEntered");
    }

    setErrors(errors);

    return Object.keys(errors)?.length === 0;
  }, [textInputValues.password, textInputValues.newEmail, t]);

  const handleGetVerificationLinkPress = useCallback(async () => {
    Keyboard.dismiss();

    if (!auth.currentUser || !validate()) {
      return;
    }

    try {
      auth.currentUser.reload();
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email!,
        textInputValues.password,
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      await verifyBeforeUpdateEmail(auth.currentUser, textInputValues.newEmail);
      showDialog(t("success.verificationLinkSent"));
    } catch (error) {
      const authError = error as AuthError;
      switch (authError.code) {
        case "auth/invalid-new-email":
          setErrors({ newEmail: t("errors.invalidNewEmail") });
          break;
        case "auth/invalid-credential":
          setErrors({ password: t("errors.invalidPassword") });
          break;
        case "auth/user-disabled":
          showDialog(t("errors.accountDisabled"));
          break;
        case "auth/user-token-expired":
          showDialog(t("errors.userTokenExpired"));
          break;
        case "auth/network-request-failed":
          showDialog(t("errors.networkRequestFailed"));
          break;
        default:
          showDialog(t("errors.generic"));
          break;
      }
    }
  }, [
    validate,
    textInputValues.password,
    textInputValues.newEmail,
    showDialog,
    t,
  ]);

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={[
        styles.container,
        { paddingBottom: bottom + SCREEN_SPACING },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text variant="bodyLarge" style={styles.text}>
        {t("screens.changeEmail.bodyStart")}
      </Text>
      <Text variant="bodyLarge" style={[styles.text, styles.email]}>
        {auth.currentUser?.email}
      </Text>
      <Text variant="bodyLarge" style={[styles.text, styles.bodyEnd]}>
        {t("screens.changeEmail.bodyEnd")}
      </Text>
      <TextInput
        label={t("labels.password")}
        mode="outlined"
        style={[
          styles.textInput,
          errors.password ? styles.textInputError : null,
        ]}
        secureTextEntry={!isPasswordShown}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={handleTextInputChangeText("password")}
        value={textInputValues.password}
        error={!!errors.password}
        right={
          <TextInput.Icon
            icon={!isPasswordShown ? "eye" : "eye-off"}
            onPress={handleShowPasswordPress}
            forceTextInputFocus={false}
          />
        }
      />
      {errors.password && (
        <HelperText type="error" style={styles.helperText}>
          {errors.password}
        </HelperText>
      )}
      <TextInput
        label={t("labels.newEmail")}
        mode="outlined"
        style={[
          styles.textInput,
          errors.newEmail ? styles.textInputError : null,
        ]}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={handleTextInputChangeText("newEmail")}
        value={textInputValues.newEmail}
        error={!!errors.newEmail}
      />
      {errors.newEmail && (
        <HelperText type="error" style={styles.helperText}>
          {errors.newEmail}
        </HelperText>
      )}
      <Button
        mode="contained"
        style={styles.getVerificationLinkButton}
        onPress={handleGetVerificationLinkPress}
      >
        {t("buttons.getVerificationLink")}
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
  email: {
    marginTop: 5,
    marginBottom: 20,
    fontWeight: "bold",
  },
  bodyEnd: {
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
  getVerificationLinkButton: {
    maxWidth: 500,
    width: "100%",
    marginTop: 10,
  },
});
