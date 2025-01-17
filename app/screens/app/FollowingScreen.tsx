import { UserList } from "@components";
import { useMessageDialogContext } from "@contexts";
import { RootStackScreenProps, UserData } from "@types";
import {
  collection,
  doc,
  documentId,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { firestore } from "firebaseConfig";
import { memo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default memo(({ route }: RootStackScreenProps<"Following">) => {
  const { bottom } = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();
  const { showDialog } = useMessageDialogContext();

  const [user, setUser] = useState<UserData | null>(null);
  const [following, setFollowing] = useState<UserData[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { userId } = route.params;

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(firestore, "users", userId),
      (doc) => {
        if (doc.exists()) {
          setUser({ userId: doc.id, ...doc.data() } as UserData);
        }
      },
      () => {
        showDialog(t("errors.generic"));
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [showDialog, t, userId]);

  useEffect(() => {
    if (!user) {
      return;
    }

    if (!user.followingIds) {
      setFollowing([]);
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(firestore, "users"),
      where(documentId(), "in", user.followingIds),
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const following = querySnapshot.docs.map(
          (doc) => ({ userId: doc.id, ...doc.data() }) as UserData,
        );
        setFollowing(following);
        setIsLoading(false);
      },
      () => {
        showDialog(t("errors.generic"));
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [showDialog, t, user]);

  return (
    <View style={[styles.container, { paddingBottom: bottom }]}>
      {!isLoading ? (
        <UserList data={following} />
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
