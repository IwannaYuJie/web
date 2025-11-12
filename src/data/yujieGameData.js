/**
 * 《雨姐的心动时刻》游戏数据配置
 * 东北雨姐Galgame完整数据文件
 */

// 角色数据
export const characters = {
  jack: {
    id: 'jack',
    name: '杰克',
    role: '男主角',
    description: '来自美国的黑人小伙，对中国文化充满好奇',
    avatar: 'character_jack.png', // 预留图片位置
    traits: ['热情', '幽默', '勤劳', '真诚']
  },
  yujie: {
    id: 'yujie',
    name: '雨姐',
    role: '女主角',
    description: '东北女汉子，性格豪放，干活利索，经营着农家乐',
    avatar: 'character_yujie.png', // 预留图片位置
    traits: ['豪爽', '能干', '热情', '直率'],
    height: '178cm',
    specialty: '能扛半扇猪'
  },
  laokuai: {
    id: 'laokuai',
    name: '老蒯',
    role: '雨姐老公',
    description: '雨姐的老公，"娇夫"形象，身材瘦小',
    avatar: 'character_laokuai.png', // 预留图片位置
    traits: ['温和', '细心', '有点懒', '爱吃AD钙奶']
  },
  peisi: {
    id: 'peisi',
    name: '佩斯',
    role: 'NPC',
    description: '农家乐帮工，负责点火做饭',
    avatar: 'character_peisi.png', // 预留图片位置
    catchphrase: '佩斯，点火！'
  },
  cuihua: {
    id: 'cuihua',
    name: '翠花',
    role: 'NPC',
    description: '邻居大姐，爱吃爱聊天',
    avatar: 'character_cuihua.png', // 预留图片位置
    traits: ['贪吃', '八卦', '热心']
  },
  dabaobei: {
    id: 'dabaobei',
    name: '大宝贝',
    role: 'NPC',
    description: '雨姐的徒弟，勤恳老实',
    avatar: 'character_dabaobei.png', // 预留图片位置
    traits: ['勤恳', '老实', '能干']
  }
}

// 场景数据
export const scenes = {
  farmhouse: {
    id: 'farmhouse',
    name: '农家乐大院',
    description: '雨姐家的农家乐，宽敞的院子里堆着柴火和农具',
    background: 'scene_farmhouse.jpg', // 预留图片位置
    music: 'bgm_farmhouse.mp3'
  },
  kitchen: {
    id: 'kitchen',
    name: '农家大厨房',
    description: '热气腾腾的大厨房，佩斯正在灶台边忙活',
    background: 'scene_kitchen.jpg', // 预留图片位置
    music: 'bgm_kitchen.mp3'
  },
  pigpen: {
    id: 'pigpen',
    name: '猪圈',
    description: '养着大肥猪的猪圈，雨姐经常来这里干活',
    background: 'scene_pigpen.jpg', // 预留图片位置
    music: 'bgm_farm.mp3'
  },
  market: {
    id: 'market',
    name: '集市',
    description: '热闹的东北大集，各种农产品和小吃',
    background: 'scene_market.jpg', // 预留图片位置
    music: 'bgm_market.mp3'
  },
  riverside: {
    id: 'riverside',
    name: '河边',
    description: '村子旁的小河，风景优美，适合聊天',
    background: 'scene_riverside.jpg', // 预留图片位置
    music: 'bgm_riverside.mp3'
  },
  snowfield: {
    id: 'snowfield',
    name: '雪地',
    description: '冬天的东北雪地，白茫茫一片',
    background: 'scene_snowfield.jpg', // 预留图片位置
    music: 'bgm_winter.mp3'
  }
}

// 物品数据
export const items = {
  adMilk: {
    id: 'adMilk',
    name: 'AD钙奶',
    description: '老蒯最爱喝的饮料',
    icon: 'item_admilk.png',
    effect: { laokuaiAlert: -5 }
  },
  pork: {
    id: 'pork',
    name: '半扇猪肉',
    description: '新鲜的猪肉，很重',
    icon: 'item_pork.png',
    effect: { affection: 10 }
  },
  softJujube: {
    id: 'softJujube',
    name: '软枣',
    description: '雨姐家种的特产软枣',
    icon: 'item_softjujube.png',
    effect: { affection: 5 }
  },
  pickledCabbage: {
    id: 'pickledCabbage',
    name: '酸菜',
    description: '东北特色腌酸菜',
    icon: 'item_pickledcabbage.png',
    effect: { affection: 8 }
  },
  firewood: {
    id: 'firewood',
    name: '柴火',
    description: '劈好的柴火',
    icon: 'item_firewood.png',
    effect: { affection: 5 }
  },
  flower: {
    id: 'flower',
    name: '野花',
    description: '河边采的野花',
    icon: 'item_flower.png',
    effect: { affection: 15, laokuaiAlert: 10 }
  }
}

// 游戏结局配置
export const endings = {
  trueEnding: {
    id: 'trueEnding',
    name: '真爱结局',
    description: '雨姐与杰克真心相爱，老蒯也接受了这段感情',
    condition: { affection: 90, laokuaiAlert: 30, day: 30 },
    image: 'ending_true.jpg',
    text: '经过一个月的相处，雨姐发现杰克是个真诚善良的人。在一个雪夜，雨姐终于向杰克表白了心意。老蒯虽然心里不是滋味，但看到雨姐的幸福，也选择了祝福。杰克决定留在东北，和雨姐一起经营农家乐...'
  },
  goodEnding: {
    id: 'goodEnding',
    name: '好友结局',
    description: '成为了很好的朋友',
    condition: { affection: 60, affectionMax: 89, laokuaiAlert: 50 },
    image: 'ending_good.jpg',
    text: '虽然没有发展成恋人，但你和雨姐成为了很好的朋友。每年你都会来东北看望雨姐一家，品尝地道的东北菜。这份跨越国界的友谊，成为了你人生中最珍贵的回忆。'
  },
  normalEnding: {
    id: 'normalEnding',
    name: '平淡结局',
    description: '普通的旅行经历',
    condition: { affection: 30, affectionMax: 59 },
    image: 'ending_normal.jpg',
    text: '在东北的这段时间，你体验了不一样的生活。虽然和雨姐没有太深的交集，但这次旅行让你对中国文化有了更深的了解。带着美好的回忆，你踏上了归途。'
  },
  badEnding: {
    id: 'badEnding',
    name: '被赶走结局',
    description: '老蒯的警觉度过高，被赶走了',
    condition: { laokuaiAlert: 80 },
    image: 'ending_bad.jpg',
    text: '老蒯发现了你的意图，非常生气。在一次激烈的争吵后，你被赶出了农家乐。雨姐虽然有些不舍，但还是选择了家庭。你只能黯然离开东北...'
  },
  secretEnding: {
    id: 'secretEnding',
    name: '隐藏结局：三人行',
    description: '神秘的三人关系',
    condition: { affection: 95, laokuaiAlert: 20, hasAllItems: true, day: 40 },
    image: 'ending_secret.jpg',
    text: '在长时间的相处中，一个意想不到的情况发生了。老蒯竟然也对你产生了好感！经过深入的交流，三个人达成了一个特殊的共识。你们决定一起经营农家乐，开创一段不寻常但充满欢乐的生活...'
  }
}

// 主线剧情章节
export const chapters = [
  {
    id: 'chapter1',
    day: 1,
    title: '初来乍到',
    scene: 'farmhouse',
    description: '杰克第一次来到雨姐的农家乐',
    events: ['event_arrival', 'event_meet_yujie', 'event_meet_laokuai']
  },
  {
    id: 'chapter2',
    day: 5,
    title: '融入生活',
    scene: 'kitchen',
    description: '开始帮忙做农活',
    events: ['event_help_cooking', 'event_chop_wood', 'event_feed_pigs']
  },
  {
    id: 'chapter3',
    day: 10,
    title: '赶大集',
    scene: 'market',
    description: '和雨姐一起去集市',
    events: ['event_market_trip', 'event_buy_gifts', 'event_meet_cuihua']
  },
  {
    id: 'chapter4',
    day: 15,
    title: '深入了解',
    scene: 'riverside',
    description: '与雨姐的深入交流',
    events: ['event_riverside_talk', 'event_share_stories', 'event_laokuai_jealous']
  },
  {
    id: 'chapter5',
    day: 20,
    title: '杀猪菜',
    scene: 'pigpen',
    description: '帮忙杀猪做杀猪菜',
    events: ['event_kill_pig', 'event_carry_pork', 'event_big_feast']
  },
  {
    id: 'chapter6',
    day: 25,
    title: '冬日情愫',
    scene: 'snowfield',
    description: '雪地里的浪漫时刻',
    events: ['event_snow_play', 'event_confession_chance', 'event_decision_time']
  },
  {
    id: 'chapter7',
    day: 30,
    title: '最终抉择',
    scene: 'farmhouse',
    description: '做出最终的选择',
    events: ['event_final_choice', 'event_ending_trigger']
  }
]

// 导出默认配置
export default {
  characters,
  scenes,
  items,
  endings,
  chapters
}
