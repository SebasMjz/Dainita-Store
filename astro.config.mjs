// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// Astro config for Vercel + MongoDB APIs
export default defineConfig({
	output: 'server',
	adapter: vercel(),
	security: {
		checkOrigin: false
	}
});
