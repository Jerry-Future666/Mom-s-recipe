/* ==========================================================================
   妈妈的菜谱 · 数据层（全站唯一的菜品数据来源）
   --------------------------------------------------------------------------
   要加菜 / 改菜，只需要改这一个文件：
     1) 分类顺序：调整 CATEGORIES 数组的顺序即可。这个顺序决定
        ① 点餐页左侧分类栏顺序 ② 滚动联动的当前分类 ③ 菜谱查询页分类顺序
        ④ 共同选择排序 ⑤ 菜品编码里的分类字母（A/B/C…按数组位置自动生成）。
     2) 菜品：往 DISHES 里加一条。code = 分类字母 + 三位数字，每个分类独立编号。
        正式菜谱从 001 开始往下排；「示例」占位菜固定用 999，
        以后真正的菜加进来时不会和它对上号。
     3) 图片：默认用「渐变底色 + 菜名首字」占位，image 留空字符串即可。
        想加真实图片：把图片放进 assets/images/（命名成 A001.jpg 这种），
        再把那道菜的 image 写成 'assets/images/A001.jpg'，其它地方不用动。
     4) 菜谱正文两种写法：
        · 单一流程 → steps: ['第一步…', '第二步…']
        · 分阶段（和面 / 调馅 / 包制 / 蒸制…）→ sections: [{title, steps:[…]}, …]
        有 sections 时优先用它，每个阶段自己从 1 开始编号，读起来和原文一致。
     5) 小贴士 → tips: ['…']，排在菜谱正文下面，没有就不显示。
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
     sections     分阶段菜谱（可选，优先级高于 steps），每段 { title, steps: [] }
     steps        菜谱正文（可选，单一流程用），按顺序显示为 1. 2. 3.
     tips         小贴士（可选），排在正文下面
     douyinUrl    抖音链接（可选，为空则详情页整行隐藏）
     --------------------------------------------------------------- */
  var DISHES = [
    /* ------------------------------ A 主食 ------------------------------ */
    {
      code: 'A001',
      category: 'A',
      name: '鲜肉灌汤包',
      image: '',
      description: '皮薄馅大，一咬一流汤',
      ingredients: [
        '面团：面粉 500 克',
        '酵母粉 5 克、白糖 10 克（促进发酵）、泡打粉 5 克（可选）',
        '35℃ 温水 260 克、少量猪油（可选，让面团更白亮）',
        '肉馅：三分肥七分瘦的肉馅 500 克（1 斤）',
        '葱姜大料香叶泡的料水 150 克',
        '生抽、老抽、精盐、鸡精、十三香、胡椒粉、蚝油、浓缩鸡汁（可选）',
        '葱花、姜末、热油、香油'
      ],
      sections: [
        {
          title: '一、和面醒发',
          steps: [
            '准备材料：面粉 500 克、酵母粉 5 克、白糖 10 克（促进发酵）、泡打粉 5 克（可选，提升蓬松度）、35℃ 左右的温水 260 克（温度不可过高，否则会烫死酵母）、少量猪油（可选，让面团更白亮）。',
            '和面：将酵母粉、白糖、泡打粉加入面粉中混合均匀，边倒温水边搅拌，搅成絮状后加入猪油，揉成光滑细腻的面团。',
            '醒发：将面团放入温暖处醒发至两倍大，内部呈拉丝网状，时间约 30-40 分钟。'
          ]
        },
        {
          title: '二、调拌肉馅',
          steps: [
            '准备材料：1 斤三分肥七分瘦的肉馅、150 克葱姜大料香叶泡的料水，以及生抽、老抽、精盐、鸡精、十三香、胡椒粉、蚝油、浓缩鸡汁（可选）、葱花、姜末、热油、香油。',
            '打水：将料水分次少量加入肉馅中，顺着一个方向搅拌，让肉馅充分吸收水分，直至肉馅呈嫩滑的豆腐状。',
            '调味：加入生抽、老抽、精盐、鸡精、十三香、胡椒粉、蚝油、浓缩鸡汁，继续顺着一个方向搅拌上劲。',
            '增香：加入葱花、姜末，淋上烧热的油激发出香味，再滴入几滴香油，搅拌均匀。',
            '冷藏：将调好的肉馅放入冰箱冷藏片刻，便于后续包制。'
          ]
        },
        {
          title: '三、包制包子',
          steps: [
            '排气分剂：将醒发好的面团取出，揉面排气，搓成长条，分成大小均匀的小剂子。',
            '擀皮：将小剂子按扁，擀成中间厚边缘薄的包子皮（不要擀太薄，否则不易醒发）。',
            '包馅：取一张包子皮，放入适量肉馅，用手指捏住边缘，一边提一边捏，将包子包成带褶的形状，收紧收口。',
            '二次醒发：将包好的包子放入蒸笼，置于温水锅上二次醒发 15 分钟，让包子体积变大。'
          ]
        },
        {
          title: '四、蒸制出锅',
          steps: [
            '蒸制：凉水上锅，大火烧开后计时 12 分钟，关火后再焖 3 分钟。',
            '出锅：打开锅盖，取出蒸好的包子，即可享用。'
          ]
        }
      ],
      tips: [],
      douyinUrl: 'https://v.douyin.com/b8hrR0eer_c/'
    },
    {
      code: 'A002',
      category: 'A',
      name: '家常半发面小油饼',
      image: '',
      description: '半发面，层次分明',
      ingredients: [
        '面团：普通面粉 300 克',
        '精盐 3 克、酵母粉 3 克、泡打粉 2 克、白糖 5 克',
        '温水 210 克',
        '油酥：面粉 20 克、精盐 适量、食用油 适量'
      ],
      sections: [
        {
          title: '一、和面',
          steps: [
            '准备普通面粉 300 克，加入精盐 3 克、酵母粉 3 克、泡打粉 2 克、白糖 5 克，混合均匀。',
            '倒入温水 210 克，用筷子搅拌至没有干面粉，形成面絮状。',
            '下手揉成面团，先在盆里简单揉一下，再移到案板上，用掌根位置推揉，大概揉四五分钟，直到面团光滑细腻。',
            '把揉好的面团搓成长条，分成 3 个剂子（大小根据锅的大小调整）。',
            '把每个剂子搓成圆球，再搓成长条，放在盘子里，表面抹点油防止粘连。',
            '盖上保鲜膜，醒发 10 分钟即可，不需要完全发起来。'
          ]
        },
        {
          title: '二、做油酥',
          steps: [
            '取一个小碗，放入面粉 20 克，加入适量精盐，再倒入食用油，搅拌成酸奶状的油酥。'
          ]
        },
        {
          title: '三、擀饼',
          steps: [
            '案板上撒点干面粉，取一个醒好的剂子，轻轻推一下，按扁，擀成长方形，厚度约 3 毫米。',
            '把调好的油酥均匀地淋在面片上，用刮板抹开，形成薄薄的一层。',
            '撒上一点干面粉，这样可以让层次更分明。',
            '用刮板在面片中间切一刀，然后像折扇子一样，把面片折叠起来，折的次数越多，层次越多。',
            '把折好的面片收口，捏紧边缘，防止油酥漏出来，整理成圆形。',
            '把包好的饼坯擀开，翻面再擀，擀成一元硬币的厚度；擀的时候如果有气泡，不要硬擀，从前面往回搂一下。'
          ]
        },
        {
          title: '四、烙饼',
          steps: [
            '平底锅提前预热，不需要放油，把擀好的饼放入锅中，铺平。',
            '在饼的表面喷上一层薄油，锁住水分，盖上锅盖，用中小火烙。',
            '烙至饼的表面鼓起小泡、底部上色，翻面，再喷上一层薄油，盖上锅盖继续烙。',
            '烙至饼的两面都鼓起大泡、颜色金黄，就可以出锅了。'
          ]
        }
      ],
      tips: [
        '和面的水温以温水为宜，不要用开水，会把酵母烫死。',
        '揉面的时候用掌根推揉，不要用手指抓，这样不容易粘手。',
        '油酥的稠度要适中，太稀会流出来，太干抹不开。',
        '烙饼的时候火不要太大，否则容易外糊里不熟；也不要太小，饼会硬。',
        '刚烙好的饼表皮有点硬，放一会儿就会变软，层次也会更分明。'
      ],
      douyinUrl: 'https://v.douyin.com/sKAPvZhoXFM/'
    },
    {
      code: 'A003',
      category: 'A',
      name: '薄皮韭菜馅饼',
      image: '',
      description: '薄皮大馅，凉了也软',
      ingredients: [
        '面团：普通面粉 300 克、精盐 2 克、五六十度温开水 180 克',
        '馅料：韭菜 1 把、煮好的粉条 适量、鸡蛋碎 适量、小虾皮 适量',
        '调料：盐、味精、十三香、蚝油（不吃可省略）、香油、食用油、老抽'
      ],
      sections: [
        {
          title: '一、和面醒发',
          steps: [
            '准备普通面粉 300 克，加入精盐 2 克，搅拌均匀。',
            '倒入五六十度的温开水 180 克，搅拌至没有干面粉，形成面絮状。',
            '下手揉成光滑细腻的面团，搓成长条，分成 10 个剂子。',
            '把每个剂子揉成小圆球，再搓成长条，放在案板上，表面抹点油防止粘连。',
            '盖上保鲜膜，醒发 20 分钟，让面团更有延展性。'
          ]
        },
        {
          title: '二、调拌馅料',
          steps: [
            '取提前煮好的粉条，剁碎，趁热加入老抽上色，再加入食用油，搅拌至粉条根根分离。',
            '韭菜洗净擦干，倒入食用油拌匀，锁住水分防止出水。',
            '向韭菜中加入炒好的鸡蛋碎、处理好的粉条、小虾皮。',
            '加入盐、味精、十三香、蚝油（不吃可省略）、香油，搅拌均匀。'
          ]
        },
        {
          title: '三、包制馅饼',
          steps: [
            '案板上撒干面粉，取一个醒好的剂子，按扁，擀成薄而大的长方形面片，越薄越好。',
            '将馅料铺在面片的三分之二处，边缘留出一个角。',
            '从有馅料的一侧开始折叠，每折一下都压一下，防止馅料漏出，最后将两头收口捏紧。'
          ]
        },
        {
          title: '四、烙制出锅',
          steps: [
            '平底锅预热，倒入适量食用油，将包好的馅饼轻轻拍扁，放入锅中。',
            '用中温烙制，盖上锅盖，烙至一面金黄后翻面，继续烙制另一面。',
            '两面都烙至金黄酥脆，即可出锅。'
          ]
        }
      ],
      tips: [
        '和面的水温以五六十度为宜，不要用开水，避免面团烫熟。',
        '韭菜一定要擦干水分，先封油再拌馅，这样可以有效防止出水。',
        '擀皮时尽量擀薄，这样烙出来的饼皮更薄，口感更好。',
        '烙饼时用中温，盖上锅盖可以让饼更快熟透，保持口感柔软。',
        '也可以选择蒸制，水开后上锅蒸 8 分钟即可。'
      ],
      douyinUrl: 'https://v.douyin.com/Cm3DpbPwtXU/'
    },
    {
      code: 'A004',
      category: 'A',
      name: '家常大饼',
      image: '',
      description: '层次丰富，凉了不硬',
      ingredients: [
        '面团：面粉 300 克、精盐 3 克、五六十度温水 210 克',
        '油酥：面粉 30 克、熟食用油 40 克',
        '其他：食用油、薄盐'
      ],
      steps: [
        '和面：300 克面粉中加入 3 克精盐，搅拌均匀；边倒 210 克五六十度温水边搅拌，搅成絮状。',
        '揉面：将絮状面团放在案板上，用手掌搓揉，把面疙瘩搓开，直到面团不粘手（若粘手可在手上抹油再揉）。',
        '分剂醒面：将揉好的面团搓成长条，分成 3 等份的剂子，揉成光滑的面团；盘子底部抹油，放入剂子，表面喷油，套上保鲜袋，醒面至少 30 分钟。',
        '调油酥：30 克面粉中加入 40 克熟食用油，搅拌均匀，调成稀油酥。',
        '擀饼坯：醒好的剂子搓成长条，按扁，先擀宽再擀长，擀成厚薄均匀的长片；均匀抹上一层薄油酥，撒少许薄盐，将面片抻长，从一头开始卷，每卷一层都松一点，不要卷太紧，卷好后捏紧两侧，用外面的面包住，收口揉圆，再松弛 10 分钟。',
        '擀制：案板上喷少许油，将松弛好的剂子轻轻擀成薄饼，要两面擀，且力度要轻，避免擀死层次。',
        '烙制：锅提前预热喷油，放入饼坯，表面喷一层油锁住水分，盖上锅盖烙制；一面微微鼓泡后翻面，再喷少许油，继续盖盖烙制，全程用中大火，直到饼鼓泡、熟透，即可出锅。'
      ],
      tips: [
        '成品特点：成品家常大饼层次丰富，口感暄软，凉了也不硬，口感筋道。'
      ],
      douyinUrl: 'https://v.douyin.com/wMNRl3x_dn0/'
    },
    {
      code: 'A005',
      category: 'A',
      name: '蔬菜小饼',
      image: '',
      description: '蔬菜清香，早餐主食',
      ingredients: [
        '主料：西葫芦 约 500 克、胡萝卜 50 克、鸡蛋 2 颗、面粉 约 100 克（按蔬菜含水量调整）',
        '辅料：葱花、虾皮（可选）',
        '调料：精盐 约 4 克（分两次用）、十三香 0.5 克、味精 2 克、鸡汁 5 克（可选）、食用油'
      ],
      steps: [
        '处理蔬菜：将西葫芦和胡萝卜擦成细丝，放入碗中，加入约 2 克精盐，搅拌均匀，静置 3 分钟杀出水分。',
        '挤干水分：杀出水分后，将蔬菜丝用手攥干，挤去多余水分。',
        '调制面糊：在攥干的蔬菜丝中打入 2 颗鸡蛋，加入 0.5 克十三香、2 克精盐、2 克味精、5 克鸡汁（可选），搅拌均匀。',
        '添加面粉：加入约 100 克面粉，边加边搅拌，直至形成黏糊糊的面糊（面粉量可根据蔬菜含水量调整，面糊以能成团且不稀为标准）。',
        '增香提味：加入适量葱花和虾皮（可选），再次搅拌均匀。',
        '烙制小饼：平底锅提前预热，喷少许食用油，用勺子舀取适量面糊放入锅中，用铲子轻轻压成薄饼状。',
        '可选加蛋：若喜欢，可在饼中间扣一个小坑，打入一颗鸡蛋。',
        '煎制成熟：全程中小火烙制，一面煎至金黄后翻面，继续煎至另一面金黄；全程不盖盖子，避免水蒸气导致饼发粘。',
        '出锅装盘：待饼两面都煎至金黄、熟透后，即可出锅装盘。'
      ],
      tips: [
        '成品特点：成品蔬菜小饼口感暄软，凉后也不硬，自带蔬菜的清香味，搭配虾皮或鸡蛋后营养更丰富，适合作为早餐或主食，搭配粥或汤食用更佳。'
      ],
      douyinUrl: 'https://v.douyin.com/Gufb4Xiwsi4/'
    },

    /* ------------------------------ B 凉菜（待补正式菜谱） ------------------------------ */
    {
      code: 'B999',
      category: 'B',
      name: '示例',
      image: '',
      description: '占位：凉菜还没录菜谱',
      ingredients: [],
      steps: [
        '这是一条占位菜：「凉菜」这个品类还没有录入正式菜谱。',
        '等有了正式的凉菜，在 js/data.js 里加一条真正的菜（编码从 B001 开始），再把这条「示例」删掉即可。'
      ],
      tips: [],
      douyinUrl: ''
    },

    /* ------------------------------ C 热菜（待补正式菜谱） ------------------------------ */
    {
      code: 'C999',
      category: 'C',
      name: '示例',
      image: '',
      description: '占位：热菜还没录菜谱',
      ingredients: [],
      steps: [
        '这是一条占位菜：「热菜」这个品类还没有录入正式菜谱。',
        '等有了正式的热菜，在 js/data.js 里加一条真正的菜（编码从 C001 开始），再把这条「示例」删掉即可。'
      ],
      tips: [],
      douyinUrl: ''
    },

    /* ------------------------------ D 汤类（待补正式菜谱） ------------------------------ */
    {
      code: 'D999',
      category: 'D',
      name: '示例',
      image: '',
      description: '占位：汤类还没录菜谱',
      ingredients: [],
      steps: [
        '这是一条占位菜：「汤类」这个品类还没有录入正式菜谱。',
        '等有了正式的汤，在 js/data.js 里加一条真正的菜（编码从 D001 开始），再把这条「示例」删掉即可。'
      ],
      tips: [],
      douyinUrl: ''
    },

    /* ------------------------------ E 饮品（待补正式菜谱） ------------------------------ */
    {
      code: 'E999',
      category: 'E',
      name: '示例',
      image: '',
      description: '占位：饮品还没录菜谱',
      ingredients: [],
      steps: [
        '这是一条占位菜：「饮品」这个品类还没有录入正式菜谱。',
        '等有了正式的饮品，在 js/data.js 里加一条真正的菜（编码从 E001 开始），再把这条「示例」删掉即可。'
      ],
      tips: [],
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

  /** 一道菜的正文阶段：有 sections 用 sections，否则把 steps 包成一段（标题为空） */
  function sectionsOf(dish) {
    if (!dish) return [];
    if (dish.sections && dish.sections.length) {
      return dish.sections.map(function (sec) {
        return { title: sec.title || '', steps: (sec.steps || []).slice() };
      });
    }
    if (dish.steps && dish.steps.length) {
      return [{ title: '', steps: dish.steps.slice() }];
    }
    return [];
  }

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
        issues.push(tag + '：编码格式应为「分类字母 + 三位数字」，例如 A006');
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

      // 正文：sections 或 steps 至少要有一样，且不能有空的阶段
      if (dish.sections && dish.sections.length) {
        var emptySec = dish.sections.some(function (sec) {
          return !sec.steps || !sec.steps.length;
        });
        if (emptySec) issues.push(tag + '：sections 里有阶段还没有写步骤');
      } else if (!dish.steps || !dish.steps.length) {
        issues.push(tag + '：还没有菜谱正文（sections 或 steps）');
      }

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
   * 结算时间 + 编码 → 食客导出格式的一整行：
   *   「2026年05月03日21:36｜A008 B027 C001」
   * 导出页显示的那行文字、以及大厨结算后自动复制的内容，都由这里生成，保证格式只有一处。
   */
  function formatOrderText(settledAt, codes) {
    var list = sortCodes(codes);
    if (!list.length) return '';
    var stamp = formatStamp(settledAt);
    return (stamp ? stamp + '｜' : '') + list.join(' ');
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
    sectionsOf: sectionsOf,
    validate: validate,
    formatStamp: formatStamp,
    formatOrderText: formatOrderText,
    parseExportText: parseExportText,
    placeholderStyle: placeholderStyle,
    placeholderChar: placeholderChar,
    esc: esc
  };
})();
