import { Request } from "express";

export interface IUser {
  _id: string;
  email: string;
  username: string;
  // Add other user properties as needed
}

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export interface JWTPayload {
  _id: string;
  email: string;
  username: string;
}