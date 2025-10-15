import { createPageUrl } from '@/utils';

export const HERO_TABS = {
  'authors-submit': {
    id: 'authors-submit',
    type: 'cta',
    titleKey: 'home.hero.becomeAuthor',
    headlineKey: 'home.hero.publishHeadline',
    descriptionKey: 'home.hero.publishDescription',
    primaryCta: { href: createPageUrl('authors/submit'), labelKey: 'home.hero.publishCta' },
    secondaryCta: { href: createPageUrl('authors'), labelKey: 'home.hero.learnMoreCta' },
    accent: 'from-violet-600 via-fuchsia-600 to-orange-500',
    icon: 'PenSquare',
  },
  'authors-guide': {
    id: 'authors-guide',
    type: 'cta',
    titleKey: 'home.hero.prepareManuscript',
    headlineKey: 'home.hero.guideHeadline',
    descriptionKey: 'home.hero.guideDescription',
    primaryCta: { href: createPageUrl('authors/guide'), labelKey: 'home.hero.prepareCta' },
    secondaryCta: { href: createPageUrl('authors/webinars'), labelKey: 'home.hero.eventsCta' },
    accent: 'from-amber-500 via-rose-500 to-purple-600',
    icon: 'LibraryBig',
  },
  'bestsellers-1': {
    id: 'bestsellers-1',
    type: 'books',
    titleKey: 'home.hero.bestsellersOne',
    chunkIndex: 0,
  },
  'bestsellers-2': {
    id: 'bestsellers-2',
    type: 'books',
    titleKey: 'home.hero.bestsellersTwo',
    chunkIndex: 1,
  },
  'bestsellers-3': {
    id: 'bestsellers-3',
    type: 'books',
    titleKey: 'home.hero.bestsellersThree',
    chunkIndex: 2,
  },
};

export const HERO_TAB_ORDER = ['authors-submit', 'authors-guide', 'bestsellers-1', 'bestsellers-2', 'bestsellers-3'];
