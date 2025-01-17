import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type {
  CompositeScreenProps,
  NavigatorScreenParams,
} from "@react-navigation/native";
import type { StackScreenProps } from "@react-navigation/stack";

export type RootStackParamList = {
  Home: NavigatorScreenParams<HomeTabParamList>;
  Login: undefined;
  SignUp: undefined;
  ResetPassword: undefined;
  VerifyEmail: undefined;
  ProfileSetup: undefined;
  EditProfile: undefined;
  Account: undefined;
  ChangeEmail: undefined;
  ChangePassword: undefined;
  Followers: { userId: string };
  Following: { userId: string };
  ViewProfile: { userId: string };
  Filters: undefined;
  AddActivity: undefined;
  ViewActivity: { activityId: string };
  ViewParticipants: { activityId: string; organizerId: string };
  Messages: { chatId?: string; userIds: string[] };
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  StackScreenProps<RootStackParamList, T>;

export type HomeTabParamList = {
  Activities: undefined;
  People: undefined;
  Chats: undefined;
  Profile: undefined;
};

export type HomeTabScreenProps<T extends keyof HomeTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<HomeTabParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
