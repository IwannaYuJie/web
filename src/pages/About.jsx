import { Link } from 'react-router-dom'
import { blogMilestones, blogProfile, blogProjects, contactLinks, nowItems } from '../data/blogProfile'

function About() {
  return (
    <div className="container pb-12 space-y-10">
      <section className="grid gap-8 lg:grid-cols-[1fr_320px] items-start">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-bold text-primary border border-border-color">
            <span>About</span>
            <span>个人博客档案</span>
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-text-color mb-5">
              {blogProfile.owner}，在这里认真记录技术和生活的判断。
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed max-w-3xl">
              {blogProfile.intro}
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {blogProfile.manifesto.map(item => (
              <div key={item} className="card bg-white/80">
                <p className="font-bold text-text-color">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="glass rounded-2xl p-6">
          <img
            src={blogProfile.avatar}
            alt={blogProfile.owner}
            className="w-28 h-28 rounded-full border-4 border-white shadow-lg object-cover mb-5"
          />
          <h2 className="text-2xl font-extrabold text-text-color">{blogProfile.name}</h2>
          <p className="text-sm text-text-secondary mt-2">{blogProfile.role}</p>
          <div className="mt-5 space-y-2 text-sm text-text-secondary">
            <p>📍 {blogProfile.location}</p>
            <p>✉️ {blogProfile.email}</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {contactLinks.map(link => (
              <a
                key={link.label}
                href={link.href}
                target={link.href.startsWith('http') ? '_blank' : undefined}
                rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
                className="btn btn-secondary text-sm px-4 py-2"
              >
                {link.label}
              </a>
            ))}
          </div>
        </aside>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {nowItems.map(item => (
          <div key={item.title} className="glass rounded-2xl p-6">
            <div className="text-sm font-bold text-primary mb-2">{item.title}</div>
            <p className="text-text-secondary leading-relaxed">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-text-color">项目与实验</h2>
            <p className="text-text-secondary mt-1">博客之外，也放一些正在打磨的小工具和玩具。</p>
          </div>
          <Link to="/archive" className="btn btn-ghost hidden sm:inline-flex">
            看文章归档 →
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {blogProjects.map(project => (
            <Link key={project.title} to={project.href} className="card card-hover block">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="font-extrabold text-lg text-text-color">{project.title}</h3>
                <span className="text-xs font-bold rounded-full bg-primary/10 text-primary px-3 py-1">
                  {project.status}
                </span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">{project.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="glass rounded-2xl p-6 md:p-8">
        <h2 className="text-2xl font-extrabold text-text-color mb-6">小窝时间线</h2>
        <div className="space-y-5">
          {blogMilestones.map(item => (
            <div key={`${item.date}-${item.title}`} className="grid gap-3 md:grid-cols-[120px_1fr]">
              <div className="font-bold text-primary">{item.date}</div>
              <div className="border-l-2 border-border-color pl-5 pb-5">
                <h3 className="font-extrabold text-text-color">{item.title}</h3>
                <p className="text-sm text-text-secondary mt-1 leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default About
