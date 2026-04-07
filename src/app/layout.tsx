import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

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
    <html lang="en">
      <body className="antialiased min-h-screen relative text-[#e5e5e5] pb-12">
        {/* Extremely subtle top atmospheric glow */}
        <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-neutral-800/10 to-transparent pointer-events-none" />
        
        {/* Core Container Wrapper */}
        <div className="w-full max-w-[700px] mx-auto px-6 py-20 flex flex-col min-h-[90vh] relative z-10">
          <Navigation />
          
          <div className="flex-1 w-full flex flex-col justify-center">
            {children}
          </div>
          
          <Footer />
        </div>
      </body>
    </html>
  );
}
