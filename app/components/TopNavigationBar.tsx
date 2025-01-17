import { useMessageDialogContext } from "@contexts";
import { getHeaderTitle } from "@react-navigation/elements";
import { StackHeaderProps } from "@react-navigation/stack";
import { signOut } from "firebase/auth";
import { auth } from "firebaseConfig";
import { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Appbar } from "react-native-paper";

export default memo(
  ({
    navigation,
    route,
    options,
    back,
    showLogout,
  }: StackHeaderProps & { showLogout?: boolean }) => {
    const title = getHeaderTitle(options, route.name);
    const { t } = useTranslation();
    const { showDialog } = useMessageDialogContext();

    const handleLogoutPress = useCallback(async () => {
      try {
        await signOut(auth);
      } catch {
        showDialog(t("errors.generic"));
      }
    }, [showDialog, t]);

    return (
      <Appbar.Header>
        {back && <Appbar.BackAction onPress={navigation.goBack} />}
        {showLogout && (
          <Appbar.Action icon="logout" onPress={handleLogoutPress} />
        )}
        <Appbar.Content title={title} />
      </Appbar.Header>
    );
  },
);
