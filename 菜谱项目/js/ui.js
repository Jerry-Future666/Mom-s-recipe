/* ==========================================================================
   妈妈的菜谱 · 统一组件层
   --------------------------------------------------------------------------
   全站只有一套：图标、缩略图、菜品行、卡片、删除确认弹窗、购物袋抽屉、
   飞向购物袋的小圆点、轻提示。任何页面都不允许自己再写一套弹窗或按钮样式。
   ========================================================================== */

(function () {
  'use strict';

  var D = window.MR.data;

  /* ------------------------------ 图标 ------------------------------ */
  var PATHS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="M16.5 16.5 21 21"/>',
    plus:   '<path d="M12 5v14M5 12h14"/>',
    minus:  '<path d="M5 12h14"/>',
    trash:  '<path d="M4 7h16M9.5 7V4.8h5V7M6.5 7l1 12.2h9L17.5 7"/><path d="M10.5 10.5v5.5M13.5 10.5v5.5"/>',
    back:   '<path d="M15 4.5 7.5 12 15 19.5"/>',
    bag:    '<path d="M5.5 8h13l-1.1 12.2H6.6L5.5 8Z"/><path d="M9 8V6.2a3 3 0 0 1 6 0V8"/>',
    check:  '<path d="M4.5 12.5 9.5 17.5 19.5 6.8"/>',
    close:  '<path d="M6 6l12 12M18 6 6 18"/>',
    play:   '<path d="M8.2 5.4v13.2L19 12 8.2 5.4Z"/>',
    hat:    '<path d="M7 11.5A4 4 0 0 1 12 5a4 4 0 0 1 5 6.5"/><path d="M6.5 11.5h11V18a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 18v-6.5Z"/><path d="M6.5 14.5h11"/>',
    heart:  '<path d="M12 20s-7-4.4-7-9.4A4.1 4.1 0 0 1 12 7.6a4.1 4.1 0 0 1 7 3c0 5-7 9.4-7 9.4Z"/>',
    arrowUp:'<path d="M12 19V5M6 11l6-6 6 6"/>'
  };

  function icon(name, cls) {
    var body = PATHS[name] || '';
    return '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
           'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
  }

  function fillIcons(root) {
    (root || document).querySelectorAll('[data-icon]').forEach(function (el) {
      el.innerHTML = icon(el.getAttribute('data-icon'));
      el.removeAttribute('data-icon');
    });
  }

  /* ------------------------------ 缩略图（渐变 + 首字占位，真实图片覆盖其上） ------------------------------ */
  function thumbHTML(dish, extraClass, tag) {
    var cls = 'thumb' + (extraClass ? ' ' + extraClass : '');
    var el = tag || 'div';
    var html = '<' + el + ' class="' + cls + '" style="' + D.placeholderStyle(dish.code) + '">' +
               '<span class="thumb-ph">' + D.esc(D.placeholderChar(dish.name)) + '</span>';
    if (dish.image) {
      html += '<img src="' + D.esc(dish.image) + '" alt="" loading="lazy" ' +
              'onerror="this.style.display=\'none\'">';
    }
    return html + '</' + el + '>';
  }

  /* ------------------------------ 菜品行（点餐页 / 搜索页 / 购物袋 / 结算页共用） ------------------------------ */
  function actButtonHTML(code, act) {
    var on = act === 'toggle' && MR.store.has(code);
    var kind = attrsFor(act, on);
    return '<button class="act-btn" type="button" data-act="' + act + '" data-code="' + code + '" ' +
           'aria-label="' + kind.label + '"><span class="act ' + kind.cls + '">' +
           icon(kind.icon) + '</span></button>';
  }

  function attrsFor(act, on) {
    if (act === 'del') return { cls: 'act-del', icon: 'trash', label: '删除' };
    if (act === 'none') return { cls: 'act-add', icon: 'plus', label: '' };
    return on
      ? { cls: 'act-del', icon: 'trash', label: '从购物袋移除' }
      : { cls: 'act-add', icon: 'plus', label: '加入购物袋' };
  }

  function dishRowHTML(dish, opts) {
    opts = opts || {};
    var act = opts.act || 'toggle';
    var withDesc = opts.desc !== false;
    var html = '<div class="dish-row" data-row="' + dish.code + '">' +
               thumbHTML(dish) +
               '<div class="dish-main"><div class="dish-name">' + D.esc(dish.name) + '</div>' +
               '<div class="dish-meta"><span class="code">' + dish.code + '</span>';
    if (withDesc && dish.description) {
      html += '<span class="desc">' + D.esc(dish.description) + '</span>';
    }
    html += '</div></div>';
    if (act !== 'none') html += actButtonHTML(dish.code, act);
    return html + '</div>';
  }

  /** 导入页/导出页的单行卡片：[图片] 菜名 ＋（不显示菜品描述） */
  function rowCardHTML(dish, opts) {
    opts = opts || {};
    var act = opts.act || 'toggle';
    return '<div class="row-card" data-row="' + dish.code + '">' +
           thumbHTML(dish, 'rc-thumb') +
           '<div class="rc-name">' + D.esc(dish.name) + '</div>' +
           (act === 'none' ? '' : actButtonHTML(dish.code, act)) +
           '</div>';
  }

  /* ------------------------------ 菜谱查询卡片（双列：图片 + 菜名 + 查看菜谱） ------------------------------ */
  function cardHTML(dish) {
    var media = '<div class="card-media" style="' + D.placeholderStyle(dish.code) + '">' +
                '<span class="thumb-ph">' + D.esc(D.placeholderChar(dish.name)) + '</span>' +
                (dish.image ? '<img src="' + D.esc(dish.image) + '" alt="" loading="lazy" ' +
                              'onerror="this.style.display=\'none\'">' : '') +
                '</div>';
    return '<div class="card" data-card="' + dish.code + '" role="button" tabindex="0">' +
           '<span class="card-check">' + icon('check') + '</span>' +
           media +
           '<div class="card-body"><div class="card-name">' + D.esc(dish.name) + '</div>' +
           '<div class="card-link">查看菜谱</div></div>' +
           '</div>';
  }

  function gridHTML(dishes) {
    return '<div class="grid">' + dishes.map(cardHTML).join('') + '</div>';
  }

  /** 一个分类区块：虚线 — 分类名（大字号）— 双列卡片
      只在分类名上方保留一条虚线，作为与上一个分类的分隔；分类名下面直接接卡片。 */
  function catBlockHTML(group) {
    return '<section class="cat-block" data-cat="' + group.letter + '">' +
           '<div class="dash"></div>' +
           '<h2 class="cat-title-lg">' + D.esc(group.name) + '</h2>' +
           gridHTML(group.dishes) +
           '</section>';
  }

  /* ------------------------------ 空状态 ------------------------------ */
  function emptyHTML(emoji, title, desc, action) {
    return '<div class="empty"><div class="empty-emoji">' + emoji + '</div>' +
           '<div class="empty-title">' + D.esc(title) + '</div>' +
           (desc ? '<div class="empty-desc">' + desc + '</div>' : '') +
           (action ? '<button class="btn-primary" type="button" data-go="' + action.go + '">' +
                     D.esc(action.label) + '</button>' : '') +
           '</div>';
  }

  /* ------------------------------ 轻提示 ------------------------------ */
  function toast(msg) {
    var host = document.getElementById('toastHost');
    var el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(function () {
      el.classList.add('is-out');
      setTimeout(function () { el.remove(); }, 220);
    }, 2000);
  }

  /* ------------------------------ 统一删除确认弹窗 ------------------------------ */
  var dialogEl = null;

  function confirmDelete(opts) {
    opts = opts || {};
    closeDialog(true);

    var mask = document.createElement('div');
    mask.className = 'dialog-mask';
    mask.innerHTML =
      '<div class="dialog" role="dialog" aria-modal="true">' +
      '<div class="dialog-title">' + (opts.title || '确认删除美味吗？') + '</div>' +
      (opts.sub ? '<div class="dialog-sub">' + D.esc(opts.sub) + '</div>' : '') +
      '<div class="dialog-actions">' +
      '<button class="btn-ghost" type="button" data-act-no>不删</button>' +
      '<button class="btn-danger" type="button" data-act-yes>是的</button>' +
      '</div></div>';

    function close() {
      mask.classList.remove('is-open');
      setTimeout(function () { mask.remove(); if (dialogEl === mask) dialogEl = null; }, 160);
    }

    mask.addEventListener('click', function (e) {
      if (e.target === mask) { close(); return; }
      if (e.target.closest('[data-act-no]')) { close(); return; }
      if (e.target.closest('[data-act-yes]')) {
        close();
        if (opts.onYes) opts.onYes();
      }
    });

    document.getElementById('layer').appendChild(mask);
    dialogEl = mask;
    requestAnimationFrame(function () { mask.classList.add('is-open'); });
  }

  function closeDialog(instant) {
    if (!dialogEl) return;
    var el = dialogEl;
    dialogEl = null;
    if (instant) { el.remove(); return; }
    el.classList.remove('is-open');
    setTimeout(function () { el.remove(); }, 160);
  }

  /* ------------------------------ 飞向购物袋的小圆点 ------------------------------ */
  function pulseBag() {
    var fab = document.getElementById('fabBag');
    var badge = document.getElementById('fabBadge');
    if (!fab) return;
    fab.classList.remove('is-pulse');
    void fab.offsetWidth;
    fab.classList.add('is-pulse');
    setTimeout(function () { fab.classList.remove('is-pulse'); }, 360);

    if (badge && !badge.hidden) {
      badge.classList.remove('is-pop');
      void badge.offsetWidth;
      badge.classList.add('is-pop');
      setTimeout(function () { badge.classList.remove('is-pop'); }, 300);
    }
  }

  function flyToBag(fromEl, onDone) {
    var app = document.getElementById('app');
    var layer = document.getElementById('layer');
    var fab = document.getElementById('fabBag');
    // 购物袋不在当前页面（例如导入页）时不做飞行动画，直接完成
    if (!fromEl || !fab || !app || fab.hidden) { if (onDone) onDone(); return; }

    var base = app.getBoundingClientRect();
    var a = fromEl.getBoundingClientRect();
    var b = fab.getBoundingClientRect();
    var sx = a.left - base.left + a.width / 2 - 7;
    var sy = a.top - base.top + a.height / 2 - 7;
    var ex = b.left - base.left + b.width / 2 - 7;
    var ey = b.top - base.top + b.height / 2 - 7;
    var dx = ex - sx;
    var dy = ey - sy;

    var dot = document.createElement('div');
    dot.className = 'fly-dot';
    dot.style.left = sx + 'px';
    dot.style.top = sy + 'px';
    layer.appendChild(dot);

    if (!dot.animate) {
      dot.remove();
      pulseBag();
      if (onDone) onDone();
      return;
    }

    var anim = dot.animate([
      { transform: 'translate(0,0) scale(.4)', opacity: 0 },
      { transform: 'translate(' + (dx * .30) + 'px,' + (dy * .06 - 26) + 'px) scale(1)', opacity: 1, offset: .22 },
      { transform: 'translate(' + (dx * .78) + 'px,' + (dy * .52) + 'px) scale(.72)', opacity: 1, offset: .72 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.28)', opacity: .85 }
    ], { duration: 560, easing: 'cubic-bezier(.36,.05,.42,1)' });

    anim.onfinish = function () {
      dot.remove();
      pulseBag();
      if (onDone) onDone();
    };
    anim.oncancel = function () { dot.remove(); };
  }

  /* ------------------------------ 购物袋抽屉 ------------------------------ */
  var bagOpen = false;
  var bagEls = null;

  function bagCount() { return MR.store.myCodes().length; }

  function openBag() {
    if (bagOpen) return;
    if (!bagCount()) { toast('购物袋还是空的，先挑几道菜吧'); return; }

    var layer = document.getElementById('layer');
    var mask = document.createElement('div');
    mask.className = 'mask';
    var sheet = document.createElement('div');
    sheet.className = 'sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.innerHTML =
      '<div class="sheet-grab"></div>' +
      '<div class="sheet-head"><span>已选菜品</span>' +
      '<button class="close-x" type="button" data-bag-close aria-label="收起">' + icon('close') + '</button></div>' +
      '<div class="sheet-body" id="bagBody"></div>' +
      '<div class="sheet-foot">' +
      '<div class="bag-count">' + icon('bag') + '<span>已选择：<b id="bagCountNum">0</b> 个菜品</span></div>' +
      '<button class="btn-primary" type="button" data-bag-checkout>去结算</button>' +
      '</div>';

    layer.appendChild(mask);
    layer.appendChild(sheet);
    bagEls = { mask: mask, sheet: sheet };
    bagOpen = true;

    sheet.addEventListener('click', function (e) {
      if (e.target.closest('[data-bag-close]')) { closeBag(); return; }
      if (e.target.closest('[data-bag-checkout]')) {
        closeBag();
        setTimeout(function () { MR.router.go('checkout'); }, 160);
        return;
      }
      var btn = e.target.closest('.act-btn[data-act="del"]');
      if (btn) {
        var code = btn.getAttribute('data-code');
        var dish = D.DISH_BY_CODE[code];
        confirmDelete({
          sub: dish ? dish.name : '',
          onYes: function () {
            // 先让这一行收起来，用户能看清删掉的是哪一行，再真正从选择里移除
            collapseRow(sheet.querySelector('[data-row="' + code + '"]'));
            setTimeout(function () { MR.store.remove(code); }, 170);
          }
        });
      }
    });
    mask.addEventListener('click', function () { closeBag(); });

    renderBagList();
    requestAnimationFrame(function () {
      mask.classList.add('is-open');
      sheet.classList.add('is-open');
    });
    updateFab();
  }

  function closeBag(instant) {
    if (!bagOpen || !bagEls) { bagOpen = false; return; }
    var els = bagEls;
    bagEls = null;
    bagOpen = false;
    if (instant) {
      els.mask.remove();
      els.sheet.remove();
      updateFab();
      return;
    }
    els.mask.classList.add('is-closing');
    els.sheet.classList.remove('is-open');
    setTimeout(function () {
      els.mask.remove();
      els.sheet.remove();
      updateFab();
    }, 240);
    updateFab();
  }

  function renderBagList() {
    if (!bagEls) return;
    var body = bagEls.sheet.querySelector('#bagBody');
    var num = bagEls.sheet.querySelector('#bagCountNum');
    var codes = D.sortCodes(MR.store.myCodes());
    if (num) num.textContent = codes.length;
    if (!codes.length) {
      body.innerHTML = '<div class="empty" style="padding:44px 24px"><div class="empty-emoji">🛍️</div>' +
                       '<div class="empty-title">购物袋空了</div></div>';
      var btn = bagEls.sheet.querySelector('[data-bag-checkout]');
      if (btn) btn.disabled = true;
      return;
    }
    body.innerHTML = codes.map(function (c) {
      return dishRowHTML(D.DISH_BY_CODE[c], { act: 'del' });
    }).join('');
    var btn2 = bagEls.sheet.querySelector('[data-bag-checkout]');
    if (btn2) btn2.disabled = false;
  }

  /** 删除后让这一行收起来，用户能看清"刚才删掉的是哪一行" */
  function collapseRow(row) {
    if (!row) return;
    var h = row.offsetHeight;
    row.style.overflow = 'hidden';
    row.style.height = h + 'px';
    row.style.transition = 'height 200ms var(--ease), opacity 160ms, padding 200ms, border-width 200ms';
    requestAnimationFrame(function () {
      row.style.height = '0px';
      row.style.opacity = '0';
      row.style.paddingTop = '0px';
      row.style.paddingBottom = '0px';
      row.style.borderWidth = '0px';
    });
    setTimeout(function () { row.remove(); }, 240);
  }

  function isBagOpen() { return bagOpen; }

  /* ------------------------------ 右下角购物袋 ------------------------------ */
  function updateFab() {
    var fab = document.getElementById('fabBag');
    var badge = document.getElementById('fabBadge');
    if (!fab) return;
    var name = MR.router && MR.router.current ? MR.router.current() : '';
    var visible = (name === 'order' || name === 'search');
    var n = bagCount();
    fab.hidden = !visible;
    if (badge) {
      badge.textContent = n;
      badge.hidden = (n === 0);
    }
    fab.classList.toggle('is-away', bagOpen);
  }

  /* ------------------------------ 选择状态刷新（不重绘整页） ------------------------------ */
  function refresh() {
    document.querySelectorAll('#stage .act-btn[data-act="toggle"]').forEach(function (btn) {
      var code = btn.getAttribute('data-code');
      var on = MR.store.has(code);
      var kind = attrsFor('toggle', on);
      btn.setAttribute('aria-label', kind.label);
      btn.innerHTML = '<span class="act ' + kind.cls + '">' + icon(kind.icon) + '</span>';
    });
    renderBagList();
    updateFab();
  }

  /* ------------------------------ 页签的滑动高亮块 ------------------------------ */
  /**
   * 把高亮块放到当前页签的位置。
   * 位置用 transform 表示，滑动交给 CSS 的 transition（带运动曲线）；
   * 页面刚渲染出来时先关掉过渡直接定位，否则会看到它从左边滑进来。
   */
  function placeTabThumb(scope) {
    var tabs = (scope || document).querySelector('.tabs');
    if (!tabs) return;
    var thumb = tabs.querySelector('[data-tab-thumb]');
    var active = tabs.querySelector('.tab.is-active');
    if (!thumb || !active) return;

    var first = !thumb.getAttribute('data-placed');
    if (first) thumb.style.transition = 'none';
    thumb.style.width = active.offsetWidth + 'px';
    thumb.style.height = active.offsetHeight + 'px';
    thumb.style.transform = 'translate(' + active.offsetLeft + 'px,' + active.offsetTop + 'px)';
    if (first) {
      thumb.setAttribute('data-placed', '1');
      void thumb.offsetWidth;      // 强制一次样式计算，让初始位置立即生效
      thumb.style.transition = ''; // 之后交回 CSS 过渡
    }
  }

  /* ------------------------------ 初始化 ------------------------------ */
  function init() {
    fillIcons(document);
    var fab = document.getElementById('fabBag');
    if (fab) {
      fab.querySelector('.fab-bag-icon').innerHTML = icon('bag');
      fab.addEventListener('click', function () {
        if (bagOpen) closeBag(); else openBag();
      });
    }
    MR.store.subscribe(refresh);
  }

  window.MR = window.MR || {};
  MR.ui = {
    icon: icon,
    fillIcons: fillIcons,
    thumbHTML: thumbHTML,
    dishRowHTML: dishRowHTML,
    rowCardHTML: rowCardHTML,
    cardHTML: cardHTML,
    gridHTML: gridHTML,
    catBlockHTML: catBlockHTML,
    emptyHTML: emptyHTML,
    placeTabThumb: placeTabThumb,
    toast: toast,
    confirmDelete: confirmDelete,
    closeDialog: closeDialog,
    collapseRow: collapseRow,
    flyToBag: flyToBag,
    pulseBag: pulseBag,
    openBag: openBag,
    closeBag: closeBag,
    isBagOpen: isBagOpen,
    renderBagList: renderBagList,
    updateFab: updateFab,
    refresh: refresh,
    init: init
  };
})();
