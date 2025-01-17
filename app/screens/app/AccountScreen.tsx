import { RootStackScreenProps } from "@types";
import { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet } from "react-native";
import { Divider, List } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default memo(({ navigation }: RootStackScreenProps<"Account">) => {
  const { bottom } = useSafeAreaInsets();
  const { t } = useTranslation();

  const handleChangeEmailPress = useCallback(() => {
    navigation.navigate("ChangeEmail");
  }, [navigation]);

  const handleChangePasswordPress = useCallback(() => {
    navigation.navigate("ChangePassword");
  }, [navigation]);

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { paddingBottom: bottom }]}
      showsVerticalScrollIndicator={false}
    >
      <List.Item
        title={t("buttons.changeEmail")}
        style={styles.listItem}
        left={() => <List.Icon icon="email" style={styles.listIcon} />}
        onPress={handleChangeEmailPress}
        unstable_pressDelay={100}
      />
      <Divider style={styles.divider} />
      <List.Item
        title={t("buttons.changePassword")}
        style={styles.listItem}
        left={() => <List.Icon icon="key" style={styles.listIcon} />}
        onPress={handleChangePasswordPress}
        unstable_pressDelay={100}
      />
      <Divider style={styles.divider} />
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  listItem: {
    height: 60,
    justifyContent: "center",
  },
  listIcon: {
    marginLeft: 20,
  },
  divider: {
    width: "100%",
  },
});
