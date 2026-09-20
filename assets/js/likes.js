;(() => {
  const number = document.querySelector('#like-total');
  if (!number) return;

  const endpoint = '/api/likes';
  const scope = `${location.origin}${endpoint}`;
  const bindingKey = `portfolio-likes:instance:${scope}`;
  const unboundKey = `portfolio-likes:queue:${scope}:unbound`;
  let instance = '';
  let queue = [];
  let serverTotal = null;
  let syncing = false;
  let syncTimer = 0;

  const read = key => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (_) {
      return [];
    }
  };
  const queueKey = id => `portfolio-likes:queue:${scope}:${id || 'unbound'}`;
  const write = () => {
    try { localStorage.setItem(queueKey(instance), JSON.stringify(queue)); } catch (_) {}
  };
  const render = () => {
    if (!Number.isSafeInteger(serverTotal) || serverTotal < 0) return;
    const pending = queue.reduce((sum, batch) => sum + batch.count, 0);
    number.textContent = (serverTotal + pending).toLocaleString();
  };
  const newBatchId = () => {
    if (crypto.randomUUID) return crypto.randomUUID();
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0'));
    return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
  };
  const bind = backendInstance => {
    if (!backendInstance || backendInstance === instance) return;
    const pending = instance ? [] : queue;
    instance = backendInstance;
    try { localStorage.setItem(bindingKey, instance); } catch (_) {}
    queue = read(queueKey(instance));
    if (pending.length) {
      queue.push(...pending);
      try { localStorage.removeItem(unboundKey); } catch (_) {}
      write();
    }
    render();
  };
  const getState = async () => {
    const response = await fetch(endpoint, {cache: 'no-store'});
    if (!response.ok) throw new Error('Likes unavailable');
    const state = await response.json();
    bind(state.instance);
    serverTotal = state.total;
    render();
    return state;
  };
  const sync = async () => {
    if (syncing) return;
    syncing = true;
    try {
      await getState();
      while (queue.length) {
        const batch = queue[0];
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({...batch, instance})
        });
        if (response.status === 409) {
          const state = await response.json();
          bind(state.instance);
          continue;
        }
        if (!response.ok) throw new Error('Likes unavailable');
        const state = await response.json();
        queue.shift();
        serverTotal = state.total;
        write();
        render();
      }
    } catch (_) {
      /* This clone keeps its own unsent queue until its own backend returns. */
    } finally {
      syncing = false;
    }
  };
  const scheduleSync = () => {
    clearTimeout(syncTimer);
    syncTimer = window.setTimeout(sync, 1200);
  };

  try { instance = localStorage.getItem(bindingKey) || ''; } catch (_) {}
  queue = read(queueKey(instance));

  document.addEventListener('homepage-like', () => {
    queue.push({id: newBatchId(), count: 1});
    write();
    render();
    scheduleSync();
  });
  window.addEventListener('online', sync);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') sync();
    else if (instance && queue.length && navigator.sendBeacon) {
      queue.forEach(batch => navigator.sendBeacon(
        endpoint,
        new Blob([JSON.stringify({...batch, instance})], {type: 'application/json'})
      ));
    }
  });
  window.setInterval(sync, 60000);
  sync();
})();
