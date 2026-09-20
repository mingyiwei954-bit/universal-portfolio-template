;(() => {
  const number = document.querySelector('#like-total');
  if (!number) return;
  const key = 'portfolio-template-pending-likes-v1';
  let queue = [];
  try { queue = JSON.parse(localStorage.getItem(key) || '[]'); } catch (_) {}
  if (!Array.isArray(queue)) queue = [];
  let syncing = false;
  const save = () => { try { localStorage.setItem(key, JSON.stringify(queue)); } catch (_) {} };
  const show = total => {
    if (Number.isSafeInteger(total) && total >= 0) number.textContent = total.toLocaleString();
  };
  const sync = async () => {
    if (syncing) return;
    syncing = true;
    try {
      while (queue.length) {
        const batch = queue[0];
        const response = await fetch('/api/likes', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(batch)});
        if (!response.ok) throw new Error('Likes unavailable');
        show((await response.json()).total);
        queue.shift(); save();
      }
      const response = await fetch('/api/likes', {cache: 'no-store'});
      if (response.ok) show((await response.json()).total);
    } catch (_) { /* Keep unsent clicks for a later retry. */ }
    finally { syncing = false; }
  };
  document.addEventListener('homepage-like', () => {
    queue.push({id: crypto.randomUUID(), count: 1}); save();
  });
  setInterval(sync, 60000);
  window.addEventListener('online', sync);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') sync();
    else if (queue.length && navigator.sendBeacon) {
      queue.forEach(batch => navigator.sendBeacon('/api/likes', new Blob([JSON.stringify(batch)], {type:'application/json'}))); 
    }
  });
  sync();
})();
