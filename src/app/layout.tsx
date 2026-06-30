import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Pacifico } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const pacifico = Pacifico({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pacifico",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pioneer Holidays — Kerala Bus Charters Since 1947",
  description:
    "Pioneer Holidays — Kerala's most trusted tourist bus company since 1947. Tours & Travels, Pilgrimage Tours, Holiday Packages, and Corporate Travel.",
  keywords: "Pioneer Holidays, tourist bus booking, Kerala pilgrimage tours, group travel, corporate travel, charter bus Kerala",
  openGraph: {
    title: "Pioneer Holidays — Kerala Bus Charters Since 1947",
    description: "Kerala's most trusted tourist bus company since 1947.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${pacifico.variable}`}>
      <body className="min-h-screen bg-slate-50 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
