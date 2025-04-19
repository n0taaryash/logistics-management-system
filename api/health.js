// Simple health check API for Vercel
export default function handler(request, response) {
  response.status(200).json({
    status: 'ok',
    message: 'API is working properly',
    timestamp: new Date().toISOString(),
    vercel: true
  });
}
