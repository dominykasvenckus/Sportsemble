import { MessagesTopNavigationBar } from "@components";
import { useMessageDialogContext } from "@contexts";
import { Chat, MessageType, defaultTheme } from "@flyerhq/react-native-chat-ui";
import { ChatData, RootStackScreenProps, UserData } from "@types";
import {
  DocumentReference,
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { auth, firestore } from "firebaseConfig";
import { memo, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";

export default memo(
  ({ navigation, route }: RootStackScreenProps<"Messages">) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const { showDialog } = useMessageDialogContext();

    const [chatId, setChatId] = useState(route.params.chatId);
    const [recipient, setRecipient] = useState<UserData | null>(null);
    const [sender, setSender] = useState<UserData | null>(null);
    const [messages, setMessages] = useState<MessageType.Text[] | null>(null);
    const [isRecipientLoading, setIsRecipientLoading] = useState(true);
    const [isSenderLoading, setIsSenderLoading] = useState(true);
    const [isMessageListLoading, setIsMessageListLoading] = useState(true);

    const { userIds } = route.params;

    useEffect(() => {
      if (!auth.currentUser) {
        setIsRecipientLoading(false);
        return;
      }

      const recipientId =
        auth.currentUser.uid === userIds[0] ? userIds[1] : userIds[0];

      const unsubscribe = onSnapshot(
        doc(firestore, "users", recipientId),
        (doc) => {
          if (doc.exists()) {
            setRecipient({ userId: doc.id, ...doc.data() } as UserData);
          }
          setIsRecipientLoading(false);
        },
        () => {
          showDialog(t("errors.generic"));
          setIsRecipientLoading(false);
        },
      );

      return () => unsubscribe();
    }, [showDialog, t, userIds]);

    useEffect(() => {
      if (!recipient) {
        return;
      }

      navigation.setOptions({
        header: (props) => (
          <MessagesTopNavigationBar {...props} {...recipient} />
        ),
      });
    }, [navigation, recipient]);

    useEffect(() => {
      if (!auth.currentUser) {
        setIsSenderLoading(false);
        return;
      }

      const senderId =
        auth.currentUser.uid === userIds[0] ? userIds[0] : userIds[1];

      const unsubscribe = onSnapshot(
        doc(firestore, "users", senderId),
        (doc) => {
          if (doc.exists()) {
            setSender({ userId: doc.id, ...doc.data() } as UserData);
          }
          setIsSenderLoading(false);
        },
        () => {
          showDialog(t("errors.generic"));
          setIsSenderLoading(false);
        },
      );

      return () => unsubscribe();
    }, [showDialog, t, userIds]);

    useEffect(() => {
      if (!recipient && isRecipientLoading) {
        return;
      }

      if (!recipient) {
        setIsMessageListLoading(false);
        return;
      }

      if (!chatId) {
        setMessages([]);
        setIsMessageListLoading(false);
        return;
      }

      const q = query(
        collection(firestore, "chats", chatId, "messages"),
        orderBy("createdAt", "desc"),
      );

      const unsubscribe = onSnapshot(
        q,
        async (querySnapshot) => {
          const chatRef = doc(firestore, "chats", chatId);
          let lastMessage: MessageType.Text | null = null;

          try {
            const docSnap = await getDoc(chatRef);

            if (docSnap.exists()) {
              const chat = docSnap.data() as ChatData;
              lastMessage = chat.lastMessage;
            }
          } catch {
            showDialog(t("errors.generic"));
          }

          if (!lastMessage) {
            return;
          }

          const batch = writeBatch(firestore);
          let shouldCommitBatch = false;

          const messages = querySnapshot.docs.map((doc) => {
            const message = { id: doc.id, ...doc.data() } as MessageType.Text;

            if (
              message.author.id === recipient.userId &&
              message.status === "sent"
            ) {
              if (message.id === lastMessage.id) {
                batch.update(chatRef, { "lastMessage.status": "seen" });
              }
              batch.update(doc.ref, { status: "seen" });
              shouldCommitBatch = true;
            }

            return message;
          });

          if (shouldCommitBatch) {
            try {
              await batch.commit();
            } catch {
              showDialog(t("errors.generic"));
            }
          }

          setMessages(messages);
          setIsMessageListLoading(false);
        },
        () => {
          showDialog(t("errors.generic"));
          setIsMessageListLoading(false);
        },
      );

      return () => unsubscribe();
    }, [chatId, isRecipientLoading, recipient, showDialog, t]);

    const handleSendPress = useCallback(
      async (message: MessageType.PartialText) => {
        if (!sender) {
          return;
        }

        try {
          let chatRef: DocumentReference | null = null;
          const newMessage = {
            author: { id: sender.userId },
            createdAt: Date.now(),
            text: message.text,
            type: "text",
            status: "sent",
          };

          if (!chatId) {
            chatRef = await addDoc(collection(firestore, "chats"), {
              lastMessage: newMessage,
              userIds,
            });
          } else {
            chatRef = doc(firestore, "chats", chatId);
            await updateDoc(chatRef, {
              lastMessage: newMessage,
            });
          }

          const chatMessagesDocRef = doc(collection(chatRef, "messages"));

          await updateDoc(chatRef, { "lastMessage.id": chatMessagesDocRef.id });
          await setDoc(chatMessagesDocRef, newMessage);

          setChatId(chatRef.id);
        } catch {
          showDialog(t("errors.generic"));
        }
      },
      [chatId, sender, showDialog, t, userIds],
    );

    const customDateHeaderText = useCallback((dateTime: number) => {
      const currentMilliseconds = Date.now();

      if (currentMilliseconds - dateTime < 24 * 60 * 60 * 1000) {
        return new Date(dateTime).toLocaleString(undefined, {
          hour: "numeric",
          minute: "numeric",
        });
      }

      return new Date(dateTime).toLocaleString(undefined, {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
      });
    }, []);

    return (
      <View style={styles.container}>
        {!isRecipientLoading && !isSenderLoading && !isMessageListLoading ? (
          recipient &&
          sender &&
          messages && (
            <Chat
              messages={messages}
              user={{ id: sender.userId }}
              onSendPress={handleSendPress}
              l10nOverride={{
                inputPlaceholder: t("screens.messages.message"),
                emptyChatPlaceholder: "",
              }}
              customDateHeaderText={customDateHeaderText}
              theme={{
                ...defaultTheme,
                colors: {
                  ...defaultTheme.colors,
                  primary: theme.colors.primary,
                  secondary: "#ececec",
                  inputBackground: "#ececec",
                  inputText: "#000000",
                },
              }}
            />
          )
        ) : (
          <View style={styles.activityIndicatorContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}
      </View>
    );
  },
);

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
