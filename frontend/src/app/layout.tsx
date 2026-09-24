import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'GenuAI — Company Dashboard',
  description: 'GenuAI Technologies — Structured recruitment intelligence platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1e2535',
                color: '#f0f4ff',
                border: '1px solid #2a3347',
                borderRadius: '8px',
                fontSize: '13.5px',
              },
              success: { iconTheme: { primary: '#22c55e', secondary: '#1e2535' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#1e2535' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
