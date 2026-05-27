import { Link } from 'react-router-dom'
import { CAT_MOODS } from '../../constants/home'
import { blogProfile, nowItems } from '../../data/blogProfile'
import { useIntervalValue } from '../../hooks'

function getGreeting(currentTime) {
  const hour = currentTime.getHours()
  if (hour < 6) { return '🌙 夜深了，记得早点休息哦~' }
  if (hour < 9) { return '🌅 早安！新的一天开始啦~' }
  if (hour < 12) { return '☀️ 上午好！元气满满地工作吧~' }
  if (hour < 14) { return '🍴 中午好！记得吃午饭哦~' }
  if (hour < 18) { return '🌤️ 下午好！继续加油鸭~' }
  if (hour < 22) { return '🌆 晚上好！今天辛苦啦~' }
  return '🌃 夜深了，早点休息吧~'
}

function HomeHero({ stats, featuredArticle }) {
  const [currentTime] = useIntervalValue(new Date(), () => new Date(), 1000)
  const [catMood] = useIntervalValue(
    CAT_MOODS[0],
    () => CAT_MOODS[Math.floor(Math.random() * CAT_MOODS.length)],
    3000,
  )

  // 计算小窝稳定运行时间 (以 2025-05-25 开建算起)
  const siteStartDate = new Date('2025-05-25T00:00:00')
  const timeDiff = Math.max(0, currentTime.getTime() - siteStartDate.getTime())
  const diffDays = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const diffMinutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))

  return (
    <section className="mb-12 grid gap-6 lg:grid-cols-[1fr_360px] items-stretch animate-fade-in">
      <div className="glass rounded-2xl p-6 md:p-10">
        <div className="inline-flex items-center gap-2 bg-white/70 px-4 py-2 rounded-full mb-5 text-primary font-bold text-sm border border-border-color">
          <span>{catMood}</span>
          <span>{getGreeting(currentTime)}</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-5 text-text-color leading-tight">
          橘猫小窝
        </h1>
        <p className="text-lg text-text-secondary mb-8 leading-relaxed max-w-3xl">
          {blogProfile.intro}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="rounded-xl bg-white/75 p-4 border border-border-color">
            <div className="text-2xl font-extrabold text-primary">{stats?.articleCount || 0}</div>
            <div className="text-xs text-text-secondary">文章</div>
          </div>
          <div className="rounded-xl bg-white/75 p-4 border border-border-color">
            <div className="text-2xl font-extrabold text-primary">{stats?.categoryCount || 0}</div>
            <div className="text-xs text-text-secondary">分类</div>
          </div>
          <div className="rounded-xl bg-white/75 p-4 border border-border-color">
            <div className="text-2xl font-extrabold text-primary">{stats?.tagCount || 0}</div>
            <div className="text-xs text-text-secondary">标签</div>
          </div>
          <div className="rounded-xl bg-white/75 p-4 border border-border-color">
            <div className="text-2xl font-extrabold text-primary">{stats?.totalReadMinutes || 0}</div>
            <div className="text-xs text-text-secondary">分钟</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mb-8">
          <a href="#articles" className="btn btn-primary">
            📚 开始阅读
          </a>
          <Link to="/archive" className="btn btn-secondary">
            🗂️ 文章归档
          </Link>
          <Link to="/about" className="btn btn-ghost">
            👋 关于小窝
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-border-color/60">
          {nowItems.map(item => (
            <div key={item.title} className="rounded-xl bg-white/40 p-4 border border-white/30 hover:bg-white/60 transition-colors">
              <div className="text-xs font-bold text-primary mb-1">📌 {item.title}</div>
              <div className="text-xs text-text-secondary leading-relaxed">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <aside className="glass rounded-2xl p-6 flex flex-col gap-4">
        <div className="flex items-center gap-4 mb-2">
          <img
            src={blogProfile.avatar}
            alt={blogProfile.owner}
            className="w-20 h-20 rounded-full shadow-lg border-4 border-white/60 object-cover"
          />
          <div>
            <div className="font-extrabold text-xl text-text-color">{blogProfile.owner}</div>
            <div className="text-sm text-text-secondary mt-1">{blogProfile.role}</div>
          </div>
        </div>

        {/* 社交媒体便捷通道 */}
        <div className="flex gap-2">
          <a
            href={blogProfile.github}
            target="_blank"
            rel="noreferrer"
            className="flex-1 btn btn-secondary py-2 text-xs font-bold justify-center"
          >
            🐱 GitHub
          </a>
          <a
            href={`mailto:${blogProfile.email}`}
            className="flex-1 btn btn-secondary py-2 text-xs font-bold justify-center"
          >
            ✉️ 发邮件
          </a>
        </div>

        {featuredArticle && (
          <Link to={`/article/${featuredArticle.id}`} className="card card-hover block bg-white/75 flex flex-col justify-between p-4">
            <div>
              <div className="text-xs font-bold text-primary mb-1">最新文章</div>
              <h2 className="font-extrabold text-sm text-text-color leading-snug">{featuredArticle.title}</h2>
              <p className="text-xs text-text-secondary mt-2 line-clamp-2">{featuredArticle.description}</p>
            </div>
            <div className="mt-3 text-xs font-bold text-primary">继续阅读 →</div>
          </Link>
        )}

        {/* 橘猫状态面板 */}
        <div className="rounded-xl bg-white/50 p-4 border border-white/40 space-y-3">
          <div className="text-xs font-bold text-primary flex items-center gap-1">🐾 橘猫状态机</div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-text-secondary">
            <div className="bg-white/40 p-2 rounded-lg border border-border-color/30">
              <div>🍗 饱食度</div>
              <div className="font-bold text-text-color mt-0.5">92% (已吃饱)</div>
            </div>
            <div className="bg-white/40 p-2 rounded-lg border border-border-color/30">
              <div>🔋 电量</div>
              <div className="font-bold text-text-color mt-0.5">85% (元气满满)</div>
            </div>
            <div className="bg-white/40 p-2 rounded-lg border border-border-color/30 col-span-2">
              <div>🎯 当前动态</div>
              <div className="font-bold text-primary mt-0.5">正在打磨前端组件排版...</div>
            </div>
          </div>
        </div>

        {/* 运行时间小部件 */}
        <div className="rounded-xl bg-white/50 p-4 border border-white/40 mt-auto">
          <div className="text-xs font-bold text-primary flex items-center justify-between">
            <span>⏱️ 小窝稳定运行</span>
            <span className="text-[10px] text-text-light font-mono">EST. 2025</span>
          </div>
          <div className="text-sm font-extrabold text-text-color mt-2 font-mono flex items-baseline gap-1">
            <span>{diffDays}</span><span className="text-xs text-text-secondary font-sans font-normal">天</span>
            <span>{diffHours}</span><span className="text-xs text-text-secondary font-sans font-normal">小时</span>
            <span>{diffMinutes}</span><span className="text-xs text-text-secondary font-sans font-normal">分</span>
          </div>
        </div>
      </aside>
    </section>
  )
}

export default HomeHero
