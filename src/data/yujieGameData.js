/**
 * 《雨姐的心动时刻》重制版 - 游戏基础数据
 *
 * 结构：序章(第1天) → 自由行动(第2-12天，每天2行动点) → 终章(第13天)
 * 六条支线 + 固定日期事件 + 九个结局
 */

// ==================== 角色 ====================
export const characters = {
  jack: {
    id: 'jack',
    name: '杰克',
    role: '男主角（你）',
    description: '来自美国的黑人小伙，热情幽默，来中国寻找真实的生活',
    avatar: 'yujie/char_jack.jpg', // 形象参考：东北黑人博主伊博
    emoji: '🧔🏿'
  },
  yujie: {
    id: 'yujie',
    name: '雨姐',
    role: '女主角',
    description: '东北女汉子，能扛半扇猪，经营着农家乐',
    avatar: 'yujie/yujie.jpg',
    emoji: '💪'
  },
  laokuai: {
    id: 'laokuai',
    name: '老蒯',
    role: '雨姐老公',
    description: '"娇夫"人设，命根子是AD钙奶，警觉的眼神锁定你',
    avatar: 'yujie/laokuai.jpg',
    emoji: '🥛'
  },
  peisi: {
    id: 'peisi',
    name: '佩斯',
    role: '帮工',
    description: '农家乐全能帮工，人形打火机',
    avatar: 'yujie/char_peisi.jpg',
    emoji: '🔥'
  },
  cuihua: {
    id: 'cuihua',
    name: '翠花',
    role: '邻居',
    description: '村口情报站站长，嗑瓜子十级学者，直播爱好者',
    avatar: 'yujie/char_cuihua.jpg',
    emoji: '🌻'
  },
  dabaobei: {
    id: 'dabaobei',
    name: '大宝贝',
    role: '徒弟',
    description: '雨姐的徒弟，勤恳能干的壮实姑娘，力气活担当',
    avatar: 'yujie/char_dabaobei.jpg',
    emoji: '🐻'
  },
  goose: {
    id: 'goose',
    name: '村霸大鹅',
    role: '???',
    description: '本村真正的统治者，见你一次追你一次',
    avatar: 'yujie/char_goose.jpg',
    emoji: '🪿'
  }
}

// ==================== 场景 ====================
// image 为 null 时用 gradient 渐变兜底
export const scenes = {
  yard: {
    id: 'yard',
    name: '农家乐大院',
    description: '雨姐家的院子，柴火堆得老高，大鹅在巡视领地',
    image: 'yujie/scene_yard.jpg',
    gradient: 'linear-gradient(160deg, #8d5524 0%, #c68642 55%, #e8b04b 100%)'
  },
  kitchen: {
    id: 'kitchen',
    name: '农家大厨房',
    description: '热气腾腾，酸菜缸和灶台的香气直往鼻子里钻',
    image: 'yujie/scene_kitchen.jpg',
    gradient: 'linear-gradient(160deg, #6d3b14 0%, #a85f22 60%, #d98e3a 100%)'
  },
  pigpen: {
    id: 'pigpen',
    name: '猪圈',
    description: '几头大肥猪正等着开饭，哼哼声此起彼伏',
    image: 'yujie/scene_pigpen.jpg',
    gradient: 'linear-gradient(160deg, #5c4033 0%, #8b5a2b 60%, #b5793f 100%)'
  },
  market: {
    id: 'market',
    name: '村口大集',
    description: '吆喝声、砍价声、炸丸子的香气，热闹非凡',
    image: 'yujie/scene_market.jpg',
    gradient: 'linear-gradient(160deg, #a33327 0%, #d45a2a 60%, #f0a03c 100%)'
  },
  riverside: {
    id: 'riverside',
    name: '小河边',
    description: '村旁的小河，夕阳洒在水面上，适合说点心里话',
    image: 'yujie/scene_riverside.jpg',
    gradient: 'linear-gradient(160deg, #1d4e5f 0%, #3a7d8c 55%, #d4a35a 100%)'
  },
  hall: {
    id: 'hall',
    name: '堂屋热炕',
    description: '老蒯的地盘，炕桌上永远摆着一排AD钙奶',
    image: 'yujie/scene_hall.jpg',
    gradient: 'linear-gradient(160deg, #4a2c2a 0%, #7a4a3a 60%, #b07a50 100%)'
  },
  mountain: {
    id: 'mountain',
    name: '后山',
    description: '蘑菇、软枣、野花……以及大鹅的老巢',
    image: 'yujie/scene_mountain.jpg',
    gradient: 'linear-gradient(160deg, #2d4a22 0%, #4f7a3a 60%, #8fae5a 100%)'
  },
  snow: {
    id: 'snow',
    name: '雪夜村庄',
    description: '大雪簌簌地下，整个村子安静得能听见心跳',
    image: 'yujie/scene_snow.jpg',
    gradient: 'linear-gradient(160deg, #2c3e50 0%, #5d7a93 55%, #cfdde8 100%)'
  }
}

// ==================== 物品 ====================
export const items = {
  adMilk: {
    id: 'adMilk',
    name: 'AD钙奶',
    emoji: '🥛',
    description: '老蒯的命根子，送他准没错'
  },
  softJujube: {
    id: 'softJujube',
    name: '软枣',
    emoji: '🫐',
    description: '后山特产，雨姐从小吃到大'
  },
  pickledCabbage: {
    id: 'pickledCabbage',
    name: '酸菜',
    emoji: '🥬',
    description: '东北人的灵魂，你亲手切的'
  },
  flower: {
    id: 'flower',
    name: '野花',
    emoji: '💐',
    description: '后山采的，带着露水'
  },
  pork: {
    id: 'pork',
    name: '半扇猪肉',
    emoji: '🥩',
    description: '你扛过的那半扇，雨姐切了条后臀尖送你'
  },
  mushroom: {
    id: 'mushroom',
    name: '榛蘑',
    emoji: '🍄',
    description: '小鸡炖蘑菇的另一半'
  },
  militaryCoat: {
    id: 'militaryCoat',
    name: '军大衣',
    emoji: '🧥',
    description: '赶集日限定，东北冬天的终极浪漫'
  },
  gooseEgg: {
    id: 'gooseEgg',
    name: '大鹅蛋',
    emoji: '🥚',
    description: '从鹅王眼皮底下摸来的战利品'
  }
}

// ==================== 支线（自由行动地点） ====================
export const routes = {
  kitchen: {
    id: 'kitchen',
    name: '大厨房',
    icon: '🍳',
    scene: 'kitchen',
    description: '跟佩斯学手艺，还能赚工钱',
    repeatable: true, // 走完后仍可帮厨打工
    repeatText: '帮厨打工（+15元）'
  },
  pigpen: {
    id: 'pigpen',
    name: '猪圈',
    icon: '🐷',
    scene: 'pigpen',
    description: '喂猪、起名、扛半扇猪',
    repeatable: false
  },
  market: {
    id: 'market',
    name: '村口大集',
    icon: '🛒',
    scene: 'market',
    description: '翠花姐的地盘，情报与商机',
    repeatable: false
  },
  riverside: {
    id: 'riverside',
    name: '小河边',
    icon: '🌊',
    scene: 'riverside',
    description: '雨姐常去散心的地方（心动主线）',
    repeatable: false
  },
  laokuai: {
    id: 'laokuai',
    name: '堂屋热炕',
    icon: '🥛',
    scene: 'hall',
    description: '陪老蒯唠嗑，把警觉度喝下去',
    repeatable: false
  },
  mountain: {
    id: 'mountain',
    name: '后山',
    icon: '⛰️',
    scene: 'mountain',
    description: '采蘑菇软枣，小心大鹅的老巢',
    repeatable: false
  }
}

// ==================== 结局 ====================
export const endings = {
  ending_love: {
    id: 'ending_love',
    name: '心动结局',
    icon: '💕',
    hint: '好感≥90，警觉≤40，走完河边线',
    image: 'yujie/ending_warm.jpg',
    text: '第13天的夜里下起了雪。你把雨姐约到河边，把憋了十三天的话一口气说完。雨姐盯着你看半天，一巴掌拍你背上："磨叽啥呢！俺也稀罕你！" 远处，老蒯抱着一箱AD钙奶默默转身，肩膀一抽一抽的……后来他说，那是冻的。'
  },
  ending_family: {
    id: 'ending_family',
    name: '东北一家人',
    icon: '👨‍👩‍👦',
    hint: '走完堂屋线，警觉≤20',
    image: 'yujie/ending_warm.jpg',
    text: '结拜仪式在堂屋举行，供桌上摆着一排AD钙奶。老蒯眼含热泪："弟啊！以后这就是你家！" 雨姐在旁边笑得直不起腰："得，俺家又添一口人！" 你成了这个家认证的"老弟"，户口本上没你，炕头上永远有你。'
  },
  ending_chef: {
    id: 'ending_chef',
    name: '金牌帮工',
    icon: '🧑‍🍳',
    hint: '走完厨房线和猪圈线，好感≥60',
    image: 'yujie/cg_feast.jpg',
    text: '杀猪菜大宴上，你一个人撑起八个灶眼，佩斯当场失业，抱着灶台哭。雨姐一拍桌子："别走了！管吃管住，酸菜管够！" 你成了农家乐的金牌大厨，招牌菜：杰克炖大鹅……的土豆。'
  },
  ending_streamer: {
    id: 'ending_streamer',
    name: '带货新星',
    icon: '📱',
    hint: '走完大集线，第9天选择直播，且拒绝贴牌粉条',
    image: 'yujie/cg_live.jpg',
    text: '你顶住高佣金的诱惑没碰贴牌粉条，转头把雨姐家的酸菜卖断了货。弹幕刷屏："这老外真实在！" 雨姐搂着你肩膀冲镜头喊："家人们！这是俺们家的卧龙！" 当晚，酸菜预售排到了明年开春。'
  },
  ending_noodle: {
    id: 'ending_noodle',
    name: '翻车结局',
    icon: '💥',
    hint: '彩蛋：替人卖「木薯粉条」试试？',
    image: 'yujie/ending_sad.jpg',
    text: '"家人们！纯红薯粉条，假一赔万！" 三天后，打假博主上门：这粉条里没有红薯，只有木薯。165元罚单（农家乐全部流动资金）贴在大门上，雨姐的大鹅在旁边幸灾乐祸地叫。你连夜扛着村口的火车跑路了……'
  },
  ending_friend: {
    id: 'ending_friend',
    name: '好友结局',
    icon: '🤝',
    hint: '好感≥50',
    image: 'yujie/ending_warm.jpg',
    text: '你走那天，雨姐往你包里硬塞了十斤酸菜："常回来啊老弟！" 老蒯递给你一瓶AD钙奶，啥也没说。你们成了铁哥们，此后每年冬天，你都雷打不动回来蹭一顿杀猪菜。'
  },
  ending_bye: {
    id: 'ending_bye',
    name: '路人结局',
    icon: '😶',
    hint: '好感不足50时默默离开',
    image: 'yujie/ending_sad.jpg',
    text: '十三天的农家乐体验卡到期了。你学会了几句东北话，胖了三斤，手机里多了几百张照片和一段大鹅追你的视频。雨姐在村口冲你挥手："有空再来啊！" 你想，大概会吧。'
  },
  ending_goose: {
    id: 'ending_goose',
    name: '大鹅之主',
    icon: '🪿',
    hint: '？？？（多和大鹅打交道）',
    image: 'yujie/cg_goose.jpg',
    text: '三次交锋之后，村里的大鹅们开了三天三夜的会，一致决定拥立你为新任鹅王。你被一群大鹅簇拥着巡视村庄，雨姐目瞪口呆，老蒯的AD钙奶掉在了地上。从此本村食物链顶端，写上了你的名字。'
  },
  ending_kicked: {
    id: 'ending_kicked',
    name: '被赶走',
    icon: '😡',
    hint: '警觉≥45，老蒯忍无可忍',
    image: 'yujie/ending_sad.jpg',
    text: '老蒯把你每天干了啥记了满满一本，当众宣读。你被雨姐拎着行李丢出大门，大鹅在你身后追出二里地。从此，这个小村庄成了你地图上的禁区。'
  }
}

// ==================== 固定日期事件 ====================
// advanceDay 时若命中则强制插入；day12 由引擎根据粉条flag/支线完成度另作分流
export const dateEvents = {
  3: 'ev_goose_attack',
  6: 'ev_market_day',
  9: 'ev_yujie_trouble',
  13: 'ev_final'
}

export const TOTAL_DAYS = 13
export const ACTIONS_PER_DAY = 2
export const ALERT_GAME_OVER = 45 // 警觉度达到即强制触发被赶走结局
export const MAX_ROUTE_STAGE = 3
export const GALLERY_KEY = 'yujie_gallery_v2'

// 导出默认配置
export default {
  characters,
  scenes,
  items,
  routes,
  endings,
  dateEvents,
  TOTAL_DAYS,
  ACTIONS_PER_DAY,
  ALERT_GAME_OVER,
  MAX_ROUTE_STAGE,
  GALLERY_KEY
}
