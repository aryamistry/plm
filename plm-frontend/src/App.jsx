import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import router from './router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#161b27',
            border: '1px solid #2a3347',
            color: '#f1f5f9',
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '0.875rem',
          },
        }}
      />
    </QueryClientProvider>
  );
}
