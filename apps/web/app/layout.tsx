import type { Metadata, Viewport } from 'next';
import {
  Geist,
  Geist_Mono
} from 'next/font/google';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
});

export const metadata: Metadata = {
  applicationName: 'NEXUS',
  title: 'NEXUS — Personal AI OS',
  description: 'Trợ lý AI cá nhân quản lý công việc, tài chính và lịch trình.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/nexus-icon.svg',
    apple: '/nexus-icon.svg'
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NEXUS'
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#050505',
  colorScheme: 'dark'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
    >
      <body
        suppressHydrationWarning
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
          min-h-screen
          antialiased
        `}
      >
        {children}
      </body>
    </html>
  );
}
