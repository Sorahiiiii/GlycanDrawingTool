export function healthHandler(request, response) {
  response.writeHead(200, {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8'
  });
  response.end(JSON.stringify({
    status: 'ok',
    service: 'glycan-draw-api',
    time: new Date().toISOString()
  }));
}

export default healthHandler;
