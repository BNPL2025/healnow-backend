import { Request, Response } from 'express';
import { 
  validateAnalysisRequest, 
  processToothAnalysis, 
  createAnalysisRecord 
} from '../services/analysis.service.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AnalysisRequest, AnalysisResponse } from '../types/index.js';

/**
 * Tooth shade analysis controller
 * Analyzes tooth images and returns detailed shade recommendations
 * 
 * @route POST /api/analysis/analyze
 * @access Public
 */
export const analyzeToothShade = asyncHandler(async (req: Request, res: Response) => {
  const analysisData: AnalysisRequest = req.body;

  // Validate input data using service layer validation
  const validation = validateAnalysisRequest(analysisData);
  if (!validation.isValid) {
    throw new ApiError(400, 'Validation failed', validation.errors);
  }

  try {
    // Process tooth analysis using OpenAI service
    const analysisResult = await processToothAnalysis(analysisData);

    // Create complete analysis record
    const analysisRecord = createAnalysisRecord(analysisData, analysisResult);

    // Prepare response data
    const responseData: AnalysisResponse = {
      record: analysisRecord
    };

    // Return success response with structured analysis data
    res.status(200).json(
      new ApiResponse(200, responseData, 'Tooth shade analysis completed successfully')
    );

  } catch (error: any) {
    // Handle specific API errors from service layer
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle OpenAI API authentication errors
    if (error.message && error.message.includes('401')) {
      throw new ApiError(401, 'Authentication failed with analysis service');
    }

    // Handle OpenAI API rate limiting errors
    if (error.message && error.message.includes('429')) {
      throw new ApiError(429, 'Analysis service rate limit exceeded. Please try again later');
    }

    // Handle OpenAI API timeout errors
    if (error.message && error.message.includes('timeout')) {
      throw new ApiError(408, 'Analysis service request timeout. Please try again');
    }

    // Handle network or connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new ApiError(503, 'Analysis service temporarily unavailable');
    }

    // Handle JSON parsing errors
    if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
      throw new ApiError(500, 'Invalid response format from analysis service');
    }

    // Handle any other unexpected errors
    throw new ApiError(500, 'Failed to process tooth shade analysis');
  }
});