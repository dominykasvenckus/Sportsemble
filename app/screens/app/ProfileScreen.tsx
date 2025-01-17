import { defaultProfile } from "@assets";
import { MultilineButton } from "@components";
import { useMessageDialogContext } from "@contexts";
import { HomeTabScreenProps, UserData } from "@types";
import { signOut } from "firebase/auth";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { auth, firestore } from "firebaseConfig";
import { memo, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import {
  Avatar,
  Button,
  Divider,
  List,
  Text,
  useTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default memo(({ navigation }: HomeTabScreenProps<"Profile">) => {
  const { top } = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();
  const { showDialog } = useMessageDialogContext();

  const [user, setUser] = useState<UserData | null>(null);
  const [followerCountText, setFollowerCountText] = useState("");
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [isFollowerCountTextLoading, setIsFollowerCountTextLoading] =
    useState(true);

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
      (error) => {
        if (error.code !== "permission-denied") {
          showDialog(t("errors.generic"));
        }
        setIsUserLoading(false);
      },
    );

    return () => unsubscribe();
  }, [showDialog, t]);

  useEffect(() => {
    if (!auth.currentUser) {
      setIsFollowerCountTextLoading(false);
      return;
    }

    const q = query(
      collection(firestore, "users"),
      where("followingIds", "array-contains", auth.currentUser.uid),
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        setFollowerCountText(querySnapshot.docs.length.toString());
        setIsFollowerCountTextLoading(false);
      },
      (error) => {
        if (error.code !== "permission-denied") {
          showDialog(t("errors.generic"));
        }
        setIsFollowerCountTextLoading(false);
      },
    );

    return () => unsubscribe();
  }, [showDialog, t]);

  const handleFollowersPress = useCallback(() => {
    if (!user) {
      return;
    }

    navigation.push("Followers", { userId: user.userId });
  }, [navigation, user]);

  const handleFollowingPress = useCallback(() => {
    if (!user) {
      return;
    }

    navigation.push("Following", { userId: user.userId });
  }, [navigation, user]);

  const handleEditProfilePress = useCallback(() => {
    navigation.navigate("EditProfile");
  }, [navigation]);

  const handleAccountPress = useCallback(() => {
    navigation.navigate("Account");
  }, [navigation]);

  const handleLogoutPress = useCallback(async () => {
    try {
      await signOut(auth);
    } catch {
      showDialog(t("errors.generic"));
    }
  }, [showDialog, t]);

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { paddingTop: top }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.userContainer}>
        {!isUserLoading && !isFollowerCountTextLoading ? (
          user && (
            <>
              <Avatar.Image
                size={130}
                source={
                  user.profileUrl ? { uri: user.profileUrl } : defaultProfile
                }
              />
              <Text variant="headlineMedium" style={styles.headline}>
                {user.fullName}
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
                    user.followingIds
                      ? user.followingIds.length.toString()
                      : "0"
                  }
                  secondLineVariant="titleMedium"
                  secondLineStyle={styles.secondLine}
                  secondLineText={t("buttons.following")}
                  onPress={handleFollowingPress}
                />
              </View>
            </>
          )
        ) : (
          <ActivityIndicator size="large" color={theme.colors.primary} />
        )}
      </View>
      <Button
        mode="outlined"
        style={styles.editProfileButton}
        onPress={handleEditProfilePress}
      >
        {t("buttons.editProfile")}
      </Button>
      <List.Item
        title={t("buttons.account")}
        style={styles.listItem}
        left={() => <List.Icon icon="account-circle" style={styles.listIcon} />}
        onPress={handleAccountPress}
        unstable_pressDelay={100}
      />
      <Divider style={styles.divider} />
      <List.Item
        title={t("buttons.logOut")}
        style={styles.listItem}
        left={() => <List.Icon icon="logout" style={styles.listIcon} />}
        onPress={handleLogoutPress}
        unstable_pressDelay={100}
      />
      <Divider style={styles.divider} />
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
  },
  userContainer: {
    justifyContent: "center",
    alignItems: "center",
    height: 250,
    marginTop: 30,
    marginBottom: 20,
  },
  headline: {
    marginTop: 10,
    marginBottom: 15,
    fontWeight: "bold",
  },
  multilineButtonsContainer: {
    flexDirection: "row",
    gap: 50,
  },
  firstLine: {
    fontWeight: "bold",
  },
  secondLine: {
    color: "#8f8f8f",
  },
  editProfileButton: {
    width: 230,
    marginBottom: 20,
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
