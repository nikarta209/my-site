import React from 'react';
import { Helmet } from './Helmet';
import { useTranslation } from '../i18n/SimpleI18n';

export default function MetaTags({ 
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  author,
  publishedTime,
  modifiedTime
}) {
  const { t, i18n } = useTranslation();
  
  const siteName = 'KASBOOK';
  const defaultDescription = t('descriptions.platform', 'Revolutionary blockchain-based book platform');
  const defaultImage = '/images/kasbook-og.jpg';
  const baseUrl = 'https://kasbook.com';

  const metaTitle = title ? `${title} | ${siteName}` : siteName;
  const metaDescription = description || defaultDescription;
  const metaImage = image || defaultImage;
  const metaUrl = url ? `${baseUrl}${url}` : baseUrl;
  const metaKeywords = keywords || 'books, blockchain, NFT, digital books, authors, reading, kaspa';

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={metaKeywords} />
      <meta name="author" content={author || siteName} />
      <meta name="language" content={i18n.language} />
      <meta name="robots" content="index,follow" />
      <meta name="googlebot" content="index,follow" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={metaUrl} />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:url" content={metaUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={i18n.language === 'ru' ? 'ru_RU' : 'en_US'} />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
      <meta name="twitter:site" content="@kasbook" />
      <meta name="twitter:creator" content="@kasbook" />
      
      {/* Article specific meta tags */}
      {type === 'article' && (
        <>
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {author && <meta property="article:author" content={author} />}
        </>
      )}
      
      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": type === 'article' ? 'Article' : 'WebSite',
          "name": metaTitle,
          "description": metaDescription,
          "url": metaUrl,
          "image": metaImage,
          "author": {
            "@type": "Organization",
            "name": author || siteName
          },
          "publisher": {
            "@type": "Organization",
            "name": siteName,
            "logo": {
              "@type": "ImageObject",
              "url": `${baseUrl}/images/logo.png`
            }
          },
          ...(publishedTime && { "datePublished": publishedTime }),
          ...(modifiedTime && { "dateModified": modifiedTime })
        })}
      </script>
    </Helmet>
  );
}