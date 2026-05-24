import type { Metadata } from "next";
import localFont from 'next/font/local';
import Script from 'next/script';
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import BackgroundMusic from "@/components/BackgroundMusic";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Pawan | Founding Engineer",
  description: "Founding engineer focused on robust backend infrastructure and intuitive interfaces.",
  openGraph: {
    title: "Pawan | Founding Engineer",
    description: "Founding engineer focusing on next-generation voice agents and robust backend infrastructure.",
    url: "https://pawann.vercel.app",
    siteName: "Pawan Portfolio",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Pawan Portfolio",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pawan | Founding Engineer",
    description: "Founding engineer focusing on next-generation voice agents and robust backend infrastructure.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: '/icon.svg',
  },
};

const cabinetGrotesk = localFont({
  src: '../../public/fonts/CabinetGrotesk-Variable.ttf',
  variable: '--font-cabinet',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cabinetGrotesk.variable}`}>
      <head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');
          :root {
            --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          }
        `}</style>
      </head>
      <body className="antialiased selection:bg-white/10 selection:text-white overflow-x-hidden">
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
              `}
            </Script>
          </>
        )}
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <div className="w-full max-w-[700px] mx-auto px-6 py-20 flex flex-col min-h-[90vh] relative z-10">
            <Navigation />
            
            <div className="flex-1 w-full flex flex-col justify-center">
              {children}
            </div>
            
            <Footer />
          </div>
          
          <BackgroundMusic />
        </ThemeProvider>
      </body>
    </html>
  );
}
