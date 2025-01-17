import {
  PermissionStatus,
  getCameraPermissionsAsync,
  getMediaLibraryPermissionsAsync,
  launchCameraAsync,
  launchImageLibraryAsync,
  requestCameraPermissionsAsync,
  requestMediaLibraryPermissionsAsync,
} from "expo-image-picker";
import { memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, Pressable, StyleSheet } from "react-native";
import { Avatar, IconButton, Menu } from "react-native-paper";
import { AvatarImageSource } from "react-native-paper/lib/typescript/components/Avatar/AvatarImage";

type AvatarMenuButtonProps = {
  avatarSize?: number;
  source: AvatarImageSource;
  iconSize?: number;
  anchorPosition?: "bottom" | "top";
  updateSource: (source: AvatarImageSource) => void;
};

export default memo(
  ({
    avatarSize,
    source,
    iconSize,
    anchorPosition,
    updateSource,
  }: AvatarMenuButtonProps) => {
    const { t } = useTranslation();

    const [isMenuShown, setIsMenuShown] = useState(false);

    const showMenu = useCallback(() => {
      Keyboard.dismiss();
      setIsMenuShown(true);
    }, []);

    const closeMenu = useCallback(() => {
      setIsMenuShown(false);
    }, []);

    const verifyCameraPermission = useCallback(async () => {
      const { status } = await getCameraPermissionsAsync();

      if (
        status === PermissionStatus.UNDETERMINED ||
        status === PermissionStatus.DENIED
      ) {
        const response = await requestCameraPermissionsAsync();
        return response.granted;
      }

      return true;
    }, []);

    const handleUseCameraPress = useCallback(async () => {
      closeMenu();

      const hasCameraPermission = await verifyCameraPermission();

      if (!hasCameraPermission) {
        return;
      }

      const image = await launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!image.canceled) {
        updateSource({ uri: image.assets[0].uri });
      }
    }, [closeMenu, updateSource, verifyCameraPermission]);

    const verifyMediaLibraryPermission = useCallback(async () => {
      const { status } = await getMediaLibraryPermissionsAsync();

      if (
        status === PermissionStatus.UNDETERMINED ||
        status === PermissionStatus.DENIED
      ) {
        const response = await requestMediaLibraryPermissionsAsync();
        return response.granted;
      }

      return true;
    }, []);

    const handleSelectFromPhotosPress = useCallback(async () => {
      closeMenu();

      const hasMediaLibraryPermission = await verifyMediaLibraryPermission();

      if (!hasMediaLibraryPermission) {
        return;
      }

      const image = await launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!image.canceled) {
        updateSource({ uri: image.assets[0].uri });
      }
    }, [closeMenu, updateSource, verifyMediaLibraryPermission]);

    return (
      <Menu
        visible={isMenuShown}
        onDismiss={closeMenu}
        anchor={
          <>
            <Pressable
              style={
                avatarSize
                  ? { borderRadius: avatarSize / 2 }
                  : { borderRadius: 32 }
              }
              onPress={showMenu}
            >
              <Avatar.Image size={avatarSize} source={source} />
            </Pressable>
            <IconButton
              icon="pencil"
              mode="contained-tonal"
              size={iconSize}
              style={styles.iconButton}
              onPress={showMenu}
            />
          </>
        }
        anchorPosition={anchorPosition}
      >
        <Menu.Item
          leadingIcon="camera"
          onPress={handleUseCameraPress}
          title={t("buttons.useCamera")}
        />
        <Menu.Item
          leadingIcon="file-image"
          onPress={handleSelectFromPhotosPress}
          title={t("buttons.selectFromPhotos")}
        />
      </Menu>
    );
  },
);

const styles = StyleSheet.create({
  iconButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
  },
});
