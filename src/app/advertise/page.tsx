import Header from '@/components/Header';
import {
  ADVERTISE_PLANS,
  ADVERTISE_PRICING_NOTES,
  ADVERTISE_PRICING_OPTIONS,
} from '@/config/advertise-pricing';
import { getAdvertiseGoogleFormUrl } from '@/config/advertise';
import { ADVERTISE_MEDIA } from '@/config/advertise-media';
import { Metadata } from 'next';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: '広告掲載のご案内',
  description:
    'AV Scope（月刊PV約4万）の広告枠を月額定額でご案内。サイト概要・料金・お問い合わせはこちらから。',
  alternates: {
    canonical: 'https://www.avscope.jp/advertise',
  },
  openGraph: {
    title: '広告掲載のご案内',
    description:
      'AV Scope（月刊PV約4万）の広告枠を月額定額でご案内。サイト概要・料金・お問い合わせはこちらから。',
    url: 'https://www.avscope.jp/advertise',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: '広告掲載のご案内' }],
  },
};

export default function AdvertisePage() {
  const formOpenUrl = getAdvertiseGoogleFormUrl();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
          <header className="max-w-3xl border-b border-[#333333] pb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 tracking-tight">
              広告掲載のご案内
            </h1>
            <p className="mt-4 text-gray-400 leading-relaxed text-[15px] sm:text-base">
              AV Scope では広告枠を募集しています。月額定額での掲載を想定しており、
              掲載内容・枠・料金はお問い合わせフォームよりご相談ください。
            </p>
            <p className="mt-3 text-sm text-gray-500">
              3営業日以内に担当者よりご返信いたします。
            </p>
          </header>

          <section
            className="mt-10 sm:mt-12"
            aria-labelledby="advertise-media-heading"
          >
            <h2
              id="advertise-media-heading"
              className="text-xl font-bold text-gray-100 sm:text-2xl"
            >
              サイト・トラフィック概要
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-gray-500">
              掲載検討時の参考です。詳細はお問い合わせのうえご確認ください。
            </p>

            <div className="mt-6 rounded-lg border border-[#333333] bg-[#1a1a1a] p-5 sm:p-6">
              <p className="text-sm font-semibold text-gray-100">
                {ADVERTISE_MEDIA.siteName}
              </p>
              <a
                href={ADVERTISE_MEDIA.siteUrl}
                className="mt-1 inline-block text-sm text-red-500 hover:text-red-400"
              >
                {ADVERTISE_MEDIA.siteUrl}
              </a>
              <p className="mt-4 text-sm leading-relaxed text-gray-400">
                {ADVERTISE_MEDIA.pitch}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-[#333333] bg-[#1a1a1a] p-5 sm:p-6">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  ページビュー
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-100 sm:text-4xl">
                  {ADVERTISE_MEDIA.stats.monthlyPv}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {ADVERTISE_MEDIA.stats.monthlyPvUnit}
                </p>
              </div>
              <div className="rounded-lg border border-[#333333] bg-[#1a1a1a] p-5 sm:p-6">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  ユニークユーザー
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-100 sm:text-4xl">
                  {ADVERTISE_MEDIA.stats.monthlyUsers}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {ADVERTISE_MEDIA.stats.monthlyUsersUnit}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-[#333333] bg-[#1a1a1a] p-5 sm:p-6">
              <h3 className="text-sm font-semibold text-gray-100">
                {ADVERTISE_MEDIA.trafficSummary.title}
              </h3>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-gray-400">
                {ADVERTISE_MEDIA.trafficSummary.lines.map((line) => (
                  <li key={line} className="flex gap-2.5">
                    <span
                      className="mt-2 h-1 w-1 shrink-0 rounded-full bg-red-500"
                      aria-hidden
                    />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            <ul className="mt-5 space-y-1 text-xs leading-relaxed text-gray-600">
              <li>※ {ADVERTISE_MEDIA.stats.statsNote}</li>
              <li>
                ※ 時期により前後します。契約前に最新の目安をご確認いただけます。
              </li>
            </ul>
          </section>

          <section
            className="mt-10 sm:mt-12"
            aria-labelledby="advertise-pricing-heading"
          >
            <div>
              <h2
                id="advertise-pricing-heading"
                className="text-xl font-bold text-gray-100 sm:text-2xl"
              >
                料金体系（月額・目安）
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-gray-500">
                すべて税別・月額です。ご契約内容に応じて個別にお見積りすることもあります。
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5 md:items-stretch">
              {ADVERTISE_PLANS.map((plan) => {
                const isStandard = plan.id === 'standard';
                return (
                  <article
                    key={plan.id}
                    className={`flex h-full min-h-0 flex-col rounded-lg border p-5 sm:p-6 ${
                      isStandard
                        ? 'border-red-600/50 bg-[#1a1a1a] ring-1 ring-red-600/25'
                        : 'border-[#333333] bg-[#1a1a1a]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-100">
                        {plan.name}
                      </p>
                      {isStandard ? (
                        <span className="shrink-0 rounded bg-red-600/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                          おすすめ
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-4 text-3xl font-bold tabular-nums tracking-tight text-gray-100 sm:text-[1.75rem]">
                      ¥{plan.priceYen.toLocaleString('ja-JP')}
                      <span className="text-base font-normal text-gray-500">
                        {' '}
                        / 月
                      </span>
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                      {plan.description}
                    </p>
                    <ul className="mt-5 flex-1 space-y-2.5 border-t border-[#333333] pt-5 text-sm text-gray-400">
                      {plan.features.map((line, i) => (
                        <li key={`${plan.id}-${i}`} className="flex gap-2.5">
                          <span
                            className="mt-2 h-1 w-1 shrink-0 rounded-full bg-red-500"
                            aria-hidden
                          />
                          <span className="leading-relaxed">{line}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>

            <div className="mt-8 rounded-lg border border-[#333333] bg-[#1a1a1a] p-5 sm:p-6">
              <h3 className="text-sm font-semibold text-gray-100">
                オプション・条件
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm text-gray-400">
                {ADVERTISE_PRICING_OPTIONS.map((line, i) => (
                  <li key={i} className="flex gap-2.5 pl-0.5">
                    <span className="text-gray-600" aria-hidden>
                      ・
                    </span>
                    <span className="leading-relaxed">{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            <ul className="mt-6 space-y-1.5 text-xs leading-relaxed text-gray-600">
              {ADVERTISE_PRICING_NOTES.map((line, i) => (
                <li key={i}>※ {line}</li>
              ))}
            </ul>
          </section>

          <section className="mt-12 border-t border-[#333333] pt-10 sm:mt-14 sm:pt-12">
            <h2 className="text-xl font-bold text-gray-100 sm:text-2xl">
              お申し込み・お問い合わせ
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-gray-500">
              ご希望のプランやご質問は、Googleフォームからお送りください（別タブで開きます）。
            </p>

            <div className="mt-6 rounded-lg border border-[#333333] bg-[#1a1a1a] p-6 sm:p-8">
              <a
                href={formOpenUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-red-600 px-5 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-red-700 sm:w-auto sm:min-w-[240px]"
              >
                GoogleFormでご記入ください
                <span aria-hidden className="text-white/90">
                  ↗
                </span>
              </a>
              <p className="mt-4 text-xs text-gray-600">
                送信中はフォームページに切り替わります。入力後はタブを閉じてこのサイトに戻れます。
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
