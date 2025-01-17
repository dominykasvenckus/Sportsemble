import {
  LocationObject,
  PermissionStatus,
  getCurrentPositionAsync,
  getForegroundPermissionsAsync,
  requestForegroundPermissionsAsync,
} from "expo-location";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

type LocationContextType = {
  location: LocationObject | null | undefined;
  fetchCurrentPosition: () => Promise<void>;
};

const LocationContext = createContext<LocationContextType | null>(null);

export default function LocationContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [location, setLocation] = useState<LocationObject | null>();

  const verifyForegroundPermission = useCallback(async () => {
    const { status } = await getForegroundPermissionsAsync();

    if (status === PermissionStatus.UNDETERMINED) {
      const response = await requestForegroundPermissionsAsync();
      return response.granted;
    } else if (status === PermissionStatus.DENIED) {
      return false;
    }

    return true;
  }, []);

  const fetchCurrentPosition = useCallback(async () => {
    const hasForegroundPermission = await verifyForegroundPermission();

    if (!hasForegroundPermission) {
      setLocation(null);
    }

    try {
      const location = await getCurrentPositionAsync();
      setLocation(location);
    } catch {
      setLocation(null);
    }
  }, [verifyForegroundPermission]);

  const value = {
    location,
    fetchCurrentPosition,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  const context = useContext(LocationContext);

  if (!context) {
    throw new Error(
      "useLocationContext must be used within a LocationContextProvider.",
    );
  }

  return context;
}
