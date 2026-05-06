import DeepSeekChatPanel from '../components/home/DeepSeekChatPanel'

function DeepSeekChat() {
  return (
    <div className="container pb-12 animate-fade-in">
      <section className="glass rounded-[32px] p-8 md:p-12 mb-8 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
        <div className="relative z-10 text-center md:text-left max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/50 px-4 py-1 rounded-full mb-4 text-primary font-bold text-sm backdrop-blur-sm">
            <span>🚀</span>
            <span>DeepSeek V4</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-gradient leading-tight">
            DeepSeek 对话
          </h1>
          <p className="text-base md:text-lg text-text-secondary leading-relaxed">
            用你自己的 API Key，在浏览器里直接体验 DeepSeek V4 Flash 和 V4 Pro。
            <br className="hidden md:block" />
            Key 只保存在当前浏览器本地，不会上传到服务器。
          </p>
        </div>

        <div className="relative z-10 text-7xl md:text-8xl select-none" aria-hidden="true">
          🐱
        </div>

        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
      </section>

      <section className="deepseek-chat-page">
        <DeepSeekChatPanel />
      </section>
    </div>
  )
}

export default DeepSeekChat
