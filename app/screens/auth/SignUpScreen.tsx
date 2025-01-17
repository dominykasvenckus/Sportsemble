import { SCREEN_SPACING } from "@constants";
import { useMessageDialogContext } from "@contexts";
import { AuthError, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "firebaseConfig";
import { memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, Pressable, StyleSheet, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import {
  Button,
  Checkbox,
  HelperText,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default memo(() => {
  const { bottom } = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();
  const { showDialog } = useMessageDialogContext();

  const [textInputValues, setTextInputValues] = useState({
    email: "",
    password: "",
  });
  const [isPasswordShown, setIsPasswordShown] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
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

  const handleShowPasswordPress = useCallback(() => {
    setIsPasswordShown((prev) => !prev);
  }, []);

  const handleCheckboxPress = useCallback(() => {
    setIsChecked((prev) => !prev);
  }, []);

  const validate = useCallback(() => {
    const errors: Record<string, string> = {};

    if (!textInputValues.email) {
      errors.email = t("errors.emailNotEntered");
    }

    if (!textInputValues.password) {
      errors.password = t("errors.passwordNotEntered");
    }

    if (!isChecked) {
      errors.checkbox = t("errors.privacyPolicyAgreementMissing");
    }

    setErrors(errors);

    return Object.keys(errors)?.length === 0;
  }, [textInputValues.email, textInputValues.password, isChecked, t]);

  const handleSignUpPress = useCallback(async () => {
    Keyboard.dismiss();

    if (!validate()) {
      return;
    }

    try {
      await createUserWithEmailAndPassword(
        auth,
        textInputValues.email,
        textInputValues.password,
      );
    } catch (error) {
      const authError = error as AuthError;
      switch (authError.code) {
        case "auth/email-already-in-use":
          setErrors({ email: t("errors.emailAlreadyInUse") });
          break;
        case "auth/invalid-email":
          setErrors({ email: t("errors.invalidEmail") });
          break;
        case "auth/weak-password":
          setErrors({ password: t("errors.weakPassword") });
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
    textInputValues.email,
    textInputValues.password,
    t,
    showDialog,
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
        label={t("labels.email")}
        mode="outlined"
        style={[styles.textInput, errors.email ? styles.textInputError : null]}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={handleTextInputChangeText("email")}
        value={textInputValues.email}
        error={!!errors.email}
      />
      {errors.email && (
        <HelperText type="error" style={styles.helperText}>
          {errors.email}
        </HelperText>
      )}
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
      <View
        style={[
          styles.checkboxContainer,
          errors.checkbox ? styles.checkboxContainerError : null,
        ]}
      >
        <Checkbox.Android
          status={isChecked ? "checked" : "unchecked"}
          onPress={handleCheckboxPress}
        />
        <View style={styles.promptContainer}>
          <Text style={styles.text}>{t("labels.privacyPolicyAgreement")} </Text>
          <Pressable
            style={({ pressed }) => pressed && styles.buttonPressed}
            onPress={() => {}}
          >
            <Text
              style={[
                styles.text,
                styles.buttonText,
                { color: theme.colors.primary },
              ]}
            >
              {t("labels.privacyPolicy")}
            </Text>
          </Pressable>
        </View>
      </View>
      {errors.checkbox && (
        <HelperText type="error" style={styles.helperText}>
          {errors.checkbox}
        </HelperText>
      )}
      <Button
        mode="contained"
        style={styles.signUpButton}
        onPress={handleSignUpPress}
      >
        {t("buttons.signUp")}
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
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: 500,
    width: "100%",
    gap: 7,
    marginBottom: 10,
  },
  checkboxContainerError: {
    marginBottom: 0,
  },
  promptContainer: {
    flexDirection: "row",
  },
  buttonText: {
    fontWeight: "bold",
  },
  buttonPressed: {
    opacity: 0.6,
  },
  signUpButton: {
    maxWidth: 500,
    width: "100%",
    marginTop: 10,
  },
});
