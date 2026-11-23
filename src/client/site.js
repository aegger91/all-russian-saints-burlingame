/*
 * Progressive enhancement for the static pages. Every feature degrades to
 * working HTML without JavaScript (links, plain lists, YouTube links).
 *
 *   header      compact state on scroll, mobile menu, dropdowns
 *   language    remembers the chosen language, keeps the #anchor when switching
 *   dates       hides services/events/notices whose date has passed
 *               ([data-hide-past] lists, [data-date] rows, [data-until] notices)
 *   video       YouTube facade -> privacy-enhanced embed on click
 *   lightbox    [data-lightbox] links inside a [data-gallery]
 *   page nav    highlights the current section in the sticky sub-navigation
 */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var LANG_KEY = 'site-lang';
  var TIMEZONE = root.getAttribute('data-timezone') || 'America/Los_Angeles';

  function $all(sel, ctx) {
    return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel));
  }

  /* ------------------------------------------------------------ header */

  var header = doc.querySelector('[data-header]');
  var nav = doc.querySelector('[data-nav]');
  var burger = doc.querySelector('[data-burger]');
  var desktop = window.matchMedia('(min-width: 1201px)');

  function updateHeaderOffset() {
    if (!header) return;
    var bottom = Math.max(0, header.getBoundingClientRect().bottom);
    root.style.setProperty('--header-bottom', bottom + 'px');
  }

  function onScroll() {
    if (!header) return;
    header.classList.toggle('is-compact', window.scrollY > 24);
    updateHeaderOffset();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', updateHeaderOffset);
  onScroll();

  function closeDropdowns(except) {
    $all('.nav__toggle[aria-expanded="true"]').forEach(function (btn) {
      if (btn !== except) btn.setAttribute('aria-expanded', 'false');
    });
  }

  function setMenu(open) {
    if (!nav || !burger) return;
    updateHeaderOffset();
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    doc.body.classList.toggle('nav-open', open);
    if (!open) closeDropdowns();
  }

  if (burger) {
    burger.addEventListener('click', function () {
      setMenu(burger.getAttribute('aria-expanded') !== 'true');
    });
  }

  $all('.nav__toggle').forEach(function (btn) {
    var item = btn.parentElement;
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      closeDropdowns(btn);
      btn.setAttribute('aria-expanded', String(open));
    });
    item.addEventListener('mouseenter', function () {
      if (!desktop.matches) return;
      closeDropdowns(btn);
      btn.setAttribute('aria-expanded', 'true');
    });
    item.addEventListener('mouseleave', function () {
      if (desktop.matches) btn.setAttribute('aria-expanded', 'false');
    });
    item.addEventListener('focusout', function (e) {
      if (desktop.matches && !item.contains(e.relatedTarget)) btn.setAttribute('aria-expanded', 'false');
    });
  });

  doc.addEventListener('click', function (e) {
    if (!e.target.closest('.nav__item--parent')) closeDropdowns();
  });

  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var open = doc.querySelector('.nav__toggle[aria-expanded="true"]');
    if (open) {
      closeDropdowns();
      open.focus();
    } else if (nav && nav.classList.contains('is-open')) {
      setMenu(false);
      burger.focus();
    }
  });

  if (nav) {
    nav.addEventListener('click', function (e) {
      var link = e.target.closest('a');
      if (link && nav.classList.contains('is-open')) setMenu(false);
    });
  }

  desktop.addEventListener('change', function () {
    setMenu(false);
  });

  /* ------------------------------------------------------------ language */

  $all('.lang-switch__link').forEach(function (link) {
    link.addEventListener('click', function () {
      try {
        localStorage.setItem(LANG_KEY, link.getAttribute('data-lang'));
      } catch (err) {
        /* storage unavailable: the URL still carries the language */
      }
      if (location.hash && link.href.indexOf('#') === -1) link.href += location.hash;
    });
  });

  /* ------------------------------------------------------------ dates */

  // Today's date in the parish's timezone as YYYY-MM-DD.
  function today() {
    try {
      var parts = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
      var get = function (t) {
        return parts.filter(function (p) { return p.type === t; })[0].value;
      };
      return get('year') + '-' + get('month') + '-' + get('day');
    } catch (err) {
      return new Date().toISOString().slice(0, 10);
    }
  }

  var now = today();

  $all('[data-hide-past]').forEach(function (list) {
    var limit = parseInt(list.getAttribute('data-limit'), 10) || Infinity;
    var shown = 0;
    $all(':scope > [data-date]', list).forEach(function (row) {
      var past = row.getAttribute('data-date') < now;
      row.classList.toggle('is-past', past);
      if (past) return;
      row.hidden = shown >= limit;
      if (!row.hidden) shown += 1;
    });
    var empty = list.nextElementSibling;
    if (empty && empty.hasAttribute('hidden') && /__empty$/.test(empty.className)) empty.hidden = shown > 0;
  });

  $all('[data-until]').forEach(function (el) {
    if (el.getAttribute('data-until') < now) el.hidden = true;
  });

  /* ------------------------------------------------------------ video */

  doc.addEventListener('click', function (e) {
    var link = e.target.closest('[data-youtube] .video__link');
    if (!link || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    var box = link.parentElement;
    var id = box.getAttribute('data-youtube');
    var frame = doc.createElement('iframe');
    frame.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0';
    frame.title = (link.querySelector('.video__title') || link).textContent.trim();
    frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    frame.allowFullscreen = true;
    frame.loading = 'lazy';
    box.appendChild(frame);
    link.setAttribute('hidden', '');
    frame.focus();
  });

  /* ------------------------------------------------------------ lightbox */

  var lb = doc.querySelector('[data-lightbox-root]');
  if (lb) {
    var lbImg = lb.querySelector('[data-lb-img]');
    var lbCaption = lb.querySelector('[data-lb-caption]');
    var items = [];
    var index = 0;
    var opener = null;

    var show = function (i) {
      index = (i + items.length) % items.length;
      var link = items[index];
      var thumb = link.querySelector('img');
      lbImg.src = link.href;
      lbImg.alt = thumb ? thumb.alt : '';
      lbCaption.textContent = link.getAttribute('data-caption') || (thumb ? thumb.alt : '');
      var multi = items.length > 1;
      lb.querySelector('[data-lb-prev]').hidden = !multi;
      lb.querySelector('[data-lb-next]').hidden = !multi;
    };

    var close = function () {
      lb.hidden = true;
      doc.body.classList.remove('nav-open');
      lbImg.removeAttribute('src');
      if (opener) opener.focus();
    };

    doc.addEventListener('click', function (e) {
      var link = e.target.closest('[data-lightbox]');
      if (!link || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      var group = link.closest('[data-gallery]');
      items = group ? $all('[data-lightbox]', group) : [link];
      opener = link;
      show(items.indexOf(link));
      lb.hidden = false;
      doc.body.classList.add('nav-open');
      lb.querySelector('[data-lb-close]').focus();
    });

    lb.querySelector('[data-lb-close]').addEventListener('click', close);
    lb.querySelector('[data-lb-prev]').addEventListener('click', function () { show(index - 1); });
    lb.querySelector('[data-lb-next]').addEventListener('click', function () { show(index + 1); });
    lb.addEventListener('click', function (e) {
      if (e.target === lb) close();
    });
    doc.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(index - 1);
      else if (e.key === 'ArrowRight') show(index + 1);
      else if (e.key === 'Tab') {
        var focusable = $all('button:not([hidden])', lb);
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey && doc.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && doc.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  /* ------------------------------------------------------------ page nav */

  var pageNav = doc.querySelector('[data-page-nav]');
  if (pageNav && 'IntersectionObserver' in window) {
    var links = $all('.page-nav__link', pageNav);
    var targets = links
      .map(function (a) { return doc.getElementById(a.getAttribute('href').slice(1)); })
      .filter(Boolean);
    var setActive = function (id) {
      links.forEach(function (a) {
        var on = a.getAttribute('href') === '#' + id;
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    };
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-30% 0px -60% 0px' }
    );
    targets.forEach(function (t) { observer.observe(t); });
  }
})();
