import type { Metadata } from "next";
import { getContributions } from "@/lib/github";
import localFont from 'next/font/local';
import Script from 'next/script';
import "./globals.css";
import BackgroundMusic from "@/components/BackgroundMusic";

// the description carries a pr count, and a hand-typed one goes stale the
// week after you type it. this reads the same live figure the open source
// page uses, so a merge updates the meta description on the next revalidate.
// if github is down getContributions returns live:false and we fall back to
// a sentence with no number in it rather than a wrong number.
export async function generateMetadata(): Promise<Metadata> {
  const { counts, live } = await getContributions();
  const claim =
    live && counts.merged > 0
      ? `self taught. ${counts.merged} pull requests merged into projects i do not own, apache/arrow-rs and tinygrad among them.`
      : "self taught. i send patches to projects i do not own, apache/arrow-rs and tinygrad among them.";

  return {
    metadataBase: new URL("https://pawann.vercel.app"),
    title: "pawan",
    description: claim,
    openGraph: {
      title: "pawan",
      description: claim,
      url: "https://pawann.vercel.app",
      siteName: "pawan",
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Pawan Portfolio" }],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "pawan",
      description: claim,
      images: ["/og-image.png"],
    },
    // src/app/icon.png is my github avatar. next's file convention emits the
    // link tag from that, so nothing is declared here on purpose.
  };
}

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
