import type { Metadata } from 'next';
import { Inter, Fredoka } from 'next/font/google';
import 'mdb-react-ui-kit/dist/css/mdb.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const fredoka = Fredoka({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'KidLearnio — Curiosity-Sparking Educational Songs',
  description:
    'Create educational song prompts for Suno AI. Transform any topic into fun, memorable music for K-12 students.',
  keywords: [
    'education',
    'music',
    'AI',
    'Suno',
    'children',
    'learning',
    'songs',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${fredoka.variable}`}>
      <body>{children}</body>
    </html>
  );
}
