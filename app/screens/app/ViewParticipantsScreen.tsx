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

export default memo(({ route }: RootStackScreenProps<"ViewParticipants">) => {
  const { bottom } = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();
  const { showDialog } = useMessageDialogContext();

  const [participants, setParticipants] = useState<
    (UserData & { isOrganizer: boolean })[] | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);

  const { activityId, organizerId } = route.params;

  useEffect(() => {
    const q = query(
      collection(firestore, "users"),
      where("activityIds", "array-contains", activityId),
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const participants = querySnapshot.docs.map(
          (doc) =>
            ({
              userId: doc.id,
              ...doc.data(),
              isOrganizer: doc.id === organizerId,
            }) as UserData & { isOrganizer: boolean },
        );
        setParticipants(participants);
        setIsLoading(false);
      },
      () => {
        showDialog(t("errors.generic"));
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [activityId, organizerId, showDialog, t]);

  return (
    <View style={[styles.container, { paddingBottom: bottom }]}>
      {!isLoading ? (
        <UserList data={participants} />
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
