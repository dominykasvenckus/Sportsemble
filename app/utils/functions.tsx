import {
  Level,
  Sport,
  levelLocalizationKeys,
  sportLocalizationKeys,
} from "@types";

import i18n from "./locales";

export const getAllLocalizedSportsWithIds = (): {
  _id: string;
  value: string;
}[] => {
  return Object.values(Sport).map((value) => ({
    _id: value,
    value: i18n.t(sportLocalizationKeys[value]),
  }));
};

export const getAllLocalizedLevelsWithIds = (): {
  _id: string;
  value: string;
}[] => {
  return Object.values(Level).map((value) => ({
    _id: value,
    value: i18n.t(levelLocalizationKeys[value]),
  }));
};

export const getLocalizedSport = (value: string): string => {
  return i18n.t(sportLocalizationKeys[value]);
};

export const getLocalizedLevel = (value: string): string => {
  return i18n.t(levelLocalizationKeys[value]);
};

export const getSportIconName = (value: string): string => {
  switch (value) {
    case Sport.BADMINTON:
      return "badminton";
    case Sport.BASKETBALL:
      return "basketball";
    case Sport.CYCLING:
      return "bicycle";
    case Sport.FOOTBALL:
      return "soccer";
    case Sport.RUNNING:
      return "run";
    case Sport.TABLE_TENNIS:
      return "table-tennis";
    case Sport.TENNIS:
      return "tennis";
    case Sport.VOLLEYBALL:
      return "volleyball";
    default:
      return "help";
  }
};

export const degreesToRadians = (degrees: number) => {
  return degrees * (Math.PI / 180);
};

export const getDistanceInKilometers = (
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number,
) => {
  const earthRadius = 6371;
  const deltaLatitude = degreesToRadians(latitude2 - latitude1);
  const deltaLongitude = degreesToRadians(longitude2 - longitude1);
  const a =
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
    Math.cos(degreesToRadians(latitude1)) *
      Math.cos(degreesToRadians(latitude2)) *
      Math.sin(deltaLongitude / 2) *
      Math.sin(deltaLongitude / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = earthRadius * c;
  return distance;
};
