import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger } from "@/lib/logger";
import type { ApiFailure, ApiSuccess } from "@/types";

/** Application error that maps cleanly onto an HTTP response. */
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
    public details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const Errors = {
  unauthorized: (message = "You must be signed in.") =>
    new AppError("UNAUTHORIZED", message, 401),
  forbidden: (message = "You do not have access to this resource.") =>
    new AppError("FORBIDDEN", message, 403),
  notFound: (message = "Resource not found.") => new AppError("NOT_FOUND", message, 404),
  conflict: (message: string) => new AppError("CONFLICT", message, 409),
  badRequest: (message: string, details?: unknown) =>
    new AppError("BAD_REQUEST", message, 400, details),
};

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data } satisfies ApiSuccess<T>, init);
}

export function created<T>(data: T) {
  return ok(data, { status: 201 });
}

export function fail(code: string, message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { success: false, error: { code, message, details } } satisfies ApiFailure,
    { status },
  );
}

/**
 * Wraps a route handler so thrown {@link AppError}s and Zod validation errors
 * are converted into the platform's single API response shape.
 */
export function route<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse>,
) {
  return async (...args: Args): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof AppError) {
        return fail(error.code, error.message, error.status, error.details);
      }
      if (error instanceof ZodError) {
        return fail("VALIDATION_ERROR", "The submitted data is invalid.", 422, {
          issues: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        });
      }
      logger.error("Unhandled API error", error);
      return fail("INTERNAL_ERROR", "Something went wrong. Please try again.", 500);
    }
  };
}
