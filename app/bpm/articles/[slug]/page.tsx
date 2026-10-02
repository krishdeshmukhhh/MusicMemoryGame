import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ArticlePage, { articleMetadata, articleSlugs, getArticle } from '@/components/ArticlePage';

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return articleSlugs('bpm');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return articleMetadata('bpm', (await params).slug);
}

export default async function BpmArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticle('bpm', slug);
  if (!article) notFound();
  return <ArticlePage kind="bpm" slug={slug} article={article} />;
}
