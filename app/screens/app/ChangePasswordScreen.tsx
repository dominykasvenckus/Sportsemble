import { SCREEN_SPACING } from "@constants";
import { useMessageDialogContext } from "@contexts";
import {
  AuthError,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { auth } from "firebaseConfig";
import { memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, StyleSheet } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Button, HelperText, TextInput } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default memo(() => {
  const { bottom } = useSafeAreaInsets();
  const { t } = useTranslation();
  const { showDialog } = useMessageDialogContext();

  const [textInputValues, setTextInputValues] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [isCurrentPasswordShown, setIsCurrentPasswordShown] = useState(false);
  const [isNewPasswordShown, setIsNewPasswordShown] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleTextInputChangeText = useCallback(
    (inputIdentifier: string) => (text: string) => {
      setTextInputValues((prev) => ({
        ...prev,
        [inputIdentifier]: text,
      }));
    },
    [],
  );

  const handleShowCurrentPasswordPress = useCallback(() => {
    setIsCurrentPasswordShown((prev) => !prev);
  }, []);

  const handleShowNewPasswordPress = useCallback(() => {
    setIsNewPasswordShown((prev) => !prev);
  }, []);

  const validate = useCallback(() => {
    const errors: Record<string, string> = {};

    if (!textInputValues.currentPassword) {
      errors.currentPassword = t("errors.currentPasswordNotEntered");
    }

    if (!textInputValues.newPassword) {
      errors.newPassword = t("errors.newPasswordNotEntered");
    }

    setErrors(errors);

    return Object.keys(errors)?.length === 0;
  }, [t, textInputValues.currentPassword, textInputValues.newPassword]);

  const handleSavePress = useCallback(async () => {
    Keyboard.dismiss();

    if (!auth.currentUser || !validate()) {
      return;
    }

    try {
      await auth.currentUser.reload();
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email!,
        textInputValues.currentPassword,
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, textInputValues.newPassword);
      showDialog(t("success.passwordChanged"));
    } catch (error) {
      const authError = error as AuthError;
      switch (authError.code) {
        case "auth/weak-password":
          setErrors({ newPassword: t("errors.weakPassword") });
          break;
        case "auth/invalid-credential":
          setErrors({ currentPassword: t("errors.invalidPassword") });
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
    textInputValues.currentPassword,
    textInputValues.newPassword,
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
      <TextInput
        label={t("labels.currentPassword")}
        mode="outlined"
        style={[
          styles.textInput,
          errors.currentPassword ? styles.textInputError : null,
        ]}
        secureTextEntry={!isCurrentPasswordShown}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={handleTextInputChangeText("currentPassword")}
        value={textInputValues.currentPassword}
        error={!!errors.currentPassword}
        right={
          <TextInput.Icon
            icon={!isCurrentPasswordShown ? "eye" : "eye-off"}
            onPress={handleShowCurrentPasswordPress}
            forceTextInputFocus={false}
          />
        }
      />
      {errors.currentPassword && (
        <HelperText type="error" style={styles.helperText}>
          {errors.currentPassword}
        </HelperText>
      )}
      <TextInput
        label={t("labels.newPassword")}
        mode="outlined"
        style={[
          styles.textInput,
          errors.newPassword ? styles.textInputError : null,
        ]}
        secureTextEntry={!isNewPasswordShown}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={handleTextInputChangeText("newPassword")}
        value={textInputValues.newPassword}
        error={!!errors.newPassword}
        right={
          <TextInput.Icon
            icon={!isNewPasswordShown ? "eye" : "eye-off"}
            onPress={handleShowNewPasswordPress}
            forceTextInputFocus={false}
          />
        }
      />
      {errors.newPassword && (
        <HelperText type="error" style={styles.helperText}>
          {errors.newPassword}
        </HelperText>
      )}
      <Button
        mode="contained"
        style={styles.saveButton}
        onPress={handleSavePress}
      >
        {t("buttons.save")}
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
  saveButton: {
    maxWidth: 500,
    width: "100%",
    marginTop: 10,
  },
});
