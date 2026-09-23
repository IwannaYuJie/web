import { Link } from 'react-router-dom'
import PageHeader from '../components/xian/PageHeader'
import { Seal } from '../components/xian/Ornaments'
import { TOOLS } from '../data/tools'
import { toHanNumeral } from '../utils/xianText'
import './Toolbox.css'

function Toolbox() {
  return (
    <div className="xtoolbox">
      <PageHeader
        title="法宝阁"
        plain="工具箱"
        seal="法宝"
        sub="自己常用的小工具，都在浏览器里运转，不上传任何东西。"
      />

      <div className="wrap">
        <div className="xtalismans">
          {TOOLS.map((t, i) => (
            <Link to={t.path} key={t.id} className="xtalisman rise" style={{ '--i': i }}>
              <span className="xtalisman-no elegant">第{toHanNumeral(i + 1)}件</span>
              <Seal text={t.glyph} size={58} className="xtalisman-seal" />
              <span className="xtalisman-alias brush">{t.alias}</span>
              <h3>{t.title}</h3>
              <p>{t.description}</p>
              <span className="xtalisman-foot">
                <span className="elegant">{t.tag}</span>
                <span className="link-arrow">祭出 <span className="arr">→</span></span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Toolbox
