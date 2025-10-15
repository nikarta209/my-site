import { NotebookPen, PenSquare } from 'lucide-react';

export const HERO_TAB_ORDER = [
  {
    id: 'author-submit',
    type: 'cta',
    labelKey: 'home.hero.tabs.becomeAuthor',
    headingKey: 'home.hero.cta.publish.title',
    descriptionKey: 'home.hero.cta.publish.description',
    primaryCta: { labelKey: 'home.hero.cta.publish.primary', href: '/authors/submit' },
    secondaryCta: { labelKey: 'home.hero.cta.publish.secondary', href: '/authors/guide' },
    icon: PenSquare,
    gradient: 'from-purple-600 via-fuchsia-600 to-rose-500',
  },
  {
    id: 'author-guide',
    type: 'cta',
    labelKey: 'home.hero.tabs.howTo',
    headingKey: 'home.hero.cta.guide.title',
    descriptionKey: 'home.hero.cta.guide.description',
    primaryCta: { labelKey: 'home.hero.cta.guide.primary', href: '/authors/guide' },
    secondaryCta: { labelKey: 'home.hero.cta.guide.secondary', href: '/authors/submit' },
    icon: NotebookPen,
    gradient: 'from-indigo-600 via-blue-600 to-cyan-500',
  },
  {
    id: 'top-1',
    type: 'books',
    labelKey: 'home.hero.tabs.bestsellers1',
    chunkIndex: 0,
  },
  {
    id: 'top-2',
    type: 'books',
    labelKey: 'home.hero.tabs.bestsellers2',
    chunkIndex: 1,
  },
  {
    id: 'top-3',
    type: 'books',
    labelKey: 'home.hero.tabs.bestsellers3',
    chunkIndex: 2,
  },
];

export const HERO_ROTATION_INTERVAL = 7000;
export const HERO_TOUCH_THRESHOLD = 48;
