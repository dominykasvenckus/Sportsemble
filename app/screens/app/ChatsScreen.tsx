import { ChatList } from "@components";
import { useMessageDialogContext } from "@contexts";
import { ChatData, UserData } from "@types";
import {
  collection,
  documentId,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { auth, firestore } from "firebaseConfig";
import { memo, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default memo(() => {
  const { top } = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();
  const { showDialog } = useMessageDialogContext();

  const [chats, setChats] = useState<ChatData[] | null>(null);
  const [recipients, setRecipients] = useState<UserData[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(firestore, "chats"),
      where("userIds", "array-contains", auth.currentUser.uid),
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const chats = querySnapshot.docs.map(
          (doc) => ({ chatId: doc.id, ...doc.data() }) as ChatData,
        );
        setChats(chats);
      },
      (error) => {
        if (error.code !== "permission-denied") {
          showDialog(t("errors.generic"));
        }
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [showDialog, t]);

  useEffect(() => {
    if (!chats) {
      return;
    }

    if (!auth.currentUser) {
      setIsLoading(false);
      return;
    }

    const recipientIds = chats.reduce<string[]>((acc, chat) => {
      acc.push(
        chat.userIds[0] === auth.currentUser!.uid
          ? chat.userIds[1]
          : chat.userIds[0],
      );
      return acc;
    }, []);

    if (recipientIds.length === 0) {
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(firestore, "users"),
      where(documentId(), "in", recipientIds),
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const recipients = querySnapshot.docs.map(
          (doc) =>
            ({
              userId: doc.id,
              ...doc.data(),
            }) as UserData,
        );
        setRecipients(recipients);
        setIsLoading(false);
      },
      (error) => {
        if (error.code !== "permission-denied") {
          showDialog(t("errors.generic"));
        }
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [chats, showDialog, t]);

  const data:
    | (ChatData & {
        recipient: UserData;
        lastMessageSummary: string;
      })[]
    | null
    | undefined = useMemo(() => {
    if (isLoading) {
      return;
    }

    if (!auth.currentUser || !chats || !recipients) {
      return null;
    }

    const data = chats
      .reduce<
        (ChatData & {
          recipient: UserData;
          lastMessageSummary: string;
        })[]
      >((acc, chat) => {
        const recipientIndex = recipients.findIndex(
          (user) =>
            user.userId ===
            (chat.userIds[0] === auth.currentUser!.uid
              ? chat.userIds[1]
              : chat.userIds[0]),
        );

        if (recipientIndex === -1) {
          return acc;
        }

        let lastMessageSummary = "";
        const currentMilliseconds = Date.now();

        if (chat.lastMessage.createdAt) {
          const createdAt = new Date(chat.lastMessage.createdAt);

          if (currentMilliseconds - createdAt.getTime() < 24 * 60 * 60 * 1000) {
            lastMessageSummary +=
              createdAt.toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "numeric",
              }) + " · ";
          } else if (
            currentMilliseconds - createdAt.getTime() <
            24 * 60 * 60 * 1000 * 365.25
          ) {
            lastMessageSummary +=
              createdAt.toLocaleDateString(undefined, {
                month: "numeric",
                day: "numeric",
              }) + " · ";
          } else {
            lastMessageSummary += createdAt.toLocaleDateString() + " · ";
          }

          if (chat.lastMessage.author.id === auth.currentUser!.uid) {
            lastMessageSummary += `${t("screens.chats.you")}: `;
          }

          lastMessageSummary += chat.lastMessage.text;
        }

        acc.push({
          ...chat,
          recipient: recipients[recipientIndex],
          lastMessageSummary,
        });

        return acc;
      }, [])
      .sort((a, b) => {
        const aCreatedAt = a.lastMessage.createdAt || 0;
        const bCreatedAt = b.lastMessage.createdAt || 0;
        return bCreatedAt - aCreatedAt;
      });

    return data;
  }, [chats, isLoading, recipients, t]);

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      {data !== undefined ? (
        <ChatList data={data} />
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
