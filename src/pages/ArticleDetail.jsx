import { useParams, Link } from 'react-router-dom'

/**
 * 文章详情页组件
 * 根据 URL 参数显示对应文章内容
 */
function ArticleDetail() {
  // 获取 URL 参数中的文章 ID
  const { id } = useParams()

  // Java技术文章数据库
  const articlesData = {
    1: {
      title: '☕ Spring Boot 3.0 新特性深度解析',
      date: '2025-01-27',
      author: '橘猫',
      category: 'Spring框架',
      content: `
        Spring Boot 3.0 是Spring生态系统的重大升级，带来了许多革命性的改进和新特性。

        ## 核心升级

        ### 1. Java 17 基线要求
        Spring Boot 3.0 要求最低 Java 17，充分利用了新版本的特性：
        - Records 记录类
        - 文本块
        - Switch 表达式

        ### 2. GraalVM 原生镜像支持
        构建原生镜像，启动时间毫秒级，内存占用极低。

        ### 3. 观测性增强（Observability）
        集成 Micrometer 和 Micrometer Tracing，提供统一的观测性API。

        ## 性能优化

        - 启动时间减少 20-30%
        - 内存占用降低 15%
        - AOT（Ahead-of-Time）编译支持
      `
    },
    2: {
      title: '🔥 Java 21虚拟线程实战指南',
      date: '2025-01-25',
      author: '橘猫',
      category: 'Java核心',
      content: `
        Java 21 的虚拟线程（Virtual Threads）是 Project Loom 的核心成果，彻底改变了Java的并发编程模型。

        ## 什么是虚拟线程？

        虚拟线程是轻量级的线程实现，由JVM管理而非操作系统：
        - 创建成本极低
        - 可以创建数百万个
        - 自动调度和管理

        ## 使用示例

        ### 创建虚拟线程
        \`\`\`java
        Thread vThread = Thread.ofVirtual().start(() -> {
            System.out.println("Hello from virtual thread!");
        });
        \`\`\`

        ## 性能对比

        传统线程池 vs 虚拟线程：
        - 吞吐量提升 10-100倍
        - 内存占用减少 90%
        - 延迟降低 50%
      `
    },
    3: {
      title: '🚀 微服务架构：Spring Cloud Gateway网关设计',
      date: '2025-01-23',
      author: '橘猫',
      category: '微服务',
      content: `
        Spring Cloud Gateway 是Spring Cloud生态系统中的API网关解决方案，提供了路由、过滤、限流等核心功能。

        ## 核心概念

        ### 三大组件
        1. **Route（路由）**：网关的基本构建块
        2. **Predicate（断言）**：匹配HTTP请求
        3. **Filter（过滤器）**：修改请求和响应

        ## 实战配置

        ### 路由配置
        \`\`\`yaml
        spring:
          cloud:
            gateway:
              routes:
                - id: user-service
                  uri: lb://USER-SERVICE
                  predicates:
                    - Path=/api/users/**
                  filters:
                    - StripPrefix=1
        \`\`\`

        ### 自定义全局过滤器
        \`\`\`java
        @Component
        public class AuthGlobalFilter implements GlobalFilter {
            @Override
            public Mono<Void> filter(ServerWebExchange exchange, 
                                    GatewayFilterChain chain) {
                String token = exchange.getRequest()
                    .getHeaders()
                    .getFirst("Authorization");
                
                if (StringUtils.isEmpty(token)) {
                    exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                    return exchange.getResponse().setComplete();
                }
                
                return chain.filter(exchange);
            }
        }
        \`\`\`
      `
    },
    4: {
      title: '💾 MySQL索引优化实战技巧',
      date: '2025-01-20',
      author: '橘猫',
      category: '数据库',
      content: `
        MySQL索引优化是提升数据库性能的关键，正确的索引策略可以让查询性能提升数倍甚至数十倍。

        ## 索引原理

        ### B+树结构
        MySQL InnoDB使用B+树作为索引结构：
        - 非叶子节点只存储键值
        - 叶子节点存储完整数据
        - 叶子节点通过指针连接

        ## 索引类型详解

        ### 1. 聚簇索引 vs 非聚簇索引
        \`\`\`sql
        -- 聚簇索引（主键）
        CREATE TABLE users (
            id BIGINT PRIMARY KEY,
            name VARCHAR(50),
            email VARCHAR(100)
        );

        -- 非聚簇索引（二级索引）
        CREATE INDEX idx_email ON users(email);
        \`\`\`

        ### 2. 联合索引
        \`\`\`sql
        -- 遵循最左前缀原则
        CREATE INDEX idx_name_age_city ON users(name, age, city);
        \`\`\`

        ## 优化实战

        ### 使用EXPLAIN分析
        \`\`\`sql
        EXPLAIN SELECT * FROM orders 
        WHERE user_id = 123 AND status = 'PAID'
        ORDER BY created_at DESC;
        \`\`\`
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
