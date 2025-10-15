import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/components/i18n/SimpleI18n';
import { cn } from '@/lib/utils';

export type SectionProps = {
  titleKey: string;
  viewAllHref: string;
  children: ReactNode;
  className?: string;
};

export default function Section({ titleKey, viewAllHref, children, className }: SectionProps) {
  const { t } = useTranslation();
  return (
    <section className={cn('space-y-4', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
          {t(titleKey)}
        </h2>
        <Button asChild variant="ghost" className="group gap-2 px-0 text-sm text-muted-foreground hover:text-primary">
          <Link to={viewAllHref}>
            {t('home.sections.viewAll')}
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>
      <div>{children}</div>
    </section>
  );
}
