import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./authProvider";
import ClientAppLayout from "./components/ClientAppLayout";

import { ErrorBoundary } from "../components/ErrorBoundary";
import { AuthErrorBoundary } from "../components/AuthErrorBoundary";
import { DataErrorBoundary } from "../components/DataErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CareCall Dashboard",
  description: "Healthcare follow-up system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ErrorBoundary errorType="ui">
          <AuthErrorBoundary>
            <AuthProvider>
              <DataErrorBoundary>
                <ClientAppLayout>{children}</ClientAppLayout>
              </DataErrorBoundary>
            </AuthProvider>
          </AuthErrorBoundary>
        </ErrorBoundary>
      </body>
    </html>
  );
}
