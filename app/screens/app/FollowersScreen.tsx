import { UserList } from "@components";
import { useMessageDialogContext } from "@contexts";
import { RootStackScreenProps, UserData } from "@types";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { firestore } from "firebaseConfig";
import { memo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default memo(({ route }: RootStackScreenProps<"Followers">) => {
  const { bottom } = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();
  const { showDialog } = useMessageDialogContext();

  const [followers, setFollowers] = useState<UserData[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { userId } = route.params;

  useEffect(() => {
    const q = query(
      collection(firestore, "users"),
      where("followingIds", "array-contains", userId),
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const followers = querySnapshot.docs.map(
          (doc) => ({ userId: doc.id, ...doc.data() }) as UserData,
        );
        setFollowers(followers);
        setIsLoading(false);
      },
      () => {
        showDialog(t("errors.generic"));
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [showDialog, t, userId]);

  return (
    <View style={[styles.container, { paddingBottom: bottom }]}>
      {!isLoading ? (
        <UserList data={followers} />
      ) : (
        <View style={styles.activityIndicatorContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  activityIndicatorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
