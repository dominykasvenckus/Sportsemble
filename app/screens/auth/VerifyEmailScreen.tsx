import { SCREEN_SPACING } from "@constants";
import { useMessageDialogContext } from "@contexts";
import { CommonActions } from "@react-navigation/native";
import { RootStackScreenProps } from "@types";
import {
  AuthError,
  onIdTokenChanged,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "firebaseConfig";
import { memo, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default memo(({ navigation }: RootStackScreenProps<"VerifyEmail">) => {
  const { bottom } = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();
  const { showDialog } = useMessageDialogContext();

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        if (!user.emailVerified) {
          try {
            await user.reload();
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
        } else {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: "ProfileSetup" }],
            }),
          );
        }
      }
    });

    return () => unsubscribe();
  }, [navigation, showDialog, t]);

  useEffect(() => {
    (async () => {
      if (!auth.currentUser) {
        return;
      }

      try {
        await sendEmailVerification(auth.currentUser);
      } catch (error) {
        const authError = error as AuthError;
        switch (authError.code) {
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
    })();
  }, [showDialog, t]);

  const handleResendPress = useCallback(async () => {
    if (!auth.currentUser) {
      return;
    }

    try {
      await sendEmailVerification(auth.currentUser);
      showDialog(t("success.verificationLinkSent"));
    } catch (error) {
      const authError = error as AuthError;
      switch (authError.code) {
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
  }, [showDialog, t]);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { paddingBottom: bottom + SCREEN_SPACING },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.emailInfoContainer}>
        <Text variant="headlineMedium" style={[styles.text, styles.headline]}>
          {t("screens.verifyEmail.headline")}
        </Text>
        <Text variant="bodyLarge" style={styles.text}>
          {t("screens.verifyEmail.bodyStart")}
        </Text>
        <Text variant="bodyLarge" style={[styles.text, styles.email]}>
          {auth.currentUser?.email}
        </Text>
        <Text variant="bodyLarge" style={[styles.text, styles.bodyEnd]}>
          {t("screens.verifyEmail.bodyEnd")}
        </Text>
      </View>
      <View style={styles.promptContainer}>
        <Text variant="bodyLarge" style={styles.text}>
          {t("screens.verifyEmail.resendEmailPrompt")}{" "}
        </Text>
        <Pressable
          style={({ pressed }) => pressed && styles.buttonPressed}
          onPress={handleResendPress}
        >
          <Text
            variant="titleMedium"
            style={[
              styles.text,
              styles.buttonText,
              { color: theme.colors.primary },
            ]}
          >
            {t("buttons.resend")}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingTop: SCREEN_SPACING,
    paddingHorizontal: SCREEN_SPACING,
  },
  emailInfoContainer: {
    marginTop: 180,
  },
  text: {
    textAlign: "center",
  },
  headline: {
    marginBottom: 35,
    fontWeight: "bold",
  },
  email: {
    marginTop: 15,
    marginBottom: 15,
    fontWeight: "bold",
  },
  bodyEnd: {
    marginBottom: 30,
  },
  promptContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonPressed: {
    opacity: 0.6,
  },
  buttonText: {
    fontWeight: "bold",
  },
});
