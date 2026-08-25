import { useState, useRef } from 'react';
import './YujieSharePage.css';

const CANONICAL_URL = 'https://jumaomaomaoju.cn/yujie/';
const GAME_URL = '/games/yujie';
const BLOG_HOME_URL = '/';

const SHARE_DATA = {
  title: '《雨姐的心动时刻》',
  text: '十三天东北农家乐生活，你的态度会养成关系，也会留下后果。',
  url: CANONICAL_URL,
};

const STAT_ITEMS = [
  { label: '完整日程', value: '13', unit: '天' },
  { label: '角色支线', value: '6', unit: '条' },
  { label: '命运结局', value: '14', unit: '种' },
  { label: '自由行动', value: '18', unit: '次' },
];

const CHOICE_ITEMS = [
  '你替她扛事，她也许会慢慢卸下防备。',
  '你把主导权交给她，她会越来越习惯替你决定。',
  '你与她并肩，关系会走向另一种默契。',
];

const GALLERY_ITEMS = [
  {
    src: '/images/yujie/v24_ev_echo_d5.png',
    alt: '清晨院落中与雨姐关于农活与生计的对话',
    caption: '第五日清晨 · 院落对话',
  },
  {
    src: '/images/yujie/v24_ev_echo_d10.png',
    alt: '深秋黄昏时分两人在后院的回忆与心事',
    caption: '第十日黄昏 · 炉火未熄',
  },
  {
    src: '/images/yujie/v24_ev_goose_deep.png',
    alt: '后院赶鹅抓猪时的意外默契与笑闹',
    caption: '日常劳作 · 后院插曲',
  },
  {
    src: '/images/yujie/v24_route_laokuai_4.png',
    alt: '老蒯在灶台旁与你的私下深谈与抉择',
    caption: '老蒯支线 · 灶边深谈',
  },
];

export default function YujieSharePage() {
  const [feedback, setFeedback] = useState('');
  const feedbackTimeoutRef = useRef(null);

  const showFeedback = (msg) => {
    setFeedback(msg);
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback('');
    }, 3500);
  };

  const copyToClipboard = async () => {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(CANONICAL_URL);
        showFeedback('分发链接已复制');
        return;
      } catch {
        // Fallback below
      }
    }

    try {
      const textarea = document.createElement('textarea');
      textarea.value = CANONICAL_URL;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (success) {
        showFeedback('分发链接已复制');
      } else {
        showFeedback(`复制失败，请手动复制：${CANONICAL_URL}`);
      }
    } catch {
      showFeedback(`复制失败，请手动复制：${CANONICAL_URL}`);
    }
  };

  const handleShare = async () => {
    if (navigator.share && typeof navigator.share === 'function') {
      try {
        await navigator.share(SHARE_DATA);
        showFeedback('分享面板已打开');
      } catch (err) {
        if (err && (err.name === 'AbortError' || err.code === 20)) {
          // 用户取消分享，静默处理
          return;
        }
        await copyToClipboard();
      }
    } else {
      await copyToClipboard();
    }
  };

  return (
    <div className="yujie-share-page">
      <header className="yujie-share-header">
        <div className="yujie-share-header__inner">
          <div className="yujie-share-header__brand">
            <span className="yujie-share-header__title">橘猫小窝 · 独立游戏</span>
            <span className="yujie-share-header__version">v2.4</span>
          </div>
          <a href={BLOG_HOME_URL} className="yujie-share-header__back">
            返回博客
          </a>
        </div>
      </header>

      <main className="yujie-share-main">
        <section className="yujie-share-hero" aria-labelledby="hero-title">
          <div className="yujie-share-hero__cover-wrap">
            <img
              src="/images/yujie/yujie_share_hero.jpg"
              alt="雨姐的心动时刻游戏主视觉"
              width={1672}
              height={941}
              fetchPriority="high"
              className="yujie-share-hero__cover"
            />
          </div>
          <div className="yujie-share-hero__content">
            <p className="yujie-share-hero__eyebrow">一场会记住你态度的东北院落生活</p>
            <h1 id="hero-title" className="yujie-share-hero__heading">
              雨姐的心动时刻
            </h1>
            <p className="yujie-share-hero__tagline">
              十三天，不是把好感刷满，而是把每一句话活成后果。
            </p>
            <div className="yujie-share-hero__actions">
              <a href={GAME_URL} className="yujie-share-btn yujie-share-btn--primary">
                立即开玩
              </a>
              <button
                type="button"
                className="yujie-share-btn yujie-share-btn--secondary"
                onClick={handleShare}
              >
                分享给朋友
              </button>
            </div>
            <p className="yujie-share-hero__note">纯网页 · 无需下载 · 自动存档</p>
          </div>
        </section>

        <section className="yujie-share-stats" aria-label="游戏内容概览">
          <div className="yujie-share-stats__grid">
            {STAT_ITEMS.map((item) => (
              <div key={item.label} className="yujie-share-stat-card">
                <span className="yujie-share-stat-card__value">
                  {item.value}
                  <small className="yujie-share-stat-card__unit">{item.unit}</small>
                </span>
                <span className="yujie-share-stat-card__label">{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="yujie-share-choices" aria-labelledby="choices-title">
          <h2 id="choices-title" className="yujie-share-section__title">
            你选择的不只是答案
          </h2>
          <ul className="yujie-share-choices__list">
            {CHOICE_ITEMS.map((text, idx) => (
              <li key={idx} className="yujie-share-choices__item">
                <span className="yujie-share-choices__bullet" aria-hidden="true">
                  ◆
                </span>
                <span className="yujie-share-choices__text">{text}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="yujie-share-laokuai" aria-labelledby="laokuai-title">
          <div className="yujie-share-laokuai__card">
            <h2 id="laokuai-title" className="yujie-share-laokuai__title">
              关于老蒯：深沉而真实的抉择
            </h2>
            <p className="yujie-share-laokuai__desc">
              不仅能走向过命知己，也可能是清醒克制、双向确认的成年人情感。在院落的日子里，含糊与两头许诺都会留下真实的后果，唯有真诚才能得到坦然的答案。
            </p>
          </div>
        </section>

        <section className="yujie-share-gallery" aria-labelledby="gallery-title">
          <h2 id="gallery-title" className="yujie-share-section__title">
            游戏实机画面
          </h2>
          <div className="yujie-share-gallery__grid">
            {GALLERY_ITEMS.map((item) => (
              <figure key={item.src} className="yujie-share-gallery__figure">
                <img
                  src={item.src}
                  alt={item.alt}
                  width={1672}
                  height={941}
                  loading="lazy"
                  className="yujie-share-gallery__img"
                />
                <figcaption className="yujie-share-gallery__caption">{item.caption}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="yujie-share-cta" aria-label="开始与分享">
          <div className="yujie-share-cta__actions">
            <a href={GAME_URL} className="yujie-share-btn yujie-share-btn--primary yujie-share-btn--lg">
              开始这段缘分
            </a>
            <button
              type="button"
              className="yujie-share-btn yujie-share-btn--secondary yujie-share-btn--lg"
              onClick={copyToClipboard}
            >
              复制分发链接
            </button>
          </div>
          <div
            className={`yujie-share-feedback ${feedback ? 'yujie-share-feedback--visible' : ''}`}
            aria-live="polite"
          >
            {feedback}
          </div>
        </section>
      </main>

      <footer className="yujie-share-footer">
        <div className="yujie-share-footer__inner">
          <span className="yujie-share-footer__copy">橘猫小窝 · 网页端即开即玩</span>
          <a href={BLOG_HOME_URL} className="yujie-share-footer__link">
            返回博客
          </a>
        </div>
      </footer>
    </div>
  );
}
