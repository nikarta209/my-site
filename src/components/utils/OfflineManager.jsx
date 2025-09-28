import { toast } from 'sonner';

let idbKeyVal = null;
let initPromise = null;

const initializeDependencies = async () => {
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    try {
      // Try to dynamically import idb-keyval if available
      const { get, set, del } = await import('idb-keyval');
      idbKeyVal = { get, set, del };
    } catch (e) {
      // Fallback to localStorage - no error thrown
      idbKeyVal = null;
    }
  })();
  
  return initPromise;
};

const safeGet = async (key) => {
  await initializeDependencies();
  
  if (idbKeyVal) {
    try {
      return await idbKeyVal.get(key);
    } catch (e) {
      // Fallback to localStorage
    }
  }
  
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : undefined;
  } catch (e) {
    return undefined;
  }
};

const safeSet = async (key, value) => {
  await initializeDependencies();
  
  if (idbKeyVal) {
    try {
      await idbKeyVal.set(key, value);
      return;
    } catch (e) {
      // Fallback to localStorage
    }
  }
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
};

const safeDel = async (key) => {
  await initializeDependencies();
  
  if (idbKeyVal) {
    try {
      await idbKeyVal.del(key);
      return;
    } catch (e) {
      // Fallback to localStorage
    }
  }
  
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn('Failed to delete from localStorage:', e);
  }
};

class OfflineQueueManager {
  constructor() {
    this.queueKey = 'kasbook_offline_queue';
    this.init();
  }

  async init() {
    this.queue = await safeGet(this.queueKey) || [];
    
    window.addEventListener('online', () => {
      this.processQueue();
    });
  }

  async addToQueue(action, data) {
    this.queue.push({
      id: Date.now() + Math.random(),
      action,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0
    });
    
    await safeSet(this.queueKey, this.queue);
    
    if (navigator.onLine) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.queue.length === 0) return;
    
    const itemsToProcess = [...this.queue];
    
    for (const item of itemsToProcess) {
      try {
        await this.processItem(item);
        this.queue = this.queue.filter(q => q.id !== item.id);
      } catch (error) {
        item.retryCount++;
        if (item.retryCount > 3) {
          this.queue = this.queue.filter(q => q.id !== item.id);
          toast.error(`Failed to sync ${item.action} after 3 retries`);
        }
      }
    }
    
    await safeSet(this.queueKey, this.queue);
  }

  async processItem(item) {
    const { action, data } = item;
    
    switch (action) {
      case 'updateProgress':
        // Process reading progress update
        break;
      case 'saveNote':
        // Process note saving
        break;
      case 'saveHighlight':
        // Process highlight saving
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
}

class OfflineBookManager {
  constructor() {
    this.bookCacheKey = 'kasbook_cached_books';
    this.progressKey = 'kasbook_reading_progress';
    this.notesKey = 'kasbook_notes';
    this.highlightsKey = 'kasbook_highlights';
  }

  async cacheBook(bookId, bookData) {
    const cache = await safeGet(this.bookCacheKey) || {};
    cache[bookId] = {
      ...bookData,
      cachedAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString()
    };
    await safeSet(this.bookCacheKey, cache);
  }

  async getCachedBook(bookId) {
    const cache = await safeGet(this.bookCacheKey) || {};
    const book = cache[bookId];
    
    if (book) {
      book.lastAccessed = new Date().toISOString();
      cache[bookId] = book;
      await safeSet(this.bookCacheKey, cache);
    }
    
    return book;
  }

  async updateReadingProgress(bookId, progress) {
    const allProgress = await safeGet(this.progressKey) || {};
    allProgress[bookId] = {
      ...allProgress[bookId],
      ...progress,
      updatedAt: new Date().toISOString()
    };
    await safeSet(this.progressKey, allProgress);
  }

  async getReadingProgress(bookId) {
    const allProgress = await safeGet(this.progressKey) || {};
    return allProgress[bookId] || {};
  }

  async saveNote(bookId, note) {
    const allNotes = await safeGet(this.notesKey) || {};
    if (!allNotes[bookId]) allNotes[bookId] = [];
    
    const noteWithId = {
      ...note,
      id: Date.now() + Math.random(),
      createdAt: new Date().toISOString()
    };
    
    allNotes[bookId].push(noteWithId);
    await safeSet(this.notesKey, allNotes);
    return noteWithId;
  }

  async getNotes(bookId) {
    const allNotes = await safeGet(this.notesKey) || {};
    return allNotes[bookId] || [];
  }

  async saveHighlight(bookId, highlight) {
    const allHighlights = await safeGet(this.highlightsKey) || {};
    if (!allHighlights[bookId]) allHighlights[bookId] = [];
    
    const highlightWithId = {
      ...highlight,
      id: Date.now() + Math.random(),
      createdAt: new Date().toISOString()
    };
    
    allHighlights[bookId].push(highlightWithId);
    await safeSet(this.highlightsKey, allHighlights);
    return highlightWithId;
  }

  async getHighlights(bookId) {
    const allHighlights = await safeGet(this.highlightsKey) || {};
    return allHighlights[bookId] || [];
  }

  async clearCache() {
    await safeDel(this.bookCacheKey);
    await safeDel(this.progressKey);
    await safeDel(this.notesKey);
    await safeDel(this.highlightsKey);
  }

  async getCacheStats() {
    const cache = await safeGet(this.bookCacheKey) || {};
    const bookCount = Object.keys(cache).length;
    
    const sizes = await Promise.all([
      safeGet(this.bookCacheKey),
      safeGet(this.progressKey),
      safeGet(this.notesKey),
      safeGet(this.highlightsKey)
    ]);
    
    const totalSize = sizes.reduce((sum, item) => {
      if (item) {
        return sum + JSON.stringify(item).length;
      }
      return sum;
    }, 0);
    
    return {
      bookCount,
      totalSize: totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
    };
  }
}

// Экспортируем экземпляры для использования в приложении
export const offlineQueue = new OfflineQueueManager();
export const offlineBooks = new OfflineBookManager();

export { safeGet, safeSet, safeDel };