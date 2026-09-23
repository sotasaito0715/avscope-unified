'use client';

/**
 * パフォーマンス監視コンポーネント
 * 
 * @description
 * Core Web Vitalsの監視とレポートを行うコンポーネントです。
 */

import { useEffect } from 'react';

interface PerformanceMonitorProps {
  endpoint?: string;
  sampleRate?: number;
}

export default function PerformanceMonitor({ 
  endpoint = '/api/vitals',
  sampleRate = 0.1 
}: PerformanceMonitorProps) {
  useEffect(() => {
    // サンプリングレートに基づいて監視を実行するか判定
    if (Math.random() > sampleRate) {
      return;
    }

    // Core Web Vitalsの監視
    const observeVitals = () => {
      // LCP (Largest Contentful Paint)
      if ('PerformanceObserver' in window) {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          
          if (lastEntry) {
            reportMetric('LCP', lastEntry.startTime);
          }
        });
        
        try {
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (error) {
          console.debug('LCP observation not supported:', error);
        }
      }

      // FID (First Input Delay)
      if ('PerformanceObserver' in window) {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            const firstInputEntry = entry as PerformanceEntry & { processingStart?: number };
            if (firstInputEntry.processingStart && entry.startTime) {
              const fid = firstInputEntry.processingStart - entry.startTime;
              reportMetric('FID', fid);
            }
          });
        });
        
        try {
          fidObserver.observe({ entryTypes: ['first-input'] });
        } catch (error) {
          console.debug('FID observation not supported:', error);
        }
      }

      // CLS (Cumulative Layout Shift)
      if ('PerformanceObserver' in window) {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            const layoutShiftEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
            if (!layoutShiftEntry.hadRecentInput && layoutShiftEntry.value) {
              clsValue += layoutShiftEntry.value;
            }
          });
          
          // ページがアンロードされる時にCLSをレポート
          if (document.visibilityState === 'hidden') {
            reportMetric('CLS', clsValue);
          }
        });
        
        try {
          clsObserver.observe({ entryTypes: ['layout-shift'] });
        } catch (error) {
          console.debug('CLS observation not supported:', error);
        }
      }

      // FCP (First Contentful Paint)
      if ('PerformanceObserver' in window) {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
          
          if (fcpEntry) {
            reportMetric('FCP', fcpEntry.startTime);
          }
        });
        
        try {
          fcpObserver.observe({ entryTypes: ['paint'] });
        } catch (error) {
          console.debug('FCP observation not supported:', error);
        }
      }
    };

    // メトリクスをレポート
    const reportMetric = (name: string, value: number) => {
      const data = {
        name,
        value,
        url: window.location.href,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        connection: (navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType || 'unknown',
      };

      // レポート送信
      if (endpoint) {
        fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }).catch(error => {
          console.debug('Failed to report metric:', error);
        });
      }

      // コンソールにログ出力（開発時）
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${name}: ${value}ms`);
      }
    };

    // 監視開始
    observeVitals();

    // ページアンロード時の処理
    const handleBeforeUnload = () => {
      // 最後のCLS値をレポート
      if ('PerformanceObserver' in window) {
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          let clsValue = 0;
          entries.forEach((entry) => {
            const layoutShiftEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
            if (!layoutShiftEntry.hadRecentInput && layoutShiftEntry.value) {
              clsValue += layoutShiftEntry.value;
            }
          });
          if (clsValue > 0) {
            reportMetric('CLS', clsValue);
          }
        });
        
        try {
          clsObserver.observe({ entryTypes: ['layout-shift'] });
        } catch (error) {
          console.debug('CLS observation not supported:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // クリーンアップ
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [endpoint, sampleRate]);

  return null;
}
