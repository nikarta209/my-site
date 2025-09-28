
export const ru = {
  // Header
  header: {
    catalog: 'Каталог',
    library: 'Библиотека',
    cart: 'Корзина',
    authorPanel: 'Панель автора',
    searchPlaceholder: 'Поиск книг, авторов...',
    login: 'Войти',
    logout: 'Выйти',
    profile: 'Профиль',
    myAccount: 'Мой аккаунт'
  },

  // Navigation
  nav: {
    home: 'Главная',
    catalog: 'Каталог',
    library: 'Библиотека',
    cart: 'Корзина',
    profile: 'Профиль'
  },

  // Common
  common: {
    buy: 'Купить',
    read: 'Читать',
    preview: 'Превью',
    addToCart: 'В корзину',
    addToWishlist: 'В избранное',
    loading: 'Загрузка...',
    search: 'Поиск',
    filter: 'Фильтр',
    sort: 'Сортировка',
    save: 'Сохранить',
    cancel: 'Отмена',
    delete: 'Удалить',
    edit: 'Редактировать',
    upload: 'Загрузить',
    download: 'Скачать',
    back: 'Назад', // new
    next: 'Далее',
    previous: 'Назад', // This key already exists in original common, keep it.
    close: 'Закрыть',
    open: 'Открыть' // new
    // Removed from original common: error, success, view, confirm, yes, no
  },

  // Filters
  filters: {
    title: 'Фильтры',
    genre: 'Жанр',
    language: 'Язык',
    price: 'Цена',
    rating: 'Рейтинг',
    allGenres: 'Все жанры',
    allLanguages: 'Все языки',
    anyRating: 'Любой рейтинг',
    rating4Plus: '4 звезды и выше',
    rating3Plus: '3 звезды и выше',
    rating2Plus: '2 звезды и выше',
    rating1Plus: '1 звезда и выше',
    minPrice: 'Мин',
    maxPrice: 'Макс'
  },

  // Genres
  genres: {
    fiction: 'Художественная литература',
    'non-fiction': 'Нон-фикшн',
    science: 'Наука',
    history: 'История',
    business: 'Бизнес',
    romance: 'Романтика',
    mystery: 'Детектив',
    fantasy: 'Фэнтези',
    biography: 'Биография',
    'self-help': 'Саморазвитие',
    philosophy: 'Философия'
  },

  // Author Panel
  author: {
    dashboard: 'Панель автора',
    uploadBook: 'Загрузить новую книгу', // Text changed
    myBooks: 'Мои книги',
    earnings: 'Доходы',
    analytics: 'Аналитика',
    currentProgress: 'Текущий прогресс', // New
    qualifiedSales: 'квалифицированных продаж', // Text changed
    totalEarnings: 'Общий доход', // New
    booksPublished: 'Книг опубликовано', // New
    currentLevel: 'Текущий уровень', // New
    nextLevel: 'Следующий уровень', // New
    royaltyRoadmap: 'Ваша дорожная карта роялти' // New
    // Removed from original author: royalties, tier, totalSales (replaced by qualifiedSales and totalEarnings), becomeAuthor, authorApplication, experience, motivation, sampleWork, genres (author specific), approved, pending, rejected
  },

  // Book Details
  book: {
    details: 'Подробности книги', // New
    description: 'Описание',
    author: 'Автор',
    genre: 'Жанр',
    rating: 'Рейтинг',
    reviews: 'Отзывы',
    downloads: 'Скачивания',
    similarBooks: 'Похожие книги',
    recommended: 'Рекомендуется для вас' // New
    // Removed from original book: title, price, publishDate, pages, language, views, writeReview, yourRating, recommend, notRecommend
  },

  // Errors
  errors: {
    general: 'Произошла ошибка', // Text changed
    invalidPrice: 'Неверная цена',
    passwordMismatch: 'Пароли не совпадают',
    invalidPassword: 'Пароль должен быть не менее 6 символов', // Text changed
    networkError: 'Ошибка сети', // Renamed from 'network'
    unauthorized: 'Неавторизованный доступ', // Text changed from 'Не авторизован'
    notFound: 'Не найдено'
    // Removed from original errors: forbidden, validation, invalidEmail, minPrice, required, fileSize, fileType, uploadFailed
  },

  // Success messages
  success: {
    passwordChanged: 'Пароль успешно изменен', // Text changed
    bookUploaded: 'Книга успешно загружена', // New
    reviewAdded: 'Отзыв успешно добавлен', // Renamed and text changed from 'reviewSubmitted'
    profileUpdated: 'Профиль успешно обновлен' // Text changed
    // Removed from original success: saved, uploaded, deleted, updated, bookAdded, emailSent
  },

  // Profile
  profile: {
    title: 'Профиль', // New
    editProfile: 'Редактировать профиль',
    security: 'Безопасность',
    activity: 'Активность',
    changePassword: 'Изменить пароль',
    twoFactor: 'Двухфакторная аутентификация',
    enable2FA: 'Включить 2FA',
    disable2FA: 'Отключить 2FA'
    // Removed from original profile: profile (redundant with title), myAccount, accountSettings, preferences, purchaseHistory, reviewHistory
  },

  // Moods (kept from original)
  moods: {
    adventure: 'Приключения',
    thoughtful: 'Вдумчивое',
    relaxing: 'Расслабляющее',
    inspiring: 'Вдохновляющее',
    emotional: 'Эмоциональное',
    exciting: 'Захватывающее'
  },

  // Forms (kept from original)
  forms: {
    email: 'Email',
    password: 'Пароль',
    confirmPassword: 'Подтвердите пароль',
    fullName: 'Полное имя',
    firstName: 'Имя',
    lastName: 'Фамилия',
    phoneNumber: 'Номер телефона',
    address: 'Адрес',
    bio: 'Биография',
    website: 'Веб-сайт',
    socialMedia: 'Социальные сети',
    preferences: 'Предпочтения',
    required: 'Обязательно',
    optional: 'Необязательно',
    placeholder: {
      search: 'Поиск книг, авторов...',
      email: 'Введите ваш email',
      password: 'Введите пароль',
      fullName: 'Введите полное имя',
      comment: 'Напишите ваш комментарий...'
    }
  },

  // Cart and checkout (kept from original)
  cart: {
    cart: 'Корзина',
    cartEmpty: 'Ваша корзина пуста',
    total: 'Итого',
    checkout: 'К оплате',
    removeItem: 'Удалить товар',
    clearCart: 'Очистить корзину',
    selectAll: 'Выбрать все',
    deselectAll: 'Снять выделение',
    proceedToPayment: 'Перейти к оплате',
    itemsSelected: 'товаров выбрано'
  },

  // Titles and descriptions (kept from original)
  titles: {
    welcome: 'Добро пожаловать в KASBOOK',
    discoverBooks: 'Откройте удивительные книги',
    featuredBooks: 'Рекомендуемые книги',
    newReleases: 'Новинки',
    topRated: 'Лучшие по рейтингу',
    recommendations: 'Рекомендации для вас',
    becomeAuthor: 'Станьте автором',
    joinCommunity: 'Присоединяйтесь к сообществу'
  },

  descriptions: {
    platform: 'Революционная книжная платформа на блокчейне',
    fairRoyalties: 'Справедливые роялти для авторов, настоящее владение для читателей',
    nftOwnership: 'Владейте книгами как NFT',
    globalMarketplace: 'Глобальная площадка для цифровых книг'
  }
};
