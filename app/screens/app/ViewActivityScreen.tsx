import { marker } from "@assets";
import { ConfirmationDialog } from "@components";
import { SCREEN_SPACING } from "@constants";
import { useLocationContext, useMessageDialogContext } from "@contexts";
import {
  getDistanceInKilometers,
  getLocalizedLevel,
  getLocalizedSport,
  getSportIconName,
} from "@functions";
import { Activity, RootStackScreenProps, UserData } from "@types";
import {
  arrayUnion,
  collection,
  deleteField,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, firestore } from "firebaseConfig";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Button, Icon, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default memo(
  ({ navigation, route }: RootStackScreenProps<"ViewActivity">) => {
    const { bottom } = useSafeAreaInsets();
    const theme = useTheme();
    const { t, i18n } = useTranslation();
    const { location } = useLocationContext();
    const { showDialog } = useMessageDialogContext();

    const [activity, setActivity] = useState<Activity | null>(null);
    const [user, setUser] = useState<UserData | null>(null);
    const [participants, setParticipants] = useState<UserData[] | null>(null);
    const [isActivityLoading, setIsActivityLoading] = useState(true);
    const [isUserLoading, setIsUserLoading] = useState(true);
    const [isParticipantListLoading, setIsParticipantListLoading] =
      useState(true);
    const [isConfirmationDialogShown, setIsConfirmationDialogShown] =
      useState(false);

    const { activityId } = route.params;

    useEffect(() => {
      const unsubscribe = onSnapshot(
        doc(firestore, "activities", activityId),
        (doc) => {
          if (doc.exists()) {
            setActivity({
              activityId: doc.id,
              ...doc.data(),
            } as Activity);
          }
          setIsActivityLoading(false);
        },
        () => {
          showDialog(t("errors.generic"));
          setIsActivityLoading(false);
        },
      );

      return () => unsubscribe();
    }, [activityId, showDialog, t]);

    useEffect(() => {
      if (!auth.currentUser) {
        setIsUserLoading(false);
        return;
      }

      const unsubscribe = onSnapshot(
        doc(firestore, "users", auth.currentUser.uid),
        (doc) => {
          if (doc.exists()) {
            setUser({ userId: doc.id, ...doc.data() } as UserData);
          }
          setIsUserLoading(false);
        },
        () => {
          showDialog(t("errors.generic"));
          setIsUserLoading(false);
        },
      );

      return () => unsubscribe();
    }, [showDialog, t]);

    useEffect(() => {
      const q = query(
        collection(firestore, "users"),
        where("activityIds", "array-contains", activityId),
      );

      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const participants = querySnapshot.docs.map(
            (doc) =>
              ({
                userId: doc.id,
                ...doc.data(),
              }) as UserData,
          );
          setParticipants(participants);
          setIsParticipantListLoading(false);
        },
        () => {
          showDialog(t("errors.generic"));
          setIsParticipantListLoading(false);
        },
      );

      return () => unsubscribe();
    }, [activityId, showDialog, t]);

    const data:
      | (Activity & {
          distance: number | null;
          spotsLeft: number;
          participantIds: string[];
          followedParticipantFullNames: string[];
        })
      | null
      | undefined = useMemo(() => {
      if (isActivityLoading || isUserLoading || isParticipantListLoading) {
        return;
      }

      if (!activity || !user || !participants) {
        return null;
      }

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

      const participantIds = participants.map(
        (participant) => participant.userId,
      );

      const followedParticipantFullNames = user.followingIds
        ? participants
            .filter((participant) =>
              user.followingIds!.includes(participant.userId),
            )
            .map((participant) => participant.fullName)
        : [];

      return {
        ...activity,
        distance,
        spotsLeft: activity.spotCount - participantIds.length,
        participantIds,
        followedParticipantFullNames,
      };
    }, [
      activity,
      isActivityLoading,
      isParticipantListLoading,
      isUserLoading,
      location,
      participants,
      user,
    ]);

    const showConfirmationDialog = useCallback(() => {
      setIsConfirmationDialogShown(true);
    }, []);

    const hideConfirmationDialog = useCallback(() => {
      setIsConfirmationDialogShown(false);
    }, []);

    const handlePositiveButtonPress = useCallback(async () => {
      hideConfirmationDialog();

      if (!activity) {
        return;
      }

      if (new Date(activity.startDate) <= new Date()) {
        showDialog(t("errors.cannotCancelStartedActivity"));
        return;
      }

      try {
        await updateDoc(doc(firestore, "activities", activity.activityId), {
          isCanceled: true,
        });
      } catch {
        showDialog(t("errors.generic"));
      }
    }, [activity, hideConfirmationDialog, showDialog, t]);

    const handleJoinPress = useCallback(async () => {
      if (!activity || !user) {
        return;
      }

      if (new Date(activity.startDate) <= new Date()) {
        showDialog(t("errors.cannotJoinStartedActivity"));
        return;
      }

      try {
        await updateDoc(doc(firestore, "users", user.userId), {
          activityIds: arrayUnion(activity.activityId),
        });
      } catch {
        showDialog(t("errors.generic"));
      }
    }, [activity, showDialog, t, user]);

    const handleLeavePress = useCallback(async () => {
      if (!activity || !user || !user.activityIds) {
        return;
      }

      if (new Date(activity.startDate) <= new Date()) {
        showDialog(t("errors.cannotLeaveStartedActivity"));
        return;
      }

      const updatedActivityIds = user.activityIds.filter(
        (id) => id !== activity.activityId,
      );

      try {
        if (updatedActivityIds.length !== 0) {
          await updateDoc(doc(firestore, "users", user.userId), {
            activityIds: updatedActivityIds,
          });
        } else {
          await updateDoc(doc(firestore, "users", user.userId), {
            activityIds: deleteField(),
          });
        }
      } catch {
        showDialog(t("errors.generic"));
      }
    }, [activity, showDialog, t, user]);

    const handleViewParticipantsPress = useCallback(() => {
      if (!activity) {
        return;
      }

      navigation.navigate("ViewParticipants", {
        activityId: activity.activityId,
        organizerId: activity.organizerId,
      });
    }, [activity, navigation]);

    return (
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {data !== undefined ? (
          data && (
            <>
              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                  latitude: data.location.latitude,
                  longitude: data.location.longitude,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: data.location.latitude,
                    longitude: data.location.longitude,
                  }}
                >
                  <View style={styles.markerContainer}>
                    <Image source={marker} style={styles.marker} />
                  </View>
                </Marker>
              </MapView>
              <View style={styles.infoContainer}>
                {data.isCanceled && (
                  <Text
                    variant="bodyLarge"
                    style={[
                      styles.boldText,
                      styles.canceledText,
                      { color: theme.colors.error },
                    ]}
                  >
                    {t("activityList.canceled")}
                  </Text>
                )}
                <View style={styles.headerContainer}>
                  <View style={styles.iconAndSportContainer}>
                    <View style={styles.iconOuterContainer}>
                      <View
                        style={[
                          styles.iconInnerContainer,
                          { backgroundColor: theme.colors.primary },
                        ]}
                      >
                        <Icon
                          source={getSportIconName(data.sport)}
                          color="#ffffff"
                          size={30}
                        />
                      </View>
                    </View>
                    <Text variant="bodyLarge" style={styles.boldText}>
                      {getLocalizedSport(data.sport)}
                    </Text>
                  </View>
                  <View>
                    <Text variant="bodyLarge">
                      {new Date(data.startDate).toLocaleString(undefined, {
                        year: "numeric",
                        month: "numeric",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                      })}
                    </Text>
                    {data.endDate && (
                      <Text variant="bodyLarge">
                        {new Date(data.endDate).toLocaleString(undefined, {
                          year: "numeric",
                          month: "numeric",
                          day: "numeric",
                          hour: "numeric",
                          minute: "numeric",
                        })}
                      </Text>
                    )}
                  </View>
                </View>
                {data.followedParticipantFullNames.length !== 0 && (
                  <Text
                    variant="bodyLarge"
                    style={[
                      styles.boldText,
                      styles.followedParticipantsText,
                      { color: theme.colors.primary },
                    ]}
                  >
                    {data.followedParticipantFullNames.length > 1
                      ? `${data.followedParticipantFullNames[0]} ${t(
                          "activityList.and",
                        )} ${data.followedParticipantFullNames.length - 1} ${
                          data.followedParticipantFullNames.length - 1 === 1
                            ? t("activityList.otherParticipate")
                            : t("activityList.othersParticipate")
                        }`
                      : `${data.followedParticipantFullNames[0]} ${t(
                          "activityList.participates",
                        )}`}
                  </Text>
                )}
                {data.distance && (
                  <View style={styles.distanceContainer}>
                    <Text variant="bodyLarge" style={styles.boldText}>
                      {data.distance}
                      <Text>{` km ${t("activityList.away")}`}</Text>
                    </Text>
                  </View>
                )}
                <View style={styles.addressContainer}>
                  <Icon source="map-marker" size={20} />
                  <Text variant="bodyLarge" style={styles.addressText}>
                    {data.location.address}
                  </Text>
                </View>
                <View style={styles.detailsContainer}>
                  <View style={styles.levelContainer}>
                    <Text variant="bodyLarge" style={styles.boldText}>
                      {getLocalizedLevel(data.level)}
                    </Text>
                    <Text variant="labelMedium" style={styles.levelText}>
                      {t("labels.level").toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.spotsLeftContainer}>
                    <Text variant="bodyLarge" style={styles.boldText}>
                      {data.spotsLeft}
                    </Text>
                    <Text variant="labelMedium" style={styles.spotsLeftText}>
                      {t("labels.spotsLeft").toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.priceContainer}>
                    <Text variant="bodyLarge" style={styles.boldText}>
                      {data.pricePerPerson
                        ? `${i18n.language === "en" ? "€" : ""}${
                            data.pricePerPerson
                          }${i18n.language !== "en" ? "€" : ""}`
                        : t("labels.free")}
                    </Text>
                    <Text variant="labelMedium" style={styles.priceText}>
                      {t("labels.price").toUpperCase()}
                    </Text>
                  </View>
                </View>
                {data.additionalDetails && (
                  <Text
                    variant="bodyLarge"
                    style={styles.additionalDetailsText}
                  >
                    {data.additionalDetails}
                  </Text>
                )}
                <View style={styles.buttonsContainer}>
                  {!data.isCanceled &&
                    auth.currentUser &&
                    !data.participantIds.includes(auth.currentUser.uid) &&
                    auth.currentUser.uid !== data.organizerId &&
                    new Date(data.startDate) > new Date() && (
                      <Button
                        mode="contained"
                        style={styles.button}
                        onPress={handleJoinPress}
                        disabled={data.spotsLeft === 0}
                      >
                        {t("buttons.join")}
                      </Button>
                    )}
                  {!data.isCanceled &&
                    auth.currentUser &&
                    data.participantIds.includes(auth.currentUser.uid) &&
                    auth.currentUser.uid !== data.organizerId &&
                    new Date(data.startDate) > new Date() && (
                      <Button
                        mode="outlined"
                        style={styles.button}
                        onPress={handleLeavePress}
                      >
                        {t("buttons.leave")}
                      </Button>
                    )}
                  {!data.isCanceled &&
                    auth.currentUser?.uid === data.organizerId &&
                    new Date(data.startDate) > new Date() && (
                      <Button
                        mode="outlined"
                        style={[
                          styles.button,
                          { borderColor: theme.colors.error },
                        ]}
                        textColor={theme.colors.error}
                        onPress={showConfirmationDialog}
                      >
                        {t("buttons.cancel")}
                      </Button>
                    )}
                  <Button
                    mode="outlined"
                    style={styles.button}
                    onPress={handleViewParticipantsPress}
                  >
                    {t("buttons.viewParticipants")}
                  </Button>
                </View>
              </View>
              <ConfirmationDialog
                text={t("confirmations.activityCancellation")}
                positiveButtonTitle={t("buttons.yes")}
                negativeButtonTitle={t("buttons.no")}
                visible={isConfirmationDialogShown}
                onClose={hideConfirmationDialog}
                onPositiveButtonPress={handlePositiveButtonPress}
              />
            </>
          )
        ) : (
          <View style={styles.activityIndicatorContainer}>
            <ActivityIndicator size={36} color={theme.colors.primary} />
          </View>
        )}
      </ScrollView>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  map: {
    height: 250,
  },
  markerContainer: {
    pointerEvents: "none",
  },
  marker: {
    height: 48,
    width: undefined,
    aspectRatio: 0.6171875,
  },
  infoContainer: {
    padding: SCREEN_SPACING,
  },
  canceledText: {
    marginBottom: 8,
  },
  boldText: {
    fontWeight: "bold",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  iconAndSportContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconOuterContainer: {
    justifyContent: "center",
  },
  iconInnerContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  followedParticipantsText: {
    marginBottom: 6,
  },
  distanceContainer: {
    flexDirection: "row",
    gap: 2,
    marginBottom: 6,
  },
  addressContainer: {
    flexDirection: "row",
    gap: 2,
    marginBottom: 12,
  },
  addressText: {
    flexShrink: 1,
  },
  detailsContainer: {
    flexDirection: "row",
    gap: 5,
  },
  levelContainer: {
    flex: 1,
  },
  spotsLeftContainer: {
    flex: 1,
  },
  priceContainer: {
    flex: 1,
  },
  levelText: {
    color: "#808080",
  },
  spotsLeftText: {
    color: "#808080",
  },
  priceText: {
    color: "#808080",
  },
  additionalDetailsText: {
    marginTop: 12,
  },
  buttonsContainer: {
    alignItems: "center",
    gap: 20,
    marginTop: 32,
  },
  button: {
    maxWidth: 500,
    width: "100%",
  },
  activityIndicatorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
