import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ArticlePage, { articleMetadata, articleSlugs, getArticle } from '@/components/ArticlePage';

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return articleSlugs('pitch');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return articleMetadata('pitch', (await params).slug);
}

export default async function PitchArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticle('pitch', slug);
  if (!article) notFound();
  return <ArticlePage kind="pitch" slug={slug} article={article} />;
}
