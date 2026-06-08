import { Link } from 'react-router-dom'
import { blogMilestones, blogProfile, blogProjects, contactLinks, nowItems } from '../data/blogProfile'

const KS = ['k1', 'k2', 'k3', 'k4']

function PageHead({ emoji, title, sub }) {
  return (
    <div style={{ padding: '34px 0 24px' }}>
      <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 900, fontSize: 'clamp(40px,7vw,72px)', lineHeight: 1, letterSpacing: '-.02em' }}>
        {emoji} {title}
      </h1>
      {sub && <p style={{ fontSize: 16, color: 'var(--ink-soft)', marginTop: 12, fontWeight: 500 }}>{sub}</p>}
    </div>
  )
}

function About() {
  return (
    <div className="wrap" style={{ maxWidth: 820, paddingBottom: 48 }}>
      <PageHead emoji="👋" title="关于小窝" />

      <div className="panel" style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 20, background: 'var(--k1-bg)', flexWrap: 'wrap' }}>
        <img
          src={blogProfile.avatar}
          alt={blogProfile.owner}
          style={{ width: 92, height: 92, borderRadius: 18, border: '3px solid var(--ink)', objectFit: 'cover', flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 200 }}>
          <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 900, fontSize: 26 }}>{blogProfile.owner}</h2>
          <p style={{ color: 'var(--ink-soft)', marginTop: 4, fontWeight: 600 }}>{blogProfile.role}</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {contactLinks.map(link => (
              <a
                key={link.label}
                href={link.href}
                target={link.href.startsWith('http') ? '_blank' : undefined}
                rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
                className="sticker"
              >
                {link.label === 'GitHub' ? '🐱 GitHub' : link.label === '邮件' ? '✉️ 邮件' : `🌐 ${link.label}`}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-h">📝 这里是什么</div>
        <p style={{ fontSize: 15.5, lineHeight: 1.8, color: 'var(--ink-soft)', fontWeight: 500 }}>
          {blogProfile.intro}
        </p>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-h">☕ 维护原则</div>
        {blogProfile.manifesto.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, fontSize: 15, fontWeight: 500, color: 'var(--ink-soft)', alignItems: 'flex-start' }}>
            <b style={{ color: 'var(--accent)' }}>🐾</b>
            <span>{m}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 20 }}>
        {nowItems.map((item, i) => (
          <div key={item.title} className={`ec ${KS[i % 4]}`} style={{ padding: 18, cursor: 'default' }}>
            <span className="cat cat-chip" style={{ border: 'none', padding: 0 }}>{item.title}</span>
            <p style={{ marginTop: 6, fontSize: 14, lineHeight: 1.65, color: 'var(--ink-soft)' }}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-h">🧪 项目与实验</div>
        <div style={{ display: 'grid', gap: 10 }}>
          {blogProjects.map((p, i) => (
            <Link
              key={p.title}
              to={p.href}
              className={`ec ${KS[i % 4]}`}
              style={{ padding: 18, display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }}
            >
              <div>
                <h3 style={{ fontSize: 18, margin: 0 }}>{p.title}</h3>
                <p style={{ fontSize: 13.5, marginTop: 4, color: 'var(--ink-soft)', lineHeight: 1.5 }}>{p.description}</p>
              </div>
              <span className="cat-chip" style={{ color: 'inherit' }}>{p.status}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-h">🕒 站点时间线</div>
        {blogMilestones.map(item => (
          <div key={`${item.date}-${item.title}`} style={{ display: 'flex', gap: 16, paddingLeft: 16, borderLeft: '3px solid var(--accent)', marginBottom: 18, position: 'relative' }}>
            <span style={{ position: 'absolute', left: -8, top: 4, width: 13, height: 13, borderRadius: 4, background: 'var(--accent)', border: '2px solid var(--ink)' }} />
            <div>
              <div style={{ fontFamily: 'var(--disp)', fontWeight: 700, fontSize: 13, color: 'var(--accent)' }}>{item.date}</div>
              <div style={{ fontWeight: 800, margin: '2px 0 4px' }}>{item.title}</div>
              <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.6 }}>{item.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default About
