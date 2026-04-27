'use client';

import { useState, useEffect } from 'react';

interface ProductDescriptionProps {
  description: string;
  productName: string;
}

interface DescriptionSections {
  about: string[];
  fabricFeatures: string[];
}

const ABOUT_INDICATORS = [
  'innovation', 'remastered', 'introducing', 'reimagined',
  'crafted', 'built for', 'designed to', 'engineered',
  'family of', 'collection', 'lineup', 'printability',
  'you can see and feel', 'comfort you', 'quality you',
  'breakthrough', 'technology', 'next generation', 'elevated',
];

const SPEC_PATTERNS = [
  /\d+\/\d+/,             // ratios like 50/50, 90/10
  /\d+(\.\d+)?\s*oz/i,    // weight like 5.3 oz
  /\d+(\.\d+)?\s*gsm/i,   // weight like 180 gsm
  /\d+\s*singles/i,        // yarn count like 20 singles
  /\d+\s*denier/i,         // denier
];

/**
 * Determines if a text item is a long descriptive/marketing sentence
 * rather than a spec line. Checks for narrative indicators and ensures
 * the text isn't a short spec bullet.
 */
function isAboutText(text: string): boolean {
  const lower = text.toLowerCase();

  if (ABOUT_INDICATORS.some(kw => lower.includes(kw))) return true;

  // Long sentences (>120 chars) that don't contain spec-specific patterns
  if (text.length > 120 && !SPEC_PATTERNS.some(p => p.test(text))) return true;

  return false;
}

/**
 * Parses HTML description string into About and Fabric & Features sections.
 */
function parseDescription(html: string): DescriptionSections {
  const sections: DescriptionSections = { about: [], fabricFeatures: [] };
  if (!html) return sections;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;

  function classify(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (isAboutText(trimmed)) {
      sections.about.push(trimmed);
    } else {
      sections.fabricFeatures.push(trimmed);
    }
  }

  function processNode(node: Node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();

      if (tag === 'ul' || tag === 'ol') {
        el.querySelectorAll('li').forEach(li => {
          const text = li.textContent?.trim();
          if (text) classify(text);
        });
        return;
      }

      if (['p', 'div', 'span'].includes(tag)) {
        const text = el.textContent?.trim();
        if (text) classify(text);
        return;
      }

      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
        const text = el.textContent?.trim();
        if (text) sections.about.push(text);
        return;
      }

      el.childNodes.forEach(processNode);
    } else if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text && text.length > 5) classify(text);
    }
  }

  body.childNodes.forEach(processNode);
  return sections;
}

export function ProductDescription({ description, productName }: ProductDescriptionProps) {
  const [sections, setSections] = useState<DescriptionSections>({ about: [], fabricFeatures: [] });

  useEffect(() => {
    setSections(parseDescription(description));
  }, [description]);

  const hasAbout = sections.about.length > 0;
  const hasFabric = sections.fabricFeatures.length > 0;

  if (!hasAbout && !hasFabric) return null;

  return (
    <div className="space-y-6">
      {hasAbout && (
        <div>
          <h2 className="text-base font-bold text-slate-800">About {productName}</h2>
          <div className="mt-2 space-y-2">
            {sections.about.map((text, i) => (
              <p key={i} className="text-sm text-slate-600 leading-relaxed">{text}</p>
            ))}
          </div>
        </div>
      )}

      {hasFabric && (
        <div>
          <h2 className="text-base font-bold text-slate-800">Fabric &amp; Features</h2>
          <ul className="mt-2 space-y-1.5">
            {sections.fabricFeatures.map((text, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600 leading-relaxed">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                {text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
