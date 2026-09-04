import type { Metadata } from "next";
import localFont from 'next/font/local';
import Script from 'next/script';
import "./globals.css";
import BackgroundMusic from "@/components/BackgroundMusic";

export const metadata: Metadata = {
  metadataBase: new URL("https://pawann.vercel.app"),
  title: "pawan",
  description: "self taught. 27 pull requests merged into projects i do not own, apache/arrow-rs and tinygrad among them.",
  openGraph: {
    title: "pawan",
    description: "self taught. 27 pull requests merged into projects i do not own, apache/arrow-rs and tinygrad among them.",
    url: "https://pawann.vercel.app",
    siteName: "pawan",
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
    title: "pawan",
    description: "self taught. 27 pull requests merged into projects i do not own, apache/arrow-rs and tinygrad among them.",
    images: ["/og-image.png"],
  },
  // src/app/icon.png is my github avatar. next's file convention emits the
  // link tag from that, so nothing is declared here on purpose.
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
      <body className="bg-bg text-ink antialiased selection:bg-gold-bright/30 selection:text-ink overflow-x-hidden">
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
        {children}
        <BackgroundMusic />
      </body>
    </html>
  );
}
