import * as React from 'react';
import createEmotionServer from '@emotion/server/create-instance';
import createEmotionCache from './createEmotionCache';

export function extractEmotionStyles(html: string) {
  const cache = createEmotionCache();
  const { extractCriticalToChunks, constructStyleTagsFromChunks } = createEmotionServer(cache);
  const emotionChunks = extractCriticalToChunks(html);
  const emotionCss = constructStyleTagsFromChunks(emotionChunks);
  return emotionCss;
}
