// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Research Wizard',
  tagline: 'Your AI-Powered Research Management Tool',
  favicon: '/img/favicon.ico',

  // Set the production url of your site here
  url: 'https://www.rwiz.eu',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'alaaet', // Usually your GitHub org/user name.
  projectName: 'research-wizard', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  plugins: [
    // [
    //   '@docusaurus/plugin-sitemap',
    //   {
    //     changefreq: 'weekly',
    //     priority: 0.5,
    //     filename: 'sitemap.xml',
    //   },
    // ],
  ],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/alaaet/research_wizard/tree/main/website/',
        },
        // blog: {
        //   showReadingTime: true,
        //   feedOptions: {
        //     type: ['rss', 'atom'],
        //     xslt: true,
        //   },
        //   // Please change this to your repo.
        //   // Remove this to remove the "edit this page" links.
        //   editUrl:
        //     'https://github.com/alaaet/research_wizard/tree/main/website/',
        //   // Useful options to enforce blogging best practices
        //   onInlineTags: 'warn',
        //   onInlineAuthors: 'warn',
        //   onUntruncatedBlogPosts: 'warn',
        // },
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
          filename: 'sitemap.xml',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: '/img/rwiz.png',
      metadata: [
        { name: 'description', content: 'Research Wizard: AI-powered research management, literature discovery, and drafting. Organize, search, and write research with advanced AI agents.' },
        { name: 'keywords', content: 'research, AI, literature, management, drafting, academic, research wizard, organize, search, write, science' },
      ],
      navbar: {
        title: 'Research Wizard',
        logo: {
          alt: 'Research Wizard Logo',
          src: '/img/rwiz.png',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'userGuideSidebar',
            position: 'left',
            label: 'User Guide',
          },
          {
            to: '/docs/download',
            label: 'Download',
            position: 'left',
          },
          {
            to: '/docs/demo',
            label: 'Demo',
            position: 'left',
          },
          // {to: '/blog', label: 'Blog', position: 'left'},
          {
            href: 'https://github.com/alaaet/research_wizard',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Docs',
                to: '/docs/intro',
              },
              {
                label: 'Download',
                to: '/docs/download',
              },
              {
                label: 'Demo',
                to: '/docs/demo',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Contact Support',
                href: 'mailto:info@rwiz.eu',
              },
              {
                label: 'GitHub Issues',
                href: 'https://github.com/alaaet/research_wizard/issues',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/alaaet/research_wizard',
              },
              {
                label: 'Download',
                to: '/docs/download',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Research Wizard. All rights reserved.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
