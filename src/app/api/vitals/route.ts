import { NextRequest, NextResponse } from 'next/server';

/**
 * Core Web Vitals API エンドポイント
 * 
 * パフォーマンスメトリクスを受け取り、記録・分析に使用します。
 * 
 * @description
 * PerformanceMonitor コンポーネントから送信される
 * Core Web Vitals メトリクス（LCP, FID, CLS, FCP など）を受け取ります。
 */

interface VitalsData {
  name: string;
  value: number;
  url: string;
  timestamp: number;
  userAgent: string;
  connection: string;
}

export async function POST(request: NextRequest) {
  try {
    // リクエストボディの存在確認
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }

    // リクエストボディを取得
    let data: VitalsData;
    try {
      const body = await request.text();
      
      // 空のリクエストボディをチェック
      if (!body || body.trim() === '') {
        return NextResponse.json(
          { error: 'Request body is empty' },
          { status: 400 }
        );
      }

      // JSONパース
      data = JSON.parse(body);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        { 
          error: 'Invalid JSON format',
          details: parseError instanceof Error ? parseError.message : 'Unknown error'
        },
        { status: 400 }
      );
    }

    // バリデーション
    if (!data.name || typeof data.value !== 'number' || !data.url) {
      return NextResponse.json(
        { error: 'Invalid data format', details: 'Missing required fields: name, value, or url' },
        { status: 400 }
      );
    }

    // 開発環境ではコンソールにログ出力
    if (process.env.NODE_ENV === 'development') {
      console.log('[Vitals API]', {
        metric: data.name,
        value: data.value,
        url: data.url,
        timestamp: new Date(data.timestamp).toISOString(),
      });
    }

    // TODO: 本番環境では以下のような処理を実装
    // - データベースへの保存
    // - 分析サービス（Google Analytics, Vercel Analytics など）への送信
    // - アラート機能（閾値超過時）
    
    // 現時点では成功レスポンスを返す
    return NextResponse.json(
      { success: true, received: data.name },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing vitals data:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process vitals data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// OPTIONS メソッドをサポート（CORS 対応）
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

