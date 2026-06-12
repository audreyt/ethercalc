import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://docs.ethercalc.net',
  integrations: [
    starlight({
      title: 'EtherCalc',
      description: 'Multi-user spreadsheet server on Cloudflare Workers',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/audreyt/ethercalc',
        },
      ],
      sidebar: [
        { label: 'Introduction', link: '/' },
        {
          label: 'User guide',
          items: [
            { label: 'Overview', link: '/user-guide/' },
            { label: 'Syntax', link: '/user-guide/syntax/' },
            { label: 'Forms', link: '/user-guide/forms/' },
            { label: 'Tips & tricks', link: '/user-guide/tips/' },
            { label: 'FAQ', link: '/user-guide/faq/' },
          ],
        },
        { label: 'Architecture', link: '/architecture/' },
        { label: 'Self-hosting', link: '/self-host/' },
        { label: 'Oracle testing', link: '/oracle/' },
      ],
    }),
  ],
});