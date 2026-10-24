/* ==========================================================================
   妈妈的菜谱 · 状态层
   --------------------------------------------------------------------------
   严格区分两件事：
     ① 菜品是什么   →  js/data.js（唯一来源，只读）
     ② 用户选了什么 →  这里的编码集合（只存编码，不存菜品副本）
   因此以后改菜名、换图片、改菜谱，都不需要动任何选择记录。
   ========================================================================== */

(function () {
  'use strict';

  var KEY = 'mama-recipe-v1';

  function blank() {
    return {
      role: null,                 // 'chef'（大厨） | 'guest'（食客）
      // 每个身份各自处于哪个阶段。注意：现在只记录、不参与跳转
      // （每次进入网站都是「选身份 → 点菜」，不按这个字段跳页），
      // 保留它是为了以后想加"回到上次位置"时数据还在。
      stages: { chef: 'order', guest: 'order' },
      chefCodes: [],              // 大厨自己的选择
      guestCodes: [],             // 食客自己的选择
      imported: {                 // 大厨导入的食客选择
        codes: [],
        settledAt: '',            // 食客的结算时间（文本）
        raw: ''                   // 原始导入文本
      },
      settledAt: { chef: 0, guest: 0 },   // 每个身份各自的结算时间戳
      readPos: {}                 // { 菜品编码: 上次读到第几像素 }
    };
  }

  var state = blank();
  var subs = [];

  /* ------------------------------ 持久化 ------------------------------ */
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      var next = blank();
      if (saved && typeof saved === 'object') {
        next.role = (saved.role === 'chef' || saved.role === 'guest') ? saved.role : null;
        next.chefCodes = Array.isArray(saved.chefCodes) ? saved.chefCodes : [];
        next.guestCodes = Array.isArray(saved.guestCodes) ? saved.guestCodes : [];
        if (saved.imported && typeof saved.imported === 'object') {
          next.imported = {
            codes: Array.isArray(saved.imported.codes) ? saved.imported.codes : [],
            settledAt: saved.imported.settledAt || '',
            raw: saved.imported.raw || ''
          };
        }
        if (saved.stages && typeof saved.stages === 'object') {
          next.stages.chef = saved.stages.chef === 'recipes' ? 'recipes' : 'order';
          next.stages.guest = saved.stages.guest === 'recipes' ? 'recipes' : 'order';
        } else if (saved.stage === 'recipes' && next.role) {
          next.stages[next.role] = 'recipes';   // 兼容旧版本存下来的单一 stage
        }
        if (saved.settledAt && typeof saved.settledAt === 'object') {
          next.settledAt.chef = Number(saved.settledAt.chef) || 0;
          next.settledAt.guest = Number(saved.settledAt.guest) || 0;
        } else if (Number(saved.settledAt) > 0 && next.role) {
          next.settledAt[next.role] = Number(saved.settledAt);   // 兼容旧版本
        }
        next.readPos = (saved.readPos && typeof saved.readPos === 'object') ? saved.readPos : {};
      }
      state = next;
    } catch (e) {
      console.warn('[store] 读取本地数据失败，已使用空白状态', e);
    }
  }

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      // 隐私模式或存储受限：内存状态仍然可用，只是刷新后不保留
      console.warn('[store] 本地存储不可用，本次会话不持久化', e);
    }
  }

  function save() {
    persist();
    notify();
  }

  function notify() {
    subs.forEach(function (fn) {
      try { fn(state); } catch (e) { console.error(e); }
    });
  }

  /* ------------------------------ 身份与阶段 ------------------------------ */
  function setRole(role) {
    if (role !== 'chef' && role !== 'guest') return;
    state.role = role;
    save();
  }

  /** 当前身份的阶段键；还没选身份时按大厨算（只在首页用到，不影响流程） */
  function stageKey() { return state.role === 'guest' ? 'guest' : 'chef'; }

  function stage() { return state.stages[stageKey()]; }

  function setStage(value) {
    state.stages[stageKey()] = (value === 'recipes') ? 'recipes' : 'order';
    save();
  }

  /* ------------------------------ 当前身份的选择 ------------------------------ */
  function myKey() { return state.role === 'guest' ? 'guestCodes' : 'chefCodes'; }
  function myCodes() { return state[myKey()]; }
  function isPicked(code) { return myCodes().indexOf(code) !== -1; }

  function addCode(code) {
    if (!MR.data.DISH_BY_CODE[code]) return false;
    var list = myCodes();
    if (list.indexOf(code) === -1) {
      list.push(code);
      save();
      return true;
    }
    return false;
  }

  function removeCode(code) {
    var list = myCodes();
    var i = list.indexOf(code);
    if (i !== -1) {
      list.splice(i, 1);
      save();
      return true;
    }
    return false;
  }

  function toggleCode(code) {
    return isPicked(code) ? (removeCode(code), false) : (addCode(code), true);
  }

  /** 批量删除：只在当前身份的选择里删 */
  function removeCodes(codes) {
    var list = myCodes();
    var n = 0;
    (codes || []).forEach(function (c) {
      var i = list.indexOf(c);
      if (i !== -1) { list.splice(i, 1); n++; }
    });
    if (n) save();
    return n;
  }

  /** 批量加入当前身份的选择（导入页「一键全选」） */
  function addCodes(codes) {
    var list = myCodes();
    var n = 0;
    (codes || []).forEach(function (c) {
      if (MR.data.DISH_BY_CODE[c] && list.indexOf(c) === -1) { list.push(c); n++; }
    });
    if (n) save();
    return n;
  }

  /** 清空当前身份的全部选择（菜谱页的「清除全部」） */
  function clearMyCodes() {
    var list = myCodes();
    var n = list.length;
    if (!n) return 0;
    list.length = 0;
    save();
    return n;
  }

  /** 从导入结果里移除若干道菜（大厨在「食客选择」页签的批量删除） */
  function removeFromImport(codes) {
    var list = state.imported.codes;
    var n = 0;
    (codes || []).forEach(function (c) {
      var i = list.indexOf(c);
      if (i !== -1) { list.splice(i, 1); n++; }
    });
    if (n) save();
    return n;
  }

  /* ------------------------------ 导入结果 ------------------------------ */
  function applyImport(parsed) {
    state.imported = {
      codes: MR.data.sortCodes(parsed.codes || []),
      settledAt: parsed.settledAt || '',
      raw: parsed.raw || ''
    };
    save();
  }

  function clearImport() {
    state.imported = { codes: [], settledAt: '', raw: '' };
    save();
  }

  /* ------------------------------ 共同选择（纯计算结果，不落库） ------------------------------ */
  function commonCodes() {
    var guest = state.imported.codes || [];
    if (!state.chefCodes.length || !guest.length) return [];
    var set = Object.create(null);
    guest.forEach(function (c) { set[c] = 1; });
    return MR.data.sortCodes(state.chefCodes.filter(function (c) { return set[c]; }));
  }

  /* ------------------------------ 结算 ------------------------------ */
  function settle() {
    var key = stageKey();
    state.settledAt[key] = Date.now();
    state.stages[key] = 'recipes';
    save();
    return state.settledAt[key];
  }

  /* ------------------------------ 阅读位置 ------------------------------ */
  function getReadPos(code) {
    var v = state.readPos[code];
    return typeof v === 'number' && v > 0 ? v : 0;
  }

  /**
   * 记录读到哪儿。
   * quiet = true 时不广播变更（滚动过程中会频繁调用，没必要惊动所有页面）。
   * 注意：只有在用户真的滚动过之后才应该写，否则会把上一次的位置覆盖成 0。
   */
  function setReadPos(code, y, quiet) {
    if (!code) return;
    var v = Math.max(0, Math.round(y || 0));
    if (state.readPos[code] === v) return;
    state.readPos[code] = v;
    if (quiet) persist(); else save();
  }

  /* ------------------------------ 其他 ------------------------------ */
  function reset() {
    state = blank();
    save();
  }

  function subscribe(fn) { subs.push(fn); }

  window.MR = window.MR || {};
  MR.store = {
    // state 用取值函数暴露：load() 之后内部引用会换对象，直接存引用会读到旧值
    getState: function () { return state; },
    load: load,
    save: save,
    subscribe: subscribe,
    setRole: setRole,
    setStage: setStage,
    role: function () { return state.role; },
    stage: stage,
    myCodes: myCodes,
    has: isPicked,
    add: addCode,
    addMany: addCodes,
    remove: removeCode,
    removeMany: removeCodes,
    removeFromImport: removeFromImport,
    clearMine: clearMyCodes,
    toggle: toggleCode,
    chefCodes: function () { return state.chefCodes; },
    guestCodes: function () { return state.guestCodes; },
    imported: function () { return state.imported; },
    applyImport: applyImport,
    clearImport: clearImport,
    commonCodes: commonCodes,
    settle: settle,
    settledAt: function () { return state.settledAt[stageKey()]; },
    getReadPos: getReadPos,
    setReadPos: setReadPos,
    reset: reset
  };
})();
