import { defaultProfile } from "@assets";
import { useMessageDialogContext } from "@contexts";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList, UserData } from "@types";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { auth, firestore, storage } from "firebaseConfig";
import { memo, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ImageURISource, Keyboard, StyleSheet, View } from "react-native";
import { Button, HelperText, TextInput } from "react-native-paper";
import { AvatarImageSource } from "react-native-paper/lib/typescript/components/Avatar/AvatarImage";

import AvatarMenuButton from "./AvatarMenuButton";

type ProfileFormProps = {
  mode: "edit" | "setup";
};

export default memo(({ mode }: ProfileFormProps) => {
  const { t } = useTranslation();
  const { showDialog } = useMessageDialogContext();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const [source, setSource] = useState<AvatarImageSource | null>(
    mode === "edit" ? null : defaultProfile,
  );
  const [textInputValues, setTextInputValues] = useState({
    fullName: "",
    aboutMe: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!auth.currentUser || mode === "setup") {
      return;
    }

    const unsubscribe = onSnapshot(
      doc(firestore, "users", auth.currentUser.uid),
      (doc) => {
        if (doc.exists()) {
          const user = { userId: doc.id, ...doc.data() } as UserData;
          setSource(
            user.profileUrl ? { uri: user.profileUrl } : defaultProfile,
          );
          setTextInputValues({
            fullName: user.fullName,
            aboutMe: user.aboutMe ? user.aboutMe : "",
          });
        }
      },
      () => showDialog(t("errors.generic")),
    );

    return () => unsubscribe();
  }, [mode, showDialog, t]);

  const updateSource = useCallback((source: AvatarImageSource) => {
    setSource(source);
  }, []);

  const handleTextInputChangeText = useCallback(
    (inputIdentifier: string) => (text: string) => {
      setTextInputValues((prev) => ({
        ...prev,
        [inputIdentifier]: text,
      }));
    },
    [],
  );

  const validate = useCallback(() => {
    const errors: Record<string, string> = {};

    if (!textInputValues.fullName) {
      errors.fullName = t("errors.fullNameNotEntered");
    }

    setErrors(errors);

    return Object.keys(errors)?.length === 0;
  }, [t, textInputValues.fullName]);

  const deleteProfileImage = useCallback(async () => {
    if (!auth.currentUser) {
      return;
    }

    const docSnap = await getDoc(doc(firestore, "users", auth.currentUser.uid));
    const user = docSnap.exists()
      ? ({ userId: docSnap.id, ...docSnap.data() } as UserData)
      : null;

    if (user?.profileUrl) {
      const storageRef = ref(storage, user.profileUrl);
      await deleteObject(storageRef);
    }
  }, []);

  const saveData = useCallback(async () => {
    if (!auth.currentUser) {
      return;
    }

    let profileUrl = "";

    if (mode === "edit" && source !== defaultProfile) {
      const uri = (source as ImageURISource).uri!;
      const isLocalFilePath = /^(file|data):/.test(uri);

      if (isLocalFilePath) {
        await deleteProfileImage();

        const fileExtension = uri.split(".").pop();
        const storageRef = ref(
          storage,
          `users/${
            auth.currentUser.uid
          }/${new Date().toISOString()}.${fileExtension}`,
        );
        const image = await fetch(uri);
        const bytes = await image.blob();
        await uploadBytes(storageRef, bytes);
        profileUrl = await getDownloadURL(storageRef);
      }
    }

    if (mode === "setup") {
      await deleteProfileImage();

      if (source !== defaultProfile) {
        const uri = (source as ImageURISource).uri!;
        const fileExtension = uri.split(".").pop();
        const storageRef = ref(
          storage,
          `users/${
            auth.currentUser.uid
          }/${new Date().toISOString()}.${fileExtension}`,
        );
        const image = await fetch(uri);
        const bytes = await image.blob();
        await uploadBytes(storageRef, bytes);
        profileUrl = await getDownloadURL(storageRef);
      }
    }

    await setDoc(
      doc(firestore, "users", auth.currentUser.uid),
      {
        ...(profileUrl && { profileUrl }),
        fullName: textInputValues.fullName,
        ...(textInputValues.aboutMe && {
          aboutMe: textInputValues.aboutMe,
        }),
      },
      { merge: true },
    );
  }, [
    mode,
    source,
    textInputValues.fullName,
    textInputValues.aboutMe,
    deleteProfileImage,
  ]);

  const handleSavePress = useCallback(async () => {
    Keyboard.dismiss();

    if (!validate()) {
      return;
    }

    try {
      await saveData();

      if (mode === "edit") {
        navigation.navigate("Home", { screen: "Profile" });
        showDialog(t("success.profileUpdated"));
      }

      if (mode === "setup") {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: "Home",
                state: {
                  routes: [{ name: "Activities" }],
                },
              },
            ],
          }),
        );
      }
    } catch {
      showDialog(t("errors.generic"));
    }
  }, [validate, saveData, mode, navigation, showDialog, t]);

  return (
    <View style={styles.container}>
      <View style={styles.avatarMenuButtonContainer}>
        {source && (
          <AvatarMenuButton
            avatarSize={130}
            source={source}
            iconSize={17}
            anchorPosition="bottom"
            updateSource={updateSource}
          />
        )}
      </View>
      <TextInput
        label={`${t("labels.fullName")}*`}
        mode="outlined"
        style={[
          styles.textInput,
          errors.fullName ? styles.textInputError : null,
        ]}
        autoCorrect={false}
        onChangeText={handleTextInputChangeText("fullName")}
        value={textInputValues.fullName}
        error={!!errors.fullName}
      />
      {errors.fullName && (
        <HelperText type="error" style={styles.helperText}>
          {errors.fullName}
        </HelperText>
      )}
      <TextInput
        label={t("labels.aboutMe")}
        mode="outlined"
        style={styles.multilineTextInput}
        multiline
        maxLength={500}
        onChangeText={handleTextInputChangeText("aboutMe")}
        value={textInputValues.aboutMe}
      />
      <HelperText
        type="info"
        style={[styles.helperText, styles.characterCountText]}
      >
        {`${textInputValues.aboutMe.length}/500`}
      </HelperText>
      <Button
        mode="contained"
        style={styles.saveButton}
        onPress={handleSavePress}
      >
        {t("buttons.save")}
      </Button>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  avatarMenuButtonContainer: {
    width: 130,
    height: 130,
    marginBottom: 20,
  },
  textInput: {
    maxWidth: 500,
    width: "100%",
    marginBottom: 20,
    textAlign: "auto",
  },
  textInputError: {
    marginBottom: 0,
  },
  helperText: {
    maxWidth: 500,
    width: "100%",
    marginBottom: 10,
  },
  multilineTextInput: {
    maxWidth: 500,
    width: "100%",
    minHeight: 110,
    maxHeight: 200,
  },
  characterCountText: {
    maxWidth: 500,
    width: "100%",
    textAlign: "right",
  },
  saveButton: {
    maxWidth: 500,
    width: "100%",
    marginTop: 10,
  },
});
