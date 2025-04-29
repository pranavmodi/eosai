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
    title: "Why AI is the Future of Sales and Support",
    excerpt: "AI is no longer a shiny sidekick; it's already outperforming human reps in speed, accuracy, and customer satisfaction. Here's why—and how PossibleMinds Supportbot makes it painless.",
    image: "/blog/prodbot.jpg",
    date: "May 15, 2024",
    author: {
      name: "PossibleMinds Team",
      avatar: "/team/pmteam.jpg"
    },
    category: "AI & Automation",
    readTime: "6 min"
  },
  {
    title: "Future of AI in Enterprise",
    excerpt: "Discover how artificial intelligence is reshaping enterprise operations and decision-making processes in 2024 and beyond.",
    image: "/blog/business-transform.jpg",
    date: "Mar 15, 2024",
    author: {
      name: "PossibleMinds Team",
      avatar: "/team/pmteam.jpg"
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
      name: "PossibleMinds Team",
      avatar: "/team/pmteam.jpg"
    },
    category: "Case Study",
    readTime: "6 min"
  }
];

export const categories = [...new Set(blogPosts.map(post => post.category))];