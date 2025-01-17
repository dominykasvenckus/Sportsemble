module.exports = {
  name: "Sportsemble",
  slug: "sportsemble",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./app/assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./app/assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./app/assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    permissions: [
      "android.permission.RECORD_AUDIO",
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.ACCESS_FINE_LOCATION",
    ],
    package: "com.dominykasvenckus.sportsemble",
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID,
      },
    },
  },
  web: {
    favicon: "./app/assets/favicon.png",
  },
  plugins: [
    [
      "expo-image-picker",
      {
        photosPermission:
          "The app accesses your photos to let you choose a profile picture.",
        cameraPermission:
          "The app accesses your camera to let you take a profile picture.",
      },
    ],
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "The app accesses your location to determine the distances to activities.",
      },
    ],
  ],
  extra: {
    eas: {
      projectId: "30b75ab9-e15f-4f6f-a9dc-1e7184fd9ecc",
    },
  },
};
