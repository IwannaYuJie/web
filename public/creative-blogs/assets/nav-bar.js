/**
 * 博客风格全局浮动导航切换器 (16 款全风格)
 */
(function() {
  const styles = [
    { id: "01", name: "瑞士国际主义极简风", desc: "严格数学网格 · 巨型无衬线黑体 · 克莱因红点缀", file: "style-01-swiss.html" },
    { id: "02", name: "复古报纸与文学期刊", desc: "经典多栏报刊 · 优雅衬线宋体 · 首字下沉与纸张质感", file: "style-02-newspaper.html" },
    { id: "03", name: "赛博朋克终端霓虹", desc: "暗黑科幻 · 霓虹发光描边 · HUD 仪表盘与扫描线", file: "style-03-cyberpunk.html" },
    { id: "04", name: "90年代经典操作系统", desc: "Win95 复古视窗 · 凹凸斜面 · 像素图标与便签", file: "style-04-retro-os.html" },
    { id: "05", name: "日式禅意极简杂志", desc: "极致留白呼吸感 · 横竖文字混排 · 质朴低饱和素灰", file: "style-05-zen.html" },
    { id: "06", name: "新粗野主义与波普", desc: "高饱和撞色 · 黑色粗实线描边 · 3D 硬阴影与贴纸", file: "style-06-neobrutalism.html" },
    { id: "07", name: "数字花园与知识图谱", desc: "Obsidian/Notion 双向链接 · Canvas 交互关系图谱", file: "style-07-digital-garden.html" },
    { id: "08", name: "手账涂鸦与拼贴手作", desc: "手写体 · 和纸胶带与图钉 · 牛皮纸便签与全屏戳图章", file: "style-08-scrapbook.html" },
    { id: "09", name: "中世纪羊皮纸手抄本", desc: "泥金手抄本 · 华丽首字母插画 · 可交互火漆蜡封印章", file: "style-09-medieval-codex.html" },
    { id: "10", name: "纯文本黑客命令行交互", desc: "纯字符 CLI 终端 · ASCII 艺术字 · 可输入执行指令", file: "style-10-terminal.html" },
    { id: "11", name: "蒸汽波与80s合成器浪潮", desc: "复古网格夕阳 · 霓虹粉紫渐变 · 磁带播放器微组件", file: "style-11-synthwave.html" },
    { id: "12", name: "CAD 建筑工程蓝图", desc: "深蓝晒图纸 · 测绘尺寸标注 · 真实工程图框与十字准星", file: "style-12-blueprint.html" },
    { id: "13", name: "高端独立时尚大画报", desc: "极繁主义字体碰撞 · 跨页巨幅艺术引言 · 杂志视觉张力", file: "style-13-fashion.html" },
    { id: "14", name: "8-Bit 像素地牢冒险日志", desc: "复古游戏血条/蓝条 · 可点击物品装备栏 · 任务冒险", file: "style-14-pixel-rpg.html" },
    { id: "15", name: "未来拟态毛玻璃实验室", desc: "多层景深毛玻璃 · 鼠标跟随极光流体 · 现代高科技感", file: "style-15-glassmorphism.html" },
    { id: "16", name: "胶片暗房与拍立得影集", desc: "胶卷齿孔底片 · 琥珀红光暗房 · EXIF 摄影参数铭牌", file: "style-16-darkroom.html" },
    { id: "17", name: "二次元日系萌系物语", desc: "🌸 樱花落瓣动效 · 视觉小说 Galgame 气泡对话框 · 追番电台", file: "style-17-anime.html" },
    { id: "18", name: "美式复古美漫与波普", desc: "💥 本·戴网点纸 · 动态分镜大画框 · 拟声词音效与美漫字阶", file: "style-18-comic.html" },
    { id: "19", name: "航天局深空探索手册", desc: "🚀 阿波罗/阿尔忒弥斯任务清单 · 遥测 HUD 仪表与地月轨道", file: "style-19-space.html" },
    { id: "20", name: "维多利亚机械档案馆", desc: "⚙️ 旋转黄铜齿轮 · 蒸汽压力表 · 铆钉与差分机发明手记", file: "style-20-steampunk.html" },
    { id: "21", name: "复古黑胶唱片音乐志", desc: "📻 33⅓ RPM 旋转黑胶唱机 · 唱针播放控制 · 独立乐评", file: "style-21-vinyl.html" },
    { id: "22", name: "皇家植物标本标本志", desc: "🌿 自然历史博物馆植物台纸 · 压制花草标本 · 林奈分类法", file: "style-22-botanical.html" },
    { id: "23", name: "达芬奇手稿与发明志", desc: "📜 鸟类飞行扑翼草图 · 黄金比例几何 · 达芬奇镜面解密手迹", file: "style-23-davinci.html" },
    { id: "24", name: "水墨国风与卷轴画卷", desc: "🖌️ 宣纸温润底色 · 宋元山水长卷 · 朱砂闲章与竖排诗文", file: "style-24-ink-wash.html" },
    { id: "25", name: "Y2K 千禧充气金属潮流", desc: "🔮 流动水银铬合金 · 3D 充气泡泡字 · 果冻玻璃微浮雕", file: "style-25-y2k.html" },
    { id: "26", name: "GameBoy 经典复古掌机", desc: "🕹️ 四色墨绿点阵 LCD · 8-Bit 像素 · 真实十字键与按键操作", file: "style-26-gameboy.html" },
    { id: "27", name: "黑客帝国数字雨解码", desc: "🟢 Canvas 字符落雨 · 纯黑控制台 · 实时段落解码重构", file: "style-27-matrix.html" },
    { id: "28", name: "包豪斯几何构成主义", desc: "📐 经典红黄蓝三原色 · 几何形体穿插 · 动态平衡非对称", file: "style-28-bauhaus.html" },
    { id: "29", name: "侦探绝密案件档案袋", desc: "🕵️ 牛皮纸卷宗 · TOP SECRET 绝密印章 · 涂黑脱敏解密", file: "style-29-detective.html" },
    { id: "30", name: "酸性设计与金属流体", desc: "⚡ 液态铬合金 · 先锋反叛排版 · 霓虹流体失真滤镜", file: "style-30-acid.html" }
  ];

  function initSwitcher() {
    const currentPath = window.location.pathname;
    const currentFile = currentPath.substring(currentPath.lastIndexOf('/') + 1) || "index.html";

    // 创建浮动按钮
    const trigger = document.createElement("button");
    trigger.className = "blog-switcher-trigger";
    trigger.setAttribute("title", "点击切换博客排版风格 (共30种风格)");
    trigger.innerHTML = `
      <span class="dot"></span>
      <span>🎨 切换博客排版风格 (30款)</span>
    `;

    // 创建弹窗
    const modal = document.createElement("div");
    modal.className = "blog-switcher-modal";
    
    let itemsHtml = styles.map(s => {
      const isCurrent = currentFile === s.file;
      return `
        <a href="${s.file}" class="blog-switcher-item ${isCurrent ? 'current' : ''}">
          <div class="blog-item-num">STYLE ${s.id}</div>
          <div class="blog-item-name">${s.name}</div>
          <div class="blog-item-desc">${s.desc}</div>
        </a>
      `;
    }).join("");

    modal.innerHTML = `
      <div class="blog-switcher-panel">
        <div class="blog-switcher-header">
          <div class="blog-switcher-title">
            <span>✨</span>
            <span>30 种排版风格个人博客全景矩阵</span>
          </div>
          <button class="blog-switcher-close" title="关闭">✕</button>
        </div>
        <div class="blog-switcher-grid">
          ${itemsHtml}
        </div>
        <div class="blog-switcher-footer" style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          <a href="index.html" class="blog-hub-btn">🏠 风格矩阵总览</a>
          <a href="/creative" class="blog-hub-btn" style="background: var(--o, #f2570a); color: #fff;">🐾 返回橘猫小窝主站</a>
        </div>
      </div>
    `;

    document.body.appendChild(trigger);
    document.body.appendChild(modal);

    // 事件绑定
    trigger.addEventListener("click", () => modal.classList.add("active"));
    modal.querySelector(".blog-switcher-close").addEventListener("click", () => modal.classList.remove("active"));
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("active");
    });
    
    // ESC 键关闭
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("active")) {
        modal.classList.remove("active");
      }
    });
  }

  // 全局滚动渐显 (Scroll Reveal)
  function initScrollReveal() {
    if (!("IntersectionObserver" in window)) return;

    const revealElements = document.querySelectorAll(
      "article, .article-item, .post-item, .log-entry, .article-card, .case-file, section, .sidebar-block, .specimen-plate, .parchment-sheet"
    );

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("fx-revealed");
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: "0px 0px -30px 0px",
      threshold: 0.05
    });

    revealElements.forEach((el, idx) => {
      el.classList.add("fx-reveal-init");
      el.style.setProperty("--fx-delay", `${(idx % 3) * 0.08}s`);
      observer.observe(el);
    });
  }

  // 全局点击水波纹 (Click Ripple)
  function initClickRipple() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("button, .btn, .nav-link, a.control-btn, .interactive-tag, .card-action-btn");
      if (!btn) return;

      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement("span");
      ripple.className = "fx-ripple-wave";
      const size = Math.max(rect.width, rect.height) * 2;
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;

      const currentPos = window.getComputedStyle(btn).position;
      if (currentPos === "static") {
        btn.style.position = "relative";
      }
      btn.style.overflow = "hidden";
      btn.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, 550);
    });
  }

  // 全局阅读进度条 (Reading Progress)
  function initReadingProgress() {
    const bar = document.createElement("div");
    bar.className = "fx-reading-progress-bar";
    document.body.appendChild(bar);

    window.addEventListener("scroll", () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = `${progress}%`;
    }, { passive: true });
  }

  function initAll() {
    initSwitcher();
    initScrollReveal();
    initClickRipple();
    initReadingProgress();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
