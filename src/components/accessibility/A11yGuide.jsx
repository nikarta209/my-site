import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Eye, 
  Ear, 
  MousePointer, 
  Keyboard, 
  Zap, 
  CheckCircle2,
  AlertCircle,
  Info,
  X
} from 'lucide-react';

const CodeBlock = ({ children, language = 'jsx' }) => (
  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
    <code>{children}</code>
  </pre>
);

export default function A11yGuide() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 flex items-center gap-3">
          <Eye className="w-8 h-8 text-primary" />
          Руководство по доступности KASBOOK
        </h1>
        <p className="text-muted-foreground text-lg">
          Комплексный подход к созданию инклюзивного интерфейса для всех пользователей
        </p>
      </div>

      <style jsx global>{`
        /* Глобальная поддержка reduced-motion */
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
          
          /* Отключаем Framer Motion анимации */
          .motion-safe\\:animate-spin {
            animation: none !important;
          }
          
          /* Отключаем CSS анимации */
          .animate-pulse,
          .animate-bounce,
          .animate-spin {
            animation: none !important;
          }
        }

        /* Высокий контраст */
        @media (prefers-contrast: high) {
          :root {
            --border: 0 0% 20%;
            --foreground: 0 0% 5%;
            --background: 0 0% 100%;
          }
          
          .dark {
            --border: 0 0% 80%;
            --foreground: 0 0% 95%;
            --background: 0 0% 5%;
          }
        }

        /* Увеличенные шрифты */
        @media (prefers-font-size: large) {
          html {
            font-size: 1.25rem;
          }
        }
      `}</style>

      <Tabs defaultValue="guidelines" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="guidelines">Принципы</TabsTrigger>
          <TabsTrigger value="code">Примеры кода</TabsTrigger>
          <TabsTrigger value="testing">Тестирование</TabsTrigger>
          <TabsTrigger value="utils">Утилиты</TabsTrigger>
        </TabsList>

        <TabsContent value="guidelines" className="space-y-6">
          {/* WCAG Принципы */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                WCAG 2.1 Принципы
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold">Воспринимаемость</h3>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Контрастность текста минимум 4.5:1</li>
                    <li>• Alt-текст для всех изображений</li>
                    <li>• Субтитры для видео</li>
                    <li>• Масштабирование до 200%</li>
                  </ul>
                </div>

                <div className="p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MousePointer className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold">Управляемость</h3>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Навигация с клавиатуры</li>
                    <li>• Время реакции не менее 20 секунд</li>
                    <li>• Отсутствие вспышек &gt; 3 раз/сек</li>
                    <li>• Пропуск повторяющегося контента</li>
                  </ul>
                </div>

                <div className="p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold">Понятность</h3>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Читаемый и понятный текст</li>
                    <li>• Предсказуемое поведение</li>
                    <li>• Помощь при вводе данных</li>
                    <li>• Обработка ошибок</li>
                  </ul>
                </div>

                <div className="p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-orange-600" />
                    <h3 className="font-semibold">Надежность</h3>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Совместимость с AT</li>
                    <li>• Валидная разметка</li>
                    <li>• Семантический HTML</li>
                    <li>• Прогрессивные улучшения</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Touch Targets */}
          <Card>
            <CardHeader>
              <CardTitle>Размеры Touch-целей</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <MousePointer className="h-4 w-4" />
                <AlertDescription>
                  Минимальный размер кликабельных элементов: <strong>48x48px</strong> 
                  (рекомендация WCAG 2.1 для уровня AAA)
                </AlertDescription>
              </Alert>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 border-2 border-green-500 rounded flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-sm">48x48px - Оптимально</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 bg-orange-100 border-2 border-orange-500 rounded flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className="text-sm">36x36px - Минимально приемлемо</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-red-100 border-2 border-red-500 rounded flex items-center justify-center">
                    <X className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="text-sm">&lt;24x24px - Недоступно</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="code" className="space-y-6">
          {/* ARIA Examples */}
          <Card>
            <CardHeader>
              <CardTitle>Примеры ARIA разметки</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Кнопка с состоянием</h4>
                <CodeBlock>{`<button
  aria-pressed={isPressed}
  aria-label="Переключить избранное"
  onClick={handleToggle}
  className="min-w-[48px] min-h-[48px]"
>
  <Heart className={isPressed ? "fill-current text-red-500" : ""} />
</button>`}</CodeBlock>
              </div>

              <div>
                <h4 className="font-medium mb-2">Форма с валидацией</h4>
                <CodeBlock>{`<div>
  <label htmlFor="email" className="block mb-2">
    Email *
  </label>
  <input
    id="email"
    type="email"
    aria-required="true"
    aria-invalid={hasError}
    aria-describedby={hasError ? "email-error" : undefined}
    className="min-h-[48px]"
  />
  {hasError && (
    <div id="email-error" role="alert" className="text-red-600 mt-1">
      Введите корректный email адрес
    </div>
  )}
</div>`}</CodeBlock>
              </div>

              <div>
                <h4 className="font-medium mb-2">Прогресс с анимацией</h4>
                <CodeBlock>{`<div 
  role="progressbar" 
  aria-valuenow={progress}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label="Загрузка файла"
  className="motion-safe:animate-pulse"
>
  <div 
    className="h-2 bg-primary rounded-full transition-all duration-300 motion-reduce:transition-none"
    style={{ width: \`\${progress}%\` }}
  />
</div>`}</CodeBlock>
              </div>
            </CardContent>
          </Card>

          {/* Reduced Motion */}
          <Card>
            <CardHeader>
              <CardTitle>Поддержка Reduced Motion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">CSS подход</h4>
                <CodeBlock language="css">{`@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}`}</CodeBlock>
              </div>

              <div>
                <h4 className="font-medium mb-2">React Hook</h4>
                <CodeBlock>{`const usePrefersReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return prefersReducedMotion;
};`}</CodeBlock>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          {/* Testing Tools */}
          <Card>
            <CardHeader>
              <CardTitle>Инструменты тестирования</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Автоматизированные тесты</h4>
                  <ul className="text-sm space-y-1">
                    <li>• axe-core (React Testing Library)</li>
                    <li>• Lighthouse Accessibility audit</li>
                    <li>• Pa11y command line</li>
                    <li>• Jest axe matcher</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Ручное тестирование</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Навигация только с клавиатуры</li>
                    <li>• Screen reader (NVDA/JAWS)</li>
                    <li>• Высококонтрастный режим</li>
                    <li>• Масштабирование 200%</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Example */}
          <Card>
            <CardHeader>
              <CardTitle>Пример теста доступности</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeBlock language="javascript">{`import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import BookCard from './BookCard';

expect.extend(toHaveNoViolations);

test('BookCard should be accessible', async () => {
  const { container } = render(
    <BookCard 
      title="Test Book"
      author="Test Author"
      coverUrl="/test-cover.jpg"
    />
  );
  
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});`}</CodeBlock>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="utils" className="space-y-6">
          {/* Utility Functions */}
          <Card>
            <CardHeader>
              <CardTitle>Утилиты доступности</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Focus управление</h4>
                <CodeBlock>{`// Focus trap for modals
const useFocusTrap = (isActive) => {
  const containerRef = useRef();
  
  useEffect(() => {
    if (!isActive) return;
    
    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();
    
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);
  
  return containerRef;
};`}</CodeBlock>
              </div>

              <div>
                <h4 className="font-medium mb-2">Announce для screen readers</h4>
                <CodeBlock>{`const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Usage
const handleSuccess = () => {
  announceToScreenReader('Книга успешно добавлена в корзину', 'assertive');
};`}</CodeBlock>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}