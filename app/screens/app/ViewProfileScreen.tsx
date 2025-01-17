import { defaultProfile } from "@assets";
import { MultilineButton } from "@components";
import { SCREEN_SPACING } from "@constants";
import { useMessageDialogContext } from "@contexts";
import { ChatData, RootStackScreenProps, UserData } from "@types";
import {
  arrayUnion,
  collection,
  deleteField,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, firestore } from "firebaseConfig";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { Avatar, Button, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default memo(
  ({ navigation, route }: RootStackScreenProps<"ViewProfile">) => {
    const { bottom } = useSafeAreaInsets();
    const theme = useTheme();
    const { t } = useTranslation();
    const { showDialog } = useMessageDialogContext();

    const [user, setUser] = useState<UserData | null>(null);
    const [viewedUser, setViewedUser] = useState<UserData | null>(null);
    const [followerCountText, setFollowerCountText] = useState("");
    const [isUserLoading, setIsUserLoading] = useState(true);
    const [isViewedUserLoading, setIsViewedUserLoading] = useState(true);
    const [isFollowerCountTextLoading, setIsFollowerCountTextLoading] =
      useState(true);

    const viewedUserId = route.params.userId;

    useEffect(() => {
      if (!auth.currentUser) {
        setIsUserLoading(false);
        return;
      }

      const unsubscribe = onSnapshot(
        doc(firestore, "users", auth.currentUser.uid),
        (doc) => {
          if (doc.exists()) {
            setUser({ userId: doc.id, ...doc.data() } as UserData);
          }
          setIsUserLoading(false);
        },
        () => {
          showDialog(t("errors.generic"));
          setIsUserLoading(false);
        },
      );

      return () => unsubscribe();
    }, [showDialog, t]);

    useEffect(() => {
      const unsubscribe = onSnapshot(
        doc(firestore, "users", viewedUserId),
        (doc) => {
          if (doc.exists()) {
            setViewedUser({ userId: doc.id, ...doc.data() } as UserData);
          }
          setIsViewedUserLoading(false);
        },
        () => {
          showDialog(t("errors.generic"));
          setIsViewedUserLoading(false);
        },
      );

      return () => unsubscribe();
    }, [showDialog, t, viewedUserId]);

    useEffect(() => {
      const q = query(
        collection(firestore, "users"),
        where("followingIds", "array-contains", viewedUserId),
      );

      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          setFollowerCountText(querySnapshot.docs.length.toString());
          setIsFollowerCountTextLoading(false);
        },
        () => {
          showDialog(t("errors.generic"));
          setIsFollowerCountTextLoading(false);
        },
      );

      return () => unsubscribe();
    }, [showDialog, t, viewedUserId]);

    const handleFollowersPress = useCallback(() => {
      navigation.push("Followers", { userId: viewedUserId });
    }, [navigation, viewedUserId]);

    const handleFollowingPress = useCallback(() => {
      navigation.push("Following", { userId: viewedUserId });
    }, [navigation, viewedUserId]);

    const isFollowing = useMemo(() => {
      if (!user) {
        return null;
      }

      return user.followingIds
        ? user.followingIds.includes(viewedUserId)
        : false;
    }, [user, viewedUserId]);

    const handleFollowPress = useCallback(async () => {
      if (!user || !viewedUser) {
        return;
      }

      try {
        await updateDoc(doc(firestore, "users", user.userId), {
          followingIds: arrayUnion(viewedUser.userId),
        });
      } catch {
        showDialog(t("errors.generic"));
      }
    }, [showDialog, t, user, viewedUser]);

    const handleUnfollowPress = useCallback(async () => {
      if (!user || !user.followingIds || !viewedUser) {
        return;
      }

      const updatedFollowingIds = user.followingIds.filter(
        (id) => id !== viewedUser.userId,
      );

      try {
        if (updatedFollowingIds.length !== 0) {
          await updateDoc(doc(firestore, "users", user.userId), {
            followingIds: updatedFollowingIds,
          });
        } else {
          await updateDoc(doc(firestore, "users", user.userId), {
            followingIds: deleteField(),
          });
        }
      } catch {
        showDialog(t("errors.generic"));
      }
    }, [showDialog, t, user, viewedUser]);

    const handleMessagePress = useCallback(async () => {
      if (!user || !viewedUser) {
        return;
      }

      try {
        const q = query(
          collection(firestore, "chats"),
          where("userIds", "array-contains", user.userId),
        );

        const querySnapshot = await getDocs(q);
        const chats = querySnapshot.docs.filter((doc) => {
          const chat = { chatId: doc.id, ...doc.data() } as ChatData;
          return chat.userIds.includes(viewedUser.userId);
        });

        if (chats.length !== 0) {
          const chat = {
            chatId: chats[0].id,
            ...chats[0].data(),
          } as ChatData;
          navigation.navigate("Messages", {
            chatId: chat.chatId,
            userIds: chat.userIds,
          });
        } else {
          const userIds = [user.userId, viewedUser.userId];
          navigation.navigate("Messages", { userIds });
        }
      } catch {
        showDialog(t("errors.generic"));
      }
    }, [navigation, showDialog, t, user, viewedUser]);

    return (
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: bottom + SCREEN_SPACING },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {!isUserLoading &&
        !isViewedUserLoading &&
        !isFollowerCountTextLoading ? (
          user &&
          viewedUser &&
          followerCountText && (
            <>
              <Avatar.Image
                size={130}
                source={
                  viewedUser.profileUrl
                    ? { uri: viewedUser.profileUrl }
                    : defaultProfile
                }
              />
              <Text variant="headlineMedium" style={styles.headline}>
                {viewedUser.fullName}
              </Text>
              <View style={styles.multilineButtonsContainer}>
                <MultilineButton
                  firstLineVariant="titleLarge"
                  firstLineStyle={styles.firstLine}
                  firstLineText={followerCountText}
                  secondLineVariant="titleMedium"
                  secondLineStyle={styles.secondLine}
                  secondLineText={t("buttons.followers")}
                  onPress={handleFollowersPress}
                />
                <MultilineButton
                  firstLineVariant="titleLarge"
                  firstLineStyle={styles.firstLine}
                  firstLineText={
                    viewedUser.followingIds
                      ? viewedUser.followingIds.length.toString()
                      : "0"
                  }
                  secondLineVariant="titleMedium"
                  secondLineStyle={styles.secondLine}
                  secondLineText={t("buttons.following")}
                  onPress={handleFollowingPress}
                />
              </View>
              <View style={styles.buttonsContainer}>
                <Button
                  mode={isFollowing ? "outlined" : "contained"}
                  style={styles.followUnfollowButton}
                  onPress={
                    isFollowing ? handleUnfollowPress : handleFollowPress
                  }
                >
                  {isFollowing ? t("buttons.unfollow") : t("buttons.follow")}
                </Button>
                <Button
                  mode="outlined"
                  style={styles.messageButton}
                  onPress={handleMessagePress}
                >
                  {t("buttons.message")}
                </Button>
              </View>
              <Text variant="bodyLarge">{viewedUser.aboutMe}</Text>
            </>
          )
        ) : (
          <View style={styles.activityIndicatorContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}
      </ScrollView>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingTop: SCREEN_SPACING,
    paddingHorizontal: SCREEN_SPACING,
    alignItems: "center",
  },
  headline: {
    marginTop: 10,
    marginBottom: 15,
    fontWeight: "bold",
  },
  multilineButtonsContainer: {
    flexDirection: "row",
    gap: 50,
    marginBottom: 20,
  },
  firstLine: {
    fontWeight: "bold",
  },
  secondLine: {
    color: "#8f8f8f",
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 30,
  },
  followUnfollowButton: {
    justifyContent: "center",
    width: 135,
  },
  messageButton: {
    width: 135,
  },
  activityIndicatorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
