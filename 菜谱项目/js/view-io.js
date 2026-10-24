/* ==========================================================================
   妈妈的菜谱 · 导入 / 导出（内容是菜谱页的两个页签）
   --------------------------------------------------------------------------
   两台手机之间唯一的通道就是这段文本：
     食客导出：2026年05月03日21:36｜A008 B027 C001
     大厨导入：粘贴上面这段 → 按菜品编码找回完整菜品
   这里只负责"内容"：顶栏和页签由菜谱页统一提供，所以点导入/导出时
   整页不会被重建，只有内容和那一块滑动高亮在变。
   ========================================================================== */

(function () {
  'use strict';

  var D = window.MR.data;
  var ui = window.MR.ui;

  /* ============================== 导入 ============================== */
  function importBodyHTML() {
    return '' +
      '<div class="io">' +
        '<div class="io-title">复制食客的点餐信息</div>' +
        '<div class="io-hint">把食客发来的那一整行粘贴到下面，点右边的 ✓ 就能认出菜品。</div>' +
        '<div class="input-row">' +
          '<input class="text-input" type="text" data-raw autocomplete="off" ' +
            'placeholder="2026年05月03日21:36｜A008 B027 C001">' +
          '<button class="check-btn" type="button" data-parse aria-label="解析">' + ui.icon('check') + '</button>' +
        '</div>' +
        '<div class="io-error" data-err hidden></div>' +
        '<div data-result></div>' +
      '</div>';
  }

  function resultHTML() {
    var imp = MR.store.imported();
    var codes = D.sortCodes(imp.codes);
    if (!codes.length && !imp.settledAt) return '';

    var rows = codes.map(function (c) {
      return ui.rowCardHTML(D.DISH_BY_CODE[c], { act: 'toggle' });
    }).join('');

    return '' +
      '<button class="select-all" type="button" data-select-all>一键全选</button>' +
      '<div class="solid-line"></div>' +
      '<div class="stamp-label">结算时间</div>' +
      '<div class="stamp-value">' + (imp.settledAt ? D.esc(imp.settledAt) : '未识别到结算时间') + '</div>' +
      '<div class="io-sub"><span>点餐信息</span><span class="count">共 ' + codes.length + ' 个菜品</span></div>' +
      (codes.length ? rows
        : '<div class="io-hint" style="margin-top:12px">这一行里没有认出任何菜品编码。</div>');
  }

  /** 把导入页的内容渲染进容器（容器是菜谱页的滚动区） */
  function renderImportInto(container) {
    container.innerHTML = importBodyHTML();

    var input = container.querySelector('[data-raw]');
    var checkBtn = container.querySelector('[data-parse]');
    var err = container.querySelector('[data-err]');
    var result = container.querySelector('[data-result]');

    input.value = MR.store.imported().raw || '';
    result.innerHTML = resultHTML();
    syncCheck();

    function syncCheck() {
      checkBtn.classList.toggle('is-ready', !!input.value.trim());
    }

    function showError(msg) {
      err.hidden = false;
      err.textContent = msg;
    }

    function doParse() {
      var raw = input.value.trim();
      if (!raw) {
        showError('先把食客发来的信息粘贴进来。');
        return;
      }
      var parsed = D.parseExportText(raw);
      if (!parsed.codes.length) {
        showError('没认出菜品编码。正确格式像这样：2026年05月03日21:36｜A008 B027 C001');
        return;
      }
      parsed.raw = raw;
      err.hidden = true;
      MR.store.applyImport(parsed);

      result.innerHTML = resultHTML();
      if (parsed.unknown.length) {
        var tip = document.createElement('div');
        tip.className = 'io-error';
        tip.textContent = '有 ' + parsed.unknown.length + ' 个编码在菜品数据里找不到：' +
                          parsed.unknown.join('、');
        result.appendChild(tip);
      }
      ui.toast('认出了 ' + parsed.codes.length + ' 道菜');
    }

    input.addEventListener('input', syncCheck);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); doParse(); input.blur(); }
    });
    checkBtn.addEventListener('click', function () { doParse(); input.blur(); });

    result.addEventListener('click', function (e) {
      // 一键全选：把食客点的菜一次性加入大厨自己的选择
      if (e.target.closest('[data-select-all]')) {
        var n = MR.store.addMany(MR.store.imported().codes);
        ui.toast(n ? '已加入 ' + n + ' 道菜到大厨选择' : '这些菜都已经在大厨选择里了');
        return;
      }
      // 单行 ＋ / 垃圾桶：大厨可以只挑其中几道加入自己的选择
      var btn = e.target.closest('.act-btn');
      if (!btn) return;
      var code = btn.getAttribute('data-code');
      var dish = D.DISH_BY_CODE[code];
      if (!dish) return;
      if (MR.store.has(code)) {
        ui.confirmDelete({
          sub: dish.name,
          onYes: function () { MR.store.remove(code); }
        });
        return;
      }
      var origin = btn.querySelector('.act') || btn;
      ui.flyToBag(origin, function () {
        MR.store.add(code);
        ui.toast('已把「' + dish.name + '」加入大厨选择');
      });
    });
  }

  /* ============================== 导出 ============================== */
  function exportBodyHTML() {
    var codes = D.sortCodes(MR.store.myCodes());
    var settledAt = MR.store.settledAt();

    if (!codes.length) {
      return '<div class="io">' +
        ui.emptyHTML('🍽️', '还没有选菜', '回点餐页挑几道想吃的，结算后就能把信息发给大厨。',
          { go: 'order', label: '去点餐' }) + '</div>';
    }

    if (!settledAt) {
      return '<div class="io">' +
        '<div class="io-title">将信息复制给大厨</div>' +
        '<div class="io-hint">还没有结算时间，先结算一下，导出的信息才会带上时间。</div>' +
        '<div style="margin-top:20px">' +
          '<button class="btn-primary" type="button" data-go="checkout">去结算</button>' +
        '</div>' +
      '</div>';
    }

    var text = D.formatStamp(settledAt) + '｜' + codes.join(' ');
    return '<div class="io">' +
      '<div class="io-title">将信息复制给大厨</div>' +
      '<div class="io-hint">复制下面这一整行发给大厨，大厨在导入页粘贴就能看到你点的菜。</div>' +
      '<div class="copy-box" data-copy-text>' + D.esc(text) + '</div>' +
      '<button class="copy-btn" type="button" data-copy>复制</button>' +
      '<div class="io-hint" style="margin-top:14px">共 ' + codes.length + ' 个菜品 · ' +
        codes.join(' ') + '</div>' +
    '</div>';
  }

  /** 把导出页的内容渲染进容器 */
  function renderExportInto(container) {
    container.innerHTML = exportBodyHTML();
    var box = container.querySelector('.io');
    if (!box) return;
    box.addEventListener('click', function (e) {
      if (!e.target.closest('[data-copy]')) return;
      var text = container.querySelector('[data-copy-text]');
      if (text) copyText(text.textContent);
    });
  }

  /** 复制：优先用剪贴板 API，失败时回退到临时 textarea */
  function copyText(text) {
    function fallback() {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, text.length);
        var ok = document.execCommand('copy');
        ta.remove();
        ui.toast(ok ? '已复制，发给大厨吧' : '复制失败，请长按上面的文字手动复制');
      } catch (e) {
        ui.toast('复制失败，请长按上面的文字手动复制');
      }
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () {
        ui.toast('已复制，发给大厨吧');
      }).catch(fallback);
    } else {
      fallback();
    }
  }

  MR.ioContent = {
    import: renderImportInto,
    export: renderExportInto
  };
})();
