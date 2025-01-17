import { MessageType } from "@flyerhq/react-native-chat-ui";

export type UserData = {
  userId: string;
  profileUrl?: string;
  fullName: string;
  aboutMe?: string;
  followingIds?: string[];
  activityIds?: string[];
};

export type Activity = {
  activityId: string;
  sport: string;
  startDate: string;
  endDate?: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  level: string;
  spotCount: number;
  pricePerPerson?: number;
  additionalDetails?: string;
  organizerId: string;
  isCanceled: boolean;
};

export type ChatData = {
  chatId: string;
  lastMessage: MessageType.Text;
  userIds: string[];
};
