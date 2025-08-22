import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { SignupRequest } from '../types/index.js';
import { ApiError } from '../utils/ApiError.js';

// Configuration constants
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');
const SALT_LENGTH = 32;

// Password requirements
const PASSWORD_MIN_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Generates a cryptographically secure random salt
 * @returns {string} Base64 encoded salt
 */
export const generateSalt = (): string => {
  return crypto.randomBytes(SALT_LENGTH).toString('base64');
};

/**
 * Hashes a password with the provided salt using bcrypt
 * @param {string} password - Plain text password
 * @param {string} salt - Base64 encoded salt
 * @returns {Promise<string>} Hashed password
 */
export const hashPassword = async (password: string, salt: string): Promise<string> => {
  try {
    // Combine password with salt before hashing
    const saltedPassword = password + salt;
    const hashedPassword = await bcrypt.hash(saltedPassword, BCRYPT_ROUNDS);
    return hashedPassword;
  } catch (error) {
    throw new ApiError(500, 'Error hashing password');
  }
};

/**
 * Validates email format using regex
 * @param {string} email - Email to validate
 * @returns {boolean} True if email format is valid
 */
export const validateEmailFormat = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  return EMAIL_REGEX.test(email.trim().toLowerCase());
};

/**
 * Validates password strength requirements
 * @param {string} password - Password to validate
 * @returns {ValidationResult} Validation result with errors if any
 */
export const validatePasswordStrength = (password: string): ValidationResult => {
  const errors: string[] = [];

  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
    return { isValid: false, errors };
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`);
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates all signup data fields
 * @param {SignupRequest} userData - User signup data to validate
 * @returns {ValidationResult} Validation result with all errors
 */
export const validateSignupData = (userData: SignupRequest): ValidationResult => {
  const errors: string[] = [];

  // Validate required fields
  if (!userData.firstName || typeof userData.firstName !== 'string' || userData.firstName.trim().length === 0) {
    errors.push('First name is required');
  }

  if (!userData.lastName || typeof userData.lastName !== 'string' || userData.lastName.trim().length === 0) {
    errors.push('Last name is required');
  }

  if (!userData.email || typeof userData.email !== 'string' || userData.email.trim().length === 0) {
    errors.push('Email is required');
  } else if (!validateEmailFormat(userData.email)) {
    errors.push('Please provide a valid email address');
  }

  if (!userData.password) {
    errors.push('Password is required');
  } else {
    const passwordValidation = validatePasswordStrength(userData.password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }
  }

  if (!userData.role) {
    errors.push('Role is required');
  } else if (!['patient', 'doctor'].includes(userData.role)) {
    errors.push('Role must be either "patient" or "doctor"');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Verifies a password against a stored hash
 * @param {string} password - Plain text password
 * @param {string} salt - Base64 encoded salt
 * @param {string} hashedPassword - Stored hashed password
 * @returns {Promise<boolean>} True if password matches
 */
export const verifyPassword = async (
  password: string, 
  salt: string, 
  hashedPassword: string
): Promise<boolean> => {
  try {
    const saltedPassword = password + salt;
    return await bcrypt.compare(saltedPassword, hashedPassword);
  } catch (error) {
    throw new ApiError(500, 'Error verifying password');
  }
};