/* ==========================================================================
   妈妈的菜谱 · 路由与启动
   --------------------------------------------------------------------------
   单页 hash 路由：#/home  #/order  #/search  #/checkout
                  #/recipes/chef|guest  #/recipe/A001  #/import  #/export
   视图切换时只隐藏 DOM 不销毁，所以「返回菜谱时回到原来看到的位置」是可靠的；
   每个路由各自记住滚动位置，返回时精确写回。
   ========================================================================== */

(function () {
  'use strict';

  var ui = window.MR.ui;
  var scrollMem = {};
  var currentName = null;
  var currentParams = [];
  var navCount = 0;   // 应用内部前进的步数，用于判断能不能后退

  /* ------------------------------ 路由解析 ------------------------------ */
  function parseHash() {
    var raw = String(location.hash || '').replace(/^#\/?/, '');
    var clean = raw ? decodeURIComponent(raw) : '';
    if (!clean) return { name: 'home', params: [] };
    var parts = clean.split('/').filter(Boolean);
    return { name: parts[0] || 'home', params: parts.slice(1) };
  }

  function keyOf(name, params) {
    return name + ((params && params.length) ? '/' + params.join('/') : '');
  }

  function viewRoot(name) { return document.getElementById('view-' + name); }
  function scrollerOf(root) { return root.querySelector('[data-scroll]') || root; }

  /* ------------------------------ 跳转 ------------------------------ */
  function goPath(path) {
    var next = '#/' + String(path || '').replace(/^#?\/?/, '');
    if (location.hash === next) { render(); return; }
    navCount++;
    location.hash = next;
  }

  function go(name) {
    var params = Array.prototype.slice.call(arguments, 1);
    goPath([name].concat(params).join('/'));
  }

  function back() {
    if (navCount > 0) { navCount--; history.back(); }
    else goPath('home');
  }

  /* ------------------------------ 滚动位置 ------------------------------ */
  function saveScroll() {
    if (!currentName) return;
    var root = viewRoot(currentName);
    if (!root) return;
    var sc = scrollerOf(root);
    scrollMem[keyOf(currentName, currentParams)] = sc.scrollTop;
  }

  /* ------------------------------ 标题 ------------------------------ */
  function titleFor(name, params) {
    if (name === 'recipes') {
      var t = (params && params[0]) || '';
      if (t === 'import') return '导入 · 妈妈的菜谱';
      if (t === 'export') return '导出 · 妈妈的菜谱';
      return '菜谱 · 妈妈的菜谱';
    }
    var dish = (name === 'recipe' && params[0])
      ? MR.data.DISH_BY_CODE[String(params[0]).toUpperCase()] : null;
    var map = {
      home: '妈妈的菜谱',
      order: '点餐 · 妈妈的菜谱',
      search: '搜索 · 妈妈的菜谱',
      checkout: '结算 · 妈妈的菜谱',
      recipe: (dish ? dish.name : '菜谱') + ' · 妈妈的菜谱'
    };
    return map[name] || '妈妈的菜谱';
  }

  /* ------------------------------ 渲染 ------------------------------ */
  function render() {
    var route = parseHash();

    // 兼容旧地址：导入/导出现在是菜谱页里的两个页签
    if (route.name === 'import') { location.hash = '#/recipes/import'; return; }
    if (route.name === 'export') { location.hash = '#/recipes/export'; return; }

    var name = MR.views[route.name] ? route.name : 'home';
    var params = route.params || [];

    // 还没选身份 → 回首页
    if (!MR.store.role() && name !== 'home') {
      currentName = null;
      location.hash = '#/home';
      return;
    }

    // 离开旧视图
    var previousName = currentName;
    if (currentName) {
      saveScroll();
      var oldRoot = viewRoot(currentName);
      var oldDef = MR.views[currentName];
      if (oldRoot) {
        if (oldDef && oldDef.leave) oldDef.leave(oldRoot);
        oldRoot.classList.remove('is-active');
        oldRoot.classList.remove('view-enter');
      }
    }

    currentName = name;
    currentParams = params;
    var def = MR.views[name];
    var root = viewRoot(name);
    root.classList.add('is-active');
    if (def && def.render) def.render(root, params);

    // 菜谱详情永远从顶部开始；其余路由回到上次看到的位置
    var sc = scrollerOf(root);
    var target = (name === 'recipe') ? 0 : (scrollMem[keyOf(name, params)] || 0);
    requestAnimationFrame(function () {
      sc.scrollTop = target;
      if (def && def.enter) def.enter(root, params);
    });

    // 只有真的换了页面才播入场动画；同一个页面内换参数（比如切页签）不播，
    // 否则整页会跟着淡入上移一下，看起来像"跳"。
    root.classList.remove('view-enter');
    if (previousName !== name) {
      void root.offsetWidth;
      root.classList.add('view-enter');
    }

    document.title = titleFor(name, params);
    ui.updateFab();
  }

  /* ------------------------------ 全局点击（返回 / 跳转） ------------------------------ */
  function onGlobalClick(e) {
    var t = e.target;
    if (!t || !t.closest) return;

    var backEl = t.closest('[data-back]');
    if (backEl) { e.preventDefault(); back(); return; }

    var goEl = t.closest('[data-go],[data-tab-go]');
    if (goEl) {
      e.preventDefault();
      goPath(goEl.getAttribute('data-go') || goEl.getAttribute('data-tab-go'));
    }
  }

  /* ------------------------------ 启动 ------------------------------ */
  function boot() {
    MR.store.load();
    ui.init();

    window.addEventListener('hashchange', render);
    document.addEventListener('click', onGlobalClick);

    // 每次打开 / 刷新网站，都先回到身份选择页。
    // 本地缓存里的身份、选择、导入结果都还在，只是不直接跳进上次那个页面。
    // 注意用 #/home（不带 switch），这种"进入时的身份选择"不标注「当前」。
    if (location.hash !== '#/home') location.hash = '#/home';

    render();
    ui.refresh();
  }

  window.MR.router = {
    go: go,
    goPath: goPath,
    back: back,
    render: render,
    current: function () { return currentName; },
    currentParams: function () { return currentParams; }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
