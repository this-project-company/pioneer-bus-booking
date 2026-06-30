import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pioneer — Premium Tourist Bus Booking",
  description:
    "Book premium tourist buses with Pioneer. Comfortable, reliable, and memorable travel experiences for groups of all sizes.",
  keywords: "tourist bus booking, group travel, charter bus, Pioneer travel",
  openGraph: {
    title: "Pioneer — Premium Tourist Bus Booking",
    description: "Comfortable group travel experiences with Pioneer",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body className="min-h-screen bg-slate-50 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
