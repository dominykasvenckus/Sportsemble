import { SCREEN_SPACING } from "@constants";
import { useMessageDialogContext } from "@contexts";
import { RootStackScreenProps } from "@types";
import { AuthError, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "firebaseConfig";
import { memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, Pressable, StyleSheet, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import {
  Button,
  HelperText,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default memo(({ navigation }: RootStackScreenProps<"Login">) => {
  const { top, bottom } = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();
  const { showDialog } = useMessageDialogContext();

  const [textInputValues, setTextInputValues] = useState({
    email: "",
    password: "",
  });
  const [isPasswordShown, setIsPasswordShown] = useState(false);
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

  const handleResetPasswordPress = useCallback(() => {
    navigation.navigate("ResetPassword");
  }, [navigation]);

  const validate = useCallback(() => {
    const errors: Record<string, string> = {};

    if (!textInputValues.email) {
      errors.email = t("errors.emailNotEntered");
    }

    if (!textInputValues.password) {
      errors.password = t("errors.passwordNotEntered");
    }

    setErrors(errors);

    return Object.keys(errors)?.length === 0;
  }, [t, textInputValues.email, textInputValues.password]);

  const handleLoginPress = useCallback(async () => {
    Keyboard.dismiss();

    if (!validate()) {
      return;
    }

    try {
      await signInWithEmailAndPassword(
        auth,
        textInputValues.email,
        textInputValues.password,
      );
    } catch (error) {
      const authError = error as AuthError;
      switch (authError.code) {
        case "auth/invalid-email":
          setErrors({ email: t("errors.invalidEmail") });
          break;
        case "auth/invalid-credential":
          showDialog(t("errors.invalidCredentials"));
          break;
        case "auth/too-many-requests":
          showDialog(t("errors.tooManyRequests"));
          break;
        case "auth/user-disabled":
          showDialog(t("errors.accountDisabled"));
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

  const handleSignUpPress = useCallback(() => {
    navigation.navigate("SignUp");
  }, [navigation]);

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: top + SCREEN_SPACING,
          paddingBottom: bottom + SCREEN_SPACING,
        },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View>
        <Text variant="headlineLarge" style={[styles.text, styles.headline]}>
          {t("screens.login.headline")}
        </Text>
        <Text variant="titleMedium" style={[styles.text, styles.title]}>
          {t("screens.login.title")}
        </Text>
        <TextInput
          label={t("labels.email")}
          mode="outlined"
          style={[
            styles.textInput,
            errors.email ? styles.textInputError : null,
          ]}
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
        <Button
          mode="contained"
          style={styles.loginButton}
          onPress={handleLoginPress}
        >
          {t("buttons.logIn")}
        </Button>
        <Pressable
          style={({ pressed }) => pressed && styles.buttonPressed}
          onPress={handleResetPasswordPress}
        >
          <Text
            variant="titleMedium"
            style={[
              styles.text,
              styles.buttonText,
              styles.resetPasswordText,
              { color: theme.colors.primary },
            ]}
          >
            {t("screens.login.resetPasswordPrompt")}
          </Text>
        </Pressable>
      </View>
      <View style={styles.promptContainer}>
        <Text variant="bodyLarge" style={styles.text}>
          {t("screens.login.signUpPrompt")}{" "}
        </Text>
        <Pressable
          style={({ pressed }) => pressed && styles.buttonPressed}
          onPress={handleSignUpPress}
        >
          <Text
            variant="titleMedium"
            style={[
              styles.text,
              styles.buttonText,
              { color: theme.colors.primary },
            ]}
          >
            {t("buttons.signUp")}
          </Text>
        </Pressable>
      </View>
    </KeyboardAwareScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingHorizontal: SCREEN_SPACING,
  },
  text: {
    textAlign: "center",
  },
  headline: {
    marginTop: 90,
    marginBottom: 10,
    fontWeight: "bold",
  },
  title: {
    marginBottom: 70,
  },
  textInput: {
    alignSelf: "center",
    maxWidth: 500,
    width: "100%",
    marginBottom: 20,
  },
  textInputError: {
    marginBottom: 0,
  },
  helperText: {
    alignSelf: "center",
    maxWidth: 500,
    width: "100%",
    marginBottom: 10,
  },
  loginButton: {
    alignSelf: "center",
    maxWidth: 500,
    width: "100%",
    marginTop: 10,
    marginBottom: 25,
  },
  resetPasswordText: {
    marginBottom: 25,
  },
  promptContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonText: {
    fontWeight: "bold",
  },
  buttonPressed: {
    opacity: 0.6,
  },
});
