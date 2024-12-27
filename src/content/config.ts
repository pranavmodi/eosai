import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    image: z.string().optional(),
    date: z.string().transform((str) => new Date(str)),
    author: z.object({
      name: z.string(),
      avatar: z.string()
    }),
    category: z.string(),
    readTime: z.string(),
    draft: z.boolean().optional().default(false)
  })
});

export const collections = {
  'blog': blogCollection,
}; 