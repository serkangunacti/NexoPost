import { Metadata } from "next";
import BlogListClient from "./BlogListClient";

export const metadata: Metadata = {
  title: "NexoPost Blog | Social Media Automation Insights",
  description: "Read the latest tips, guides, and strategies for maximizing your social media impact with NexoPost.",
  keywords: "Social Media Blog, Automation Guides, NexoPost Updates, Agency Insights",
  openGraph: {
    title: "NexoPost Blog",
    description: "Discover guides and strategies to master social media automation.",
  }
};

export default function BlogPage() {
  return <BlogListClient />;
}
