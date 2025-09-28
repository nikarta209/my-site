import { useEffect, useRef, useCallback } from 'react';
import { UserBookData } from '@/api/entities';

export default function ReadingTimeTracker({ bookId, userEmail, isActive = true }) {
  const startTimeRef = useRef(null);
  const totalTimeRef = useRef(0);
  const lastSaveRef = useRef(Date.now());

  const saveReadingTime = useCallback(async () => {
    if (!startTimeRef.current || !bookId || !userEmail) return;

    const sessionTime = Math.floor((Date.now() - startTimeRef.current) / 1000); // в секундах
    
    if (sessionTime < 5) return; // Игнорируем очень короткие сессии

    try {
      // Получаем существующие данные
      const existingData = await UserBookData.filter({ 
        user_email: userEmail, 
        book_id: bookId 
      });

      if (existingData.length > 0) {
        const data = existingData[0];
        const newTotalTime = (data.total_reading_time || 0) + sessionTime;
        
        // Добавляем новую сессию чтения
        const newSession = {
          start_time: new Date(startTimeRef.current).toISOString(),
          end_time: new Date().toISOString(),
          duration: sessionTime
        };

        const updatedSessions = [...(data.reading_sessions || []), newSession];

        await UserBookData.update(data.id, {
          total_reading_time: newTotalTime,
          reading_sessions: updatedSessions,
          last_read_at: new Date().toISOString()
        });
      } else {
        // Создаем новую запись
        await UserBookData.create({
          user_email: userEmail,
          book_id: bookId,
          total_reading_time: sessionTime,
          reading_sessions: [{
            start_time: new Date(startTimeRef.current).toISOString(),
            end_time: new Date().toISOString(),
            duration: sessionTime
          }],
          started_reading_at: new Date(startTimeRef.current).toISOString(),
          last_read_at: new Date().toISOString()
        });
      }

      console.log(`Saved reading session: ${sessionTime} seconds for book ${bookId}`);
      
    } catch (error) {
      console.error('Error saving reading time:', error);
    }

    // Сбрасываем счетчик времени
    startTimeRef.current = Date.now();
  }, [bookId, userEmail]);

  // Начинаем трекинг времени когда компонент активен
  useEffect(() => {
    if (isActive && bookId && userEmail) {
      startTimeRef.current = Date.now();
    }

    return () => {
      // Сохраняем время при размонтировании компонента
      if (startTimeRef.current) {
        saveReadingTime();
      }
    };
  }, [isActive, bookId, userEmail, saveReadingTime]);

  // Периодически сохраняем время (каждые 30 секунд)
  useEffect(() => {
    if (!isActive || !bookId || !userEmail) return;

    const interval = setInterval(() => {
      saveReadingTime();
    }, 30000); // 30 секунд

    return () => clearInterval(interval);
  }, [isActive, bookId, userEmail, saveReadingTime]);

  // Отслеживаем видимость окна
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Окно скрыто - останавливаем трекинг
        if (startTimeRef.current) {
          saveReadingTime();
        }
      } else {
        // Окно активно - возобновляем трекинг
        if (isActive && bookId && userEmail) {
          startTimeRef.current = Date.now();
        }
      }
    };

    const handleBeforeUnload = () => {
      if (startTimeRef.current) {
        saveReadingTime();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isActive, bookId, userEmail, saveReadingTime]);

  return null; // Компонент невидимый
}