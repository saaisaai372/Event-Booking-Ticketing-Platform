import type { ApiResponse } from "@/types";

/** Error thrown for any non-success API envelope. */
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type FetchOptions = Omit<RequestInit, "body"> & { body?: unknown };

/**
 * Typed wrapper around `fetch` that unwraps the platform's API envelope and
 * throws an {@link ApiError} on failure.
 */
export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;

  const response = await fetch(path, {
    ...rest,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  let json: ApiResponse<T> | null = null;
  try {
    json = (await response.json()) as ApiResponse<T>;
  } catch {
    json = null;
  }

  if (!json || !json.success) {
    throw new ApiError(
      json?.error.code ?? "NETWORK_ERROR",
      json?.error.message ?? "Something went wrong. Please try again.",
      response.status,
      json?.error.details,
    );
  }

  return json.data;
}
