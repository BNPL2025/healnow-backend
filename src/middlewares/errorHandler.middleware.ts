import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

/**
 * Global error handling middleware
 * Formats all errors into consistent API response format
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // If response already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle ApiError instances
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json(
      new ApiResponse(err.statusCode, null, err.message, err.errors)
    );
  }

  // Handle MongoDB validation errors
  if (err.name === 'ValidationError') {
    const validationErrors = Object.values(err.errors).map(
      (error: any) => error.message
    );
    return res.status(400).json(
      new ApiResponse(400, null, 'Validation failed', validationErrors)
    );
  }

  // Handle MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    return res.status(409).json(
      new ApiResponse(409, null, message)
    );
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(
      new ApiResponse(401, null, 'Invalid token')
    );
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(
      new ApiResponse(401, null, 'Token expired')
    );
  }

  // Handle other known errors
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  // Log error for debugging (in production, use proper logging)
  console.error('Error:', err);

  return res.status(statusCode).json(
    new ApiResponse(statusCode, null, message)
  );
};