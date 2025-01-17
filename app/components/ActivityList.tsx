import {
  getLocalizedLevel,
  getLocalizedSport,
  getSportIconName,
} from "@functions";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Activity, RootStackParamList } from "@types";
import { Key, memo, useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import {
  Card,
  Icon,
  Text,
  TouchableRipple,
  useTheme,
} from "react-native-paper";

type ActivityListProps = {
  id?: Key | null;
  style?: StyleProp<ViewStyle>;
  emptyListTextContainerStyle?: StyleProp<ViewStyle>;
  data:
    | (Activity & {
        distance: number | null;
        isOngoing: boolean;
        spotsLeft: number;
        participantIds: string[];
        followedParticipantFullNames: string[];
      })[]
    | null;
  onRefresh: () => Promise<void>;
};

export default memo(
  ({
    id,
    style,
    emptyListTextContainerStyle,
    data,
    onRefresh,
  }: ActivityListProps) => {
    const theme = useTheme();
    const { t, i18n } = useTranslation();
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

    const flatListRef = useRef<FlatList>(null);

    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = useCallback(async () => {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }, [onRefresh]);

    const handleEndReached = useCallback(() => {
      if (Platform.OS === "android" && data && data.length > 0) {
        flatListRef.current?.scrollToIndex({ index: data.length - 1 });
      }
    }, [data]);

    const handleListItemPress = useCallback(
      (
        item: Activity & {
          distance: number | null;
          isOngoing: boolean;
          spotsLeft: number;
          participantIds: string[];
          followedParticipantFullNames: string[];
        },
      ) =>
        () => {
          navigation.navigate("ViewActivity", { activityId: item.activityId });
        },
      [navigation],
    );

    const renderItem = useCallback(
      ({
        item,
        index,
      }: {
        item: Activity & {
          distance: number | null;
          isOngoing: boolean;
          spotsLeft: number;
          participantIds: string[];
          followedParticipantFullNames: string[];
        };
        index: number;
      }) => {
        return (
          <View
            style={[
              styles.cardContainer,
              data && index === data.length - 1 && styles.lastCardContainer,
            ]}
          >
            <Card
              style={
                !item.isOngoing && !item.isCanceled
                  ? { backgroundColor: "#ffffff" }
                  : [
                      styles.ongoingOrCanceledItemCard,
                      { backgroundColor: "#f2f2f2" },
                    ]
              }
              elevation={2}
            >
              <TouchableRipple
                borderless
                style={[
                  styles.cardContentContainer,
                  { borderRadius: 3 * theme.roundness },
                ]}
                onPress={handleListItemPress(item)}
                unstable_pressDelay={100}
              >
                <Card.Content style={styles.cardContent}>
                  <View style={styles.iconOuterContainer}>
                    <View
                      style={[
                        styles.iconInnerContainer,
                        { backgroundColor: theme.colors.primary },
                      ]}
                    >
                      <Icon
                        source={getSportIconName(item.sport)}
                        color="#ffffff"
                        size={30}
                      />
                    </View>
                  </View>
                  <View style={styles.infoContainer}>
                    {item.isCanceled && (
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
                    <View style={styles.sportAndDatesContainer}>
                      <Text variant="titleMedium" style={styles.boldText}>
                        {getLocalizedSport(item.sport)}
                      </Text>
                      <View>
                        <Text variant="bodyMedium">
                          {new Date(item.startDate).toLocaleString(undefined, {
                            year: "numeric",
                            month: "numeric",
                            day: "numeric",
                            hour: "numeric",
                            minute: "numeric",
                          })}
                        </Text>
                        {item.endDate && (
                          <Text variant="bodyMedium">
                            {new Date(item.endDate).toLocaleString(undefined, {
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
                    {item.followedParticipantFullNames.length !== 0 && (
                      <Text
                        variant="bodyMedium"
                        style={[
                          styles.boldText,
                          styles.followedParticipantsText,
                          { color: theme.colors.primary },
                        ]}
                      >
                        {item.followedParticipantFullNames.length > 1
                          ? `${item.followedParticipantFullNames[0]} ${t(
                              "activityList.and",
                            )} ${
                              item.followedParticipantFullNames.length - 1
                            } ${
                              item.followedParticipantFullNames.length - 1 === 1
                                ? t("activityList.otherParticipate")
                                : t("activityList.othersParticipate")
                            }`
                          : `${item.followedParticipantFullNames[0]} ${t(
                              "activityList.participates",
                            )}`}
                      </Text>
                    )}
                    {item.distance && (
                      <View style={styles.distanceContainer}>
                        <Text variant="bodyMedium" style={styles.boldText}>
                          {item.distance}
                          <Text>{` km ${t("activityList.away")}`}</Text>
                        </Text>
                      </View>
                    )}
                    <View style={styles.addressContainer}>
                      <Icon source="map-marker" size={20} />
                      <Text variant="bodyMedium" style={styles.addressText}>
                        {item.location.address}
                      </Text>
                    </View>
                    <View style={styles.detailsContainer}>
                      <View style={styles.levelContainer}>
                        <Text variant="bodyMedium" style={styles.boldText}>
                          {getLocalizedLevel(item.level)}
                        </Text>
                        <Text variant="labelSmall" style={styles.levelText}>
                          {t("labels.level").toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.spotsLeftContainer}>
                        <Text variant="bodyMedium" style={styles.boldText}>
                          {item.spotsLeft}
                        </Text>
                        <Text variant="labelSmall" style={styles.spotsLeftText}>
                          {t("labels.spotsLeft").toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.priceContainer}>
                        <Text variant="bodyMedium" style={styles.boldText}>
                          {item.pricePerPerson
                            ? `${i18n.language === "en" ? "€" : ""}${
                                item.pricePerPerson
                              }${i18n.language !== "en" ? "€" : ""}`
                            : t("labels.free")}
                        </Text>
                        <Text variant="labelSmall" style={styles.priceText}>
                          {t("labels.price").toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Card.Content>
              </TouchableRipple>
            </Card>
          </View>
        );
      },
      [
        data,
        handleListItemPress,
        i18n.language,
        t,
        theme.colors.error,
        theme.colors.primary,
        theme.roundness,
      ],
    );

    const keyExtractor = useCallback(
      (
        item: Activity & {
          distance: number | null;
          isOngoing: boolean;
          spotsLeft: number;
          participantIds: string[];
          followedParticipantFullNames: string[];
        },
      ) => item.activityId,
      [],
    );

    return (
      <FlatList
        key={id}
        ref={flatListRef}
        style={style}
        contentContainerStyle={styles.flatListContentContainer}
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View
            style={[styles.emptyListTextContainer, emptyListTextContainerStyle]}
          >
            <Text variant="bodyMedium">
              {t("activityList.noActivitiesFound")}
            </Text>
          </View>
        }
        onEndReached={handleEndReached}
        onScrollToIndexFailed={() => {}}
        keyboardShouldPersistTaps="handled"
      />
    );
  },
);

const styles = StyleSheet.create({
  cardContainer: {
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 8,
  },
  lastCardContainer: {
    paddingTop: 8,
    paddingBottom: 88,
    paddingHorizontal: 8,
  },
  ongoingOrCanceledItemCard: {
    opacity: 0.7,
  },
  cardContentContainer: {
    paddingVertical: 16,
  },
  cardContent: {
    flexDirection: "row",
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
  infoContainer: {
    flex: 1,
  },
  canceledText: {
    marginBottom: 2,
  },
  boldText: {
    fontWeight: "bold",
  },
  sportAndDatesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  followedParticipantsText: {
    marginBottom: 2,
  },
  distanceContainer: {
    flexDirection: "row",
    gap: 2,
    marginBottom: 2,
  },
  addressContainer: {
    flexDirection: "row",
    gap: 2,
    marginBottom: 5,
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
  flatListContentContainer: {
    flexGrow: 1,
  },
  emptyListTextContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
