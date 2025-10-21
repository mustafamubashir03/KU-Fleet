import { Document } from "mongoose";

export interface IStation extends Document {
  stationName: string;
  position: {
    type: "Point";
    coordinates: [number, number]; 
  };
}
