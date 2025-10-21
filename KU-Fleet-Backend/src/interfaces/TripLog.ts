import { Document, Types } from "mongoose";

export interface ITripCoordinate {
  lat: number;
  lng: number;
  speed: number;
  timestamp: Date;
}

export interface ITripLog extends Document {
  bus: Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  coordinates: ITripCoordinate[];
  distance?: number;
  avgSpeed?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
