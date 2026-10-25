/* ==========================================================================
   妈妈的菜谱 · 菜谱查询页 + 菜谱详情页
   --------------------------------------------------------------------------
   查询页：双列卡片、分类虚线分割、共同选择置顶、大厨批量删除
   详情页：默认从顶部开始；有历史阅读位置时出现 5 秒「刚刚看到的位置」小按钮
   ========================================================================== */

(function () {
  'use strict';

  var D = window.MR.data;
  var ui = window.MR.ui;

  /* ------------------------------ 顶部页签（查询 / 导入 / 导出 共用同一套外壳） ------------------------------ */
  function tabsFor(role) {
    if (role === 'chef') {
      return [
        { key: 'chef', label: '大厨选择', go: 'recipes/chef' },
        { key: 'guest', label: '食客选择', go: 'recipes/guest' },
        { key: 'import', label: '导入', go: 'recipes/import' }
      ];
    }
    return [
      { key: 'guest', label: '食客选择', go: 'recipes/guest' },
      { key: 'export', label: '导出', go: 'recipes/export' }
    ];
  }

  /** 哪些页签是当前身份合法的（越权地址会被拉回第一个页签） */
  function normalizeTab(role, tab) {
    var allowed = (role === 'guest') ? ['guest', 'export'] : ['chef', 'guest', 'import'];
    return allowed.indexOf(tab) === -1 ? allowed[0] : tab;
  }

  function tabbarHTML(active) {
    var role = MR.store.role();
    // 等宽分段 + 一块独立的高亮（靠 transform 滑过去）。
    // 等宽是为了让"选中加粗"不再改变按钮宽度，切页签时旁边的按钮不会被顶开。
    return '<div class="tabs">' +
             '<div class="tab-thumb" data-tab-thumb></div>' +
             tabsFor(role).map(function (t) {
               return '<button class="tab' + (t.key === active ? ' is-active' : '') + '" ' +
                      'data-tab-key="' + t.key + '" data-tab-go="' + t.go + '" type="button">' +
                      t.label + '</button>';
             }).join('') +
           '</div>';
  }

  /** 同一身份内切换页签：只换高亮，不重建外壳（滑块才能真正滑起来） */
  function setActiveTab(root, tab) {
    root.querySelectorAll('.tab').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-tab-key') === tab);
    });
    ui.placeTabThumb(root);
  }

  /* ============================== 菜谱查询页 ============================== */
  var currentTab = 'chef';
  var batchMode = false;
  var batchSel = {};
  var pendingHighlight = null;   // 从菜谱返回时要高亮的卡片编码

  /**
   * 「批量删除」只在能用的页签上出现；其余页签保留同样大小的位置（visibility:hidden），
   * 这样后面三个按钮的位置一动不动，顶栏高度也一致。
   * 必须每次切页签都同步一次——顶栏是建好就复用的，不会重建。
   */
  function updateBatchButton(root, tab) {
    var btn = root.querySelector('[data-batch]');
    if (!btn) return;
    var canBatch = (tab === 'chef' || tab === 'guest');
    btn.style.visibility = canBatch ? '' : 'hidden';
    if (canBatch) btn.removeAttribute('aria-hidden');
    else btn.setAttribute('aria-hidden', 'true');
    btn.classList.remove('is-batch');
  }

  function topbarHTML(role, tab) {
    // 四个页签的顶栏必须完全一样：按钮数量、宽度、换行结果都一致，
    // 高度才不会变，点导入/导出时页面就不会上下跳。
    var batch = (role === 'chef')
      ? '<button class="batch-btn" type="button" data-batch>' +
        '<span class="batch-del">' + ui.icon('trash') + '</span>批量删除</button>'
      : '';
    // 按钮顺序（从左到右）：批量删除 → 清除全部 → 切换身份 → 继续点餐
    return '<div class="topbar">' +
             '<span class="topbar-title">菜谱</span>' +
             '<div class="top-actions">' +
               batch +
               '<button class="link-btn" type="button" data-clear>清除全部</button>' +
               '<button class="link-btn" type="button" data-go="home/switch">切换身份</button>' +
               '<button class="link-btn" type="button" data-go="order">继续点餐</button>' +
             '</div>' +
           '</div>';
  }

  function contentEmptyHTML(tab, role) {
    if (tab === 'chef') {
      return ui.emptyHTML('🍽️', '还没选菜', '回点餐页挑几道想做的菜，这里就会出现。',
        { go: 'order', label: '去点餐' });
    }
    if (role === 'chef') {
      return ui.emptyHTML('📥', '还没有导入食客的选择',
        '让食客把导出的那行信息发给你，<br>在导入页粘贴进来就能看到。',
        { go: 'import', label: '去导入' });
    }
    return ui.emptyHTML('🍽️', '还没选菜', '回点餐页挑几道想吃的菜，这里就会出现。',
      { go: 'order', label: '去点餐' });
  }

  /**
   * 「食客选择」这一页签在两端的含义不同：
   *   大厨端 = 导入进来的食客选择（imported）
   *   食客端 = 食客自己的选择（guestCodes）
   * 之前这里无论谁看都读 imported，导致食客在自己手机上点完菜看不到任何内容。
   */
  function codesForTab(tab) {
    if (tab === 'chef') return MR.store.chefCodes();
    return MR.store.role() === 'guest' ? MR.store.guestCodes() : MR.store.imported().codes;
  }

  function contentHTML(tab) {
    var role = MR.store.role();
    var common = MR.store.commonCodes();
    var groups = D.groupCodes(codesForTab(tab));
    var html = '';

    // 共同选择 = 大厨选择 ∩ 食客选择，没有交集时整块不出现
    if (common.length) {
      html += '<section class="common-block" data-common>' +
                '<div class="common-head">' + ui.icon('heart') + '共同选择</div>' +
                D.groupCodes(common).map(ui.catBlockHTML).join('') +
              '</section>';
    }

    html += groups.length ? groups.map(ui.catBlockHTML).join('') : contentEmptyHTML(tab, role);
    return html;
  }

  function paint(root) {
    var content = root.querySelector('[data-content]');
    if (!content) return;
    // 导入 / 导出是同一套外壳下的两个页签，内容交给 view-io 渲染
    if (currentTab === 'import' && MR.ioContent) { MR.ioContent['import'](content); return; }
    if (currentTab === 'export' && MR.ioContent) { MR.ioContent['export'](content); return; }
    content.innerHTML = contentHTML(currentTab);
    applyBatch(root);
  }

  function applyBatch(root) {
    var content = root.querySelector('[data-content]');
    if (!content) return;
    content.querySelectorAll('.grid').forEach(function (g) {
      g.classList.toggle('is-batch', batchMode && !g.closest('[data-common]'));
    });
    content.querySelectorAll('.card').forEach(function (c) {
      var code = c.getAttribute('data-card');
      var picked = !!(batchMode && batchSel[code] && !c.closest('[data-common]'));
      c.classList.toggle('is-picked', picked);
    });
  }

  function doBatchDelete(root) {
    if (!batchMode) return;
    var codes = Object.keys(batchSel).filter(function (c) {
      return batchSel[c] && D.DISH_BY_CODE[c];
    });
    if (!codes.length) { ui.toast('先点选要删除的菜品'); return; }
    var isImportedList = (currentTab === 'guest' && MR.store.role() === 'chef');
    ui.confirmDelete({
      sub: isImportedList ? '从导入结果里移除 ' + codes.length + ' 道菜' : '共 ' + codes.length + ' 个菜品',
      onYes: function () {
        batchMode = false;
        batchSel = {};
        var btn = root.querySelector('[data-batch]');
        if (btn) btn.classList.remove('is-batch');
        if (isImportedList) MR.store.removeFromImport(codes);
        else MR.store.removeMany(codes);   // 触发订阅者重绘
      }
    });
  }

  /** 「清除全部」：清空当前页签显示的这整份列表（认准页签，不会顺手清掉另一边的） */
  function clearCurrentTab(root) {
    var role = MR.store.role();
    var isImportList = (currentTab === 'import') || (currentTab === 'guest' && role === 'chef');
    var codes = isImportList ? MR.store.imported().codes : MR.store.myCodes();
    if (!codes.length) { ui.toast('这里还没有菜品'); return; }

    var sub;
    if (currentTab === 'chef') sub = '清空「大厨选择」里的 ' + codes.length + ' 道菜';
    else if (currentTab === 'import') sub = '清空这 ' + codes.length + ' 道菜的点餐信息';
    else if (role === 'guest') sub = '清空「食客选择」里的 ' + codes.length + ' 道菜';
    else sub = '清空导入的 ' + codes.length + ' 道菜，共同选择会一起消失';

    ui.confirmDelete({
      sub: sub,
      onYes: function () {
        batchMode = false;
        batchSel = {};
        var btn = root.querySelector('[data-batch]');
        if (btn) btn.classList.remove('is-batch');
        if (isImportList) MR.store.clearImport();
        else MR.store.clearMine();
        paint(root);
      }
    });
  }

  function wire(root) {
    var content = root.querySelector('[data-content]');

    content.addEventListener('click', function (e) {
      var card = e.target.closest('.card');
      if (!card) return;
      var code = card.getAttribute('data-card');
      if (!D.DISH_BY_CODE[code]) return;

      // 共同选择是计算结果，不参与批量删除
      if (card.closest('[data-common]')) { MR.router.go('recipe', code); return; }

      if (batchMode) {
        batchSel[code] = !batchSel[code];
        applyBatch(root);
        return;
      }
      MR.router.go('recipe', code);
    });

    content.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var card = e.target.closest('.card');
      if (!card) return;
      e.preventDefault();
      card.click();
    });

    var batchBtn = root.querySelector('[data-batch]');
    if (batchBtn) {
      batchBtn.addEventListener('click', function (e) {
        // 红色垃圾桶：执行批量删除（"批量删除"四个字的位置始终不变）
        if (e.target.closest('.batch-del')) { doBatchDelete(root); return; }
        batchMode = !batchMode;
        batchSel = {};
        batchBtn.classList.toggle('is-batch', batchMode);
        applyBatch(root);
        if (batchMode) ui.toast('点选要删除的菜品，再点红色垃圾桶');
      });
    }

    var clearBtn = root.querySelector('[data-clear]');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () { clearCurrentTab(root); });
    }
  }

  function renderRecipes(root, params) {
    var role = MR.store.role();
    var tab = normalizeTab(role, (params && params[0]) || '');
    currentTab = tab;
    batchMode = false;
    batchSel = {};

    // 外壳（顶栏 + 页签）只跟身份有关。同一身份内换页签（含导入/导出）只更新高亮和内容：
    // 滑块才能真的滑过去，顶栏高度也保持不变，页面不会整体跳一下。
    if (root.getAttribute('data-shell-role') === role) {
      updateBatchButton(root, tab);
      setActiveTab(root, tab);
      paint(root);
      return;
    }

    root.innerHTML = topbarHTML(role, tab) + tabbarHTML(tab) +
                     '<div class="view-body" data-scroll data-content></div>';
    root.setAttribute('data-shell-role', role);
    updateBatchButton(root, tab);
    ui.placeTabThumb(root);
    paint(root);
    wire(root);
  }

  /* ============================== 菜谱详情页 ============================== */
  var currentCode = null;
  var jumpShowTimer = null;
  var jumpHideTimer = null;

  /** 一列步骤：编号由页面按顺序生成，数据里只存文字 */
  function stepsListHTML(list) {
    return '<ol class="rd-steps">' + list.map(function (s, i) {
      return '<li><span class="num">' + (i + 1) + '</span><span>' + D.esc(s) + '</span></li>';
    }).join('') + '</ol>';
  }

  /**
   * 正文：分阶段菜谱（和面 / 调馅 / 包制 / 蒸制…）每段带小标题、编号各自从 1 开始，
   * 和原始菜谱的写法一致；单一流程的菜就只有一列连续编号，不会出现空标题。
   * 小贴士排在正文最后，用淡橙底块和步骤区分开。
   */
  function bodyHTML(dish) {
    var secs = D.sectionsOf(dish);
    if (!secs.length) {
      return '<ol class="rd-steps"><li><span>这道菜还没写菜谱。</span></li></ol>';
    }

    var html = secs.map(function (sec) {
      return (sec.title ? '<h2 class="rd-sec">' + D.esc(sec.title) + '</h2>' : '') +
             stepsListHTML(sec.steps);
    }).join('');

    if (dish.tips && dish.tips.length) {
      html += '<div class="rd-tips">' +
                '<div class="rd-tips-head">小贴士</div>' +
                '<ul>' + dish.tips.map(function (t) {
                  return '<li>' + D.esc(t) + '</li>';
                }).join('') + '</ul>' +
              '</div>';
    }
    return html;
  }

  function renderRecipe(root, params) {
    var code = String((params && params[0]) || '').toUpperCase();
    var dish = D.DISH_BY_CODE[code];

    clearTimeout(jumpShowTimer);
    clearTimeout(jumpHideTimer);

    if (!dish) {
      currentCode = null;
      root.innerHTML = '<div class="topbar">' +
        '<button class="back-btn" type="button" data-back>' + ui.icon('back') + '返回</button></div>' +
        '<div class="view-body" data-scroll>' +
        ui.emptyHTML('🤔', '没有找到这道菜', '菜品数据里没有这个编码。',
          { go: 'recipes', label: '回菜谱' }) + '</div>';
      return;
    }

    currentCode = code;

    root.innerHTML = '' +
      '<div class="topbar">' +
        '<button class="back-btn" type="button" data-back>' + ui.icon('back') + '返回</button>' +
      '</div>' +
      '<div class="view-body" data-scroll>' +
        '<article class="rd">' +
          '<h1 class="rd-name">' + D.esc(dish.name) + '</h1>' +
          (dish.douyinUrl
            ? '<a class="rd-link" href="' + D.esc(dish.douyinUrl) + '" target="_blank" ' +
              'rel="noopener noreferrer">' + ui.icon('play') + '查看视频</a>'
            : '') +
          '<div class="dash rd-dash"></div>' +
          bodyHTML(dish) +
          '<div class="dash rd-dash"></div>' +
          '<div class="rd-code">' + dish.code + '</div>' +
        '</article>' +
      '</div>' +
      '<button class="jump-pill" type="button" data-jump hidden>' +
        ui.icon('arrowUp') + '刚刚看到的位置</button>';

    var sc = root.querySelector('[data-scroll]');
    var jump = root.querySelector('[data-jump]');
    var last = MR.store.getReadPos(code);

    // 默认永远从菜谱顶部开始，绝不自动跳转
    sc.scrollTop = 0;

    // 只在用户真的滚动过之后才更新阅读位置：
    // 进入时的程序化归零、以及"打开就返回"都不会把上次的位置覆盖掉。
    sc.addEventListener('scroll', function () {
      if (!currentCode || Math.abs(sc.scrollTop) < 2) return;
      MR.store.setReadPos(currentCode, sc.scrollTop, true);
    }, { passive: true });

    if (last > 24) {
      jumpShowTimer = setTimeout(function () {
        jump.hidden = false;
        requestAnimationFrame(function () { jump.classList.add('is-in'); });
        // 存在 5 秒，不点就自动消失
        jumpHideTimer = setTimeout(function () {
          jump.classList.remove('is-in');
          setTimeout(function () { jump.hidden = true; }, 260);
        }, 5000);
      }, 400);

      jump.addEventListener('click', function () {
        clearTimeout(jumpHideTimer);
        var max = sc.scrollHeight - sc.clientHeight;
        sc.scrollTo({ top: Math.min(last, Math.max(0, max)), behavior: 'smooth' });
        jump.classList.remove('is-in');
        setTimeout(function () { jump.hidden = true; }, 240);
      });
    }
  }

  /* ------------------------------ 注册视图 ------------------------------ */
  MR.tabbarHTML = tabbarHTML;

  window.MR.views = window.MR.views || {};
  MR.views.recipes = {
    // 滚动位置由路由统一保存/恢复
    render: renderRecipes,
    enter: function (root) {
      // 刚从某个菜谱返回：把那张卡片短暂高亮一下，让用户确认「回到这了」
      if (!pendingHighlight) return;
      var code = pendingHighlight;
      pendingHighlight = null;
      var card = root.querySelector('[data-content] .card[data-card="' + code + '"]');
      if (!card) return;
      card.classList.add('is-flash');
      setTimeout(function () { card.classList.remove('is-flash'); }, 900);
    }
  };
  MR.views.recipe = {
    render: renderRecipe,
    leave: function () {
      // 阅读位置在滚动过程中已经悄悄记下了（见 renderRecipe），这里只记住回来时要高亮哪张卡
      pendingHighlight = currentCode;
    }
  };

  /* 选择发生变化（含批量删除）时，如果正停在查询页就重绘并保持浏览位置 */
  MR.store.subscribe(function () {
    var root = document.getElementById('view-recipes');
    if (!root || !root.classList.contains('is-active')) return;
    // 导入页不跟着重绘：行内按钮由 ui.refresh 就地更新，重绘会把输入框里没解析的文字刷掉
    if (currentTab === 'import') return;
    var sc = root.querySelector('[data-scroll]');
    var y = sc ? sc.scrollTop : 0;
    paint(root);
    if (sc) sc.scrollTop = y;
  });
})();
