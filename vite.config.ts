import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: process.env.GITHUB_ACTIONS ? '/Wanderlust/' : '/',
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'google-maps-shortlink-resolver',
        configureServer(server) {
          server.middlewares.use('/api/resolve-gmap', async (req, res) => {
            try {
              const reqUrl = new URL(req.url || '', 'http://localhost');
              const target = reqUrl.searchParams.get('url') || '';
              if (!target || !/^https?:\/\//i.test(target)) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Invalid URL' }));
                return;
              }
              let currentUrl = target;
              for (let hop = 0; hop < 5; hop++) {
                const resp = await fetch(currentUrl, {
                  redirect: 'manual',
                  headers: {
                    'Accept-Language': 'zh-TW,zh;q=0.9,ja;q=0.8,en;q=0.7',
                  },
                });
                const loc = resp.headers.get('location');
                if (loc) {
                  currentUrl = new URL(loc, currentUrl).toString();
                  if (currentUrl.includes('/maps/place/') || currentUrl.includes('/maps/search/')) {
                    break;
                  }
                } else {
                  break;
                }
              }
              let rating: number | undefined;
              let reviewCount: string | undefined;
              let openingHours: string | undefined;
              let imageUrl: string | undefined;

              try {
                const u = new URL(currentUrl);
                if (u.hostname.includes('google.') && u.pathname.includes('/maps/place/')) {
                  const cleanPlaceUrl = u.origin + u.pathname;
                  const jinaResp = await fetch(`https://r.jina.ai/${cleanPlaceUrl}`, {
                    headers: { Accept: 'application/json' },
                  });
                  if (jinaResp.ok) {
                    const jinaData = await jinaResp.json();
                    const content: string = jinaData?.data?.content || '';
                    const mRating =
                      content.match(/5\s+4\s+3\s+2\s+1\s+([1-5]\.\d)/) ||
                      content.match(/\b([1-5]\.\d)\s*\n+\s*\([\d,]+\)/);
                    if (mRating && mRating[1]) {
                      const rVal = parseFloat(mRating[1]);
                      if (rVal >= 1 && rVal <= 5) rating = rVal;
                    }
                    const mReviews = content.match(/\(([\d,]{1,9})\)/);
                    if (mReviews && mReviews[1]) {
                      reviewCount = mReviews[1];
                    }
                    const mHours = content.match(
                      /(\d{1,2}(?::\d{2})?\s*(?:AM|PM)\s*[–-]\s*\d{1,2}(?::\d{2})?\s*(?:AM|PM)|\d{1,2}:\d{2}\s*[–-]\s*\d{1,2}:\d{2})/i
                    );
                    if (mHours && mHours[1]) {
                      openingHours = mHours[1].trim();
                    }
                  }
                }
              } catch {
                // Ignore metadata enrichment errors
              }

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  resolvedUrl: currentUrl,
                  rating,
                  reviewCount,
                  openingHours,
                  imageUrl,
                })
              );
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err?.message || 'Failed to resolve URL' }));
            }
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
