async function handleRequest(request) { return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }); }
addEventListener('fetch', e => { e.respondWith(handleRequest(e.request)); });
