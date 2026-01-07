import { useState } from 'react'
import './App.css'
import { ConfigProvider } from 'antd'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppRoutes } from './routes'

const queryClient = new QueryClient();

function App() {
  const router = createBrowserRouter(AppRoutes, {
    basename: import.meta.env.VITE_BASE_URL,
    // basename: "/",
    // errorElement: <ErrorPage />,
  });

  return (
      <>
        <ConfigProvider
          theme={{
            token: {
              fontFamily: 'Inter',
              borderRadius: 5,
            },
            components: {
              Table: {
                default: {
                  size: "middle",
                  bodered: true,
                  scroll: { x: "max-content"}
                },
              },
            },
          }}
        >
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>

        </ConfigProvider>
      </>
  )
}

export default App;
