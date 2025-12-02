import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'DreamTrade API',
  description: 'Backend API for DreamTrade crypto exchange mobile app',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}