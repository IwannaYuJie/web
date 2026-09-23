import { Link } from 'react-router-dom'
import PageHeader from '../components/xian/PageHeader'
import { CloudDivider, Seal } from '../components/xian/Ornaments'
import { blogMilestones, blogProfile, blogProjects, contactLinks, nowItems } from '../data/blogProfile'
import { toHanNumeral } from '../utils/xianText'
import './About.css'

function About() {
  return (
    <div className="xabout">
      <PageHeader title="洞府" plain="关于小窝" seal="主人" compact />

      <div className="wrap xabout-body">
        {/* 主人小像 */}
        <section className="xowner">
          <div className="xowner-portrait">
            <span className="halo" aria-hidden="true" />
            <img src={blogProfile.avatar} alt={blogProfile.owner} />
          </div>
          <div className="xowner-text">
            <div className="kicker"><span className="rule" />洞府主人</div>
            <h2 className="brush">{blogProfile.owner}</h2>
            <p className="xowner-role elegant">{blogProfile.role}</p>
            <p className="xowner-intro">{blogProfile.intro}</p>
            <div className="xowner-links">
              {contactLinks.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.href.startsWith('http') ? '_blank' : undefined}
                  rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
                  className="chip"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </section>

        <CloudDivider />

        {/* 心法：竖排三则 */}
        <section className="xcreed">
          <div className="section-h"><h2>心法 <small>写东西的时候我会</small></h2></div>
          <ol className="xcreed-list">
            {blogProfile.manifesto.map((m, i) => (
              <li key={m} className="scroll-card rise" style={{ '--i': i }}>
                <span className="xcreed-num brush">{toHanNumeral(i + 1, { formal: true })}</span>
                <p className="xcreed-text">{m}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* 近况 */}
        <section className="xnow">
          <div className="section-h"><h2>近况 <small>最近在忙什么</small></h2></div>
          <dl className="xnow-list">
            {nowItems.map(item => (
              <div key={item.title}>
                <dt className="elegant">{item.title}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* 小物 */}
        <section className="xworks">
          <div className="section-h"><h2>顺手炼的小物 <small>项目入口</small></h2></div>
          <div className="xworks-grid">
            {blogProjects.map(p => (
              <Link key={p.title} to={p.href} className="xwork scroll-card">
                <span className="xwork-status elegant">{p.status}</span>
                <h3>{p.title}</h3>
                <p>{p.description}</p>
                <span className="link-arrow">前往 <span className="arr">→</span></span>
              </Link>
            ))}
          </div>
        </section>

        {/* 修行纪事 */}
        <section className="xchron">
          <div className="section-h"><h2>修行纪事 <small>小窝改过什么</small></h2></div>
          <ol className="xchron-list">
            {blogMilestones.map(item => (
              <li key={`${item.date}-${item.title}`}>
                <span className="xchron-date latin">{item.date}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </li>
            ))}
            <li className="origin">
              <span className="xchron-date latin">2025-05</span>
              <div>
                <h3>结庐于此</h3>
                <p>小窝开张。</p>
              </div>
            </li>
          </ol>
          <div className="xabout-seal"><Seal text="橘猫小窝" size={64} /></div>
        </section>
      </div>
    </div>
  )
}

export default About
