import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Volume2, Languages, BookOpen, X } from 'lucide-react';
import { InvokeLLM } from '@/api/integrations';
import { get, set } from 'idb-keyval';
import { toast } from 'sonner';

// Fallback dictionary for offline use
const COMMON_WORDS_DICT = {
  'book': {
    definition: 'A written or printed work consisting of pages glued or sewn together along one side and bound in covers.',
    etymology: 'Old English bōc, of Germanic origin; related to Dutch boek and German Buch.',
    examples: ['I read a fascinating book about astronomy.', 'She published her first book last year.'],
    synonyms: ['volume', 'tome', 'publication', 'work']
  },
  'read': {
    definition: 'Look at and comprehend the meaning of written or printed matter.',
    etymology: 'Old English rǣdan, of Germanic origin.',
    examples: ['I love to read mystery novels.', 'Can you read this handwriting?'],
    synonyms: ['peruse', 'study', 'scan', 'browse']
  },
  // Add more common words as needed
};

export default function DictionaryPopover({ 
  selectedText, 
  position, 
  onClose, 
  userLanguage = 'ru',
  bookLanguages = []
}) {
  const [definition, setDefinition] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (selectedText) {
      loadDefinition();
    }
  }, [selectedText, userLanguage]);

  const getCacheKey = (word, lang) => `word_${word.toLowerCase()}_${lang}`;

  const loadDefinition = async () => {
    if (!selectedText?.trim()) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const word = selectedText.toLowerCase().trim();
      const cacheKey = getCacheKey(word, userLanguage);
      
      // Try cache first
      let cached = null;
      try {
        cached = await get(cacheKey);
      } catch (e) {
        console.warn('Cache read failed, falling back to localStorage:', e);
        const fallback = localStorage.getItem(cacheKey);
        if (fallback) cached = JSON.parse(fallback);
      }

      if (cached && cached.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000) { // 7 days
        setDefinition(cached);
        setIsLoading(false);
        return;
      }

      // Try API
      try {
        const response = await InvokeLLM({
          prompt: `Define "${selectedText}" in ${userLanguage}. Provide:
          1. Clear definition
          2. Etymology if available
          3. 2-3 example sentences
          4. 3-5 synonyms
          Format as JSON with keys: definition, etymology, examples (array), synonyms (array)`,
          response_json_schema: {
            type: "object",
            properties: {
              definition: { type: "string" },
              etymology: { type: "string" },
              examples: { type: "array", items: { type: "string" } },
              synonyms: { type: "array", items: { type: "string" } }
            },
            required: ["definition"]
          }
        });

        const definitionData = {
          ...response,
          timestamp: Date.now(),
          lang: userLanguage
        };

        // Cache the result
        try {
          await set(cacheKey, definitionData);
        } catch (e) {
          localStorage.setItem(cacheKey, JSON.stringify(definitionData));
        }

        setDefinition(definitionData);

      } catch (apiError) {
        console.warn('API failed, trying fallback:', apiError);
        
        // Try fallback dictionary
        const fallbackDef = COMMON_WORDS_DICT[word];
        if (fallbackDef) {
          setDefinition({ ...fallbackDef, lang: 'en' });
        } else {
          throw new Error('No definition offline, connect to server');
        }
      }

    } catch (err) {
      console.error('Definition lookup failed:', err);
      setError(err.message || 'Failed to get definition');
      toast.error('Ошибка словаря', { 
        description: err.message || 'Не удалось получить определение' 
      });
    }

    setIsLoading(false);
  };

  const translateText = async (targetLang) => {
    setIsLoading(true);
    try {
      const response = await InvokeLLM({
        prompt: `Translate "${selectedText}" to ${targetLang}. Provide translation and brief context if needed.`,
        response_json_schema: {
          type: "object", 
          properties: {
            translation: { type: "string" },
            context: { type: "string" }
          }
        }
      });
      
      toast.success('Перевод', { 
        description: `${selectedText} → ${response.translation}` 
      });
    } catch (err) {
      toast.error('Ошибка перевода', { description: err.message });
    }
    setIsLoading(false);
  };

  const retryLoad = () => {
    loadDefinition();
  };

  if (!selectedText) return null;

  return (
    <Card 
      className="fixed z-50 w-80 max-w-sm shadow-lg border"
      style={{
        left: Math.min(position.x, window.innerWidth - 320),
        top: Math.min(position.y + 10, window.innerHeight - 300)
      }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            {selectedText}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {isLoading && (
          <div className="flex items-center gap-2 py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Поиск определения...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-4">
            <p className="text-sm text-red-600 mb-2">{error}</p>
            <Button size="sm" variant="outline" onClick={retryLoad}>
              Попробовать снова
            </Button>
          </div>
        )}

        {definition && !isLoading && (
          <div className="space-y-3">
            <div>
              <Badge variant="outline" className="mb-2">Определение</Badge>
              <p className="text-sm">{definition.definition}</p>
            </div>

            {definition.etymology && (
              <div>
                <Badge variant="outline" className="mb-2">Этимология</Badge>
                <p className="text-xs text-muted-foreground">{definition.etymology}</p>
              </div>
            )}

            {definition.examples && definition.examples.length > 0 && (
              <div>
                <Badge variant="outline" className="mb-2">Примеры</Badge>
                <ul className="space-y-1">
                  {definition.examples.slice(0, 2).map((example, i) => (
                    <li key={i} className="text-xs text-muted-foreground">• {example}</li>
                  ))}
                </ul>
              </div>
            )}

            {definition.synonyms && definition.synonyms.length > 0 && (
              <div>
                <Badge variant="outline" className="mb-2">Синонимы</Badge>
                <div className="flex flex-wrap gap-1">
                  {definition.synonyms.slice(0, 4).map((synonym, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{synonym}</Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1">
                <Volume2 className="w-3 h-3 mr-1" />
                Произнести
              </Button>
              
              {bookLanguages && bookLanguages.length > 1 && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    const otherLang = bookLanguages.find(l => l !== userLanguage) || 'en';
                    translateText(otherLang);
                  }}
                >
                  <Languages className="w-3 h-3 mr-1" />
                  Перевод
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}