import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EcoTwin — Your Carbon Footprint, Visualized",
  description:
    "Upload bank statements or receipts. EcoTwin uses AI to classify spend-based carbon emissions and evolves a living digital organism reflecting your real footprint.",
  keywords: ["carbon footprint", "sustainability", "AI", "climate"],
  authors: [{ name: "EcoTwin" }],
  openGraph: {
    title: "EcoTwin",
    description: "Your carbon footprint as a living digital organism.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${mono.variable} font-sans bg-surface text-zinc-100 antialiased`}
      >
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#18181b",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#f4f4f5",
            },
          }}
        />
      </body>
    </html>
  );
}
