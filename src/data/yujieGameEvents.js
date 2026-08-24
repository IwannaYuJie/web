/**
 * 《雨姐的心动时刻》重制版 - 剧情事件数据
 *
 * 事件通用字段：
 *   scene            场景id（决定背景）
 *   cg               可选，大图（覆盖场景背景）
 *   specialSchedule  可选布尔值，标识第12天等特殊日程主事件
 *   narration        旁白（无对话时直接展示）
 *   dialogue         [{ character, text, expression?, pose? }]
 *                    expression: 情绪键 (happy, angry, surprised, gentle, shy, proud, wronged, serious, embarrassed, gossip, laugh)
 *                    pose: 动作姿态键 (yujie: cooking/carrying, jack: working, laokuai: drinking, cuihua: livestream, peisi: bellows, goose: charge)
 *   choices          [{ id, text, effects, next, condition, lockedHint, advanceRoute, goose }]
 *
 * 选项效果 effects 字段：
 *   affection / laokuaiAlert / money / ap / addItem / removeItem / setFlag / goose
 *
 * 选项条件 condition 字段：
 *   minAffection / maxAffection / minAlert / maxAlert / hasItem / minMoney
 *   flag / notFlag / flagsAll / minGooseCount / routeCompleted / routesCompleted
 *
 * 选项提示 lockedHint 字段：
 *   当 condition 未满足时向玩家展示的引导说明文本（如道具缺失、金钱不足、前置支线未完成等）
 *
 * next 特殊值：'HUB' 回自由行动地图，'NIGHT' 直接入夜，结局id 触发结局
 */

export const gameEvents = {
  // ==================== 序章：第1天 ====================
  pro_arrive: {
    id: 'pro_arrive',
    title: '抵达农家乐',
    scene: 'yard',
    narration:
      '坐了二十多个小时的火车加拖拉机，你终于站在了这个东北小村庄的入口。【玩法：❤️好感度决定雨姐对你的心意；👀警觉度是老蒯对你的提防——涨到45他就要轰人了，记得常去堂屋陪他喝AD钙奶。】',
    dialogue: [
      {
        character: 'jack',
        text: 'Hello？有人吗？这就是网上订的"雨姐农家乐"？院子里那只鹅为什么一直瞪我？',
        expression: 'happy'
      }
    ],
    choices: [
      {
        id: 'pro_1_1',
        text: '中气十足地喊："有人在家吗——！"',
        effects: { affection: 2 },
        next: 'pro_meet_yujie'
      },
      {
        id: 'pro_1_2',
        text: '礼貌地敲敲院门',
        effects: { affection: 1 },
        next: 'pro_meet_yujie'
      },
      {
        id: 'pro_1_3',
        text: '先跟门口的大鹅打个招呼',
        effects: { goose: 1 },
        next: 'pro_meet_yujie'
      }
    ]
  },

  pro_meet_yujie: {
    id: 'pro_meet_yujie',
    title: '初见雨姐',
    scene: 'yard',
    cg: 'yujie/cg_carry_pork_v2.png',
    narration: '话音未落，后院传来"嗬——！"一声大喝。一个高大的身影扛着半扇猪，健步如飞地从你面前掠过。',
    dialogue: [
      {
        character: 'yujie',
        text: '让让让让！猪要进仓房了！——哟，你就是那个外国客人杰克吧？',
        expression: 'surprised'
      },
      {
        character: 'jack',
        text: '是、是的……您一只手就……那可是半扇猪啊？！',
        expression: 'embarrassed'
      },
      {
        character: 'yujie',
        text: '嗨，这算啥！俺雨姐扛猪的时候，你还在啃汉堡呢！哈哈哈哈！',
        expression: 'laugh'
      }
    ],
    choices: [
      {
        id: 'pro_2_1',
        text: '冲上去帮忙搭手："姐，我来抬后面！"',
        effects: { affection: 8 },
        next: 'pro_meet_laokuai'
      },
      {
        id: 'pro_2_2',
        text: '看呆了："这也太帅了……"',
        effects: { affection: 5 },
        next: 'pro_meet_laokuai'
      }
    ]
  },

  pro_meet_laokuai: {
    id: 'pro_meet_laokuai',
    title: '炕上的男人',
    scene: 'hall',
    narration: '进了堂屋，热炕上盘腿坐着一个瘦小的男人，手里捧着一瓶AD钙奶，正用一种审视的目光打量你。',
    dialogue: [
      { character: 'laokuai', text: '这就是那个外国客人？要在咱家住十三天？', expression: 'angry' },
      {
        character: 'yujie',
        text: '对，杰克。这是俺家老蒯。老蒯，别老绷个脸，吓着客人。',
        expression: 'gentle'
      },
      { character: 'laokuai', text: '哼……（吸了一口AD钙奶）住可以，规矩得讲。', expression: 'proud', pose: 'drinking' }
    ],
    choices: [
      {
        id: 'pro_3_1',
        text: '热情地握住老蒯的手："哥！以后多关照！"',
        effects: { affection: 2, laokuaiAlert: -3 },
        next: 'pro_peisi_fire'
      },
      {
        id: 'pro_3_2',
        text: '老实点头："我一定守规矩。"',
        effects: { laokuaiAlert: -1 },
        next: 'pro_peisi_fire'
      },
      {
        id: 'pro_3_3',
        text: '盯着他的AD钙奶："这个……好喝吗？"',
        effects: { laokuaiAlert: 5 },
        next: 'pro_peisi_fire'
      }
    ]
  },

  pro_peisi_fire: {
    id: 'pro_peisi_fire',
    title: '佩斯，点火！',
    scene: 'kitchen',
    narration: '傍晚，厨房里热气升腾。一个精瘦的汉子正在灶台前待命，仿佛在等待一个神圣的指令。',
    dialogue: [
      { character: 'yujie', text: '佩斯——！点火——！', expression: 'serious', pose: 'cooking' },
      { character: 'peisi', text: '得嘞！！（咔嚓一声，灶膛里火光冲天）', expression: 'happy', pose: 'bellows' },
      { character: 'jack', text: 'Wow……这就是传说中的"佩斯点火"！比视频里还震撼！', expression: 'happy' },
      { character: 'peisi', text: '嘿嘿，洋兄弟有眼光！一会儿酸菜白肉，管够造！', expression: 'happy' }
    ],
    choices: [
      {
        id: 'pro_4_1',
        text: '抢着帮忙烧火："佩斯哥，风箱我来拉！"',
        effects: { affection: 4 },
        next: 'pro_night'
      },
      {
        id: 'pro_4_2',
        text: '干饭人本色：连造三碗，夸得停不下来',
        effects: { affection: 4 },
        next: 'pro_night'
      }
    ]
  },

  pro_night: {
    id: 'pro_night',
    title: '第一夜',
    scene: 'hall',
    narration:
      '躺在热乎乎的炕上，你掰着手指头盘算：一共十三天。明天起每天有2点行动点，可以去【大厨房】【猪圈】【大集】【河边】【堂屋】【后山】自由行动。想得到好结局，就得想清楚把时间花在谁身上……',
    choices: [{ id: 'pro_5_1', text: '睡觉，明天开始行动！', next: 'NIGHT' }]
  },

  // ==================== 支线一：大厨房（佩斯） ====================
  route_kitchen_1: {
    id: 'route_kitchen_1',
    title: '帮厨初体验',
    scene: 'kitchen',
    narration: '你系上围裙钻进厨房，佩斯正在和一口大黑锅搏斗。',
    dialogue: [
      {
        character: 'peisi',
        text: '哟，洋兄弟来帮忙？那敢情好！先从烧火开始——佩斯，点火！哦不对，今天你来点。',
        expression: 'happy',
        pose: 'bellows'
      },
      { character: 'jack', text: '我点？……咳咳咳！烟往哪边拐啊这个！', expression: 'embarrassed', pose: 'working' }
    ],
    choices: [
      {
        id: 'kit_1_1',
        text: '不服输，跟灶膛死磕到底',
        effects: { affection: 5, money: 20 },
        advanceRoute: 'kitchen',
        next: 'HUB'
      },
      {
        id: 'kit_1_2',
        text: '换赛道：主动包揽洗菜切墩',
        effects: { affection: 6, money: 20 },
        advanceRoute: 'kitchen',
        next: 'HUB'
      }
    ]
  },

  route_kitchen_2: {
    id: 'route_kitchen_2',
    title: '酸菜修行',
    scene: 'kitchen',
    narration: '雨姐抱来一颗比你脑袋还大的酸菜："今天学切酸菜。切好了晚上包饺子。"',
    dialogue: [
      { character: 'yujie', text: '刀要斜着走，丝要切得匀。看好了——唰唰唰！学会没？', expression: 'serious', pose: 'cooking' },
      { character: 'jack', text: '（这刀工，米其林大厨看了都得喊姐）', expression: 'serious', pose: 'working' }
    ],
    choices: [
      {
        id: 'kit_2_1',
        text: '认真展示学习成果，切得有模有样',
        effects: { affection: 8, money: 25, addItem: 'pickledCabbage' },
        advanceRoute: 'kitchen',
        next: 'HUB'
      },
      {
        id: 'kit_2_2',
        text: '边切边偷吃："这酸菜，绝了！"',
        effects: { affection: 5, money: 25 },
        advanceRoute: 'kitchen',
        next: 'HUB'
      }
    ]
  },

  route_kitchen_3: {
    id: 'route_kitchen_3',
    title: '独当一面',
    scene: 'kitchen',
    cg: 'yujie/cg_cooking_v2.png',
    narration: '出师考核日。雨姐和佩斯抱着胳膊站在旁边，今天这顿饭，归你掌勺。',
    dialogue: [
      { character: 'peisi', text: '洋兄弟，整一个！', expression: 'happy' },
      { character: 'yujie', text: '别紧张，大不了就当喂猪了，咱家猪不挑。', expression: 'laugh' }
    ],
    choices: [
      {
        id: 'kit_3_1',
        text: '亮绝活：中西合璧"黑椒酸菜炖排骨"',
        effects: { affection: 10, money: 30, setFlag: 'chef' },
        advanceRoute: 'kitchen',
        next: 'HUB'
      },
      {
        id: 'kit_3_2',
        text: '稳扎稳打，复刻雨姐的家常菜',
        effects: { affection: 10, money: 30 },
        advanceRoute: 'kitchen',
        next: 'HUB'
      }
    ]
  },

  route_kitchen_repeat: {
    id: 'route_kitchen_repeat',
    title: '帮厨打工',
    scene: 'kitchen',
    narration: '厨房永远缺人手。你熟练地烧火、切墩、刷锅，佩斯给你递了根黄瓜："兄弟，讲究！"',
    choices: [{ id: 'kit_r_1', text: '收工钱（+15元）', effects: { money: 15 }, next: 'HUB' }]
  },

  // ==================== 支线二：猪圈 ====================
  route_pigpen_1: {
    id: 'route_pigpen_1',
    title: '喂猪初体验',
    scene: 'pigpen',
    narration: '你提着猪食桶挪进猪圈，四头大肥猪呼啦一下围了上来，眼神比看见亲爹还亲。',
    dialogue: [
      { character: 'yujie', text: '哈哈哈哈！这些猪跟你挺有缘啊！', expression: 'laugh' },
      { character: 'jack', text: '它们好热情……等等，别拱我裤子！', expression: 'embarrassed', pose: 'working' }
    ],
    choices: [
      {
        id: 'pig_1_1',
        text: '耐心喂好每一头，还顺手刷了食槽',
        effects: { affection: 8 },
        advanceRoute: 'pigpen',
        next: 'HUB'
      },
      {
        id: 'pig_1_2',
        text: '边喂边给猪讲美国的故事',
        effects: { affection: 6, laokuaiAlert: 2 },
        advanceRoute: 'pigpen',
        next: 'HUB'
      }
    ]
  },

  route_pigpen_2: {
    id: 'route_pigpen_2',
    title: '起名仪式',
    scene: 'pigpen',
    narration: '雨姐说最大的那头猪该有个名字了，这个光荣的任务交给了你。院墙外，村霸大鹅正探头探脑。',
    dialogue: [{ character: 'yujie', text: '起名可是技术活，起好了猪都长得快！', expression: 'serious' }],
    choices: [
      {
        id: 'pig_2_1',
        text: '叫它"红烧肉"——寄托全村人的厚望',
        effects: { affection: 10 },
        advanceRoute: 'pigpen',
        next: 'HUB'
      },
      {
        id: 'pig_2_2',
        text: '叫它"杰克二世"',
        effects: { affection: 6 },
        advanceRoute: 'pigpen',
        next: 'HUB'
      },
      {
        id: 'pig_2_3',
        text: '不理猪了，去逗逗墙头那只大鹅',
        effects: { affection: 4, goose: 1 },
        advanceRoute: 'pigpen',
        next: 'HUB'
      }
    ]
  },

  route_pigpen_3: {
    id: 'route_pigpen_3',
    title: '扛半扇猪',
    scene: 'pigpen',
    narration: '"红烧肉"出栏的日子。雨姐正要把半扇猪扛去仓房，全村的目光（含一只鹅）都聚了过来。',
    dialogue: [
      { character: 'yujie', text: '这半扇少说得有一百五十斤，都看好了啊——', expression: 'serious', pose: 'carrying' },
      { character: 'jack', text: '（深呼吸）雨姐！今天让我来！', expression: 'serious', pose: 'working' }
    ],
    choices: [
      {
        id: 'pig_3_1',
        text: '怒吼一声，扛起半扇猪走完整个院子！',
        effects: { affection: 20, addItem: 'pork' },
        advanceRoute: 'pigpen',
        next: 'HUB'
      },
      {
        id: 'pig_3_2',
        text: '和雨姐一人一头，抬着走',
        effects: { affection: 12 },
        advanceRoute: 'pigpen',
        next: 'HUB'
      },
      {
        id: 'pig_3_3',
        text: '在旁边负责喊号和鼓掌',
        effects: { affection: 4 },
        advanceRoute: 'pigpen',
        next: 'HUB'
      }
    ]
  },

  // ==================== 支线三：村口大集（翠花） ====================
  route_market_1: {
    id: 'route_market_1',
    title: '砍价学徒',
    scene: 'market',
    narration: '翠花姐拉着你逛大集，现场教学东北砍价绝学。',
    dialogue: [
      {
        character: 'cuihua',
        text: '看好喽——"这白菜咋卖？""五毛。""五分卖不卖？！"……学会没？气势！主要是气势！',
        expression: 'happy',
        pose: 'livestream'
      },
      { character: 'jack', text: '这……这不是砍价，这是砍人啊。', expression: 'embarrassed' }
    ],
    choices: [
      {
        id: 'mkt_1_1',
        text: '现学现卖，用英语砍价把摊主整不会了',
        effects: { affection: 3, money: 10 },
        advanceRoute: 'market',
        next: 'HUB'
      },
      {
        id: 'mkt_1_2',
        text: '帮翠花姐拎包当助理',
        effects: { affection: 3 },
        advanceRoute: 'market',
        next: 'HUB'
      }
    ]
  },

  route_market_2: {
    id: 'route_market_2',
    title: '村口情报站',
    scene: 'market',
    narration: '嗑着瓜子的翠花姐神秘兮兮地凑过来："想知道雨姐稀罕啥不？姐这情报，瓜子换。"',
    dialogue: [
      {
        character: 'cuihua',
        text: '雨姐啊，嘴上说不在乎，其实最稀罕后山的软枣，还有……别人把她当女人看，不是当劳力看。',
        expression: 'gossip'
      },
      { character: 'jack', text: '（重要情报！记小本本）', expression: 'serious' }
    ],
    choices: [
      {
        id: 'mkt_2_1',
        text: '虚心求教，再买点瓜子孝敬情报站',
        effects: { affection: 5, money: -5, setFlag: 'knowsTaste' },
        advanceRoute: 'market',
        next: 'HUB'
      },
      {
        id: 'mkt_2_2',
        text: '听完就跑：情报到手，瓜子不买了',
        effects: { setFlag: 'knowsTaste' },
        advanceRoute: 'market',
        next: 'HUB'
      }
    ]
  },

  route_market_3: {
    id: 'route_market_3',
    title: '翠花的直播间',
    scene: 'market',
    cg: 'yujie/cg_live_v2.png',
    narration: '集市角落，翠花姐正对着手机喊麦："家人们！这瓜子，老香了！三二一，上链接！"',
    dialogue: [
      {
        character: 'cuihua',
        text: '看见没，这就叫直播带货！姐一场能卖八十包瓜子！你们美国有这个不？',
        expression: 'happy'
      },
      { character: 'jack', text: '有是有……但绝对没有您这个气势。', expression: 'happy' }
    ],
    choices: [
      {
        id: 'mkt_3_1',
        text: '认真跟翠花姐学直播技巧',
        effects: { affection: 3, setFlag: 'liveSkill' },
        advanceRoute: 'market',
        next: 'HUB'
      },
      {
        id: 'mkt_3_2',
        text: '帮翠花姐把货扛回家',
        effects: { affection: 5 },
        advanceRoute: 'market',
        next: 'HUB'
      }
    ]
  },

  // ==================== 支线四：小河边（心动主线） ====================
  route_riverside_1: {
    id: 'route_riverside_1',
    title: '河边谈心',
    scene: 'riverside',
    narration: '傍晚，你"偶遇"了在河边遛弯的雨姐。夕阳把她的影子拉得老长。',
    dialogue: [
      { character: 'yujie', text: '杰克，你说你们美国，也有这样的河不？', expression: 'gentle' },
      { character: 'jack', text: '有河，但没有……扛着半扇猪在河边走的人。', expression: 'happy' },
      { character: 'yujie', text: '哈哈哈哈！你这张嘴啊！', expression: 'laugh' }
    ],
    choices: [
      {
        id: 'riv_1_1',
        text: '认真说："我来这里，就是想找这种真实的生活。"',
        effects: { affection: 10, laokuaiAlert: 8 },
        advanceRoute: 'riverside',
        next: 'HUB'
      },
      {
        id: 'riv_1_2',
        text: '讲美国老家的糗事逗她开心',
        effects: { affection: 8 },
        advanceRoute: 'riverside',
        next: 'HUB'
      }
    ]
  },

  route_riverside_2: {
    id: 'route_riverside_2',
    title: '心意',
    scene: 'riverside',
    narration: '又是河边。雨姐今天好像特意……把围裙换成了干净的。你摸了摸口袋。',
    dialogue: [{ character: 'yujie', text: '今儿个咋有空陪俺遛弯？不用帮厨啦？', expression: 'gentle' }],
    choices: [
      {
        id: 'riv_2_1',
        text: '献上后山采的野花（需：野花）',
        condition: { hasItem: 'flower' },
        lockedHint: '需要道具：野花（后山采摘）',
        effects: { affection: 15, laokuaiAlert: 12, removeItem: 'flower' },
        advanceRoute: 'riverside',
        next: 'HUB'
      },
      {
        id: 'riv_2_2',
        text: '掏出她最爱的软枣（需：软枣+情报）',
        condition: { hasItem: 'softJujube', flag: 'knowsTaste' },
        lockedHint: '需要道具：软枣，并了解雨姐喜好',
        effects: { affection: 18, laokuaiAlert: 10, removeItem: 'softJujube' },
        advanceRoute: 'riverside',
        next: 'HUB'
      },
      {
        id: 'riv_2_3',
        text: '啥也没带，给她唱了一首英文情歌',
        effects: { affection: 8, laokuaiAlert: 8 },
        advanceRoute: 'riverside',
        next: 'HUB'
      }
    ]
  },

  route_riverside_3: {
    id: 'route_riverside_3',
    title: '心动时刻',
    scene: 'riverside',
    narration: '河水哗哗地流。你们并排坐着，肩膀只差一拳的距离。谁都没说话，心跳声比河水还响。',
    dialogue: [
      {
        character: 'yujie',
        text: '（望着河面，小声）杰克，你说……十三天咋过得这么快呢。',
        expression: 'shy'
      }
    ],
    choices: [
      {
        id: 'riv_3_1',
        text: '牵起她的手："因为每一天都很开心。"',
        effects: { affection: 20, laokuaiAlert: 22 },
        advanceRoute: 'riverside',
        next: 'HUB'
      },
      {
        id: 'riv_3_2',
        text: '把军大衣披在她肩上（需：军大衣）',
        condition: { hasItem: 'militaryCoat' },
        lockedHint: '需要道具：军大衣（集市购买）',
        effects: { affection: 25, laokuaiAlert: 10, removeItem: 'militaryCoat' },
        advanceRoute: 'riverside',
        next: 'HUB'
      },
      {
        id: 'riv_3_3',
        text: '把心事咽回去，默默陪她坐到天黑',
        effects: { affection: 10, laokuaiAlert: 5 },
        advanceRoute: 'riverside',
        next: 'HUB'
      }
    ]
  },

  // ==================== 支线五：堂屋热炕（老蒯） ====================
  route_laokuai_1: {
    id: 'route_laokuai_1',
    title: 'AD钙奶外交',
    scene: 'hall',
    narration: '你端着瓜子凑上热炕。老蒯往旁边挪了挪，算是给你腾了个位。',
    dialogue: [{ character: 'laokuai', text: '（吸溜）坐吧。炕热乎。', expression: 'proud', pose: 'drinking' }],
    choices: [
      {
        id: 'lao_1_1',
        text: '陪他喝AD钙奶唠嗑，从国际形势唠到猪的行情',
        effects: { laokuaiAlert: -8 },
        advanceRoute: 'laokuai',
        next: 'HUB'
      },
      {
        id: 'lao_1_2',
        text: '献上整排AD钙奶（需：AD钙奶）',
        condition: { hasItem: 'adMilk' },
        lockedHint: '需要道具：整排AD钙奶（集市购买）',
        effects: { laokuaiAlert: -15, removeItem: 'adMilk' },
        advanceRoute: 'laokuai',
        next: 'HUB'
      },
      {
        id: 'lao_1_3',
        text: '夸他："哥，你今天的气质，绝了。"',
        effects: { laokuaiAlert: -5 },
        advanceRoute: 'laokuai',
        next: 'HUB'
      }
    ]
  },

  route_laokuai_2: {
    id: 'route_laokuai_2',
    title: '男人之间的对话',
    scene: 'hall',
    narration: '雨姐出门进货了。屋里就剩你和老蒯，他盯着你看了半天，终于开口。',
    dialogue: [
      { character: 'laokuai', text: '俺问你句话，你实说。你天天围着雨姐转悠，图啥？', expression: 'angry' },
      { character: 'jack', text: '（来了，灵魂拷问）', expression: 'embarrassed' }
    ],
    choices: [
      {
        id: 'lao_2_1',
        text: '"雨姐是我见过最了不起的人，我尊敬她。"',
        effects: { laokuaiAlert: -10, affection: 3 },
        advanceRoute: 'laokuai',
        next: 'HUB'
      },
      {
        id: 'lao_2_2',
        text: '"哥，说实话，我挺羡慕你的。"',
        effects: { laokuaiAlert: -12 },
        advanceRoute: 'laokuai',
        next: 'HUB'
      },
      {
        id: 'lao_2_3',
        text: '岔开话题："哥，再给讲讲你年轻那会儿呗？"',
        effects: { laokuaiAlert: -6 },
        advanceRoute: 'laokuai',
        next: 'HUB'
      }
    ]
  },

  route_laokuai_3: {
    id: 'route_laokuai_3',
    title: '结拜',
    scene: 'hall',
    narration: '连喝了几天AD钙奶，老蒯看你的眼神彻底变了。今天他郑重地搬出一整箱AD钙奶，摆在炕桌正中。',
    dialogue: [
      { character: 'laokuai', text: '杰克，俺寻思好了。你这人，行！俺要跟你结拜！', expression: 'proud', pose: 'drinking' },
      { character: 'yujie', text: '（门外探头）啥玩意儿？？', expression: 'surprised' }
    ],
    choices: [
      {
        id: 'lao_3_1',
        text: '"苍天在上，AD钙奶为证！大哥！"',
        effects: { laokuaiAlert: -25, setFlag: 'brother' },
        advanceRoute: 'laokuai',
        next: 'HUB'
      },
      {
        id: 'lao_3_2',
        text: '"结拜就免了，做兄弟，在心中。"',
        effects: { laokuaiAlert: -15 },
        advanceRoute: 'laokuai',
        next: 'HUB'
      }
    ]
  },

  // ==================== 支线六：后山 ====================
  route_mountain_1: {
    id: 'route_mountain_1',
    title: '上山寻宝',
    scene: 'mountain',
    narration: '雨后的后山遍地是宝。雨姐给你指了指："榛蘑在树墩子底下，野花在坡那边。"',
    dialogue: [
      {
        character: 'yujie',
        text: '跟紧了，别乱跑——这山上可是有"那位爷"的地盘。（朝鹅鸣的方向努了努嘴）',
        expression: 'serious'
      }
    ],
    choices: [
      {
        id: 'mtn_1_1',
        text: '仔细采了一大捧榛蘑',
        effects: { affection: 5, addItem: 'mushroom' },
        advanceRoute: 'mountain',
        next: 'HUB'
      },
      {
        id: 'mtn_1_2',
        text: '悄悄采了一束带着露水的野花',
        effects: { affection: 8, laokuaiAlert: 3, addItem: 'flower' },
        advanceRoute: 'mountain',
        next: 'HUB'
      }
    ]
  },

  route_mountain_2: {
    id: 'route_mountain_2',
    title: '软枣熟了',
    scene: 'mountain',
    narration: '半山腰的软枣树挂满了果子，紫莹莹的，看着就甜。',
    dialogue: [
      { character: 'yujie', text: '俺小时候天天爬这棵树。那时候俺可比你利索多了！', expression: 'gentle' }
    ],
    choices: [
      {
        id: 'mtn_2_1',
        text: '稳稳当当摘了一兜软枣',
        effects: { affection: 5, addItem: 'softJujube' },
        advanceRoute: 'mountain',
        next: 'HUB'
      },
      {
        id: 'mtn_2_2',
        text: '非要够最高的那一枝——然后从树上掉了下来',
        effects: { affection: 8, laokuaiAlert: 5, addItem: 'softJujube' },
        advanceRoute: 'mountain',
        next: 'HUB'
      }
    ]
  },

  route_mountain_3: {
    id: 'route_mountain_3',
    title: '大鹅的老巢',
    scene: 'mountain',
    cg: 'yujie/cg_goose_nest_v2.png',
    narration: '你在密林深处发现了村霸大鹅的老巢：窝里赫然躺着几颗大鹅蛋！远处传来不祥的"嘎——"声。',
    dialogue: [
      {
        character: 'jack',
        text: '（冷静，杰克，冷静。蛋就在眼前，鹅在五十米外，你百米十二秒……大概）',
        expression: 'serious'
      }
    ],
    choices: [
      {
        id: 'mtn_3_1',
        text: '富贵险中求：摸走一颗鹅蛋！',
        effects: { goose: 1, addItem: 'gooseEgg' },
        advanceRoute: 'mountain',
        next: 'HUB'
      },
      {
        id: 'mtn_3_2',
        text: '对着鹅巢深深鞠了一躬，以示对鹅王的敬意',
        effects: { goose: 1 },
        advanceRoute: 'mountain',
        next: 'HUB'
      },
      {
        id: 'mtn_3_3',
        text: '悄悄撤退，就当没看见',
        effects: {},
        advanceRoute: 'mountain',
        next: 'HUB'
      }
    ]
  },

  // ==================== 日期事件：第3天 大鹅突袭 ====================
  ev_goose_attack: {
    id: 'ev_goose_attack',
    title: '村霸驾到',
    scene: 'yard',
    cg: 'yujie/cg_goose_attack_v2.png',
    narration: '第三天清晨，你正在院子里刷牙。突然，一道白色的身影张开双翅，以每小时三十公里的速度向你杀来！',
    dialogue: [{ character: 'goose', text: '嘎————！！（翻译：此山是我开，此院是我栽！）' }],
    choices: [
      {
        id: 'goose_a_1',
        text: '爷们要战斗！跟它单挑！',
        effects: { goose: 1 },
        next: 'ev_goose_fight'
      },
      { id: 'goose_a_2', text: '好汉不吃眼前亏，跑！', next: 'ev_goose_run' },
      { id: 'goose_a_3', text: '扯着嗓子喊："雨姐——救命——！"', next: 'ev_goose_save' }
    ]
  },

  ev_goose_fight: {
    id: 'ev_goose_fight',
    title: '虽败犹荣',
    scene: 'yard',
    narration: '三分钟后，你拎着被啄成流苏的裤腿狼狈回屋。雨姐笑得直拍炕桌。',
    dialogue: [
      { character: 'yujie', text: '哈哈哈哈！敢跟它单挑的，全村你是头一个！有种！', expression: 'laugh' }
    ],
    choices: [
      {
        id: 'goose_f_1',
        text: '揉着胳膊苦笑："下次……下次一定赢。"',
        effects: { affection: 4 },
        next: 'HUB'
      }
    ]
  },

  ev_goose_run: {
    id: 'ev_goose_run',
    title: '战略转移',
    scene: 'yard',
    narration: '你以破个人纪录的速度冲回了屋。大鹅在门外踱了三圈，骄傲得像个得胜的将军。',
    dialogue: [
      {
        character: 'laokuai',
        text: '（隔窗递出一瓶AD钙奶）喝口压压惊。它连俺都追。',
        expression: 'proud',
        pose: 'drinking'
      }
    ],
    choices: [{ id: 'goose_r_1', text: '含泪接过AD钙奶', effects: { laokuaiAlert: -3 }, next: 'HUB' }]
  },

  ev_goose_save: {
    id: 'ev_goose_save',
    title: '救星降临',
    scene: 'yard',
    narration: '雨姐一个箭步冲出来，单手掐住大鹅的脖子把它拎到半空，像拎一个暖水瓶。',
    dialogue: [
      { character: 'yujie', text: '别怕！有姐在，它伤不了你一根汗毛！', expression: 'serious' },
      { character: 'jack', text: '（心动的感觉……等等，现在不是时候）', expression: 'happy' }
    ],
    choices: [
      {
        id: 'goose_s_1',
        text: '"雨姐，你简直是我的超级英雄！"',
        effects: { affection: 8 },
        next: 'HUB'
      }
    ]
  },

  // ==================== 日期事件：第6天 赶集日 ====================
  ev_market_day: {
    id: 'ev_market_day',
    title: '赶集日',
    scene: 'market',
    narration: '第六天，十里八村最大的集！雨姐甩给你一句话："想买啥自己挑，别乱花钱啊！"（钱包告急预警：今天有大集限定商品）',
    dialogue: [
      {
        character: 'cuihua',
        text: '哟，杰克也来啦！今儿这集可全乎，军大衣、AD钙奶、软枣，都是硬通货！',
        expression: 'happy',
        pose: 'livestream'
      }
    ],
    choices: [
      {
        id: 'mktd_1',
        text: '买军大衣（60元）——东北冬天的终极浪漫',
        condition: { minMoney: 60 },
        lockedHint: '金钱不足（需60元）',
        effects: { money: -60, addItem: 'militaryCoat' },
        next: 'ev_noodle_man'
      },
      {
        id: 'mktd_2',
        text: '买整排AD钙奶（25元）——老蒯快乐水',
        condition: { minMoney: 25 },
        lockedHint: '金钱不足（需25元）',
        effects: { money: -25, addItem: 'adMilk' },
        next: 'ev_noodle_man'
      },
      {
        id: 'mktd_3',
        text: '买软枣（20元）——雨姐的心头好',
        condition: { minMoney: 20 },
        lockedHint: '金钱不足（需20元）',
        effects: { money: -20, addItem: 'softJujube' },
        next: 'ev_noodle_man'
      },
      { id: 'mktd_4', text: '捂紧钱包，就逛逛', next: 'ev_noodle_man' }
    ]
  },

  ev_noodle_man: {
    id: 'ev_noodle_man',
    title: '神秘商人',
    scene: 'market',
    narration: '收摊时分，一个戴金链子的大哥把你拉到角落，神秘兮兮地掏出一包粉条。',
    dialogue: [
      { character: 'jack', text: '这是……粉条？', expression: 'serious' },
      {
        character: 'laokuai',
        text: '（不知从哪冒出来，低声）那是镇上有名的"木薯哥"，专找人贴牌带货，佣金给得老高了……',
        expression: 'proud'
      },
      {
        character: 'jack',
        text: '"纯红薯粉条，假一赔万"，一场直播给我一百块定金……家人们，这单接不接？',
        expression: 'embarrassed'
      }
    ],
    choices: [
      {
        id: 'noodle_1',
        text: '接！不就是直播吗，富贵险中求（危险！）',
        effects: { money: 100, setFlag: 'noodleDeal', ap: -1 },
        next: 'HUB'
      },
      {
        id: 'noodle_2',
        text: '拒绝：来路不明的货，不能坑"家人们"',
        effects: { setFlag: 'refusedNoodles', affection: 5, ap: -1 },
        next: 'HUB'
      }
    ]
  },

  // ==================== 日期事件：第9天 雨姐的烦恼 ====================
  ev_yujie_trouble: {
    id: 'ev_yujie_trouble',
    title: '雨姐的烦恼',
    scene: 'yard',
    narration: '第九天一早，你发现雨姐坐在院子里发愁——农家乐的生意最近冷清了不少。',
    dialogue: [
      { character: 'yujie', text: '唉……客人一年比一年少。俺就会闷头干活，也不会啥宣传……', expression: 'serious' }
    ],
    choices: [
      {
        id: 'trouble_1',
        text: '"那就把活干到极致！"撸起袖子大修农家乐',
        effects: { affection: 10, laokuaiAlert: -5, ap: -1 },
        next: 'HUB'
      },
      {
        id: 'trouble_2',
        text: '"雨姐，听我的，开直播！"（需：学过直播）',
        condition: { flag: 'liveSkill' },
        lockedHint: '需要先在大集跟翠花学会直播技巧',
        effects: { affection: 12, setFlag: 'livePath', ap: -1 },
        next: 'HUB'
      },
      {
        id: 'trouble_3',
        text: '啥也不说，陪她在河边坐了一上午',
        effects: { affection: 8, ap: -1 },
        next: 'HUB'
      }
    ]
  },

  // ==================== 日期事件：第12天 ====================
  // 接了粉条单 → 翻车强制剧情
  ev_expose: {
    id: 'ev_expose',
    title: '东窗事发',
    scene: 'yard',
    specialSchedule: true,
    narration: '杀猪宴的早上，院门被人拍响了。一个举着手机的陌生人站在门口，身后还跟着俩扛摄像机的。',
    dialogue: [
      { character: 'jack', text: '你们是……？', expression: 'embarrassed' },
      { character: 'goose', text: '嘎嘎嘎！（翻译：打假的来啦！打假的来啦！）', pose: 'charge' },
      { character: 'yujie', text: '杰克……他们说你卖的"纯红薯粉条"里……没有红薯？！', expression: 'surprised' }
    ],
    choices: [{ id: 'expose_1', text: '完了……', next: 'ending_noodle' }]
  },

  // 没接粉条单 → 杀猪菜大宴
  ev_feast: {
    id: 'ev_feast',
    title: '杀猪菜大宴',
    scene: 'kitchen',
    specialSchedule: true,
    cg: 'yujie/cg_feast_v2.png',
    narration: '第十二天，一年一度杀猪菜大宴！全村老小都来了，院子里支起八张桌。这是你表现的最后舞台。',
    dialogue: [
      { character: 'yujie', text: '杰克！今儿你是主角之一，想干哪个环节，自己挑！', expression: 'laugh' },
      { character: 'dabaobei', text: '杰、杰克哥，加油！俺给你打下手！', expression: 'happy' }
    ],
    choices: [
      {
        id: 'feast_1',
        text: '掌勺全场！（需：走完厨房线）',
        condition: { routeCompleted: 'kitchen' },
        lockedHint: '需要完成大厨房全部剧情',
        effects: { affection: 15, money: 50 },
        next: 'ev_feast_end'
      },
      {
        id: 'feast_2',
        text: '当着全村的面，把半扇猪扛进场！（需：走完猪圈线）',
        condition: { routeCompleted: 'pigpen' },
        lockedHint: '需要完成猪圈全部剧情',
        effects: { affection: 12, laokuaiAlert: 5 },
        next: 'ev_feast_end'
      },
      {
        id: 'feast_3',
        text: '老老实实打下手、端盘子',
        effects: { affection: 5 },
        next: 'ev_feast_end'
      }
    ]
  },

  ev_feast_end: {
    id: 'ev_feast_end',
    title: '散席',
    scene: 'yard',
    narration:
      '酒足饭饱，宾客散尽。雨姐看着杯盘狼藉却喜气洋洋的院子，长舒了一口气："有你们在，真好。" 明天，就是你在农家乐的最后一天了。',
    choices: [{ id: 'feast_e_1', text: '回屋睡觉，养足精神', next: 'NIGHT' }]
  },

  // ==================== 终章：第13天 抉择日 ====================
  ev_final: {
    id: 'ev_final',
    title: '抉择日',
    scene: 'snow',
    narration:
      '第十三天。夜里落了今冬第一场雪。行李已经收拾好，全家人站在院子里送你——你最后的选择是什么？【结局由你十三天来的所作所为决定，亮起的选项就是你能走的路】',
    dialogue: [
      { character: 'yujie', text: '杰克，真……真要走啊？', expression: 'shy' },
      { character: 'laokuai', text: '（别过脸去，吸溜AD钙奶的声音有点抖）', expression: 'wronged', pose: 'drinking' },
      { character: 'goose', text: '嘎。（翻译：你看着办。）' }
    ],
    choices: [
      {
        id: 'final_love',
        text: '💕【心动】"我不走了。雨姐，我喜欢你！"',
        condition: { minAffection: 90, maxAlert: 40, routeCompleted: 'riverside' },
        lockedHint: '需好感度≥90、警觉度≤40并完成小河边剧情',
        next: 'ending_love'
      },
      {
        id: 'final_family',
        text: '👨‍👩‍👦【一家人】"大哥大嫂！我想留下当你们老弟！"',
        condition: { routeCompleted: 'laokuai', maxAlert: 20 },
        lockedHint: '需完成堂屋老蒯剧情且警觉度≤20',
        next: 'ending_family'
      },
      {
        id: 'final_chef',
        text: '🧑‍🍳【帮工】"让我留下当大厨吧，管饭就行！"',
        condition: { routesCompleted: ['kitchen', 'pigpen'], minAffection: 60 },
        lockedHint: '需完成厨房与猪圈剧情且好感度≥60',
        next: 'ending_chef'
      },
      {
        id: 'final_streamer',
        text: '📱【带货】"雨姐，咱们的酸菜，该让全国人民尝尝了！"',
        condition: { routeCompleted: 'market', flagsAll: ['livePath', 'refusedNoodles'] },
        lockedHint: '需完成大集剧情、开启直播线且未接劣质粉条',
        next: 'ending_streamer'
      },
      {
        id: 'final_goose',
        text: '🪿【？？？】大鹅们突然列队站到了你的身后',
        condition: { minGooseCount: 3 },
        lockedHint: '还没得到鹅群认可',
        next: 'ending_goose'
      },
      {
        id: 'final_friend',
        text: '🤝【好友】"我会常回来的，我的朋友们！"',
        condition: { minAffection: 50 },
        lockedHint: '需好感度≥50',
        next: 'ending_friend'
      },
      {
        id: 'final_bye',
        text: '😶【离开】"再见了，谢谢这段时间的照顾。"',
        next: 'ending_bye'
      }
    ]
  },

  // ==================== 夜晚过渡 ====================
  night_rest: {
    id: 'night_rest',
    title: '夜幕降临',
    scene: 'hall',
    narration: '夜深了，大鹅回巢，猪睡了，老蒯的呼噜声隔着墙都能听见。你躺在热炕上，回味着今天，期待着明天。',
    choices: [{ id: 'night_1', text: '睡觉（进入下一天）', next: 'NIGHT' }]
  }
}

export default gameEvents
