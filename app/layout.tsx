import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Starmonitor - Starlink Tracker",
  description: "Real-time 3D visualization of Starlink satellite positions around Earth. Track satellites in orbit with interactive globe.",
  keywords: "Starlink, satellites, tracking, 3D, space, orbit, real-time, visualization",
  authors: [{ name: "Asyntes" }],
  openGraph: {
    type: "website",
    title: "Starmonitor - Starlink Tracker",
    description: "Real-time 3D visualization of Starlink satellite positions around Earth. Track satellites in orbit with interactive globe.",
    images: [
      {
        url: "https://starmonitor.vercel.app/img/banner.png?v=1",
        alt: "Starmonitor Banner"
      }
    ],
    url: "https://starmonitor.vercel.app",
    siteName: "Starmonitor",
  },
  twitter: {
    card: "summary_large_image",
    title: "Starmonitor - Starlink Tracker",
    description: "Real-time 3D visualization of Starlink satellite positions around Earth. Track satellites in orbit with interactive globe.",
    images: ["https://starmonitor.vercel.app/img/banner.png?v=1"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent"
  },
  formatDetection: {
    telephone: false
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
    shortcut: "/favicon.ico"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
