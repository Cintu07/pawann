import { Metadata } from 'next';
import ConverterClient from './ConverterClient';

export const metadata: Metadata = {
  title: 'Writing studio',
  description: 'Private in-browser writing studio for the blog.',
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

export default function BlogConverterPage() {
  return <ConverterClient />;
}
