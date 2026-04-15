import { getBlogPost, allBlogs } from "@/data/blog";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogPostClient from "./BlogPostClient";

type BlogPageProps = {
  params: Promise<{ slug: string }>;
};

// Pre-render pages at build time
export async function generateStaticParams() {
  return allBlogs.map((post) => ({
    slug: post.slug,
  }));
}

// Dynamically generate SEO metadata based on the slug
export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const post = getBlogPost(resolvedParams.slug);
  if (!post) {
    return { title: 'Post Not Found | NexoPost' };
  }
  
  return {
    title: post.en.title + " | NexoPost Blog",
    description: post.en.excerpt,
    keywords: post.en.keywords.join(", "),
    openGraph: {
      title: post.en.title,
      description: post.en.excerpt,
      type: "article",
    }
  };
}

export default async function SingleBlogPage({ params }: BlogPageProps) {
  const resolvedParams = await params;
  const post = getBlogPost(resolvedParams.slug);
  
  if (!post) {
    notFound();
  }

  return <BlogPostClient post={post} />;
}
