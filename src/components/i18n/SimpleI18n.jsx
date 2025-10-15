
// Простая система интернационализации без внешних зависимомостей
import { useState, useEffect } from 'react';
import { translateText } from '../utils/translationService';

// Complete translations with full coverage - adding French and Spanish
const translations = Object.freeze({
  en: {
    header: {
      catalog: "Catalog",
      library: "Library",
      notesFeed: "Notes Feed", // ADDED
      cart: "Cart",
      authorPanel: "Author Panel",
      searchPlaceholder: "Search books, authors...",
      login: "Login",
      logout: "Logout",
      profile: "Profile",
      myAccount: "My Account"
    },
    banner: {
      author: {
        title: "Up to 90% royalties for authors!",
        description: "Publish your works and get maximum income from each sale.",
        button: "Become Author"
      },
      catalog: {
        title: "Discover the World of Knowledge",
        description: "Thousands of books at your disposal. Start reading today!",
        button: "To Catalog"
      },
      ecosystem: {
        title: "Ecosystem on KAS",
        description: "Buy and sell books with fast and reliable cryptocurrency.",
        button: "Learn More"
      }
    },
    cart: {
      title: "Cart",
      emptyTitle: "Your cart is empty",
      emptyDescription: "Looks like you haven't added any books yet.",
      toCatalog: "Go to Catalog",
      addToCart: "Add to Cart"
    },
    library: {
      title: "My Library",
      description: "Manage your books and continue reading",
      searchPlaceholder: "Search by title or author...",
      loginRequiredTitle: "Please Login",
      loginRequiredDescription: "You need to login to access the library.",
      sort: {
        title: "Sort",
        recent: "Recent",
        progress: "By Progress",
        titleSort: "By Title"
      },
      owned: "Owned",
      previews: "Previews"
    },
    bookDetails: {
      backToCatalog: "Back to Catalog",
      author: "Author",
      description: "Description",
      descriptionMissing: "Description not available.",
      reviews: "Reviews and Rating",
      addToCart: "Add to Cart",
      addToWishlist: "Add to Wishlist",
      downloads: "downloads",
      reviews_count: "reviews",
      views: "views"
    },
    catalog: {
      found: "Found",
      booksOf: "books of"
    },
    filters: {
      title: "Filters",
      allGenres: "All Genres",
      allLanguages: "All Languages",
      anyRating: "Any Rating",
      minPrice: "Min Price",
      maxPrice: "Max Price",
      genre: "Genre",
      language: "Language",
      price: "Price",
      rating: "Rating",
      rating4Plus: "4 stars and above",
      rating3Plus: "3 stars and above",
      rating2Plus: "2 stars and above",
      rating1Plus: "1 star and above"
    },
    genres: {
      fiction: "Fiction",
      "non-fiction": "Non-Fiction",
      science: "Science",
      history: "History",
      business: "Business",
      romance: "Romance",
      mystery: "Mystery",
      fantasy: "Fantasy",
      biography: "Biography",
      "self-help": "Self-Help"
    },
    common: {
      search: "Search",
      loading: "Loading...",
      popular: "Popular"
    },
    sort: {
      popular: "Popular",
      newest: "Newest",
      priceLow: "Price: Low to High",
      priceHigh: "Price: High to Low",
      rating: "High Rating"
    },
    author: {
      panel: {
        title: "Author Panel",
        description: "Manage your books and track your analytics."
      },
      tabs: {
        overview: "Overview",
        analytics: "Analytics",
        myBooks: "My Books", // ADDED
        reviews: "Reviews",
        comparisons: "Comparisons",
        upload: "Upload"
      },
      stats: {
        totalRevenue: "Total Revenue",
        booksPublished: "Books Sold", // Adjusted to "Books Sold" as per common terminology
        currentLevel: "Current Level",
        nextLevel: "Until Next Level",
        totalCopies: "{{count}} books published",
        royalty: "royalty",
        target: "Target: {{target}} sales"
      },
      royalty: {
        currentProgress: "Current Progress",
        qualifiedSales: "qualified sales",
        next: "Next",
        royalty: "royalty",
        salesUntilUpgrade: "sales until upgrade",
        goal: "Goal",
        sales: "sales"
      },
      earnings: {
        title: "Earnings for the Last 6 Months",
        noData: "No sales data yet",
        noDataDescription: "Your earnings will appear here after first sales.",
        earnings: "Earnings"
      },
      roadmap: {
        title: "Your Royalty Roadmap",
        description: "How to increase your income from each sale. Qualified sale - book from 5 USD.",
        start: "Start",
        sales: "sales",
        current: "current",
        target: "target",
        nextGoal: "Next Goal",
        salesNeeded: "Need {{count}} more sales",
        royalty: "royalty"
      },
      tiers: {
        beginner: "Beginner",
        starter: "Starter",
        rising: "Rising",
        bronze: "Bronze",
        bronze_pro: "Bronze Pro",
        silver: "Silver",
        silver_pro: "Silver Pro",
        gold: "Gold",
        diamond: "Diamond",
        platinum: "Platinum",
        platinum_elite: "Platinum Elite"
      },
      books: {
        title: "My Books",
        sales: "sales",
        manage: "Manage",
        noBooks: "You haven't uploaded any books yet.",
        status: {
          approved: "Approved",
          pending: "Pending",
          rejected: "Rejected"
        }
      },
      similar: {
        title: "Popular in Your Genre",
        description: "Analyze trends to create bestsellers",
        notFound: "Could not find similar books."
      },
    },
    home: {
      hero: {
        tablistLabel: "Featured promotions",
        becomeAuthor: "Become an author",
        publishHeadline: "Publish your book on Kasbook",
        publishDescription: "Reach crypto readers worldwide, keep transparent royalties and full rights.",
        publishCta: "Submit a manuscript",
        learnMoreCta: "Explore author tools",
        prepareManuscript: "How to prepare a manuscript",
        guideHeadline: "Editorial standards and formatting tips",
        guideDescription: "Follow the Kasbook guide to pass moderation and launch faster.",
        prepareCta: "Read the guide",
        eventsCta: "Join webinars",
        bestsellersOne: "Bestsellers #1",
        bestsellersTwo: "Bestsellers #2",
        bestsellersThree: "Bestsellers #3",
        read: "Read",
        open: "Open",
        addToCart: "Add to cart"
      },
      cards: {
        exclusive: "Exclusive",
        read: "Read",
        addToCart: "Add to cart",
        empty: "No books to display right now"
      },
      sections: {
        newWeek: "New this week",
        bestSellers: "Top sellers",
        editorsChoice: "Editor’s picks",
        freePreviews: "Free previews",
        aiChoice: "AI suggestions",
        classics: "Classics that resonate",
        adventure: "Fantasy & adventure",
        viewAll: "View all",
        loading: "Loading selection"
      },
      errors: {
        failedToLoad: "We couldn’t load the home feed",
        tryAgain: "Check your connection and try again."
      },
      actions: {
        reload: "Reload"
      }
    },
    footer: {
      catalog: "Catalogue",
      authors: "For authors",
      about: "About",
      support: "Support",
      tagline: "Digital books powered by Kaspa blockchain.",
      authorCtaTitle: "Share your stories with Kasbook readers",
      authorCtaSubtitle: "Upload a manuscript and track sales in real time.",
      authorCtaButton: "Publish a book",
      rights: "All rights reserved.",
      actions: {
        darkMode: "Switch to dark",
        lightMode: "Switch to light"
      },
      links: {
        allBooks: "All books",
        newReleases: "New releases",
        bestSellers: "Bestsellers",
        collections: "Collections",
        submitBook: "Submit a book",
        authorGuide: "Author guide",
        royalties: "Royalties",
        events: "Workshops",
        aboutProject: "About Kasbook",
        blog: "Blog",
        partners: "Partners",
        careers: "Careers",
        helpCenter: "Help center",
        contact: "Contact us",
        status: "System status",
        privacy: "Privacy & security",
        privacyPolicy: "Privacy policy",
        terms: "Terms of use",
        offer: "Public offer"
      }
    },
    subscription: {
      disabledTitle: "Subscription is temporarily unavailable",
      disabledDescription: "We’re refreshing Kasbook Premium benefits. Existing members keep their access.",
      heroDescription: "Unlock premium reading tools, AI recommendations and exclusive releases.",
      includesTitle: "What’s included",
      features: {
        translationsTitle: "5 book translations per month",
        translationsDescription: "Translate any title when an official edition is missing.",
        catalogTitle: "Extended premium catalogue",
        catalogDescription: "Read exclusive books available only to subscribers.",
        notesTitle: "Custom note backgrounds",
        notesDescription: "Personalise shared notes with your own artwork.",
        aiTitle: "AI-powered analysis",
        aiDescription: "Get personalised reading plans tuned to your taste."
      },
      checkoutTitle: "Activate subscription",
      checkoutSubtitle: "30 days of full access.",
      priceLabel: "Price",
      priceKas: "≈ {{value}} KAS",
      alreadyActive: "Subscription already active",
      subscribeCta: "Subscribe",
      loginCta: "Log in to subscribe"
    }
  },

  ru: {
    header: {
      catalog: "Каталог",
      library: "Библиотека",
      notesFeed: "Лента заметок", // ADDED
      cart: "Корзина",
      authorPanel: "Панель автора",
      searchPlaceholder: "Поиск книг, авторов...",
      login: "Войти",
      logout: "Выйти",
      profile: "Мой аккаунт", // Changed from "Профиль" to "Мой аккаунт"
      myAccount: "Мой аккаунт"
    },
    banner: {
      author: {
        title: "До 90% роялти авторам!",
        description: "Публикуйте свои произведения и получайте максимальный доход с каждой продажи.",
        button: "Стать автором"
      },
      catalog: {
        title: "Откройте мир знаний",
        description: "Тысячи книг в вашем распоряжении. Начните читать сегодня!",
        button: "В каталог"
      },
      ecosystem: {
        title: "Экосистема на KAS",
        description: "Покупайте и продавайте книги с помощью быстрой и надежной криптовалюты.",
        button: "Подробнее"
      }
    },
    cart: {
      title: "Корзина",
      emptyTitle: "Ваша корзина пуста",
      emptyDescription: "Похоже, вы еще не добавили ни одной книги.",
      toCatalog: "Перейти в каталог",
      addToCart: "В корзину"
    },
    library: {
      title: "Моя библиотека",
      description: "Управляйте своими книгами и продолжайте чтение",
      searchPlaceholder: "Поиск по названию или автору...",
      loginRequiredTitle: "Войдите в систему",
      loginRequiredDescription: "Для доступа к библиотеке необходимо войти в аккаунт.",
      sort: {
        title: "Сортировка",
        recent: "Недавние",
        progress: "По прогрессу",
        titleSort: "По названию"
      },
      owned: "Купленные",
      previews: "Превью"
    },
    bookDetails: {
      backToCatalog: "Назад к каталогу",
      author: "Автор",
      description: "Описание",
      descriptionMissing: "Описание отсутствует.",
      reviews: "Отзывы и рейтинг",
      addToCart: "В корзину",
      addToWishlist: "В избранное",
      downloads: "скачиваний",
      reviews_count: "отзывов",
      views: "просмотров"
    },
    catalog: {
      found: "Найдено",
      booksOf: "книг из"
    },
    filters: {
      title: "Фильтры",
      allGenres: "Все жанры",
      allLanguages: "Все языки",
      anyRating: "Любой рейтинг",
      minPrice: "Цена от",
      maxPrice: "Цена до",
      genre: "Жанр",
      language: "Язык",
      price: "Цена",
      rating: "Рейтинг",
      rating4Plus: "4 звезды и выше",
      rating3Plus: "3 звезды и выше",
      rating2Plus: "2 звезды и выше",
      rating1Plus: "1 звезда и выше"
    },
    genres: {
      fiction: "Художественная литература",
      "non-fiction": "Нон-фикшн",
      science: "Наука",
      history: "История",
      business: "Бизнес",
      romance: "Романтика",
      mystery: "Детектив",
      fantasy: "Фэнтези",
      biography: "Биография",
      "self-help": "Саморазвитие"
    },
    common: {
      search: "Найти книгу",
      loading: "Загрузка...",
      popular: "Популярные"
    },
    sort: {
      popular: "Популярные",
      newest: "Новинки",
      priceLow: "Цена: по возрастанию",
      priceHigh: "Цена: по убыванию",
      rating: "Высокий рейтинг"
    },
    author: {
      panel: {
        title: "Панель автора",
        description: "Управляйте своими книгами и отслеживайте аналитику."
      },
      tabs: {
        overview: "Обзор",
        analytics: "Аналитика",
        myBooks: "Мои книги", // ADDED
        reviews: "Отзывы",
        comparisons: "Сравнения",
        upload: "Загрузка"
      },
      stats: {
        totalRevenue: "Общий доход",
        booksPublished: "Продано книг", // Adjusted to "Продано книг"
        currentLevel: "Текущий уровень",
        nextLevel: "До след. уровня",
        totalCopies: "{{count}} книг опубликовано",
        royalty: "роялти",
        target: "Цель: {{target}} продаж"
      },
      royalty: {
        currentProgress: "Текущий прогресс",
        qualifiedSales: "квалифицированных продаж",
        next: "Следующий",
        royalty: "роялти",
        salesUntilUpgrade: "продаж до повышения",
        goal: "Цель",
        sales: "продаж"
      },
      earnings: {
        title: "Доходы за последние 6 месяцев",
        noData: "Пока нет данных о продажах",
        noDataDescription: "Ваши доходы появятся здесь после первых продаж.",
        earnings: "Доходы"
      },
      roadmap: {
        title: "Ваша дорожная карта роялти",
        description: "Как увеличить ваш доход с каждой продажи. Квалифицированная продажа - книга от 5 USD.",
        start: "Старт",
        sales: "продаж",
        current: "текущих",
        target: "цель",
        nextGoal: "Следующая цель",
        salesNeeded: "Нужно ещё {{count}} продаж",
        royalty: "роялти"
      },
      tiers: {
        beginner: "Новичок",
        starter: "Стартер",
        rising: "Растущий",
        bronze: "Бронза",
        bronze_pro: "Бронза Про",
        silver: "Серебро",
        silver_pro: "Серебро Про",
        gold: "Золото",
        diamond: "Алмаз",
        platinum: "Платина",
        platinum_elite: "Платина Элит"
      },
      books: {
        title: "Мои книги",
        sales: "продаж",
        manage: "Управлять",
        noBooks: "Вы еще не загрузили ни одной книги.",
        status: {
          approved: "Одобрено",
          pending: "На рассмотрении",
          rejected: "Отклонено"
        }
      },
      similar: {
        title: "Популярное в вашем жанре",
        description: "Анализируйте тренды, чтобы создавать бестселлеры",
        notFound: "Не удалось найти похожие книги."
      },
    },
    home: {
      hero: {
        tablistLabel: "Разделы главного баннера",
        becomeAuthor: "Стань автором",
        publishHeadline: "Опубликуйте книгу на Kasbook",
        publishDescription: "Получайте прозрачные роялти и доступ к аудитории читателей KAS.",
        publishCta: "Опубликовать рукопись",
        learnMoreCta: "Инструменты для авторов",
        prepareManuscript: "Как подготовить рукопись",
        guideHeadline: "Требования редакции и советы по оформлению",
        guideDescription: "Следуйте гайду Kasbook, чтобы пройти модерацию и быстрее выйти в продажу.",
        prepareCta: "Открыть гайд",
        eventsCta: "Вебинары для авторов",
        bestsellersOne: "Хиты продаж #1",
        bestsellersTwo: "Хиты продаж #2",
        bestsellersThree: "Хиты продаж #3",
        read: "Читать",
        open: "Открыть",
        addToCart: "В корзину"
      },
      cards: {
        exclusive: "Эксклюзив",
        read: "Читать",
        addToCart: "В корзину",
        empty: "Пока нечего показать"
      },
      sections: {
        newWeek: "Новинки недели",
        bestSellers: "Хиты продаж",
        editorsChoice: "Редакция рекомендует",
        freePreviews: "Бесплатные превью",
        aiChoice: "Выбор ИИ",
        classics: "Классика, которая цепляет",
        adventure: "Фантастика и приключения",
        viewAll: "Смотреть всё",
        loading: "Загружаем подборку"
      },
      errors: {
        failedToLoad: "Не удалось загрузить главную ленту",
        tryAgain: "Проверьте соединение и повторите попытку."
      },
      actions: {
        reload: "Обновить"
      }
    },
    footer: {
      catalog: "Каталог",
      authors: "Авторам",
      about: "О проекте",
      support: "Поддержка",
      tagline: "Платформа цифровых книг на блокчейне Kaspa.",
      authorCtaTitle: "Публикуйте и зарабатывайте вместе с Kasbook",
      authorCtaSubtitle: "Загружайте рукописи и отслеживайте продажи в реальном времени.",
      authorCtaButton: "Опубликовать книгу",
      rights: "Все права защищены.",
      actions: {
        darkMode: "Темная тема",
        lightMode: "Светлая тема"
      },
      links: {
        allBooks: "Все книги",
        newReleases: "Новинки",
        bestSellers: "Бестселлеры",
        collections: "Подборки",
        submitBook: "Опубликовать книгу",
        authorGuide: "Гид для авторов",
        royalties: "Роялти",
        events: "Мероприятия",
        aboutProject: "О Kasbook",
        blog: "Блог",
        partners: "Партнёрам",
        careers: "Вакансии",
        helpCenter: "Центр помощи",
        contact: "Связаться",
        status: "Статус сервиса",
        privacy: "Конфиденциальность и безопасность",
        privacyPolicy: "Политика конфиденциальности",
        terms: "Пользовательское соглашение",
        offer: "Публичная оферта"
      }
    },
    subscription: {
      disabledTitle: "Подписка временно недоступна",
      disabledDescription: "Мы обновляем возможности Kasbook Premium. Активные подписчики сохраняют доступ.",
      heroDescription: "Откройте премиальные инструменты чтения, рекомендации ИИ и эксклюзивные релизы.",
      includesTitle: "Что входит",
      features: {
        translationsTitle: "5 переводов книг в месяц",
        translationsDescription: "Переводите книги, когда нет официального издания.",
        catalogTitle: "Расширенный каталог",
        catalogDescription: "Читайте эксклюзивные книги только для подписчиков.",
        notesTitle: "Фоны для заметок",
        notesDescription: "Используйте собственные изображения для оформления заметок.",
        aiTitle: "Аналитика от ИИ",
        aiDescription: "Получайте персональные планы чтения под ваши интересы."
      },
      checkoutTitle: "Активировать подписку",
      checkoutSubtitle: "30 дней полного доступа.",
      priceLabel: "Стоимость",
      priceKas: "≈ {{value}} KAS",
      alreadyActive: "Подписка уже активна",
      subscribeCta: "Подписаться",
      loginCta: "Войдите, чтобы подписаться"
    }
  },

  de: {
    header: {
      catalog: "Katalog",
      library: "Bibliothek",
      notesFeed: "Notiz-Feed", // ADDED
      cart: "Warenkorb",
      authorPanel: "Autoren-Dashboard",
      searchPlaceholder: "Bücher oder Autoren suchen...",
      login: "Anmelden",
      logout: "Abmelden",
      profile: "Profil",
      myAccount: "Mein Konto"
    },
    banner: {
      author: {
        title: "Bis zu 90% Tantiemen für Autoren!",
        description: "Veröffentlichen Sie Ihre Werke und erhalten Sie maximale Einnahmen aus jedem Verkauf.",
        button: "Autor werden"
      },
      catalog: {
        title: "Entdecken Sie die Welt des Wissens",
        description: "Tausende von Büchern stehen Ihnen zur Verfügung. Beginnen Sie heute zu lesen!",
        button: "Zum Katalog"
      },
      ecosystem: {
        title: "Ökosystem auf KAS",
        description: "Kaufen und verkaufen Sie Bücher mit schneller und zuverlässiger Kryptowährung.",
        button: "Mehr erfahren"
      }
    },
    cart: {
      title: "Warenkorb",
      emptyTitle: "Ihr Warenkorb ist leer",
      emptyDescription: "Es sieht so aus, als hätten Sie noch keine Bücher hinzugefügt.",
      toCatalog: "Zum Katalog gehen",
      addToCart: "In den Warenkorb"
    },
    library: {
      title: "Meine Bibliothek",
      description: "Verwalten Sie Ihre Bücher und lesen Sie weiter",
      searchPlaceholder: "Nach Titel oder Autor suchen...",
      loginRequiredTitle: "Bitte anmelden",
      loginRequiredDescription: "Sie müssen sich anmelden, um auf die Bibliothek zuzugreifen.",
      sort: {
        title: "Sortieren",
        recent: "Kürzlich",
        progress: "Nach Fortschritt",
        titleSort: "Nach Titel"
      },
      owned: "Besessen",
      previews: "Vorschauen"
    },
    bookDetails: {
      backToCatalog: "Zurück zum Katalog",
      author: "Autor",
      description: "Beschreibung",
      descriptionMissing: "Beschreibung nicht verfügbar.",
      reviews: "Bewertungen und Bewertung",
      addToCart: "In den Warenkorb",
      addToWishlist: "Zur Wunschliste",
      downloads: "Downloads",
      reviews_count: "Bewertungen",
      views: "Ansichten"
    },
    catalog: {
      found: "Gefunden",
      booksOf: "Bücher von"
    },
    filters: {
      title: "Filter",
      allGenres: "Alle Genres",
      allLanguages: "Alle Sprachen",
      anyRating: "Jede Bewertung",
      minPrice: "Mindestpreis",
      maxPrice: "Höchstpreis",
      genre: "Genre",
      language: "Sprache",
      price: "Preis",
      rating: "Bewertung",
      rating4Plus: "4 Sterne und höher",
      rating3Plus: "3 Sterne und höher",
      rating2Plus: "2 Sterne und höher",
      rating1Plus: "1 Stern und höher"
    },
    genres: {
      fiction: "Belletristik",
      "non-fiction": "Sachbuch",
      science: "Wissenschaft",
      history: "Geschichte",
      business: "Geschäft",
      romance: "Romantik",
      mystery: "Krimi",
      fantasy: "Fantasy",
      biography: "Biographie",
      "self-help": "Selbsthilfe"
    },
    common: {
      search: "Buch finden",
      loading: "Lädt...",
      popular: "Beliebt"
    },
    sort: {
      popular: "Beliebt",
      newest: "Neueste",
      priceLow: "Preis: Niedrig bis Hoch",
      priceHigh: "Preis: Hoch bis Niedrig",
      rating: "Hohe Bewertung"
    },
    author: {
      panel: {
        title: "Autoren-Dashboard",
        description: "Verwalten Sie Ihre Bücher und verfolgen Sie Ihre Analysen."
      },
      tabs: {
        overview: "Übersicht",
        analytics: "Analytik",
        myBooks: "Meine Bücher", // ADDED
        reviews: "Bewertungen",
        comparisons: "Vergleiche",
        upload: "Hochladen"
      },
      stats: {
        totalRevenue: "Gesamteinnahmen",
        booksPublished: "Verkaufte Bücher", // Adjusted to "Verkaufte Bücher"
        currentLevel: "Aktuelles Level",
        nextLevel: "Bis zum nächsten Level",
        totalCopies: "{{count}} Bücher veröffentlicht",
        royalty: "Tantiemen",
        target: "Ziel: {{target}} Verkäufe"
      },
      royalty: {
        currentProgress: "Aktueller Fortschritt",
        qualifiedSales: "qualifizierte Verkäufe",
        next: "Nächstes",
        royalty: "Tantiemen",
        salesUntilUpgrade: "Verkäufe bis zum Upgrade",
        goal: "Ziel",
        sales: "Verkäufe"
      },
      earnings: {
        title: "Einnahmen der letzten 6 Monate",
        noData: "Noch keine Verkaufsdaten",
        noDataDescription: "Ihre Einnahmen erscheinen hier nach den ersten Verkäufen.",
        earnings: "Einnahmen"
      },
      roadmap: {
        title: "Ihre Tantiemen-Roadmap",
        description: "Wie Sie Ihr Einkommen aus jedem Verkauf steigern. Qualifizierter Verkauf - Buch ab 5 USD.",
        start: "Start",
        sales: "Verkäufe",
        current: "aktuell",
        target: "Ziel",
        nextGoal: "Nächstes Ziel",
        salesNeeded: "Noch {{count}} Verkäufe benötigt",
        royalty: "Tantiemen"
      },
      tiers: {
        beginner: "Anfänger",
        starter: "Starter",
        rising: "Aufsteigend",
        bronze: "Bronze",
        bronze_pro: "Bronze Pro",
        silver: "Silber",
        silver_pro: "Silber Pro",
        gold: "Gold",
        diamond: "Diamant",
        platinum: "Platin",
        platinum_elite: "Platin Elite"
      },
      books: {
        title: "Meine Bücher",
        sales: "Verkäufe",
        manage: "Verwalten",
        noBooks: "Sie haben noch keine Bücher hochgeladen.",
        status: {
          approved: "Genehmigt",
          pending: "Ausstehend",
          rejected: "Abgelehnt"
        }
      },
      similar: {
        title: "Beliebt in Ihrem Genre",
        description: "Analysieren Sie Trends, um Bestseller zu erstellen",
        notFound: "Ähnliche Bücher konnten nicht gefunden werden."
      },
    },
    home: {
      hero: {
        tablistLabel: "Empfohlene Bereiche",
        becomeAuthor: "Autor werden",
        publishHeadline: "Veröffentlichen Sie Ihr Buch auf Kasbook",
        publishDescription: "Erreichen Sie Leser weltweit und behalten Sie transparente Tantiemen.",
        publishCta: "Manuskript einreichen",
        learnMoreCta: "Autorentools",
        prepareManuscript: "Manuskript vorbereiten",
        guideHeadline: "Redaktionsstandards und Formatierungstipps",
        guideDescription: "Folgen Sie dem Kasbook-Leitfaden, um die Moderation zu bestehen.",
        prepareCta: "Leitfaden lesen",
        eventsCta: "Autor-Webinare",
        bestsellersOne: "Bestseller #1",
        bestsellersTwo: "Bestseller #2",
        bestsellersThree: "Bestseller #3",
        read: "Lesen",
        open: "Öffnen",
        addToCart: "In den Warenkorb"
      },
      cards: {
        exclusive: "Exklusiv",
        read: "Lesen",
        addToCart: "In den Warenkorb",
        empty: "Keine Bücher verfügbar"
      },
      sections: {
        newWeek: "Neu diese Woche",
        bestSellers: "Top-Verkäufe",
        editorsChoice: "Empfehlung der Redaktion",
        freePreviews: "Kostenlose Vorschauen",
        aiChoice: "KI-Auswahl",
        classics: "Klassiker, die berühren",
        adventure: "Fantasy & Abenteuer",
        viewAll: "Alle anzeigen",
        loading: "Auswahl wird geladen"
      },
      errors: {
        failedToLoad: "Startseite konnte nicht geladen werden",
        tryAgain: "Verbindung prüfen und erneut versuchen."
      },
      actions: {
        reload: "Neu laden"
      }
    },
    footer: {
      catalog: "Katalog",
      authors: "Für Autoren",
      about: "Über uns",
      support: "Support",
      tagline: "Digitale Bücher auf der Kaspa-Blockchain.",
      authorCtaTitle: "Teilen Sie Ihre Geschichten mit Kasbook",
      authorCtaSubtitle: "Laden Sie Manuskripte hoch und verfolgen Sie Verkäufe in Echtzeit.",
      authorCtaButton: "Buch veröffentlichen",
      rights: "Alle Rechte vorbehalten.",
      actions: {
        darkMode: "Dunkles Design",
        lightMode: "Helles Design"
      },
      links: {
        allBooks: "Alle Bücher",
        newReleases: "Neuheiten",
        bestSellers: "Bestseller",
        collections: "Kollektionen",
        submitBook: "Buch einreichen",
        authorGuide: "Autorenleitfaden",
        royalties: "Tantiemen",
        events: "Workshops",
        aboutProject: "Über Kasbook",
        blog: "Blog",
        partners: "Partner",
        careers: "Karriere",
        helpCenter: "Hilfezentrum",
        contact: "Kontakt",
        status: "Systemstatus",
        privacy: "Datenschutz & Sicherheit",
        privacyPolicy: "Datenschutzerklärung",
        terms: "Nutzungsbedingungen",
        offer: "Öffentliches Angebot"
      }
    },
    subscription: {
      disabledTitle: "Abonnement vorübergehend nicht verfügbar",
      disabledDescription: "Wir erneuern Kasbook Premium. Aktive Abonnenten behalten den Zugriff.",
      heroDescription: "Entsperren Sie Premium-Lesetools, KI-Empfehlungen und exklusive Neuheiten.",
      includesTitle: "Inhalt",
      features: {
        translationsTitle: "5 Buchübersetzungen pro Monat",
        translationsDescription: "Übersetzen Sie Titel ohne offizielle Ausgabe.",
        catalogTitle: "Erweiterter Premium-Katalog",
        catalogDescription: "Lesen Sie exklusive Bücher nur für Abonnenten.",
        notesTitle: "Eigene Notiz-Hintergründe",
        notesDescription: "Verwenden Sie eigene Bilder für Ihre Notizen.",
        aiTitle: "KI-Analyse",
        aiDescription: "Erhalten Sie personalisierte Lesepläne."
      },
      checkoutTitle: "Abonnement aktivieren",
      checkoutSubtitle: "30 Tage voller Zugriff.",
      priceLabel: "Preis",
      priceKas: "≈ {{value}} KAS",
      alreadyActive: "Abonnement bereits aktiv",
      subscribeCta: "Abonnieren",
      loginCta: "Anmelden zum Abonnieren"
    }
  },

  fr: {
    header: {
      catalog: "Catalogue",
      library: "Bibliothèque",
      notesFeed: "Fil de notes", // ADDED
      cart: "Panier",
      authorPanel: "Tableau de bord auteur",
      searchPlaceholder: "Rechercher des livres, auteurs...",
      login: "Se connecter",
      logout: "Se déconnecter",
      profile: "Profil",
      myAccount: "Mon compte"
    },
    banner: {
      author: {
        title: "Jusqu'à 90% de redevances pour les auteurs!",
        description: "Publiez vos œuvres et obtenez un revenu maximal de chaque vente.",
        button: "Devenir auteur"
      },
      catalog: {
        title: "Découvrez le monde de la connaissance",
        description: "Des milliers de livres à votre disposition. Commencez à lire aujourd'hui!",
        button: "Vers le catalogue"
      },
      ecosystem: {
        title: "Écosystème sur KAS",
        description: "Achetez et vendez des livres avec une cryptomonnaie rapide et fiable.",
        button: "En savoir plus"
      }
    },
    cart: {
      title: "Panier",
      emptyTitle: "Votre panier est vide",
      emptyDescription: "Il semble que vous n'ayez encore ajouté aucun livre.",
      toCatalog: "Aller au catalogue",
      addToCart: "Ajouter au panier"
    },
    library: {
      title: "Ma bibliothèque",
      description: "Gérez vos livres et continuez la lecture",
      searchPlaceholder: "Rechercher par titre ou auteur...",
      loginRequiredTitle: "Veuillez vous connecter",
      loginRequiredDescription: "Vous devez vous connecter pour accéder à la bibliothèque.",
      sort: {
        title: "Trier",
        recent: "Récent",
        progress: "Par progression",
        titleSort: "Par titre"
      },
      owned: "Possédés",
      previews: "Aperçus"
    },
    bookDetails: {
      backToCatalog: "Retour au catalogue",
      author: "Auteur",
      description: "Description",
      descriptionMissing: "Description non disponible.",
      reviews: "Avis et notation",
      addToCart: "Ajouter au panier",
      addToWishlist: "Ajouter à la liste de souhaits",
      downloads: "téléchargements",
      reviews_count: "avis",
      views: "vues"
    },
    catalog: {
      found: "Trouvé",
      booksOf: "livres de"
    },
    filters: {
      title: "Filtres",
      allGenres: "Tous les genres",
      allLanguages: "Toutes les langues",
      anyRating: "Toute note",
      minPrice: "Prix minimum",
      maxPrice: "Prix maximum",
      genre: "Genre",
      language: "Langue",
      price: "Prix",
      rating: "Note",
      rating4Plus: "4 étoiles et plus",
      rating3Plus: "3 étoiles et plus",
      rating2Plus: "2 étoiles et plus",
      rating1Plus: "1 étoile et plus"
    },
    genres: {
      fiction: "Fiction",
      "non-fiction": "Non-fiction",
      science: "Science",
      history: "Histoire",
      business: "Affaires",
      romance: "Romance",
      mystery: "Mystère",
      fantasy: "Fantaisie",
      biography: "Biographie",
      "self-help": "Développement personnel"
    },
    common: {
      search: "Rechercher",
      loading: "Chargement...",
      popular: "Populaire"
    },
    sort: {
      popular: "Populaire",
      newest: "Plus récent",
      priceLow: "Prix: Bas vers Haut",
      priceHigh: "Prix: Haut vers Bas",
      rating: "Note élevée"
    },
    author: {
      panel: {
        title: "Tableau de bord auteur",
        description: "Gérez vos livres et suivez vos analyses."
      },
      tabs: {
        overview: "Aperçu",
        analytics: "Analyses",
        myBooks: "Mes livres", // ADDED
        reviews: "Avis",
        comparisons: "Comparaisons",
        upload: "Télécharger"
      },
      stats: {
        totalRevenue: "Revenus totaux",
        booksPublished: "Livres vendus", // Adjusted to "Livres vendus"
        currentLevel: "Niveau actuel",
        nextLevel: "Jusqu'au niveau suivant",
        totalCopies: "{{count}} livres publiés",
        royalty: "redevances",
        target: "Objectif: {{target}} ventes"
      },
      royalty: {
        currentProgress: "Progrès actuel",
        qualifiedSales: "ventes qualifiées",
        next: "Suivant",
        royalty: "redevances",
        salesUntilUpgrade: "ventes jusqu'à la mise à niveau",
        goal: "Objectif",
        sales: "ventes"
      },
      earnings: {
        title: "Revenus des 6 derniers mois",
        noData: "Pas encore de données de vente",
        noDataDescription: "Vos revenus apparaîtront ici après les premières ventes.",
        earnings: "Revenus"
      },
      roadmap: {
        title: "Votre feuille de route des redevances",
        description: "Comment augmenter vos revenus de chaque vente. Vente qualifiée - livre à partir de 5 USD.",
        start: "Début",
        sales: "ventes",
        current: "actuel",
        target: "objectif",
        nextGoal: "Objectif suivant",
        salesNeeded: "Encore {{count}} ventes nécessaires",
        royalty: "redevances"
      },
      tiers: {
        beginner: "Débutant",
        starter: "Démarreur",
        rising: "En hausse",
        bronze: "Bronze",
        bronze_pro: "Bronze Pro",
        silver: "Argent",
        silver_pro: "Argent Pro",
        gold: "Or",
        diamond: "Diamant",
        platinum: "Platine",
        platinum_elite: "Platine Elite"
      },
      books: {
        title: "Mes livres",
        sales: "ventes",
        manage: "Gérer",
        noBooks: "Vous n'avez encore téléchargé aucun livre.",
        status: {
          approved: "Approuvé",
          pending: "En attente",
          rejected: "Rejeté"
        }
      },
      similar: {
        title: "Populaire dans votre genre",
        description: "Analysez les tendances pour créer des best-sellers",
        notFound: "Impossible de trouver des livres similaires."
      },
    },
    home: {
      hero: {
        tablistLabel: "Sections en vedette",
        becomeAuthor: "Devenir auteur",
        publishHeadline: "Publiez votre livre sur Kasbook",
        publishDescription: "Touchez des lecteurs dans le monde entier avec des redevances transparentes.",
        publishCta: "Soumettre un manuscrit",
        learnMoreCta: "Outils auteurs",
        prepareManuscript: "Préparer son manuscrit",
        guideHeadline: "Normes éditoriales et conseils de mise en page",
        guideDescription: "Suivez le guide Kasbook pour réussir la modération et lancer plus vite.",
        prepareCta: "Lire le guide",
        eventsCta: "Webinaires auteurs",
        bestsellersOne: "Meilleures ventes #1",
        bestsellersTwo: "Meilleures ventes #2",
        bestsellersThree: "Meilleures ventes #3",
        read: "Lire",
        open: "Ouvrir",
        addToCart: "Ajouter au panier"
      },
      cards: {
        exclusive: "Exclusivité",
        read: "Lire",
        addToCart: "Ajouter au panier",
        empty: "Aucun livre pour le moment"
      },
      sections: {
        newWeek: "Nouveautés de la semaine",
        bestSellers: "Meilleures ventes",
        editorsChoice: "Sélection de la rédaction",
        freePreviews: "Extraits gratuits",
        aiChoice: "Choix de l'IA",
        classics: "Classiques inspirants",
        adventure: "Fantastique et aventures",
        viewAll: "Tout voir",
        loading: "Chargement de la sélection"
      },
      errors: {
        failedToLoad: "Impossible de charger l'accueil",
        tryAgain: "Vérifiez votre connexion et réessayez."
      },
      actions: {
        reload: "Recharger"
      }
    },
    footer: {
      catalog: "Catalogue",
      authors: "Auteurs",
      about: "À propos",
      support: "Support",
      tagline: "Livres numériques propulsés par la blockchain Kaspa.",
      authorCtaTitle: "Publiez vos histoires avec Kasbook",
      authorCtaSubtitle: "Déposez vos manuscrits et suivez vos ventes en direct.",
      authorCtaButton: "Publier un livre",
      rights: "Tous droits réservés.",
      actions: {
        darkMode: "Mode sombre",
        lightMode: "Mode clair"
      },
      links: {
        allBooks: "Tous les livres",
        newReleases: "Nouveautés",
        bestSellers: "Meilleures ventes",
        collections: "Collections",
        submitBook: "Soumettre un livre",
        authorGuide: "Guide auteur",
        royalties: "Redevances",
        events: "Ateliers",
        aboutProject: "À propos de Kasbook",
        blog: "Blog",
        partners: "Partenaires",
        careers: "Carrières",
        helpCenter: "Centre d'aide",
        contact: "Contact",
        status: "Statut du service",
        privacy: "Confidentialité et sécurité",
        privacyPolicy: "Politique de confidentialité",
        terms: "Conditions d'utilisation",
        offer: "Offre publique"
      }
    },
    subscription: {
      disabledTitle: "Abonnement temporairement indisponible",
      disabledDescription: "Nous améliorons Kasbook Premium. Les abonnés actifs conservent leur accès.",
      heroDescription: "Débloquez des outils de lecture premium, des recommandations IA et des sorties exclusives.",
      includesTitle: "Ce qui est inclus",
      features: {
        translationsTitle: "5 traductions par mois",
        translationsDescription: "Traduisez les titres sans édition officielle.",
        catalogTitle: "Catalogue premium étendu",
        catalogDescription: "Lisez des ouvrages exclusifs réservés aux abonnés.",
        notesTitle: "Arrière-plans de notes personnalisés",
        notesDescription: "Utilisez vos propres images pour vos notes.",
        aiTitle: "Analyse IA",
        aiDescription: "Recevez des plans de lecture personnalisés."
      },
      checkoutTitle: "Activer l'abonnement",
      checkoutSubtitle: "30 jours d'accès complet.",
      priceLabel: "Prix",
      priceKas: "≈ {{value}} KAS",
      alreadyActive: "Abonnement déjà actif",
      subscribeCta: "S'abonner",
      loginCta: "Se connecter pour s'abonner"
    }
  },

  es: {
    header: {
      catalog: "Catálogo",
      library: "Biblioteca",
      notesFeed: "Feed de notas", // ADDED
      cart: "Carrito",
      authorPanel: "Panel de autor",
      searchPlaceholder: "Buscar libros, autores...",
      login: "Iniciar sesión",
      logout: "Cerrar sesión",
      profile: "Perfil",
      myAccount: "Mi cuenta"
    },
    banner: {
      author: {
        title: "¡Hasta 90% de regalías para autores!",
        description: "Publique sus obras y obtenga ingresos máximos de cada venta.",
        button: "Convertirse en autor"
      },
      catalog: {
        title: "Descubra el mundo del conocimiento",
        description: "Miles de libros a su disposición. ¡Comience a leer hoy!",
        button: "Al catálogo"
      },
      ecosystem: {
        title: "Ecosistema en KAS",
        description: "Compre y venda libros con criptomoneda rápida y confiable.",
        button: "Más información"
      }
    },
    cart: {
      title: "Carrito",
      emptyTitle: "Su carrito está vacío",
      emptyDescription: "Parece que aún no ha agregado ningún libro.",
      toCatalog: "Ir al catálogo",
      addToCart: "Agregar al carrito"
    },
    library: {
      title: "Mi biblioteca",
      description: "Administre sus libros y continúe leyendo",
      searchPlaceholder: "Buscar por título o autor...",
      loginRequiredTitle: "Por favor inicie sesión",
      loginRequiredDescription: "Necesita iniciar sesión para acceder a la biblioteca.",
      sort: {
        title: "Ordenar",
        recent: "Reciente",
        progress: "Por progreso",
        titleSort: "Por título"
      },
      owned: "Poseído",
      previews: "Vistas previas"
    },
    bookDetails: {
      backToCatalog: "Volver al catálogo",
      author: "Autor",
      description: "Descripción",
      descriptionMissing: "Descripción no disponible.",
      reviews: "Reseñas y calificación",
      addToCart: "Agregar al carrito",
      addToWishlist: "Agregar a lista de deseos",
      downloads: "descargas",
      reviews_count: "reseñas",
      views: "vistas"
    },
    catalog: {
      found: "Encontrado",
      booksOf: "libros de"
    },
    filters: {
      title: "Filtros",
      allGenres: "Todos los géneros",
      allLanguages: "Todos los idiomas",
      anyRating: "Cualquier calificación",
      minPrice: "Precio mínimo",
      maxPrice: "Precio máximo",
      genre: "Género",
      language: "Idioma",
      price: "Precio",
      rating: "Calificación",
      rating4Plus: "4 estrellas y más",
      rating3Plus: "3 estrellas y más",
      rating2Plus: "2 estrellas y más",
      rating1Plus: "1 estrella y más"
    },
    genres: {
      fiction: "Ficción",
      "non-fiction": "No ficción",
      science: "Ciencia",
      history: "Historia",
      business: "Negocios",
      romance: "Romance",
      mystery: "Misterio",
      fantasy: "Fantasía",
      biography: "Biografía",
      "self-help": "Autoayuda"
    },
    common: {
      search: "Buscar",
      loading: "Cargando...",
      popular: "Popular"
    },
    sort: {
      popular: "Popular",
      newest: "Más nuevo",
      priceLow: "Precio: Bajo a Alto",
      priceHigh: "Precio: Alto a Bajo",
      rating: "Calificación alta"
    },
    author: {
      panel: {
        title: "Panel de autor",
        description: "Administre sus libros y rastree sus análisis."
      },
      tabs: {
        overview: "Resumen",
        analytics: "Análisis",
        myBooks: "Mis libros", // ADDED
        reviews: "Reseñas",
        comparisons: "Comparaciones",
        upload: "Subir"
      },
      stats: {
        totalRevenue: "Ingresos totales",
        booksPublished: "Libros vendidos", // Adjusted to "Libros vendidos"
        currentLevel: "Nivel actual",
        nextLevel: "Hasta el siguiente nivel",
        totalCopies: "{{count}} libros publicados",
        royalty: "regalías",
        target: "Objetivo: {{target}} ventas"
      },
      royalty: {
        currentProgress: "Progreso actual",
        qualifiedSales: "ventas calificadas",
        next: "Siguiente",
        royalty: "regalías",
        salesUntilUpgrade: "ventas hasta la actualización",
        goal: "Objetivo",
        sales: "ventas"
      },
      earnings: {
        title: "Ingresos de los últimos 6 meses",
        noData: "Aún no hay datos de ventas",
        noDataDescription: "Sus ingresos aparecerán aquí después de las primeras ventas.",
        earnings: "Ingresos"
      },
      roadmap: {
        title: "Su hoja de ruta de regalías",
        description: "Cómo aumentar sus ingresos de cada venta. Venta calificada - libro desde 5 USD.",
        start: "Inicio",
        sales: "ventas",
        current: "actual",
        target: "objetivo",
        nextGoal: "Siguiente objetivo",
        salesNeeded: "Necesita {{count}} ventas más",
        royalty: "regalías"
      },
      tiers: {
        beginner: "Principiante",
        starter: "Iniciador",
        rising: "En ascenso",
        bronze: "Bronce",
        bronze_pro: "Bronce Pro",
        silver: "Plata",
        silver_pro: "Plata Pro",
        gold: "Oro",
        diamond: "Diamante",
        platinum: "Platino",
        platinum_elite: "Platino Elite"
      },
      books: {
        title: "Mis libros",
        sales: "ventas",
        manage: "Administrar",
        noBooks: "Aún no ha subido ningún libro.",
        status: {
          approved: "Aprobado",
          pending: "Pendiente",
          rejected: "Rechazado"
        }
      },
      similar: {
        title: "Popular en su género",
        description: "Analice tendencias para crear best-sellers",
        notFound: "No se pudieron encontrar libros similares."
      },
    },
    home: {
      hero: {
        tablistLabel: "Secciones destacadas",
        becomeAuthor: "Conviértete en autor",
        publishHeadline: "Publica tu libro en Kasbook",
        publishDescription: "Llega a lectores de todo el mundo con regalías transparentes.",
        publishCta: "Enviar manuscrito",
        learnMoreCta: "Herramientas para autores",
        prepareManuscript: "Preparar manuscrito",
        guideHeadline: "Estándares editoriales y consejos de formato",
        guideDescription: "Sigue la guía Kasbook para aprobar la moderación y lanzar más rápido.",
        prepareCta: "Leer la guía",
        eventsCta: "Webinars para autores",
        bestsellersOne: "Más vendidos #1",
        bestsellersTwo: "Más vendidos #2",
        bestsellersThree: "Más vendidos #3",
        read: "Leer",
        open: "Abrir",
        addToCart: "Añadir al carrito"
      },
      cards: {
        exclusive: "Exclusivo",
        read: "Leer",
        addToCart: "Añadir al carrito",
        empty: "No hay libros por ahora"
      },
      sections: {
        newWeek: "Novedades de la semana",
        bestSellers: "Éxitos de ventas",
        editorsChoice: "Recomendado por la redacción",
        freePreviews: "Previas gratuitas",
        aiChoice: "Elección de la IA",
        classics: "Clásicos que inspiran",
        adventure: "Fantasía y aventuras",
        viewAll: "Ver todo",
        loading: "Cargando selección"
      },
      errors: {
        failedToLoad: "No pudimos cargar la portada",
        tryAgain: "Revisa tu conexión e inténtalo de nuevo."
      },
      actions: {
        reload: "Recargar"
      }
    },
    footer: {
      catalog: "Catálogo",
      authors: "Autores",
      about: "Acerca de",
      support: "Soporte",
      tagline: "Libros digitales impulsados por la blockchain de Kaspa.",
      authorCtaTitle: "Comparte tus historias con Kasbook",
      authorCtaSubtitle: "Sube manuscritos y sigue tus ventas en tiempo real.",
      authorCtaButton: "Publicar un libro",
      rights: "Todos los derechos reservados.",
      actions: {
        darkMode: "Modo oscuro",
        lightMode: "Modo claro"
      },
      links: {
        allBooks: "Todos los libros",
        newReleases: "Novedades",
        bestSellers: "Más vendidos",
        collections: "Colecciones",
        submitBook: "Enviar libro",
        authorGuide: "Guía para autores",
        royalties: "Regalías",
        events: "Talleres",
        aboutProject: "Sobre Kasbook",
        blog: "Blog",
        partners: "Socios",
        careers: "Carreras",
        helpCenter: "Centro de ayuda",
        contact: "Contacto",
        status: "Estado del servicio",
        privacy: "Privacidad y seguridad",
        privacyPolicy: "Política de privacidad",
        terms: "Términos de uso",
        offer: "Oferta pública"
      }
    },
    subscription: {
      disabledTitle: "Suscripción temporalmente no disponible",
      disabledDescription: "Estamos renovando Kasbook Premium. Los suscriptores activos mantienen el acceso.",
      heroDescription: "Desbloquea herramientas premium, recomendaciones de IA y lanzamientos exclusivos.",
      includesTitle: "Qué incluye",
      features: {
        translationsTitle: "5 traducciones al mes",
        translationsDescription: "Traduce títulos cuando no exista edición oficial.",
        catalogTitle: "Catálogo premium ampliado",
        catalogDescription: "Lee libros exclusivos solo para suscriptores.",
        notesTitle: "Fondos personalizados para notas",
        notesDescription: "Usa tus propias imágenes para destacar tus notas.",
        aiTitle: "Análisis con IA",
        aiDescription: "Recibe planes de lectura personalizados."
      },
      checkoutTitle: "Activar suscripción",
      checkoutSubtitle: "30 días de acceso completo.",
      priceLabel: "Precio",
      priceKas: "≈ {{value}} KAS",
      alreadyActive: "Suscripción ya activa",
      subscribeCta: "Suscribirse",
      loginCta: "Inicia sesión para suscribirte"
    }
  }
});

class SimpleI18n {
  constructor() {
    this.currentLanguage = this.detectLanguage();
    this.listeners = [];
    this.loadedTranslations = translations; // Direct access to translations
  }

  detectLanguage() {
    // Check localStorage
    const saved = localStorage.getItem('kasbook-language');
    if (saved && translations[saved]) {
      return saved;
    }

    // Check URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    if (urlLang && translations[urlLang]) {
      return urlLang;
    }

    // Check browser language
    const browserLang = navigator.language.split('-')[0];
    if (translations[browserLang]) {
      return browserLang;
    }

    // Fallback
    return 'ru';
  }

  async changeLanguage(lang) {
    if (translations[lang]) {
      this.currentLanguage = lang;
      localStorage.setItem('kasbook-language', lang);
      this.notifyListeners();

      // Force page refresh to ensure all components re-render
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  }

  t(key, options = {}, fallback = key) { // Added options parameter
    const currentTranslations = this.loadedTranslations[this.currentLanguage] || {};
    const keys = key.split('.');
    let value = currentTranslations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        value = undefined;
        break;
      }
    }

    // Enhanced fallback logic: try English if translation not found in current language
    if (value === undefined && this.currentLanguage !== 'en') {
      const englishTranslations = this.loadedTranslations['en'] || {};
      let englishValue = englishTranslations;
      for (const k of keys) {
        if (englishValue && typeof englishValue === 'object' && k in englishValue) {
          englishValue = englishValue[k];
        } else {
          englishValue = undefined;
          break;
        }
      }
      value = englishValue;
    }

    let result = value !== undefined ? value : fallback;

    // Add interpolation logic for `{{key}}` placeholders
    if (typeof result === 'string' && options && Object.keys(options).length > 0) {
      for (const optKey in options) {
        if (Object.prototype.hasOwnProperty.call(options, optKey)) {
          // Use a more robust regex for interpolation
          result = result.replace(new RegExp(`{{\\s*${optKey}\\s*}}`, 'g'), options[optKey]);
        }
      }
    }

    return result;
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach(callback => callback(this.currentLanguage));
  }

  get language() {
    return this.currentLanguage;
  }
}

export const i18n = new SimpleI18n();

// React hook for use in components
export const useTranslation = () => {
  const [language, setLanguage] = useState(i18n.language);
  const isReady = true; // Always ready since we have direct access

  useEffect(() => {
    const unsubscribe = i18n.subscribe((newLang) => {
      setLanguage(newLang);
    });
    return unsubscribe;
  }, []);

  return {
    t: (key, options, fallback) => i18n.t(key, options, fallback), // Updated signature for t
    language,
    i18n: {
      language,
      changeLanguage: i18n.changeLanguage.bind(i18n),
      isReady
    }
  };
};

// Hook for dynamic content translation
export const useDynamicTranslation = (originalText, sourceLanguage = 'ru') => {
  const { language, i18n: { isReady } } = useTranslation();
  const [translatedText, setTranslatedText] = useState(originalText);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const doTranslate = async () => {
      if (!isReady || !originalText || language === sourceLanguage) {
        setTranslatedText(originalText);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const translation = await translateText(originalText, language, sourceLanguage);
        setTranslatedText(translation);
      } catch (error) {
        console.error("Dynamic translation failed:", error);
        setTranslatedText(originalText); // Fallback to original text on error
      } finally {
        setIsLoading(false);
      }
    };

    doTranslate();
  }, [originalText, language, sourceLanguage, isReady]);

  return { translatedText, isLoading };
};
