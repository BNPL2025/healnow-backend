import { Request, Response } from 'express';
import { User } from '../models/user.model.js';
import { validateSignupData, generateToken } from '../services/auth.service.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { SignupRequest, LoginRequest, LoginResponse, UserResponse, AuthenticatedRequest } from '../types/index.js';

/**
 * User signup controller
 * Creates a new user account with validation and duplicate checking
 * 
 * @route POST /api/auth/signup
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

    // Generate JWT token for the new user
    const token = generateToken(savedUser);

    // Prepare sanitized user response data
    const userResponse: UserResponse = {
      _id: savedUser._id.toString(),
      email: savedUser.email,
      role: savedUser.role,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      createdAt: savedUser.createdAt,
      updatedAt: savedUser.updatedAt
    };

    const responseData: LoginResponse = {
      user: userResponse,
      token
    };

    // Set token as httpOnly cookie for additional security
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

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

/**
 * User login controller
 * Authenticates user and returns JWT token
 * 
 * @route POST /api/auth/login
 * @access Public
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password }: LoginRequest = req.body;

  // Validate required fields
  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  // Find user by email and include password and salt for verification
  const user = await User.findOne({ 
    email: email.toLowerCase().trim() 
  }).select('+password +salt');

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Verify password using the model method
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Generate JWT token
  const token = generateToken(user);

  // Prepare user response (excluding sensitive fields)
  const userResponse: UserResponse = {
    _id: user._id.toString(),
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };

  const responseData: LoginResponse = {
    user: userResponse,
    token
  };

  // Set token as httpOnly cookie for additional security
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.status(200).json(
    new ApiResponse(200, responseData, 'Login successful')
  );
});

/**
 * User logout controller
 * Clears authentication token
 * 
 * @route POST /api/auth/logout
 * @access Private
 */
export const logout = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  // Clear the token cookie
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  res.status(200).json(
    new ApiResponse(200, null, 'Logout successful')
  );
});