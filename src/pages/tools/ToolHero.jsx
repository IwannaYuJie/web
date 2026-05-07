function ToolHero({ emoji, tag, title, desc }) {
  return (
    <section className="glass rounded-[32px] p-6 md:p-10 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
      <div className="relative z-10 text-center md:text-left max-w-2xl">
        <div className="inline-flex items-center gap-2 bg-white/50 px-4 py-1 rounded-full mb-3 text-primary font-bold text-sm backdrop-blur-sm">
          <span>{emoji}</span>
          <span>{tag}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-3 text-gradient leading-tight">
          {title}
        </h1>
        <p className="text-base text-text-secondary leading-relaxed">{desc}</p>
      </div>
      <div className="relative z-10 text-6xl md:text-7xl select-none" aria-hidden="true">🐱</div>
      <div className="absolute top-0 right-0 w-56 h-56 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-56 h-56 bg-secondary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
    </section>
  )
}

export default ToolHero
