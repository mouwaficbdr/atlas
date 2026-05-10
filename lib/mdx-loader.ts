/**
 * Charge et sérialise les fichiers MDX depuis `/content/countries/[cca3].mdx`
 * lors de la génération statique (build time).
 *
 * - Fichier absent → retourne `source: null` sans throw
 * - Fichier malformé → log l'erreur en console et retourne `source: null`
 */

import fs from "fs";
import path from "path";
import { serialize } from "next-mdx-remote/serialize";
import type { MDXContent } from "./types";

/**
 * Charge et sérialise le fichier MDX d'un pays donné.
 *
 * @param cca3 - Code Alpha-3 du pays (ex: "BEN", "FRA")
 * @returns Promise<MDXContent> — contenu sérialisé ou `source: null` si absent/malformé
 */
export async function loadMDX(cca3: string): Promise<MDXContent> {
  const filePath = path.join(
    process.cwd(),
    "content",
    "countries",
    `${cca3}.mdx`
  );

  if (!fs.existsSync(filePath)) {
    return {
      cca3,
      source: null,
      frontmatter: {},
    };
  }

  let rawContent: string;

  try {
    rawContent = fs.readFileSync(filePath, "utf-8");
  } catch (readError) {
    // Erreur de lecture inattendue (permissions, etc.)
    console.error(
      `[ATLAS] Erreur de lecture du fichier MDX pour ${cca3} (${filePath}):`,
      readError
    );
    return {
      cca3,
      source: null,
      frontmatter: {},
    };
  }

  try {
    const mdxSource = await serialize(rawContent, {
      parseFrontmatter: true,
    });

    const fm = (mdxSource.frontmatter ?? {}) as Record<string, unknown>;

    return {
      cca3,
      source: mdxSource,
      frontmatter: {
        title: typeof fm.title === "string" ? fm.title : undefined,
        description:
          typeof fm.description === "string" ? fm.description : undefined,
        author: typeof fm.author === "string" ? fm.author : undefined,
        date: typeof fm.date === "string" ? fm.date : undefined,
      },
    };
  } catch (parseError) {
    console.error(
      `[ATLAS] Fichier MDX malformé pour ${cca3} (${filePath}):`,
      parseError
    );
    return {
      cca3,
      source: null,
      frontmatter: {},
    };
  }
}
