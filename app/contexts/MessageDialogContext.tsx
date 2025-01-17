import MessageDialog from "app/components/MessageDialog";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

type MessageDialogContextType = {
  text: string;
  visible: boolean;
  showDialog: (text: string) => void;
  hideDialog: () => void;
};

const MessageDialogContext = createContext<MessageDialogContextType | null>(
  null,
);

export default function MessageDialogContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { t } = useTranslation();

  const [text, setText] = useState("");
  const [isShown, setIsShown] = useState(false);

  const showDialog = useCallback((text: string) => {
    setText(text);
    setIsShown(true);
  }, []);

  const hideDialog = useCallback(() => {
    setIsShown(false);
  }, []);

  const value = {
    text,
    visible: isShown,
    showDialog,
    hideDialog,
  };

  return (
    <MessageDialogContext.Provider value={value}>
      {children}
      <MessageDialog
        text={text}
        buttonTitle={t("buttons.ok")}
        visible={isShown}
        onClose={hideDialog}
      />
    </MessageDialogContext.Provider>
  );
}

export function useMessageDialogContext() {
  const context = useContext(MessageDialogContext);

  if (!context) {
    throw new Error(
      "useMessageDialogContext must be used within a MessageDialogContextProvider.",
    );
  }

  return context;
}
