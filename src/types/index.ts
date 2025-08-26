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
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Request interface for user signup
export interface SignupRequest {
  email: string;
  password: string;
  role: 'patient' | 'doctor';
  firstName: string;
  lastName: string;
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

// Request interface for user login
export interface LoginRequest {
  email: string;
  password: string;
}

// Response interface for user login
export interface LoginResponse {
  user: UserResponse;
  token: string;
}

// Dental Analysis Types

// Request interface for dental analysis
export interface AnalysisRequest {
  dentistName: string;
  dentistMobileNumber: string;
  patientName?: string;
  toothImage1: string; // data URI
  toothImage2: string; // data URI
}

// Zonal analysis interface for tooth shade analysis
export interface ZonalAnalysis {
  zone: 'Cervical Third' | 'Middle Third' | 'Incisal Third';
  vita_classical: string;
  vita_3d_master: string;
  notes: string;
}

// Layered recommendation interface for dental restoration
export interface LayeredRecommendation {
  dentin_layer: string;
  enamel_layer: string;
  cervical_tint: string;
}

// Final recommendation interface containing complete analysis
export interface FinalRecommendation {
  estimated_tooth_type: string;
  zonal_analysis: ZonalAnalysis[];
  general_suggestion: string;
  layered_recommendation: LayeredRecommendation;
}

// Analysis record interface for storing complete analysis data
export interface AnalysisRecord {
  id: string;
  dentistName: string;
  dentistMobileNumber: string;
  patientName?: string;
  toothImage1: string;
  toothImage2: string;
  date: string;
  analysis: {
    final_recommendation: FinalRecommendation;
  };
}

// Response interface for analysis API endpoint
export interface AnalysisResponse {
  record: AnalysisRecord;
}