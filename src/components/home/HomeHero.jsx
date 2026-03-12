import { CAT_MOODS } from '../../constants/home'
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

function HomeHero() {
  const [currentTime] = useIntervalValue(new Date(), () => new Date(), 1000)
  const [catMood] = useIntervalValue(
    CAT_MOODS[0],
    () => CAT_MOODS[Math.floor(Math.random() * CAT_MOODS.length)],
    3000,
  )

  return (
    <section className="glass rounded-[32px] p-8 md:p-12 mb-12 flex flex-col md:flex-row items-center justify-between gap-8 animate-fade-in relative overflow-hidden">
      <div className="relative z-10 text-center md:text-left max-w-2xl">
        <div className="inline-flex items-center gap-2 bg-white/50 px-4 py-1 rounded-full mb-4 text-primary font-bold text-sm backdrop-blur-sm">
          <span>{catMood}</span>
          <span>{getGreeting(currentTime)}</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-gradient leading-tight">
          橘猫的技术小窝
        </h1>
        <p className="text-lg text-text-secondary mb-8 leading-relaxed">
          这里是 Java 技术分享的温馨角落，记录学习，分享感悟。
          <br />让我们一起在代码的世界里，保持好奇，持续探索。
        </p>
        <div className="flex gap-4 justify-center md:justify-start">
          <a href="#articles" className="btn btn-primary">
            📚 开始阅读
          </a>
          <a href="https://github.com/IwannaYuJie" target="_blank" rel="noreferrer" className="btn btn-secondary">
            💻 GitHub
          </a>
        </div>
      </div>

      <div className="relative z-10 animate-bounce">
        <img src="/images/cat-avatar.png" alt="橘猫" className="w-48 h-48 md:w-64 md:h-64 rounded-full shadow-lg border-4 border-white/50 object-cover" />
      </div>

      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
    </section>
  )
}

export default HomeHero
