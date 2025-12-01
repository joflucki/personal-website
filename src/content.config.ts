import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { LANGUAGES } from './i18n/ui';

const LANGUAGE_KEYS = Object.keys(LANGUAGES) as [keyof typeof LANGUAGES];

const posts = defineCollection({
	// Load Markdown and MDX files in the `src/content/{locale}/posts/` directory.
	loader: glob({ base: './src/content/posts', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			locale: z.enum(LANGUAGE_KEYS),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			tags: z.array(z.string()),
		}),
});

const projects = defineCollection({
	// Load Markdown and MDX files in the `src/content/projects/` directory.
	loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			locale: z.enum(LANGUAGE_KEYS),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: image().optional(),
		}),
});

export const collections = { posts, projects };
