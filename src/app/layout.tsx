import type { Metadata } from "next";
import localFont from 'next/font/local';
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const cabinetGrotesk = localFont({
  src: '../../public/fonts/CabinetGrotesk-Variable.ttf',
  variable: '--font-cabinet',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Pawan - Portfolio",
  description: "Pawan Kalyan. Building voice agents at Cortex.",
  icons: {
    icon: 'https://avatars.githubusercontent.com/u/178455858?v=4'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cabinetGrotesk.variable}>
      <body className="antialiased min-h-screen relative text-[#e5e5e5] pb-12 font-cabinet">
        {/* Extremely subtle top atmospheric glow */}
        <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-neutral-800/10 to-transparent pointer-events-none" />
        
        {/* Core Container Wrapper - Width is now handled by pages */}
        <div className="w-full mx-auto px-6 py-20 flex flex-col min-h-[90vh] relative z-10">
          <div className="w-full max-w-[700px] mx-auto">
            <Navigation />
          </div>
          
          <div className="flex-1 w-full flex flex-col">
            {children}
          </div>
          
          <div className="w-full max-w-[700px] mx-auto">
            <Footer />
          </div>
        </div>
      </body>
    </html>
  );
}
