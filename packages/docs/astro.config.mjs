import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://ethercalc.net',
  integrations: [
    starlight({
      title: 'EtherCalc',
      description: 'Multi-user spreadsheet server on Cloudflare Workers',
      social: {
        github: 'https://github.com/audreyt/ethercalc',
      },
      sidebar: [
        { label: 'Introduction', link: '/' },
        { label: 'Architecture', link: '/architecture/' },
        { label: 'Self-hosting', link: '/self-host/' },
        { label: 'Oracle testing', link: '/oracle/' },
      ],
    }),
  ],
});