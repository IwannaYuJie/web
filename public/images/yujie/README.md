# 《雨姐的心动时刻》视觉素材工程规范与资产清单 (v2.4)

## 1. 目录用途与发布状态
本目录 (`public/images/yujie/`) 归档《雨姐的心动时刻》雨姐线剧情演出、事件 CG、结局背景与角色参考素材。
当前状态：**v2.4 本地生成完成待发布状态**（未上线生产环境）。所有重构资产已在本地环境准备完毕，等待流水线统一构建与上线发布。

---

## 2. 资产三类说明

### 2.1 身份参考图 (Identity Reference)
用于保证角色生成过程中的面部、身形与服饰特征一致性：
- `yujie.jpg`：雨姐标准形象参考
- `laokuai.jpg`：老蒯标准形象参考
- `char_jack.jpg`：Jack 标准形象参考
- `char_cuihua.jpg`：翠花标准形象参考
- `char_peisi.jpg`：裴司标准形象参考
- `char_goose.jpg`：大鹅标准形象参考

### 2.2 旧版素材
- 历史版本素材（包含旧版场景图、旧版 CG、立绘及旧版结局素材）继续由既有 42 个事件、9 个旧结局及立绘/场景保留并兼容使用。
- 本轮新增 20 个事件和 5 个新结局不复用它们。

### 2.3 v2.4 独立新图
- 采用统一美术管线全新独立生成的 20 张事件 CG 与 5 张结局 CG（共 25 张）。
- 具备独立内容哈希，与旧素材目录无哈希碰撞。

---

## 3. 生成模式与提示词规范

### 3.1 管线与风格定义
- **生成工具 / 模式**：内置 `imagegen`，工作流 use case `identity-preserve`。
- **画面规格**：`16:9 landscape visual-novel CG`，统一渲染尺寸 `1672x941 PNG`。
- **核心基调**：`cinematic photorealistic northeastern Chinese rural winter drama`（写实电影质感、东北冬季乡村戏剧氛围、真实环境光影）。

### 3.2 参考图与生成约束
- **身份一致性**：使用身份参考图仅维持角色面部特征与识别度，**严禁复制参考图的姿势、背景或底层像素**。
- **负向过滤与纯净度要求**：
  - 严禁出现任何文字、字幕、Logo、水印、UI 元素；
  - 严禁出现重复人物、多余肢体、肢体畸变；
  - 严禁渲染前景立绘（CG 场景完全内嵌人物叙事，演出时自动隐藏独立前景立绘）。

---

## 4. v2.4 独立素材资产清单 (1672x941 PNG)

### 4.1 20 张事件 CG 清单

| 事件键名 (Event Key) | 对应文件名 | 独立场景说明 | 尺寸与格式 |
| :--- | :--- | :--- | :--- |
| `route_laokuai_4` | `v24_route_laokuai_4.png` | 门槛边界长谈 | 1672x941 PNG |
| `route_laokuai_5` | `v24_route_laokuai_5.png` | 木工房托付红木信物 | 1672x941 PNG |
| `ev_echo_d5` | `v24_ev_echo_d5.png` | 雪院搬货与短暂依靠 | 1672x941 PNG |
| `ev_echo_d8` | `v24_ev_echo_d8.png` | 恶意差评危机 | 1672x941 PNG |
| `ev_echo_d10` | `v24_ev_echo_d10.png` | 宴席筹备规划 | 1672x941 PNG |
| `ev_echo_d12` | `v24_ev_echo_d12.png` | 宴席举碗定局 | 1672x941 PNG |
| `ev_warning` | `v24_ev_warning.png` | 老蒯持木尺拦住 Jack | 1672x941 PNG |
| `ev_cuihua_market` | `v24_ev_cuihua_market.png` | 翠花集市递秘料 | 1672x941 PNG |
| `ev_peisi_help` | `v24_ev_peisi_help.png` | 裴司风箱与 Jack 劈柴 | 1672x941 PNG |
| `ev_goose_deep` | `v24_ev_goose_deep.png` | 雪谷鹅巢喂鹅王 | 1672x941 PNG |
| `ev_repair_laokuai` | `v24_ev_repair_laokuai.png` | 包子钙奶木凿和解 | 1672x941 PNG |
| `ev_river_night` | `v24_ev_river_night.png` | 星夜河边牵手 | 1672x941 PNG |
| `ev_remedy_check` | `v24_ev_remedy_check.png` | 真假粉条质检补救 | 1672x941 PNG |
| `ev_yujie_confess` | `v24_ev_yujie_confess.png` | 槐树下共系红围巾 | 1672x941 PNG |
| `ev_shura_reveal` | `v24_ev_shura_reveal.png` | 宴席酒碗与木雕冲突 | 1672x941 PNG |
| `ev_ending_love_soft` | `v24_ev_ending_love_soft.png` | 雪院火盆依靠 | 1672x941 PNG |
| `ev_ending_love_power` | `v24_ev_ending_love_power.png` | 钥匙账本掌家 | 1672x941 PNG |
| `ev_ending_laokuai_soulmate` | `v24_ev_ending_laokuai_soulmate.png` | 木工房知己握手 | 1672x941 PNG |
| `ev_ending_laokuai_romance` | `v24_ev_ending_laokuai_romance.png` | 堂屋克制牵手 | 1672x941 PNG |
| `ev_ending_shura` | `v24_ev_ending_shura.png` | 风雪离院 | 1672x941 PNG |

### 4.2 5 张结局 CG 清单

| 结局键名 (Ending Key) | 对应文件名 | 独立场景说明 | 尺寸与格式 |
| :--- | :--- | :--- | :--- |
| `ending_love_soft` | `v24_ending_love_soft.png` | 暖炕窗边相依 | 1672x941 PNG |
| `ending_love_power` | `v24_ending_love_power.png` | 台阶上向乡亲介绍搭档 | 1672x941 PNG |
| `ending_laokuai_soulmate` | `v24_ending_laokuai_soulmate.png` | 日出共扛长凳 | 1672x941 PNG |
| `ending_laokuai_romance` | `v24_ending_laokuai_romance.png` | 木工房佩戴红木吊坠 | 1672x941 PNG |
| `ending_shura` | `v24_ending_shura.png` | 雪夜公交站独候 | 1672x941 PNG |

---

## 5. 工程验收指标与自动化校验

1. **文件完整性**：必须包含 25 个独立新图文件（20 事件 + 5 结局），文件数量校验严格为 25。
2. **唯一性哈希**：25 个文件具有 25 个全局唯一 SHA-256 哈希值，相互之间无重复。
3. **零碰撞校验**：与旧素材目录中的历史资产实现零内容哈希碰撞 (`zero hash collision`)。
4. **分辨率规格**：所有 25 张图片尺寸严格为 `1672x941`，异常尺寸统计必须满足 `bad_dimensions=0`。
5. **自动化测试集**：自动化测试套件将对事件/结局键名到文件的精确映射、Set 集合唯一性进行逐项断言。
6. **演出渲染规范**：CG 触发时，渲染引擎需统一隐藏独立前景立绘，以整幅 CG 场景呈现完整叙事。
