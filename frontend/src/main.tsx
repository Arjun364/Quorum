import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import './design/tokens.css';
import { queryClient, router } from '@/app';
import { initSession } from '@/features/auth';
import { PointerEffects } from '@/shared';

void initSession();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <PointerEffects />
    </QueryClientProvider>
  </StrictMode>,
);
