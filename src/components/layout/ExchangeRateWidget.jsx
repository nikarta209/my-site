import React from 'react';
import { useExchangeRate } from '../utils/ExchangeRateContext';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

// Иконка Kaspa
const KaspaIcon = ({ className = "h-4 w-4" }) => (
  <img 
    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/400006eb0_15301661.png"
    alt="Kaspa"
    className={className}
  />
);

export default function ExchangeRateWidget() {
  const { kasRate, isLoading, error, lastUpdated, fetchRate } = useExchangeRate();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-16" />
      </div>
    );
  }

  const handleRefresh = (e) => {
    e.preventDefault();
    e.stopPropagation();
    fetchRate();
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    try {
      return formatDistanceToNow(lastUpdated, { 
        addSuffix: true, 
        locale: ru 
      });
    } catch (error) {
      return lastUpdated.toLocaleTimeString();
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-default group">
            {error ? (
              <AlertCircle className="h-4 w-4 text-destructive" />
            ) : (
              <KaspaIcon className="h-4 w-4" />
            )}
            <span className="font-mono">
              {error ? 'N/A' : `$${kasRate.toFixed(6)}`}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            {error ? (
              <p className="text-destructive">Ошибка загрузки: {error}</p>
            ) : (
              <>
                <p>Курс KAS/USD: <span className="font-mono">${kasRate.toFixed(6)}</span></p>
                {lastUpdated && (
                  <p className="text-muted-foreground">
                    Обновлено: {formatLastUpdated()}
                  </p>
                )}
                <p className="text-muted-foreground">Нажмите для обновления</p>
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}