import { memo } from "react";
import { Button, Dialog, Portal, Text } from "react-native-paper";

type ConfirmationDialogProps = {
  text: string;
  positiveButtonTitle: string;
  negativeButtonTitle: string;
  visible: boolean;
  onPositiveButtonPress: () => void;
  onClose: () => void;
};

export default memo(
  ({
    text,
    positiveButtonTitle,
    negativeButtonTitle,
    visible,
    onPositiveButtonPress,
    onClose,
  }: ConfirmationDialogProps) => {
    return (
      <Portal>
        <Dialog visible={visible} onDismiss={onClose}>
          <Dialog.Content>
            <Text variant="bodyMedium">{text}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={onPositiveButtonPress}>
              {positiveButtonTitle}
            </Button>
            <Button onPress={onClose}>{negativeButtonTitle}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    );
  },
);
