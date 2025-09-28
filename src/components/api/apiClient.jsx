import axios from 'axios';

// Создаем экземпляр axios с базовой конфигурацией
const apiClient = axios.create({
  timeout: 30000, // 30 секунд таймаут
  withCredentials: true, // Включаем отправку куки
});

// Функция для получения CSRF токена
const getCSRFToken = () => {
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta ? meta.getAttribute('content') : null;
};

// Interceptor для добавления CSRF токена к запросам
apiClient.interceptors.request.use(
  (config) => {
    const csrfToken = getCSRFToken();
    
    // Если данные в FormData, специальная обработка
    if (config.data instanceof FormData) {
      // Добавляем CSRF токен в FormData
      if (csrfToken) {
        config.data.append('_token', csrfToken);
      }
      
      // Не устанавливаем Content-Type - браузер установит его автоматически с boundary
      delete config.headers['Content-Type'];
    } else {
      // Обычные JSON запросы
      if (csrfToken) {
        config.headers['X-CSRF-TOKEN'] = csrfToken;
      }
      config.headers['Content-Type'] = 'application/json';
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor для обработки ответов и ошибок
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Логируем ошибки для отладки
    console.error('API Client Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    });

    // Обработка специфических HTTP статусов
    if (error.response?.status === 401) {
      // Неавторизованный доступ - редирект на логин
      window.location.href = '/auth/login';
    } else if (error.response?.status === 419) {
      // CSRF token mismatch - перезагрузка страницы
      window.location.reload();
    } else if (error.response?.status >= 500) {
      // Серверные ошибки - показываем пользователю дружелюбное сообщение
      error.userMessage = 'Произошла ошибка сервера. Пожалуйста, попробуйте позже.';
    }

    return Promise.reject(error);
  }
);

// Удобные методы для различных типов запросов
export const api = {
  // GET запрос
  get: (url, config = {}) => {
    return apiClient.get(url, config);
  },

  // POST запрос с JSON данными
  post: (url, data = {}, config = {}) => {
    return apiClient.post(url, data, config);
  },

  // POST запрос с FormData (для загрузки файлов)
  postFormData: (url, formData, config = {}) => {
    return apiClient.post(url, formData, {
      ...config,
      headers: {
        ...config.headers,
        // Content-Type будет установлен автоматически браузером
      },
    });
  },

  // PUT запрос
  put: (url, data = {}, config = {}) => {
    return apiClient.put(url, data, config);
  },

  // PATCH запрос
  patch: (url, data = {}, config = {}) => {
    return apiClient.patch(url, data, config);
  },

  // DELETE запрос
  delete: (url, config = {}) => {
    return apiClient.delete(url, config);
  },

  // Загрузка файла с прогрессом
  uploadWithProgress: (url, formData, onProgress, config = {}) => {
    return apiClient.post(url, formData, {
      ...config,
      onUploadProgress: onProgress,
      headers: {
        ...config.headers,
      },
    });
  },
};

// Экспортируем также сам экземпляр для продвинутого использования
export default apiClient;