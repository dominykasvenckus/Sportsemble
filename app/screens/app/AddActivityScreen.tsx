import { marker } from "@assets";
import { SCREEN_SPACING } from "@constants";
import { useMessageDialogContext } from "@contexts";
import {
  getAllLocalizedLevelsWithIds,
  getAllLocalizedSportsWithIds,
} from "@functions";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { RootStackScreenProps } from "@types";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  updateDoc,
} from "firebase/firestore";
import { auth, firestore } from "firebaseConfig";
import { memo, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import Geocoder from "react-native-geocoding";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import MapView, { LatLng, PROVIDER_GOOGLE, Region } from "react-native-maps";
import {
  Button,
  HelperText,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { PaperSelect } from "react-native-paper-select";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type GeocoderError = {
  code: number;
  message: string;
  origin: {
    results: any[];
    status: string;
  };
};

export default memo(({ navigation }: RootStackScreenProps<"AddActivity">) => {
  const { bottom } = useSafeAreaInsets();
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const { showDialog } = useMessageDialogContext();

  const currentDate = new Date();

  const [sport, setSport] = useState({
    value: "",
    list: getAllLocalizedSportsWithIds(),
    selectedList: [],
    error: "",
  });
  const [level, setLevel] = useState({
    value: "",
    list: getAllLocalizedLevelsWithIds(),
    selectedList: [],
    error: "",
  });
  const [dateTimePicker, setDateTimePicker] = useState<{
    isShown: boolean;
    mode: "countdown" | "date" | "datetime" | "time";
    inputIdentifier: string;
  }>({
    isShown: false,
    mode: "date",
    inputIdentifier: "",
  });
  const [dateValues, setDateValues] = useState({
    startDate: { date: currentDate, isEdited: false },
    endDate: { date: currentDate, isEdited: false },
  });
  const [textInputValues, setTextInputValues] = useState({
    address: "",
    spotCount: "",
    pricePerPerson: "",
    additionalDetails: "",
  });
  const [coordinates, setCoordinates] = useState<LatLng | null>(null);
  const [isMapShown, setIsMapShown] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSportSelect = useCallback((value: any) => {
    setSport((prev) => ({
      ...prev,
      value: value.text,
      selectedList: value.selectedList,
      error: "",
    }));
  }, []);

  const handleLevelSelect = useCallback((value: any) => {
    setLevel((prev) => ({
      ...prev,
      value: value.text,
      selectedList: value.selectedList,
      error: "",
    }));
  }, []);

  const showStartDatePicker = useCallback(() => {
    setDateTimePicker({
      isShown: true,
      mode: "date",
      inputIdentifier: "startDate",
    });
  }, []);

  const showEndDatePicker = useCallback(() => {
    setDateTimePicker({
      isShown: true,
      mode: "date",
      inputIdentifier: "endDate",
    });
  }, []);

  const showStartTimePicker = useCallback(() => {
    setDateTimePicker({
      isShown: true,
      mode: "time",
      inputIdentifier: "startDate",
    });
  }, []);

  const showEndTimePicker = useCallback(() => {
    setDateTimePicker({
      isShown: true,
      mode: "time",
      inputIdentifier: "endDate",
    });
  }, []);

  const handleDateTimeChange = useCallback(
    (inputIdentifier: string) => (event: DateTimePickerEvent, date?: Date) => {
      if (event.type === "set") {
        if (Platform.OS === "android") {
          setDateTimePicker((prev) => ({
            ...prev,
            isShown: false,
          }));
        }
        setDateValues((prev) => ({
          ...prev,
          [inputIdentifier]: { date, isEdited: true },
        }));
      } else if (event.type === "dismissed") {
        setDateTimePicker((prev) => ({
          ...prev,
          isShown: false,
        }));
      }
    },
    [],
  );

  const handleTextInputChangeText = useCallback(
    (inputIdentifier: string) => (text: string) => {
      setTextInputValues((prev) => {
        return {
          ...prev,
          [inputIdentifier]: text,
        };
      });
    },
    [],
  );

  const affixProp = useMemo(() => {
    return i18n.language === "en"
      ? { left: <TextInput.Affix text="€" /> }
      : { right: <TextInput.Affix text="€" /> };
  }, [i18n.language]);

  const geocode = useCallback(
    async (address: string) => {
      try {
        const location = await Geocoder.from(address);
        return {
          address: location.results[0].formatted_address,
          latitude: location.results[0].geometry.location.lat,
          longitude: location.results[0].geometry.location.lng,
        };
      } catch (error) {
        const geocoderError = error as GeocoderError;
        if (geocoderError.code === 4) {
          showDialog(t("errors.invalidAddress"));
        } else {
          showDialog(t("errors.generic"));
        }
        return null;
      }
    },
    [showDialog, t],
  );

  const reverseGeocode = useCallback(
    async (latitude: number, longitude: number) => {
      try {
        const addressComponent = await Geocoder.from(latitude, longitude);
        return addressComponent.results[0].formatted_address;
      } catch {
        showDialog(t("errors.generic"));
        return null;
      }
    },
    [showDialog, t],
  );

  const handleMarkerPress = useCallback(async () => {
    Keyboard.dismiss();

    const result = await geocode(textInputValues.address);

    if (result) {
      setTextInputValues((prev) => ({
        ...prev,
        address: result.address,
      }));
      setCoordinates({
        latitude: result.latitude,
        longitude: result.longitude,
      });
      setIsMapShown(true);
    }
  }, [geocode, textInputValues.address]);

  const handleRegionChangeComplete = useCallback(
    async (region: Region) => {
      setCoordinates({
        latitude: region.latitude,
        longitude: region.longitude,
      });

      const address = await reverseGeocode(region.latitude, region.longitude);

      if (address) {
        setTextInputValues((prev) => ({
          ...prev,
          address,
        }));
      }
    },
    [reverseGeocode],
  );

  const validate = useCallback(() => {
    const errors: Record<string, string> = {};

    if (!sport.selectedList[0]) {
      errors.sport = t("errors.sportNotSelected");
      showDialog(t("errors.sportNotSelected"));
    }

    if (dateValues.startDate.date <= new Date()) {
      errors.startDate = t("errors.startDateAndTimeNotInFuture");
    }

    if (dateValues.endDate.isEdited && dateValues.endDate.date <= new Date()) {
      errors.endDate = t("errors.endDateAndTimeNotInFuture");
    }

    if (
      dateValues.endDate.isEdited &&
      dateValues.endDate.date <= dateValues.startDate.date
    ) {
      errors.endDate = t("errors.endDateAndTimeNotAfterStartDateAndTime");
    }

    if (!textInputValues.address) {
      errors.address = t("errors.addressNotEntered");
    }

    if (!sport.selectedList[0] && !level.selectedList[0]) {
      errors.level = t("errors.levelNotSelected");
    } else if (sport.selectedList[0] && !level.selectedList[0]) {
      errors.level = t("errors.levelNotSelected");
      showDialog(t("errors.levelNotSelected"));
    }

    if (!textInputValues.spotCount) {
      errors.spotCount = t("errors.spotCountNotEntered");
    } else if (isNaN(Number(textInputValues.spotCount))) {
      errors.spotCount = t("errors.invalidSpotCount");
    } else if (!Number.isInteger(Number(textInputValues.spotCount))) {
      errors.spotCount = t("errors.invalidSpotCount");
    } else if (Number(textInputValues.spotCount) <= 1) {
      errors.spotCount = t("errors.spotCountTooLow");
    }

    if (textInputValues.pricePerPerson) {
      if (isNaN(Number(textInputValues.pricePerPerson))) {
        errors.pricePerPerson = t("errors.invalidPricePerPerson");
      } else if (Number(textInputValues.pricePerPerson) < 0) {
        errors.pricePerPerson = t("errors.pricePerPersonNotPositive");
      }
    }

    setErrors(errors);

    return Object.keys(errors)?.length === 0;
  }, [
    sport.selectedList,
    dateValues.startDate.date,
    dateValues.endDate.isEdited,
    dateValues.endDate.date,
    textInputValues.address,
    textInputValues.spotCount,
    textInputValues.pricePerPerson,
    level.selectedList,
    t,
    showDialog,
  ]);

  const saveData = useCallback(
    async (address: string, latitude: number, longitude: number) => {
      if (!auth.currentUser) {
        return;
      }

      const { id } = await addDoc(collection(firestore, "activities"), {
        sport: sport.selectedList[0]["_id"],
        startDate: dateValues.startDate.date.toISOString(),
        ...(dateValues.endDate.isEdited && {
          endDate: dateValues.endDate.date.toISOString(),
        }),
        location: {
          address,
          latitude,
          longitude,
        },
        level: level.selectedList[0]["_id"],
        spotCount: Number(textInputValues.spotCount),
        pricePerPerson: textInputValues.pricePerPerson
          ? Number(textInputValues.pricePerPerson)
          : 0,
        ...(textInputValues.additionalDetails && {
          additionalDetails: textInputValues.additionalDetails,
        }),
        organizerId: auth.currentUser.uid,
        isCanceled: false,
      });

      await updateDoc(doc(firestore, "users", auth.currentUser.uid), {
        activityIds: arrayUnion(id),
      });
    },
    [
      sport.selectedList,
      dateValues.startDate.date,
      dateValues.endDate.isEdited,
      dateValues.endDate.date,
      level.selectedList,
      textInputValues.spotCount,
      textInputValues.pricePerPerson,
      textInputValues.additionalDetails,
    ],
  );

  const handleAddPress = useCallback(async () => {
    Keyboard.dismiss();

    if (!validate()) {
      return;
    }

    let finalLocation: {
      address: string;
      latitude: number;
      longitude: number;
    } | null = null;

    if (!coordinates) {
      const result = await geocode(textInputValues.address);

      if (result) {
        finalLocation = {
          address: result.address,
          latitude: result.latitude,
          longitude: result.longitude,
        };
      }
    } else {
      finalLocation = {
        address: textInputValues.address,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      };
    }

    if (finalLocation) {
      try {
        await saveData(
          finalLocation.address,
          finalLocation.latitude,
          finalLocation.longitude,
        );
        navigation.navigate("Home", { screen: "Activities" });
        showDialog(t("success.activityAdded"));
      } catch {
        showDialog(t("errors.generic"));
      }
    }
  }, [
    validate,
    coordinates,
    geocode,
    textInputValues.address,
    saveData,
    navigation,
    showDialog,
    t,
  ]);

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={[
        styles.container,
        { paddingBottom: bottom + SCREEN_SPACING },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <PaperSelect
        label={`${t("labels.sport")}*`}
        dialogCloseButtonText={t("buttons.cancel").toUpperCase()}
        dialogDoneButtonText={t("buttons.ok")}
        textInputMode="outlined"
        textInputStyle={styles.selectTextInput}
        textInputProps={{
          outlineColor: theme.colors.outline,
          activeOutlineColor: theme.colors.primary,
        }}
        searchStyle={styles.selectSearchBar}
        checkboxProps={{
          checkboxColor: theme.colors.primary,
        }}
        value={sport.value}
        onSelection={handleSportSelect}
        arrayList={[...sport.list]}
        selectedArrayList={sport.selectedList}
        errorText={sport.error}
        multiEnable={false}
      />
      <View style={styles.multipleInputsRowContainer}>
        <View style={styles.multipleInputsRowInputContainer}>
          <Pressable
            style={[
              styles.dateInputContainer,
              errors.startDate ? styles.dateInputContainerError : null,
            ]}
            onPress={showStartDatePicker}
          >
            <View pointerEvents="none">
              <TextInput
                label={`${t("labels.startDate")}*`}
                mode="outlined"
                style={styles.dateTextInput}
                autoCapitalize="none"
                autoCorrect={false}
                value={dateValues.startDate.date.toLocaleDateString()}
                editable={false}
                error={!!errors.startDate}
              />
            </View>
          </Pressable>
        </View>
        <View style={styles.multipleInputsRowInputContainer}>
          <Pressable
            style={[
              styles.dateInputContainer,
              errors.startDate ? styles.dateInputContainerError : null,
            ]}
            onPress={showStartTimePicker}
          >
            <View pointerEvents="none">
              <TextInput
                label={`${t("labels.startTime")}*`}
                mode="outlined"
                style={styles.dateTextInput}
                autoCapitalize="none"
                autoCorrect={false}
                value={dateValues.startDate.date.toLocaleTimeString(undefined, {
                  hour: "numeric",
                  minute: "numeric",
                })}
                editable={false}
                error={!!errors.startDate}
              />
            </View>
          </Pressable>
        </View>
      </View>
      {errors.startDate && (
        <HelperText type="error" style={styles.helperText}>
          {errors.startDate}
        </HelperText>
      )}
      <View style={styles.multipleInputsRowContainer}>
        <View style={styles.multipleInputsRowInputContainer}>
          <Pressable
            style={[
              styles.dateInputContainer,
              errors.endDate ? styles.dateInputContainerError : null,
            ]}
            onPress={showEndDatePicker}
          >
            <View pointerEvents="none">
              <TextInput
                label={t("labels.endDate")}
                mode="outlined"
                style={styles.dateTextInput}
                autoCapitalize="none"
                autoCorrect={false}
                value={
                  dateValues.endDate.isEdited
                    ? dateValues.endDate.date.toLocaleDateString()
                    : undefined
                }
                editable={false}
                error={!!errors.endDate}
              />
            </View>
          </Pressable>
        </View>
        <View style={styles.multipleInputsRowInputContainer}>
          <Pressable
            style={[
              styles.dateInputContainer,
              errors.endDate ? styles.dateInputContainerError : null,
            ]}
            onPress={showEndTimePicker}
          >
            <View pointerEvents="none">
              <TextInput
                label={t("labels.endTime")}
                mode="outlined"
                style={styles.dateTextInput}
                autoCapitalize="none"
                autoCorrect={false}
                value={
                  dateValues.endDate.isEdited
                    ? dateValues.endDate.date.toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "numeric",
                      })
                    : undefined
                }
                editable={false}
                error={!!errors.endDate}
              />
            </View>
          </Pressable>
        </View>
      </View>
      {errors.endDate && (
        <HelperText type="error" style={styles.helperText}>
          {errors.endDate}
        </HelperText>
      )}
      <TextInput
        label={`${t("labels.address")}*`}
        mode="outlined"
        style={[
          styles.textInput,
          errors.address ? styles.textInputError : null,
        ]}
        autoCorrect={false}
        onChangeText={handleTextInputChangeText("address")}
        value={textInputValues.address}
        error={!!errors.address}
        right={
          <TextInput.Icon
            icon="map-marker"
            onPress={handleMarkerPress}
            forceTextInputFocus={false}
          />
        }
      />
      {errors.address && (
        <HelperText type="error" style={styles.helperText}>
          {errors.address}
        </HelperText>
      )}
      {isMapShown && coordinates && (
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
              latitude: coordinates.latitude,
              longitude: coordinates.longitude,
            }}
            onRegionChangeComplete={handleRegionChangeComplete}
          />
          <View style={styles.markerContainer}>
            <Image style={styles.marker} source={marker} />
          </View>
          <Text variant="bodyMedium" style={[styles.text, styles.mapText]}>
            {t("screens.addActivity.mapText")}
          </Text>
        </View>
      )}
      <PaperSelect
        label={`${t("labels.level")}*`}
        dialogCloseButtonText={t("buttons.cancel").toUpperCase()}
        dialogDoneButtonText={t("buttons.ok")}
        textInputMode="outlined"
        textInputStyle={styles.selectTextInput}
        textInputProps={{
          outlineColor: theme.colors.outline,
          activeOutlineColor: theme.colors.primary,
        }}
        searchStyle={styles.selectSearchBar}
        checkboxProps={{
          checkboxColor: theme.colors.primary,
        }}
        value={level.value}
        onSelection={handleLevelSelect}
        arrayList={[...level.list]}
        selectedArrayList={level.selectedList}
        errorText={level.error}
        multiEnable={false}
      />
      <View style={styles.multipleInputsRowContainer}>
        <View style={styles.multipleInputsRowInputContainer}>
          <TextInput
            label={`${t("labels.spotCount")}*`}
            mode="outlined"
            style={[
              styles.multipleInputsRowTextInput,
              errors.spotCount || errors.pricePerPerson
                ? styles.multipleInputsRowTextInputError
                : null,
            ]}
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={handleTextInputChangeText("spotCount")}
            value={textInputValues.spotCount}
            keyboardType="number-pad"
            error={!!errors.spotCount}
          />
          {errors.spotCount && (
            <HelperText type="error" style={styles.helperText}>
              {errors.spotCount}
            </HelperText>
          )}
        </View>
        <View style={styles.multipleInputsRowInputContainer}>
          <TextInput
            label={t("labels.pricePerPerson")}
            mode="outlined"
            style={[
              styles.multipleInputsRowTextInput,
              errors.pricePerPerson || errors.spotCount
                ? styles.multipleInputsRowTextInputError
                : null,
            ]}
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={handleTextInputChangeText("pricePerPerson")}
            value={textInputValues.pricePerPerson}
            keyboardType="number-pad"
            error={!!errors.pricePerPerson}
            {...affixProp}
          />
          {errors.pricePerPerson && (
            <HelperText type="error" style={styles.helperText}>
              {errors.pricePerPerson}
            </HelperText>
          )}
        </View>
      </View>
      <TextInput
        label={t("labels.additionalDetails")}
        mode="outlined"
        style={styles.multilineTextInput}
        multiline
        maxLength={300}
        onChangeText={handleTextInputChangeText("additionalDetails")}
        value={textInputValues.additionalDetails}
      />
      <HelperText
        type="info"
        style={[styles.helperText, styles.characterCountText]}
      >
        {`${textInputValues.additionalDetails.length}/300`}
      </HelperText>
      <Button
        mode="contained"
        style={styles.addButton}
        onPress={handleAddPress}
      >
        {t("buttons.add")}
      </Button>
      {dateTimePicker.isShown && Platform.OS === "android" && (
        <DateTimePicker
          value={
            dateValues[
              dateTimePicker.inputIdentifier as keyof typeof dateValues
            ].date
          }
          mode={dateTimePicker.mode}
          display="spinner"
          onChange={handleDateTimeChange(dateTimePicker.inputIdentifier)}
        />
      )}
      {dateTimePicker.isShown && Platform.OS === "ios" && (
        <Modal
          animationType="slide"
          transparent
          visible={dateTimePicker.isShown}
        >
          <View style={styles.modalContainer}>
            <View style={styles.okButtonContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.okButton,
                  pressed && styles.okButtonPressed,
                ]}
                onPress={() => {
                  setDateTimePicker((prev) => ({ ...prev, isShown: false }));
                }}
              >
                <Text variant="bodyLarge">{t("buttons.ok")}</Text>
              </Pressable>
            </View>
            <DateTimePicker
              locale={i18n.language}
              style={styles.dateTimePicker}
              value={
                dateValues[
                  dateTimePicker.inputIdentifier as keyof typeof dateValues
                ].date
              }
              mode={dateTimePicker.mode}
              display="spinner"
              onChange={handleDateTimeChange(dateTimePicker.inputIdentifier)}
            />
          </View>
        </Modal>
      )}
    </KeyboardAwareScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    paddingTop: SCREEN_SPACING,
    paddingHorizontal: SCREEN_SPACING,
  },
  selectTextInput: {
    alignSelf: "center",
    maxWidth: 500,
    width: "100%",
    marginBottom: 10,
    textAlign: "auto",
  },
  selectSearchBar: {
    backgroundColor: "#ececec",
    borderWidth: 0,
  },
  dateInputContainer: {
    marginBottom: 20,
  },
  dateInputContainerError: {
    marginBottom: 0,
  },
  dateTextInput: {
    textAlign: "auto",
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
  multipleInputsRowContainer: {
    flexDirection: "row",
    gap: 20,
    maxWidth: 500,
  },
  multipleInputsRowInputContainer: {
    flex: 1,
  },
  multipleInputsRowTextInput: {
    marginBottom: 20,
    textAlign: "auto",
  },
  multipleInputsRowTextInputError: {
    marginBottom: 0,
  },
  multilineTextInput: {
    maxWidth: 500,
    width: "100%",
    minHeight: 110,
    maxHeight: 200,
    textAlign: "auto",
  },
  characterCountText: {
    maxWidth: 500,
    width: "100%",
    textAlign: "right",
  },
  addButton: {
    maxWidth: 500,
    width: "100%",
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  okButtonContainer: {
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  okButton: {
    marginTop: 15,
  },
  okButtonPressed: {
    opacity: 0.6,
  },
  dateTimePicker: {
    width: "100%",
    backgroundColor: "#ffffff",
  },
  mapContainer: {
    maxWidth: 500,
    width: "100%",
  },
  map: {
    height: 250,
    marginBottom: 10,
  },
  markerContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -72,
    marginLeft: -14.8125,
    pointerEvents: "none",
  },
  marker: {
    height: 48,
    width: undefined,
    aspectRatio: 0.6171875,
  },
  text: {
    textAlign: "center",
  },
  mapText: {
    marginBottom: 20,
  },
});
