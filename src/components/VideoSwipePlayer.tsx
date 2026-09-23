'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from '@/components/ui/Link';
import { getSampleMovieUrls } from '@/lib/video-utils';
import type { DMMItem } from '@/types/dmm';
import { useDevice } from '@/hooks/useDevice';
import { trackVideoEvent, trackAffiliateClick } from '@/lib/analytics';
import { logError, log } from '@/lib/logger';
import FavoriteButton from '@/components/FavoriteButton';
import { loadFromStorage, saveToStorage } from '@/lib/storage';

interface VideoSwipePlayerProps {
  item: DMMItem;
  onClose?: () => void;
  fullscreen?: boolean;
}

interface VideoItem {
  item: DMMItem;
  urls: string[];
  currentUrlIndex: number;
}

export default function VideoSwipePlayer({ item, onClose, fullscreen = false }: VideoSwipePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [videoItems, setVideoItems] = useState<VideoItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [relatedItemsPage, setRelatedItemsPage] = useState(1);
  const [isMounted, setIsMounted] = useState(false);
  const transitionRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(true); // 最初はミュート
  const [videoErrors, setVideoErrors] = useState<Set<number>>(new Set()); // エラーが発生した動画のインデックス
  const [isVideoLoading, setIsVideoLoading] = useState(true); // 動画の読み込み状態
  const [playFailed, setPlayFailed] = useState(false); // 自動再生が失敗したかどうか
  const [userInteracted, setUserInteracted] = useState(false); // ユーザーが手動で再生したかどうか
  const [showHelpModal, setShowHelpModal] = useState(false); // ヘルプモーダルの表示状態
  const [showSwipeHint, setShowSwipeHint] = useState(false); // スワイプヒントの表示状態
  const [ctaHighlighted, setCtaHighlighted] = useState(false); // 視聴後のアフィリエイトCTA強調
  const { isMobile, isDesktop } = useDevice();
  
  // ビデオインプレッションの重複送信を防ぐためのref
  const lastImpressionRef = useRef<{ itemId: string; index: number } | null>(null);
  // ビデオ完了イベントの重複送信を防ぐためのref
  const completionSentRef = useRef<Record<string, boolean>>({});
  // 末尾で関連取得後に自動で次へ進むためのフラグ
  const pendingAutoAdvanceRef = useRef(false);

  // クライアントサイドでのみマウント
  useEffect(() => {
    setIsMounted(true);
    
    // ページビューイベントを送信
    trackVideoEvent('video_page_view', {
      item_id: item.content_id,
      item_title: item.title,
      page_type: 'swipe',
      actress: item.iteminfo?.actress?.[0]?.name,
      genre: item.iteminfo?.genre?.[0]?.name,
    });
  }, [item.content_id, item.title, item.iteminfo?.actress, item.iteminfo?.genre]);

  // スワイプヒントの表示状態を初期化（全デバイス）
  useEffect(() => {
    if (!isMounted) return;
    
    // 全デバイスでチェック
    const hideSwipeHint = loadFromStorage<boolean>('hideSwipeHint', false);
    if (!hideSwipeHint) {
      setShowSwipeHint(true);
    }
  }, [isMounted]);

  // 現在の動画アイテム
  const currentVideoItem = videoItems[currentIndex];

  // ビデオインプレッションを送信（重複防止）
  useEffect(() => {
    if (!currentVideoItem || !isMounted) return;

    const itemId = currentVideoItem.item.content_id;
    const last = lastImpressionRef.current;

    // 同じアイテムで同じインデックスの場合は送信しない
    if (last && last.itemId === itemId && last.index === currentIndex) {
      return;
    }

    // インプレッションを記録
    lastImpressionRef.current = { itemId, index: currentIndex };

    trackVideoEvent('video_impression', {
      item_id: itemId,
      item_title: currentVideoItem.item.title,
      video_index: currentIndex,
      page_type: 'swipe',
      actress: currentVideoItem.item.iteminfo?.actress?.[0]?.name,
      genre: currentVideoItem.item.iteminfo?.genre?.[0]?.name,
    });
  }, [currentVideoItem, currentIndex, isMounted]);

  // 初期動画を追加
  useEffect(() => {
    if (!isMounted) return;
    
    const urls = getSampleMovieUrls(item.content_id);
    if (urls.length > 0) {
      const initialVideoItem: VideoItem = {
        item,
        urls,
        currentUrlIndex: 0,
      };
      setVideoItems([initialVideoItem]);
    }
  }, [item, isMounted]);

  // 関連動画を取得
  const fetchRelatedVideos = useCallback(async (page: number = 1) => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const actresses = item.iteminfo?.actress || [];
      let selectedArticleType: 'actress' | 'genre' | null = null;
      let selectedArticleId: string | null = null;

      if (actresses.length > 0) {
        const randomActress = actresses[Math.floor(Math.random() * actresses.length)];
        selectedArticleType = 'actress';
        selectedArticleId = randomActress.id.toString();
      } else {
        const genres = item.iteminfo?.genre || [];
        if (genres.length > 0) {
          const randomGenre = genres[Math.floor(Math.random() * genres.length)];
          selectedArticleType = 'genre';
          selectedArticleId = randomGenre.id.toString();
        }
      }

      if (!selectedArticleType || !selectedArticleId) {
        setHasMore(false);
        return;
      }

      // 初回は20本、以降も20本ずつ取得
      const apiUrl = `/api/items?article=${selectedArticleType}&article_id=${selectedArticleId}&hits=20&sort=rank&page=${page}`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch related items: ${response.status}`);
      }

      const data = await response.json();
      const fetchedItems: DMMItem[] = data.items || [];

      setVideoItems(prev => {
        const existingContentIds = new Set(prev.map(vi => vi.item.content_id));

        const filteredItems = fetchedItems
          .filter((relatedItem) => {
            if (existingContentIds.has(relatedItem.content_id)) {
              return false;
            }
            if (relatedItem.content_id === item.content_id) {
              return false;
            }
            return relatedItem.sampleMovieURL && (
              relatedItem.sampleMovieURL.size_720_480 ||
              relatedItem.sampleMovieURL.size_644_414 ||
              relatedItem.sampleMovieURL.size_560_360 ||
              relatedItem.sampleMovieURL.size_476_306
            );
          });

        if (filteredItems.length === 0) {
          setHasMore(false);
          return prev;
        }

        const newVideoItems: VideoItem[] = filteredItems.map(relatedItem => {
          const urls = getSampleMovieUrls(relatedItem.content_id);
          return {
            item: relatedItem,
            urls,
            currentUrlIndex: 0,
          };
        });

        return [...prev, ...newVideoItems];
      });

      setRelatedItemsPage(page + 1);
    } catch (error) {
      logError('Failed to fetch related videos:', error);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [item, isLoadingMore, hasMore]);

  // 初期関連動画を取得（初回に20本まとめて取得）
  useEffect(() => {
    if (videoItems.length === 1) {
      // 初回は即座に20本取得（1秒待たない）
      fetchRelatedVideos(1);
    }
  }, [videoItems.length, fetchRelatedVideos]);

  // 動画切り替え時に、前の動画を停止
  useEffect(() => {
    // コンテナ内のすべての動画要素を取得
    const container = containerRef.current;
    if (!container) return;

    const allVideos = container.querySelectorAll('video');
    allVideos.forEach((v) => {
      // 現在の動画以外を停止
      if (v !== videoRef.current && !v.paused) {
        v.pause();
      }
    });
    
    // 動画切り替え時に、再生失敗フラグをリセット（新しい動画で自動再生を試みる）
    setPlayFailed(false);
    setCtaHighlighted(false);
  }, [currentIndex]);

  // 視聴開始から一定時間後にアフィリエイトCTAを強調（追加APIなし）
  useEffect(() => {
    if (!isMounted || !currentVideoItem) return;

    setCtaHighlighted(false);
    const timer = setTimeout(() => {
      setCtaHighlighted(true);
    }, 8000);

    return () => clearTimeout(timer);
  }, [isMounted, currentIndex, currentVideoItem]);

  // 動画の読み込みとエラーハンドリング
  useEffect(() => {
    if (!videoRef.current || !currentVideoItem) return;

    const video = videoRef.current;
    const currentUrl = currentVideoItem.urls[currentVideoItem.currentUrlIndex];
    let errorHandled = false;

    // 動画が読み込まれたら5秒目に設定
    const handleLoadedMetadata = () => {
      if (video.duration >= 5) {
        video.currentTime = 5;
      } else {
        video.currentTime = 0;
      }
    };

    // 読み込み開始
    setIsVideoLoading(true);

    const handleLoadStart = () => {
      setIsVideoLoading(true);
    };

    const handleLoadedData = () => {
      // データが読み込まれたが、まだ再生可能ではない可能性がある
    };

    const handleCanPlay = () => {
      // 再生可能になったら5秒目に設定
      if (video.duration >= 5 && video.currentTime < 5) {
        video.currentTime = 5;
      }
    };

    const handlePlaying = () => {
      // 再生が開始されたらロード状態を解除
      setIsVideoLoading(false);
    };

    const handleTimeUpdate = () => {
      // 再生が開始されている場合（currentTime > 0）はロード状態を解除
      if (video.currentTime > 0 && !video.paused) {
        setIsVideoLoading(false);
      }

      // ビデオ完了イベント（90%以上視聴）
      if (currentVideoItem && video.duration > 0) {
        const progress = video.currentTime / video.duration;
        const itemId = currentVideoItem.item.content_id;

        // 90%以上視聴かつ未送信の場合
        if (progress >= 0.9 && !completionSentRef.current[itemId]) {
          completionSentRef.current[itemId] = true;

          trackVideoEvent('video_complete', {
            item_id: itemId,
            item_title: currentVideoItem.item.title,
            video_index: currentIndex,
            page_type: 'swipe',
            actress: currentVideoItem.item.iteminfo?.actress?.[0]?.name,
            genre: currentVideoItem.item.iteminfo?.genre?.[0]?.name,
          });
        }
      }
    };

    const handleError = () => {
      if (errorHandled) return;
      errorHandled = true;
      setIsVideoLoading(false);

      const videoError = video.error;
      if (videoError) {
        log(`Video error (code ${videoError.code}):`, videoError.message);
        
        // NotSupportedError (code 4) の場合は、すべてのURLを試したとみなす
        if (videoError.code === 4) {
          setVideoErrors(prev => new Set([...prev, currentIndex]));
          return;
        }
      }

      const nextUrlIndex = currentVideoItem.currentUrlIndex + 1;
      if (nextUrlIndex < currentVideoItem.urls.length) {
        setTimeout(() => {
          setVideoItems(prev => {
            if (prev[currentIndex]?.item.content_id !== currentVideoItem.item.content_id) {
              return prev;
            }
            const updated = [...prev];
            updated[currentIndex] = {
              ...updated[currentIndex],
              currentUrlIndex: nextUrlIndex,
            };
            return updated;
          });
        }, 500);
      } else {
        // すべてのURLを試したが再生できない
        setVideoErrors(prev => new Set([...prev, currentIndex]));
      }
    };

    // 動画再生開始イベント（初回のみ送信）
    let playEventSent = false;
    const handlePlayingWithGA = () => {
      handlePlaying();
      
      // GAイベント: 動画再生開始（初回のみ）
      if (!playEventSent && currentVideoItem) {
        playEventSent = true;
        trackVideoEvent('video_play', {
          item_id: currentVideoItem.item.content_id,
          item_title: currentVideoItem.item.title,
          video_index: currentIndex,
          page_type: 'swipe',
          actress: currentVideoItem.item.iteminfo?.actress?.[0]?.name,
          genre: currentVideoItem.item.iteminfo?.genre?.[0]?.name,
        });
      }
    };

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('playing', handlePlayingWithGA);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('error', handleError);

    // エラー状態をリセット（新しいURLを試す場合）
    setVideoErrors(prev => {
      const newSet = new Set(prev);
      newSet.delete(currentIndex);
      return newSet;
    });

    // 動画のsrcが変更された場合のみ読み込み
    if (video.src !== currentUrl) {
      video.src = currentUrl;
      video.load();
    } else if (video.readyState >= 1 && video.duration >= 5) {
      // 既に読み込まれている場合は5秒目に設定
      video.currentTime = 5;
    }

    // 既に再生中の場合はロード状態を解除
    if (video.readyState >= 3 && !video.paused && video.currentTime > 0) {
      setIsVideoLoading(false);
    }

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('error', handleError);
    };
  }, [currentIndex, currentVideoItem]);

  // 次の動画へ
  const goToNext = useCallback((options?: { reason?: string }) => {
    if (currentIndex < videoItems.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(prev => prev + 1);
      
      // GAイベント: 動画スワイプ（次へ）
      if (videoItems[nextIndex]) {
        trackVideoEvent('video_swipe_next', {
          item_id: videoItems[nextIndex].item.content_id,
          item_title: videoItems[nextIndex].item.title,
          from_index: currentIndex,
          to_index: nextIndex,
          video_index: nextIndex,
          page_type: 'swipe',
          actress: videoItems[nextIndex].item.iteminfo?.actress?.[0]?.name,
          genre: videoItems[nextIndex].item.iteminfo?.genre?.[0]?.name,
          reason: options?.reason,
        });
      }
      
      // 残り5本以下になったタイミングで追加取得
      if (currentIndex >= videoItems.length - 5 && hasMore && !isLoadingMore) {
        fetchRelatedVideos(relatedItemsPage);
      }
    } else if (hasMore && !isLoadingMore) {
      fetchRelatedVideos(relatedItemsPage);
    }
  }, [currentIndex, videoItems, hasMore, isLoadingMore, fetchRelatedVideos, relatedItemsPage]);

  // 関連動画の追加取得後、終了待ちの自動進行を再開
  useEffect(() => {
    if (!pendingAutoAdvanceRef.current) return;
    if (currentIndex < videoItems.length - 1) {
      pendingAutoAdvanceRef.current = false;
      goToNext({ reason: 'auto_ended' });
    }
  }, [videoItems.length, currentIndex, goToNext]);

  // 前の動画へ
  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prev => prev - 1);
      
      // GAイベント: 動画スワイプ（前へ）
      if (videoItems[prevIndex]) {
        trackVideoEvent('video_swipe_previous', {
          item_id: videoItems[prevIndex].item.content_id,
          item_title: videoItems[prevIndex].item.title,
          from_index: currentIndex,
          to_index: prevIndex,
          video_index: prevIndex,
          page_type: 'swipe',
          actress: videoItems[prevIndex].item.iteminfo?.actress?.[0]?.name,
          genre: videoItems[prevIndex].item.iteminfo?.genre?.[0]?.name,
        });
      }
    }
  }, [currentIndex, videoItems]);


  // タッチイベントの処理（縦スワイプ）
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // ミュートボタンなどのUI要素がタッチされた場合は無視
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
      return;
    }
    
    setTouchStartY(e.touches[0].clientY);
    setIsDragging(true);
    // 動画の一時停止は削除（スワイプ中も再生を続ける）
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY === null || !isDragging || !transitionRef.current) return;

    const currentY = e.touches[0].clientY;
    const diff = touchStartY - currentY; // 上にスワイプ（diff > 0）で次の動画、下にスワイプ（diff < 0）で前の動画
    const maxDiff = window.innerHeight * 0.3;
    const clampedDiff = Math.max(-maxDiff, Math.min(maxDiff, diff));

    // スワイプ方向に合わせてアニメーション
    // 上にスワイプ（diff > 0）→ 次の動画（index + 1）を見る → コンテナを上に移動（translateYをより負の値に）
    // 下にスワイプ（diff < 0）→ 前の動画（index - 1）を見る → コンテナを下に移動（translateYをより正の値に）
    // ただし、ユーザーの指の動きに合わせて、コンテナも同じ方向に動くようにする
    // 上にスワイプ（diff > 0）→ コンテナも上に移動（translateYを減らす = 負の値を増やす）→ offsetPercentを負の値に
    // 下にスワイプ（diff < 0）→ コンテナも下に移動（translateYを増やす = 負の値を減らす）→ offsetPercentを正の値に
    const offsetPercent = -(clampedDiff / window.innerHeight) * 100;
    transitionRef.current.style.transform = `translateY(${-currentIndex * 100 + offsetPercent}%)`;
    transitionRef.current.style.transition = 'none';
  }, [touchStartY, isDragging, currentIndex]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartY === null) return;

    const endY = e.changedTouches[0].clientY;
    const diff = touchStartY - endY;
    const threshold = 100;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    } else if (transitionRef.current) {
      transitionRef.current.style.transition = 'transform 0.3s ease-out';
      transitionRef.current.style.transform = `translateY(-${currentIndex * 100}%)`;
    }

    setTouchStartY(null);
    setIsDragging(false);
  }, [touchStartY, goToNext, goToPrevious, currentIndex]);

  // パッシブイベントリスナーを追加
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const touchStartHandler = (e: TouchEvent) => {
      handleTouchStart(e as unknown as React.TouchEvent);
    };
    const touchMoveHandler = (e: TouchEvent) => {
      handleTouchMove(e as unknown as React.TouchEvent);
    };
    const touchEndHandler = (e: TouchEvent) => {
      handleTouchEnd(e as unknown as React.TouchEvent);
    };

    container.addEventListener('touchstart', touchStartHandler, { passive: true });
    container.addEventListener('touchmove', touchMoveHandler, { passive: false });
    container.addEventListener('touchend', touchEndHandler, { passive: true });

    return () => {
      container.removeEventListener('touchstart', touchStartHandler);
      container.removeEventListener('touchmove', touchMoveHandler);
      container.removeEventListener('touchend', touchEndHandler);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // キーボードショートカット
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          goToNext();
          break;
        case 'ArrowDown':
          e.preventDefault();
          goToPrevious();
          break;
        case 'f':
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.requestFullscreen().catch((err) => logError('Failed to request fullscreen:', err));
          }
          break;
        case 'Escape':
          if (onClose) {
            onClose();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [goToNext, goToPrevious, onClose]);

  // 動画切り替え時のアニメーション
  useEffect(() => {
    if (transitionRef.current) {
      transitionRef.current.style.transition = isDragging ? 'none' : 'transform 0.3s ease-out';
      transitionRef.current.style.transform = `translateY(-${currentIndex * 100}%)`;
    }
  }, [isDragging, currentIndex]);

  // 常に自動再生（ミュート状態で、5秒目から）
  useEffect(() => {
    if (!videoRef.current || !currentVideoItem) return;

    const video = videoRef.current;
    let isPlaying = false; // 再生中フラグ
    let timeoutId: NodeJS.Timeout | null = null;
    
    const startPlayback = async () => {
      // 既に再生中または再生処理中の場合はスキップ
      if (isPlaying || !video.paused) return;
      
      // 読み込みが完了していない場合は待つ
      if (video.readyState < 3) {
        log('Video not ready yet, readyState:', video.readyState);
        return;
      }
      
      isPlaying = true;
      
      try {
        // 5秒目に設定
        if (video.duration >= 5) {
          video.currentTime = 5;
        } else {
          video.currentTime = 0;
        }
        video.muted = true;
        await video.play();
        // 再生成功したら、失敗フラグをリセット
        setPlayFailed(false);
      } catch (error) {
        // エラーを無視（AbortErrorなど）
        if (error instanceof Error && error.name !== 'AbortError') {
          log('Autoplay failed:', error);
          // NotAllowedError（自動再生がブロックされた場合）などは再生ボタンを表示
          if (error.name === 'NotAllowedError' || error.name === 'NotSupportedError') {
            setPlayFailed(true);
          }
        }
      } finally {
        // 少し遅延させてフラグをリセット（playイベントが発火するのを待つ）
        setTimeout(() => {
          isPlaying = false;
        }, 100);
      }
    };

    const handleLoadedMetadata = () => {
      // メタデータが読み込まれたら、少し遅延させてから再生開始
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        startPlayback();
      }, 100);
    };

    const handleCanPlay = () => {
      // 再生可能になったら、再生開始
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        startPlayback();
      }, 100);
    };

    const handlePause = () => {
      // 終了時は次動画へ進むため、ループ再開しない
      if (video.ended) return;

      // ユーザーが手動で一時停止した場合は自動再生しない
      // ただし、ミュート状態で自動再生中の場合のみ再開
      if (isMuted && video.paused) {
        // 少し遅延させてから再生開始（pauseイベントの処理が完了するのを待つ）
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
          if (video.ended) return;
          startPlayback();
        }, 200);
      }
    };

    const handleEnded = () => {
      // 次の動画があれば自動で進む（滞在時間改善）。末尾なら関連取得待ち or ループ
      if (currentIndex < videoItems.length - 1) {
        goToNext({ reason: 'auto_ended' });
        return;
      }

      if (hasMore) {
        pendingAutoAdvanceRef.current = true;
        if (!isLoadingMore) {
          fetchRelatedVideos(relatedItemsPage);
        }
        return;
      }

      // これ以上取得できない場合のみ同一動画をループ
      if (isMuted && video.duration >= 5) {
        video.currentTime = 5;
        video.play().catch(() => {
          // 自動再生が失敗しても問題ない
        });
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    // 既に読み込まれている場合
    if (video.readyState >= 3 && video.paused && isMuted) {
      handleCanPlay();
    } else if (video.readyState >= 2 && video.paused && isMuted) {
      handleLoadedMetadata();
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      isPlaying = false;
    };
  }, [
    currentVideoItem,
    isMuted,
    currentIndex,
    videoItems.length,
    hasMore,
    isLoadingMore,
    relatedItemsPage,
    goToNext,
    fetchRelatedVideos,
  ]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const containerClassName = fullscreen
    ? "fixed inset-0 bg-black z-50 overflow-hidden"
    : "relative w-full bg-black rounded-lg overflow-hidden aspect-[9/16] max-w-md mx-auto";

  if (!isMounted) {
    return (
      <div className={containerClassName}>
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white text-center">
            <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>動画を読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentVideoItem) {
    return (
      <div className={containerClassName}>
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white text-center">
            <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>動画を読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={containerClassName}
    >
      {/* 閉じるボタン */}
      {onClose && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-4 right-4 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
          aria-label="閉じる"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}

      {/* 動画コンテナ（縦スクロール） */}
      <div
        ref={transitionRef}
        className="relative w-full h-full"
        style={{
          transform: `translateY(-${currentIndex * 100}%)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {videoItems.map((videoItem, index) => {
          const currentUrl = videoItem.urls[videoItem.currentUrlIndex];
          const isCurrent = index === currentIndex;
          const hasError = videoErrors.has(index);
          
          return (
            <div
              key={`${videoItem.item.content_id}-${index}`}
              className="absolute top-0 left-0 w-full h-full flex items-center justify-center"
              style={{
                top: `${index * 100}%`,
              }}
            >
              {hasError ? (
                // エラー表示：商品画像とメッセージ
                <div className="w-full h-full flex flex-col items-center justify-center bg-black p-6">
                  {videoItem.item.imageURL?.large || videoItem.item.imageURL?.small ? (
                    <Image
                      src={videoItem.item.imageURL.large || videoItem.item.imageURL.small}
                      alt={videoItem.item.title}
                      width={800}
                      height={600}
                      className="max-w-full max-h-[60%] w-auto h-auto object-contain mb-6"
                      unoptimized
                    />
                  ) : null}
                  <div className="text-white text-center">
                    <p className="text-lg font-bold mb-2">この商品では動画は利用できません</p>
                    <p className="text-sm text-gray-400 mb-4">{videoItem.item.title}</p>
                    {/* ボタン群 */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                      {/* フル動画を見るボタン */}
                      {videoItem.item.affiliateURL && (
                        <a
                          href={videoItem.item.affiliateURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full transition-all w-full sm:w-auto text-center ${
                            isCurrent && ctaHighlighted
                              ? 'ring-2 ring-yellow-300 scale-105 shadow-lg shadow-red-900/50 animate-pulse'
                              : ''
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            // GAイベント: アフィリエイトリンククリック（エラー時）
                            trackAffiliateClick({
                              item_id: videoItem.item.content_id,
                              item_title: videoItem.item.title,
                              price: videoItem.item.prices?.list_price || videoItem.item.prices?.price || undefined,
                              actress: videoItem.item.iteminfo?.actress?.[0]?.name,
                              genre: videoItem.item.iteminfo?.genre?.[0]?.name,
                              page_type: 'swipe',
                              position: currentIndex,
                              link_type: 'button',
                            });
                          }}
                        >
                          <svg
                            className="w-5 h-5 inline-block mr-2"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                          フル動画を見る
                        </a>
                      )}
                      {/* 詳細を見るボタン */}
                      <Link
                        href={`/item/${videoItem.item.content_id}`}
                        className="inline-block bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-full transition-colors w-full sm:w-auto text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <svg
                          className="w-5 h-5 inline-block mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        詳細を見る
                      </Link>
                      {/* お気に入りボタン */}
                      <FavoriteButton
                        item={videoItem.item}
                        type="item"
                        size="md"
                        className="w-full sm:w-auto"
                      />
                    </div>
                  </div>
                </div>
              ) : currentUrl ? (
                <>
                  <video
                    ref={isCurrent ? videoRef : null}
                    src={isCurrent ? currentUrl : undefined}
                    className={fullscreen 
                      ? (isMobile ? "max-w-full max-h-full object-contain" : "w-[90vw] h-[90vh] object-contain")
                      : "w-full h-full object-contain"}
                    playsInline
                    autoPlay={userInteracted || !playFailed}
                    muted={isMuted}
                    loop={false}
                    preload={isCurrent || index === currentIndex + 1 || index === currentIndex - 1 ? "auto" : "none"}
                    style={{
                      pointerEvents: 'none',
                    }}
                  />
                  

                  {/* 再生ボタン（自動再生が失敗した場合） */}
                  {isCurrent && playFailed && !isVideoLoading && !videoErrors.has(index) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
                      {/* 背景画像 */}
                      {videoItem.item.imageURL?.large || videoItem.item.imageURL?.small ? (
                        <div className="absolute inset-0">
                          <Image
                            src={videoItem.item.imageURL.large || videoItem.item.imageURL.small}
                            alt={videoItem.item.title}
                            fill
                            className="object-cover opacity-30"
                            sizes="100vw"
                            unoptimized
                          />
                          <div className="absolute inset-0 bg-black/50"></div>
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-black/50"></div>
                      )}
                      {/* 再生ボタン */}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          if (videoRef.current) {
                            try {
                              const video = videoRef.current;
                              
                              // 動画が読み込まれているか確認
                              if (!video.src || video.readyState === 0) {
                                log('Video not loaded yet, loading...');
                                video.load();
                                // メタデータが読み込まれるまで待つ
                                await new Promise((resolve) => {
                                  const handleLoadedMetadata = () => {
                                    video.removeEventListener('loadedmetadata', handleLoadedMetadata);
                                    resolve(undefined);
                                  };
                                  video.addEventListener('loadedmetadata', handleLoadedMetadata);
                                  // タイムアウト（5秒）
                                  setTimeout(() => {
                                    video.removeEventListener('loadedmetadata', handleLoadedMetadata);
                                    resolve(undefined);
                                  }, 5000);
                                });
                              }
                              
                              // 5秒目に設定（durationが有効な場合のみ）
                              if (video.duration && !isNaN(video.duration) && video.duration >= 5) {
                                video.currentTime = 5;
                              } else if (video.duration && !isNaN(video.duration)) {
                                video.currentTime = 0;
                              }
                              
                              video.muted = isMuted;
                              
                              // 再生を試みる
                              await video.play();
                              
                              setPlayFailed(false);
                              setUserInteracted(true);
                              setIsVideoLoading(false);
                              
                              // GAイベント: 手動再生
                              if (currentVideoItem) {
                                trackVideoEvent('video_play_manual', {
                                  item_id: currentVideoItem.item.content_id,
                                  item_title: currentVideoItem.item.title,
                                  video_index: currentIndex,
                                  page_type: 'swipe',
                                  reason: 'autoplay_blocked',
                                  actress: currentVideoItem.item.iteminfo?.actress?.[0]?.name,
                                  genre: currentVideoItem.item.iteminfo?.genre?.[0]?.name,
                                });
                              }
                            } catch (error) {
                              logError('Manual play failed:', error);
                              // エラーが発生した場合でも、ユーザーインタラクションは記録
                              setUserInteracted(true);
                            }
                          }
                        }}
                        className="relative z-10 pointer-events-auto bg-white/90 hover:bg-white text-black rounded-full p-6 transition-all transform hover:scale-110 shadow-2xl"
                        aria-label="動画を再生"
                      >
                        <svg
                          className="w-16 h-16"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                      <p className="relative z-10 mt-4 text-white text-sm pointer-events-none">
                        タップして再生
                      </p>
                      {/* ヘルプリンク */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setShowHelpModal(true);
                        }}
                        className="relative z-10 mt-6 text-white/70 hover:text-white text-xs underline pointer-events-auto transition-colors"
                      >
                        動画が再生されませんか？
                      </button>
                    </div>
                  )}

                  {/* ロードアニメーション */}
                  {isCurrent && isVideoLoading && !videoErrors.has(index) && !playFailed && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                      {/* 背景画像 */}
                      {videoItem.item.imageURL?.large || videoItem.item.imageURL?.small ? (
                        <div className="absolute inset-0">
                          <Image
                            src={videoItem.item.imageURL.large || videoItem.item.imageURL.small}
                            alt={videoItem.item.title}
                            fill
                            className="object-cover opacity-30"
                            sizes="100vw"
                            unoptimized
                          />
                          <div className="absolute inset-0 bg-black/50"></div>
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-black/50"></div>
                      )}
                      {/* ロードアニメーション */}
                      <div className="relative text-white text-center z-10">
                        <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-sm">動画を読み込み中...</p>
                      </div>
                    </div>
                  )}


                  {/* 動画情報 */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/80 to-transparent p-6 pointer-events-none z-10">
                    <h2 className="text-white text-lg font-bold mb-2 line-clamp-2 leading-tight">{videoItem.item.title}</h2>
                    {isCurrent && (
                      <>
                        <VideoSeekBar videoRef={videoRef} formatTime={formatTime} />
                        {/* ボタン群 */}
                        <div className="pointer-events-auto mt-4 flex flex-col sm:flex-row gap-3">
                          {/* フル動画を見るボタン */}
                          {videoItem.item.affiliateURL && (
                            <a
                              href={videoItem.item.affiliateURL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full transition-all w-full sm:w-auto text-center ${
                                ctaHighlighted
                                  ? 'ring-2 ring-yellow-300 scale-105 shadow-lg shadow-red-900/50 animate-pulse'
                                  : ''
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                // GAイベント: アフィリエイトリンククリック
                                trackAffiliateClick({
                                  item_id: videoItem.item.content_id,
                                  item_title: videoItem.item.title,
                                  price: videoItem.item.prices?.list_price || videoItem.item.prices?.price || undefined,
                                  actress: videoItem.item.iteminfo?.actress?.[0]?.name,
                                  genre: videoItem.item.iteminfo?.genre?.[0]?.name,
                                  page_type: 'swipe',
                                  position: currentIndex,
                                  link_type: 'button',
                                });
                              }}
                            >
                              <svg
                                className="w-5 h-5 inline-block mr-2"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M8 5v14l11-7z" />
                              </svg>
                              フル動画を見る
                            </a>
                          )}
                          {/* 詳細を見るボタン */}
                          <Link
                            href={`/item/${videoItem.item.content_id}`}
                            className="inline-block bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-full transition-colors w-full sm:w-auto text-center"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            >
                            <svg
                              className="w-5 h-5 inline-block mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            詳細を見る
                          </Link>
                          {/* お気に入りボタン */}
                          <FavoriteButton
                            item={videoItem.item}
                            type="item"
                            size="md"
                            className="w-full sm:w-auto"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* ミュート/アンミュートボタン */}
                  {isCurrent && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (videoRef.current) {
                          const video = videoRef.current;
                          const wasPlaying = !video.paused;
                          const currentTime = video.currentTime;
                          const newMutedState = !video.muted;
                          
                          video.muted = newMutedState;
                          setIsMuted(newMutedState);
                          
                          // GAイベント: ミュート/アンミュート
                          if (currentVideoItem) {
                            trackVideoEvent(newMutedState ? 'video_mute' : 'video_unmute', {
                              item_id: currentVideoItem.item.content_id,
                              item_title: currentVideoItem.item.title,
                              video_index: currentIndex,
                              page_type: 'swipe',
                              actress: currentVideoItem.item.iteminfo?.actress?.[0]?.name,
                              genre: currentVideoItem.item.iteminfo?.genre?.[0]?.name,
                            });
                          }
                          
                          // ミュート解除後も再生を続ける（少し遅延させて確実に）
                          if (wasPlaying) {
                            setTimeout(async () => {
                              if (videoRef.current && videoRef.current.paused) {
                                try {
                                  // 現在の再生位置を保持
                                  if (videoRef.current.currentTime !== currentTime) {
                                    videoRef.current.currentTime = currentTime;
                                  }
                                  await videoRef.current.play();
                                } catch (error) {
                                  log('Failed to resume playback after unmute:', error);
                                }
                              }
                            }, 50);
                          }
                        }
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                      }}
                      onTouchEnd={(e) => {
                        e.stopPropagation();
                      }}
                      className="absolute bottom-20 right-4 z-30 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-colors pointer-events-auto"
                      style={{
                        pointerEvents: 'auto',
                        touchAction: 'manipulation',
                      }}
                      aria-label={isMuted ? "ミュート解除" : "ミュート"}
                    >
                      {isMuted ? (
                        <svg
                          className="w-8 h-8"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-8 h-8"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                          />
                        </svg>
                      )}
                    </button>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-white text-center">
                    <p className="text-lg mb-4">動画を読み込めませんでした</p>
                    <p className="text-sm text-gray-400">この作品には無料動画がありません</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 読み込み中表示 */}
      {isLoadingMore && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
          関連動画を読み込み中...
        </div>
      )}

      {/* キーボードショートカットヒント（PCのみ） */}
      {!isMobile && (
        <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm text-white/90 text-xs pointer-events-none z-30 rounded-lg px-3 py-2 shadow-lg border border-white/10">
          <div className="font-semibold mb-1 text-white">キーボード操作</div>
          <div>↑/↓: 前後切り替え</div>
          <div>F: フルスクリーン</div>
          {onClose && <div>ESC: 閉じる</div>}
        </div>
      )}

              {/* スワイプガイド（スマホのみ、最初の3秒間のみ表示） - 動画の上に表示 */}
              {isMobile && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40 pointer-events-none">
                  <SwipeGuide />
                </div>
              )}

              {/* スワイプヒントオーバーレイ（全デバイス） */}
              {showSwipeHint && (
                <SwipeHintOverlay
                  isDesktop={isDesktop}
                  onClose={() => setShowSwipeHint(false)}
                  onDontShowAgain={(hide) => {
                    saveToStorage('hideSwipeHint', hide);
                    setShowSwipeHint(false);
                  }}
                />
              )}

              {/* ヘルプモーダル */}
              {showHelpModal && (
                <div
                  className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      setShowHelpModal(false);
                    }
                  }}
                >
                  <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-900">動画が再生されませんか？</h3>
                      <button
                        onClick={() => setShowHelpModal(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="閉じる"
                      >
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="text-gray-700 mb-6">
                      <p className="mb-4">
                        低電力モードをオフにし、ブラウザを再起動してください。
                      </p>
                      <p className="text-sm text-gray-500">
                        低電力モードが有効な場合、動画の自動再生が制限されることがあります。
                      </p>
                    </div>
                    <button
                      onClick={() => setShowHelpModal(false)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full transition-colors"
                    >
                      閉じる
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        }


// シークバーコンポーネント
function VideoSeekBar({ videoRef, formatTime }: { videoRef: React.RefObject<HTMLVideoElement | null>; formatTime: (seconds: number) => string }) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);
  const seekBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (!isDragging) {
        setCurrentTime(video.currentTime);
      }
    };
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setCurrentTime(video.currentTime);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    if (video.readyState >= 2) {
      handleLoadedMetadata();
    }

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [videoRef, isDragging]);

  const handleSeekBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !seekBarRef.current || duration === 0) return;
    
    const rect = seekBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;
    
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSeekBarMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !seekBarRef.current || duration === 0) return;
    
    setIsDragging(true);
    const rect = seekBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;
    
    setDragValue(newTime);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSeekBarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !videoRef.current || !seekBarRef.current || duration === 0) return;
    
    const rect = seekBarRef.current.getBoundingClientRect();
    const moveX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, moveX / rect.width));
    const newTime = percentage * duration;
    
    setDragValue(newTime);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSeekBarMouseUp = () => {
    setIsDragging(false);
  };

  // タッチイベントの処理
  const handleSeekBarTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!videoRef.current || !seekBarRef.current || duration === 0) return;
    
    setIsDragging(true);
    const rect = seekBarRef.current.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, touchX / rect.width));
    const newTime = percentage * duration;
    
    setDragValue(newTime);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSeekBarTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !videoRef.current || !seekBarRef.current || duration === 0) return;
    
    const rect = seekBarRef.current.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, touchX / rect.width));
    const newTime = percentage * duration;
    
    setDragValue(newTime);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSeekBarTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !videoRef.current || !seekBarRef.current || duration === 0) return;
      
      const rect = seekBarRef.current.getBoundingClientRect();
      const moveX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, moveX / rect.width));
      const newTime = percentage * duration;
      
      setDragValue(newTime);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, duration, videoRef]);

  if (duration === 0) return null;

  const displayTime = isDragging ? dragValue : currentTime;
  const progress = (displayTime / duration) * 100;

  return (
    <div className="w-full mb-2 pr-16">
      {/* 時間表示 */}
      <div className="text-white/80 text-sm mb-2">
        {formatTime(displayTime)} / {formatTime(duration)}
      </div>
      {/* シークバー */}
      <div
        ref={seekBarRef}
        className="relative w-full h-2 bg-white/20 rounded-full cursor-pointer pointer-events-auto"
        onClick={handleSeekBarClick}
        onMouseDown={handleSeekBarMouseDown}
        onMouseMove={handleSeekBarMouseMove}
        onMouseUp={handleSeekBarMouseUp}
        onTouchStart={handleSeekBarTouchStart}
        onTouchMove={handleSeekBarTouchMove}
        onTouchEnd={handleSeekBarTouchEnd}
      >
        {/* プログレスバー */}
        <div
          className="absolute left-0 top-0 h-full bg-red-600 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
        {/* ドラッグハンドル */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg transition-all"
          style={{ left: `calc(${progress}% - 8px)` }}
        />
      </div>
    </div>
  );
}

// スワイプガイドコンポーネント（スマホのみ）
function SwipeGuide() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // 4秒後に非表示
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      className="transition-all duration-1000 ease-out"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: `translateY(${isVisible ? '0' : '-10px'})`,
      }}
    >
      <div className="bg-gradient-to-r from-black/90 via-black/80 to-black/90 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-3 shadow-2xl">
        <div className="flex items-center gap-3">
          {/* 上矢印アイコン */}
          <div className="flex flex-col items-center">
            <svg
              className="w-4 h-4 text-white/80 animate-bounce"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ animationDelay: '0s' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 15l7-7 7 7"
              />
            </svg>
            <svg
              className="w-4 h-4 text-white/80 animate-bounce mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ animationDelay: '0.2s' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 15l7-7 7 7"
              />
            </svg>
          </div>
          
          {/* テキスト */}
          <span className="text-white text-sm font-medium whitespace-nowrap">
            スワイプで切り替え
          </span>
          
          {/* 下矢印アイコン */}
          <div className="flex flex-col items-center">
            <svg
              className="w-4 h-4 text-white/80 animate-bounce"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ animationDelay: '0.4s' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M19 9l-7 7-7-7"
              />
            </svg>
            <svg
              className="w-4 h-4 text-white/80 animate-bounce mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ animationDelay: '0.6s' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

// スワイプヒントオーバーレイコンポーネント（全デバイス）
interface SwipeHintOverlayProps {
  isDesktop: boolean;
  onClose: () => void;
  onDontShowAgain: (hide: boolean) => void;
}

function SwipeHintOverlay({ isDesktop, onClose, onDontShowAgain }: SwipeHintOverlayProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // オーバーレイ自体がクリックされた場合のみ閉じる
    if (e.target === e.currentTarget) {
      if (dontShowAgain) {
        onDontShowAgain(true);
      } else {
        onClose();
      }
    }
  };

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // コンテンツ内のクリックは伝播させない
    e.stopPropagation();
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDontShowAgain(e.target.checked);
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      <div
        className="bg-white/95 backdrop-blur-md rounded-3xl p-8 max-w-md w-full shadow-2xl"
        onClick={handleContentClick}
      >
        {/* アイコンとメッセージ */}
        <div className="text-center mb-6">
          {/* アイコン */}
          <div className="flex flex-col items-center justify-center mb-4">
            {isDesktop ? (
              // PC: キーボードの上下キーアイコン
              <div className="flex items-center gap-2">
                <div className="bg-gray-200 rounded-lg px-3 py-2 shadow-md">
                  <svg
                    className="w-8 h-8 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                </div>
                <div className="bg-gray-200 rounded-lg px-3 py-2 shadow-md">
                  <svg
                    className="w-8 h-8 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            ) : (
              // スマホ・タブレット: 上下矢印アイコン
              <>
                <svg
                  className="w-12 h-12 text-gray-700 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
                <svg
                  className="w-12 h-12 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </>
            )}
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            {isDesktop ? 'キーボードで動画切り替え可能' : 'スワイプで動画切り替え可能'}
          </h3>
          <p className="text-gray-600 text-base leading-relaxed">
            {isDesktop
              ? '上下キーで動画の切り替えが可能です。'
              : '上下にスワイプすることで、動画を切り替えることができます。'}
          </p>
        </div>

        {/* チェックボックス */}
        <div className="mb-6">
          <label className="flex items-center cursor-pointer group">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={handleCheckboxChange}
              className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500 focus:ring-2 cursor-pointer"
            />
            <span className="ml-3 text-gray-700 text-sm group-hover:text-gray-900">
              今後このヒントを表示しない
            </span>
          </label>
        </div>

        {/* 閉じるボタン */}
        <button
          onClick={() => {
            if (dontShowAgain) {
              onDontShowAgain(true);
            } else {
              onClose();
            }
          }}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full transition-colors shadow-lg"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
