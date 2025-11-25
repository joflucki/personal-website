// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { DEFAULT_LOCALE } from './src/consts';

// https://astro.build/config
export default defineConfig({
	site: 'https://jonas-flueckiger.ch',
	integrations: [mdx(), sitemap()],
	i18n: {
		locales: ["en-us", "fr-ch", "de-ch"],
		defaultLocale: DEFAULT_LOCALE,
		routing: {
			prefixDefaultLocale: true,
		}
	}
});
