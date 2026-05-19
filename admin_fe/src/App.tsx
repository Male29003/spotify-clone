// src/App.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRoutes } from './routes';
import { Toaster } from 'react-hot-toast';
import ConfirmModal from './components/shared/feedback/ConfirmModal';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 5*60*1000
    },
  }
});

const App = () => {
  const router = createBrowserRouter(AppRoutes, {
    basename: import.meta.env.VITE_BASE_URL,
  });

  return (
    <QueryClientProvider client={queryClient}>
      
      <RouterProvider router={router} />

      <ConfirmModal />
      
      <Toaster
        position="top-right" 
        toastOptions={{
            duration: 3000,
            style: {
                background: '#333',
                color: '#fff',
            },
            success: {
                iconTheme: { primary: '#1db954', secondary: '#fff' },
            },
            error: {
                iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
        }} 
      />
    </QueryClientProvider>
  );
}

export default App;