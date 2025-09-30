export const metadata = {
  title: process.env.NEXT_PUBLIC_SITE_NAME || 'Nivo',
  description: 'Advanced Company Analysis',
};

import './globals.css';
import React from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}

