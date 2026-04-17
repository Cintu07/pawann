import { Metadata } from 'next';
import { posts } from '../data';
import BlogPostClient from './BlogPostClient';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  
  if (!post) return { title: 'Post Not Found' };

  return {
    title: `${post.title} | Pawan Blog`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      images: [
        {
          url: post.imageURL || '/og-image.png',
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [post.imageURL || '/og-image.png'],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center py-20 max-w-[700px] mx-auto w-full">
        <h1 className="text-2xl text-white mb-4">Post not found</h1>
        <Link href="/blog" className="text-neutral-500 hover:text-white transition-colors uppercase tracking-widest text-xs font-mono flex items-center gap-2">
          <ChevronLeft className="w-4 h-4" /> Back to blog
        </Link>
      </div>
    );
  }

  return <BlogPostClient post={post} />;
}
