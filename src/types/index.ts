import { Request } from "express";
import { Document, ObjectId } from "mongoose";

// User interface for MongoDB document
export interface IUser extends Document {
  _id: ObjectId;
  email: string;
  password: string;
  salt: string;
  role: 'patient' | 'doctor';
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
}

// Request interface for user signup
export interface SignupRequest {
  email: string;
  password: string;
  role: 'patient' | 'doctor';
  firstName: string;
  lastName: string;
}

// Response interface for user signup (excludes sensitive fields)
export interface SignupResponse {
  _id: string;
  email: string;
  role: 'patient' | 'doctor';
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
}

// Sanitized user interface for general use (excludes sensitive fields)
export interface UserResponse {
  _id: string;
  email: string;
  role: 'patient' | 'doctor';
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthenticatedRequest extends Request {
  user?: UserResponse;
}

export interface JWTPayload {
  _id: string;
  email: string;
  role: 'patient' | 'doctor';
}