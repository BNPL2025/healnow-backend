import OpenAI from 'openai';
import { AnalysisRequest, FinalRecommendation, AnalysisRecord } from '../types/index.js';
import { ApiError } from '../utils/ApiError.js';

// Configuration constants
const PHONE_REGEX = /^[\+]?[1-9][\d]{0,15}$/;
const DATA_URI_REGEX = /^data:image\/(jpeg|jpg|png|webp);base64,/;
const MAX_NAME_LENGTH = 100;
const MIN_NAME_LENGTH = 2;

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

// OpenAI client instance
let openaiClient: OpenAI | null = null;

/**
 * Initializes the OpenAI client with configuration
 * @returns {OpenAI} Configured OpenAI client
 */
export const initializeOpenAIClient = (): OpenAI => {
    if (openaiClient) {
        return openaiClient;
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new ApiError(500, 'OpenRouter API key not configured');
    }

    const appUrl = process.env.APP_URL || 'http://localhost:3000';

    openaiClient = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: apiKey,
        defaultHeaders: {
            "HTTP-Referer": appUrl,
            "X-Title": "Dental Analysis API"
        }
    });

    return openaiClient;
};

/**
 * Validates dentist name format and length
 * @param {string} name - Dentist name to validate
 * @returns {string[]} Array of validation errors
 */
const validateDentistName = (name: string): string[] => {
    const errors: string[] = [];

    if (!name || typeof name !== 'string') {
        errors.push('Dentist name is required');
        return errors;
    }

    const trimmedName = name.trim();
    if (trimmedName.length < MIN_NAME_LENGTH) {
        errors.push(`Dentist name must be at least ${MIN_NAME_LENGTH} characters long`);
    }

    if (trimmedName.length > MAX_NAME_LENGTH) {
        errors.push(`Dentist name must not exceed ${MAX_NAME_LENGTH} characters`);
    }

    return errors;
};

/**
 * Validates mobile number format
 * @param {string} mobile - Mobile number to validate
 * @returns {string[]} Array of validation errors
 */
const validateMobileNumber = (mobile: string): string[] => {
    const errors: string[] = [];

    if (!mobile || typeof mobile !== 'string') {
        errors.push('Dentist mobile number is required');
        return errors;
    }

    if (!PHONE_REGEX.test(mobile.trim())) {
        errors.push('Please provide a valid mobile number');
    }

    return errors;
};

/**
 * Validates patient name format and length (optional field)
 * @param {string} name - Patient name to validate
 * @returns {string[]} Array of validation errors
 */
const validatePatientName = (name?: string): string[] => {
    const errors: string[] = [];

    if (name !== undefined && name !== null) {
        if (typeof name !== 'string') {
            errors.push('Patient name must be a string');
            return errors;
        }

        const trimmedName = name.trim();
        if (trimmedName.length > MAX_NAME_LENGTH) {
            errors.push(`Patient name must not exceed ${MAX_NAME_LENGTH} characters`);
        }
    }

    return errors;
};

/**
 * Validates image data URI format
 * @param {string} imageData - Image data URI to validate
 * @param {string} fieldName - Field name for error messages
 * @returns {string[]} Array of validation errors
 */
const validateImageDataURI = (imageData: string, fieldName: string): string[] => {
    const errors: string[] = [];

    if (!imageData || typeof imageData !== 'string') {
        errors.push(`${fieldName} is required`);
        return errors;
    }

    if (!DATA_URI_REGEX.test(imageData)) {
        errors.push(`${fieldName} must be a valid image data URI (jpeg, jpg, png, or webp)`);
    }

    // Check if the base64 data appears to be valid (basic check)
    try {
        const base64Data = imageData.split(',')[1];
        if (!base64Data || base64Data.length < 100) {
            errors.push(`${fieldName} appears to contain invalid or insufficient image data`);
        }
    } catch (error) {
        errors.push(`${fieldName} contains malformed data URI`);
    }

    return errors;
};

/**
 * Validates all analysis request data fields
 * @param {AnalysisRequest} requestData - Analysis request data to validate
 * @returns {ValidationResult} Validation result with all errors
 */
export const validateAnalysisRequest = (requestData: AnalysisRequest): ValidationResult => {
    const errors: string[] = [];

    // Validate dentist name
    errors.push(...validateDentistName(requestData.dentistName));

    // Validate mobile number
    errors.push(...validateMobileNumber(requestData.dentistMobileNumber));

    // Validate patient name (optional)
    errors.push(...validatePatientName(requestData.patientName));

    // Validate tooth images
    errors.push(...validateImageDataURI(requestData.toothImage1, 'toothImage1'));
    errors.push(...validateImageDataURI(requestData.toothImage2, 'toothImage2'));

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Parses and validates OpenAI response JSON
 * @param {string} rawResponse - Raw response string from OpenAI
 * @returns {FinalRecommendation} Parsed and validated analysis result
 */
export const parseAnalysisResponse = (rawResponse: string): FinalRecommendation => {
    try {
        const parsed = JSON.parse(rawResponse);

        // Validate the structure of the response
        if (!parsed || typeof parsed !== 'object') {
            throw new ApiError(500, 'Invalid response format from analysis service');
        }

        // Check for required fields in final_recommendation
        const finalRec = parsed.final_recommendation || parsed;

        if (!finalRec.estimated_tooth_type || typeof finalRec.estimated_tooth_type !== 'string') {
            throw new ApiError(500, 'Missing or invalid estimated_tooth_type in analysis response');
        }

        if (!Array.isArray(finalRec.zonal_analysis) || finalRec.zonal_analysis.length === 0) {
            throw new ApiError(500, 'Missing or invalid zonal_analysis in analysis response');
        }

        if (!finalRec.general_suggestion || typeof finalRec.general_suggestion !== 'string') {
            throw new ApiError(500, 'Missing or invalid general_suggestion in analysis response');
        }

        if (!finalRec.layered_recommendation || typeof finalRec.layered_recommendation !== 'object') {
            throw new ApiError(500, 'Missing or invalid layered_recommendation in analysis response');
        }

        // Validate zonal analysis structure
        for (const zone of finalRec.zonal_analysis) {
            if (!zone.zone || !zone.vita_classical || !zone.vita_3d_master || !zone.notes) {
                throw new ApiError(500, 'Invalid zonal analysis structure in response');
            }
        }

        // Validate layered recommendation structure
        const layered = finalRec.layered_recommendation;
        if (!layered.dentin_layer || !layered.enamel_layer || !layered.cervical_tint) {
            throw new ApiError(500, 'Invalid layered recommendation structure in response');
        }

        return finalRec as FinalRecommendation;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'Failed to parse analysis response: Invalid JSON format');
    }
};

/**
 * Creates the analysis prompt for OpenAI
 * @param {AnalysisRequest} request - Analysis request data
 * @returns {string} Formatted prompt for OpenAI
 */
const createAnalysisPrompt = (request: AnalysisRequest): string => {
    return `You are a dental shade analysis expert. Analyze the provided tooth images and provide detailed shade recommendations.

Dentist Information:
- Name: ${request.dentistName}
- Mobile: ${request.dentistMobileNumber}
${request.patientName ? `- Patient: ${request.patientName}` : ''}

Please analyze both tooth images and provide a comprehensive shade analysis in the following JSON format:

{
  "final_recommendation": {
    "estimated_tooth_type": "string (e.g., 'Central Incisor', 'Canine', etc.)",
    "zonal_analysis": [
      {
        "zone": "Cervical Third",
        "vita_classical": "string (e.g., 'A3', 'B2', etc.)",
        "vita_3d_master": "string (e.g., '2M2', '3L1.5', etc.)",
        "notes": "string (detailed observations for this zone)"
      },
      {
        "zone": "Middle Third",
        "vita_classical": "string",
        "vita_3d_master": "string",
        "notes": "string"
      },
      {
        "zone": "Incisal Third",
        "vita_classical": "string",
        "vita_3d_master": "string",
        "notes": "string"
      }
    ],
    "general_suggestion": "string (overall recommendations and observations)",
    "layered_recommendation": {
      "dentin_layer": "string (recommended dentin shade)",
      "enamel_layer": "string (recommended enamel shade)",
      "cervical_tint": "string (recommended cervical tint)"
    }
  }
}

Important: 
1. Analyze both images carefully for color, translucency, and surface characteristics
2. Provide accurate VITA Classical and VITA 3D-Master shade recommendations
3. Consider lighting conditions and image quality in your analysis
4. Provide practical layering recommendations for composite restorations
5. Return ONLY valid JSON in the exact format specified above`;
};

/**
 * Processes tooth analysis using OpenAI API
 * @param {AnalysisRequest} request - Validated analysis request
 * @returns {Promise<FinalRecommendation>} Analysis result
 */
export const processToothAnalysis = async (request: AnalysisRequest): Promise<FinalRecommendation> => {
    try {
        const client = initializeOpenAIClient();
        const prompt = createAnalysisPrompt(request);

        // Prepare the messages for OpenAI API
        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: prompt
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: request.toothImage1
                        }
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: request.toothImage2
                        }
                    }
                ]
            }
        ];

        // Make the API call to OpenAI
        const response = await client.chat.completions.create({
            model: "google/gemini-flash-1.5",
            messages: messages,
            response_format: { type: "json_object" },
            max_tokens: 2000,
            temperature: 0.3
        });

        // Extract the response content
        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new ApiError(500, 'No response received from analysis service');
        }

        // Parse and validate the response
        return parseAnalysisResponse(content);

    } catch (error) {
        // Handle different types of errors
        if (error instanceof ApiError) {
            throw error;
        }

        // Handle OpenAI API specific errors
        if (error instanceof Error) {
            if (error.message.includes('401') || error.message.includes('authentication')) {
                throw new ApiError(401, 'Authentication failed with analysis service');
            }

            if (error.message.includes('429')) {
                throw new ApiError(429, 'Analysis service rate limit exceeded');
            }

            if (error.message.includes('timeout')) {
                throw new ApiError(408, 'Analysis service request timeout');
            }
        }

        throw new ApiError(500, 'Failed to process tooth analysis');
    }
};

/**
 * Creates a complete analysis record from request and result
 * @param {AnalysisRequest} request - Original analysis request
 * @param {FinalRecommendation} analysis - Analysis result
 * @returns {AnalysisRecord} Complete analysis record
 */
export const createAnalysisRecord = (
    request: AnalysisRequest,
    analysis: FinalRecommendation
): AnalysisRecord => {
    const record: AnalysisRecord = {
        id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        dentistName: request.dentistName.trim(),
        dentistMobileNumber: request.dentistMobileNumber.trim(),
        toothImage1: request.toothImage1,
        toothImage2: request.toothImage2,
        date: new Date().toISOString(),
        analysis: {
            final_recommendation: analysis
        }
    };

    // Only add patientName if it exists
    if (request.patientName) {
        record.patientName = request.patientName.trim();
    }

    return record;
};