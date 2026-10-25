/* ==========================================================================
   妈妈的菜谱 · 点餐页（核心交互）+ 搜索页
   --------------------------------------------------------------------------
   点餐页右侧是一条连续的纵向菜品流（不是每个分类一个独立滚动区），
   左侧分类栏的高亮完全由右侧滚动位置决定，双向联动。
   ========================================================================== */

(function () {
  'use strict';

  var D = window.MR.data;
  var ui = window.MR.ui;

  /* ------------------------------ 共用的「＋ / 垃圾桶」行为 ------------------------------ */
  function wireActButtons(container, opts) {
    container.addEventListener('click', function (e) {
      var btn = e.target.closest('.act-btn');
      if (!btn) return;
      var code = btn.getAttribute('data-code');
      var dish = D.DISH_BY_CODE[code];
      if (!dish) return;

      // 已选择 → 垃圾桶 → 全站统一的删除确认
      if (btn.getAttribute('data-act') === 'del' || MR.store.has(code)) {
        ui.confirmDelete({
          sub: dish.name,
          onYes: function () { MR.store.remove(code); }
        });
        return;
      }

      // 未选择 → ＋ → 小圆点飞向右下角购物袋，落袋时才算加入
      var origin = btn.querySelector('.act') || btn;
      ui.flyToBag(origin, function () {
        MR.store.add(code);
        if (opts && opts.onAdd) opts.onAdd(dish);
      });
    });
  }

  /* ============================== 点餐页 ============================== */
  var orderSync = null;

  function railHTML() {
    // 高亮块是独立的一层，靠 transform 滑到当前分类，不再靠切换 class 瞬间换背景
    return '<div class="cat-thumb" data-thumb></div>' +
      D.GROUPED.map(function (g) {
        return '<button class="cat-item" type="button" data-cat="' + g.letter + '">' +
               D.esc(g.name) + '</button>';
      }).join('');
  }

  function flowHTML() {
    return D.GROUPED.map(function (g) {
      return '<section class="dish-group" data-cat-group="' + g.letter + '">' +
             '<h2 class="group-title">' + D.esc(g.name) + '</h2>' +
             g.dishes.map(function (d) { return ui.dishRowHTML(d); }).join('') +
             '</section>';
    }).join('');
  }

  /** 右侧滚动位置 → 左侧当前分类 */
  function makeSync(rail, scroll) {
    var groups = Array.prototype.slice.call(scroll.querySelectorAll('[data-cat-group]'));
    var items = Array.prototype.slice.call(rail.querySelectorAll('.cat-item'));
    var thumb = rail.querySelector('[data-thumb]');
    var current = null;
    var lockTarget = null;    // 程序化平滑滚动期间锁住，别跟着中间位置乱跳
    var lockUntil = 0;

    function findItem(letter) {
      for (var i = 0; i < items.length; i++) {
        if (items[i].getAttribute('data-cat') === letter) return items[i];
      }
      return null;
    }

    /** 把高亮块放到某个分类上；animate=false 用于刚进页面时直接定位 */
    function place(letter, animate) {
      var item = findItem(letter);
      if (!item || !thumb) return;
      if (!animate) thumb.style.transition = 'none';
      thumb.style.height = item.offsetHeight + 'px';
      thumb.style.transform = 'translateY(' + item.offsetTop + 'px)';
      if (!animate) {
        void thumb.offsetWidth;
        thumb.style.transition = '';
      }
    }

    function paint(letter, animate) {
      items.forEach(function (b) {
        b.classList.toggle('is-active', b.getAttribute('data-cat') === letter);
      });
      place(letter, animate);
      // 分类很多时把当前项滚进可视区（高亮块跟着内容一起滚，不受影响）
      var active = findItem(letter);
      if (!active || !rail.getBoundingClientRect) return;
      var r = rail.getBoundingClientRect();
      var a = active.getBoundingClientRect();
      if (r.height && (a.top < r.top || a.bottom > r.bottom)) {
        rail.scrollTop += (a.top - r.top) - (r.height - a.height) / 2;
      }
    }

    function sync(animate) {
      // 平滑滚动还没到位时不更新：否则刚点的高亮会被路过的分类反复改写（就是"跳动"）
      if (lockTarget !== null) {
        if (Math.abs(scroll.scrollTop - lockTarget) <= 4 || Date.now() > lockUntil) lockTarget = null;
        else return;
      }
      if (!groups.length) return;

      var top = scroll.getBoundingClientRect().top;
      var letter = groups[0].getAttribute('data-cat-group');
      for (var i = 0; i < groups.length; i++) {
        if (groups[i].getBoundingClientRect().top - top <= 86) {
          letter = groups[i].getAttribute('data-cat-group');
        } else {
          break;
        }
      }
      // 已经滚到最底部时，直接锁定最后一个分类
      if (scroll.scrollTop + scroll.clientHeight >= scroll.scrollHeight - 2) {
        letter = groups[groups.length - 1].getAttribute('data-cat-group');
      }
      if (letter === current) return;
      current = letter;
      paint(letter, animate !== false);
    }

    return {
      sync: sync,
      /** 点击左侧分类：立刻把高亮滑过去，并锁住直到平滑滚动到位 */
      jumpTo: function (letter, targetTop) {
        current = letter;
        paint(letter, true);
        lockTarget = (typeof targetTop === 'number') ? targetTop : null;
        lockUntil = Date.now() + 900;
      }
    };
  }

  function renderOrder(root) {
    var role = MR.store.role();
    var recipesTab = (role === 'guest') ? 'guest' : 'chef';
    root.innerHTML = '' +
      '<div class="topbar">' +
        '<span class="topbar-title">今天吃点什么</span>' +
        '<button class="link-btn" type="button" data-go="recipes/' + recipesTab + '">看菜谱</button>' +
        '<button class="link-btn" type="button" data-go="home/switch">切换身份</button>' +
        '<button class="icon-btn" type="button" data-search aria-label="搜索">' + ui.icon('search') + '</button>' +
      '</div>' +
      '<div class="order-layout">' +
        '<nav class="cat-rail" data-rail>' + railHTML() + '</nav>' +
        '<div class="dish-scroll" data-scroll>' + flowHTML() +
          '<div class="list-end">到最最最底下了！</div>' +
        '</div>' +
      '</div>';

    var rail = root.querySelector('[data-rail]');
    var scroll = root.querySelector('[data-scroll]');

    orderSync = makeSync(rail, scroll);

    var ticking = false;
    scroll.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        orderSync.sync(true);
      });
    }, { passive: true });

    rail.addEventListener('click', function (e) {
      var item = e.target.closest('.cat-item');
      if (!item) return;
      var letter = item.getAttribute('data-cat');
      var group = scroll.querySelector('[data-cat-group="' + letter + '"]');
      if (!group) return;
      var top = scroll.scrollTop + group.getBoundingClientRect().top - scroll.getBoundingClientRect().top;
      orderSync.jumpTo(letter, top);          // 高亮先滑过去
      scroll.scrollTo({ top: top, behavior: 'smooth' });
    });

    root.querySelector('[data-search]').addEventListener('click', function () {
      MR.router.go('search');
    });

    wireActButtons(scroll);
    orderSync.sync(false);   // 进场直接定位，不播动画
  }

  /* ============================== 搜索页 ============================== */
  function renderSearch(root) {
    root.innerHTML = '' +
      '<div class="topbar">' +
        '<button class="icon-btn" type="button" data-back aria-label="返回">' + ui.icon('back') + '</button>' +
        '<input class="search-input" type="search" data-q placeholder="菜名 / 编码，比如 A001" ' +
          'autocomplete="off" enterkeyhint="search">' +
        '<button class="search-go" type="button" data-go-btn disabled>搜索</button>' +
      '</div>' +
      '<div class="view-body" data-scroll style="padding-bottom:110px" data-out></div>';

    var input = root.querySelector('[data-q]');
    var goBtn = root.querySelector('[data-go-btn]');
    var out = root.querySelector('[data-out]');
    var timer = null;

    var HINT = '<div class="search-hint">输入菜名、菜品编码或分类来搜索<br>比如「番茄」「A001」「汤」</div>';

    function run() {
      goBtn.disabled = !input.value.trim();
      var q = input.value.trim();
      if (!q) { out.innerHTML = HINT; return; }
      var list = D.searchDishes(q);
      if (!list.length) {
        out.innerHTML = ui.emptyHTML('🔍', '没有找到这道菜', '换个菜名，或者直接搜菜品编码试试。');
        return;
      }
      out.innerHTML = '<div class="search-count">找到 ' + list.length + ' 道菜</div>' +
        list.map(function (d) { return ui.dishRowHTML(d); }).join('');
    }

    input.addEventListener('input', function () {
      goBtn.disabled = !input.value.trim();
      clearTimeout(timer);
      timer = setTimeout(run, 160);
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { clearTimeout(timer); run(); input.blur(); }
    });

    goBtn.addEventListener('click', function () {
      clearTimeout(timer);
      run();
      input.blur();
    });

    wireActButtons(out);
    out.innerHTML = HINT;

    requestAnimationFrame(function () { input.focus(); });
  }

  window.MR.views = window.MR.views || {};
  MR.views.order = {
    render: renderOrder,
    enter: function () { if (orderSync) orderSync.sync(false); }
  };
  MR.views.search = { render: renderSearch };
})();
