import React from 'react';
import { PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function ReaderV2Sidebar({ toc, onNavigate }) {
  const TableOfContents = () => (
    <nav aria-label="Содержание книги">
      {toc && toc.length > 0 ? (
        <ul className="space-y-2">
          {toc.map((item, index) => (
            <li key={index}>
              <button 
                onClick={() => onNavigate(item.page)} 
                className="w-full text-left p-2 rounded hover:bg-muted"
                aria-label={`Перейти к главе ${item.title}`}
              >
                {item.title}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">Содержание недоступно.</p>
      )}
    </nav>
  );

  return (
    <>
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:block w-64 p-4 border-r bg-background" role="navigation">
        <h2 className="text-lg font-semibold mb-4">Содержание</h2>
        <TableOfContents />
      </aside>

      {/* Sheet for Mobile */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Открыть содержание">
              <PanelLeft className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Содержание</SheetTitle>
            </SheetHeader>
            <div className="py-4">
              <TableOfContents />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}