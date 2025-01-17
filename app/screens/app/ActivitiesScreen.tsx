import { ActivityList } from "@components";
import {
  useFiltersContext,
  useLocationContext,
  useMessageDialogContext,
} from "@contexts";
import { getDistanceInKilometers } from "@functions";
import { Activity, HomeTabScreenProps, UserData } from "@types";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { auth, firestore } from "firebaseConfig";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import {
  Badge,
  FAB,
  IconButton,
  SegmentedButtons,
  useTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default memo(({ navigation }: HomeTabScreenProps<"Activities">) => {
  const { top } = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();
  const { location, fetchCurrentPosition } = useLocationContext();
  const {
    sportsFilter,
    radiusFilter,
    hasSportsFilterChanged,
    hasRadiusFilterChanged,
  } = useFiltersContext();
  const { showDialog } = useMessageDialogContext();

  const [segmentedButtonsValue, setSegmentedButtonsValue] = useState("all");
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [users, setUsers] = useState<UserData[] | null>(null);
  const [isActivityListLoading, setIsActivityListLoading] = useState(true);
  const [isUserListLoading, setIsUserListLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(firestore, "activities"));
      const activities = querySnapshot.docs.map(
        (doc) => ({ activityId: doc.id, ...doc.data() }) as Activity,
      );
      setActivities(activities);
    } catch {
      showDialog(t("errors.generic"));
    } finally {
      setIsActivityListLoading(false);
    }
  }, [showDialog, t]);

  const handleRefresh = useCallback(async () => {
    await fetchCurrentPosition();
    await fetchActivities();
  }, [fetchActivities, fetchCurrentPosition]);

  useEffect(() => {
    (async () => {
      await handleRefresh();
    })();
  }, [handleRefresh]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(firestore, "users"),
      (querySnapshot) => {
        const users = querySnapshot.docs.map(
          (doc) =>
            ({
              userId: doc.id,
              ...doc.data(),
            }) as UserData,
        );
        setUsers(users);
        setIsUserListLoading(false);
      },
      (error) => {
        if (error.code !== "permission-denied") {
          showDialog(t("errors.generic"));
        }
        setIsUserListLoading(false);
      },
    );

    return () => unsubscribe();
  }, [showDialog, t]);

  const data:
    | (Activity & {
        distance: number | null;
        isOngoing: boolean;
        spotsLeft: number;
        participantIds: string[];
        followedParticipantFullNames: string[];
      })[]
    | null
    | undefined = useMemo(() => {
    if (location === undefined || isActivityListLoading || isUserListLoading) {
      return;
    }

    if (!auth.currentUser || !activities || !users) {
      return null;
    }

    if (activities.length === 0) {
      return [];
    }

    const currentUser = users.find(
      (user) => user.userId === auth.currentUser!.uid,
    );

    if (!currentUser) {
      return null;
    }

    const currentDate = new Date();

    const data = activities
      .map((activity) => {
        const distance = location
          ? parseFloat(
              getDistanceInKilometers(
                location.coords.latitude,
                location.coords.longitude,
                activity.location.latitude,
                activity.location.longitude,
              ).toFixed(2),
            )
          : null;

        const isOngoing = new Date(activity.startDate) <= currentDate;

        const participantCount = users.reduce((count, user) => {
          if (user.activityIds?.includes(activity.activityId)) {
            return count + 1;
          }
          return count;
        }, 0);

        const participantIds = users
          .filter((user) => user.activityIds?.includes(activity.activityId))
          .map((user) => user.userId);

        const followedParticipantFullNames = currentUser.followingIds
          ? users
              .filter(
                (user) =>
                  currentUser.followingIds!.includes(user.userId) &&
                  user.activityIds?.includes(activity.activityId),
              )
              .map((user) => user.fullName)
          : [];

        return {
          ...activity,
          distance,
          isOngoing,
          spotsLeft: activity.spotCount - participantCount,
          participantIds,
          followedParticipantFullNames,
        };
      })
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      );

    return data;
  }, [activities, isActivityListLoading, isUserListLoading, location, users]);

  const filteredData:
    | (Activity & {
        distance: number | null;
        isOngoing: boolean;
        spotsLeft: number;
        participantIds: string[];
        followedParticipantFullNames: string[];
      })[]
    | null
    | undefined = useMemo(() => {
    if (
      data === undefined ||
      sportsFilter === undefined ||
      radiusFilter === undefined
    ) {
      return;
    }

    if (!auth.currentUser || data === null) {
      return null;
    }

    let filteredData: (Activity & {
      distance: number | null;
      isOngoing: boolean;
      spotsLeft: number;
      participantIds: string[];
      followedParticipantFullNames: string[];
    })[] = data.filter((item) => {
      const isSportIncluded = sportsFilter.selectedList.some(
        (sport) => sport._id === item.sport,
      );

      const isWithinRadius = item.distance
        ? radiusFilter === 105 || item.distance <= radiusFilter
        : true;

      return isSportIncluded && isWithinRadius;
    });

    switch (segmentedButtonsValue) {
      case "all":
        filteredData = filteredData.filter(
          (item) => !item.isOngoing && !item.isCanceled,
        );
        break;
      case "following":
        filteredData = filteredData.filter(
          (item) =>
            !item.isOngoing &&
            !item.isCanceled &&
            item.followedParticipantFullNames.length > 0,
        );
        break;
      case "mine": {
        const upcomingItems = filteredData.filter(
          (item) =>
            !item.isOngoing &&
            !item.isCanceled &&
            item.participantIds.includes(auth.currentUser!.uid),
        );

        const ongoingOrCanceledItems = filteredData.filter(
          (item) =>
            (item.isOngoing || item.isCanceled) &&
            item.participantIds.includes(auth.currentUser!.uid),
        );

        filteredData = [...upcomingItems, ...ongoingOrCanceledItems];
        break;
      }
      default:
        break;
    }

    return filteredData;
  }, [data, segmentedButtonsValue, sportsFilter, radiusFilter]);

  const handleSegmentedButtonsValueChange = useCallback((value: string) => {
    setSegmentedButtonsValue(value);
  }, []);

  const handleFiltersPress = useCallback(() => {
    navigation.navigate("Filters");
  }, [navigation]);

  const handleAddActivityPress = useCallback(() => {
    navigation.navigate("AddActivity");
  }, [navigation]);

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      {filteredData !== undefined ? (
        <>
          <View style={styles.segmentedButtonsContainer}>
            <SegmentedButtons
              style={styles.segmentedButtons}
              value={segmentedButtonsValue}
              onValueChange={handleSegmentedButtonsValueChange}
              buttons={[
                {
                  value: "all",
                  label: t("buttons.all"),
                  showSelectedCheck: true,
                },
                {
                  value: "following",
                  label: t("buttons.following"),
                  showSelectedCheck: true,
                },
                {
                  value: "mine",
                  label: t("buttons.mine"),
                  showSelectedCheck: true,
                },
              ]}
            />
            <View>
              <IconButton
                style={styles.iconButton}
                mode="outlined"
                icon="filter-variant"
                size={24}
                onPress={handleFiltersPress}
              />
              {(hasSportsFilterChanged || hasRadiusFilterChanged) && (
                <Badge
                  style={[
                    styles.badge,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  size={12}
                />
              )}
            </View>
          </View>
          <View style={styles.activityListContainer}>
            <ActivityList
              id={segmentedButtonsValue}
              style={styles.activityList}
              data={filteredData}
              onRefresh={handleRefresh}
            />
          </View>
        </>
      ) : (
        <View style={styles.activityIndicatorContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}
      <FAB icon="plus" style={styles.fab} onPress={handleAddActivityPress} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  segmentedButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  segmentedButtons: {
    flex: 1,
  },
  iconButton: {
    margin: 0,
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
  },
  activityListContainer: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 8,
  },
  activityList: {
    maxWidth: 600,
    width: "100%",
  },
  activityIndicatorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
