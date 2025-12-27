import { useEffect } from 'react';

interface SoftwareApplicationSchema {
  type: 'SoftwareApplication';
  name: string;
  description: string;
  applicationCategory: string;
  operatingSystem: string;
  url: string;
  offers?: {
    price: string;
    priceCurrency: string;
  };
}

interface ArticleSchema {
  type: 'Article';
  headline: string;
  description: string;
  author: string;
  publisher: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  url: string;
}

interface FAQSchema {
  type: 'FAQPage';
  questions: Array<{
    question: string;
    answer: string;
  }>;
}

type SchemaType = SoftwareApplicationSchema | ArticleSchema | FAQSchema;

interface StructuredDataProps {
  schema: SchemaType;
}

const BASE_URL = 'https://polytrak.io';

function generateSchema(schema: SchemaType): object {
  switch (schema.type) {
    case 'SoftwareApplication':
      return {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': schema.name,
        'description': schema.description,
        'applicationCategory': schema.applicationCategory,
        'operatingSystem': schema.operatingSystem,
        'url': schema.url,
        'offers': schema.offers ? {
          '@type': 'Offer',
          'price': schema.offers.price,
          'priceCurrency': schema.offers.priceCurrency,
        } : undefined,
      };

    case 'Article':
      return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': schema.headline,
        'description': schema.description,
        'author': {
          '@type': 'Organization',
          'name': schema.author,
        },
        'publisher': {
          '@type': 'Organization',
          'name': schema.publisher,
          'url': BASE_URL,
        },
        'datePublished': schema.datePublished,
        'dateModified': schema.dateModified || schema.datePublished,
        'image': schema.image,
        'mainEntityOfPage': {
          '@type': 'WebPage',
          '@id': schema.url,
        },
      };

    case 'FAQPage':
      return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': schema.questions.map((q) => ({
          '@type': 'Question',
          'name': q.question,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': q.answer,
          },
        })),
      };

    default:
      return {};
  }
}

export function StructuredData({ schema }: StructuredDataProps) {
  useEffect(() => {
    const scriptId = `structured-data-${schema.type}`;
    
    // Remove existing script if present
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.remove();
    }

    // Create new script
    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    script.text = JSON.stringify(generateSchema(schema));
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById(scriptId);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [schema]);

  return null;
}

// Pre-configured site-wide schema
export function SiteStructuredData() {
  return (
    <StructuredData
      schema={{
        type: 'SoftwareApplication',
        name: 'PolyTrak',
        description: 'AI-powered Polymarket trader analysis tool for optimizing copy trading settings on TheTradeFox',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web',
        url: BASE_URL,
        offers: {
          price: '0',
          priceCurrency: 'USD',
        },
      }}
    />
  );
}
