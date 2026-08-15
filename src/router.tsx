import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
        refetchOnWindowFocus: false, // Prevents layout shifts when returning to tab
        retry: 1, // Faster error feedback
      },
    },
  });
 
  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 30000,
    defaultPendingMs: 200, // Show pending component after 200ms
    defaultPendingMinMs: 400, // Avoid flashing for very fast transitions
  });


  return router;
};
