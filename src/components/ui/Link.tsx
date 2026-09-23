'use client';

import NextLink from 'next/link';
import { ComponentProps } from 'react';

type LinkProps = ComponentProps<typeof NextLink>;

/**
 * カスタムLinkコンポーネント
 * 
 * @description
 * Next.jsのLinkコンポーネントをラップし、デフォルトでprefetch={false}を設定。
 * Vercel料金削減のため、prefetchを無効化しています。
 * 
 * 必要に応じてprefetch={true}を明示的に指定することで、
 * 個別のLinkでprefetchを有効化できます。
 */
export default function Link({ prefetch = false, ...props }: LinkProps) {
  return <NextLink prefetch={prefetch} {...props} />;
}

