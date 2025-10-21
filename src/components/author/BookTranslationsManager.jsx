import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Loader2,
  Languages,
  UploadCloud,
  Sparkles,
  Trash2,
  Image as ImageIcon,
  CheckCircle,
} from 'lucide-react';

import { UploadFile } from '@/api/integrations';
import { buildSupabasePath } from '@/utils/storagePaths';
import { translateText } from '@/components/utils/translationService';
import { LANGUAGE_OPTIONS, findLanguageOption } from '@/utils/languageOptions';
import {
  deleteBookTranslation,
  fetchBookTranslations,
  upsertBookTranslation,
} from '@/api/bookTranslations';

const IMAGE_ACCEPT = ['image/png', 'image/jpeg', 'image/webp'];

const COVER_FIELDS = [
  {
    key: 'cover_400x600_url',
    label: 'Портретная 400×600',
    description: 'PNG, JPG, WEBP • до 5MB',
    maxSize: 5 * 1024 * 1024,
    storageFolder: 'books/translations/400x600',
  },
  {
    key: 'cover_600x600_url',
    label: 'Квадратная 600×600',
    description: 'PNG, JPG, WEBP • до 5MB',
    maxSize: 5 * 1024 * 1024,
    storageFolder: 'books/translations/600x600',
  },
  {
    key: 'cover_1600x900_url',
    label: 'Широкая 1600×900',
    description: 'PNG, JPG, WEBP • до 10MB',
    maxSize: 10 * 1024 * 1024,
    storageFolder: 'books/translations/1600x900',
  },
  {
    key: 'cover_800x1000_url',
    label: 'Высокая 800×1000',
    description: 'PNG, JPG, WEBP • до 8MB',
    maxSize: 8 * 1024 * 1024,
    storageFolder: 'books/translations/800x1000',
  },
  {
    key: 'main_banner_url',
    label: 'Главный баннер',
    description: 'Любая пропорция • до 10MB',
    maxSize: 10 * 1024 * 1024,
    storageFolder: 'books/translations/main-banner',
  },
];

const generateLocalId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `translation-${Math.random().toString(36).slice(2, 11)}`;
};

const createEmptyTranslation = (language) => ({
  localId: generateLocalId(),
  id: null,
  language_code: language ?? '',
  custom_title: '',
  custom_description: '',
  cover_400x600_url: null,
  cover_600x600_url: null,
  cover_1600x900_url: null,
  cover_800x1000_url: null,
  main_banner_url: null,
  is_published: false,
  isAutoTranslating: false,
  isSaving: false,
});

const mapServerTranslation = (record) => ({
  localId: generateLocalId(),
  id: record.id,
  language_code: record.language_code,
  custom_title: record.custom_title ?? '',
  custom_description: record.custom_description ?? '',
  cover_400x600_url: record.cover_400x600_url ?? null,
  cover_600x600_url: record.cover_600x600_url ?? null,
  cover_1600x900_url: record.cover_1600x900_url ?? null,
  cover_800x1000_url: record.cover_800x1000_url ?? null,
  main_banner_url: record.main_banner_url ?? null,
  is_published: Boolean(record.is_published),
  isAutoTranslating: false,
  isSaving: false,
});

const getBaseCoverFallbacks = (book) => ({
  cover_400x600_url: book?.cover_images?.default ?? null,
  cover_600x600_url: book?.cover_images?.square ?? null,
  cover_1600x900_url: book?.cover_images?.landscape ?? null,
  cover_800x1000_url: book?.cover_images?.portrait_large ?? null,
  main_banner_url:
    book?.cover_images?.main_banner ??
    book?.cover_images?.library_hero ??
    book?.cover_images?.default ?? null,
});

const CoverUploadTile = ({
  coverKey,
  currentUrl,
  fallbackUrl,
  onUpload,
  onRemove,
  isUploading,
  maxSize,
  description,
  label,
  storageFolder,
}) => {
  const [isHover, setIsHover] = useState(false);

  const displayUrl = currentUrl || fallbackUrl;

  return (
    <div
      className={`relative rounded-xl border border-white/10 bg-[#1b1b1b] p-4 transition-colors ${
        isHover ? 'bg-[#1f1f1f]' : ''
      }`}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="text-xs text-white/60">{description}</p>
        </div>
        {currentUrl ? (
          <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-200 border-indigo-400/40">
            Своя обложка
          </Badge>
        ) : fallbackUrl ? (
          <Badge variant="outline" className="text-white/60 border-white/20">
            По умолчанию
          </Badge>
        ) : null}
      </div>

      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-dashed border-white/10 bg-[#111111] flex items-center justify-center">
        {displayUrl ? (
          <img
            src={displayUrl}
            alt={label}
            className="h-full w-full object-cover"
          />
        ) : (
          <ImageIcon className="h-10 w-10 text-white/30" />
        )}
        <input
          type="file"
          accept={IMAGE_ACCEPT.join(',')}
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            onUpload(file, { coverKey, maxSize, storageFolder });
            event.target.value = '';
          }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-white/60">
        <span>до {(maxSize / (1024 * 1024)).toFixed(0)}MB</span>
        {currentUrl && (
          <button
            type="button"
            onClick={() => onRemove(coverKey)}
            className="text-rose-300 hover:text-rose-200"
          >
            Удалить
          </button>
        )}
      </div>

      {isUploading && (
        <div className="mt-2 flex items-center text-xs text-indigo-300">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Загрузка...
        </div>
      )}
    </div>
  );
};

const TranslationCard = ({
  form,
  baseBook,
  onChange,
  onRemove,
  onAutoTranslate,
  onPublish,
  onSaveDraft,
  disableLanguage,
  availableLanguages,
}) => {
  const fallbackCovers = useMemo(() => getBaseCoverFallbacks(baseBook), [baseBook]);
  const baseDescription = baseBook?.description ?? '';

  const hasDescription = (form.custom_description && form.custom_description.trim().length > 0) || baseDescription.trim().length > 0;
  const hasCover = COVER_FIELDS.some((field) => form[field.key] || fallbackCovers[field.key]);

  const publishDisabled = !hasDescription || !hasCover;

  return (
    <Card className="border-white/10 bg-[#161616] text-white">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Languages className="h-5 w-5 text-indigo-400" />
            {form.language_code
              ? `${findLanguageOption(form.language_code)?.label ?? form.language_code}`
              : 'Новый перевод'}
          </CardTitle>
          <CardDescription className="text-white/60">
            Опубликуйте перевод с уникальными материалами для этого языка.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(form)}
            className="text-white/70 hover:bg-white/10"
          >
            <Trash2 className="mr-2 h-4 w-4" />Удалить
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-[1fr_200px]">
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-white/80">Выберите язык</label>
              <Select
                value={form.language_code}
                onValueChange={(value) => onChange(form.localId, { language_code: value })}
                disabled={disableLanguage && form.language_code}
              >
                <SelectTrigger className="border-white/20 bg-[#141414] text-white">
                  <SelectValue placeholder="Выберите язык" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] text-white">
                  {availableLanguages.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span>{option.flag}</span>
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="bg-white/10 text-white hover:bg-white/15"
                onClick={() => onAutoTranslate(form)}
                disabled={!form.language_code || form.isAutoTranslating}
              >
                {form.isAutoTranslating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Переводим...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />Перевести автоматически
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={() => {
                  toast.info('Вы можете загрузить собственное описание и обложки для этого языка.');
                }}
              >
                <UploadCloud className="mr-2 h-4 w-4" />Загрузить свой перевод
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white/80">Название</label>
                <Input
                  value={form.custom_title}
                  onChange={(event) => onChange(form.localId, { custom_title: event.target.value })}
                  placeholder="Custom title"
                  className="border-white/20 bg-[#141414] text-white placeholder:text-white/40"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white/80">Описание</label>
                <Textarea
                  value={form.custom_description}
                  onChange={(event) => onChange(form.localId, { custom_description: event.target.value })}
                  placeholder="Custom description"
                  className="border-white/20 bg-[#141414] text-white placeholder:text-white/40 min-h-[140px]"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#141414] p-4 text-sm text-white/70">
            <p className="font-medium text-white">Условия публикации</p>
            <ul className="mt-3 space-y-2 text-xs">
              <li>• Заполните описание или используйте описание оригинала.</li>
              <li>• Загрузите хотя бы одну обложку или используйте стандартную.</li>
              <li>• После публикации перевод появится в админке.</li>
            </ul>
            {form.is_published && (
              <div className="mt-4 flex items-center gap-2 text-emerald-300">
                <CheckCircle className="h-4 w-4" />
                Перевод опубликован
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white/80">Обложки и баннеры</h3>
            <span className="text-xs text-white/50">Доступные форматы: JPG, PNG, WEBP</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {COVER_FIELDS.map((field) => (
              <CoverUploadTile
                key={field.key}
                coverKey={field.key}
                label={field.label}
                description={field.description}
                currentUrl={form[field.key]}
                fallbackUrl={fallbackCovers[field.key]}
                maxSize={field.maxSize}
                isUploading={Boolean(form.uploadingCover === field.key)}
                onRemove={(key) => onChange(form.localId, { [key]: null })}
                onUpload={(file, meta) => onChange(form.localId, { __upload: { file, meta } })}
                storageFolder={field.storageFolder}
              />
            ))}
          </div>
        </div>

        <Separator className="bg-white/10" />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-white/50">
            {publishDisabled
              ? 'Добавьте описание и хотя бы одну обложку, чтобы опубликовать перевод.'
              : 'Все условия выполнены — можно публиковать.'}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => onSaveDraft(form)}
              disabled={form.isSaving}
            >
              {form.isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Сохраняем
                </>
              ) : (
                'Сохранить черновик'
              )}
            </Button>
            <Button
              type="button"
              className="bg-indigo-600 text-white hover:bg-indigo-500"
              onClick={() => onPublish(form)}
              disabled={publishDisabled || form.isSaving}
            >
              Опубликовать перевод
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const sortLanguages = (languages) =>
  [...languages].sort((a, b) => a.label.localeCompare(b.label));

export default function BookTranslationsManager({
  bookId,
  baseBook,
  initialLanguages = [],
  onBack,
  onComplete,
}) {
  const [forms, setForms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const baseLanguage = useMemo(() => {
    const explicit = baseBook?.languages?.find((lang) => lang?.original)?.lang;
    return explicit || baseBook?.originalLanguage || baseBook?.language || 'ru';
  }, [baseBook]);

  const ensureInitialForms = useCallback((existingForms, languages) => {
    let updated = [...existingForms];
    languages.forEach((langCode) => {
      const alreadyExists = updated.some(
        (form) => form.language_code?.toLowerCase() === langCode.toLowerCase(),
      );
      if (!alreadyExists) {
        updated.push(createEmptyTranslation(langCode));
      }
    });
    return updated;
  }, []);

  const loadTranslations = useCallback(async () => {
    if (!bookId) return;
    setIsLoading(true);
    try {
      const records = await fetchBookTranslations(bookId);
      let mapped = records.map(mapServerTranslation);
      mapped = ensureInitialForms(mapped, initialLanguages);
      if (mapped.length === 0) {
        mapped.push(createEmptyTranslation(initialLanguages[0]));
      }
      setForms(mapped);
    } catch (error) {
      console.error('[BookTranslationsManager] Failed to load translations', error);
      toast.error('Не удалось загрузить переводы книги');
      setForms(ensureInitialForms([], initialLanguages));
    } finally {
      setIsLoading(false);
    }
  }, [bookId, ensureInitialForms, initialLanguages]);

  useEffect(() => {
    loadTranslations();
  }, [loadTranslations]);

  const handleChange = useCallback((localId, changes) => {
    setForms((prev) =>
      prev.map((form) => {
        if (form.localId !== localId) return form;
        if (changes.__upload) {
          return {
            ...form,
            uploadingCover: changes.__upload.meta.coverKey,
            pendingUpload: changes.__upload,
          };
        }
        return { ...form, ...changes };
      }),
    );
  }, []);

  const handleRemove = useCallback((form) => {
    if (form.id) {
      deleteBookTranslation(form.id)
        .then(() => {
          toast.success('Перевод удалён');
          setForms((prev) => prev.filter((item) => item.localId !== form.localId));
        })
        .catch((error) => {
          console.error('Failed to delete translation', error);
          toast.error('Не удалось удалить перевод');
        });
    } else {
      setForms((prev) => prev.filter((item) => item.localId !== form.localId));
    }
  }, []);

  useEffect(() => {
    const uploads = forms.filter((form) => form.pendingUpload);
    if (uploads.length === 0) return;

    uploads.forEach(async (form) => {
      const { file, meta } = form.pendingUpload;
      if (!file) return;

      if (!IMAGE_ACCEPT.includes(file.type)) {
        toast.error('Разрешены только JPG, PNG или WEBP');
        setForms((prev) =>
          prev.map((item) =>
            item.localId === form.localId
              ? { ...item, pendingUpload: null, uploadingCover: null }
              : item,
          ),
        );
        return;
      }

      if (file.size > meta.maxSize) {
        toast.error(`Файл слишком большой. Максимум ${(meta.maxSize / (1024 * 1024)).toFixed(0)}MB`);
        setForms((prev) =>
          prev.map((item) =>
            item.localId === form.localId
              ? { ...item, pendingUpload: null, uploadingCover: null }
              : item,
          ),
        );
        return;
      }

      setIsUploadingCover(true);
      try {
        const { file_url } = await UploadFile({
          file,
          path: buildSupabasePath(meta.storageFolder, file),
        });
        setForms((prev) =>
          prev.map((item) =>
            item.localId === form.localId
              ? {
                  ...item,
                  [meta.coverKey]: file_url,
                  pendingUpload: null,
                  uploadingCover: null,
                }
              : item,
          ),
        );
        toast.success('Обложка загружена');
      } catch (error) {
        console.error('Failed to upload cover', error);
        toast.error('Не удалось загрузить обложку');
        setForms((prev) =>
          prev.map((item) =>
            item.localId === form.localId
              ? { ...item, pendingUpload: null, uploadingCover: null }
              : item,
          ),
        );
      } finally {
        setIsUploadingCover(false);
      }
    });
  }, [forms]);

  const handleAutoTranslate = useCallback(async (form) => {
    if (!form.language_code) {
      toast.error('Выберите язык для перевода');
      return;
    }

    setForms((prev) =>
      prev.map((item) =>
        item.localId === form.localId
          ? { ...item, isAutoTranslating: true }
          : item,
      ),
    );

    try {
      const targetLang = form.language_code;
      const sourceLang = baseLanguage;
      const [title, description] = await Promise.all([
        translateText(baseBook?.title ?? '', targetLang, sourceLang),
        translateText(baseBook?.description ?? '', targetLang, sourceLang),
      ]);

      setForms((prev) =>
        prev.map((item) =>
          item.localId === form.localId
            ? {
                ...item,
                custom_title: title || item.custom_title,
                custom_description: description || item.custom_description,
                isAutoTranslating: false,
              }
            : item,
        ),
      );
      toast.success('Черновик перевода обновлен');
    } catch (error) {
      console.error('Failed to auto translate', error);
      toast.error('Не удалось выполнить автоматический перевод');
      setForms((prev) =>
        prev.map((item) =>
          item.localId === form.localId
            ? { ...item, isAutoTranslating: false }
            : item,
        ),
      );
    }
  }, [baseBook, baseLanguage]);

  const saveTranslation = useCallback(async (form, overrides = {}) => {
    if (!form.language_code) {
      toast.error('Выберите язык перевода');
      return null;
    }

    setForms((prev) =>
      prev.map((item) =>
        item.localId === form.localId
          ? { ...item, isSaving: true }
          : item,
      ),
    );

    try {
      const payload = {
        id: form.id ?? undefined,
        language_code: form.language_code,
        custom_title: form.custom_title || null,
        custom_description: form.custom_description || null,
        cover_400x600_url: form.cover_400x600_url || null,
        cover_600x600_url: form.cover_600x600_url || null,
        cover_1600x900_url: form.cover_1600x900_url || null,
        cover_800x1000_url: form.cover_800x1000_url || null,
        main_banner_url: form.main_banner_url || null,
        is_published: Boolean(overrides.is_published ?? form.is_published ?? false),
      };

      const saved = await upsertBookTranslation(bookId, payload);
      setForms((prev) =>
        prev.map((item) =>
          item.localId === form.localId
            ? { ...item, ...mapServerTranslation(saved), localId: form.localId }
            : item,
        ),
      );
      return saved;
    } catch (error) {
      console.error('Failed to save translation', error);
      toast.error('Не удалось сохранить перевод');
      return null;
    } finally {
      setForms((prev) =>
        prev.map((item) =>
          item.localId === form.localId
            ? { ...item, isSaving: false }
            : item,
        ),
      );
    }
  }, [bookId]);

  const handleSaveDraft = useCallback((form) => {
    saveTranslation(form).then((result) => {
      if (result) {
        toast.success('Черновик перевода сохранён');
      }
    });
  }, [saveTranslation]);

  const handlePublish = useCallback((form) => {
    const fallbackCovers = getBaseCoverFallbacks(baseBook);
    const hasDescription = (form.custom_description && form.custom_description.trim().length > 0) || (baseBook?.description ?? '').trim().length > 0;
    const hasCover = COVER_FIELDS.some((field) => form[field.key] || fallbackCovers[field.key]);

    if (!hasDescription) {
      toast.error('Добавьте описание или используйте описание оригинала');
      return;
    }

    if (!hasCover) {
      toast.error('Загрузите хотя бы одну обложку или используйте обложку из оригинала');
      return;
    }

    saveTranslation(form, { is_published: true }).then((result) => {
      if (result) {
        toast.success('Перевод опубликован');
      }
    });
  }, [baseBook, saveTranslation]);

  const handleAddTranslation = useCallback(() => {
    setForms((prev) => [...prev, createEmptyTranslation('')]);
  }, []);

  const handleFinish = useCallback(() => {
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-white">Переводы книги</h2>
          <p className="text-sm text-white/60">
            Настройте локализованные материалы, загружайте обложки и публикуйте переводы на выбранных языках.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
            onClick={onBack}
          >
            Назад к загрузке
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="bg-indigo-600 text-white hover:bg-indigo-500"
            onClick={handleAddTranslation}
          >
            Добавить перевод
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-xl border border-white/10 bg-[#161616] p-12 text-white/70">
          <Loader2 className="mr-3 h-5 w-5 animate-spin" /> Загружаем переводы...
        </div>
      ) : (
        <div className="space-y-6">
          {forms.map((form) => {
            const languageOptions = sortLanguages(
              LANGUAGE_OPTIONS.filter((option) => {
                if (option.value.toLowerCase() === baseLanguage.toLowerCase()) {
                  return false;
                }
                if (form.language_code === option.value) {
                  return true;
                }
                const isUsedElsewhere = forms.some(
                  (other) =>
                    other.localId !== form.localId &&
                    other.language_code?.toLowerCase() === option.value.toLowerCase(),
                );
                return !isUsedElsewhere;
              }),
            );

            return (
              <TranslationCard
                key={form.localId}
                form={form}
                baseBook={baseBook}
                onChange={handleChange}
                onRemove={handleRemove}
                onAutoTranslate={handleAutoTranslate}
                onPublish={handlePublish}
                onSaveDraft={handleSaveDraft}
                disableLanguage={false}
                availableLanguages={languageOptions}
              />
            );
          })}
          {forms.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-[#161616] p-10 text-center text-white/60">
              Добавьте первый перевод, чтобы настроить локализацию книги.
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-[#161616] p-6 text-white/70 md:flex-row md:items-center md:justify-between">
        <div className="text-sm">
          Обложки и описания без публикации остаются только на вашем устройстве.
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
            onClick={handleFinish}
            disabled={isUploadingCover}
          >
            Завершить настройку
          </Button>
        </div>
      </div>
    </div>
  );
}
