import { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
  };
  noindex?: boolean;
}

const BASE_URL = 'https://polytrak.io';
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;

export function SEOHead({
  title,
  description,
  canonicalUrl,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  article,
  noindex = false,
}: SEOHeadProps) {
  useEffect(() => {
    // Set document title
    document.title = title;

    // Helper to set or create meta tag
    const setMetaTag = (name: string, content: string, property = false) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.name = name;
        }
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Helper to set or create link tag
    const setLinkTag = (rel: string, href: string) => {
      let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        document.head.appendChild(link);
      }
      link.href = href;
    };

    // Basic meta tags
    setMetaTag('description', description);
    
    // Robots
    if (noindex) {
      setMetaTag('robots', 'noindex, nofollow');
    } else {
      setMetaTag('robots', 'index, follow');
    }

    // Canonical URL
    const fullCanonicalUrl = canonicalUrl 
      ? `${BASE_URL}${canonicalUrl}` 
      : window.location.href.split('?')[0];
    setLinkTag('canonical', fullCanonicalUrl);

    // Open Graph tags
    setMetaTag('og:title', title, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:url', fullCanonicalUrl, true);
    setMetaTag('og:image', ogImage, true);
    setMetaTag('og:type', ogType, true);
    setMetaTag('og:site_name', 'PolyTrak', true);

    // Twitter Card tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', ogImage);
    setMetaTag('twitter:site', '@polytrak_io');

    // Article-specific meta tags
    if (ogType === 'article' && article) {
      if (article.publishedTime) {
        setMetaTag('article:published_time', article.publishedTime, true);
      }
      if (article.modifiedTime) {
        setMetaTag('article:modified_time', article.modifiedTime, true);
      }
      if (article.author) {
        setMetaTag('article:author', article.author, true);
      }
    }
  }, [title, description, canonicalUrl, ogImage, ogType, article, noindex]);

  return null;
}
