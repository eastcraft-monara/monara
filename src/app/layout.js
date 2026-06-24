import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import WalletProvider from "@/wallet/WalletProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Eastcraft Monara",
  description: "Sign to Fight. Climb the Monara.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <div className="md:hidden fixed inset-0 z-[9999] bg-[#0D0A0E] flex flex-col items-center justify-center p-8 text-center border-8 border-[#C8334A]">
          <h1 className="text-2xl font-serif text-[#D4A853] mb-4">DESKTOP REQUIRED</h1>
          <p className="font-mono text-[#E8E2D9]">
            Eastcraft Monara requires a webcam and desktop browser to track ASL gestures accurately. 
            Please open this game on a computer.
          </p>
        </div>
        <div className="hidden md:block">
          <WalletProvider>
            {children}
          </WalletProvider>
        </div>
      </body>
    </html>
  );
}
