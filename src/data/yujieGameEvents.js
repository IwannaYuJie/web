/**
 * 《雨姐的心动时刻》v2.4 - 剧情事件与演出数据
 *
 * 规范要求：
 * 1. 严格 62 个事件节点（42 个既有 ID + 20 个指定新增 ID）。
 * 2. 严格 14 个结局路径映射，18 AP 真实预算可达。
 * 3. 隐去显式数值，采用生活化台词与情境决策；至少 30% 选项具备负向/混合/风险代价。
 * 4. 丰富自然的角色 dialogue，总数维持在 135-160 区间。
 * 5. 地域口吻统一为北方农家乡村大院轻喜剧气质。
 */

export const gameEvents = {
  // ==================== 序章：第 1 天（线性导入，0 AP） ====================
  pro_arrive: {
    id: 'pro_arrive',
    title: '初到大院',
    scene: 'yard',
    narration:
      '经过一路颠簸换乘，你终于站在了这处白雪皑皑的北方农家小院前。院内烟囱青烟袅袅，柴堆高耸，一只昂首挺胸的大白鹅正立在石碾上冷冷注视着你。',
    dialogue: [
      {
        character: 'jack',
        text: '有人在吗？请问这里是网上订的“雨姐农家大院”吗？……这鹅的眼神怎么比纽约海关还凶？',
        expression: 'happy'
      },
      {
        character: 'goose',
        text: '嘎——！（昂首挺胸，目光如炬扫视来客）'
      }
    ],
    choices: [
      {
        id: 'pro_arrive_shout',
        text: '气沉丹田，扯开嗓子向院内大喊一声：“大娘大叔在家吗——！”',
        risk: 'mixed',
        feedback: '洪亮的嗓门震落了门檐上的积雪，引得屋里传来一阵急促的脚步声，但院里的大鹅显然被激怒了。',
        effects: { affection: 2, laokuaiAlert: 3 },
        next: 'pro_meet_yujie'
      },
      {
        id: 'pro_arrive_knock',
        text: '整理衣着，客客气气地轻叩两下木栅栏门。',
        feedback: '规矩的叩门声在空旷的院落里回响，显得礼貌而克制。',
        effects: { affection: 1, integrity: 1 },
        next: 'pro_meet_yujie'
      },
      {
        id: 'pro_arrive_goose',
        text: '蹲下身子，试图对石碾上的大白鹅比划友好的招呼手势。',
        risk: 'risky',
        feedback: '大白鹅脖子上的羽毛猛地炸开，发出刺耳的嘶鸣，直接把你当成了潜在挑衅者。',
        effects: { goose: 1, laokuaiAlert: 2 },
        next: 'pro_meet_yujie'
      }
    ]
  },

  pro_meet_yujie: {
    id: 'pro_meet_yujie',
    title: '神力雨姐',
    scene: 'yard',
    cg: 'yujie/cg_carry_pork_v2.png',
    narration:
      '木门“砰”地被猛力推开，带起一阵呼啸的寒风。一个身形高挑健硕的女人单肩扛着足足半扇刚宰的大肥猪，健步如飞地掠过院心，脚底带起一串泥雪飞溅。',
    dialogue: [
      {
        character: 'yujie',
        text: '哎嗨！脚底下闪开点！半扇猪肉进仓房喽！——你就是那个远道来的外国小伙杰克吧？',
        expression: 'surprised'
      },
      {
        character: 'jack',
        text: '对对……是我！等等，雨姐，你这一只胳膊抗的可是整整半扇大猪啊？！',
        expression: 'embarrassed'
      },
      {
        character: 'yujie',
        text: '哈哈哈哈！这算啥阵仗！在俺们农村，有的是膀子力气！小伙子，欢迎来咱大院！',
        expression: 'laugh'
      }
    ],
    choices: [
      {
        id: 'pro_meet_yujie_help',
        text: '毫不犹豫快步冲上前去伸手搭住猪腿后侧：“姐，我帮你托住后头，慢点放！”',
        feedback: '雨姐爽朗大笑，肩膀微微一卸力，对你的眼力见和身手投来赞许的目光。',
        effects: { affection: 6, yujieSoftness: 4, integrity: 2 },
        next: 'pro_meet_laokuai'
      },
      {
        id: 'pro_meet_yujie_admire',
        text: '退后半步赞叹鼓掌：“雨姐这力气和气势，真是当代花木兰！”',
        risk: 'mixed',
        feedback: '雨姐笑得前仰后合，但动作丝毫不慢：“油腔滑调的城里娃，进屋暖和去吧！”',
        effects: { affection: 4, yujieSoftness: -2 },
        next: 'pro_meet_laokuai'
      }
    ]
  },

  pro_meet_laokuai: {
    id: 'pro_meet_laokuai',
    title: '堂屋之主',
    scene: 'hall',
    narration:
      '踏进热浪扑面的堂屋，迎面是宽敞的农家大火炕。炕沿上盘腿坐着一位身形清瘦的男人，手里紧紧攥着一瓶开封的 AD 钙奶，目光犀利如鹰，自下而上仔细打量着你。',
    dialogue: [
      {
        character: 'laokuai',
        text: '（滋溜吸了一大口奶）这就是要在咱家住上十三天的外头客人？看着细皮嫩肉的。',
        expression: 'angry',
        pose: 'drinking'
      },
      {
        character: 'yujie',
        text: '老蒯！干啥呢这是，客人刚进门你绷着个脸给谁看呢！杰克，这是俺当家的。',
        expression: 'gentle'
      },
      {
        character: 'laokuai',
        text: '俺是就事论事。大院规矩多，活计重，可容不得闲杂人等在这添乱。',
        expression: 'proud'
      }
    ],
    choices: [
      {
        id: 'pro_laokuai_respect',
        text: '恭敬上前双手递上随身带的伴手小点心：“蒯哥好！往后十三天劳作，全听蒯哥指教！”',
        feedback: '老蒯眼神微动，接过点心盒放在炕桌角上，戒备的神色略有缓解。',
        effects: { laokuaiBond: 5, laokuaiAlert: -4, integrity: 2 },
        next: 'pro_peisi_fire'
      },
      {
        id: 'pro_laokuai_nod',
        text: '规矩站定，诚恳点头：“明白，我绝不破坏大院的规矩，一定踏实做事。”',
        feedback: '老蒯微微哼了一声，吸了一口酸奶没再多言。',
        effects: { laokuaiBond: 2, laokuaiAlert: -1 },
        next: 'pro_peisi_fire'
      },
      {
        id: 'pro_laokuai_stare_milk',
        text: '好奇地盯着他手里那一排整齐的 AD 钙奶：“哥，这酸奶看着真不错，能分我一瓶尝尝吗？”',
        risk: 'negative',
        feedback: '老蒯像护宝贝一样迅速把奶瓶护在胸前，眼神里的防备瞬间拉满。',
        effects: { laokuaiAlert: 6, laokuaiBond: -3 },
        next: 'pro_peisi_fire'
      }
    ]
  },

  pro_peisi_fire: {
    id: 'pro_peisi_fire',
    title: '灶膛烈火',
    scene: 'kitchen',
    narration:
      '转入后厨，大铁锅已架起。帮工佩斯手握火石站在大柴灶前，神情严肃专注，如同在等待一场点火仪式的号令。',
    dialogue: [
      {
        character: 'yujie',
        text: '佩斯——！点火——！',
        expression: 'serious',
        pose: 'cooking'
      },
      {
        character: 'peisi',
        text: '得嘞！！（咔嚓一声火星四溅，灶膛内烈焰奔腾）',
        expression: 'happy',
        pose: 'bellows'
      },
      {
        character: 'jack',
        text: '太帅了！这拉风箱点火的架势，比大片里的特效还要热血！',
        expression: 'happy'
      },
      {
        character: 'peisi',
        text: '嘿嘿！洋兄弟懂行！今天开锅大吉，酸菜炖大肉管饱！',
        expression: 'happy'
      }
    ],
    choices: [
      {
        id: 'pro_peisi_bellows',
        text: '主动撸起袖子坐到风箱前：“佩斯哥，我力气大，这风箱让我来拉两把！”',
        feedback: '风箱呼呼作响，灶火愈发旺盛，雨姐和佩斯都对你的勤快赞赏有加。',
        effects: { affection: 4, integrity: 2 },
        next: 'pro_night'
      },
      {
        id: 'pro_peisi_eat',
        text: '端起大碗连吃三大碗酸菜白肉，用最接地气的方式捧场。',
        risk: 'mixed',
        feedback: '饭量惊人让雨姐笑得合不拢嘴，但老蒯在旁边看着粮缸暗自皱眉。',
        effects: { affection: 4, yujieSoftness: -2, laokuaiAlert: 2 },
        next: 'pro_night'
      }
    ]
  },

  pro_night: {
    id: 'pro_night',
    title: '首夜思绪',
    scene: 'hall',
    narration:
      '躺在滚烫的农家火炕上，窗外是呼啸的北风。十三天的农庄生活正式开启，每天你将拥有 2 点行动力，可前往厨房、猪圈、集市、河边、堂屋与后山。人际与命运的分岔，就始于明朝晨曦。',
    dialogue: [
      {
        character: 'jack',
        text: '热炕头真暖和……希望接下来的日子能真正融入这个大家庭。',
        expression: 'gentle'
      }
    ],
    choices: [
      {
        id: 'pro_night_sleep',
        text: '养精蓄锐，准备迎接明日清晨的劳作。',
        feedback: '热炕烘得周身暖意融融，你很快沉沉睡去。',
        effects: {},
        next: 'NIGHT'
      }
    ]
  },

  // ==================== 支线一：大厨房（佩斯/烹饪） ====================
  route_kitchen_1: {
    id: 'route_kitchen_1',
    title: '帮厨初试',
    scene: 'kitchen',
    narration:
      '系上粗布围裙踏进厨房，几十斤重的生铁大锅正冒着滚滚热浪，佩斯被柴烟熏得直咳嗽，灶台前急需副手。',
    dialogue: [
      {
        character: 'peisi',
        text: '杰克兄弟快来！雨姐让准备六十人的午饭烩菜，这大铲子翻炒起来沉得要命！',
        expression: 'happy',
        pose: 'bellows'
      },
      {
        character: 'jack',
        text: '别慌！看我的，掌勺还是切墩？',
        expression: 'serious',
        pose: 'working'
      },
      {
        character: 'yujie',
        text: '（掀帘进屋）锅里别糊了！火候要稳！',
        expression: 'serious'
      }
    ],
    choices: [
      {
        id: 'kit_1_take_spatula',
        text: '“佩斯哥歇歇，这口大锅我来翻炒！”接掌大铁铲奋力翻动整锅食材。',
        feedback: '大铁铲在你手中翻飞如飞，雨姐进屋看见满脸赞许，拍了拍你结实的臂膀。',
        effects: { affection: 4, yujieSoftness: 4, integrity: 2, money: 20, ap: -1 },
        advanceRoute: 'kitchen',
        next: 'HUB'
      },
      {
        id: 'kit_1_sub',
        text: '踏踏实实守在案板前清洗泥沙，将几大筐萝卜土豆切得方方正正。',
        risk: 'mixed',
        feedback: '刀工虽然整齐踏实，但由于节奏太慢，导致出锅时间稍有延误。',
        effects: { affection: 3, yujieSoftness: -2, integrity: 3, money: 15, ap: -1 },
        advanceRoute: 'kitchen',
        next: 'HUB'
      },
      {
        id: 'kit_1_critic',
        text: '站在灶台旁指点：“这大柴火受热太猛，油烟太大，应该改良一下排风。”',
        risk: 'negative',
        feedback: '佩斯擦了把汗苦笑，雨姐在门外听见瞪了你一眼：“农家灶要的就是这股烈火气！”',
        effects: { affection: -2, integrity: 1, laokuaiAlert: 3, ap: -1 },
        advanceRoute: 'kitchen',
        next: 'HUB'
      }
    ]
  },

  route_kitchen_2: {
    id: 'route_kitchen_2',
    title: '酸菜心法',
    scene: 'kitchen',
    narration:
      '两口大酸菜缸散发着地道醇厚的发酵清香。雨姐亲自端出一颗翠黄酸菜，菜刀在案板上立得笔直。',
    dialogue: [
      {
        character: 'yujie',
        text: '切酸菜讲究“片薄如纸、丝细如发”。刀锋要斜四十五度压下去，看好了！',
        expression: 'serious',
        pose: 'cooking'
      },
      {
        character: 'jack',
        text: '（全神贯注凝视刀刃走势）这手艺真是精细活，我来试试看。',
        expression: 'serious',
        pose: 'working'
      },
      {
        character: 'peisi',
        text: '慢点切，手别挨着刀刃，雨姐切菜那是一绝！',
        expression: 'happy'
      }
    ],
    choices: [
      {
        id: 'kit_2_careful',
        text: '沉下心神，严格按照雨姐传授的斜切运刀法，慢工出细活切出均匀细丝。',
        feedback: '整齐透亮的酸菜丝码在盆中，雨姐眼底满是欣慰，递给你一块新鲜熟肉尝鲜。',
        effects: { affection: 6, integrity: 4, money: 25, addItem: 'pickledCabbage', ap: -1 },
        advanceRoute: 'kitchen',
        next: 'HUB'
      },
      {
        id: 'kit_2_taste',
        text: '一边切一边忍不住伸手抓起酸菜心偷吃：“这酸脆劲儿，太上头了！”',
        risk: 'mixed',
        feedback: '雨姐笑着拿筷子轻敲你的手背：“馋猫！还没下锅呢就吃饱了，往后怎么掌勺！”',
        effects: { affection: 4, yujieSoftness: -2, money: 20, ap: -1 },
        advanceRoute: 'kitchen',
        next: 'HUB'
      },
      {
        id: 'kit_2_rush',
        text: '图快求狠，大开大合猛剁一通，把酸菜切成了大粗块。',
        risk: 'negative',
        feedback: '粗粝的菜块下锅不易入味，老蒯路过摇了摇头，雨姐无奈只得亲自返工。',
        effects: { affection: -1, integrity: -3, money: 10, ap: -1 },
        advanceRoute: 'kitchen',
        next: 'HUB'
      }
    ]
  },

  route_kitchen_3: {
    id: 'route_kitchen_3',
    title: '大宴掌勺',
    scene: 'kitchen',
    cg: 'yujie/cg_cooking_v2.png',
    narration:
      '今日考核掌勺！八个灶眼全开，佩斯在后拉风箱，全院的目光都聚焦在你手中的大马勺上。',
    dialogue: [
      {
        character: 'peisi',
        text: '洋兄弟，火候顶上来了！今天是你的出师大考，放手干吧！',
        expression: 'happy'
      },
      {
        character: 'yujie',
        text: '别慌神，油温七成热下八角，盐巴最后放，大伙都等着尝你的手艺呢！',
        expression: 'laugh'
      },
      {
        character: 'laokuai',
        text: '（抱臂站在门外抽烟）俺就看看这洋徒弟能焖出个啥花样。',
        expression: 'proud'
      }
    ],
    choices: [
      {
        id: 'kit_3_fusion',
        text: '独创“黑椒酸菜排骨炖粉条”，用纯正土豆粉与深山榛蘑调和出惊艳口感。',
        feedback: '满院飘香！村民们吃得交口称赞，雨姐激动地当场宣布你正式成为金牌大厨。',
        effects: { affection: 8, integrity: 6, money: 35, setFlag: 'chef', ap: -1 },
        advanceRoute: 'kitchen',
        next: 'HUB'
      },
      {
        id: 'kit_3_classic',
        text: '严格按北方古法熬制浓白高汤，原汁原味复刻最纯正的传统杀猪菜。',
        feedback: '汤浓肉烂，风味地道纯粹，老蒯连喝了两碗，难得地对你点了点头。',
        effects: { affection: 6, laokuaiBond: 6, integrity: 5, money: 30, setFlag: 'chef', ap: -1 },
        advanceRoute: 'kitchen',
        next: 'HUB'
      },
      {
        id: 'kit_3_cheap_oil',
        text: '为节省成本偷偷减少了高汤熬制时间，多加味精提鲜。',
        risk: 'risky',
        feedback: '虽然味道浓烈，但汤底寡淡，雨姐尝出一口便皱起眉头，严厉告诫做饭不可投机取巧。',
        effects: { affection: -3, integrity: -8, money: 40, ap: -1 },
        advanceRoute: 'kitchen',
        next: 'HUB'
      }
    ]
  },

  route_kitchen_repeat: {
    id: 'route_kitchen_repeat',
    title: '灶前勤劳',
    scene: 'kitchen',
    narration:
      '厨房永远热火朝天。你熟练地系上围裙，烧柴、洗菜、翻炒家常菜，在日复一日的烟火气中磨砺心性与手艺。',
    dialogue: [
      {
        character: 'peisi',
        text: '有杰克兄弟在，后厨这根顶梁柱就算立稳了！',
        expression: 'happy',
        pose: 'bellows'
      },
      {
        character: 'jack',
        text: '来，佩斯哥，这锅出锅咱俩先尝尝咸淡。',
        expression: 'happy',
        pose: 'working'
      }
    ],
    choices: [
      {
        id: 'kit_rep_work',
        text: '踏踏实实做一整锅家常烩菜，分发给院内众人。',
        feedback: '饭菜热气腾腾，大家吃得心满意足，你在大院的威信与好感稳步积累。',
        effects: { affection: 2, integrity: 1, money: 15, ap: -1 },
        next: 'HUB'
      }
    ]
  },

  // ==================== 支线二：猪圈（老蒯/劳作） ====================
  route_pigpen_1: {
    id: 'route_pigpen_1',
    title: '后圈力气',
    scene: 'pigpen',
    narration:
      '后院猪圈泥泞满地。老蒯正费力地提起重达百斤的泔水木桶，腰板明显有些吃不消，脚步摇晃。',
    dialogue: [
      {
        character: 'laokuai',
        text: '（咬牙发力）这几头大肥猪……一天到晚就知道催食……',
        expression: 'angry'
      },
      {
        character: 'jack',
        text: '蒯哥，这桶太沉了，放着我来！',
        expression: 'serious',
        pose: 'working'
      },
      {
        character: 'laokuai',
        text: '哼，别把衣裳弄脏了又找雨姐告状。',
        expression: 'proud'
      }
    ],
    choices: [
      {
        id: 'pig_1_carry_all',
        text: '“蒯哥你闪开！”大步上前单手拎起泔水桶，稳稳倒入食槽，顺手抓起铁锹清理圈粪。',
        feedback: '老蒯揉了揉发酸的腰，默默递给你一副干净的加厚劳保手套，眼中的戒心明显软化。',
        effects: { laokuaiBond: 6, laokuaiAlert: -4, integrity: 3, ap: -1 },
        advanceRoute: 'pigpen',
        next: 'HUB'
      },
      {
        id: 'pig_1_stand_safe',
        text: '站在干燥处指挥：“蒯哥慢点倒，别溅在鞋上，地面可滑！”',
        risk: 'mixed',
        feedback: '老蒯闷哼一声自顾自倒完，低着头自言自语：“动嘴皮子谁不会。”',
        effects: { laokuaiBond: 1, laokuaiAlert: 2, ap: -1 },
        advanceRoute: 'pigpen',
        next: 'HUB'
      },
      {
        id: 'pig_1_take_photo',
        text: '掏出手机近距离抓拍老蒯喂猪的狼狈瞬间，准备发到社交平台。',
        risk: 'negative',
        feedback: '老蒯勃然大怒，猛地侧身用胳膊挡住镜头，脸色铁青地摔了水瓢。',
        effects: { laokuaiAlert: 8, laokuaiBond: -5, setFlags: { liveSkill: true }, ap: -1 },
        advanceRoute: 'pigpen',
        next: 'HUB'
      }
    ]
  },

  route_pigpen_2: {
    id: 'route_pigpen_2',
    title: '肥猪点卯',
    scene: 'pigpen',
    narration:
      '院圈里几头大黑猪养得膘肥体壮。雨姐拿着草料笑眯眯走来，准备给盛宴的主角挑猪起名，墙头大鹅探头观望。',
    dialogue: [
      {
        character: 'yujie',
        text: '杰克，后天盛宴就看这头三百斤的大黑猪了！你给起个威风响亮的名字！',
        expression: 'serious'
      },
      {
        character: 'jack',
        text: '这身板确实壮实，毛皮油光水滑的！',
        expression: 'happy'
      },
      {
        character: 'goose',
        text: '嘎——嘎！（在墙头煽风点火）'
      }
    ],
    choices: [
      {
        id: 'pig_2_name_good',
        text: '“叫它‘关东大元帅’！养得威武雄壮，盛宴全村都沾福气！”',
        feedback: '雨姐听了哈哈大笑，拍着猪背连声称赞好彩头。',
        effects: { affection: 6, integrity: 3, ap: -1 },
        advanceRoute: 'pigpen',
        next: 'HUB'
      },
      {
        id: 'pig_2_feed_extra',
        text: '自己掏钱从集市买来精细苞米面，亲自给猪加餐调理肉质。',
        risk: 'mixed',
        feedback: '大黑猪吃得欢实，肉质更佳，但你的钱包着实缩水了一截。',
        effects: { affection: 4, integrity: 4, money: -20, ap: -1 },
        advanceRoute: 'pigpen',
        next: 'HUB'
      },
      {
        id: 'pig_2_tease_goose',
        text: '转身抓起泥丸扔向墙头探头探脑的大鹅，企图逗弄村霸。',
        risk: 'risky',
        feedback: '大鹅扑腾着翅膀凌空反扑，啄得你抱头乱窜，雨姐和老蒯在旁看得又气又笑。',
        effects: { goose: 1, affection: 2, laokuaiAlert: 2, ap: -1 },
        advanceRoute: 'pigpen',
        next: 'HUB'
      }
    ]
  },

  route_pigpen_3: {
    id: 'route_pigpen_3',
    title: '力拔山兮',
    scene: 'pigpen',
    narration:
      '出栏分肉的大日子！宰好的半扇猪足有一百六十多斤，横在案台上沉甸甸的。雨姐正准备独自扛起运往冷库。',
    dialogue: [
      {
        character: 'yujie',
        text: '都让开点！俺一个人扛就行，别碰着你们！',
        expression: 'serious',
        pose: 'carrying'
      },
      {
        character: 'jack',
        text: '（深吸一口气，双脚扎稳马步）雨姐，今天让我来证明自己！',
        expression: 'serious',
        pose: 'working'
      },
      {
        character: 'laokuai',
        text: '一百六十多斤呢，可别闪了外国腰。',
        expression: 'proud'
      }
    ],
    choices: [
      {
        id: 'pig_3_hero_carry',
        text: '大吼一声咬紧牙关，独自将整扇猪肉扛在肩头，步履稳健走完大半个院落！',
        feedback: '全院响起惊呼与喝彩！雨姐眼中异彩连连，惊喜于你的担当；老蒯也不禁暗暗点头。',
        effects: { affection: 12, yujieSoftness: 8, laokuaiBond: 6, integrity: 5, addItem: 'pork', ap: -1 },
        advanceRoute: 'pigpen',
        next: 'HUB'
      },
      {
        id: 'pig_3_coop_carry',
        text: '“姐，咱们一人抬一头，谁也别硬撑！”与雨姐同心协力抬着猪肉平稳送入仓房。',
        feedback: '两人步调一致配合默契，呼吸相闻间，雨姐对你报以温暖踏实的微笑。',
        effects: { affection: 8, yujieSoftness: 0, integrity: 3, ap: -1 },
        advanceRoute: 'pigpen',
        next: 'HUB'
      },
      {
        id: 'pig_3_stand_cheer',
        text: '站在一旁使劲鼓掌加油：“雨姐无敌！雨姐加油！”',
        risk: 'negative',
        feedback: '雨姐独自将重担卸下，擦了擦额头汗水，眼底掠过一丝淡淡的落寞。',
        effects: { affection: 1, yujieSoftness: -6, ap: -1 },
        advanceRoute: 'pigpen',
        next: 'HUB'
      }
    ]
  },

  // ==================== 支线三：村口大集（翠花/集市） ====================
  route_market_1: {
    id: 'route_market_1',
    title: '集市讲价',
    scene: 'market',
    narration:
      '村口大集人头攒动，吆喝声此起彼伏。翠花姐正蹲在干货摊前，嗑着瓜子现场向你传授独家砍价秘术。',
    dialogue: [
      {
        character: 'cuihua',
        text: '小老外学着点！买东西不能露怯，摊主要价十块，你张口就得砍到三块！气势要足！',
        expression: 'happy',
        pose: 'livestream'
      },
      {
        character: 'jack',
        text: '这……这在国际贸易里叫价格战吧？',
        expression: 'embarrassed'
      },
      {
        character: 'cuihua',
        text: '管它啥战，能省下两把苞米钱就是好汉！',
        expression: 'gossip'
      }
    ],
    choices: [
      {
        id: 'mkt_1_english_bargargain',
        text: '运用流利的中英双语混合砍价，把算盘摊主侃得晕头转向主动让利。',
        feedback: '摊主被你的热情和洋腔逗乐，乐呵呵地抹了零头还送了半斤干辣椒。',
        effects: { affection: 3, money: 15, integrity: 2, ap: -1 },
        advanceRoute: 'market',
        next: 'HUB'
      },
      {
        id: 'mkt_1_assistant',
        text: '踏踏实实帮翠花姐扛着大包小包，在后方充当保镖与苦力。',
        feedback: '翠花姐对你的体贴赞不绝口，塞给你一大把刚炒熟的南瓜子。',
        effects: { affection: 3, integrity: 2, ap: -1 },
        advanceRoute: 'market',
        next: 'HUB'
      },
      {
        id: 'mkt_1_spend_wild',
        text: '不问价格见啥买啥，大手大脚把农家乐的采购金花了个精光。',
        risk: 'negative',
        feedback: '买回一堆华而不实的小物件，回院后被老蒯翻着白眼在账本上重重记了一笔。',
        effects: { money: -40, laokuaiAlert: 6, integrity: -4, ap: -1 },
        advanceRoute: 'market',
        next: 'HUB'
      }
    ]
  },

  route_market_2: {
    id: 'route_market_2',
    title: '市井秘闻',
    scene: 'market',
    narration:
      '干货摊后，翠花神秘兮兮地把你拉进背风处，吐了口瓜子皮，开始向你兜售大院内外的独家情报。',
    dialogue: [
      {
        character: 'cuihua',
        text: '杰克啊，姐跟你说真心话。雨姐虽然风风火火像个爷们，但心里最稀罕后山的软枣，更稀罕有人能知冷知热疼她。',
        expression: 'gossip'
      },
      {
        character: 'jack',
        text: '（暗自记下这些细节）翠花姐，那老蒯哥平时最在意什么？',
        expression: 'serious'
      },
      {
        character: 'cuihua',
        text: '老蒯呀，嘴硬心软，手里那瓶甜奶就是他的命根子，最怕别人看轻他木工手艺！',
        expression: 'happy'
      }
    ],
    choices: [
      {
        id: 'mkt_2_buy_info',
        text: '爽快买下翠花摊上的五斤红瓜子，诚恳向她打听大院每一个人的脾气秉性。',
        feedback: '翠花喜笑颜开，将雨姐与老蒯当年的创业往事全盘托出，让你对这大院有了极深的理解。',
        effects: { affection: 5, money: -10, integrity: 3, setFlag: 'knowsTaste', ap: -1 },
        advanceRoute: 'market',
        next: 'HUB'
      },
      {
        id: 'mkt_2_free_listen',
        text: '听完情报拔腿就走，一分钱瓜子也不买。',
        risk: 'mixed',
        feedback: '情报虽到手，但翠花冲着你的背影撇了撇嘴：“这外国小伙，真够抠门的。”',
        effects: { setFlag: 'knowsTaste', integrity: -2, ap: -1 },
        advanceRoute: 'market',
        next: 'HUB'
      },
      {
        id: 'mkt_2_gossip_back',
        text: '顺着话茬八卦追问老蒯和雨姐的感情裂痕与私房钱藏匿点。',
        risk: 'negative',
        feedback: '翠花眼神变得警惕起来，收起瓜子冷淡地走开：“这种事外人打听啥，嘴上没个把门的。”',
        effects: { laokuaiAlert: 5, affection: -2, integrity: -4, ap: -1 },
        advanceRoute: 'market',
        next: 'HUB'
      }
    ]
  },

  route_market_3: {
    id: 'route_market_3',
    title: '镜头乾坤',
    scene: 'market',
    cg: 'yujie/cg_live_v2.png',
    narration:
      '集市中央，翠花架着手机支架正在卖力直播。屏幕上飞速刷过各地点赞，但由于讲解单调，观众停留极短。',
    dialogue: [
      {
        character: 'cuihua',
        text: '家人们！正宗笨榨大豆油！三二一上链接……哎呀怎么才卖出两单呢！',
        expression: 'happy'
      },
      {
        character: 'jack',
        text: '镜头前要展示真实的生活场景，得讲人情味和乡村故事！',
        expression: 'happy'
      },
      {
        character: 'cuihua',
        text: '那你快来镜头前露个脸，给老铁们整个活！',
        expression: 'livestream'
      }
    ],
    choices: [
      {
        id: 'mkt_3_learn_live',
        text: '认真入镜配合翠花即兴编排中英结合的乡村二人转，生动展示农货源头品质。',
        feedback: '直播间瞬间涌入上千观众，点赞破万！翠花拉着你非要拜师学现代互联网运营。',
        effects: { affection: 4, integrity: 4, money: 20, setFlag: 'liveSkill', ap: -1 },
        advanceRoute: 'market',
        next: 'HUB'
      },
      {
        id: 'mkt_3_carry_stuff',
        text: '默默帮翠花把几大箱未售出的笨榨油搬上三轮车，做好后勤保障。',
        feedback: '虽然没参与镜头，但你的踏实勤快赢得了集市街坊的一致好评。',
        effects: { affection: 3, integrity: 3, ap: -1 },
        advanceRoute: 'market',
        next: 'HUB'
      },
      {
        id: 'mkt_3_hype_script',
        text: '建议剧本式摆拍，虚构“破产悲惨身世”来博取网友同情冲销量。',
        risk: 'negative',
        feedback: '翠花连连摆手，雨姐在旁听见更是严词厉色：“咱大院做人做事堂堂正正，绝不玩假把式！”',
        effects: { affection: -4, integrity: -10, ap: -1 },
        advanceRoute: 'market',
        next: 'HUB'
      }
    ]
  },

  // ==================== 支线四：小河边（雨姐/心动主线） ====================
  route_riverside_1: {
    id: 'route_riverside_1',
    title: '夕照清波',
    scene: 'riverside',
    narration:
      '落日熔金，村旁的小河泛着粼粼波光。雨姐独自坐在河滩的大青石上，手里扯着一根枯草，望着远方出神。',
    dialogue: [
      {
        character: 'yujie',
        text: '杰克……你说大洋彼岸的美国，也有这样安静的河沟和麦田吗？',
        expression: 'gentle'
      },
      {
        character: 'jack',
        text: '有河，但没有这般让人心神安宁的炊烟，更没有像你这样真实纯粹的人。',
        expression: 'gentle'
      },
      {
        character: 'yujie',
        text: '（低下头笑了笑）就你会说话，姐天天跟泥巴木头打交道，粗人一个。',
        expression: 'shy'
      }
    ],
    choices: [
      {
        id: 'riv_1_deep_talk',
        text: '轻声坐在她身旁：“我穿过半个地球来到这里，就是为了寻找这份最纯粹的生活。”',
        feedback: '雨姐微微侧头看着你，眼底闪烁着平日罕见的温柔，嘴角扬起恬静的微笑。',
        effects: { affection: 8, yujieSoftness: 5, laokuaiAlert: 4, ap: -1 },
        advanceRoute: 'riverside',
        next: 'HUB'
      },
      {
        id: 'riv_1_joke',
        text: '讲起自己在农场抓火鸡被追赶的滑稽糗事，把她逗得前仰后合。',
        risk: 'mixed',
        feedback: '雨姐笑得爽朗开怀，一把搂住你的肩膀哈哈大笑，气氛轻松而热烈。',
        effects: { affection: 6, yujieSoftness: -3, ap: -1 },
        advanceRoute: 'riverside',
        next: 'HUB'
      },
      {
        id: 'riv_1_business',
        text: '“这片河滩风景绝佳，要是圈起来搞收费垂钓和农家露营，一年能净赚不少！”',
        risk: 'mixed',
        feedback: '雨姐无奈地摇了摇头，叹气道：“你呀，满脑子都是生意经，就不能安安静静看看景。”',
        effects: { affection: 1, yujieSoftness: -5, money: 10, ap: -1 },
        advanceRoute: 'riverside',
        next: 'HUB'
      }
    ]
  },

  route_riverside_2: {
    id: 'route_riverside_2',
    title: '芦花微澜',
    scene: 'riverside',
    narration:
      '晚风吹拂过芦苇丛，沙沙作响。雨姐今天特意换下了沾着油渍的旧工装，换上一件干净整洁的格子衬衫。',
    dialogue: [
      {
        character: 'yujie',
        text: '今儿个大院不忙，俺顺道出来透透气……你、你总盯着俺瞅啥？',
        expression: 'shy'
      },
      {
        character: 'jack',
        text: '换了新衣裳，感觉整个人都不一样了，特别好看。',
        expression: 'gentle'
      }
    ],
    choices: [
      {
        id: 'riv_2_soft_jujube',
        text: '从怀里掏出细心擦拭干净的深山野软枣：“后山亲手摘的，知道你最爱吃这个。”',
        condition: { hasItem: 'softJujube', flag: 'knowsTaste' },
        lockedHint: '需要随身带软枣，且平日多打听她的心头好',
        feedback: '雨姐接过软枣，眼圈微红，小心翼翼咬了一口，低声说这是她今年吃过最甜的果子。',
        effects: { affection: 14, yujieSoftness: 8, laokuaiAlert: 6, removeItem: 'softJujube', ap: -1 },
        advanceRoute: 'riverside',
        next: 'HUB'
      },
      {
        id: 'riv_2_flower',
        text: '递上一束采自向阳坡、沾着露水的淡紫色野花：“送给你，雨姐。”',
        condition: { hasItem: 'flower' },
        lockedHint: '需要随身带一束后山采来的冬野花',
        feedback: '雨姐捧着野花，脸颊浮现少女般的红晕，有些局促地别在耳后。',
        effects: { affection: 10, yujieSoftness: 6, laokuaiAlert: 8, removeItem: 'flower', ap: -1 },
        advanceRoute: 'riverside',
        next: 'HUB'
      },
      {
        id: 'riv_2_sing',
        text: '清了清嗓子，迎着晚风为她轻声哼唱一首悠扬舒缓的民谣。',
        feedback: '歌声随水流飘荡，雨姐静静倾听，目光中流淌着深沉的依恋。',
        effects: { affection: 6, yujieSoftness: 4, laokuaiAlert: 5, ap: -1 },
        advanceRoute: 'riverside',
        next: 'HUB'
      },
      {
        id: 'riv_2_awkward_joke',
        text: '调侃道：“姐，你今天换了身衣服，看着倒真像个城里阔太太！”',
        risk: 'negative',
        feedback: '雨姐有些难为情地拽了拽衣角，尴尬地笑了两声，气氛顿时有些冷场。',
        effects: { affection: -2, yujieSoftness: -4, ap: -1 },
        advanceRoute: 'riverside',
        next: 'HUB'
      }
    ]
  },

  route_riverside_3: {
    id: 'route_riverside_3',
    title: '此夜无眠',
    scene: 'riverside',
    narration:
      '夜幕降临，月光洒在冰冷的河面上。两人并肩坐在倒伏的白桦树干上，呼出的白气在月色下交织融汇。',
    dialogue: [
      {
        character: 'yujie',
        text: '（手指紧紧扣着树皮，声音微颤）杰克……这十三天眼瞅着就到底了……你走以后，俺这心里怕是要空落落的……',
        expression: 'shy'
      },
      {
        character: 'jack',
        text: '雨姐，这十几天是我这辈子过得最踏实的日子。',
        expression: 'gentle'
      }
    ],
    choices: [
      {
        id: 'riv_3_coat',
        text: '解开厚实的军大衣披在她冰凉的肩头，轻轻握住她的手：“只要你一句话，我哪也不去。”',
        condition: { hasItem: 'militaryCoat' },
        lockedHint: '需要准备一件厚实防风的军大衣',
        outcomes: [
          {
            condition: { flag: 'promiseLaokuai' },
            feedback: '雨姐身躯微微一颤，将头靠在你的肩头，泪水无声滑落；然而对老蒯的先期诺言，正悄然在命运中埋下两难的暗礁。',
            effects: { affection: 18, yujieSoftness: 10, laokuaiAlert: 10, removeItem: 'militaryCoat', setFlags: { promiseYujie: true, doublePromise: true }, ap: -1 }
          },
          {
            feedback: '雨姐身躯微微一颤，将头靠在你的肩膀上，眼泪无声地打湿了你的衣襟。',
            effects: { affection: 18, yujieSoftness: 10, laokuaiAlert: 10, removeItem: 'militaryCoat', setFlag: 'promiseYujie', ap: -1 }
          }
        ],
        advanceRoute: 'riverside',
        next: 'HUB'
      },
      {
        id: 'riv_3_hold_hands',
        text: '鼓起勇气坚定握住她粗糙而温暖的双手：“雨姐，遇见你是我这一生最大的幸运。”',
        risk: 'risky',
        outcomes: [
          {
            condition: { flag: 'promiseLaokuai' },
            feedback: '两人的心跳在此刻无比清晰，但你此前对老蒯许下的誓言，让这份交握的双手平添了沉重的风暴前兆。',
            effects: { affection: 12, yujieSoftness: 6, laokuaiAlert: 12, setFlags: { promiseYujie: true, doublePromise: true }, ap: -1 }
          },
          {
            feedback: '两人的心跳在此刻无比清晰，但远处的狗吠声提醒着这段情感背后的沉重。',
            effects: { affection: 12, yujieSoftness: 6, laokuaiAlert: 12, setFlag: 'promiseYujie', ap: -1 }
          }
        ],
        advanceRoute: 'riverside',
        next: 'HUB'
      },
      {
        id: 'riv_3_stay_silent',
        text: '克制住内心情感，默默脱下自己的围巾递给她，静静陪她看河水流淌。',
        feedback: '千言万语化作无声的相伴，雨姐深深看了你一眼，将围巾紧紧贴在胸口。',
        effects: { affection: 8, integrity: 4, ap: -1 },
        advanceRoute: 'riverside',
        next: 'HUB'
      }
    ]
  },

  // ==================== 支线五：堂屋热炕（老蒯/知己与清醒浪漫五幕） ====================
  route_laokuai_1: {
    id: 'route_laokuai_1',
    title: '柴棚试水',
    scene: 'yard',
    narration:
      '柴房外的木垛旁，老蒯正独自弓着腰费力地抡斧劈柴。沉重的硬杂木震得他虎口发麻，木屑纷飞间尽是沉默。',
    dialogue: [
      {
        character: 'laokuai',
        text: '（气喘吁吁地挥斧）……这山里的硬柞木，死沉死硬……',
        expression: 'angry'
      },
      {
        character: 'jack',
        text: '蒯哥歇会儿，我来搭把手。',
        expression: 'serious',
        pose: 'working'
      }
    ],
    choices: [
      {
        id: 'lao_1_carry_wood',
        text: '一言不发走上前，默默将他劈好散落的柴块抱起，整整齐齐码成避风的高垛。',
        feedback: '老蒯停下斧子擦了把汗，看了眼码得笔直的柴垛，默默递给你一碗热水。',
        effects: { laokuaiBond: 6, laokuaiAlert: -4, integrity: 2, ap: -1 },
        advanceRoute: 'laokuai',
        next: 'HUB'
      },
      {
        id: 'lao_1_give_milk',
        text: '奉上一整排冰镇开胃的 AD 钙奶：“哥，歇口劲，喝口奶润润嗓子！”',
        condition: { hasItem: 'adMilk' },
        lockedHint: '需要随身带一整排AD钙奶',
        feedback: '老蒯眼睛一亮，利索地插上吸管美滋滋吸了一大口，嘴角难得露出一丝笑意。',
        effects: { laokuaiBond: 8, laokuaiAlert: -8, removeItem: 'adMilk', ap: -1 },
        advanceRoute: 'laokuai',
        next: 'HUB'
      },
      {
        id: 'lao_1_grab_axe',
        text: '一把夺过斧头卖弄力气：“哥你这身板不行，看我给你表演一斧两半！”',
        risk: 'negative',
        feedback: '老蒯被推得一个趔趄，脸色铁青地拍了拍衣角：“城里人力气大，俺老蒯不奉陪。”',
        effects: { laokuaiAlert: 8, laokuaiBond: -5, ap: -1 },
        advanceRoute: 'laokuai',
        next: 'HUB'
      }
    ]
  },

  route_laokuai_2: {
    id: 'route_laokuai_2',
    title: '木工房疗伤',
    scene: 'hall',
    narration:
      '昏暗的木工房里，老蒯正在刨制一把新木椅，锋利的铁刨刃不慎划破了他的掌心，鲜血汩汩直流。',
    dialogue: [
      {
        character: 'laokuai',
        text: '（捂着伤口龇牙咧嘴）倒霉催的……不碍事，找块烂布包上就行……',
        expression: 'wronged'
      },
      {
        character: 'jack',
        text: '伤口深着呢，烂布容易感染，必须消毒包扎！',
        expression: 'serious'
      }
    ],
    choices: [
      {
        id: 'lao_2_bandage_care',
        text: '迅速取来急救药箱，用碘伏细致清洗伤口，轻轻为他缠上透气绷带。',
        feedback: '老蒯看着你专注而轻柔的手法，身子微微绷紧，眼神中浮现出前所未有的动容。',
        effects: { laokuaiBond: 8, laokuaiRomance: 5, laokuaiAlert: -5, integrity: 3, ap: -1 },
        advanceRoute: 'laokuai',
        next: 'HUB'
      },
      {
        id: 'lao_2_clean_bench',
        text: '递上止血贴后，默默拿起扫帚替他把工作台上的锋利刨花与铁钉清扫干净。',
        feedback: '老蒯包好手掌，坐在炕沿看着整洁的作坊，长长舒了一口气。',
        effects: { laokuaiBond: 5, laokuaiAlert: -3, integrity: 2, ap: -1 },
        advanceRoute: 'laokuai',
        next: 'HUB'
      },
      {
        id: 'lao_2_yell_yujie',
        text: '扯开嗓子冲院里大喊：“雨姐快来啊！老蒯哥手流血要不行啦！”',
        risk: 'negative',
        feedback: '老蒯急得一把捂住你的嘴，涨红了脸：“大惊小怪的！你想让全村都来看俺笑话？！”',
        effects: { laokuaiAlert: 7, laokuaiBond: -4, ap: -1 },
        advanceRoute: 'laokuai',
        next: 'HUB'
      }
    ]
  },

  route_laokuai_3: {
    id: 'route_laokuai_3',
    title: '温酒论心',
    scene: 'hall',
    narration:
      '深夜堂屋，炕桌上温着一壶辛辣的老白干。老蒯倒了两盅烈酒，推给你一盅，眼底藏着半生的失意与压抑。',
    dialogue: [
      {
        character: 'laokuai',
        text: '外人都笑话俺老蒯是个吃软饭的娇夫……可谁知道当年大院起家，俺熬了多少个通宵拉木料、砌猪圈……',
        expression: 'wronged',
        pose: 'drinking'
      },
      {
        character: 'jack',
        text: '蒯哥，满院的桌椅板凳和规整格局，明眼人都看得出你的付出。',
        expression: 'gentle'
      }
    ],
    choices: [
      {
        id: 'lao_3_hero_praise',
        text: '端起酒杯一饮而尽：“大院能有今天，全凭你在后方撑着！蒯哥，我敬你是条顶天立地的汉子！”',
        feedback: '老蒯眼眶通红，猛地将酒饮尽，重重拍在你的手臂上：“好兄弟！这十里八村就你懂我！”',
        effects: { laokuaiBond: 10, laokuaiAlert: -8, integrity: 4, setFlag: 'brother', ap: -1 },
        advanceRoute: 'laokuai',
        next: 'HUB'
      },
      {
        id: 'lao_3_gentle_touch',
        text: '挨着他身侧静静坐下，伸手替他拭去眼角沁出的泪痕，轻声聆听他的苦闷。',
        risk: 'risky',
        feedback: '昏黄灯影下，老蒯身子微颤，两人呼吸相闻，空气中弥漫着深沉而微妙的温存。',
        effects: { laokuaiRomance: 12, laokuaiBond: 4, laokuaiAlert: -4, ap: -1 },
        advanceRoute: 'laokuai',
        next: 'HUB'
      },
      {
        id: 'lao_3_preach',
        text: '“雨姐在外打拼更不容易，作为男人，你理应多顺着她、包容她。”',
        risk: 'negative',
        feedback: '老蒯端着酒杯的手僵住，苦笑着将酒洒在地上：“是啊，连你也觉得俺是个累赘。”',
        effects: { laokuaiBond: -6, laokuaiAlert: 8, affection: 3, ap: -1 },
        advanceRoute: 'laokuai',
        next: 'HUB'
      }
    ]
  },

  route_laokuai_4: {
    id: 'route_laokuai_4',
    title: '门槛长谈',
    scene: 'hall',
    cg: 'yujie/v24_route_laokuai_4.png',
    narration:
      '清晨的阳光斜照在堂屋门槛上。老蒯神智清醒，穿着洗得发白的旧棉袄，坐在门槛上认真而庄重地等待着你。',
    dialogue: [
      {
        character: 'laokuai',
        text: '杰克，咱哥俩坐下谈谈。俺这几天心里翻江倒海……你对俺、对这大院，到底揣着啥心思？今天咱俩把话挑明，不许揣着明白装糊涂。',
        expression: 'proud'
      },
      {
        character: 'jack',
        text: '蒯哥，你说得对，咱们今天坦诚相对，绝不藏着掖着。',
        expression: 'serious'
      }
    ],
    choices: [
      {
        id: 'lao_4_soulmate_boundary',
        text: '坦诚抱拳：“蒯哥，你是我这辈子最佩服的过命知己兄弟，这份手足义气清清白白，永不改变！”',
        feedback: '老蒯长舒了一口气，脸上露出无比释然爽朗的笑容：“有你这句敞亮话，哥这辈子认你这个亲兄弟！”',
        effects: { laokuaiBond: 14, laokuaiAlert: -12, setFlags: { honestBoundary: true }, clearFlags: ['promiseLaokuai'], ap: -1 },
        advanceRoute: 'laokuai',
        next: 'HUB'
      },
      {
        id: 'lao_4_romance_confess',
        text: '直视他的双眼，郑重握住他的手掌：“我不只是把你当兄弟，我心里有你，盛宴之后我想陪你一起生活。”',
        risk: 'risky',
        outcomes: [
          {
            condition: { flag: 'promiseYujie' },
            feedback: '老蒯定定看着你良久，眼中泛起泪光并紧紧扣住你的手；然而你先前对雨姐的誓言，已让双重承诺的修罗风暴悄然成形。',
            effects: { laokuaiRomance: 20, laokuaiBond: 6, laokuaiAlert: -6, setFlags: { promiseLaokuai: true, mutualLaokuaiConsent: true, doublePromise: true }, ap: -1 }
          },
          {
            feedback: '老蒯定定看着你良久，眼中泛起泪光，粗糙的手指慢慢扣紧：“……好，只要你不嫌弃，哥往后陪你。”',
            effects: { laokuaiRomance: 20, laokuaiBond: 6, laokuaiAlert: -6, setFlags: { promiseLaokuai: true, mutualLaokuaiConsent: true }, ap: -1 }
          }
        ],
        advanceRoute: 'laokuai',
        next: 'HUB'
      },
      {
        id: 'lao_4_vague_dodge',
        text: '含糊其辞：“害，大院挺热闹的，大家都是一家人嘛，走一步看一步呗。”',
        risk: 'negative',
        feedback: '老蒯眼中的期待瞬间熄灭，缓缓抽出手站起身：“行，俺明白了。外头风大，回你的屋吧。”',
        effects: { laokuaiAlert: 14, laokuaiRomance: -10, laokuaiBond: -8, ap: -1 },
        advanceRoute: 'laokuai',
        next: 'HUB'
      }
    ]
  },

  route_laokuai_5: {
    id: 'route_laokuai_5',
    title: '信物托付',
    scene: 'hall',
    cg: 'yujie/v24_route_laokuai_5.png',
    narration:
      '木工房内暖炉熊熊。老蒯从锁着的柜子深处取出一只红绸布包裹，小心翼翼层层掀开，露出一尊精雕细琢的红木雕刻。',
    dialogue: [
      {
        character: 'laokuai',
        text: '这是俺用百年红松心雕了整整七天的信物……底座上刻着你的名字。杰克，这是俺老蒯这辈子最拿得出手的家当。',
        expression: 'proud'
      },
      {
        character: 'jack',
        text: '（接过木雕，触手温润）这纹理和刀功……倾注了你全部的心血。',
        expression: 'gentle'
      }
    ],
    choices: [
      {
        id: 'lao_5_accept_romance',
        text: '郑重收下木雕贴在心口：“只要有你在，哪里都是我们的家，盛宴之后我们共筑未来。”',
        condition: { flag: 'mutualLaokuaiConsent' },
        lockedHint: '需要老蒯与你彼此达成清醒的双向约定',
        feedback: '老蒯露出这十几天来最温柔舒展的笑容，堂屋里静得能听见彼此平稳的心跳。',
        effects: { laokuaiRomance: 15, laokuaiBond: 8, ap: -1 },
        advanceRoute: 'laokuai',
        next: 'HUB'
      },
      {
        id: 'lao_5_accept_brother',
        text: '双手接过雕像，作为兄弟生死的信物珍藏：“大哥，这份兄弟情义重于泰山，杰克永不相忘！”',
        feedback: '老蒯欣慰地点头，端起 AD 钙奶与你以奶代酒，结下坚不可摧的匠人知己情。',
        effects: { laokuaiBond: 16, integrity: 6, ap: -1 },
        advanceRoute: 'laokuai',
        next: 'HUB'
      },
      {
        id: 'lao_5_reject_crude',
        text: '觉得木头粗糙随手揣进裤兜：“行吧，做个农家小摆件倒挺别致。”',
        risk: 'negative',
        feedback: '老蒯神情一僵，默默收回了伸出的手，作坊里的空气彻底陷入冰点。',
        effects: { laokuaiBond: -12, laokuaiAlert: 12, laokuaiRomance: -15, ap: -1 },
        advanceRoute: 'laokuai',
        next: 'HUB'
      }
    ]
  },

  // ==================== 支线六：后山（自然与大鹅羁绊） ====================
  route_mountain_1: {
    id: 'route_mountain_1',
    title: '林海寻踪',
    scene: 'mountain',
    narration:
      '白雪覆盖的松林苍翠挺拔，枯木桩下长满了肥厚的野生榛蘑。雨姐走在前面为你引路，指尖拂过挂霜的松枝。',
    dialogue: [
      {
        character: 'yujie',
        text: '跟紧姐的脚印，林子里雪深，有些坑洼能没过大腿！',
        expression: 'serious'
      },
      {
        character: 'jack',
        text: '明白！这片林子真是天然宝库，好多珍奇山货。',
        expression: 'happy'
      }
    ],
    choices: [
      {
        id: 'mtn_1_mushroom',
        text: '仔细辨认无毒菌类，采摘了满满一整兜上等野生榛蘑。',
        feedback: '雨姐夸你眼神好，这些名贵野味将成为大宴小鸡炖蘑菇的绝佳用料。',
        effects: { affection: 5, integrity: 3, addItem: 'mushroom', ap: -1 },
        advanceRoute: 'mountain',
        next: 'HUB'
      },
      {
        id: 'mtn_1_flower',
        text: '攀上向阳的悬崖边缘，小心翼翼采下一束顶风傲雪的冬野花。',
        risk: 'risky',
        feedback: '采花虽险，但雨姐看到你带回的野花时，眼底满是惊艳与心疼。',
        effects: { affection: 8, laokuaiAlert: 4, addItem: 'flower', ap: -1 },
        advanceRoute: 'mountain',
        next: 'HUB'
      },
      {
        id: 'mtn_1_run_wild',
        text: '在雪地里放肆打滚撒欢，弄得满身冰碴。',
        risk: 'mixed',
        feedback: '虽然玩得开心，但冻得直哆嗦，雨姐无奈地替你拍打身上的积雪。',
        effects: { affection: 2, yujieSoftness: -2, ap: -1 },
        advanceRoute: 'mountain',
        next: 'HUB'
      }
    ]
  },

  route_mountain_2: {
    id: 'route_mountain_2',
    title: '绝壁甘味',
    scene: 'mountain',
    narration:
      '悬崖背风处生长着一株古老的名贵软枣猕猴桃树，紫红色的熟果挂满枝头，但陡坡泥泞湿滑，稍有不慎便会滑落。',
    dialogue: [
      {
        character: 'yujie',
        text: '俺小时候常来这摘软枣吃……现在的树枝太细，踩空了可不是闹着玩的。',
        expression: 'gentle'
      },
      {
        character: 'jack',
        text: '雨姐你站稳别动，我手长，我来够！',
        expression: 'serious'
      }
    ],
    choices: [
      {
        id: 'mtn_2_climb_safe',
        text: '系好攀爬安全绳，凭借矫健身手稳稳摘下一大兜熟透的甜美软枣。',
        feedback: '软枣完好无损，雨姐迫不及待尝了一颗，甜得眼睛弯成了月牙。',
        effects: { affection: 7, integrity: 4, yujieSoftness: 5, addItem: 'softJujube', ap: -1 },
        advanceRoute: 'mountain',
        next: 'HUB'
      },
      {
        id: 'mtn_2_give_up',
        text: '“太危险了，不能为了几颗野果冒险，我们去平缓处采普通的。”',
        feedback: '虽然少采了珍品，但安全第一的选择展现出成熟稳重的一面。',
        effects: { integrity: 3, affection: 2, ap: -1 },
        advanceRoute: 'mountain',
        next: 'HUB'
      },
      {
        id: 'mtn_2_smash_stick',
        text: '找来一根长树枝盲目用力抽打树冠，试图打落果实。',
        risk: 'negative',
        feedback: '软枣全被砸烂在泥雪里，折断的树枝还险些擦伤雨姐，场面一度非常尴尬。',
        effects: { affection: -3, integrity: -3, ap: -1 },
        advanceRoute: 'mountain',
        next: 'HUB'
      }
    ]
  },

  route_mountain_3: {
    id: 'route_mountain_3',
    title: '鹅王巢穴',
    scene: 'mountain',
    cg: 'yujie/cg_goose_nest_v2.png',
    narration:
      '在松林极深处的灌木丛中，你偶然发现了村霸大鹅的秘密巢穴！草窝里静静躺着几枚温热如玉的特大鹅蛋，远处传来大鹅振翅的警示声。',
    dialogue: [
      {
        character: 'jack',
        text: '（心跳如雷）这就是村霸的命根子……鹅蛋就在眼前，考验胆量的时刻到了。',
        expression: 'serious'
      },
      {
        character: 'goose',
        text: '嘎——！（远方林间传来威严的长啸）'
      }
    ],
    choices: [
      {
        id: 'mtn_3_take_egg',
        text: '身手敏捷地摸走一枚大鹅蛋并迅速撤离！',
        risk: 'risky',
        feedback: '战利品到手！但大鹅在后方发出了愤怒至极的震天长鸣，将你记上了黑名单。',
        effects: { goose: 1, addItem: 'gooseEgg', laokuaiAlert: 3, ap: -1 },
        advanceRoute: 'mountain',
        next: 'HUB'
      },
      {
        id: 'mtn_3_salute',
        text: '整肃衣冠，对着鹅巢庄重三鞠躬，并留下半块干粮以示对野生领主的敬意。',
        feedback: '赶来的大鹅看到未受破坏的巢穴与干粮，歪着头打量你，眼中的敌意开始消解。',
        effects: { goose: 1, integrity: 3, ap: -1 },
        advanceRoute: 'mountain',
        next: 'HUB'
      },
      {
        id: 'mtn_3_retreat',
        text: '屏住呼吸悄无声息地原路退回，秋毫无犯。',
        feedback: '没有打扰生灵的安宁，平静地返回了大院。',
        effects: { integrity: 1, ap: -1 },
        advanceRoute: 'mountain',
        next: 'HUB'
      }
    ]
  },

  // ==================== 日期事件：第 3 天 晨间大鹅突袭（免费） ====================
  ev_goose_attack: {
    id: 'ev_goose_attack',
    title: '霸者横栏',
    scene: 'yard',
    cg: 'yujie/cg_goose_attack_v2.png',
    narration:
      '清晨刚推开房门，一道白色的劲风伴随着凄厉的尖啸扑面而来！村霸大鹅张开两米宽的翅膀，以俯冲之势封锁了整个院落！',
    dialogue: [
      {
        character: 'goose',
        text: '嘎————！！（翻译：此院是我开，闲人纳命来！）',
        pose: 'charge'
      },
      {
        character: 'jack',
        text: '好家伙！大早上的火气这么大？！',
        expression: 'surprised'
      }
    ],
    choices: [
      {
        id: 'goose_a_fight',
        text: '抄起门边的扫帚，摆开架势与村霸正面决斗！',
        risk: 'risky',
        feedback: '你勇武地挥舞扫帚，与大鹅战作一团，虽然裤脚被扯破，但气势上丝毫不落下风。',
        effects: { goose: 1, affection: 3 },
        next: 'ev_goose_fight'
      },
      {
        id: 'goose_a_run',
        text: '三十六计走为上策，连滚带爬逃回屋里反锁房门！',
        feedback: '大鹅在门外耀武扬威地踱步，老蒯在屋里递给你一瓶 AD 钙奶压惊。',
        effects: { laokuaiAlert: -2 },
        next: 'ev_goose_run'
      },
      {
        id: 'goose_a_shout_yujie',
        text: '扯开嗓子呼救：“雨姐救命啊——！鹅要杀人啦！”',
        risk: 'mixed',
        feedback: '雨姐如天神降临般冲出，一把将大鹅按在怀里，哈哈大笑你的胆小。',
        effects: { affection: 5, yujieSoftness: -4 },
        next: 'ev_goose_save'
      }
    ]
  },

  ev_goose_fight: {
    id: 'ev_goose_fight',
    title: '决战晨曦',
    scene: 'yard',
    narration:
      '三分钟鏖战结束，大鹅退居石碾，你衣衫不整地喘着粗气。雨姐趴在窗台上笑得直拍大腿。',
    dialogue: [
      {
        character: 'yujie',
        text: '哈哈哈哈！敢跟全村鹅王死磕到这个份上的，你是头一个！纯爷们！',
        expression: 'laugh'
      },
      {
        character: 'jack',
        text: '呼……呼……这鹅的战斗力，绝对受过特种兵训练！',
        expression: 'embarrassed'
      }
    ],
    choices: [
      {
        id: 'goose_f_stand',
        text: '整理凌乱的衣襟：“下次在擂台上，我一定能降伏它！”',
        feedback: '雨姐赞许地冲你竖起大拇指。',
        effects: { affection: 3, integrity: 2 },
        next: 'HUB'
      }
    ]
  },

  ev_goose_run: {
    id: 'ev_goose_run',
    title: '避其锋芒',
    scene: 'yard',
    narration:
      '你在炕头大口喘气，老蒯吸着酸奶深有同感地拍了拍你的后背：“不丢人，俺天天被它追。”',
    dialogue: [
      {
        character: 'laokuai',
        text: '这大白鹅认生，过阵子混熟了就通人性了。先喝口奶压压惊。',
        expression: 'proud',
        pose: 'drinking'
      },
      {
        character: 'jack',
        text: '（猛吸一口奶）蒯哥，同是天涯沦落人啊！',
        expression: 'gentle'
      }
    ],
    choices: [
      {
        id: 'goose_r_drink',
        text: '接过老蒯递来的 AD 钙奶，两人坐在炕沿相视苦笑。',
        feedback: '共同的受难经历让两人的距离拉近了不少。',
        effects: { laokuaiBond: 4, laokuaiAlert: -3 },
        next: 'HUB'
      }
    ]
  },

  ev_goose_save: {
    id: 'ev_goose_save',
    title: '神兵天降',
    scene: 'yard',
    narration:
      '雨姐单手提着大鹅的后颈皮，像拎公文包一样轻松将它扔回后院，转身将你护在身后。',
    dialogue: [
      {
        character: 'yujie',
        text: '别怕！在大院里只要姐在，谁也动不了你一根汗毛！',
        expression: 'serious'
      },
      {
        character: 'jack',
        text: '雨姐……那一瞬间你身上真的在发光！',
        expression: 'happy'
      }
    ],
    choices: [
      {
        id: 'goose_s_thank',
        text: '由衷赞叹：“雨姐，你就是我的守护女神！”',
        feedback: '雨姐脸色微红，豪爽地拍了拍你的肩头。',
        effects: { affection: 4, yujieSoftness: 2 },
        next: 'HUB'
      }
    ]
  },

  // ==================== 日期事件：第 5 天 晨间雨姐人格定调回响（免费） ====================
  ev_echo_d5: {
    id: 'ev_echo_d5',
    title: '晨曦回响：分工之道',
    scene: 'yard',
    cg: 'yujie/v24_ev_echo_d5.png',
    narration:
      '第五天清晨，大院积雪初晴。雨姐在大水缸前打水，根据这几天的相处，她对待你的语气有了微妙的变化。',
    dialogue: [
      {
        character: 'yujie',
        text: '杰克，这几天磨合下来，大院的活计你摸得差不多了。往后咱俩怎么搭伙，姐听听你的想法。',
        expression: 'gentle'
      },
      {
        character: 'jack',
        text: '我也一直在思考我们在大院里最合适的位置。',
        expression: 'serious'
      }
    ],
    choices: [
      {
        id: 'echo_d5_soft',
        text: '“姐，你平时太累了。往后重活难事我来挑大头，你靠着我就行。”',
        feedback: '雨姐眼底掠过一丝少见的柔情与依恋，轻轻点头应下。',
        effects: { affection: 4, yujieSoftness: 6, integrity: 2 },
        next: 'HUB'
      },
      {
        id: 'echo_d5_balance',
        text: '“按章程各司其职，你负责前台大局，我抓好后勤品控，咱俩并肩干！”',
        feedback: '雨姐爽朗一笑，与你击掌定盟：“妥！咱俩双剑合璧，把大院办红火！”',
        effects: { affection: 4, yujieSoftness: 0, integrity: 4 },
        next: 'HUB'
      },
      {
        id: 'echo_d5_power',
        text: '“全听雨姐发号施令！你指哪我打哪，我甘当你的左右手！”',
        risk: 'mixed',
        feedback: '雨姐霸气地一拍大腿：“好小子！跟着姐，保准少不了你的肉吃！”',
        effects: { affection: 3, yujieSoftness: -6 },
        next: 'HUB'
      }
    ]
  },

  // ==================== 日期事件：第 6 天 赶集日与粉条危机（消耗 1 AP） ====================
  ev_market_day: {
    id: 'ev_market_day',
    title: '十里大集',
    scene: 'market',
    narration:
      '全乡最大的物资大集！锣鼓喧天，人山人海。盛宴筹备进入倒计时，大批紧俏物资正待选购。',
    dialogue: [
      {
        character: 'cuihua',
        text: '杰克快来看！今儿这集可全乎了，军大衣、正宗 AD 钙奶、干货调料样样齐全！',
        expression: 'happy',
        pose: 'livestream'
      },
      {
        character: 'jack',
        text: '好热闹！我得按大院清单把关键物资挑齐。',
        expression: 'happy'
      }
    ],
    choices: [
      {
        id: 'mktd_coat',
        text: '买下厚实气派的防寒军大衣',
        condition: { minMoney: 60 },
        lockedHint: '需要随身带足买大衣的盘缠',
        feedback: '你买下了这件厚实抗风的军大衣，整整齐齐叠好包好，沉甸甸的满是踏实感。',
        effects: { money: -60, addItem: 'militaryCoat' },
        next: 'ev_noodle_man'
      },
      {
        id: 'mktd_ad_milk',
        text: '采购整排 AD 钙奶',
        condition: { minMoney: 25 },
        lockedHint: '需要随身带足买甜奶的零钱',
        feedback: '你利索地买下一整排整整齐齐的 AD 钙奶，吸管插孔完好，老蒯见了必定欢喜。',
        effects: { money: -25, addItem: 'adMilk' },
        next: 'ev_noodle_man'
      },
      {
        id: 'mktd_soft_jujube',
        text: '采购精品礼盒软枣',
        condition: { minMoney: 20 },
        lockedHint: '需要随身带足买山货甜果的零钱',
        feedback: '你挑了一盒颗颗圆润饱满的深山软枣，紫红透亮，甜香四溢。',
        effects: { money: -20, addItem: 'softJujube' },
        next: 'ev_noodle_man'
      },
      {
        id: 'mktd_pass',
        text: '捂紧钱包，先观察集市行情。',
        risk: 'mixed',
        feedback: '守住资金预算，静观其变。',
        effects: {},
        next: 'ev_noodle_man'
      }
    ]
  },

  ev_noodle_man: {
    id: 'ev_noodle_man',
    title: '低价诱惑',
    scene: 'market',
    narration:
      '收摊拐角处，一个神秘商贩把你拉进巷子里，指着几大车散装粉条，开出了不可思议的超低价，声称能帮你省下一大笔盛宴原料钱，甚至当场返利。',
    dialogue: [
      {
        character: 'jack',
        text: '这批“北方纯红薯粉条”怎么价格比正品作坊低了一大半？',
        expression: 'serious'
      },
      {
        character: 'laokuai',
        text: '（暗中扯了扯你的衣角，低语）这是镇上有名的木薯胶水贩子……拿来冒充红薯粉，容易出大事……',
        expression: 'proud'
      }
    ],
    choices: [
      {
        id: 'noodle_cheap_deal',
        text: '价格确实极具诱惑，当场订购这批低价粉条以压缩盛宴成本，并收取返利。（高风险）',
        risk: 'negative',
        feedback: '商贩喜笑颜开地卸货，你握着省下的钱，心里却隐隐升起强烈的不安。',
        effects: { money: 60, integrity: -18, setFlags: { noodleCheap: true, noodleDeal: true }, ap: -1 },
        next: 'HUB'
      },
      {
        id: 'noodle_inspect_reject',
        text: '当场端来热水泡发样品，闻出刺鼻胶味后义正言辞当众揭穿并严词拒绝！',
        feedback: '商贩见行迹败露慌忙收摊逃窜，街坊邻里无不对你的诚信与眼光交口称赞。',
        effects: { integrity: 10, affection: 4, setFlags: { refusedNoodles: true }, ap: -1 },
        next: 'HUB'
      },
      {
        id: 'noodle_buy_premium',
        text: '宁可多花大价钱跑去三十里外的国营老作坊，现拉现采纯正老土豆粉条！',
        risk: 'mixed',
        feedback: '采购虽花费不菲，但带回的纯正老粉条晶莹剔透，雨姐得知后对你的坚守大加赞赏。',
        effects: { money: -50, integrity: 14, affection: 6, setFlags: { refusedNoodles: true }, ap: -1 },
        next: 'HUB'
      }
    ]
  },

  // ==================== 日期事件：第 8 天 晨间雨姐烦恼回响（免费） ====================
  ev_echo_d8: {
    id: 'ev_echo_d8',
    title: '晨曦回响：风雨同舟',
    scene: 'yard',
    cg: 'yujie/v24_ev_echo_d8.png',
    narration:
      '第八天晨起，大院外传来了风言风语，网上甚至出现了关于大院“摆拍假农家”的恶意差评。雨姐坐在石阶上，眼圈泛青。',
    dialogue: [
      {
        character: 'yujie',
        text: '杰克……外头那些人乱嚼舌根，说俺们这农家乐全是剧本摆拍……姐心里堵得慌。',
        expression: 'gentle'
      },
      {
        character: 'jack',
        text: '大院三十年的真实烟火，绝不是几条键盘恶评就能抹杀的。',
        expression: 'serious'
      }
    ],
    choices: [
      {
        id: 'echo_d8_soft_comfort',
        text: '“别看那些恶评。风雨再大有我顶着，只要大院有你，谁也动摇不了我们。”',
        outcomes: [
          {
            condition: { flag: 'promiseLaokuai' },
            feedback: '雨姐感动地拉住你的手腕靠在你肩头；然而这句给雨姐的真心许诺，与你给老蒯的承诺在暗中撞在一起，隐隐埋下了风暴。',
            effects: { affection: 7, yujieSoftness: 8, setFlags: { promiseYujie: true, doublePromise: true } }
          },
          {
            feedback: '雨姐感动地拉住你的手腕，整个人卸下防备靠在你肩头，确认了彼此的依恋。',
            effects: { affection: 7, yujieSoftness: 8, setFlags: { promiseYujie: true } }
          }
        ],
        next: 'HUB'
      },
      {
        id: 'echo_d8_balance_action',
        text: '“用无可挑剔的真实食材和透明账目说话，我全力协助你做好全流程质检！”',
        feedback: '雨姐眼中重新燃起斗志：“好！咱们堂堂正正，用真本事打那些黑子的脸！”',
        effects: { affection: 6, yujieSoftness: 0, integrity: 6 },
        next: 'HUB'
      },
      {
        id: 'echo_d8_power_back',
        text: '“雨姐霸气！有你雷厉风行冲在前面，咱们阵脚乱不了，听你指挥收拾他们！”',
        risk: 'mixed',
        feedback: '雨姐霍然起身，豪迈地拍胸脯：“说得对！看姐今晚怎么在镜头前教他们做人！”',
        effects: { affection: 4, yujieSoftness: -8 },
        next: 'HUB'
      }
    ]
  },

  // ==================== 日期事件：第 9 天 雨姐的烦恼与破局（消耗 1 AP） ====================
  ev_yujie_trouble: {
    id: 'ev_yujie_trouble',
    title: '农庄抉择',
    scene: 'yard',
    narration:
      '第九天上午，雨姐把大家召集到院中。面对经营瓶颈，农家乐急需确立未来的核心转型方向。',
    dialogue: [
      {
        character: 'yujie',
        text: '光靠老客人口口相传撑不住长远，大家集思广益，往后咱们大院该往哪条道走？',
        expression: 'serious'
      },
      {
        character: 'peisi',
        text: '俺只管烧好柴、炖好肉，别的全听雨姐和杰克兄弟的！',
        expression: 'happy'
      }
    ],
    choices: [
      {
        id: 'trouble_streamer_path',
        text: '“开启真实助农直播带货，将北方地道酸菜推向全国！”',
        condition: { flag: 'liveSkill' },
        lockedHint: '需要先在大集跟翠花掌握直播带货的诀窍',
        feedback: '思路大开！雨姐和翠花激动不已，当即确立了诚信助农的互联网直播发展路线。',
        effects: { affection: 8, setFlag: 'livePath', integrity: 4, ap: -1 },
        next: 'HUB'
      },
      {
        id: 'trouble_craft_cook',
        text: '“深耕极致线下餐饮，把杀猪菜做成非遗级名宴，靠过硬手艺立足！”',
        feedback: '回归传统匠心，佩斯和老蒯纷纷赞同，决定进一步打磨烹饪与木工底蕴。',
        effects: { affection: 6, integrity: 6, ap: -1 },
        advanceRoute: 'kitchen',
        next: 'HUB'
      },
      {
        id: 'trouble_quiet_stay',
        text: '默默陪在雨姐身旁，为她倒上一碗热茶，给予无声却坚定的支持。',
        risk: 'mixed',
        feedback: '温情在院中弥漫，雨姐心情舒缓了许多，感激你的长情相伴。',
        effects: { affection: 6, yujieSoftness: 4, ap: -1 },
        next: 'HUB'
      }
    ]
  },

  // ==================== 日期事件：第 10 天 晨间盛宴筹备回响（免费） ====================
  ev_echo_d10: {
    id: 'ev_echo_d10',
    title: '晨曦回响：后路与归宿',
    scene: 'yard',
    cg: 'yujie/v24_ev_echo_d10.png',
    narration:
      '第十天晨光初现。后天便是全村杀猪大宴，盛宴之后十三天之期将满，雨姐在仓房门前与你相对而立。',
    dialogue: [
      {
        character: 'yujie',
        text: '后天就是全村大宴了……忙完这一仗，杰克，你……心里有未来的准信儿没？',
        expression: 'gentle'
      },
      {
        character: 'jack',
        text: '这一路走来，大院的每寸雪地都刻在我的心里。',
        expression: 'gentle'
      }
    ],
    choices: [
      {
        id: 'echo_d10_soft_promise',
        text: '“只要大院有你，这里就是我的归宿，盛宴之后我永远留下来陪你。”',
        outcomes: [
          {
            condition: { flag: 'promiseLaokuai' },
            feedback: '雨姐眼角泪光闪烁，紧紧抱住你；然而给老蒯的那份承诺同样沉甸甸，双向许诺的暗雷已然就位。',
            effects: { affection: 8, yujieSoftness: 8, setFlags: { promiseYujie: true, doublePromise: true } }
          },
          {
            feedback: '雨姐眼角泪光闪烁，紧紧抱住你，声音哽咽而深情。',
            effects: { affection: 8, yujieSoftness: 8, setFlags: { promiseYujie: true } }
          }
        ],
        next: 'HUB'
      },
      {
        id: 'echo_d10_balance_plan',
        text: '“大宴办好，咱俩合伙把大院做成全省模范标杆，共创一番事业！”',
        feedback: '雨姐重重拍了拍你的后背，豪情万丈：“好！咱们携手并进，天下无敌！”',
        effects: { affection: 6, yujieSoftness: 0, integrity: 6 },
        next: 'HUB'
      },
      {
        id: 'echo_d10_power_agree',
        text: '“有雨姐当家做主带飞，我就踏踏实实在大院享清福当管账的！”',
        risk: 'mixed',
        feedback: '雨姐朗声大笑，一把将你搂进怀里：“妥了！往后有姐在，没人敢欺负你！”',
        effects: { affection: 5, yujieSoftness: -8 },
        next: 'HUB'
      }
    ]
  },

  // ==================== 特殊插曲库（6个，不扣 AP，seen flag 防重） ====================
  ev_remedy_check: {
    id: 'ev_remedy_check',
    title: '危机救赎',
    scene: 'market',
    cg: 'yujie/v24_ev_remedy_check.png',
    narration:
      '你看着手里那批劣质粉条样品，良心备受煎熬。趁着盛宴前夕集市质监作坊开门，这是销毁隐患的最后机会。',
    dialogue: [
      {
        character: 'jack',
        text: '劣质粉条一旦下锅，盛宴必成灾难，大院招牌也会毁于一旦。必须当机立断！',
        expression: 'serious'
      },
      {
        character: 'cuihua',
        text: '（路过）杰克，我看那家粉条颜色不对劲，你可千万留神啊！',
        expression: 'gossip'
      }
    ],
    choices: [
      {
        id: 'remedy_pay_fix',
        text: '自掏腰包补足差价，当场全部销毁劣质木薯粉，换入国营作坊正品特级老粉条！',
        feedback: '作坊主对你的担当肃然起敬，劣质原料当场化为飞灰，盛宴品质彻底化险为夷！',
        effects: {
          money: -40,
          integrity: 18,
          affection: 4,
          setFlags: { noodleRemedied: true, remedyCheckSeen: true },
          clearFlags: ['noodleCheap', 'noodleDeal']
        },
        next: 'HUB'
      },
      {
        id: 'remedy_mix_try',
        text: '试图掺入一半正品混用，心存侥幸以求蒙混过关。（危险）',
        risk: 'negative',
        feedback: '试煮后粉条断成黏糊脓汤，品质隐患不但没有排除，反而浪费了额外精力。',
        effects: { money: -20, integrity: -10, setFlags: { remedyCheckSeen: true } },
        next: 'HUB'
      }
    ]
  },

  ev_cuihua_market: {
    id: 'ev_cuihua_market',
    title: '翠花秘料',
    scene: 'market',
    cg: 'yujie/v24_ev_cuihua_market.png',
    narration:
      '在集市最热闹的香料铺前，翠花神神秘秘地塞给你一个密封的青花瓷罐，满脸神秘。',
    dialogue: [
      {
        character: 'cuihua',
        text: '杰克！这是姐压箱底的三十年秘制野山椒老腌料！杀猪菜下锅前撒半勺，神仙闻了也走不动道！拿去！',
        expression: 'gossip'
      },
      {
        character: 'jack',
        text: '太珍贵了！翠花姐，大宴主桌必须给你留最好的位置！',
        expression: 'happy'
      }
    ],
    choices: [
      {
        id: 'cuihua_take_spice',
        text: '感激收下秘料，并买下一包热乎糖炒栗子回赠翠花姐。',
        feedback: '翠花开心地收下栗子，独家秘料将为大宴菜品增添无上风味。',
        effects: { money: -10, integrity: 3, affection: 3, setFlags: { cuihuaHelp: true, cuihuaMarketSeen: true } },
        next: 'HUB'
      },
      {
        id: 'cuihua_thank_free',
        text: '连声道谢收下秘料，相约大宴主桌畅饮。',
        risk: 'mixed',
        feedback: '翠花豪爽地挥了挥手，大院邻里温情满溢。',
        effects: { setFlags: { cuihuaHelp: true, cuihuaMarketSeen: true } },
        next: 'HUB'
      }
    ]
  },

  ev_peisi_help: {
    id: 'ev_peisi_help',
    title: '佩斯同袍',
    scene: 'kitchen',
    cg: 'yujie/v24_ev_peisi_help.png',
    narration:
      '后厨大锅旁，佩斯抱来了一大捆干燥的优质松木柴火，主动替你分担风箱的繁重体力活。',
    dialogue: [
      {
        character: 'peisi',
        text: '洋兄弟，这几天看你起早贪黑，佩斯哥打心眼里服你！今天柴火我管够，你放手掌勺！',
        expression: 'happy',
        pose: 'bellows'
      },
      {
        character: 'jack',
        text: '佩斯哥，有你拉风箱，后厨这口大锅就有了灵魂！',
        expression: 'happy'
      }
    ],
    choices: [
      {
        id: 'peisi_bro_cheer',
        text: '递给他一碗刚熬好的热姜汤：“佩斯哥，有你这份仗义，今天大宴必成！”',
        feedback: '佩斯仰脖喝下姜汤，风箱拉得如同虎虎生风，后厨气氛空前高涨。',
        effects: { affection: 4, integrity: 3, setFlags: { peisiHelp: true, peisiHelpSeen: true } },
        next: 'HUB'
      }
    ]
  },

  ev_goose_deep: {
    id: 'ev_goose_deep',
    title: '鹅王臣服',
    scene: 'mountain',
    cg: 'yujie/v24_ev_goose_deep.png',
    narration:
      '后山静谧的雪谷中，你再次与村霸大鹅正面相遇。这一次，大鹅没有嘶鸣攻击，而是收拢翅膀静静注视着你。',
    dialogue: [
      {
        character: 'goose',
        text: '嘎……（低沉鸣叫，缓缓低下高傲的头颅）'
      },
      {
        character: 'jack',
        text: '（放慢脚步，收起敌意）大白，咱们不打不相识，今天谁也不欺负谁。',
        expression: 'gentle'
      }
    ],
    choices: [
      {
        id: 'goose_deep_corn',
        text: '蹲下身子，将特级甜苞米粒平摊在掌心，轻声呼唤它上前采食。',
        feedback: '大鹅温顺地啄食你掌中的苞米，用脖颈蹭了蹭你的手腕，全村大鹅正式尊你为共主！',
        effects: { goose: 1, setFlags: { gooseAlly: true, gooseDeepSeen: true } },
        next: 'HUB'
      },
      {
        id: 'goose_deep_bow',
        text: '肃立向大鹅行礼，达成强者之间惺惺相惜的默契和解。',
        feedback: '大鹅高亢长鸣一声，振翅腾空，视你为林海雪原的唯一挚友。',
        effects: { setFlags: { gooseAlly: true, gooseDeepSeen: true } },
        next: 'HUB'
      }
    ]
  },

  ev_repair_laokuai: {
    id: 'ev_repair_laokuai',
    title: '冰释前嫌',
    scene: 'hall',
    cg: 'yujie/v24_ev_repair_laokuai.png',
    narration:
      '堂屋里气氛原本有些压抑。你端着一盆热腾腾的农家大包子和两瓶 AD 钙奶走进屋，主动坐到老蒯身旁。',
    dialogue: [
      {
        character: 'laokuai',
        text: '（撇了撇嘴）……又来干啥，俺这可没闲茶招待你。',
        expression: 'wronged',
        pose: 'drinking'
      },
      {
        character: 'jack',
        text: '蒯哥，刚出锅的肉包子，还有你最爱喝的奶，趁热垫垫肚子。',
        expression: 'gentle'
      }
    ],
    choices: [
      {
        id: 'repair_apologize_sincere',
        text: '诚恳检讨自己行事莽撞之处，把热包子推到他面前：“哥，之前是我不懂规矩，你大人大量别往心里去。”',
        feedback: '老蒯咬了一口包子，紧绷的脸色彻底舒缓开来：“算你小子识大体，下不为例！”',
        effects: { laokuaiAlert: -15, laokuaiBond: 8, integrity: 4, setFlags: { laokuaiRepaired: true, repairLaokuaiSeen: true } },
        next: 'HUB'
      },
      {
        id: 'repair_gift_tool',
        text: '自费买来一副精钢木工凿刀送上：“听闻哥这把老凿刀钝了，特意淘来孝敬哥。”',
        feedback: '老蒯抚摸着锃亮的钢刃，爱不释手，心头的芥蒂顿时烟消云散。',
        effects: { money: -20, laokuaiAlert: -18, laokuaiBond: 10, setFlags: { laokuaiRepaired: true, repairLaokuaiSeen: true } },
        next: 'HUB'
      }
    ]
  },

  ev_river_night: {
    id: 'ev_river_night',
    title: '星河夜话',
    scene: 'riverside',
    cg: 'yujie/v24_ev_river_night.png',
    narration:
      '夜凉如水，繁星倒映在清澈见底的河水中。雨姐脱下厚手套，指着夜空中的北斗七星，轻声倾诉心声。',
    dialogue: [
      {
        character: 'yujie',
        text: '杰克，这辈子打俺记事起，就没人问过俺累不累……只有你，每次都冲在俺前头。',
        expression: 'gentle'
      },
      {
        character: 'jack',
        text: '因为你值得被这世上最温暖的心意对待。',
        expression: 'gentle'
      }
    ],
    choices: [
      {
        id: 'river_night_embrace',
        text: '轻轻将她拥入怀中，为她挡住凛冽的夜风：“往后只要有我在，绝不让你受一点委屈。”',
        risk: 'risky',
        feedback: '雨姐将脸深深埋进你的胸膛，两人在星河之下许下了永恒的默契。',
        effects: { affection: 10, yujieSoftness: 8, laokuaiAlert: 6, setFlags: { riverNightSeen: true } },
        next: 'HUB'
      },
      {
        id: 'river_night_companion',
        text: '与她并肩坐在大青石上，默默握住她的手，陪她看尽满天繁星。',
        feedback: '静谧的温情流淌在彼此指尖，无需多言，心意已通。',
        effects: { affection: 7, yujieSoftness: 4, setFlags: { riverNightSeen: true } },
        next: 'HUB'
      }
    ]
  },

  // ==================== 警戒插入事件（免费） ====================
  ev_warning: {
    id: 'ev_warning',
    title: '走廊暗影',
    scene: 'hall',
    cg: 'yujie/v24_ev_warning.png',
    narration:
      '走廊拐角处，老蒯突然横跨一步挡住了你的去路，眼神冰冷如霜，手中紧握的木尺在掌心敲出清脆的响声。',
    dialogue: [
      {
        character: 'laokuai',
        text: '杰克，有些红线不能踩，别以为俺老蒯不吭声就是个面团捏的傻子。有些心思你最好趁早收起来，否则别怪俺老蒯翻脸不认人！',
        expression: 'angry'
      },
      {
        character: 'jack',
        text: '蒯哥，何出此言？我行事坦坦荡荡。',
        expression: 'serious'
      }
    ],
    choices: [
      {
        id: 'warning_heed',
        text: '“蒯哥提醒得是，我一定谨言慎行，守好分寸。”',
        feedback: '老蒯冷哼一声收起木尺转身离去，空气中依然残留着浓浓的警示意味。',
        effects: { laokuaiAlert: -2, setFlags: { warningSeen: true } },
        next: 'HUB'
      },
      {
        id: 'warning_defy',
        text: '冷冷与他对视：“蒯哥多虑了，我做事光明磊落，无需旁人指点。”',
        risk: 'negative',
        feedback: '老蒯眼中怒火中烧，咬牙切齿地记下了这笔账。',
        effects: { laokuaiAlert: 8, laokuaiBond: -5, setFlags: { warningSeen: true } },
        next: 'HUB'
      }
    ]
  },

  // ==================== 第 11 天 晚间独白事件（免费，next NIGHT） ====================
  ev_yujie_confess: {
    id: 'ev_yujie_confess',
    title: '槐下深情',
    scene: 'yard',
    cg: 'yujie/v24_ev_yujie_confess.png',
    narration:
      '第十一天深夜，盛宴前夕。老槐树下落雪无声，雨姐在大院门口单独叫住了你，眼波如水，神情庄重。',
    dialogue: [
      {
        character: 'yujie',
        text: '杰克……明天就是大宴，后天你就要决定去留了。姐这心里就一句话：只要你愿意留在大院，俺雨姐一辈子拿命待你！',
        expression: 'shy'
      },
      {
        character: 'jack',
        text: '雨姐……在这个大院里，我也找到了最真实的自己。',
        expression: 'gentle'
      }
    ],
    choices: [
      {
        id: 'yujie_confess_accept',
        text: '解下自己的围巾轻柔系在她的颈间：“雨姐，我的心早已留在这里，大宴之后我们永远在一起。”',
        outcomes: [
          {
            condition: { flag: 'promiseLaokuai' },
            feedback: '雨姐泪洒衣襟，紧紧与你相拥；然而老槐树下的终身之约，与你给老蒯的承诺彻底交叠，两份互斥的心意已走向无法挽回的修罗定局。',
            effects: { affection: 12, yujieSoftness: 8, setFlags: { promiseYujie: true, doublePromise: true, yujieConfessSeen: true } }
          },
          {
            feedback: '雨姐泪洒衣襟，紧紧与你相拥，在风雪中许下了终身之约。',
            effects: { affection: 12, yujieSoftness: 8, setFlags: { promiseYujie: true, yujieConfessSeen: true } }
          }
        ],
        next: 'NIGHT'
      },
      {
        id: 'yujie_confess_partner',
        text: '“雨姐，能与你并肩把农家乐做好，是我这辈子最骄傲的事，我们永远是最好的搭档与亲人。”',
        risk: 'mixed',
        feedback: '雨姐释然一笑，擦去泪花，重重拍了拍你的后背：“好兄弟！大院永远是你的家！”',
        effects: { affection: 8, yujieSoftness: 0, integrity: 6, setFlags: { yujieConfessSeen: true } },
        next: 'NIGHT'
      }
    ]
  },

  // ==================== 第 12 天 盛宴专场（全天专场，0 AP） ====================
  ev_echo_d12: {
    id: 'ev_echo_d12',
    title: '盛宴定局',
    scene: 'yard',
    cg: 'yujie/v24_ev_echo_d12.png',
    specialSchedule: true,
    narration:
      '第十二天！全村老少齐聚大院，八张大红圆桌座无虚席，香气飘出十里。大宴正式开席前，雨姐端着酒碗走向你。',
    dialogue: [
      {
        character: 'yujie',
        text: '大伙都静一静！今天这顿杀猪菜大宴，能办得这么风光体面，全靠咱大院的主心骨杰克！杰克，来跟全村敬这第一碗酒！',
        expression: 'laugh'
      },
      {
        character: 'jack',
        text: '承蒙雨姐和各位长辈关照，这一碗敬咱们大院红红火火！',
        expression: 'happy'
      },
      {
        character: 'laokuai',
        text: '（站在一旁暗暗观察你的神态举止）……',
        expression: 'proud'
      }
    ],
    choices: [
      {
        id: 'echo_d12_toast_yujie',
        text: '端起酒碗，与雨姐深情对饮，向全村致意！',
        outcomes: [
          {
            condition: { flag: 'doublePromise' },
            feedback: '就在你端起酒碗的刹那，老蒯猛地从主桌站起，脸色铁青地将手中的红木雕刻摔在地上！',
            next: 'ev_shura_reveal'
          },
          {
            condition: { flag: 'noodleCheap', notFlag: 'noodleRemedied' },
            feedback: '酒刚下肚，后厨突然传来一阵惊呼与骚乱，执法打假人员带着摄像机踹门而入！',
            next: 'ev_expose'
          },
          {
            feedback: '满堂喝彩！烈酒入喉，全场气氛热烈沸腾，大宴正式开席！',
            effects: { affection: 5 },
            next: 'ev_feast'
          }
        ]
      },
      {
        id: 'echo_d12_toast_all',
        text: '双手举碗向全场乡亲长辈深深鞠躬致意，感谢大院收留之恩。',
        outcomes: [
          {
            condition: { flag: 'doublePromise' },
            feedback: '未等乡亲回敬，老蒯当场拍案而起，怒指你的双重欺瞒！',
            next: 'ev_shura_reveal'
          },
          {
            condition: { flag: 'noodleCheap', notFlag: 'noodleRemedied' },
            feedback: '骚乱突起，打假博主当众亮出检测报告，劣质粉条事件当场爆发！',
            next: 'ev_expose'
          },
          {
            feedback: '乡亲们交口称赞你的谦逊懂礼，主桌长辈纷纷举碗回敬！',
            effects: { integrity: 6, affection: 3 },
            next: 'ev_feast'
          }
        ]
      }
    ]
  },

  ev_shura_reveal: {
    id: 'ev_shura_reveal',
    title: '修罗崩解',
    scene: 'yard',
    cg: 'yujie/v24_ev_shura_reveal.png',
    specialSchedule: true,
    narration:
      '盛宴现场瞬间死寂。老蒯将刻着你名字的定情木雕狠狠摔在案台上，雨姐手中的酒碗也应声粉碎。两份互斥的情感承诺在阳光下被当场彻底戳穿。',
    dialogue: [
      {
        character: 'laokuai',
        text: '杰克！你昨晚还在木工房对俺发誓要共度一生，转头又在槐树下对雨姐许诺厮守？！你把俺们当成啥了？！',
        expression: 'angry'
      },
      {
        character: 'yujie',
        text: '（眼圈通红，身躯剧烈颤抖）俺雨姐拿真心待你……你居然两头欺瞒……给俺滚出大院！！',
        expression: 'surprised'
      },
      {
        character: 'peisi',
        text: '这……这咋弄成这样了……杰克兄弟你糊涂啊！',
        expression: 'embarrassed'
      }
    ],
    choices: [
      {
        id: 'shura_accept_fate',
        text: '无言以对，在满院宾客惊愕鄙夷的目光中收拾行李黯然离去……',
        risk: 'negative',
        feedback: '所有的辩解在铁证面前都显得苍白无力，你默默垂下头，提着行李在风雪中仓皇离开。',
        next: 'ev_ending_shura'
      }
    ]
  },

  ev_expose: {
    id: 'ev_expose',
    title: '东窗事发',
    scene: 'yard',
    specialSchedule: true,
    narration:
      '杀猪大宴刚开席，几名身穿制服的执法人员与打假博主便踹开了院门。大铁锅里捞出的粉条断成黏糊脓汤，刺鼻的化学胶水味弥漫全院。',
    dialogue: [
      {
        character: 'jack',
        text: '这……这怎么会变成这样……',
        expression: 'embarrassed'
      },
      {
        character: 'yujie',
        text: '杰克！！俺把盛宴采购全交给你，你竟然买假冒木薯胶水粉条？！大院三十年的名声全被你毁了！！',
        expression: 'surprised'
      },
      {
        character: 'goose',
        text: '嘎嘎嘎！（疯狂振翅嘲弄）',
        pose: 'charge'
      }
    ],
    choices: [
      {
        id: 'expose_end',
        text: '面对巨额罚单与停业整顿通告，在全村的愤怒声讨中狼狈逃离……',
        risk: 'negative',
        feedback: '闪光灯与怒斥声将你包围，曾经温馨的大院招牌被当场查封，你狼狈不堪地逃离了现场。',
        next: 'ending_noodle'
      }
    ]
  },

  ev_feast: {
    id: 'ev_feast',
    title: '全村大宴',
    scene: 'kitchen',
    specialSchedule: true,
    cg: 'yujie/cg_feast_v2.png',
    narration:
      '大锅翻滚，香飘十里。十三天的辛勤耕耘在此刻迎来了最终检验。全院老小各就各位，等待着你在盛宴大戏中的高光表现。',
    dialogue: [
      {
        character: 'yujie',
        text: '杰克！今天你想挑起哪个重头大梁，尽管放手去干！',
        expression: 'laugh'
      },
      {
        character: 'peisi',
        text: '风箱柴火全齐备，就等主攻发号施令！',
        expression: 'happy'
      },
      {
        character: 'laokuai',
        text: '主桌坐席也都排齐整了，全村有头有脸的都来了。',
        expression: 'proud'
      }
    ],
    choices: [
      {
        id: 'feast_chef',
        text: '🧑‍🍳【掌勺主厨】亲自披挂上阵掌控八大铁锅，以绝世厨艺震撼全村！',
        condition: { routesCompleted: ['kitchen', 'pigpen'] },
        lockedHint: '需要历练完后厨与猪圈的全部功夫',
        feedback: '你系紧大围裙稳稳立在主灶前，大马勺一挥，开启了震撼全村的掌勺大戏！',
        next: 'ev_feast_chef'
      },
      {
        id: 'feast_streamer',
        text: '📱【助农顶流】架起全套机位开启全国助农直播，将大院推向全网顶峰！',
        condition: { routeCompleted: 'market', flagsAll: ['livePath', 'refusedNoodles'] },
        lockedHint: '需要集市历练圆满、开启带货之路并守住正品底线',
        feedback: '支架就位，镜头开启！你熟练地调度机位，将大院真实的烟火与欢腾传向四海。',
        next: 'ev_feast_streamer'
      },
      {
        id: 'feast_love',
        text: '💕【温情相伴】默默守在雨姐身侧端茶递水，与她在烟火缭绕中相视而笑。',
        condition: { routeCompleted: 'riverside', minAffection: 75, maxAlert: 40 },
        lockedHint: '需要与雨姐情意深厚、共走完河边路途且老蒯未起疑心',
        feedback: '你穿过欢腾的人群来到雨姐身边，两人目光相接，一切尽在不言中。',
        next: 'ev_feast_love'
      },
      {
        id: 'feast_family',
        text: '👨‍👩‍👦【主桌结盟】陪老蒯坐上主桌首席，畅饮 AD 钙奶，共话知己兄弟大义。',
        condition: { routeCompleted: 'laokuai', maxAlert: 20 },
        lockedHint: '需要走完堂屋全部历程，老蒯已彻底放下戒心',
        feedback: '老蒯热情地拉着你坐上首席，满桌的长辈乡亲纷纷投来敬佩与赞许的目光。',
        next: 'ev_feast_family'
      },
      {
        id: 'feast_goose',
        text: '🪿【鹅王巡场】率领全村大鹅卫队环院巡游，震慑四方，维持大宴秩序！',
        condition: { minGooseCount: 3 },
        lockedHint: '需要多次降伏村霸大鹅并获得其敬畏',
        feedback: '你吹响口哨，领头大鹅昂首阔步跟在你身后，鹅卫队浩浩荡荡巡视全场，威风八面！',
        next: 'ev_feast_goose'
      },
      {
        id: 'feast_generic',
        text: '🍲【忙前忙后】踏踏实实帮着端盘摆桌，融入欢腾热闹的农家宴席。',
        feedback: '你手脚麻利地穿梭在各桌之间添菜倒水，质朴热情的笑容赢得了全村的喜爱。',
        next: 'ev_feast_generic'
      }
    ]
  },

  ev_feast_chef: {
    id: 'ev_feast_chef',
    title: '名厨神韵',
    scene: 'kitchen',
    specialSchedule: true,
    narration:
      '铁锅烈火熊熊，你手中的大马勺挥洒自如。葱姜爆香、高汤浓郁，一道道令人垂涎欲滴的杀猪菜如流水般端上主席。',
    dialogue: [
      {
        character: 'peisi',
        text: '大厨出菜喽！这味道，简直绝了！',
        expression: 'happy',
        pose: 'bellows'
      },
      {
        character: 'yujie',
        text: '杰克！全乡饭店的老板都跑来打听咱家大厨是谁呢！太给大院涨脸了！',
        expression: 'laugh'
      },
      {
        character: 'laokuai',
        text: '这手艺确实没得挑，肉香汤浓，是个掌勺的料。',
        expression: 'proud'
      }
    ],
    choices: [
      {
        id: 'f_chef_end',
        text: '为全村盛上热气腾腾的杀猪菜，接受全场的喝彩！',
        feedback: '热气腾腾的大肉烩酸菜让全村大快朵颐，掌声与欢呼声响彻后厨与院落！',
        effects: { affection: 6, integrity: 5, money: 40 },
        next: 'ev_feast_end'
      }
    ]
  },

  ev_feast_streamer: {
    id: 'ev_feast_streamer',
    title: '全网瞩目',
    scene: 'yard',
    specialSchedule: true,
    narration:
      '院落中央的直播镜头前，你与翠花配合默契。纯正的乡村风光与货真价实的农家食材让直播间热度瞬间突破千万！',
    dialogue: [
      {
        character: 'cuihua',
        text: '家人们！雨姐大院纯正酸菜现捞现发！十万单瞬间秒光！',
        expression: 'happy',
        pose: 'livestream'
      },
      {
        character: 'yujie',
        text: '（对着镜头热情招手）感谢全国的家人们！大院永远欢迎你们！',
        expression: 'happy'
      },
      {
        character: 'jack',
        text: '真实、地道、诚信，这就是我们大院最硬的招牌！',
        expression: 'happy'
      }
    ],
    choices: [
      {
        id: 'f_streamer_end',
        text: '向全网观众推介大院的诚信精神，订单爆棚！',
        feedback: '全网点赞如潮，十里八乡的农产品被抢购一空，大院彻底成为全国诚信助农的典范！',
        effects: { affection: 6, money: 50, integrity: 6 },
        next: 'ev_feast_end'
      }
    ]
  },

  ev_feast_love: {
    id: 'ev_feast_love',
    title: '烟火温情',
    scene: 'yard',
    specialSchedule: true,
    narration:
      '人声鼎沸中，你端来一碗热气腾腾的清炖排骨汤递给忙碌的雨姐，轻轻拭去她额角的水雾。',
    dialogue: [
      {
        character: 'jack',
        text: '雨姐，趁热喝口汤暖暖胃，今天大伙都高兴，你也别太累着。',
        expression: 'gentle'
      },
      {
        character: 'yujie',
        text: '（捧着汤碗，目光脉脉含情）哎……只要你在姐身边，姐一点都不觉得累。',
        expression: 'shy'
      }
    ],
    choices: [
      {
        id: 'f_love_end',
        text: '与她并肩站在院角，在漫天欢笑中静享二人世界的温暖。',
        feedback: '院外欢歌笑语，院角温情脉脉，两人在喧闹的盛宴中守护着属于彼此的安宁。',
        effects: { affection: 8, yujieSoftness: 4 },
        next: 'ev_feast_end'
      }
    ]
  },

  ev_feast_family: {
    id: 'ev_feast_family',
    title: '主桌结义',
    scene: 'hall',
    specialSchedule: true,
    narration:
      '主桌炕头之上，老蒯亲手为你摆上一排开好盖的 AD 钙奶，拉着你在全村族长面前郑重入座。',
    dialogue: [
      {
        character: 'laokuai',
        text: '各位族长长辈听好了！杰克是俺老蒯过命的亲兄弟！往后大院的事，就是他的事！干杯！',
        expression: 'proud',
        pose: 'drinking'
      },
      {
        character: 'yujie',
        text: '（掀帘进来满脸带笑）老蒯难得这么霸气！杰克，陪你哥喝痛快！',
        expression: 'laugh'
      },
      {
        character: 'jack',
        text: '敬大哥大嫂！大院就是我的第二个家！',
        expression: 'happy'
      }
    ],
    choices: [
      {
        id: 'f_family_end',
        text: '与老蒯碰杯畅饮，彻底融入大院温暖的大家庭。',
        feedback: '奶瓶与酒碗相碰，堂屋洋溢着其乐融融的欢笑，你正式成为了这大院无可取代的家人。',
        effects: { laokuaiBond: 10, laokuaiAlert: -8, affection: 4 },
        next: 'ev_feast_end'
      }
    ]
  },

  ev_feast_goose: {
    id: 'ev_feast_goose',
    title: '鹅王仪仗',
    scene: 'yard',
    specialSchedule: true,
    narration:
      '大院门外，由白羽大鹅领衔的十二只大白鹅排成两列威武战队。大鹅见你走来，极其通人性地俯首行礼，引得全场啧啧称奇。',
    dialogue: [
      {
        character: 'goose',
        text: '嘎————！（昂首引吭，号令全村大鹅维持秩序）',
        pose: 'charge'
      },
      {
        character: 'yujie',
        text: '哎呀妈呀！全村最凶的大鹅全成杰克的卫队了！神了！',
        expression: 'surprised'
      },
      {
        character: 'jack',
        text: '大鹅卫队，立正！向全村乡亲敬礼！',
        expression: 'happy'
      }
    ],
    choices: [
      {
        id: 'f_goose_end',
        text: '指挥鹅卫队威风凛凛巡场一周，满堂喝彩！',
        feedback: '大白鹅引吭高歌列队绕场，宾客们掌声雷动，这一幕成了全村久久传颂的神奇佳话！',
        effects: { goose: 1, affection: 5 },
        next: 'ev_feast_end'
      }
    ]
  },

  ev_feast_generic: {
    id: 'ev_feast_generic',
    title: '欢聚一堂',
    scene: 'yard',
    specialSchedule: true,
    narration:
      '热气腾腾的酸菜白肉一碗接一碗端上桌，村民们把酒言欢，夜幕降临后院里还点起了温暖的篝火，大宴成为了全村传颂的佳话。',
    dialogue: [
      {
        character: 'jack',
        text: '大家放开了吃！不够后厨随时加菜！',
        expression: 'happy',
        pose: 'working'
      },
      {
        character: 'yujie',
        text: '好样的杰克！今儿个是咱大院最风光、最痛快的一天！吃好喝好啊大伙！',
        expression: 'laugh'
      },
      {
        character: 'cuihua',
        text: '来来来，大伙一起满饮此杯！',
        expression: 'happy'
      }
    ],
    choices: [
      {
        id: 'f_gen_end',
        text: '融入欢快喜庆的席间，在满院欢声笑语与火光中走向散席……',
        feedback: '篝火映红了每个人的笑脸，十三天的汗水化作了今夜最圆满的欢聚。',
        effects: { affection: 4, integrity: 2 },
        next: 'ev_feast_end'
      }
    ]
  },

  ev_feast_end: {
    id: 'ev_feast_end',
    title: '大宴散席',
    scene: 'yard',
    specialSchedule: true,
    narration:
      '宾客尽散，月洒中庭。雨姐、老蒯和你站在收拾整齐的院子里，看着空中的明月。十三天的农家乐体验即将画上句号，明天便是最后的抉择时刻。',
    dialogue: [
      {
        character: 'yujie',
        text: '今晚月色真好……十三天过得真快啊。',
        expression: 'gentle'
      },
      {
        character: 'laokuai',
        text: '（默默收起马扎）早点回屋歇着吧，明儿个还得说正事。',
        expression: 'proud'
      }
    ],
    choices: [
      {
        id: 'feast_end_rest',
        text: '回房歇息，迎接明日清晨的最终告别与抉择。',
        feedback: '踏入温暖的屋舍，你合上双眼，静候决定命运的清晨到来。',
        next: 'NIGHT'
      }
    ]
  },

  // ==================== 终章：第 13 天 抉择日（聚合全部 14 结局） ====================
  ev_final: {
    id: 'ev_final',
    title: '离别抉择',
    scene: 'snow',
    specialSchedule: true,
    narration:
      '第十三天清晨，大雪漫天，将整个村庄装点得银装素裹。行李箱已收拾妥当立在门旁，雨姐、老蒯、佩斯、翠花以及大白鹅全都在院中为你送行。面对所有人，你将做出最后的决定。',
    dialogue: [
      {
        character: 'yujie',
        text: '杰克……十三天到了……你到底咋打算的？',
        expression: 'gentle'
      },
      {
        character: 'laokuai',
        text: '（紧紧捏着奶瓶，低头不语）……',
        expression: 'wronged',
        pose: 'drinking'
      },
      {
        character: 'peisi',
        text: '洋兄弟，无论你去哪，大院的门永远为你敞开！',
        expression: 'happy'
      }
    ],
    choices: [
      {
        id: 'final_love_soft',
        text: '🌸【依恋之爱】“雨姐，我不走了，往后的风雪由我为你遮挡，让我照顾你一辈子。”',
        condition: {
          minAffection: 90,
          maxAlert: 40,
          routeCompleted: 'riverside',
          minYujieSoftness: 11,
          flag: 'promiseYujie',
          notFlag: 'doublePromise'
        },
        lockedHint: '需要她卸下所有坚硬防备、把最软的一面完全交托于你，且守住专属承诺',
        feedback: '你轻轻放下行李箱，走上前握住她微颤的双手，许下了一生的守护。',
        next: 'ev_ending_love_soft'
      },
      {
        id: 'final_love_power',
        text: '👑【盛木之爱】“雨姐，我甘愿留在你身边当你的左膀右臂，大院有你在我就心安。”',
        condition: {
          minAffection: 90,
          maxAlert: 40,
          routeCompleted: 'riverside',
          maxYujieSoftness: -11,
          flag: 'promiseYujie',
          notFlag: 'doublePromise'
        },
        lockedHint: '需要她完全展现出霸气主导的当家英姿，且彼此情意相通、坚守专属承诺',
        feedback: '雨姐豪迈大笑，一把将你揽入怀中，宣布大院从此有了最稳固的依靠！',
        next: 'ev_ending_love_power'
      },
      {
        id: 'final_love_balance',
        text: '💕【炊烟并蒂】“雨姐，我们并肩把大院做大做强，生生世世做彼此最好的伴侣。”',
        condition: {
          minAffection: 90,
          maxAlert: 40,
          routeCompleted: 'riverside',
          minYujieSoftness: -10,
          maxYujieSoftness: 10,
          flag: 'promiseYujie',
          notFlag: 'doublePromise'
        },
        lockedHint: '需要彼此势均力敌、刚柔并济，完成河边定情且守住专属承诺',
        feedback: '两双有力的手紧紧相握，在皑皑白雪中定下了同甘共苦的永恒誓言。',
        next: 'ending_love'
      },
      {
        id: 'final_laokuai_romance',
        text: '🍶【默契生温】“蒯哥，我收下了你的信物，大宴过后，我想陪你在这木工房里共度余生。”',
        condition: {
          minLaokuaiRomance: 50,
          minLaokuaiBond: 35,
          routeMinStages: { laokuai: 4 },
          flag: 'mutualLaokuaiConsent',
          maxAlert: 20,
          notFlag: 'doublePromise'
        },
        lockedHint: '需要老蒯在门槛前与你达成清醒双向的约定，且无任何猜忌与欺瞒',
        feedback: '老蒯眼眶泛红，紧紧扣住你的手掌，清醒而深情地回应了这段真挚的心意。',
        next: 'ev_ending_laokuai_romance'
      },
      {
        id: 'final_laokuai_soulmate',
        text: '🪵【匠心同舟】“蒯哥，你我是过命的知己工友，往后大院的后勤重活，咱哥俩一人挑一半！”',
        condition: {
          minLaokuaiBond: 55,
          maxLaokuaiRomance: 34,
          routeCompleted: 'laokuai',
          maxAlert: 20,
          notFlag: 'doublePromise'
        },
        lockedHint: '需要老蒯视你为纯粹过命的知己手足，走完全部门槛托付且无猜忌',
        feedback: '老蒯重重一拳击在你的肩头，两人相视大笑，结下了一生不渝的手足匠心盟约。',
        next: 'ev_ending_laokuai_soulmate'
      },
      {
        id: 'final_family',
        text: '👨‍👩‍👦【大院一家人】“大哥大嫂！我愿认这里为家，留下来当你们的亲老弟！”',
        condition: {
          routeMinStages: { laokuai: 3 },
          maxAlert: 20,
          minLaokuaiBond: 30,
          minAffection: 50
        },
        lockedHint: '需要融洽化解老蒯防备，并同时赢得雨姐与老蒯的深厚信任',
        feedback: '雨姐和老蒯欣喜地接过你的行李拉你进屋，大院在欢呼声中迎来了真正的亲人！',
        next: 'ending_family'
      },
      {
        id: 'final_chef',
        text: '🧑‍🍳【农家名厨】“这大铁锅我放不下了！让我留下来当金牌主厨吧，酸菜管饱就行！”',
        condition: {
          routesCompleted: ['kitchen', 'pigpen'],
          minAffection: 60,
          minIntegrity: 10
        },
        lockedHint: '需要厨艺与力气双双出师，且坚守诚信品控',
        feedback: '佩斯欢呼着替你戴上厨师高帽，大院后厨的大勺正式交接到了你的手中！',
        next: 'ending_chef'
      },
      {
        id: 'final_streamer',
        text: '📱【顶流之星】“雨姐，咱们的诚信农货已经名扬全国，带货大业正待我们并肩开拓！”',
        condition: {
          routeCompleted: 'market',
          flagsAll: ['livePath', 'refusedNoodles'],
          notFlag: 'noodleCheap'
        },
        lockedHint: '需要精通直播带货门道，且坚决拒斥劣质假冒原料',
        feedback: '翠花与雨姐激动地架起直播支架，大院诚信带货的全新商业传奇在此刻启航！',
        next: 'ending_streamer'
      },
      {
        id: 'final_goose',
        text: '🪿【鹅中霸王】吹响口哨，全村大鹅列队向你俯首称臣！',
        condition: {
          minGooseCount: 3,
          flag: 'gooseAlly'
        },
        lockedHint: '需要赢得大鹅尊重并深入后山与其结为莫逆之交',
        feedback: '清脆的口哨声响彻林海，大白鹅率领鹅群恭敬环绕在你身旁，恭迎新一代鹅王！',
        next: 'ending_goose'
      },
      {
        id: 'final_friend',
        text: '🤝【农家挚友】“谢谢大家十三天的照顾，往后每年秋收，我都回来看望大家！”',
        condition: { minAffection: 50 },
        lockedHint: '需要在这十三天里与大院建立起融洽真挚的人情羁绊',
        feedback: '大家依依不舍地将土特产塞满你的行囊，相约来年金秋再聚大院。',
        next: 'ending_friend'
      },
      {
        id: 'final_bye',
        text: '😶【客路匆匆】“时间到了，该踏上归途了。祝大院蒸蒸日上，大家保重。”',
        risk: 'mixed',
        feedback: '你提起行李，在客套的寒暄与道别声中踏上了归途，背影渐行渐远。',
        next: 'ending_bye'
      }
    ]
  },

  // ==================== 专属谢幕过渡节点（5 个新增结局跳转） ====================
  ev_ending_love_soft: {
    id: 'ev_ending_love_soft',
    title: '温情归宿',
    scene: 'snow',
    cg: 'yujie/v24_ev_ending_love_soft.png',
    specialSchedule: true,
    narration:
      '雪花静静飘落在两人的肩头。雨姐挽着你的臂弯，靠在你宽阔的怀抱里。大院的炊烟与晨曦交织成最温暖的画卷。',
    dialogue: [
      {
        character: 'yujie',
        text: '傻小子……往后大院有你，姐再也不用一个人硬扛了。',
        expression: 'gentle'
      },
      {
        character: 'jack',
        text: '有你在的地方，就是我唯一的家。',
        expression: 'gentle'
      }
    ],
    choices: [
      {
        id: 'end_love_soft_btn',
        text: '携手踏入充满希望的岁月……',
        feedback: '在漫天飞雪与温暖炊烟中，你们紧握彼此的双手，翻开了相守一生的新篇章。',
        next: 'ending_love_soft'
      }
    ]
  },

  ev_ending_love_power: {
    id: 'ev_ending_love_power',
    title: '霸气盛荫',
    scene: 'yard',
    cg: 'yujie/v24_ev_ending_love_power.png',
    specialSchedule: true,
    narration:
      '雨姐一脚踩在长凳上，豪气干云地向全村宣布大院有了最可靠的顶梁柱。你站在她身后，笑着接受她所有的宠溺与霸气庇护。',
    dialogue: [
      {
        character: 'yujie',
        text: '听好了！杰克是俺雨姐的人！往后谁敢为难他，先问问俺这双胳膊！',
        expression: 'laugh'
      },
      {
        character: 'jack',
        text: '跟着雨姐，这辈子值了！',
        expression: 'happy'
      }
    ],
    choices: [
      {
        id: 'end_love_power_btn',
        text: '在豪迈的笑声中翻开人生新篇章……',
        feedback: '在爽朗豪迈的笑声与满院喝彩中，你稳稳融入了雨姐护航的红火岁月。',
        next: 'ending_love_power'
      }
    ]
  },

  ev_ending_laokuai_soulmate: {
    id: 'ev_ending_laokuai_soulmate',
    title: '匠心同舟',
    scene: 'hall',
    cg: 'yujie/v24_ev_ending_laokuai_soulmate.png',
    specialSchedule: true,
    narration:
      '木工房内刨花飞落。两双粗糙而结实的手紧紧握在一起，老蒯递过新打的木尺，过命的兄弟默契在静默中长存。',
    dialogue: [
      {
        character: 'laokuai',
        text: '老弟，这大院的规矩和木工手艺，咱哥俩一辈子传下去。',
        expression: 'proud',
        pose: 'drinking'
      },
      {
        character: 'jack',
        text: '大哥，重活累活咱俩一人挑一半，绝不含糊！',
        expression: 'serious'
      }
    ],
    choices: [
      {
        id: 'end_laokuai_soulmate_btn',
        text: '共赴匠人岁月的长河……',
        feedback: '木尺在手，知己在侧，大院后勤与木工手艺在兄弟同心中代代流传。',
        next: 'ending_laokuai_soulmate'
      }
    ]
  },

  ev_ending_laokuai_romance: {
    id: 'ev_ending_laokuai_romance',
    title: '默契生温',
    scene: 'hall',
    cg: 'yujie/v24_ev_ending_laokuai_romance.png',
    specialSchedule: true,
    narration:
      '昏黄的灯影下，红木雕刻温润如玉。老蒯粗糙而温暖的手掌与你十指相扣，在这漫长冬夜里散发着清醒而纯粹的温度。',
    dialogue: [
      {
        character: 'laokuai',
        text: '前半辈子俺为别人活……往后这几十年，俺只想守着你，过咱俩的安稳日子。',
        expression: 'wronged'
      },
      {
        character: 'jack',
        text: '余生漫长，风雪同行。',
        expression: 'gentle'
      }
    ],
    choices: [
      {
        id: 'end_laokuai_romance_btn',
        text: '在真挚与清醒中相守白头……',
        feedback: '灯火昏黄，执手相伴，两颗饱经磨砺的心在彼此的温度中找到了余生的归宿。',
        next: 'ending_laokuai_romance'
      }
    ]
  },

  ev_ending_shura: {
    id: 'ev_ending_shura',
    title: '冰碎雪崩',
    scene: 'snow',
    cg: 'yujie/v24_ev_ending_shura.png',
    specialSchedule: true,
    narration:
      '大雪无情地掩盖了脚印。信任在欺瞒中彻底破碎，大院的大门在身后重重关上，留下的只有刺骨的严寒与终生的悔恨。',
    dialogue: [
      {
        character: 'jack',
        text: '我以为能瞒过所有人……终究是自作自受，弄丢了最真诚的心。',
        expression: 'embarrassed'
      }
    ],
    choices: [
      {
        id: 'end_shura_btn',
        text: '在冰天雪地中吞下苦果……',
        risk: 'negative',
        feedback: '厚重的大门彻底隔绝了屋内的温度，严寒与悔恨伴随你的每一步脚步。',
        next: 'ending_shura'
      }
    ]
  },

  // ==================== 夜间过渡 ====================
  night_rest: {
    id: 'night_rest',
    title: '夜幕降临',
    scene: 'hall',
    specialSchedule: true,
    narration:
      '夜深了，大鹅归巢，猪群入睡，窗外北风呼啸，屋内热炕滚烫。你在安宁祥和中闭上双眼，静候新一天的阳光升起。',
    dialogue: [
      {
        character: 'jack',
        text: '今天辛苦了一整天，好好睡上一觉。',
        expression: 'gentle'
      }
    ],
    choices: [
      {
        id: 'night_1',
        text: '安然入睡（进入下一天）',
        feedback: '热炕烘得周身舒泰，一夜好梦。',
        effects: {},
        next: 'NIGHT'
      }
    ]
  }
}

export const events = gameEvents
export default gameEvents
