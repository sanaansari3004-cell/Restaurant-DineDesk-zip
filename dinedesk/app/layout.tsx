import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { CartProvider } from "@/lib/cart";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DineDesk — Bistro & Kitchen",
  description:
    "Digital menu, table reservations, live order tracking and a kitchen dashboard for a warm neighbourhood bistro.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="paper min-h-screen font-sans">
        <CartProvider>
          <Navbar />
          <main>{children}</main>
          <footer className="mt-20 border-t border-espresso/15">
            <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-espresso/60 md:flex-row md:items-center md:justify-between">
              <p className="font-serif text-lg text-espresso">DineDesk</p>
              <p>12, Gourmet Lane, Sector 29, Gurugram · 11:00 – 23:00 daily</p>
              <p className="text-xs">Demo build — payments are simulated, no real money moves.</p>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
