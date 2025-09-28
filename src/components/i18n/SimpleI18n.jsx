
// Простая система интернационализации без внешних зависимомостей
import React, { useState, useEffect, useCallback } from 'react';
import { translateText } from '../utils/translationService';

// Complete translations with full coverage - adding French and Spanish
const translations = {
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
      }
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
      }
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
      }
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
      }
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
      }
    }
  }
};

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
  const [isReady, setIsReady] = useState(true); // Always ready since we have direct access

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
