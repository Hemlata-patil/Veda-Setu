const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type ApiOptions = RequestInit & {
  body?: BodyInit | null;
};

export async function apiFetch<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get("content-type");

  const data = contentType?.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : `API request failed with status ${response.status}`;

    throw new Error(message);
  }

  return data as T;
}

export const api = {
  get: <T>(endpoint: string, options?: ApiOptions) =>
    apiFetch<T>(endpoint, { method: "GET", ...(options || {}) }),

  post: <T>(endpoint: string, body?: unknown, options?: ApiOptions) =>
    apiFetch<T>(endpoint, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...(options || {}),
    }),

  put: <T>(endpoint: string, body?: unknown, options?: ApiOptions) =>
    apiFetch<T>(endpoint, {
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...(options || {}),
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: ApiOptions) =>
    apiFetch<T>(endpoint, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...(options || {}),
    }),

  delete: <T>(endpoint: string, options?: ApiOptions) =>
    apiFetch<T>(endpoint, { method: "DELETE", ...(options || {}) }),
};

export const apiGet = api.get;
export const apiPost = api.post;
export const apiPut = api.put;
export const apiPatch = api.patch;
export const apiDelete = api.delete;
