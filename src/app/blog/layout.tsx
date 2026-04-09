import { EB_Garamond } from 'next/font/google';

const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${ebGaramond.variable} font-sans`}>
      {/* 
        The parent layout has a max-w-[700px]. 
        For the blog, we want to expand but stay centered. 
        We'll use negative margins or just adjust the children. 
        Actually, the cleanest way is a broader container if we can.
      */}
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}
