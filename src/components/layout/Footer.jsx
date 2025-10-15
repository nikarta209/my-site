import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Youtube, Send, ArrowRight, PenSquare, Moon, Sun } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { LanguageSwitcher } from '../i18n/LanguageSwitcher';
import { useTranslation } from '../i18n/SimpleI18n';
import { useTheme } from './ThemeProvider';
import { Button } from '@/components/ui/button';

const sections = (t) => [
  {
    title: t('footer.catalog'),
    links: [
      { label: t('footer.links.allBooks'), href: createPageUrl('Catalog') },
      { label: t('footer.links.newReleases'), href: createPageUrl('Catalog') + '?sort=newest' },
      { label: t('footer.links.bestSellers'), href: createPageUrl('Catalog') + '?sort=bestseller' },
      { label: t('footer.links.collections'), href: createPageUrl('Novelties') },
    ],
  },
  {
    title: t('footer.authors'),
    links: [
      { label: t('footer.links.submitBook'), href: '/authors/submit' },
      { label: t('footer.links.authorGuide'), href: '/authors/guide' },
      { label: t('footer.links.royalties'), href: '/legal/royalties' },
      { label: t('footer.links.events'), href: '/authors/webinars' },
    ],
  },
  {
    title: t('footer.about'),
    links: [
      { label: t('footer.links.aboutProject'), href: '/about' },
      { label: t('footer.links.blog'), href: '/blog' },
      { label: t('footer.links.partners'), href: '/partners' },
      { label: t('footer.links.careers'), href: '/careers' },
    ],
  },
  {
    title: t('footer.support'),
    links: [
      { label: t('footer.links.helpCenter'), href: '/help' },
      { label: t('footer.links.contact'), href: 'mailto:support@kasbook.io' },
      { label: t('footer.links.status'), href: '/status' },
      { label: t('footer.links.privacy'), href: '/legal/privacy' },
    ],
  },
];

const socialLinks = [
  { icon: Twitter, href: 'https://twitter.com/kasbook', label: 'Twitter' },
  { icon: Github, href: 'https://github.com/kasbook', label: 'GitHub' },
  { icon: Youtube, href: 'https://youtube.com/@kasbook', label: 'YouTube' },
  { icon: Send, href: 'https://t.me/kasbook', label: 'Telegram' },
];

export default function Footer() {
  const { t } = useTranslation();
  const { theme, toggleTheme, isMobile } = useTheme();
  const year = new Date().getFullYear();

  const themeLabel = theme === 'light' ? t('footer.actions.darkMode') : t('footer.actions.lightMode');
  const ThemeIcon = theme === 'light' ? Moon : Sun;

  if (isMobile) {
    return null;
  }

  return (
    <footer className="mt-16 border-t border-border/60 bg-background/95 text-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-2">
            <div>
              <Link to={createPageUrl('Home')} className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                  <PenSquare className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold">Kasbook</p>
                  <p className="text-sm text-muted-foreground">{t('footer.tagline')}</p>
                </div>
              </Link>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <h3 className="text-lg font-semibold text-primary">{t('footer.authorCtaTitle')}</h3>
              <p className="mt-2 text-sm text-primary/80">{t('footer.authorCtaSubtitle')}</p>
              <Button asChild className="mt-4">
                <Link to="/authors/submit" className="inline-flex items-center gap-2">
                  {t('footer.authorCtaButton')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={themeLabel}>
                <ThemeIcon className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition hover:border-primary hover:text-primary"
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {sections(t).map((section) => (
            <div key={section.title} className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{section.title}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith('http') || link.href.startsWith('mailto:') ? (
                      <a
                        href={link.href}
                        className="transition hover:text-primary"
                        target={link.href.startsWith('http') ? '_blank' : undefined}
                        rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link to={link.href} className="transition hover:text-primary">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border/50 bg-background/80 py-6">
        <div className="container mx-auto flex flex-col gap-4 px-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {year} Kasbook. {t('footer.rights')}</p>
          <div className="flex flex-wrap gap-4">
            <Link to="/legal/privacy" className="hover:text-primary">
              {t('footer.links.privacyPolicy')}
            </Link>
            <Link to="/legal/terms" className="hover:text-primary">
              {t('footer.links.terms')}
            </Link>
            <Link to="/legal/public-offer" className="hover:text-primary">
              {t('footer.links.offer')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
