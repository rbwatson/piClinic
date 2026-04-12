/**
 * queryClient.ts
 * Shared React Query client instance.
 * Centralised here so it can be imported by both main.tsx and tests.
 */

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't refetch on window focus in a clinic kiosk context
      refetchOnWindowFocus: false,
      // Retry once on failure before showing an error
      retry: 1,
      staleTime: 30_000,
    },
  },
})
