/**
 * 《雨姐的心动时刻》详细事件数据
 * 包含所有剧情事件的对话、选项和分支
 */

// 导出所有游戏事件
export const gameEvents = {
  // ==================== 第一章：初来乍到 (Day 1) ====================
  event_arrival: {
    id: 'event_arrival',
    title: '抵达农家乐',
    scene: 'farmhouse',
    characters: ['jack'],
    cg: 'cg_arrival.jpg',
    narration: '经过长途跋涉，你终于来到了东北的这个小村庄。眼前是一座宽敞的农家院，院子里堆着柴火，空气中弥漫着炊烟的味道。',
    dialogue: [
      { character: 'jack', text: '这就是传说中的东北农家乐吗？看起来很有特色啊！', avatar: 'character_jack.png' }
    ],
    choices: [
      { id: 'choice_1_1', text: '大声喊："有人在家吗？"', effects: { affection: 2 }, next: 'event_meet_yujie' },
      { id: 'choice_1_2', text: '礼貌地敲门', effects: { affection: 1 }, next: 'event_meet_yujie' }
    ]
  },

  event_meet_yujie: {
    id: 'event_meet_yujie',
    title: '初见雨姐',
    scene: 'farmhouse',
    characters: ['jack', 'yujie'],
    cg: 'cg_meet_yujie.jpg',
    narration: '院门突然被推开，一个高大的身影出现在你面前。',
    dialogue: [
      { character: 'yujie', text: '哎呦！来客人啦？你就是网上预订的那个外国小伙吧？', avatar: 'character_yujie.png', expression: 'surprised' },
      { character: 'jack', text: '是的，我是杰克。您就是雨姐吧？久仰大名！', avatar: 'character_jack.png' },
      { character: 'yujie', text: '哈哈哈！啥久仰不久仰的，叫我雨姐就行！来来来，先进屋，外面怪冷的！', avatar: 'character_yujie.png', expression: 'happy' }
    ],
    choices: [
      { id: 'choice_2_1', text: '主动帮忙拎行李', effects: { affection: 5 }, next: 'event_meet_laokuai' },
      { id: 'choice_2_2', text: '夸赞雨姐的农家乐', effects: { affection: 3 }, next: 'event_meet_laokuai' },
      { id: 'choice_2_3', text: '问雨姐需要帮什么忙', effects: { affection: 4 }, next: 'event_meet_laokuai' }
    ]
  },

  event_meet_laokuai: {
    id: 'event_meet_laokuai',
    title: '遇见老蒯',
    scene: 'farmhouse', 
    characters: ['jack', 'yujie', 'laokuai'],
    cg: 'cg_meet_laokuai.jpg',
    narration: '进屋后，你看到一个瘦小的男人坐在炕上，手里拿着AD钙奶。',
    dialogue: [
      { character: 'laokuai', text: '雨姐，这就是那个外国客人啊？', avatar: 'character_laokuai.png', expression: 'curious' },
      { character: 'yujie', text: '对啊，这是俺老公老蒯。老蒯，这是杰克，要在咱家住一阵子。', avatar: 'character_yujie.png' },
      { character: 'laokuai', text: '哦...欢迎欢迎...', avatar: 'character_laokuai.png', expression: 'neutral' }
    ],
    choices: [
      { id: 'choice_3_1', text: '热情地和老蒯握手', effects: { affection: 2, laokuaiAlert: -5 }, next: 'event_ch1_end' },
      { id: 'choice_3_2', text: '送老蒯一瓶AD钙奶 (如果有的话)', condition: { hasItem: 'adMilk' }, effects: { affection: 1, laokuaiAlert: -10 }, next: 'event_ch1_end' },
      { id: 'choice_3_3', text: '简单点头致意', effects: { affection: 0, laokuaiAlert: 0 }, next: 'event_ch1_end' },
      { id: 'choice_3_4', text: '夸老蒯看起来很精神', effects: { affection: 1, laokuaiAlert: -2 }, next: 'event_ch1_end' }
    ]
  },

  event_ch1_end: {
    id: 'event_ch1_end',
    title: '第一天结束',
    scene: 'farmhouse',
    narration: '第一天的生活就这样结束了。躺在炕上，你回想起今天发生的一切，对未来的生活充满了期待。',
    choices: [
      { id: 'choice_ch1_end', text: '睡觉，迎接第二天', effects: { day: 1 }, next: 'event_learn_dialect' } 
    ]
  },

  // ==================== Day 2: 学习东北话 ====================
  event_learn_dialect: {
    id: 'event_learn_dialect',
    title: '学习东北话',
    scene: 'kitchen',
    narration: '第二天一早，雨姐在教你一些东北方言。',
    characters: ['yujie', 'jack'],
    dialogue: [
      { character: 'yujie', text: '杰克，你要想在这混得开，得学几句东北话！来，跟我念：“整一个！”', avatar: 'character_yujie.png' },
      { character: 'jack', text: 'Zheng Yi Ge?', avatar: 'character_jack.png' }
    ],
    choices: [
      { id: 'choice_dialect_1', text: '大声模仿：“整一个！”', effects: { affection: 5 }, next: 'event_dialect_quiz' },
      { id: 'choice_dialect_2', text: '害羞地小声说', effects: { affection: 2 }, next: 'event_dialect_quiz' }
    ]
  },

  event_dialect_quiz: {
    id: 'event_dialect_quiz',
    title: '方言测验',
    scene: 'kitchen',
    narration: '雨姐决定考考你。',
    dialogue: [
      { character: 'yujie', text: '那你知道“波棱盖儿卡秃噜皮了”是啥意思不？', avatar: 'character_yujie.png' }
    ],
    choices: [
      { id: 'choice_quiz_1', text: '膝盖摔破皮了', effects: { affection: 10 }, next: 'event_ch2_transition' },
      { id: 'choice_quiz_2', text: '头发掉光了', effects: { affection: -2 }, next: 'event_ch2_transition' },
      { id: 'choice_quiz_3', text: '盖子拧不开了', effects: { affection: -2 }, next: 'event_ch2_transition' }
    ]
  },

  event_ch2_transition: {
     id: 'event_ch2_transition',
     title: '休息',
     scene: 'farmhouse',
     narration: '学习了一上午，感觉自己更像个东北人了。',
     choices: [
       { id: 'choice_trans_2', text: '休息一晚', effects: { day: 1 }, next: 'event_goose_fight' }
     ]
  },

  // ==================== Day 3: 遭遇大鹅 ====================
  event_goose_fight: {
    id: 'event_goose_fight',
    title: '遭遇大鹅',
    scene: 'farmhouse',
    narration: '你在院子里散步，突然一只大白鹅向你冲了过来！',
    choices: [
      { id: 'choice_goose_1', text: '与大鹅决一死战', next: 'event_goose_lose' },
      { id: 'choice_goose_2', text: '赶紧逃跑', next: 'event_goose_escape' },
      { id: 'choice_goose_3', text: '喊雨姐救命', next: 'event_goose_help' }
    ]
  },

  event_goose_lose: {
    id: 'event_goose_lose',
    title: '惨败',
    scene: 'farmhouse',
    narration: '你试图抓住大鹅的脖子，结果被它狠狠啄了一口。你狼狈地逃走了。',
    dialogue: [
      { character: 'yujie', text: '哈哈哈！大鹅可是村里一霸，你可别惹它！', avatar: 'character_yujie.png' }
    ],
    choices: [{ id: 'choice_lose_next', text: '尴尬地笑笑', effects: { affection: 2 }, next: 'event_ch2_start' }]
  },

  event_goose_escape: {
    id: 'event_goose_escape',
    title: '逃跑成功',
    scene: 'farmhouse',
    narration: '你好汉不吃眼前亏，撒腿就跑。',
    choices: [{ id: 'choice_escape_next', text: '喘口气', effects: { day: 2 }, next: 'event_ch2_start' }]
  },

  event_goose_help: {
    id: 'event_goose_help',
    title: '救星降临',
    scene: 'farmhouse',
    narration: '雨姐听到呼救声，冲出来一把抓住了大鹅的脖子。',
    dialogue: [
      { character: 'yujie', text: '别怕！有姐在，这鹅伤不了你！', avatar: 'character_yujie.png' },
      { character: 'jack', text: '雨姐，你太帅了！', avatar: 'character_jack.png' }
    ],
    choices: [{ id: 'choice_help_next', text: '感激涕零', effects: { affection: 8, day: 2 }, next: 'event_ch2_start' }]
  },

  // ==================== 第二章：融入生活 (Day 5) ====================
  event_ch2_start: {
    id: 'event_ch2_start',
    title: '融入生活',
    scene: 'kitchen',
    narration: '已经在雨姐家住了几天了。这几天你努力适应这里的生活，今天决定帮雨姐分担一些农活。',
    characters: ['jack', 'yujie', 'peisi'],
    dialogue: [
      { character: 'yujie', text: '杰克啊，这几天住得还习惯不？今天俺们要干不少活，你歇着就行。', avatar: 'character_yujie.png' },
      { character: 'jack', text: '雨姐，我也想帮忙！我是来体验生活的，不是来当大爷的。', avatar: 'character_jack.png' },
      { character: 'peisi', text: '嘿，这外国小伙还挺勤快！雨姐，就让他试试呗。佩斯，点火！', avatar: 'character_peisi.png' }
    ],
    choices: [
      { id: 'choice_ch2_1', text: '帮忙劈柴', next: 'event_chop_wood' },
      { id: 'choice_ch2_2', text: '帮忙喂猪', next: 'event_feed_pigs' },
      { id: 'choice_ch2_3', text: '帮忙做饭', next: 'event_help_cooking' }
    ]
  },

  event_chop_wood: {
    id: 'event_chop_wood',
    title: '劈柴',
    scene: 'farmhouse',
    narration: '你拿起斧头，试图劈开面前的木头。这比看起来要难多了。',
    dialogue: [
      { character: 'yujie', text: '小心点！别砸着脚！哎呀，一看就没干过这活。来，姐教你！', avatar: 'character_yujie.png' },
      { character: 'jack', text: '这就来！嘿！哈！', avatar: 'character_jack.png' }
    ],
    choices: [
      { id: 'choice_chop_1', text: '努力学习，劈了一堆柴', effects: { affection: 8, laokuaiAlert: -2, addItem: 'firewood' }, next: 'event_help_neighbor' },
      { id: 'choice_chop_2', text: '不小心弄坏了斧头', effects: { affection: -2, laokuaiAlert: 5 }, next: 'event_help_neighbor' }
    ]
  },

  event_feed_pigs: {
    id: 'event_feed_pigs',
    title: '喂猪',
    scene: 'pigpen',
    narration: '你提着猪食桶来到猪圈。那几头大肥猪看到吃的，立马围了上来。',
    dialogue: [
      { character: 'yujie', text: '哈哈，这些猪跟你还挺亲！看来你挺有猪缘啊！', avatar: 'character_yujie.png' },
      { character: 'jack', text: '它们太可爱了！就像我的家人一样...呃，我是说像朋友。', avatar: 'character_jack.png' }
    ],
    choices: [
      { id: 'choice_feed_1', text: '细心地喂每一头猪', effects: { affection: 5, laokuaiAlert: 0 }, next: 'event_help_neighbor' },
      { id: 'choice_feed_2', text: '试图骑猪玩', effects: { affection: 10, laokuaiAlert: 5 }, next: 'event_help_neighbor' } 
    ]
  },

  event_help_cooking: {
    id: 'event_help_cooking',
    title: '帮忙做饭',
    scene: 'kitchen',
    narration: '你走进厨房，佩斯正在忙得热火朝天。',
    dialogue: [
      { character: 'peisi', text: '来，杰克，帮我把这酸菜切了。', avatar: 'character_peisi.png' },
      { character: 'jack', text: '没问题！看我的刀工！', avatar: 'character_jack.png' }
    ],
    choices: [
      { id: 'choice_cook_1', text: '切得整整齐齐', effects: { affection: 6, addItem: 'pickledCabbage' }, next: 'event_help_neighbor' },
      { id: 'choice_cook_2', text: '切得乱七八糟', effects: { affection: 2 }, next: 'event_help_neighbor' }
    ]
  },

  // ==================== Day 8: 帮助邻居 ====================
  event_help_neighbor: {
      id: 'event_help_neighbor',
      title: '帮助邻居',
      scene: 'farmhouse',
      effects: { day: 3 },
      narration: '几天后，隔壁翠花姐来借东西，看起来很着急。',
      dialogue: [
          { character: 'cuihua', text: '哎呀雨姐，我家那口子不在，房顶漏雨了，这可咋整啊！', avatar: 'character_cuihua.png' },
          { character: 'yujie', text: '别急！俺这就去给你修！', avatar: 'character_yujie.png' }
      ],
      choices: [
          { id: 'choice_neighbor_1', text: '我也去帮忙！', next: 'event_fix_roof' },
          { id: 'choice_neighbor_2', text: '留在家里陪老蒯聊天', next: 'event_chat_laokuai' }
      ]
  },

  event_fix_roof: {
      id: 'event_fix_roof',
      title: '修房顶',
      scene: 'farmhouse',
      narration: '你和雨姐爬上房顶，一起修补瓦片。配合十分默契。',
      dialogue: [
          { character: 'yujie', text: '行啊杰克，没看出来你还会这手艺！', avatar: 'character_yujie.png', expression: 'happy' }
      ],
      choices: [
          { id: 'choice_roof_1', text: '谦虚几句', effects: { affection: 8 }, next: 'event_ch3_start' }
      ]
  },

  event_chat_laokuai: {
      id: 'event_chat_laokuai',
      title: '陪老蒯聊天',
      scene: 'farmhouse',
      narration: '你决定留在家里，试图缓解和老蒯的关系。',
      dialogue: [
          { character: 'laokuai', text: '你这外国人，还挺懂事。', avatar: 'character_laokuai.png' }
      ],
      choices: [
          { id: 'choice_chat_lk_1', text: '聊聊家常', effects: { laokuaiAlert: -5 }, next: 'event_ch3_start' }
      ]
  },


  // ==================== 第三章：赶大集 (Day 10) ====================
  event_ch3_start: {
    id: 'event_ch3_start',
    title: '赶大集',
    scene: 'market',
    effects: { day: 2 },
    narration: '今天是镇上赶集的日子。雨姐带着你来到了热闹的集市。',
    characters: ['yujie', 'jack', 'cuihua'],
    dialogue: [
      { character: 'yujie', text: '杰克，这就是俺们东北的大集！想买啥随便挑！', avatar: 'character_yujie.png' },
      { character: 'jack', text: 'Wow! So many people! 这里的气氛太棒了！', avatar: 'character_jack.png' }
    ],
    choices: [
      { id: 'choice_ch3_1', text: '四处逛逛，买点东西', next: 'event_buy_gifts' },
      { id: 'choice_ch3_2', text: '紧跟雨姐，怕走丢', effects: { affection: 3 }, next: 'event_meet_cuihua' }
    ]
  },

  event_buy_gifts: {
    id: 'event_buy_gifts',
    title: '买礼物',
    scene: 'market',
    narration: '你看着琳琅满目的商品，想着该买点什么。',
    choices: [
      { id: 'choice_buy_1', text: '买一箱AD钙奶 (给老蒯)', effects: { money: -20, addItem: 'adMilk' }, next: 'event_meet_cuihua' },
      { id: 'choice_buy_2', text: '买一袋软枣 (给雨姐)', effects: { money: -30, addItem: 'softJujube', affection: 5 }, next: 'event_meet_cuihua' },
      { id: 'choice_buy_3', text: '什么都不买，省钱', effects: { money: 0 }, next: 'event_meet_cuihua' }
    ]
  },

  event_meet_cuihua: {
    id: 'event_meet_cuihua',
    title: '遇见翠花',
    scene: 'market',
    narration: '正逛着，迎面走来一个嗑着瓜子的邻居大姐。',
    dialogue: [
      { character: 'cuihua', text: '哎呀，这不是雨姐吗？这是你家那个外国亲戚啊？长得真...别致啊！', avatar: 'character_cuihua.png' },
      { character: 'yujie', text: '去去去，翠花你别瞎说。这是杰克，人家是国际友人！', avatar: 'character_yujie.png' },
      { character: 'jack', text: '你好，美丽女士。', avatar: 'character_jack.png' }
    ],
    choices: [
      { id: 'choice_cuihua_1', text: '夸赞翠花', effects: { affection: 0 }, next: 'event_pick_mushrooms' },
      { id: 'choice_cuihua_2', text: '帮雨姐反驳', effects: { affection: 5 }, next: 'event_pick_mushrooms' }
    ]
  },

  // ==================== Day 12: 上山采蘑菇 ====================
  event_pick_mushrooms: {
      id: 'event_pick_mushrooms',
      title: '上山采蘑菇',
      scene: 'snowfield', // 实际上是山上
      effects: { day: 2 },
      narration: '雨后，雨姐提议上山采蘑菇。',
      characters: ['yujie', 'jack'],
      dialogue: [
          { character: 'yujie', text: '这山上宝贝可多了，榛蘑、松茸都有！你可得跟紧了。', avatar: 'character_yujie.png' }
      ],
      choices: [
          { id: 'choice_mushroom_1', text: '仔细寻找', next: 'event_find_mushroom' },
          { id: 'choice_mushroom_2', text: '只顾着看雨姐', next: 'event_watch_yujie' }
      ]
  },

  event_find_mushroom: {
      id: 'event_find_mushroom',
      title: '大丰收',
      scene: 'snowfield',
      narration: '你发现了一大片榛蘑，雨姐夸你是福星。',
      choices: [
          { id: 'choice_find_1', text: '把蘑菇都给雨姐', effects: { affection: 5 }, next: 'event_ch4_start' }
      ]
  },

  event_watch_yujie: {
      id: 'event_watch_yujie',
      title: '分心',
      scene: 'snowfield',
      narration: '你不小心踩到了一个烂泥坑，雨姐把你拉了出来，两人离得很近。',
      choices: [
          { id: 'choice_watch_1', text: '脸红心跳', effects: { affection: 8 }, next: 'event_ch4_start' }
      ]
  },

  // ==================== 第四章：深入了解 (Day 15) ====================
  event_ch4_start: {
    id: 'event_ch4_start',
    title: '深入了解',
    scene: 'riverside',
    effects: { day: 3 },
    narration: '傍晚，你和雨姐在河边散步。夕阳西下，景色宜人。',
    characters: ['yujie', 'jack'],
    dialogue: [
      { character: 'yujie', text: '杰克，你为啥大老远跑来中国啊？', avatar: 'character_yujie.png' },
      { character: 'jack', text: '我想寻找一种真实的生活。在美国，一切都太快了。这里，很宁静，很真实。', avatar: 'character_jack.png' }
    ],
    choices: [
      { id: 'choice_ch4_1', text: '趁机表达对雨姐的欣赏', next: 'event_riverside_talk' },
      { id: 'choice_ch4_2', text: '采一束野花送给她', next: 'event_share_stories' }
    ]
  },

  event_riverside_talk: {
    id: 'event_riverside_talk',
    title: '河边谈心',
    scene: 'riverside',
    dialogue: [
      { character: 'jack', text: '雨姐，其实我觉得你是个很特别的女性。既坚强又温柔。', avatar: 'character_jack.png' },
      { character: 'yujie', text: '（脸红）哎呀，说这些干啥...俺就是个农村妇女。', avatar: 'character_yujie.png' }
    ],
    choices: [
      { id: 'choice_river_1', text: '握住她的手', effects: { affection: 10, laokuaiAlert: 10 }, next: 'event_laokuai_jealous' },
      { id: 'choice_river_2', text: '静静地看着她', effects: { affection: 5 }, next: 'event_laokuai_jealous' }
    ]
  },

  event_share_stories: {
    id: 'event_share_stories',
    title: '赠送野花',
    scene: 'riverside',
    narration: '你在路边采了一束野花，递给了雨姐。',
    choices: [
      { id: 'choice_flower_1', text: '送给她', effects: { affection: 15, laokuaiAlert: 5, addItem: 'flower' }, next: 'event_laokuai_jealous' }
    ]
  },

  event_laokuai_jealous: {
    id: 'event_laokuai_jealous',
    title: '老蒯的醋意',
    scene: 'farmhouse',
    narration: '回到家，老蒯正站在门口，脸色不太好看。',
    characters: ['laokuai', 'yujie', 'jack'],
    dialogue: [
      { character: 'laokuai', text: '去哪了？这么晚才回来？', avatar: 'character_laokuai.png', expression: 'angry' },
      { character: 'yujie', text: '就在河边走了走，你急啥？', avatar: 'character_yujie.png' }
    ],
    choices: [
      { id: 'choice_jealous_1', text: '解释说是去采风了', effects: { laokuaiAlert: -5 }, next: 'event_misunderstanding' },
      { id: 'choice_jealous_2', text: '拿出AD钙奶安抚老蒯', condition: { hasItem: 'adMilk' }, effects: { laokuaiAlert: -20 }, next: 'event_misunderstanding' },
      { id: 'choice_jealous_3', text: '沉默不语', effects: { laokuaiAlert: 10 }, next: 'event_misunderstanding' }
    ]
  },

  // ==================== Day 18: 误会升级 ====================
  event_misunderstanding: {
      id: 'event_misunderstanding',
      title: '误会',
      scene: 'farmhouse',
      effects: { day: 3 },
      narration: '几天后，你发现老蒯一直在偷偷观察你。',
      choices: [
          { id: 'choice_mis_1', text: '主动找老蒯谈谈', next: 'event_talk_with_laokuai' },
          { id: 'choice_mis_2', text: '避开他的目光', next: 'event_ch5_start' }
      ]
  },

  event_talk_with_laokuai: {
      id: 'event_talk_with_laokuai',
      title: '男人之间的对话',
      scene: 'farmhouse',
      dialogue: [
          { character: 'jack', text: '老蒯，我对雨姐只有尊敬。', avatar: 'character_jack.png' },
          { character: 'laokuai', text: '哼，最好是这样。俺们家雨姐心善，你可别骗她。', avatar: 'character_laokuai.png' }
      ],
      choices: [
          { id: 'choice_talk_lk_1', text: '保证', effects: { laokuaiAlert: -5 }, next: 'event_ch5_start' }
      ]
  },

  // ==================== 第五章：杀猪菜 (Day 20) ====================
  event_ch5_start: {
    id: 'event_ch5_start',
    title: '杀猪菜',
    scene: 'pigpen',
    effects: { day: 2 },
    narration: '今天要杀猪请客。这是村里的大事。',
    characters: ['yujie', 'jack', 'dabaobei'],
    dialogue: [
      { character: 'yujie', text: '大宝贝，按住猪腿！杰克，你敢不敢来帮忙？', avatar: 'character_yujie.png' },
      { character: 'jack', text: '我...我试试！为了雨姐！', avatar: 'character_jack.png' }
    ],
    choices: [
      { id: 'choice_ch5_1', text: '勇敢地上前按猪', next: 'event_kill_pig' },
      { id: 'choice_ch5_2', text: '躲在一边看', effects: { affection: -5 }, next: 'event_big_feast' }
    ]
  },

  event_kill_pig: {
    id: 'event_kill_pig',
    title: '按猪',
    scene: 'pigpen',
    narration: '场面十分混乱，但你表现得很英勇。雨姐对你刮目相看。',
    choices: [
      { id: 'choice_kill_1', text: '扛起半扇猪肉展示力量', effects: { affection: 20, addItem: 'pork' }, next: 'event_carry_pork' }
    ]
  },

  event_carry_pork: {
    id: 'event_carry_pork',
    title: '扛猪肉',
    scene: 'farmhouse',
    narration: '你模仿雨姐的动作，扛起了半扇猪肉。虽然很重，但你咬牙坚持住了。',
    dialogue: [
      { character: 'yujie', text: '好样的小伙子！有俺当年的风范！', avatar: 'character_yujie.png', expression: 'happy' }
    ],
    choices: [
      { id: 'choice_carry_1', text: '嘿嘿一笑', next: 'event_big_feast' }
    ]
  },

  event_big_feast: {
    id: 'event_big_feast',
    title: '杀猪菜大宴',
    scene: 'kitchen',
    narration: '晚上，大家围坐在一起吃杀猪菜。热气腾腾的酸菜白肉，香气扑鼻。',
    choices: [
      { id: 'choice_feast_1', text: '给雨姐夹菜', effects: { affection: 5 }, next: 'event_yangge_dance' },
      { id: 'choice_feast_2', text: '给老蒯夹菜', effects: { laokuaiAlert: -10 }, next: 'event_yangge_dance' }
    ]
  },

  // ==================== Day 22: 扭秧歌大赛 ====================
  event_yangge_dance: {
      id: 'event_yangge_dance',
      title: '扭秧歌',
      scene: 'farmhouse',
      effects: { day: 2 },
      narration: '吃完饭，村里组织扭秧歌。锣鼓喧天，非常热闹。',
      characters: ['yujie', 'jack'],
      dialogue: [
          { character: 'yujie', text: '来来来，杰克，扭起来！', avatar: 'character_yujie.png' }
      ],
      choices: [
          { id: 'choice_dance_1', text: '展示你的街舞功底', effects: { affection: 5 }, next: 'event_dance_success' },
          { id: 'choice_dance_2', text: '笨拙地模仿秧歌', effects: { affection: 8 }, next: 'event_ch6_start' }
      ]
  },

  event_dance_success: {
      id: 'event_dance_success',
      title: '中西合璧',
      scene: 'farmhouse',
      narration: '你的街舞配上唢呐，竟然出奇地和谐，赢得了满堂喝彩。',
      choices: [
          { id: 'choice_dance_success', text: '向雨姐致意', next: 'event_ch6_start' }
      ]
  },

  // ==================== 第六章：冬日情愫 (Day 25) ====================
  event_ch6_start: {
    id: 'event_ch6_start',
    title: '冬日情愫',
    scene: 'snowfield',
    effects: { day: 3 },
    narration: '外面下起了大雪。整个世界变成了白色。雨姐在院子里扫雪。',
    characters: ['yujie', 'jack'],
    choices: [
      { id: 'choice_ch6_1', text: '陪她一起打雪仗', next: 'event_snow_play' },
      { id: 'choice_ch6_2', text: '邀请她去散步', next: 'event_confession_chance' }
    ]
  },

  event_snow_play: {
    id: 'event_snow_play',
    title: '雪地玩耍',
    scene: 'snowfield',
    narration: '你们像孩子一样在雪地里追逐打闹。笑声回荡在空旷的雪原上。',
    dialogue: [
      { character: 'yujie', text: '哈哈！看招！', avatar: 'character_yujie.png' },
      { character: 'jack', text: '哎呀！雨姐你力气太大了！', avatar: 'character_jack.png' }
    ],
    choices: [
      { id: 'choice_snow_1', text: '故意摔倒让她扶', effects: { affection: 10 }, next: 'event_farewell_gift' }
    ]
  },

  event_confession_chance: {
    id: 'event_confession_chance',
    title: '表白的机会',
    scene: 'snowfield',
    narration: '雪停了。你们并肩走在雪地上，气氛非常浪漫。',
    dialogue: [
      { character: 'jack', text: '雨姐，我有话想对你说...', avatar: 'character_jack.png' }
    ],
    choices: [
      { id: 'choice_confess_1', text: '欲言又止', next: 'event_farewell_gift' },
      { id: 'choice_confess_2', text: '大胆说出心里话', effects: { affection: 15, laokuaiAlert: 20 }, next: 'event_farewell_gift' }
    ]
  },

  // ==================== Day 28: 离别前的礼物 ====================
  event_farewell_gift: {
      id: 'event_farewell_gift',
      title: '离别前的礼物',
      scene: 'farmhouse',
      effects: { day: 3 },
      narration: '离别的日子快到了，你决定给雨姐留下一份特别的礼物。',
      choices: [
          { id: 'choice_gift_1', text: '亲手做一个相册', next: 'event_gift_photo' },
          { id: 'choice_gift_2', text: '为她做一顿西餐', next: 'event_gift_meal' }
      ]
  },

  event_gift_photo: {
      id: 'event_gift_photo',
      title: '珍贵回忆',
      scene: 'farmhouse',
      narration: '雨姐看着相册里的点点滴滴，眼眶湿润了。',
      effects: { affection: 10 },
      choices: [
          { id: 'choice_photo_next', text: '准备离开', next: 'event_decision_time' }
      ]
  },

  event_gift_meal: {
      id: 'event_gift_meal',
      title: '最后的晚餐',
      scene: 'kitchen',
      narration: '虽然你的手艺一般，但这份心意让大家都很难忘。',
      effects: { affection: 5, laokuaiAlert: -5 },
      choices: [
          { id: 'choice_meal_next', text: '准备离开', next: 'event_decision_time' }
      ]
  },

  event_decision_time: {
    id: 'event_decision_time',
    title: '抉择时刻',
    scene: 'farmhouse',
    effects: { day: 2 },
    narration: '回到房间，你知道离别的日子快到了。或者是...不需要离别？',
    choices: [
      { id: 'choice_ch6_end', text: '迎接最终的审判', next: 'event_ch7_start' }
    ]
  },

  // ==================== 第七章：最终抉择 (Day 30) ====================
  event_ch7_start: {
    id: 'event_ch7_start',
    title: '最终抉择',
    scene: 'farmhouse',
    narration: '第30天。是你计划离开的日子，也是你做出决定的日子。大家都在院子里送你。',
    characters: ['yujie', 'laokuai', 'jack'],
    dialogue: [
      { character: 'yujie', text: '杰克，你真的要走了吗？', avatar: 'character_yujie.png', expression: 'sad' },
      { character: 'laokuai', text: '咳咳...那个，一路顺风啊。', avatar: 'character_laokuai.png' }
    ],
    choices: [
      // 分支1：真爱结局 (高好感，低警觉)
      { 
        id: 'choice_true_ending', 
        text: '【真爱】我不走了！雨姐，我爱你！(需:好感≥90, 警觉≤30)', 
        condition: { minAffection: 90, maxAlert: 30 },
        next: 'trueEnding' 
      },
      // 分支2：隐藏结局 (超高好感，超低警觉，全物品，40天)
      { 
        id: 'choice_secret_ending', 
        text: '【隐藏】雨姐、老蒯...我们三个人一起过吧！(需:好感≥95, 警觉≤20, 全物品)', 
        condition: { minAffection: 95, maxAlert: 20, hasAllItems: true },
        effects: { day: 10 }, // 延长到40天
        next: 'secretEnding' 
      },
      // 分支3：好友结局 (中等好感)
      { 
        id: 'choice_good_ending', 
        text: '【好友】我会常回来看你们的，我的朋友们。(需:好感≥60)', 
        condition: { minAffection: 60 },
        next: 'goodEnding' 
      },
      // 分支4：平淡结局 (无门槛)
      { 
        id: 'choice_normal_ending', 
        text: '【离开】再见了，感谢这段时间的照顾。', 
        next: 'normalEnding' 
      },
      // 分支5：如果警觉度太高，可能会强制触发坏结局，这里作为一个选项展示
      {
         id: 'choice_bad_ending',
         text: '【冲突】老蒯，你为什么一直针对我？(危险)',
         effects: { laokuaiAlert: 20 }, // 增加警觉度触发坏结局
         next: 'badEnding'
      }
    ]
  }
}

export default gameEvents
