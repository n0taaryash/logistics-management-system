// Middleware to add debug headers to API responses
export default function middleware(request, response) {
  // Add debug headers
  response.headers.set('X-Debug-Time', new Date().toISOString());
  response.headers.set('X-Debug-Path', request.url);
  
  // Allow CORS for all API routes
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (request.method === 'OPTIONS') {
    response.status = 200;
    return response;
  }
  
  return response;
}
