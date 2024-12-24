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
    title: "The Future of AI in Enterprise",
    excerpt: "Discover how artificial intelligence is reshaping enterprise operations and decision-making processes in 2024 and beyond.",
    image: "/blog/ai-enterprise.jpg",
    date: "Mar 15, 2024",
    author: {
      name: "Dr. Emily Chen",
      avatar: "/authors/emily-chen.jpg"
    },
    category: "AI Trends",
    readTime: "5 min"
  },
  // {
  //   title: "The Future of AI in Enterprise",
  //   excerpt: "Discover how artificial intelligence is reshaping enterprise operations and decision-making processes in 2024 and beyond.",
  //   image: "/blog/ai-enterprise.jpg",
  //   date: "Mar 15, 2024",
  //   author: {
  //     name: "Dr. Emily Chen",
  //     avatar: "/authors/emily-chen.jpg"
  //   },
  //   category: "AI Trends",
  //   readTime: "5 min"
  // },
  // {
  //   title: "Machine Learning Best Practices",
  //   excerpt: "A comprehensive guide to implementing machine learning solutions in your organization while avoiding common pitfalls.",
  //   image: "/blog/ml-practices.jpg",
  //   date: "Mar 12, 2024",
  //   author: {
  //     name: "James Wilson",
  //     avatar: "/authors/james-wilson.jpg"
  //   },
  //   category: "Machine Learning",
  //   readTime: "8 min"
  // },
  // {
  //   title: "Ethical AI Development",
  //   excerpt: "Understanding the importance of ethical considerations in AI development and implementation.",
  //   image: "/blog/ethical-ai.jpg",
  //   date: "Mar 10, 2024",
  //   author: {
  //     name: "Sarah Martinez",
  //     avatar: "/authors/sarah-martinez.jpg"
  //   },
  //   category: "Ethics",
  //   readTime: "6 min"
  // },
  // {
  //   title: "AI-Driven Customer Experience",
  //   excerpt: "How AI is transforming customer experience and service delivery across industries.",
  //   image: "/blog/customer-exp.jpg",
  //   date: "Mar 8, 2024",
  //   author: {
  //     name: "Michael Chang",
  //     avatar: "/authors/michael-chang.jpg"
  //   },
  //   category: "Customer Service",
  //   readTime: "4 min"
  // },
  // {
  //   title: "Natural Language Processing Advances",
  //   excerpt: "Recent breakthroughs in NLP and their practical applications in business contexts.",
  //   image: "/blog/nlp-advances.jpg",
  //   date: "Mar 5, 2024",
  //   author: {
  //     name: "Dr. Lisa Brown",
  //     avatar: "/authors/lisa-brown.jpg"
  //   },
  //   category: "NLP",
  //   readTime: "7 min"
  // },
  // {
  //   title: "AI Security Considerations",
  //   excerpt: "Essential security practices for implementing AI systems in your organization.",
  //   image: "/blog/ai-security.jpg",
  //   date: "Mar 3, 2024",
  //   author: {
  //     name: "Robert Taylor",
  //     avatar: "/authors/robert-taylor.jpg"
  //   },
  //   category: "Security",
  //   readTime: "6 min"
  // }
];

export const categories = [...new Set(blogPosts.map(post => post.category))];