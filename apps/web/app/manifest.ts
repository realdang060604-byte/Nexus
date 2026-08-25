import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'NEXUS — Personal AI OS',
    short_name: 'NEXUS',
    description: 'Trợ lý AI cá nhân quản lý công việc, tài chính và lịch trình.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#050505',
    theme_color: '#050505',
    categories: ['productivity', 'finance', 'utilities'],
    lang: 'vi',
    icons: [
      {
        src: '/nexus-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any'
      },
      {
        src: '/nexus-icon-maskable.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable'
      }
    ]
  };
}
