import { NextRequest } from 'next/server';
import { EmailValidatorService } from '@/lib/services/email-validator';
import { 
  createEmailSuccessResponse, 
  createErrorResponse,
  generateRequestId,
  addTracingHeaders,
  getClientInfo 
} from '@/lib/utils/response';
import { logError, ValidationError } from '@/lib/utils/errors';
import { EmailVerifyRequestSchema } from '@/types/api';

const emailValidator = new EmailValidatorService();

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const body = await request.json();
    const validatedData = EmailVerifyRequestSchema.parse(body);
    
    const result = await emailValidator.validateEmail(validatedData.email);
    
    const response = createEmailSuccessResponse(result);
    return addTracingHeaders(response, requestId);
    
  } catch (error) {
    logError(error, {
      requestId,
      client: getClientInfo(request),
      endpoint: '/api/v1/emails/verify',
    });
    
    const response = createErrorResponse(error);
    return addTracingHeaders(response, requestId);
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      throw new ValidationError('Email parameter is required', 'email');
    }
    
    const validatedData = EmailVerifyRequestSchema.parse({ email });
    
    const result = await emailValidator.validateEmail(validatedData.email);
    
    const response = createEmailSuccessResponse(result);
    return addTracingHeaders(response, requestId);
    
  } catch (error) {
    logError(error, {
      requestId,
      client: getClientInfo(request),
      endpoint: '/api/v1/emails/verify (GET)',
    });
    
    const response = createErrorResponse(error);
    return addTracingHeaders(response, requestId);
  }
}