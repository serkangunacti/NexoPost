import { getBlogPost, allBlogs } from "@/data/blog";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogPostClient from "./BlogPostClient";

// Pre-render pages at build time
export async function generateStaticParams() {
  return allBlogs.map((post) => ({
    slug: post.slug,
  }));
}

// Dynamically generate SEO metadata based on the slug
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  // Await params object if Next.js version requires it, though usually direct access is fine.
  const post = getBlogPost(params.slug);
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

export default function SingleBlogPage({ params }: { params: { slug: string } }) {
  const post = getBlogPost(params.slug);
  
  if (!post) {
    notFound();
  }

  return <BlogPostClient post={post} />;
}
