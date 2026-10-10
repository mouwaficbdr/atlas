# Polices des images de partage

Ces fichiers ne servent qu'aux images Open Graph générées par Satori
(`lib/og.ts`), qui n'accepte que des polices statiques TTF ou OTF. Le site
lui-même charge ses polices par `next/font` (`app/layout.tsx`).

- `Saira-Bold-wdth50.ttf`, `Saira-Bold-wdth75.ttf`, `Saira-Bold-wdth125.ttf` :
  instances statiques de Saira (graisse 700) à trois largeurs, pour reproduire
  la chasse variable du site selon la longueur des noms. Tirées de l'API
  Google Fonts (`css2?family=Saira:wdth,wght@<largeur>,700`), licence SIL OFL.
- `JetBrainsMono-Regular.ttf`, `JetBrainsMono-Bold.ttf` : textes mono.

Les routes d'images rendues à la demande (`/comparer`, `/carnet`, `/defi`)
doivent les embarquer : voir `outputFileTracingIncludes` dans
`next.config.mjs`.
