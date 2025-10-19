// SEO utilities for dynamic sitemap and robots.txt generation
import { supabase } from './supabase.jsx';
import { getBookCoverUrl } from '@/lib/books/coverImages';

export const seoUtils = {
  // Generate dynamic sitemap.xml
  async generateSitemap() {
    try {
      const baseUrl = 'https://kasbook.com';
      const currentDate = new Date().toISOString();
      
      // Get all approved books for sitemap
      const { data: books } = await supabase
        .from('v_books_public')
        .select('id, updated_at')
        .eq('status', 'approved');

      // Get all authors
      const { data: authors } = await supabase
        .from('users')
        .select('id, updated_at')
        .eq('user_type', 'author');

      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/catalog</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/register-author</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;

      // Add book pages
      books?.forEach(book => {
        sitemap += `
  <url>
    <loc>${baseUrl}/book/${book.id}</loc>
    <lastmod>${book.updated_at}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      });

      // Add author pages
      authors?.forEach(author => {
        sitemap += `
  <url>
    <loc>${baseUrl}/author/${author.id}</loc>
    <lastmod>${author.updated_at}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
      });

      sitemap += `
</urlset>`;

      return sitemap;
    } catch (error) {
      console.error('Error generating sitemap:', error);
      return null;
    }
  },

  // Generate robots.txt
  generateRobotsTxt() {
    return `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /private/

Sitemap: https://kasbook.com/sitemap.xml

# Specific bots
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: facebookexternalhit
Allow: /

# Block malicious bots
User-agent: SemrushBot
Disallow: /

User-agent: AhrefsBot
Disallow: /`;
  },

  // Generate meta tags for specific pages
  getBookMetaTags(book, language = 'ru') {
    const getTranslated = (field) => {
      const translation = book.languages?.find(l => l.lang === language);
      return translation?.[field] || book[field] || '';
    };

    const image = getBookCoverUrl(book, { fallback: null }) || '';

    return {
      title: getTranslated('title'),
      description: getTranslated('description'),
      keywords: `${book.genre}, ${book.author}, книги, ${getTranslated('title')}`,
      image,
      url: `/book/${book.id}`,
      type: 'book',
      author: book.author,
      publishedTime: book.created_at,
      modifiedTime: book.updated_at
    };
  },

  getAuthorMetaTags(author) {
    return {
      title: `${author.full_name} - Автор на KASBOOK`,
      description: author.author_bio || `Книги автора ${author.full_name} на платформе KASBOOK`,
      keywords: `${author.full_name}, автор, книги, публикации`,
      image: author.avatar_url,
      url: `/author/${author.id}`,
      type: 'profile',
      author: author.full_name
    };
  }
};

// A/B Testing utilities
export const abTestUtils = {
  // Initialize A/B test
  initTest(testName, variants, trafficSplit = 0.5) {
    const userId = this.getUserId();
    const userHash = this.hashUserId(userId);
    const variantIndex = userHash < trafficSplit ? 0 : 1;
    const selectedVariant = variants[variantIndex];
    
    // Store test assignment
    localStorage.setItem(`ab_test_${testName}`, JSON.stringify({
      variant: selectedVariant,
      testName,
      assignedAt: Date.now()
    }));
    
    // Track assignment event
    this.trackEvent('ab_test_assigned', {
      testName,
      variant: selectedVariant,
      userId
    });
    
    return selectedVariant;
  },

  // Get user's variant for a test
  getVariant(testName) {
    const stored = localStorage.getItem(`ab_test_${testName}`);
    return stored ? JSON.parse(stored).variant : null;
  },

  // Track conversion event
  trackConversion(testName, conversionType = 'default', value = 1) {
    const testData = localStorage.getItem(`ab_test_${testName}`);
    if (!testData) return;

    const { variant } = JSON.parse(testData);
    
    this.trackEvent('ab_test_conversion', {
      testName,
      variant,
      conversionType,
      value,
      userId: this.getUserId()
    });
  },

  // Track custom event
  trackEvent(eventName, properties = {}) {
    const event = {
      event: eventName,
      properties: {
        ...properties,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      }
    };

    // Store events locally (in production, send to analytics service)
    const events = JSON.parse(localStorage.getItem('ab_test_events') || '[]');
    events.push(event);
    localStorage.setItem('ab_test_events', JSON.stringify(events.slice(-1000))); // Keep last 1000 events
    
    console.log('A/B Test Event:', event);
  },

  // Utility functions
  getUserId() {
    let userId = localStorage.getItem('ab_user_id');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('ab_user_id', userId);
    }
    return userId;
  },

  hashUserId(userId) {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) / 2147483647; // Normalize to 0-1
  },

  // Get test results
  getTestResults() {
    const events = JSON.parse(localStorage.getItem('ab_test_events') || '[]');
    const results = {};

    events.forEach(event => {
      if (event.event === 'ab_test_assigned' || event.event === 'ab_test_conversion') {
        const { testName, variant } = event.properties;
        
        if (!results[testName]) {
          results[testName] = {};
        }
        
        if (!results[testName][variant]) {
          results[testName][variant] = { assignments: 0, conversions: 0 };
        }
        
        if (event.event === 'ab_test_assigned') {
          results[testName][variant].assignments++;
        } else {
          results[testName][variant].conversions++;
        }
      }
    });

    // Calculate conversion rates
    Object.keys(results).forEach(testName => {
      Object.keys(results[testName]).forEach(variant => {
        const data = results[testName][variant];
        data.conversionRate = data.assignments > 0 ? (data.conversions / data.assignments) * 100 : 0;
      });
    });

    return results;
  }
};