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
