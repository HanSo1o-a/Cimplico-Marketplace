import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export async function apiRequest(
  method: string,
  endpoint: string,
  data?: any
): Promise<any> {
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(endpoint, options);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "API request failed");
  }

  return response.json();
}

type GetQueryFnOptions = {
  on401?: "returnNull";
};

export function getQueryFn(options?: GetQueryFnOptions) {
  return async function ({ queryKey }: { queryKey: readonly unknown[] }) {
    try {
      const endpoint = typeof queryKey[0] === "string" ? queryKey[0] : undefined;
      if (!endpoint) throw new Error("queryKey[0] (endpoint) is required");
      return await apiRequest("GET", endpoint);
    } catch (error: any) {
      if (error.message?.includes("401") && options?.on401 === "returnNull") {
        return null;
      }
      throw error;
    }
  };
}
