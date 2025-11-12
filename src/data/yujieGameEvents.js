/**
 * 《雨姐的心动时刻》详细事件数据
 * 包含所有剧情事件的对话、选项和分支
 */

// 导出所有游戏事件
export const gameEvents = {
  // 第一章事件
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
      { id: 'choice_3_1', text: '热情地和老蒯握手', effects: { affection: 2, laokuaiAlert: -5 }, next: 'chapter1_end' },
      { id: 'choice_3_2', text: '送老蒯一瓶AD钙奶', effects: { affection: 1, laokuaiAlert: -10 }, next: 'chapter1_end' },
      { id: 'choice_3_3', text: '简单点头致意', effects: { affection: 0, laokuaiAlert: 0 }, next: 'chapter1_end' }
    ]
  },

  // 更多事件数据...
  // 由于篇幅限制，这里只展示部分事件结构
  // 实际游戏中会有完整的所有章节事件
}

export default gameEvents
