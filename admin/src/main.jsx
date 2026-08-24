import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import App from './App.jsx';
import './styles/app.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // المحتوى بيتغيّر من مكان واحد بس (الأدمن نفسه) — مفيش داعي
      // لإعادة الجلب عند كل رجوع للنافذة
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // 401 معناها الجلسة خلصت — إعادة المحاولة مش هتفيد
        if (error && error.status === 401) return false;
        return failureCount < 2;
      },
      staleTime: 30_000,
    },
  },
});

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename="/admin">
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
