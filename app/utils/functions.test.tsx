import {
  degreesToRadians,
  getAllLocalizedLevelsWithIds,
  getAllLocalizedSportsWithIds,
  getDistanceInKilometers,
  getLocalizedLevel,
  getLocalizedSport,
  getSportIconName,
} from "@functions";

import {
  Level,
  Sport,
  levelLocalizationKeys,
  sportLocalizationKeys,
} from "./types/enums";

jest.mock("./locales", () => ({
  t: jest.fn((key: string) => `Localized ${key}`),
}));

describe("getAllLocalizedSportsWithIds", () => {
  it("should return an array of sports with ids", () => {
    const result = getAllLocalizedSportsWithIds();
    expect(result).toBeInstanceOf(Array);
    expect(result).toHaveLength(Object.keys(Sport).length);
    result.forEach((item) => {
      expect(item).toHaveProperty("_id");
      expect(item).toHaveProperty("value");
    });
  });

  it("should correctly localize each sport using the correct localization keys", () => {
    const result = getAllLocalizedSportsWithIds();
    Object.values(Sport).forEach((sport) => {
      const localizedSport = result.find((item) => item._id === sport);
      expect(localizedSport).toBeDefined();
      expect(localizedSport!.value).toBe(
        `Localized ${sportLocalizationKeys[sport]}`,
      );
    });
  });
});

describe("getAllLocalizedLevelsWithIds", () => {
  it("should return an array of levels with ids", () => {
    const result = getAllLocalizedLevelsWithIds();
    expect(result).toBeInstanceOf(Array);
    expect(result).toHaveLength(Object.keys(Level).length);
    result.forEach((item) => {
      expect(item).toHaveProperty("_id");
      expect(item).toHaveProperty("value");
    });
  });

  it("should correctly localize each level using the correct localization keys", () => {
    const result = getAllLocalizedLevelsWithIds();
    Object.values(Level).forEach((level) => {
      const localizedLevel = result.find((item) => item._id === level);
      expect(localizedLevel).toBeDefined();
      expect(localizedLevel!.value).toBe(
        `Localized ${levelLocalizationKeys[level]}`,
      );
    });
  });
});

describe("getLocalizedSport", () => {
  it("should return a localized string for each sport", () => {
    Object.values(Sport).forEach((sport) => {
      const localized = getLocalizedSport(sport);
      expect(localized).toBe(`Localized ${sportLocalizationKeys[sport]}`);
    });
  });

  it("should handle unknown sports gracefully", () => {
    const unknownSport = "UnknownSport";
    expect(getLocalizedSport(unknownSport)).toBe(
      `Localized ${sportLocalizationKeys[unknownSport]}`,
    );
  });
});

describe("getLocalizedLevel", () => {
  it("should return a localized string for each level", () => {
    Object.values(Level).forEach((level) => {
      const localized = getLocalizedLevel(level);
      expect(localized).toBe(`Localized ${levelLocalizationKeys[level]}`);
    });
  });

  it("should handle unknown levels gracefully", () => {
    const unknownLevel = "UnknownLevel";
    expect(getLocalizedLevel(unknownLevel)).toBe(
      `Localized ${levelLocalizationKeys[unknownLevel]}`,
    );
  });
});

describe("getSportIconName", () => {
  it("should return the correct icon name for each sport", () => {
    expect(getSportIconName(Sport.BADMINTON)).toBe("badminton");
    expect(getSportIconName(Sport.BASKETBALL)).toBe("basketball");
    expect(getSportIconName(Sport.CYCLING)).toBe("bicycle");
    expect(getSportIconName(Sport.FOOTBALL)).toBe("soccer");
    expect(getSportIconName(Sport.RUNNING)).toBe("run");
    expect(getSportIconName(Sport.TABLE_TENNIS)).toBe("table-tennis");
    expect(getSportIconName(Sport.TENNIS)).toBe("tennis");
    expect(getSportIconName(Sport.VOLLEYBALL)).toBe("volleyball");
  });

  it("should return 'help' for sports not defined in the enum", () => {
    expect(getSportIconName("Cricket")).toBe("help");
  });
});

describe("degreesToRadians", () => {
  it("should correctly convert degrees to radians", () => {
    expect(degreesToRadians(0)).toBeCloseTo(0);
    expect(degreesToRadians(180)).toBeCloseTo(Math.PI);
    expect(degreesToRadians(360)).toBeCloseTo(2 * Math.PI);
  });

  it("should handle negative degrees", () => {
    expect(degreesToRadians(-180)).toBeCloseTo(-Math.PI);
    expect(degreesToRadians(-360)).toBeCloseTo(-2 * Math.PI);
  });

  it("should handle decimal degrees", () => {
    expect(degreesToRadians(45.5)).toBeCloseTo(0.7941, 4);
  });

  it("should convert 90 degrees to π/2 radians", () => {
    expect(degreesToRadians(90)).toBeCloseTo(Math.PI / 2);
  });
});

describe("getDistanceInKilometers", () => {
  it("should accurately calculate the distance between two points", () => {
    const lat1 = 40.7128;
    const lon1 = -74.006;
    const lat2 = 34.0522;
    const lon2 = -118.2437;
    const distance = getDistanceInKilometers(lat1, lon1, lat2, lon2);
    const difference = Math.abs(distance - 3935);
    expect(difference).toBeLessThanOrEqual(10);
  });

  it("should return 0 for the distance between the same points", () => {
    const lat = 51.5074;
    const lon = -0.1278;
    const distance = getDistanceInKilometers(lat, lon, lat, lon);
    expect(distance).toBe(0);
  });

  it("should correctly calculate distances across the equator", () => {
    const lat1 = -0.1807;
    const lon1 = -78.4678;
    const lat2 = -1.286389;
    const lon2 = 36.817223;
    const distance = getDistanceInKilometers(lat1, lon1, lat2, lon2);
    const difference = Math.abs(distance - 12817);
    expect(difference).toBeLessThanOrEqual(10);
  });
});
