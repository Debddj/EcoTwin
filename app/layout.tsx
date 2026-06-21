import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EcoTwin — Your Carbon Footprint, Visualized as a Living Thing",
  description: "Ingest credit statements or receipt photos via Gemini AI to evolve your digital twin ecosystem, model green lifestyle shifts, and get direct carbon coaching.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#050505] text-[#e0e0e0] font-sans">
        {children}
      </body>
    </html>
  );
}
