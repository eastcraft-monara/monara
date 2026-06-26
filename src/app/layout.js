import { Saira, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import WalletProvider from "@/wallet/WalletProvider";

const saira = Saira({
  variable: "--font-saira",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata = {
  title: "Eastcraft Monara",
  description: "American Sign Language Fighting Game",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${saira.variable} ${ibmPlexMono.variable} antialiased`} suppressHydrationWarning>
        <div className="md:hidden fixed inset-0 z-[9999] bg-[#0B0C0F] flex flex-col items-center justify-center p-8 text-center border-8 border-[#D8243A]">
          <h1 className="text-2xl font-sans text-[#E8EAEE] mb-4" style={{ fontFamily: 'var(--font-saira)' }}>DESKTOP REQUIRED</h1>
          <p className="text-[#CAD0D7]" style={{ fontFamily: 'var(--font-ibm-plex)' }}>
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
