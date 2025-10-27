import { useParams, Link } from 'react-router-dom'

/**
 * 文章详情页组件
 * 根据 URL 参数显示对应文章内容
 */
function ArticleDetail() {
  // 获取 URL 参数中的文章 ID
  const { id } = useParams()

  // 模拟文章数据库
  const articlesData = {
    1: {
      title: '如何使用 Vite 构建现代化前端项目',
      date: '2025-01-15',
      author: 'Doro',
      content: `
        Vite 是一个现代化的前端构建工具,它利用浏览器原生 ES 模块特性,提供了极快的开发体验。

        ## 为什么选择 Vite?

        1. **极速的冷启动**: 无需打包,即时启动开发服务器
        2. **快速的热更新**: 利用 ESM 实现精确的热模块替换
        3. **优化的构建**: 使用 Rollup 进行生产环境打包

        ## 快速开始

        使用 npm 创建项目:
        \`\`\`bash
        npm create vite@latest my-app
        \`\`\`

        选择你喜欢的框架(React、Vue、Svelte 等),然后开始开发!

        ## 最佳实践

        - 使用环境变量管理配置
        - 合理配置代理解决跨域问题
        - 利用插件生态扩展功能
      `
    },
    2: {
      title: 'React Hooks 完全指南',
      date: '2025-01-10',
      author: 'Doro',
      content: `
        React Hooks 是 React 16.8 引入的新特性,让你在不编写 class 的情况下使用 state 和其他 React 特性。

        ## 常用 Hooks

        ### useState
        用于在函数组件中添加状态:
        \`\`\`javascript
        const [count, setCount] = useState(0)
        \`\`\`

        ### useEffect
        用于处理副作用(数据获取、订阅等):
        \`\`\`javascript
        useEffect(() => {
          // 副作用代码
          return () => {
            // 清理函数
          }
        }, [依赖项])
        \`\`\`

        ### useContext
        用于跨组件共享数据,避免 props 层层传递。

        ## 使用规则

        1. 只在最顶层使用 Hooks
        2. 只在 React 函数中调用 Hooks
      `
    },
    3: {
      title: 'JavaScript 异步编程详解',
      date: '2025-01-05',
      author: 'Doro',
      content: `
        JavaScript 的异步编程是前端开发的核心概念之一。

        ## 演进历程

        ### 1. 回调函数
        最早的异步解决方案,但容易造成"回调地狱"。

        ### 2. Promise
        ES6 引入,提供了更优雅的异步处理方式:
        \`\`\`javascript
        fetch('/api/data')
          .then(response => response.json())
          .then(data => console.log(data))
          .catch(error => console.error(error))
        \`\`\`

        ### 3. async/await
        ES2017 引入,让异步代码看起来像同步代码:
        \`\`\`javascript
        async function fetchData() {
          try {
            const response = await fetch('/api/data')
            const data = await response.json()
            console.log(data)
          } catch (error) {
            console.error(error)
          }
        }
        \`\`\`

        ## 最佳实践

        - 优先使用 async/await
        - 记得处理错误
        - 避免不必要的 await
      `
    },
    4: {
      title: 'CSS Grid 布局实战',
      date: '2024-12-28',
      author: 'Doro',
      content: `
        CSS Grid 是一个强大的二维布局系统,让复杂布局变得简单。

        ## 基础概念

        Grid 容器和 Grid 项目:
        \`\`\`css
        .container {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        \`\`\`

        ## 常用属性

        - **grid-template-columns**: 定义列
        - **grid-template-rows**: 定义行
        - **gap**: 设置间距
        - **grid-area**: 定义区域

        ## 响应式布局

        结合媒体查询实现响应式:
        \`\`\`css
        @media (max-width: 768px) {
          .container {
            grid-template-columns: 1fr;
          }
        }
        \`\`\`

        Grid 让我们能够轻松实现各种复杂的布局需求!
      `
    }
  }

  // 获取当前文章数据
  const article = articlesData[id]

  // 如果文章不存在,显示 404
  if (!article) {
    return (
      <div className="container">
        <div className="not-found">
          <h1>😢 文章不存在</h1>
          <p>抱歉,找不到您要查看的文章。</p>
          <Link to="/" className="back-button">返回首页</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      {/* 返回按钮 */}
      <Link to="/" className="back-link">← 返回首页</Link>
      
      {/* 文章内容 */}
      <article className="article-detail">
        <header className="article-header">
          <h1>{article.title}</h1>
          <div className="article-meta">
            <span>👤 {article.author}</span>
            <span>📅 {article.date}</span>
          </div>
        </header>
        
        <div className="article-content">
          {/* 将文章内容按段落分割并渲染 */}
          {article.content.split('\n').map((paragraph, index) => {
            // 处理代码块
            if (paragraph.trim().startsWith('```')) {
              return null // 简化处理,实际项目可使用 markdown 解析器
            }
            // 处理标题
            if (paragraph.trim().startsWith('##')) {
              return <h2 key={index}>{paragraph.replace(/##/g, '').trim()}</h2>
            }
            // 处理普通段落
            if (paragraph.trim()) {
              return <p key={index}>{paragraph.trim()}</p>
            }
            return null
          })}
        </div>
      </article>
    </div>
  )
}

export default ArticleDetail
