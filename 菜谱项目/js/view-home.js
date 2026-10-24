/* ==========================================================================
   妈妈的菜谱 · 首页（身份选择）+ 结算页
   ========================================================================== */

(function () {
  'use strict';

  var D = window.MR.data;
  var ui = window.MR.ui;

  /* ============================== 首页 ============================== */
  var homeTimer = null;

  /**
   * 身份卡片。
   * showCurrent 只在"从别的页面点切换身份过来"时为真——那时候给当前身份标一个「当前」；
   * 每次打开网站的第一屏是纯身份选择，不标任何东西。
   */
  function roleCardHTML(role, emoji, name, desc, showCurrent) {
    var current = !!(showCurrent && MR.store.role() === role);
    return '<button class="role-card' + (current ? ' is-current' : '') + '" type="button" data-role="' + role + '">' +
             (current ? '<span class="role-tag">当前</span>' : '') +
             '<span class="role-emoji">' + emoji + '</span>' +
             '<span class="role-name">' + name + '</span>' +
             '<span class="role-desc">' + desc + '</span>' +
           '</button>';
  }

  function homeHTML(showCurrent) {
    return '' +
      '<div class="home">' +
        '<div class="home-logo">' + ui.icon('hat') + '</div>' +
        '<h1 class="home-title">妈妈的菜谱</h1>' +
        '<p class="home-sub">今天想要做点什么</p>' +
        '<div class="role-cards">' +
          roleCardHTML('chef', '👩‍🍳', '大厨', '决定今天做什么', showCurrent) +
          roleCardHTML('guest', '🍽️', '食客', '点我想吃的菜', showCurrent) +
        '</div>' +
        '<div class="welcome" data-welcome></div>' +
        '<div class="progress-wrap" data-progress><div class="progress-bar" data-bar></div></div>' +
      '</div>';
  }

  function renderHome(root, params) {
    clearTimeout(homeTimer);
    homeTimer = null;
    // #/home        → 每次进入网站的第一屏，不标「当前」
    // #/home/switch → 从别的页面点「切换身份」过来，标出当前身份
    var showCurrent = !!(params && params[0] === 'switch');
    root.innerHTML = homeHTML(showCurrent);

    var welcome = root.querySelector('[data-welcome]');
    var progress = root.querySelector('[data-progress]');
    var bar = root.querySelector('[data-bar]');
    var picked = false;

    root.querySelectorAll('[data-role]').forEach(function (card) {
      card.addEventListener('click', function () {
        if (picked) return;         // 进度条走完之前不接受第二次选择
        picked = true;
        var role = card.getAttribute('data-role');

        MR.store.setRole(role);
        card.classList.add('is-picked');
        welcome.textContent = '欢迎' + (role === 'chef' ? '大厨' : '食客');
        welcome.classList.add('is-on');
        progress.classList.add('is-on');
        requestAnimationFrame(function () { bar.style.width = '100%'; });

        homeTimer = setTimeout(function () {
          // 身份选完一律先进点餐页。每次进入网站都是「选身份 → 点菜」这条固定路径，
          // 不因为上次结算过就直接跳进菜谱页（不论有没有缓存）。
          MR.router.go('order');
        }, 1280);
      });
    });
  }

  /* ============================== 结算页 ============================== */
  function heroText(role) {
    if (role === 'chef') {
      return {
        title: '确认一下今天的菜单',
        desc: '结算后进入菜谱，可以看菜谱、导入食客的选择，找出你们都想吃的那几道。'
      };
    }
    return {
      title: '确认一下你想吃的菜',
      desc: '结算后可以导出这行信息，复制发给大厨就行。'
    };
  }

  function renderCheckout(root) {
    var role = MR.store.role();
    var hero = heroText(role);

    root.innerHTML = '' +
      '<div class="topbar">' +
        '<button class="back-btn" type="button" data-back>' + ui.icon('back') + '返回</button>' +
      '</div>' +
      '<div class="view-body" data-scroll>' +
        '<div class="checkout-hero"><h1>' + hero.title + '</h1><p>' + hero.desc + '</p></div>' +
        '<div data-list-wrap></div>' +
        '<div style="height:24px"></div>' +
      '</div>' +
      '<div class="checkout-foot">' +
        '<button class="btn-primary" type="button" data-settle>确认结算</button>' +
      '</div>';

    var wrap = root.querySelector('[data-list-wrap]');
    var settleBtn = root.querySelector('[data-settle]');
    var settling = false;   // 防止手快连点：结算只允许发生一次

    function paint() {
      var codes = D.sortCodes(MR.store.myCodes());
      if (!codes.length) {
        wrap.innerHTML = ui.emptyHTML('🍚', '还没有选菜', '回点餐页挑几道想吃的，再来结算。',
          { go: 'order', label: '去点餐' });
        settleBtn.disabled = true;
        return;
      }
      settleBtn.disabled = false;
      wrap.innerHTML = '<div class="checkout-list">' + codes.map(function (c) {
        return ui.dishRowHTML(D.DISH_BY_CODE[c], { act: 'del' });
      }).join('') + '</div>';
    }

    paint();

    // 垃圾桶 → 全站统一的删除确认
    wrap.addEventListener('click', function (e) {
      var btn = e.target.closest('.act-btn[data-act="del"]');
      if (!btn) return;
      var code = btn.getAttribute('data-code');
      var dish = D.DISH_BY_CODE[code];
      ui.confirmDelete({
        sub: dish ? dish.name : '',
        onYes: function () {
          ui.collapseRow(wrap.querySelector('[data-row="' + code + '"]'));
          MR.store.remove(code);
          setTimeout(paint, 220);
        }
      });
    });

    settleBtn.addEventListener('click', function () {
      if (settling) return;                                       // 连点无效，只结算一次
      if (!D.sortCodes(MR.store.myCodes()).length) return;
      settling = true;
      settleBtn.disabled = true;
      MR.store.settle();
      ui.toast('结算成功');                                        // 只提示成功，不带时间
      // 立刻进菜谱体系：不留"点了没反应"的空档，也就没有重复点击的机会
      MR.router.go('recipes', role === 'chef' ? 'chef' : 'guest');
    });
  }

  window.MR.views = window.MR.views || {};
  MR.views.home = {
    render: renderHome,
    leave: function () { clearTimeout(homeTimer); homeTimer = null; }
  };
  MR.views.checkout = { render: renderCheckout };
})();
