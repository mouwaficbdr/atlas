'use client';

import { MDXRemote } from 'next-mdx-remote';
import type { MDXRemoteSerializeResult } from 'next-mdx-remote';
import type { MDXContent } from '@/lib/types';

interface MDXSectionProps {
  content: MDXContent;
}

/**
 * Rendu du contenu éditorial MDX d'une fiche pays. Composition typographique
 * dédiée : mesure de lecture bornée, rythme vertical entre paragraphes et
 * titres, lettrine sur le premier paragraphe. Pas de justification (rivières
 * de blancs sur une colonne étroite).
 *
 * Les règles ciblent des balises rendues dynamiquement par MDXRemote, hors de
 * portée du scoping styled-jsx : d'où `style jsx global`, préfixé `.mdx-body`
 * pour rester confiné.
 */
export default function MDXSection({ content }: MDXSectionProps) {
  if (!content.source) return null;

  const source = content.source as MDXRemoteSerializeResult;

  return (
    <div className="mdx-body">
      <MDXRemote
        compiledSource={source.compiledSource}
        frontmatter={source.frontmatter}
        scope={source.scope}
      />

      <style jsx global>{`
        .mdx-body {
          max-width: 68ch;
          margin: 0 auto;
          padding-top: 2.5rem;
          border-top: 1px solid var(--border-subtle);
          color: var(--text-primary);
          font-size: 1rem;
        }
        .mdx-body > p {
          margin: 0 0 1.6rem;
          line-height: 1.7;
          text-align: left;
          color: rgba(240, 240, 240, 0.82);
        }
        .mdx-body > p:first-of-type::first-letter {
          float: left;
          font-family: var(--font-bebas-neue), 'Impact', sans-serif;
          font-size: 4.4rem;
          line-height: 0.78;
          padding: 0.1rem 0.6rem 0 0;
          color: var(--text-primary);
        }
        .mdx-body h2 {
          font-family: var(--font-bebas-neue), 'Impact', sans-serif;
          font-weight: 400;
          font-size: clamp(1.4rem, 2.4vw, 1.9rem);
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--text-primary);
          margin: 3.5rem 0 1rem;
        }
        .mdx-body h3 {
          font-family: var(--font-jetbrains-mono), monospace;
          font-size: 0.78rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(240, 240, 240, 0.55);
          margin: 2.5rem 0 0.75rem;
        }
        .mdx-body a {
          color: var(--text-accent);
          text-decoration: underline;
          text-underline-offset: 0.2em;
        }
        .mdx-body ul,
        .mdx-body ol {
          margin: 0 0 1.6rem 1.25rem;
          line-height: 1.7;
          color: rgba(240, 240, 240, 0.82);
        }
        .mdx-body li {
          margin-bottom: 0.5rem;
        }
        .mdx-body blockquote {
          margin: 2rem 0;
          padding-left: 1.25rem;
          border-left: 2px solid var(--text-accent);
          color: rgba(240, 240, 240, 0.7);
          font-style: italic;
        }
        .mdx-body strong {
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
}
