import { defaultProfile } from "@assets";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList, UserData } from "@types";
import { auth } from "firebaseConfig";
import { Key, memo, useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { Avatar, List, Text, useTheme } from "react-native-paper";

type UserListProps = {
  id?: Key | null;
  style?: StyleProp<ViewStyle>;
  emptyListTextContainerStyle?: StyleProp<ViewStyle>;
  data: (UserData & { isOrganizer?: boolean })[] | null;
  onRefresh?: () => Promise<void>;
};

export default memo(
  ({
    id,
    style,
    emptyListTextContainerStyle,
    data,
    onRefresh,
  }: UserListProps) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

    const flatListRef = useRef<FlatList>(null);

    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = useCallback(async () => {
      if (onRefresh) {
        setIsRefreshing(true);
        await onRefresh();
        setIsRefreshing(false);
      }
    }, [onRefresh]);

    const handleEndReached = useCallback(() => {
      if (Platform.OS === "android" && data && data.length > 0) {
        flatListRef.current?.scrollToIndex({ index: data.length - 1 });
      }
    }, [data]);

    const handleListItemPress = useCallback(
      (item: UserData & { isOrganizer?: boolean }) => () => {
        navigation.push("ViewProfile", { userId: item.userId });
      },
      [navigation],
    );

    const renderItem = useCallback(
      ({ item }: { item: UserData & { isOrganizer?: boolean } }) => {
        return (
          <List.Item
            title={item.fullName}
            description={item.isOrganizer ? t("userList.organizer") : undefined}
            style={styles.listItem}
            left={() => (
              <Avatar.Image
                size={48}
                source={
                  item.profileUrl ? { uri: item.profileUrl } : defaultProfile
                }
                style={styles.listImage}
              />
            )}
            onPress={
              auth.currentUser && auth.currentUser.uid !== item.userId
                ? handleListItemPress(item)
                : undefined
            }
            unstable_pressDelay={100}
          />
        );
      },
      [handleListItemPress, t],
    );

    const keyExtractor = useCallback(
      (item: UserData & { isOrganizer?: boolean }) => item.userId,
      [],
    );

    return (
      <FlatList
        key={id}
        ref={flatListRef}
        style={style}
        contentContainerStyle={styles.flatListContentContainer}
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          ) : undefined
        }
        ListEmptyComponent={
          <View
            style={[styles.emptyListTextContainer, emptyListTextContainerStyle]}
          >
            <Text variant="bodyMedium">{t("userList.noUsersFound")}</Text>
          </View>
        }
        onEndReached={handleEndReached}
        onScrollToIndexFailed={() => {}}
        keyboardShouldPersistTaps="handled"
      />
    );
  },
);

const styles = StyleSheet.create({
  listItem: {
    height: 72,
    justifyContent: "center",
  },
  listImage: {
    marginLeft: 20,
  },
  flatListContentContainer: {
    flexGrow: 1,
  },
  emptyListTextContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
