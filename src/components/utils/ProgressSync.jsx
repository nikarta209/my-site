// ИСПРАВЛЕНИЕ: Использует offlineQueue для надежности
import { offlineQueue, safeGet, safeSet } from './OfflineManager';
import { toast } from 'sonner';

// Debounce-функция
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

class ProgressSyncManager {
  constructor() {
    this.debouncedSave = debounce(this.syncProgress.bind(this), 3000);
  }

  async updateProgress(userBookDataId, payload) {
    // 1. Оптимистичное обновление локального кэша для мгновенного UI
    const localKey = `progress_${userBookDataId}`;
    const currentData = await safeGet(localKey) || {};
    const mergedData = { ...currentData, ...payload, last_read_at: new Date().toISOString() };
    await safeSet(localKey, mergedData);

    // 2. Дебаунсированный вызов синхронизации
    this.debouncedSave(userBookDataId, payload);
  }

  async syncProgress(userBookDataId, payload) {
    try {
      const { UserBookData } = await import('@/api/entities');
      await UserBookData.update(userBookDataId, payload);
      toast.success('Progress saved!');
    } catch (error) {
      console.error('Sync failed, adding to offline queue:', error);
      toast.warning('Saving progress failed, will retry later.');
      // 3. Если синхронизация не удалась, добавляем в оффлайн-очередь
      await offlineQueue.addToQueue({
        entity: 'UserBookData',
        method: 'update',
        id: userBookDataId,
        payload
      });
    }
  }
}

export const progressSync = new ProgressSyncManager();