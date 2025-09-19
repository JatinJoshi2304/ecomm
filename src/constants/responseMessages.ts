export const RESPONSE_MESSAGES = {
    SUCCESS: {
      FETCH: "Data fetched successfully",
      CREATE: "Record created successfully",
      UPDATE: "Record updated successfully",
      DELETE: "Record deleted successfully",
    },
    ERROR: {
      SERVER_ERROR: "Internal server error",
      NOT_FOUND: "Resource not found",
      VALIDATION_FAILED: "Validation failed",
      UNAUTHORIZED: "Unauthorized access",
      FORBIDDEN: "Access denied",
    },
    STATUS_CODES: {
      SUCCESS: 200,
      CREATED: 201,
      BAD_REQUEST: 400,
      UNAUTHORIZED: 401,
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      SERVER_ERROR: 500,
    },
  } as const;
  