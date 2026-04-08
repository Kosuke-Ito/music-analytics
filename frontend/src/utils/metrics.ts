import type { ListenerRecord } from "../types";

/**
 * ファン定着度スコア: フォロワー数 / 月間リスナー数 (%)
 * 高い = コアファンが多い
 */
export function calculateRetentionScore(
  followers: number | undefined | null,
  listeners: number | undefined | null
): number | null {
  if (!followers || !listeners || listeners === 0) return null;
  return (followers / listeners) * 100;
}

/**
 * YouTube効率: 総再生回数 / 登録者数
 * 高い = コンテンツがよく見られている
 */
export function calculateYouTubeEfficiency(
  totalViews: number | undefined | null,
  subscribers: number | undefined | null
): number | null {
  if (!totalViews || !subscribers || subscribers === 0) return null;
  return totalViews / subscribers;
}

/**
 * 週間成長率: (最新 - 7日前) / 7日前 * 100 (%)
 */
export function calculateWeeklyGrowth(records: ListenerRecord[]): number | null {
  if (records.length < 8) return null;
  const current = records[records.length - 1].monthly_listeners;
  const weekAgo = records[records.length - 8].monthly_listeners;
  if (weekAgo === 0) return null;
  return ((current - weekAgo) / weekAgo) * 100;
}

/**
 * 月間成長率: (最新 - 30日前) / 30日前 * 100 (%)
 */
export function calculateMonthlyGrowth(records: ListenerRecord[]): number | null {
  if (records.length < 31) return null;
  const current = records[records.length - 1].monthly_listeners;
  const monthAgo = records[records.length - 31].monthly_listeners;
  if (monthAgo === 0) return null;
  return ((current - monthAgo) / monthAgo) * 100;
}
