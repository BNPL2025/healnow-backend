import { Request, Response } from 'express';
import { User } from '../models/user.model.js';
import { validateSignupData } from '../services/auth.service.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { SignupRequest, SignupResponse } from '../types/index.js';

/**
 * User signup controller
 * Creates a new user account with validation and duplicate checking
 * 
 * @route POST /api/users/signup
 * @access Public
 */
export const signup = asyncHandler(async (req: Request, res: Response) => {
  const userData: SignupRequest = req.body;

  // Validate input data
  const validation = validateSignupData(userData);
  if (!validation.isValid) {
    throw new ApiError(400, 'Validation failed', validation.errors);
  }

  // Check if user with email already exists
  const existingUser = await User.findOne({ 
    email: userData.email.toLowerCase().trim() 
  });
  
  if (existingUser) {
    throw new ApiError(409, 'User with this email already exists');
  }

  try {
    // Create new user (password hashing is handled by pre-save middleware)
    const newUser = new User({
      email: userData.email.toLowerCase().trim(),
      password: userData.password,
      role: userData.role,
      firstName: userData.firstName.trim(),
      lastName: userData.lastName.trim()
    });

    // Save user to database
    const savedUser = await newUser.save();

    // Prepare sanitized response data
    const responseData: SignupResponse = {
      _id: savedUser._id.toString(),
      email: savedUser.email,
      role: savedUser.role,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      createdAt: savedUser.createdAt,
      updatedAt: savedUser.updatedAt
    };

    // Return success response
    res.status(201).json(
      new ApiResponse(201, responseData, 'User account created successfully')
    );

  } catch (error: any) {
    // Handle MongoDB validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(
        (err: any) => err.message
      );
      throw new ApiError(400, 'Validation failed', validationErrors);
    }

    // Handle MongoDB duplicate key error (in case unique constraint fails)
    if (error.code === 11000) {
      throw new ApiError(409, 'User with this email already exists');
    }

    // Handle other database errors
    throw new ApiError(500, 'Failed to create user account');
  }
});