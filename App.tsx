import "react-native-gesture-handler";
import "./app/utils/locales";
import {
  FiltersContextProvider,
  LocationContextProvider,
  MessageDialogContextProvider,
} from "@contexts";
import { StatusBar } from "expo-status-bar";
import Geocoder from "react-native-geocoding";
import { MD3LightTheme, PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import Navigator from "./app/Navigator";
import { LightTheme } from "./themes";

if (process.env.EXPO_PUBLIC_GEOCODING_API_KEY) {
  Geocoder.init(process.env.EXPO_PUBLIC_GEOCODING_API_KEY);
}

export default function App() {
  const theme = {
    ...MD3LightTheme,
    colors: LightTheme.colors,
  };

  return (
    <>
      <StatusBar style="dark" />
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <MessageDialogContextProvider>
            <LocationContextProvider>
              <FiltersContextProvider>
                <Navigator />
              </FiltersContextProvider>
            </LocationContextProvider>
          </MessageDialogContextProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </>
  );
}
