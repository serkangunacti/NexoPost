export type BlogPost = {
  id: string;
  slug: string;
  date: string;
  readTime: number;
  coverImage: string;
  en: {
    title: string;
    excerpt: string;
    keywords: string[];
    content: string;
  };
  tr: {
    title: string;
    excerpt: string;
    keywords: string[];
    content: string;
  };
};

import { postsPart1 } from "./blog1";
import { postsPart2 } from "./blog2";

export const allBlogs: BlogPost[] = [...postsPart1, ...postsPart2];

// Utility function to get a specific blog post
export function getBlogPost(slug: string): BlogPost | undefined {
  return allBlogs.find((post) => post.slug === slug);
}
