import app from '../server/src/index.js';

export default function handler(req: any, res: any) {
  // Keep Express's existing /api/* route mounts intact if Vercel supplies a
  // function-relative URL for the catch-all route.
  if (req.url && !req.url.startsWith('/api/')) {
    req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
  }
  return app(req, res);
}
