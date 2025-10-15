import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  BookOpen,
  Instagram,
  Moon,
  PenSquare,
  Send,
  Sun,
  Twitter,
  Youtube,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/components/i18n/SimpleI18n';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { useTheme } from './ThemeProvider';

const navColumns = [
  {
    key: 'catalog',
    links: [
      { key: 'all', href: '/catalog' },
      { key: 'new', href: '/catalog?tag=new' },
      { key: 'popular', href: '/catalog?tag=popular' },
      { key: 'collections', href: '/collections' },
    ],
  },
  {
    key: 'authors',
    links: [
      { key: 'submit', href: '/authors/submit' },
      { key: 'guide', href: '/authors/guide' },
      { key: 'royalties', href: '/legal/royalties' },
      { key: 'community', href: '/community/authors' },
    ],
  },
  {
    key: 'about',
    links: [
      { key: 'about', href: '/about' },
      { key: 'blog', href: '/blog' },
      { key: 'roadmap', href: '/roadmap' },
      { key: 'careers', href: '/careers' },
    ],
  },
  {
    key: 'support',
    links: [
      { key: 'help', href: '/help' },
      { key: 'contact', href: '/contact' },
      { key: 'faq', href: '/faq' },
      { key: 'report', href: '/support/report' },
    ],
  },
];

const socials = [
  { key: 'telegram', href: 'https://t.me/kasbook', icon: Send },
  { key: 'instagram', href: 'https://instagram.com/kasbook', icon: Instagram },
  { key: 'x', href: 'https://twitter.com/kasbook', icon: Twitter },
  { key: 'youtube', href: 'https://youtube.com/@kasbook', icon: Youtube },
];

const legalLinks = [
  { key: 'privacy', href: '/legal/privacy' },
  { key: 'terms', href: '/legal/terms' },
  { key: 'offer', href: '/legal/offer' },
];

export default function Footer() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const currentYear = new Date().getFullYear();
  const nextTheme = theme === 'light' ? 'dark' : 'light';
  const ThemeIcon = theme === 'light' ? Moon : Sun;

  return (
    <footer className="mt-20 border-t border-border bg-gradient-to-b from-background via-background to-muted/40 text-foreground">
      <div className="container mx-auto flex flex-col gap-12 px-4 py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {navColumns.map((column) => (
              <nav key={column.key} aria-labelledby={`footer-${column.key}-heading`} className="space-y-4">
                <h3 id={`footer-${column.key}-heading`} className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {t(`footer.columns.${column.key}.title`)}
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {column.links.map((link) => (
                    <li key={link.key}>
                      <Link
                        to={link.href}
                        className="group flex items-center gap-2 transition-colors hover:text-primary"
                      >
                        <span>{t(`footer.columns.${column.key}.links.${link.key}`)}</span>
                        <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
                {column.key === 'support' && (
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {t('footer.actions.languageLabel')}
                      </span>
                      <div className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 shadow-sm">
                        <LanguageSwitcher />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {t('footer.actions.theme.label')}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start border-border/60 bg-background/80 text-sm shadow-sm hover:bg-muted"
                        onClick={() => toggleTheme()}
                        aria-label={t('footer.actions.theme.aria', { theme: t(`footer.actions.theme.${nextTheme}`) })}
                      >
                        <ThemeIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                        {t('footer.actions.theme.toggle', {
                          theme: t(`footer.actions.theme.${nextTheme}`),
                        })}
                      </Button>
                    </div>
                  </div>
                )}
              </nav>
            ))}
          </div>

          <div className="flex flex-col justify-between rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-primary/15 to-secondary/20 p-8 text-primary-foreground shadow-lg">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                <PenSquare className="h-4 w-4" aria-hidden="true" />
                <span>{t('footer.cta.badge')}</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-wide text-primary-foreground/80">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/30 text-primary-foreground">
                  <BookOpen className="h-5 w-5" aria-hidden="true" />
                </div>
                <span>{t('footer.cta.tagline')}</span>
              </div>
              <h3 className="text-2xl font-semibold leading-tight sm:text-3xl">
                {t('footer.cta.title')}
              </h3>
              <p className="max-w-md text-sm text-primary-foreground/85">
                {t('footer.cta.description')}
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to="/authors/submit">{t('footer.cta.primary')}</Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto border-border/50 bg-background/70 text-foreground hover:bg-background">
                <Link to="/authors/guide">{t('footer.cta.secondary')}</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-border/60 pt-8">
          <div className="flex flex-col gap-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-medium text-foreground">
                {t('footer.bottom.copyright', { year: currentYear })}
              </span>
              {legalLinks.map((link) => (
                <Link key={link.key} to={link.href} className="transition hover:text-primary">
                  {t(`footer.bottom.${link.key}`)}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-3">
              {socials.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.key}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t(`footer.socials.${social.key}`)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background/70 text-muted-foreground transition hover:border-primary/50 hover:text-primary"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
