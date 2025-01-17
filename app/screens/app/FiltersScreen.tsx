import { SCREEN_SPACING } from "@constants";
import { useFiltersContext } from "@contexts";
import Slider from "@react-native-community/slider";
import { RootStackScreenProps } from "@types";
import { memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Button, Text, useTheme } from "react-native-paper";
import { PaperSelect } from "react-native-paper-select";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default memo(({ navigation }: RootStackScreenProps<"Filters">) => {
  const { bottom } = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();
  const {
    sportsFilter,
    radiusFilter,
    updateSportsFilter,
    updateRadiusFilter,
    clearFilters,
  } = useFiltersContext();

  const [sports, setSports] = useState(sportsFilter!);
  const [radius, setRadius] = useState(radiusFilter!);

  const handleSportsSelect = useCallback((value: any) => {
    setSports((prev) => ({
      ...prev,
      value: value.text,
      selectedList: value.selectedList,
      error: "",
    }));
  }, []);

  const handleRadiusChange = useCallback((value: number) => {
    setRadius(value);
  }, []);

  const handleClearPress = useCallback(async () => {
    await clearFilters();
    navigation.navigate("Home", { screen: "Activities" });
  }, [clearFilters, navigation]);

  const handleApplyPress = useCallback(async () => {
    if (sports.selectedList.length > 0) {
      await updateSportsFilter(sports);
    }
    await updateRadiusFilter(radius);
    navigation.navigate("Home", { screen: "Activities" });
  }, [navigation, radius, sports, updateRadiusFilter, updateSportsFilter]);

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
        label={t("labels.sports")}
        selectAllText={t("labels.selectAll")}
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
        value={sports.value}
        onSelection={handleSportsSelect}
        arrayList={[...sports.list]}
        selectedArrayList={sports.selectedList}
        errorText={sports.error}
        multiEnable
      />
      <View style={styles.sliderContainer}>
        <View style={styles.radiusTextContainer}>
          <Text variant="bodyMedium">{t("labels.radius")}</Text>
          <Text variant="bodyMedium">
            {radius !== 105 ? `${radius} km` : t("screens.filters.unlimited")}
          </Text>
        </View>
        <View style={styles.sliderRow}>
          <Slider
            style={styles.slider}
            minimumTrackTintColor={theme.colors.primary}
            thumbTintColor={theme.colors.primary}
            minimumValue={5}
            maximumValue={105}
            step={5}
            onValueChange={handleRadiusChange}
            value={radius}
          />
        </View>
      </View>
      <View style={styles.buttonsContainer}>
        <Button
          mode="outlined"
          style={styles.button}
          onPress={handleClearPress}
        >
          {t("buttons.clear")}
        </Button>
        <Button
          mode="contained"
          style={[styles.button, styles.applyButton]}
          onPress={handleApplyPress}
        >
          {t("buttons.apply")}
        </Button>
      </View>
    </KeyboardAwareScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: SCREEN_SPACING,
    paddingHorizontal: SCREEN_SPACING,
  },
  selectTextInput: {
    alignSelf: "center",
    maxWidth: 500,
    width: "100%",
    marginBottom: 20,
    textAlign: "auto",
  },
  selectSearchBar: {
    backgroundColor: "#ececec",
    borderWidth: 0,
  },
  sliderContainer: {
    maxWidth: 500,
    width: "100%",
    marginBottom: 40,
  },
  radiusTextContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    marginHorizontal: 8,
  },
  sliderRow: {
    flexDirection: "row",
    gap: 2,
  },
  slider: {
    flex: 1,
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: 15,
    maxWidth: 500,
  },
  button: {
    flex: 1,
  },
  applyButton: {
    justifyContent: "center",
  },
});
