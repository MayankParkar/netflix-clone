import { Request, Response, NextFunction } from 'express';

// This function signature with 4 parameters is how Express identifies
// a function as an error handler — the first param is always the error
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Always log the full error on the server for debugging
  console.error(`[ERROR] ${err.message}`);
  console.error(err.stack);

  // But only send a safe, clean message to the client
  // Never expose stack traces to users — security risk
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    // Only include error details in development mode
    ...(process.env.NODE_ENV === 'development' && { error: err.message }),
  });
};
