/* ==========================================================================
   妈妈的菜谱 · 数据层（全站唯一的菜品数据来源）
   --------------------------------------------------------------------------
   要加菜 / 改菜，只需要改这一个文件：
     1) 分类顺序：调整 CATEGORIES 数组的顺序即可。这个顺序决定
        ① 点餐页左侧分类栏顺序 ② 滚动联动的当前分类 ③ 菜谱查询页分类顺序
        ④ 共同选择排序 ⑤ 菜品编码里的分类字母（A/B/C…按数组位置自动生成）。
     2) 菜品：往 DISHES 里加一条。code = 分类字母 + 三位数字，每个分类独立编号。
     3) 图片：默认用「渐变底色 + 菜名首字」占位，image 留空字符串即可。
        想加真实图片：把图片放进 assets/images/（命名成 A001.jpg 这种），
        再把那道菜的 image 写成 'assets/images/A001.jpg'，其它地方不用动。
        没有图片时自动显示「渐变 + 菜名首字」占位图。
   其他页面一律从这里读取，不允许各自维护一份菜品信息。
   ========================================================================== */

(function () {
  'use strict';

  /* ---------------------------- 分类（顺序即一切） ---------------------------- */
  var CATEGORIES = [
    { letter: 'A', name: '主食' },
    { letter: 'B', name: '凉菜' },
    { letter: 'C', name: '热菜' },
    { letter: 'D', name: '汤类' },
    { letter: 'E', name: '饮品' }
  ];

  /* ---------------------------- 菜品 ----------------------------
     code         稳定身份标识，导入/导出/匹配/共同选择全部只用它
     category     分类字母，必须存在于 CATEGORIES 中
     name         菜名
     image        图片路径（可为空字符串，自动用占位图）
     description  菜品描述 / 适用场景（点餐页在编码后面显示）
     ingredients  食材清单（结构化保留，方便以后展示或生成购物清单）
     steps        菜谱正文，按顺序显示为 1. 2. 3.
     douyinUrl    抖音链接（可选，为空则详情页整行隐藏）
     --------------------------------------------------------------- */
  var DISHES = [
    /* ------------------------------ A 主食 ------------------------------ */
    {
      code: 'A001',
      category: 'A',
      name: '西红柿炒鸡蛋',
      image: '',
      description: '清暑解渴',
      ingredients: ['西红柿 2 个', '鸡蛋 3 个', '小葱 1 根', '白糖 1 小勺', '盐 适量'],
      steps: [
        '西红柿顶部划十字，用开水烫 20 秒后剥皮，切成滚刀块；小葱切末备用。',
        '鸡蛋 3 个打散，加一小撮盐和 1 勺清水搅匀，这样炒出来更嫩。',
        '锅烧热放 2 勺油，油微微冒烟时倒入蛋液，等边缘凝固后翻炒成块，盛出备用。',
        '同一口锅补 1 勺油，下西红柿中火翻炒 2 分钟，炒到出红汁、变软塌。',
        '加 1 小勺白糖和适量盐调味，倒回鸡蛋块，翻炒均匀让蛋块裹上汤汁。',
        '出锅前撒葱花，喜欢汤汁多的可以沿锅边淋 2 勺热水再翻两下。'
      ],
      douyinUrl: 'https://www.douyin.com/' // 示例链接，替换成妈妈的视频地址
    },
    {
      code: 'A002',
      category: 'A',
      name: '黄金蛋炒饭',
      image: '',
      description: '剩米饭的救星',
      ingredients: ['隔夜米饭 2 碗', '鸡蛋 2 个', '火腿丁 50 克', '玉米粒 30 克', '小葱 2 根', '生抽 1 勺'],
      steps: [
        '米饭提前用手抓散，不要有结块；火腿切小丁，小葱切末。',
        '鸡蛋 2 个打散，倒一半蛋液到米饭里拌匀，让每粒米都裹上蛋液。',
        '热锅放 2 勺油，倒入剩下的蛋液炒成碎蛋块，盛出。',
        '锅内补 1 勺油，下米饭大火翻炒 2 分钟，把水分炒干、米粒跳起来。',
        '加火腿丁和玉米粒继续炒 1 分钟，沿锅边淋 1 勺生抽炒匀上色。',
        '倒回蛋块，加盐调味，撒葱花翻两下即可出锅。'
      ],
      douyinUrl: ''
    },
    {
      code: 'A003',
      category: 'A',
      name: '手擀炸酱面',
      image: '',
      description: '周末慢工出细活',
      ingredients: ['中筋面粉 300 克', '清水 140 克', '五花肉末 200 克', '干黄酱 3 勺', '黄瓜 1 根', '黄豆 50 克'],
      steps: [
        '面粉加一小撮盐，分次倒入清水，揉成偏硬的面团，盖湿布醒 30 分钟。',
        '干黄酱用 3 勺温水澥开；五花肉末下锅中小火煸到出油、微焦。',
        '倒入澥好的黄酱，小火慢炒 8 分钟，炒到酱香浓郁、油酱分离，盛出成炸酱。',
        '醒好的面团擀成薄面片，撒干粉折叠后切成面条，抖散备用。',
        '水开下面条煮 3 分钟，中间点一次凉水，捞出过一下凉水更筋道。',
        '面条浇上炸酱，配黄瓜丝和煮熟的黄豆拌匀即可。'
      ],
      douyinUrl: ''
    },

    /* ------------------------------ B 凉菜 ------------------------------ */
    {
      code: 'B001',
      category: 'B',
      name: '蒜泥拍黄瓜',
      image: '',
      description: '三分钟上桌，最解腻',
      ingredients: ['黄瓜 2 根', '大蒜 5 瓣', '香醋 2 勺', '生抽 1 勺', '香油 半勺', '白糖 半勺'],
      steps: [
        '黄瓜洗净，用刀面拍裂后切成小段，拍过的黄瓜更容易入味。',
        '撒一小勺盐抓匀，静置 5 分钟，倒掉渗出的水分。',
        '大蒜压成泥，加 2 勺香醋、1 勺生抽、半勺香油、半勺白糖调成料汁。',
        '料汁倒入黄瓜中拌匀，喜欢辣的可以加一勺辣椒油。',
        '拌好后最好冷藏 10 分钟再上桌，口感更脆爽。'
      ],
      douyinUrl: ''
    },
    {
      code: 'B002',
      category: 'B',
      name: '凉拌黑木耳',
      image: '',
      description: '爽脆开胃，先泡后拌',
      ingredients: ['干木耳 30 克', '小米椒 2 个', '大蒜 4 瓣', '香菜 2 根', '香醋 2 勺', '生抽 2 勺'],
      steps: [
        '干木耳用冷水泡 2 小时至完全发开，摘掉根部硬蒂，撕成小朵。',
        '水开后木耳焯 2 分钟，捞出立刻过冰水，这是爽脆的关键。',
        '小米椒切圈，大蒜切末，香菜切段。',
        '木耳沥干水分，加蒜末、小米椒、2 勺香醋、2 勺生抽、少许盐和香油。',
        '撒香菜段拌匀，冷藏 15 分钟入味后食用。'
      ],
      douyinUrl: ''
    },
    {
      code: 'B003',
      category: 'B',
      name: '皮蛋拌豆腐',
      image: '',
      description: '夏天不想开火就吃它',
      ingredients: ['内酯豆腐 1 盒', '皮蛋 2 个', '小葱 2 根', '生抽 2 勺', '香油 半勺'],
      steps: [
        '内酯豆腐倒扣在盘中，用刀背轻轻压出水分，倒掉盘中多余的汁水。',
        '皮蛋剥壳切成小瓣，均匀铺在豆腐上。',
        '小葱切末，撒在皮蛋上。',
        '淋 2 勺生抽和半勺香油，吃之前用勺子轻轻拌开即可。'
      ],
      douyinUrl: ''
    },

    /* ------------------------------ C 热菜 ------------------------------ */
    {
      code: 'C001',
      category: 'C',
      name: '红烧排骨',
      image: '',
      description: '逢年过节的硬菜',
      ingredients: ['肋排 800 克', '冰糖 20 克', '生姜 5 片', '八角 2 颗', '生抽 3 勺', '老抽 1 勺', '料酒 2 勺'],
      steps: [
        '排骨冷水下锅，加 3 片姜和 1 勺料酒，煮开后撇净浮沫，再煮 2 分钟捞出冲净。',
        '锅中放少许油，下 20 克冰糖小火炒到融化变枣红色，立即倒入排骨翻炒上色。',
        '排骨均匀裹上糖色后，加姜片、八角炒香，淋 2 勺料酒去腥。',
        '加 3 勺生抽、1 勺老抽翻匀，倒入没过排骨的热水，大火烧开转小火炖 40 分钟。',
        '加盐调味，转大火收汁，不断翻炒让汤汁浓稠地挂在排骨上。',
        '汤汁收到只剩锅底薄薄一层即可出锅，撒白芝麻更香。'
      ],
      douyinUrl: 'https://www.douyin.com/' // 示例链接，替换成妈妈的视频地址
    },
    {
      code: 'C002',
      category: 'C',
      name: '青椒土豆丝',
      image: '',
      description: '下饭快手菜，火候是关键',
      ingredients: ['土豆 2 个', '青椒 2 个', '大蒜 3 瓣', '白醋 1 勺', '盐 适量'],
      steps: [
        '土豆去皮切细丝，放入清水中反复冲洗，洗掉表面淀粉后沥干。',
        '青椒去籽切丝，大蒜切片。',
        '锅烧到很热，放 2 勺油，下蒜片爆香。',
        '倒入土豆丝大火快炒 1 分钟，沿锅边淋 1 勺白醋，这样土豆丝才脆。',
        '加青椒丝继续炒 30 秒，加盐调味，断生就立刻出锅，不要炒久。'
      ],
      douyinUrl: ''
    },
    {
      code: 'C003',
      category: 'C',
      name: '干煸四季豆',
      image: '',
      description: '饭店的味道，家里也能复刻',
      ingredients: ['四季豆 500 克', '猪肉末 100 克', '干辣椒 8 个', '花椒 1 小勺', '蒜末 2 勺', '生抽 1 勺'],
      steps: [
        '四季豆撕去两侧的筋，掰成 5 厘米长段，洗净后彻底擦干水分。',
        '锅中放 3 勺油，中火下四季豆煸 6 到 8 分钟，煸到表皮起皱发软后盛出。',
        '锅里留底油，下猪肉末炒散炒香，加干辣椒和花椒炒出香味。',
        '倒回四季豆，加蒜末和 1 勺生抽，大火翻炒 1 分钟。',
        '加盐调味出锅。四季豆一定要煸熟透，不能有生豆味。'
      ],
      douyinUrl: ''
    },

    /* ------------------------------ D 汤类 ------------------------------ */
    {
      code: 'D001',
      category: 'D',
      name: '番茄鸡蛋汤',
      image: '',
      description: '十分钟一碗热汤',
      ingredients: ['番茄 2 个', '鸡蛋 2 个', '小葱 1 根', '淀粉 1 勺', '香油 几滴'],
      steps: [
        '番茄去皮切小块，鸡蛋打散，1 勺淀粉加 3 勺水调成水淀粉。',
        '锅中放少许油，下番茄中火炒 3 分钟，炒出浓稠红汁。',
        '倒入 800 毫升开水，大火煮开后再煮 2 分钟。',
        '淋入水淀粉搅匀，汤会变得微微浓稠，蛋花才挂得住。',
        '转小火，把蛋液沿筷子缓缓淋入锅中，等 5 秒再轻轻推动，蛋花就细又漂亮。',
        '加盐调味，滴几滴香油，撒葱花出锅。'
      ],
      douyinUrl: ''
    },
    {
      code: 'D002',
      category: 'D',
      name: '冬瓜排骨汤',
      image: '',
      description: '清润去腻，慢炖一小时',
      ingredients: ['排骨 500 克', '冬瓜 500 克', '生姜 4 片', '枸杞 1 小把', '料酒 1 勺'],
      steps: [
        '排骨冷水下锅，加姜片和料酒焯水，撇净浮沫后捞出用温水冲净。',
        '排骨放入汤锅，加 1500 毫升热水和 2 片姜，大火烧开转小火炖 40 分钟。',
        '冬瓜去皮去瓤切厚片，等排骨炖到软烂后下锅。',
        '继续炖 15 分钟，炖到冬瓜边缘透明、用筷子能轻松扎透。',
        '加盐调味，撒枸杞再煮 1 分钟关火，出锅前不要放太多调料，喝的就是清甜。'
      ],
      douyinUrl: ''
    },
    {
      code: 'D003',
      category: 'D',
      name: '紫菜蛋花汤',
      image: '',
      description: '夜宵暖胃，蛋花要细',
      ingredients: ['紫菜 1 小把', '鸡蛋 2 个', '虾皮 1 勺', '小葱 1 根', '香油 几滴'],
      steps: [
        '紫菜撕成小片放碗底，加 1 勺虾皮和少许盐、几滴香油。',
        '锅中烧开 700 毫升水，转小火保持微沸。',
        '蛋液沿筷子缓缓淋入，静置 5 秒再轻推，形成细蛋花。',
        '把滚烫的汤直接冲入放紫菜的碗中，撒葱花即可。'
      ],
      douyinUrl: ''
    },

    /* ------------------------------ E 饮品 ------------------------------ */
    {
      code: 'E001',
      category: 'E',
      name: '冰糖雪梨水',
      image: '',
      description: '嗓子干的时候煮一锅',
      ingredients: ['雪梨 2 个', '冰糖 30 克', '枸杞 1 小把', '清水 1200 毫升'],
      steps: [
        '雪梨洗净，去核切成滚刀块，梨皮保留，润燥的效果更好。',
        '梨块和 1200 毫升清水一起下锅，大火烧开。',
        '转小火煮 25 分钟，煮到梨块变软、汤色微黄。',
        '加 30 克冰糖搅到化开，撒枸杞再煮 2 分钟关火。',
        '温热时喝最好，喝不完的冷藏可放 2 天。'
      ],
      douyinUrl: ''
    },
    {
      code: 'E002',
      category: 'E',
      name: '柠檬蜂蜜水',
      image: '',
      description: '招待客人的清爽一杯',
      ingredients: ['柠檬 2 个', '蜂蜜 4 勺', '薄荷叶 几片', '冰块 适量', '温水 800 毫升'],
      steps: [
        '柠檬用盐搓洗表皮，冲净后切成 3 毫米左右的薄片，去籽避免发苦。',
        '杯中放 4 勺蜂蜜，加 200 毫升 60 度以下的温水搅匀，水温过高会破坏蜂蜜风味。',
        '放入柠檬片，再倒入 600 毫升水，冷藏 30 分钟风味更融合。',
        '饮用前加冰块和薄荷叶，也可以留两片柠檬做装饰。'
      ],
      douyinUrl: ''
    },
    {
      code: 'E003',
      category: 'E',
      name: '陈皮红豆沙',
      image: '',
      description: '冬天热着喝，绵密起沙',
      ingredients: ['红豆 200 克', '陈皮 1 小片', '冰糖 60 克', '清水 1500 毫升'],
      steps: [
        '红豆提前用清水泡 4 小时以上，泡到豆子明显胀大。',
        '陈皮用温水泡软，刮掉内层的白瓤，这样不会发苦。',
        '红豆、陈皮加 1500 毫升水入锅，大火烧开转小火煮 60 分钟。',
        '煮到红豆开花起沙，用勺子背压一压帮助出沙。',
        '加冰糖再煮 10 分钟，收到自己喜欢的浓稠度即可。'
      ],
      douyinUrl: ''
    }
  ];

  /* ==========================================================================
     以下是派生数据与工具函数：全部自动生成，不需要手工维护第二份
     ========================================================================== */

  var DISH_BY_CODE = Object.create(null);
  var CATEGORY_BY_LETTER = Object.create(null);
  var order = Object.create(null);

  CATEGORIES.forEach(function (cat, i) {
    cat.index = i;
    CATEGORY_BY_LETTER[cat.letter] = cat;
    order[cat.letter] = i;
  });

  DISHES.forEach(function (dish) {
    DISH_BY_CODE[dish.code] = dish;
  });

  /**
   * 数据体检：加菜 / 改菜之后如果哪里写错了，浏览器控制台（F12）会直接把问题列出来。
   * 也可以在控制台手动执行 MR.data.validate() 查看。
   */
  function validate() {
    var issues = [];
    var seen = Object.create(null);
    DISHES.forEach(function (dish, i) {
      var tag = dish.code || ('DISHES 第 ' + (i + 1) + ' 条');
      if (!/^[A-Z]\d{3}$/.test(String(dish.code || ''))) {
        issues.push(tag + '：编码格式应为「分类字母 + 三位数字」，例如 C004');
      }
      if (seen[dish.code]) issues.push(tag + '：编码重复了，每道菜的编码必须唯一');
      seen[dish.code] = 1;
      if (!CATEGORY_BY_LETTER[dish.category]) {
        issues.push(tag + '：分类字母「' + dish.category + '」不在 CATEGORIES 里');
      } else if (String(dish.code || '').charAt(0) !== dish.category) {
        issues.push(tag + '：编码首字母和 category（' + dish.category + '）对不上');
      }
      if (!dish.name) issues.push(tag + '：没有菜名');
      if (!dish.description) issues.push(tag + '：没有描述，点餐页那行会空一块');
      if (!dish.steps || !dish.steps.length) issues.push(tag + '：还没有菜谱正文（steps）');
      if (dish.image && dish.image.indexOf('assets/images/') !== 0) {
        issues.push(tag + '：图片路径建议写成 assets/images/' + dish.code + '.jpg');
      }
    });
    return issues;
  }

  var dataIssues = validate();
  if (dataIssues.length) {
    console.warn('[data] 菜品数据有 ' + dataIssues.length + ' 处问题：\n· ' + dataIssues.join('\n· '));
  }

  /** 按分类顺序分组的完整菜品表（点餐页右侧连续菜品流用） */
  var GROUPED = CATEGORIES.map(function (cat) {
    return {
      letter: cat.letter,
      name: cat.name,
      index: cat.index,
      dishes: DISHES.filter(function (d) { return d.category === cat.letter; })
    };
  }).filter(function (g) { return g.dishes.length > 0; });

  /** 分类排序权重 */
  function catIndex(letter) {
    return letter in order ? order[letter] : 999;
  }

  /** 编码排序：先按分类顺序，再按数字 */
  function codeWeight(code) {
    var letter = String(code).charAt(0).toUpperCase();
    var num = parseInt(String(code).slice(1), 10) || 0;
    return catIndex(letter) * 1000 + num;
  }

  /** 编码数组 → 去重 + 过滤无效 + 按全站统一分类顺序排序 */
  function sortCodes(codes) {
    var seen = Object.create(null);
    var list = [];
    (codes || []).forEach(function (c) {
      c = String(c || '').toUpperCase();
      if (!DISH_BY_CODE[c] || seen[c]) return;
      seen[c] = 1;
      list.push(c);
    });
    return list.sort(function (a, b) { return codeWeight(a) - codeWeight(b); });
  }

  /** 编码数组 → [{letter, name, dishes}]，只保留有菜品的分类 */
  function groupCodes(codes) {
    var sorted = sortCodes(codes);
    return GROUPED.map(function (g) {
      return {
        letter: g.letter,
        name: g.name,
        index: g.index,
        dishes: sorted.filter(function (c) { return DISH_BY_CODE[c].category === g.letter; })
                 .map(function (c) { return DISH_BY_CODE[c]; })
      };
    }).filter(function (g) { return g.dishes.length > 0; });
  }

  /** 搜索：菜名 / 编码 / 描述 / 分类名 */
  function searchDishes(query) {
    var q = String(query || '').trim().toLowerCase();
    if (!q) return [];
    return DISHES.filter(function (d) {
      var cat = CATEGORY_BY_LETTER[d.category];
      var hay = [d.code, d.name, d.description, cat ? cat.name : ''].join(' ').toLowerCase();
      return hay.indexOf(q) !== -1;
    }).sort(function (a, b) { return codeWeight(a.code) - codeWeight(b.code); });
  }

  /** 结算时间格式：2026年05月03日21:36 */
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function formatStamp(value) {
    var d = (value instanceof Date) ? value : new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.getFullYear() + '年' + pad2(d.getMonth() + 1) + '月' + pad2(d.getDate()) + '日' +
           pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }

  /**
   * 解析食客导出的文本，例如：
   *   「2026年05月03日21:36｜A008 B027 C001」
   * 容错：全角/半角竖线、换行、空格、逗号分隔，编码数量不限。
   */
  function parseExportText(raw) {
    var text = String(raw || '');
    var result = { settledAt: '', codes: [], unknown: [], empty: true };

    var stampMatch = text.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日\s*(\d{1,2})\s*[:：]\s*(\d{1,2})/);
    if (stampMatch) {
      result.settledAt = stampMatch[1] + '年' + pad2(+stampMatch[2]) + '月' + pad2(+stampMatch[3]) +
                         '日' + pad2(+stampMatch[4]) + ':' + pad2(+stampMatch[5]);
      text = text.replace(stampMatch[0], ' ');
    }

    var found = text.match(/[A-Za-z]\s*[-_]?\s*\d{1,3}/g) || [];
    var seen = Object.create(null);
    var valid = [];
    found.forEach(function (token) {
      var m = token.match(/([A-Za-z])\s*[-_]?\s*(\d{1,3})/);
      if (!m) return;
      var code = m[1].toUpperCase() + ('00' + m[2]).slice(-3);
      if (seen[code]) return;
      seen[code] = 1;
      if (DISH_BY_CODE[code]) valid.push(code);
      else result.unknown.push(code);
    });

    result.codes = sortCodes(valid);
    result.empty = !result.codes.length && !result.settledAt;
    return result;
  }

  /** 占位图配色：按编码稳定生成，保证同一道菜每次颜色一致 */
  function placeholderStyle(code) {
    var hash = 0;
    var str = String(code || '');
    for (var i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) % 360;
    var h1 = hash;
    var h2 = (hash + 24) % 360;
    return '--ph-bg:linear-gradient(140deg,hsl(' + h1 + ',68%,93%),hsl(' + h2 + ',62%,85%));' +
           '--ph-ink:hsl(' + h1 + ',42%,38%)';
  }

  /** 占位图首字：中文取第一个字，其他取前两位 */
  function placeholderChar(name) {
    var s = String(name || '菜').trim();
    return /[\u4e00-\u9fa5]/.test(s.charAt(0)) ? s.charAt(0) : s.slice(0, 2);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  window.MR = window.MR || {};
  MR.data = {
    CATEGORIES: CATEGORIES,
    DISHES: DISHES,
    GROUPED: GROUPED,
    DISH_BY_CODE: DISH_BY_CODE,
    CATEGORY_BY_LETTER: CATEGORY_BY_LETTER,
    catIndex: catIndex,
    codeWeight: codeWeight,
    sortCodes: sortCodes,
    groupCodes: groupCodes,
    searchDishes: searchDishes,
    validate: validate,
    formatStamp: formatStamp,
    parseExportText: parseExportText,
    placeholderStyle: placeholderStyle,
    placeholderChar: placeholderChar,
    esc: esc
  };
})();
