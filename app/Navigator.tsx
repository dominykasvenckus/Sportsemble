import { TopNavigationBar } from "@components";
import { SCREEN_SPACING } from "@constants";
import { useMessageDialogContext } from "@contexts";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { HomeTabParamList, RootStackParamList } from "@types";
import * as SplashScreen from "expo-splash-screen";
import { User, onAuthStateChanged } from "firebase/auth";
import { FirestoreError, doc, getDoc } from "firebase/firestore";
import { auth, firestore } from "firebaseConfig";
import { memo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { createMaterialBottomTabNavigator } from "react-native-paper/react-navigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import * as Screens from "./screens";

SplashScreen.preventAutoHideAsync();

const RootStack = createStackNavigator<RootStackParamList>();
const HomeTab = createMaterialBottomTabNavigator<HomeTabParamList>();

const HomeTabNavigator = memo(() => {
  const { t } = useTranslation();

  return (
    <HomeTab.Navigator>
      <HomeTab.Screen
        name="Activities"
        component={Screens.ActivitiesScreen}
        options={{
          tabBarIcon: "run-fast",
          title: t("screens.activities.screenTitle"),
        }}
      />
      <HomeTab.Screen
        name="People"
        component={Screens.PeopleScreen}
        options={{
          tabBarIcon: "account-group",
          title: t("screens.people.screenTitle"),
        }}
      />
      <HomeTab.Screen
        name="Chats"
        component={Screens.ChatsScreen}
        options={{
          tabBarIcon: "chat",
          title: t("screens.chats.screenTitle"),
        }}
      />
      <HomeTab.Screen
        name="Profile"
        component={Screens.ProfileScreen}
        options={{
          tabBarIcon: "account",
          title: t("screens.profile.screenTitle"),
        }}
      />
    </HomeTab.Navigator>
  );
});

export default memo(() => {
  const { top, bottom } = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();
  const { showDialog } = useMessageDialogContext();

  const [user, setUser] = useState<(User & { hasProfile: boolean }) | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docSnap = await getDoc(doc(firestore, "users", user.uid));
          setUser({ ...user, hasProfile: docSnap.exists() });
        } catch (error) {
          const firestoreError = error as FirestoreError;
          switch (firestoreError.code) {
            case "unavailable":
              setErrorText(t("errors.networkRequestFailed"));
              break;
            default:
              setErrorText(t("errors.generic"));
              break;
          }
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [showDialog, t]);

  useEffect(() => {
    (async () => {
      if (!isLoading) {
        await SplashScreen.hideAsync();
      }
    })();
  }, [isLoading]);

  if (isLoading) {
    return null;
  }

  if (errorText) {
    return (
      <ScrollView
        contentContainerStyle={[
          styles.errorContainer,
          {
            paddingTop: top + SCREEN_SPACING,
            paddingBottom: bottom + SCREEN_SPACING,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="bodyLarge" style={styles.errorText}>
          {errorText}
        </Text>
      </ScrollView>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator
        screenOptions={{
          header: (props) => <TopNavigationBar {...props} />,
          headerShown: false,
          cardStyle: { backgroundColor: theme.colors.background },
        }}
      >
        {user ? (
          <>
            {!user.emailVerified && (
              <>
                <RootStack.Screen
                  name="VerifyEmail"
                  component={Screens.VerifyEmailScreen}
                  options={{
                    header: (props) => (
                      <TopNavigationBar {...props} showLogout />
                    ),
                    headerTitle: t("screens.verifyEmail.screenTitle"),
                    headerShown: true,
                  }}
                />
                <RootStack.Screen
                  name="ProfileSetup"
                  component={Screens.ProfileSetupScreen}
                  options={{
                    header: (props) => (
                      <TopNavigationBar {...props} showLogout />
                    ),
                    headerTitle: t("screens.profileSetup.screenTitle"),
                    headerShown: true,
                  }}
                />
              </>
            )}
            {user.emailVerified && !user.hasProfile && (
              <RootStack.Screen
                name="ProfileSetup"
                component={Screens.ProfileSetupScreen}
                options={{
                  header: (props) => <TopNavigationBar {...props} showLogout />,
                  headerTitle: t("screens.profileSetup.screenTitle"),
                  headerShown: true,
                }}
              />
            )}
            <RootStack.Screen name="Home" component={HomeTabNavigator} />
            <RootStack.Screen
              name="EditProfile"
              component={Screens.EditProfileScreen}
              options={{
                headerTitle: t("screens.editProfile.screenTitle"),
                headerShown: true,
              }}
            />
            <RootStack.Screen
              name="Account"
              component={Screens.AccountScreen}
              options={{
                headerTitle: t("screens.account.screenTitle"),
                headerShown: true,
              }}
            />
            <RootStack.Screen
              name="ChangeEmail"
              component={Screens.ChangeEmailScreen}
              options={{
                headerTitle: t("screens.changeEmail.screenTitle"),
                headerShown: true,
              }}
            />
            <RootStack.Screen
              name="ChangePassword"
              component={Screens.ChangePasswordScreen}
              options={{
                headerTitle: t("screens.changePassword.screenTitle"),
                headerShown: true,
              }}
            />
            <RootStack.Screen
              name="Followers"
              component={Screens.FollowersScreen}
              options={{
                headerTitle: t("screens.followers.screenTitle"),
                headerShown: true,
              }}
            />
            <RootStack.Screen
              name="Following"
              component={Screens.FollowingScreen}
              options={{
                headerTitle: t("screens.following.screenTitle"),
                headerShown: true,
              }}
            />
            <RootStack.Screen
              name="ViewProfile"
              component={Screens.ViewProfileScreen}
              options={{
                headerTitle: t("screens.viewProfile.screenTitle"),
                headerShown: true,
              }}
            />
            <RootStack.Screen
              name="Filters"
              component={Screens.FiltersScreen}
              options={{
                headerTitle: t("screens.filters.screenTitle"),
                headerShown: true,
              }}
            />
            <RootStack.Screen
              name="AddActivity"
              component={Screens.AddActivityScreen}
              options={{
                headerTitle: t("screens.addActivity.screenTitle"),
                headerShown: true,
              }}
            />
            <RootStack.Screen
              name="ViewActivity"
              component={Screens.ViewActivity}
              options={{
                headerTitle: t("screens.viewActivity.screenTitle"),
                headerShown: true,
              }}
            />
            <RootStack.Screen
              name="ViewParticipants"
              component={Screens.ViewParticipants}
              options={{
                headerTitle: t("screens.viewParticipants.screenTitle"),
                headerShown: true,
              }}
            />
            <RootStack.Screen
              name="Messages"
              component={Screens.MessagesScreen}
              options={{
                headerTitle: t("screens.messages.screenTitle"),
                headerShown: true,
              }}
            />
          </>
        ) : (
          <>
            <RootStack.Screen name="Login" component={Screens.LoginScreen} />
            <RootStack.Screen
              name="SignUp"
              component={Screens.SignUpScreen}
              options={{
                headerTitle: t("screens.signUp.screenTitle"),
                headerShown: true,
              }}
            />
            <RootStack.Screen
              name="ResetPassword"
              component={Screens.ResetPasswordScreen}
              options={{
                headerTitle: t("screens.resetPassword.screenTitle"),
                headerShown: true,
              }}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
});

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SCREEN_SPACING,
  },
  errorText: {
    textAlign: "center",
  },
});
