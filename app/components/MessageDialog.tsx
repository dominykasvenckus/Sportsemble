import { memo } from "react";
import { Button, Dialog, Portal, Text } from "react-native-paper";

type MessageDialogProps = {
  text: string;
  buttonTitle: string;
  visible: boolean;
  onClose: () => void;
};

export default memo(
  ({ text, buttonTitle, visible, onClose }: MessageDialogProps) => {
    return (
      <Portal>
        <Dialog visible={visible} onDismiss={onClose}>
          <Dialog.Content>
            <Text variant="bodyMedium">{text}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={onClose}>{buttonTitle}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    );
  },
);
