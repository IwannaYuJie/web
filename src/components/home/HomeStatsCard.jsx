import { useIntervalValue } from '../../hooks'

function HomeStatsCard({ articleCount }) {
  const [visitorCount] = useIntervalValue(12345, (prev) => prev + Math.floor(Math.random() * 3), 5000)

  return (
    <div className="glass p-6 rounded-2xl">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span>📊</span> 统计
      </h2>
      <div className="space-y-3">
        <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl">
          <span className="text-text-secondary">👥 围观次数</span>
          <span className="font-bold text-primary">{visitorCount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl">
          <span className="text-text-secondary">📝 存货 (文章)</span>
          <span className="font-bold text-primary">{articleCount}</span>
        </div>
      </div>
    </div>
  )
}

export default HomeStatsCard
