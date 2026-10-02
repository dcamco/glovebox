// Glovebox — shared viewer for photographs and service documents.
// Any link inside [data-gallery] opens in a full-screen viewer; links still work without JS.
(() => {
  const groups = [...document.querySelectorAll('[data-gallery]')];
  if (!groups.length) return;

  const box = document.createElement('div');
  box.className = 'lb';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Image viewer');
  box.hidden = true;
  box.innerHTML = `
    <button class="lb-close" aria-label="Close">Close</button>
    <button class="lb-nav lb-prev" aria-label="Previous"><span></span></button>
    <div class="lb-stage"><img alt=""></div>
    <button class="lb-nav lb-next" aria-label="Next"><span></span></button>
    <div class="lb-bar"><div class="lb-cap"></div><div class="lb-meta"><span class="lb-count"></span><a class="lb-orig" target="_blank" rel="noopener">Original</a></div></div>`;
  document.body.appendChild(box);

  const img = box.querySelector('img');
  const stage = box.querySelector('.lb-stage');
  const cap = box.querySelector('.lb-cap');
  const count = box.querySelector('.lb-count');
  const orig = box.querySelector('.lb-orig');
  let items = [], i = 0, lastFocus = null;

  const captionOf = a => a.dataset.caption || a.querySelector('img')?.alt || '';

  function show(n) {
    i = (n + items.length) % items.length;
    const a = items[i];
    stage.classList.remove('zoom');
    img.src = a.href;
    img.alt = captionOf(a);
    cap.innerHTML = a.dataset.captionHtml || '';
    if (!a.dataset.captionHtml) cap.textContent = captionOf(a);
    count.textContent = `${i + 1} / ${items.length}`;
    orig.href = a.href;
    box.classList.toggle('doc', !!a.closest('.docs'));
    [i + 1, i - 1].forEach(k => { const p = items[(k + items.length) % items.length]; if (p) new Image().src = p.href; });
  }

  function open(group, a) {
    items = [...group.querySelectorAll('a[href]')].filter(x => x.querySelector('img'));
    lastFocus = document.activeElement;
    box.hidden = false;
    document.documentElement.classList.add('lb-open');
    show(items.indexOf(a));
    box.querySelector('.lb-close').focus();
  }

  function close() {
    box.hidden = true;
    img.removeAttribute('src');
    document.documentElement.classList.remove('lb-open');
    lastFocus?.focus();
  }

  groups.forEach(g => g.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || !a.querySelector('img') || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    open(g, a);
  }));

  box.querySelector('.lb-close').addEventListener('click', close);
  box.querySelector('.lb-prev').addEventListener('click', () => show(i - 1));
  box.querySelector('.lb-next').addEventListener('click', () => show(i + 1));
  box.addEventListener('click', e => { if (e.target === box || e.target === stage) close(); });
  img.addEventListener('click', () => { if (box.classList.contains('doc')) stage.classList.toggle('zoom'); });

  document.addEventListener('keydown', e => {
    if (box.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') show(i + 1);
    else if (e.key === 'ArrowLeft') show(i - 1);
  });

  let x0 = null;
  stage.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', e => {
    if (x0 === null || stage.classList.contains('zoom')) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) show(i + (dx < 0 ? 1 : -1));
    x0 = null;
  });
})();

// Garage switcher in the sticky section bar: jump to any car from anywhere on a page.
// Single list of vehicles for the switcher — keep in step with index.html.
(() => {
  const CARS = [
    { id: '360modena', yr: '2000', name: 'Ferrari 360 Modena F1', st: 'due', label: 'Booked' },
    { id: '308gtsi', yr: '1982', name: 'Ferrari 308 GTSi', st: 'open', label: 'Attention' },
    { id: 'lazarus', yr: '1995', name: 'Range Rover County LWB “Lazarus”', st: 'open', label: 'Open' },
    { id: 'rrc88', yr: '1988', name: 'Range Rover Classic', st: 'note', label: 'Sale preparation' },
    { id: '911sc', yr: '1980', name: 'Porsche 911 SC', st: 'ok', label: 'Sold', former: true },
  ];
  const rail = document.querySelector('.rail .wrap');
  if (!rail) return;
  const here = (location.pathname.split('/').pop() || '').replace('.html', '');
  const cur = CARS.find(c => c.id === here);

  const sections = document.createElement('div');
  sections.className = 'rail-sections';
  while (rail.firstChild) sections.appendChild(rail.firstChild);

  const sw = document.createElement('div');
  sw.className = 'switch';
  const row = c => `<a href="${c.id}.html" class="${c.id === here ? 'cur' : ''}"${c.id === here ? ' aria-current="page"' : ''}>
      <span class="sy">${c.yr}</span><span class="sn">${c.name}</span><span class="st ${c.st}">${c.label}</span></a>`;
  sw.innerHTML = `
    <button class="switch-btn" aria-expanded="false" aria-haspopup="true">
      <span class="sk">Garage</span><span class="sc">${cur ? cur.name.replace(/ “.*”/, '') : 'Vehicles'}</span><span class="chev"></span>
    </button>
    <div class="switch-panel" hidden>
      <div class="sp-in">
        <div class="label">The Collection</div>
        ${CARS.filter(c => !c.former).map(row).join('')}
        <div class="label sp-former">Formerly in the collection</div>
        ${CARS.filter(c => c.former).map(row).join('')}
        <a class="sp-home" href="../index.html">All vehicles</a>
      </div>
    </div>`;
  rail.append(sw, sections);

  const btn = sw.querySelector('.switch-btn');
  const panel = sw.querySelector('.switch-panel');
  const set = open => { panel.hidden = !open; btn.setAttribute('aria-expanded', String(open)); sw.classList.toggle('open', open); };
  btn.addEventListener('click', e => { e.stopPropagation(); set(panel.hidden); });
  document.addEventListener('click', e => { if (!sw.contains(e.target)) set(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
})();
