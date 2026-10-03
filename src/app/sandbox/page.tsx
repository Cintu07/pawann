import { Metadata } from 'next';
import ConverterClient from './ConverterClient';
import PinGate from './PinGate';

export const metadata: Metadata = {
  title: 'sandbox',
  description: 'Private writing sandbox for the blog.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-video-preview': -1,
      'max-image-preview': 'none',
      'max-snippet': -1,
    },
  },
};

export default function SandboxPage() {
  return (
    <PinGate>
      <ConverterClient />
    </PinGate>
  );
}
