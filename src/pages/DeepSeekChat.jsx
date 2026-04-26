import DeepSeekChatPanel from '../components/home/DeepSeekChatPanel'

function DeepSeekChat() {
  return (
    <div className="container pb-12 animate-fade-in">
      <section className="deepseek-chat-page">
        <header className="deepseek-chat-page__intro">
          <div className="deepseek-chat-page__eyebrow">DeepSeek V4</div>
          <h1>DeepSeek 对话</h1>
          <p>
            使用你自己的 API Key，在浏览器里直接体验 DeepSeek V4 Flash 和 V4 Pro。
            Key 只会保存在当前浏览器本地。
          </p>
        </header>
        <DeepSeekChatPanel />
      </section>
    </div>
  )
}

export default DeepSeekChat
