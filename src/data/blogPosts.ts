export interface BlogPost {
  title: string;
  excerpt: string;
  image: string;
  date: string;
  author: {
    name: string;
    avatar: string;
  };
  category: string;
  readTime: string;
}

export const blogPosts: BlogPost[] = [
    {
    title: "Future of AI in Enterprise",
    excerpt: "Discover how artificial intelligence is reshaping enterprise operations and decision-making processes in 2024 and beyond.",
    image: "/blog/business-transform.jpg",
    date: "Mar 15, 2024",
    author: {
      name: "Dr. Emily Chen",
      avatar: "/authors/emily-chen.jpg"
    },
    category: "AI Trends",
    readTime: "5 min"
  },
  {
    title: "Precise MRI",
    excerpt: "How artificial intelligence is revolutionizing MRI analysis and improving diagnostic accuracy in medical imaging.",
    image: "/blog/precise-mri.jpg",
    date: "Mar 10, 2024",
    author: {
      name: "Dr. Sarah Chen",
      avatar: "/team/sarah-chen.jpg"
    },
    category: "Case Study",
    readTime: "6 min"
  }
];

export const categories = [...new Set(blogPosts.map(post => post.category))];