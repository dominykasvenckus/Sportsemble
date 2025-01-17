import { getAllLocalizedSportsWithIds } from "@functions";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { useMessageDialogContext } from "./MessageDialogContext";

type DropdownValue = {
  value: string;
  list: {
    _id: string;
    value: string;
  }[];
  selectedList: {
    _id: string;
    value: string;
  }[];
  error: string;
};

const initialRadiusFilter = 105;
const initialSportsFilter: DropdownValue = {
  value: getAllLocalizedSportsWithIds()
    .map((sport) => sport.value)
    .join(", "),
  list: getAllLocalizedSportsWithIds(),
  selectedList: getAllLocalizedSportsWithIds(),
  error: "",
};

type FiltersContextType = {
  initialSportsFilter: DropdownValue;
  initialRadiusFilter: number;
  sportsFilter?: DropdownValue;
  radiusFilter?: number;
  hasSportsFilterChanged: boolean;
  hasRadiusFilterChanged: boolean;
  updateSportsFilter: (sports: DropdownValue) => Promise<void>;
  updateRadiusFilter: (radius: number) => Promise<void>;
  clearFilters: () => Promise<void>;
};

const FiltersContext = createContext<FiltersContextType | null>(null);

export default function FiltersContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { t } = useTranslation();

  const [sportsFilter, setSportsFilter] = useState<DropdownValue>();
  const [radiusFilter, setRadiusFilter] = useState<number>();
  const [hasSportsFilterChanged, setHasSportsFilterChanged] = useState(false);
  const [hasRadiusFilterChanged, setHasRadiusFilterChanged] = useState(false);
  const { showDialog } = useMessageDialogContext();

  useEffect(() => {
    (async () => {
      try {
        const sportsFilterItem =
          await ReactNativeAsyncStorage.getItem("sportsFilter");
        const radiusFilterItem =
          await ReactNativeAsyncStorage.getItem("radiusFilter");

        const sportsFilterValue =
          sportsFilterItem != null
            ? JSON.parse(sportsFilterItem)
            : initialSportsFilter;
        const radiusFilterValue =
          radiusFilterItem != null
            ? Number(radiusFilterItem)
            : initialRadiusFilter;

        setSportsFilter(sportsFilterValue);
        setRadiusFilter(radiusFilterValue);

        setHasSportsFilterChanged(
          JSON.stringify(sportsFilterValue) !==
            JSON.stringify(initialSportsFilter),
        );
        setHasRadiusFilterChanged(radiusFilterValue !== initialRadiusFilter);
      } catch {
        setSportsFilter(initialSportsFilter);
        setRadiusFilter(initialRadiusFilter);
        setHasSportsFilterChanged(false);
        setHasRadiusFilterChanged(false);
        showDialog(t("errors.filtersGetFailure"));
      }
    })();
  }, [showDialog, t]);

  const updateSportsFilter = useCallback(
    async (sports: DropdownValue) => {
      try {
        const jsonSportsFilter = JSON.stringify(sports);
        await ReactNativeAsyncStorage.setItem("sportsFilter", jsonSportsFilter);
        setSportsFilter(sports);
        setHasSportsFilterChanged(
          jsonSportsFilter !== JSON.stringify(initialSportsFilter),
        );
      } catch {
        showDialog(t("errors.filtersSetFailure"));
      }
    },
    [showDialog, t],
  );

  const updateRadiusFilter = useCallback(
    async (radius: number) => {
      try {
        await ReactNativeAsyncStorage.setItem(
          "radiusFilter",
          radius.toString(),
        );
        setRadiusFilter(radius);
        setHasRadiusFilterChanged(radius !== initialRadiusFilter);
      } catch {
        showDialog(t("errors.filtersSetFailure"));
      }
    },
    [showDialog, t],
  );

  const clearFilters = useCallback(async () => {
    try {
      await ReactNativeAsyncStorage.removeItem("sportsFilter");
      await ReactNativeAsyncStorage.removeItem("radiusFilter");
      setSportsFilter(initialSportsFilter);
      setRadiusFilter(initialRadiusFilter);
      setHasSportsFilterChanged(false);
      setHasRadiusFilterChanged(false);
    } catch {
      showDialog(t("errors.filtersRemoveFailure"));
    }
  }, [showDialog, t]);

  const value = {
    initialSportsFilter,
    initialRadiusFilter,
    sportsFilter,
    radiusFilter,
    hasSportsFilterChanged,
    hasRadiusFilterChanged,
    updateSportsFilter,
    updateRadiusFilter,
    clearFilters,
  };

  return (
    <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>
  );
}

export function useFiltersContext() {
  const context = useContext(FiltersContext);

  if (!context) {
    throw new Error(
      "useFiltersContext must be used within a FiltersContextProvider.",
    );
  }

  return context;
}
