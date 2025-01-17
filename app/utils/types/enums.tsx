export enum Sport {
  BADMINTON = "Badminton",
  BASKETBALL = "Basketball",
  CYCLING = "Cycling",
  FOOTBALL = "Football",
  RUNNING = "Running",
  TABLE_TENNIS = "Table Tennis",
  TENNIS = "Tennis",
  VOLLEYBALL = "Volleyball",
}

export enum Level {
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High",
  ALL = "All",
}

export const sportLocalizationKeys: { [key: string]: string } = {
  [Sport.BADMINTON]: "sports.badminton",
  [Sport.BASKETBALL]: "sports.basketball",
  [Sport.CYCLING]: "sports.cycling",
  [Sport.FOOTBALL]: "sports.football",
  [Sport.RUNNING]: "sports.running",
  [Sport.TABLE_TENNIS]: "sports.tableTennis",
  [Sport.TENNIS]: "sports.tennis",
  [Sport.VOLLEYBALL]: "sports.volleyball",
};

export const levelLocalizationKeys: { [key: string]: string } = {
  [Level.LOW]: "levels.low",
  [Level.MEDIUM]: "levels.medium",
  [Level.HIGH]: "levels.high",
  [Level.ALL]: "levels.all",
};
