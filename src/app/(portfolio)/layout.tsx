import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function PortfolioLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="w-full max-w-[700px] mx-auto px-6 py-20 flex flex-col min-h-[90vh] relative z-10">
      <Navigation />
      <div className="flex-1 w-full flex flex-col justify-center">
        {children}
      </div>
      <Footer />
    </div>
  );
}
