'use client';

import { MDXRemote, type MDXRemoteSerializeResult } from 'next-mdx-remote';
import type { MDXContent } from '@/lib/types';

interface MDXSectionProps {
  content: MDXContent;
}

export default function MDXSection({ content }: MDXSectionProps) {
  if (!content.source) return null;

  const source = content.source as MDXRemoteSerializeResult;

  return (
    <section
      style={{
        borderTop: '1px solid var(--border-subtle)',
        paddingTop: '2rem',
        marginTop: '2rem',
        color: 'var(--text-primary)',
        lineHeight: 1.8,
      }}
    >
      <MDXRemote {...source} />
    </section>
  );
}
