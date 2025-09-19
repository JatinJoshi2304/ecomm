import { RESPONSE_MESSAGES } from "../constants/responseMessages";

type SuccessKeys = keyof typeof RESPONSE_MESSAGES.SUCCESS;
type ErrorKeys = keyof typeof RESPONSE_MESSAGES.ERROR;

export function successResponse<T>(
  messageKey: SuccessKeys,
  data?: T,
  statusCode: number = RESPONSE_MESSAGES.STATUS_CODES.SUCCESS
) {
  return {
    success: true,
    message: RESPONSE_MESSAGES.SUCCESS[messageKey],
    data: data || null,
    statusCode,
  };
}

export function errorResponse(
  messageKey: ErrorKeys,
  statusCode: number = RESPONSE_MESSAGES.STATUS_CODES.SERVER_ERROR,
  error?: string
) {
  return {
    success: false,
    message: RESPONSE_MESSAGES.ERROR[messageKey],
    error: error || null,
    statusCode,
  };
}
