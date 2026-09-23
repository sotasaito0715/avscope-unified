/**
 * 記事本文表示コンポーネント（Server Component）
 *
 * @description
 * Markdown形式の記事本文をサーバー側でHTMLに変換して出力します。
 * SEO・LCP改善のため、react-markdown はクライアントではなくサーバーで実行します。
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import type { Components } from 'react-markdown';
import Link from 'next/link';
import Image from 'next/image';
import { DMMItem } from '@/types/dmm';
import { ActressInfo } from '@/types/dmm';
import ItemCard from './ItemCard';
import TableOfContents from './TableOfContents';
import ArticleAffiliateTracker from './ArticleAffiliateTracker';
import { extractTableOfContents } from '@/lib/markdown-utils';

interface ArticleContentProps {
  content: string;
  relatedItems?: DMMItem[];
  relatedActresses?: ActressInfo[];
  sameActressItems?: DMMItem[];
  viewedTogetherItems?: DMMItem[];
}

function generateId(text: string): string {
  const textStr = typeof text === 'string' ? text : String(text);
  return textStr
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') {
    return node;
  }
  if (typeof node === 'number') {
    return String(node);
  }
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    if (props?.children) {
      return extractText(props.children);
    }
  }
  if (Array.isArray(node)) {
    return node.map(extractText).join('');
  }
  return '';
}

/** 画像を含む段落を div に変換する rehype プラグイン */
function rehypeImageParagraphs() {
  return (tree: unknown) => {
    const visit = (node: unknown) => {
      if (
        typeof node === 'object' &&
        node !== null &&
        'type' in node &&
        'tagName' in node &&
        node.type === 'element' &&
        node.tagName === 'p'
      ) {
        const elementNode = node as {
          type: string;
          tagName: string;
          children?: unknown[];
          properties?: { className?: string | string[] };
        };

        const hasImage = elementNode.children?.some((child: unknown) => {
          if (
            typeof child === 'object' &&
            child !== null &&
            'type' in child &&
            'tagName' in child
          ) {
            const childElement = child as {
              type: string;
              tagName: string;
              children?: unknown[];
            };
            return (
              childElement.type === 'element' &&
              (childElement.tagName === 'img' ||
                (childElement.tagName === 'a' &&
                  childElement.children?.some(
                    (c: unknown) =>
                      typeof c === 'object' &&
                      c !== null &&
                      'type' in c &&
                      'tagName' in c &&
                      (c as { type: string; tagName: string }).type === 'element' &&
                      (c as { type: string; tagName: string }).tagName === 'img'
                  )))
            );
          }
          return false;
        });

        if (hasImage) {
          elementNode.tagName = 'div';
          if (!elementNode.properties) {
            elementNode.properties = {};
          }
          const existingClass =
            typeof elementNode.properties.className === 'string'
              ? elementNode.properties.className
              : Array.isArray(elementNode.properties.className)
                ? elementNode.properties.className.join(' ')
                : '';
          elementNode.properties.className = `text-gray-300 leading-7 mb-4 ${existingClass}`.trim();
        }
      }

      if (
        typeof node === 'object' &&
        node !== null &&
        'children' in node &&
        Array.isArray((node as { children?: unknown[] }).children)
      ) {
        ((node as { children: unknown[] }).children).forEach(visit);
      }
    };

    visit(tree);
    return tree;
  };
}

const markdownComponents: Components = {
  h1: ({ children }) => {
    const text = extractText(children);
    const id = generateId(text);
    return (
      <h2 id={id} className="text-3xl font-bold text-gray-100 mt-8 mb-4 pb-2 border-b border-[#333333] scroll-mt-20">
        {children}
      </h2>
    );
  },
  h2: ({ children }) => {
    const text = extractText(children);
    const id = generateId(text);
    return (
      <h2 id={id} className="text-2xl font-bold text-gray-100 mt-6 mb-3 pb-2 border-b border-[#333333] scroll-mt-20">
        {children}
      </h2>
    );
  },
  h3: ({ children }) => {
    const text = extractText(children);
    const id = generateId(text);
    return (
      <h3 id={id} className="text-xl font-bold text-gray-100 mt-4 mb-2 scroll-mt-20">
        {children}
      </h3>
    );
  },
  h4: ({ children }) => {
    const text = extractText(children);
    const id = generateId(text);
    return (
      <h4 id={id} className="text-lg font-semibold text-gray-100 mt-3 mb-2 scroll-mt-20">
        {children}
      </h4>
    );
  },
  h5: ({ children }) => {
    const text = extractText(children);
    const id = generateId(text);
    return (
      <h5 id={id} className="text-base font-semibold text-gray-100 mt-2 mb-2 scroll-mt-20">
        {children}
      </h5>
    );
  },
  h6: ({ children }) => {
    const text = extractText(children);
    const id = generateId(text);
    return (
      <h6 id={id} className="text-sm font-semibold text-gray-100 mt-2 mb-2 scroll-mt-20">
        {children}
      </h6>
    );
  },
  p: ({ children, className, ...props }) => {
    const checkForBlockElements = (node: React.ReactNode): boolean => {
      if (React.isValidElement(node)) {
        const element = node as React.ReactElement;
        const tagName = typeof element.type === 'string' ? element.type : '';

        if (tagName === 'img' || element.type === Image) {
          return true;
        }

        if (
          typeof element.type !== 'string' &&
          typeof element.type === 'function' &&
          'displayName' in element.type &&
          element.type.displayName === 'Image'
        ) {
          return true;
        }

        const blockElements = ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'table', 'blockquote', 'pre'];

        if (typeof tagName === 'string' && blockElements.includes(tagName.toLowerCase())) {
          return true;
        }

        const elementProps = element.props as { children?: React.ReactNode };
        if (elementProps?.children) {
          const childArray = React.Children.toArray(elementProps.children);
          return childArray.some(checkForBlockElements);
        }
      }

      return false;
    };

    const childrenArray = React.Children.toArray(children);
    const hasBlockElements = childrenArray.some(checkForBlockElements);

    if (hasBlockElements || className) {
      return (
        <div className={`text-gray-300 leading-7 mb-4 ${className || ''}`} {...props}>
          {children}
        </div>
      );
    }

    return (
      <p className="text-gray-300 leading-7 mb-4" {...props}>
        {children}
      </p>
    );
  },
  a: ({ href, children, ...props }) => {
    if (!href) return <a {...props}>{children}</a>;

    if (href.startsWith('/') || href.startsWith('#')) {
      return (
        <Link
          href={href}
          prefetch={false}
          className="text-red-400 hover:text-red-300 hover:underline transition-colors"
          {...props}
        >
          {children}
        </Link>
      );
    }

    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-red-400 hover:text-red-300 hover:underline transition-colors"
        {...props}
      >
        {children}
      </a>
    );
  },
  img: ({ src, alt }) => {
    if (!src || typeof src !== 'string') return null;

    return (
      <div className="relative w-full aspect-video my-6 rounded-lg overflow-hidden">
        <Image
          src={src}
          alt={alt || ''}
          fill
          className="object-contain rounded"
          sizes="(max-width: 768px) 100vw, 80vw"
          unoptimized
        />
      </div>
    );
  },
  ul: ({ children }) => (
    <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside text-gray-300 mb-4 space-y-2">{children}</ol>
  ),
  li: ({ children }) => <li className="text-gray-300 leading-7">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-red-500 pl-4 my-4 italic text-gray-400 bg-[#252525] py-2 rounded-r">
      {children}
    </blockquote>
  ),
  code: ({ className, children, ...props }) => {
    const isInline = !className || !className.includes('language-');
    if (isInline) {
      return (
        <code className="bg-[#252525] text-red-400 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
          {children}
        </code>
      );
    }
    return (
      <code className="block bg-[#252525] text-gray-300 p-4 rounded-lg my-4 overflow-x-auto" {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="bg-[#252525] text-gray-300 p-4 rounded-lg my-4 overflow-x-auto">{children}</pre>
  ),
  hr: () => <hr className="border-t border-[#333333] my-6" />,
  table: ({ children }) => (
    <div className="overflow-x-auto my-6">
      <table className="min-w-full border-collapse border border-[#333333]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-[#252525]">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-[#333333]">{children}</tr>,
  th: ({ children }) => (
    <th className="border border-[#333333] px-4 py-2 text-left font-semibold text-gray-100">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border border-[#333333] px-4 py-2 text-gray-300">{children}</td>
  ),
  strong: ({ children }) => <strong className="font-bold text-gray-100">{children}</strong>,
  em: ({ children }) => <em className="italic text-gray-200">{children}</em>,
};

export default function ArticleContent({
  content,
  relatedItems = [],
  relatedActresses = [],
  sameActressItems = [],
  viewedTogetherItems = [],
}: ArticleContentProps) {
  const tocItems = extractTableOfContents(content);

  return (
    <div className="prose prose-invert prose-lg max-w-none">
      <TableOfContents items={tocItems} />

      <ArticleAffiliateTracker>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, rehypeImageParagraphs, rehypeSanitize]}
          components={markdownComponents}
        >
          {content}
        </ReactMarkdown>
      </ArticleAffiliateTracker>

      {sameActressItems.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-100 mb-6">同じ女優の動画</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sameActressItems.slice(0, 4).map((item, index) => (
              <ItemCard
                key={item.content_id}
                item={item}
                priority={index < 4}
                relatedItems={sameActressItems.filter(i => i.content_id !== item.content_id)}
              />
            ))}
          </div>
        </div>
      )}

      {viewedTogetherItems.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-100 mb-6">この作品を閲覧した人はこちらも見ています</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {viewedTogetherItems.slice(0, 4).map((item, index) => (
              <ItemCard
                key={item.content_id}
                item={item}
                priority={index < 4}
                relatedItems={viewedTogetherItems.filter(i => i.content_id !== item.content_id)}
              />
            ))}
          </div>
        </div>
      )}

      {relatedItems.length > 0 && sameActressItems.length === 0 && viewedTogetherItems.length === 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-100 mb-6">関連作品</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relatedItems.map((item, index) => (
              <ItemCard
                key={item.content_id}
                item={item}
                priority={index < 4}
                relatedItems={relatedItems.filter(i => i.content_id !== item.content_id)}
              />
            ))}
          </div>
        </div>
      )}

      {relatedActresses.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-100 mb-6">関連女優</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {relatedActresses.map((actress) => (
              <Link
                key={actress.id}
                href={`/actress/${actress.id}`}
                prefetch={false}
                className="bg-[#1a1a1a] rounded-lg overflow-hidden hover:bg-[#252525] transition-colors text-center p-4"
              >
                <div className="relative w-20 h-20 rounded-full mx-auto mb-3 overflow-hidden">
                  {actress.imageURL?.large ? (
                    <Image
                      src={actress.imageURL.large}
                      alt={actress.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-10 w-10 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-gray-100">{actress.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
