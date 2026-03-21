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
import { blogsPart3 } from "./blog3";
import { blogsPart4 } from "./blog4";
import { blogsPart5 } from "./blog5";

export const allBlogs: BlogPost[] = [
  ...postsPart1,
  ...postsPart2,
  ...blogsPart3,
  ...blogsPart4,
  ...blogsPart5
];

// Utility function to get a specific blog post
export function getBlogPost(slug: string): BlogPost | undefined {
  return allBlogs.find((post) => post.slug === slug);
}
