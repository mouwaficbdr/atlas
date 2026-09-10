import { MDXRemote } from 'next-mdx-remote/rsc';

interface MDXSectionProps {
  /** Source MDX brute (frontmatter inclus, retiré au rendu). */
  raw: string;
}

/**
 * Rend le contenu éditorial MDX d'une fiche pays, côté serveur, au build
 * (composant serveur : aucun `new Function` côté client, donc compatible avec
 * le CSP de production sans 'unsafe-eval').
 *
 * Composition typographique : voir `.mdx-body` dans app/globals.css (mesure de
 * lecture bornée, rythme vertical, lettrine, pas de justification).
 */
export default function MDXSection({ raw }: MDXSectionProps) {
  return (
    <div className="mdx-body">
      <MDXRemote source={raw} options={{ parseFrontmatter: true }} />
    </div>
  );
}
