import app from '../server/src/index.js';

export default function handler(req: any, res: any) {
  const requestUrl = new URL(req.url || '/', 'http://localhost');
  const routedPath = requestUrl.searchParams.get('__campusos_route');

  if (routedPath) {
    const cleanPath = routedPath.replace(/^\/+/, '');
    const query = new URLSearchParams(requestUrl.searchParams);
    query.delete('__campusos_route');
    req.url = `/api/${cleanPath}${query.size ? `?${query.toString()}` : ''}`;
  }

  // Keep Express's existing /api/* route mounts intact if Vercel supplies a
  // function-relative URL for the catch-all route.
  if (req.url && !req.url.startsWith('/api/')) {
    req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
  }
  return app(req, res);
}
