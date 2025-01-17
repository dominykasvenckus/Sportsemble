import { defaultProfile } from "@assets";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { ChatData, RootStackParamList, UserData } from "@types";
import { auth } from "firebaseConfig";
import { Key, memo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { Avatar, List, Text, useTheme } from "react-native-paper";

type ChatsListProps = {
  id?: Key | null;
  style?: StyleProp<ViewStyle>;
  emptyListTextContainerStyle?: StyleProp<ViewStyle>;
  data:
    | (ChatData & {
        recipient: UserData;
        lastMessageSummary: string;
      })[]
    | null;
};

export default memo(
  ({ id, style, emptyListTextContainerStyle, data }: ChatsListProps) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

    const flatListRef = useRef<FlatList>(null);

    const handleEndReached = useCallback(() => {
      if (Platform.OS === "android" && data && data.length > 0) {
        flatListRef.current?.scrollToIndex({ index: data.length - 1 });
      }
    }, [data]);

    const handleListItemPress = useCallback(
      (
        item: ChatData & {
          recipient: UserData;
          lastMessageSummary: string;
        },
      ) =>
        () => {
          navigation.navigate("Messages", {
            chatId: item.chatId,
            userIds: item.userIds,
          });
        },
      [navigation],
    );

    const renderItem = useCallback(
      ({
        item,
      }: {
        item: ChatData & {
          recipient: UserData;
          lastMessageSummary: string;
        };
      }) => {
        return (
          <List.Item
            title={item.recipient.fullName}
            titleStyle={
              item.lastMessage.author.id !== auth.currentUser?.uid &&
              item.lastMessage.status === "sent" && [
                styles.boldText,
                {
                  color: theme.colors.primary,
                },
              ]
            }
            description={item.lastMessageSummary}
            descriptionNumberOfLines={1}
            descriptionStyle={
              item.lastMessage.author.id !== auth.currentUser?.uid &&
              item.lastMessage.status === "sent" && [
                styles.boldText,
                {
                  color: theme.colors.primary,
                },
              ]
            }
            style={styles.listItem}
            left={() => (
              <Avatar.Image
                size={48}
                source={
                  item.recipient.profileUrl
                    ? { uri: item.recipient.profileUrl }
                    : defaultProfile
                }
                style={styles.listImage}
              />
            )}
            onPress={handleListItemPress(item)}
            unstable_pressDelay={100}
          />
        );
      },
      [handleListItemPress, theme.colors.primary],
    );

    const keyExtractor = useCallback(
      (
        item: ChatData & {
          recipient: UserData;
          lastMessageSummary: string;
        },
      ) => item.chatId,
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
        ListEmptyComponent={
          <View
            style={[styles.emptyListTextContainer, emptyListTextContainerStyle]}
          >
            <Text variant="bodyMedium">{t("chatList.noChatsFound")}</Text>
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
  boldText: {
    fontWeight: "bold",
  },
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
