import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import LiveStatsBanner from "@/components/LiveStatsBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HospitalAI — Smart Queue Predictor",
  description: "Predict hospital wait times, get recommendations, and chat with an AI assistant.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <Navbar />
        <LiveStatsBanner />
        <main className="flex-1">{children}</main>
        <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-200">
          HospitalAI &copy; 2025 — Hackathon Project
        </footer>
      </body>
    </html>
  );
}
