import { defaultProfile } from "@assets";
import { StackHeaderProps } from "@react-navigation/stack";
import { UserData } from "@types";
import { memo, useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Appbar, Avatar, Text } from "react-native-paper";

export default memo(
  ({
    navigation,
    back,
    userId,
    profileUrl,
    fullName,
  }: StackHeaderProps & UserData) => {
    const handleTitlePress = useCallback(() => {
      navigation.push("ViewProfile", { userId });
    }, [navigation, userId]);

    return (
      <Appbar.Header>
        {back && <Appbar.BackAction onPress={navigation.goBack} />}
        <Appbar.Content
          title={
            <View>
              <Pressable
                style={({ pressed }) => [
                  styles.titleInnerContainer,
                  pressed && styles.titleInnerContainerPressed,
                ]}
                onPress={handleTitlePress}
              >
                <Avatar.Image
                  size={42}
                  source={profileUrl ? { uri: profileUrl } : defaultProfile}
                />
                <Text
                  variant="bodyLarge"
                  numberOfLines={1}
                  style={styles.recipientFullNameText}
                >
                  {fullName}
                </Text>
              </Pressable>
            </View>
          }
        />
      </Appbar.Header>
    );
  },
);

const styles = StyleSheet.create({
  titleInnerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  titleInnerContainerPressed: {
    opacity: 0.6,
  },
  recipientFullNameText: {
    flexShrink: 1,
  },
});
