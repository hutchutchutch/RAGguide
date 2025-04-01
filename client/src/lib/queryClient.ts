import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Mock data for development mode
import { mockApiResponses } from "./mockData";

// Check if dev mode is enabled
const DEV_MODE = import.meta.env.VITE_DEV_MODE === "true";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Log dev mode status
console.log(`Running in ${DEV_MODE ? "DEVELOPMENT" : "PRODUCTION"} mode`);

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // In dev mode, return mock responses
  if (DEV_MODE) {
    console.log(`DEV MODE: ${method} ${url}`);
    
    // Check if we have a mock for this endpoint
    const mockKey = `${method}:${url}`;
    if (mockApiResponses[mockKey]) {
      console.log(`DEV MODE: Returning mock data for ${mockKey}`);
      return new Response(JSON.stringify(mockApiResponses[mockKey]), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Default mock for other requests
    console.log(`DEV MODE: No mock found for ${mockKey}, returning empty success`);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
  
  // In production mode, make the actual API request
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // In dev mode, return mock responses
    if (DEV_MODE) {
      const endpoint = queryKey[0] as string;
      console.log(`DEV MODE: GET ${endpoint}`);
      
      // Check if we have a mock for this endpoint
      const mockKey = `GET:${endpoint}`;
      if (mockApiResponses[mockKey]) {
        console.log(`DEV MODE: Returning mock data for ${mockKey}`);
        return mockApiResponses[mockKey];
      }
      
      // Default mock for other requests
      console.log(`DEV MODE: No mock found for ${mockKey}, returning empty array`);
      return [];
    }
    
    // In production mode, make the actual API request
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
