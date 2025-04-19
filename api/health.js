// Simple health check endpoint for Vercel

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  return res.json({
    status: 'ok',
    serverTime: new Date().toISOString(),
    environment: process.env.VERCEL ? 'vercel' : 'local',
    version: '1.0.0'
  });
};
