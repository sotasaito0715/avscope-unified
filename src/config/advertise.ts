/**
 * 広告募集ページ・GoogleフォームURL
 *
 * ページ内埋め込みは使わず、別タブでフォームを開く運用です。
 * デフォルトは viewform?usp=dialog。
 *
 * 差し替え: Vercel / .env.local に
 * NEXT_PUBLIC_ADVERTISE_GOOGLE_FORM_URL を設定（docs.google.com の viewform URL 推奨）。
 */
export const ADVERTISE_PAGE_PATH = '/advertise' as const;

const DEFAULT_FORM_OPEN_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLScJI2bCog_UwWVtHs0Yfl2dNYjeTkuWQYcBNHr8JknfX7vWew/viewform?usp=dialog';

export function getAdvertiseGoogleFormUrl(): string {
  return (
    process.env.NEXT_PUBLIC_ADVERTISE_GOOGLE_FORM_URL?.trim() ||
    DEFAULT_FORM_OPEN_URL
  );
}
