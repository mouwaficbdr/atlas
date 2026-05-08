/**
 * ATLAS° Globe 3D — MDX Loader
 * Exigences : 7.1, 7.2, 7.4, 7.6
 *
 * Charge et sérialise les fichiers MDX éditoriaux situés dans
 * `/content/countries/[cca3].mdx` lors de la génération statique (build time).
 *
 * - Si le fichier est absent : retourne `source: null` sans throw
 * - Si le fichier est malformé : log l'erreur en console et retourne `source: null`
 * - Extrait le frontmatter (title, description, author, date)
 */

import fs from "fs";
import path from "path";
import { serialize } from "next-mdx-remote/serialize";
import type { MDXContent } from "./types";

/**
 * Charge et sérialise le fichier MDX d'un pays donné.
 *
 * Exigence 7.1 : lecture depuis `/content/countries/[cca3].mdx`
 * Exigence 7.2 : rendu entièrement statique au build, sans appel réseau en runtime
 * Exigence 7.4 : retourne `source: null` si le fichier est absent (sans throw)
 * Exigence 7.6 : log d'erreur build si le fichier est malformé, sans interrompre la génération
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

  // Exigence 7.4 : fichier absent → retourner source: null sans throw
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
    // Exigence 7.1 : sérialisation via next-mdx-remote
    // Exigence 7.2 : exécuté au build, pas en runtime
    const mdxSource = await serialize(rawContent, {
      parseFrontmatter: true,
    });

    // Extraction du frontmatter (title, description, author, date)
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
    // Exigence 7.6 : fichier malformé → log erreur build + retourner source: null
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
