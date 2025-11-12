/**
 * Cloudflare Pages Function - 初始化文章数据
 * 用于将默认文章数据导入到 KV 存储中
 * 
 * 访问 /api/init-articles 即可初始化数据
 * 注意：此接口会覆盖现有数据，请谨慎使用！
 */

// CORS 响应头配置
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json; charset=utf-8'
}

// 默认文章数据
const defaultArticles = [
  {
    id: 1,
    title: '☕ Spring Boot 3.0 新特性深度解析',
    description: '探索Spring Boot最新版本的革命性改进，包括GraalVM原生镜像支持、观测性增强等核心特性',
    date: '2025-01-27',
    category: 'Spring框架',
    readTime: '15 分钟'
  },
  {
    id: 2,
    title: '🔥 Java 21虚拟线程实战指南',
    description: '深入理解Project Loom带来的虚拟线程，如何在高并发场景下提升应用性能',
    date: '2025-01-25',
    category: 'Java核心',
    readTime: '20 分钟'
  },
  {
    id: 3,
    title: '🚀 微服务架构：Spring Cloud Gateway网关设计',
    description: '构建高性能API网关，实现统一认证、限流、熔断等企业级功能',
    date: '2025-01-23',
    category: '微服务',
    readTime: '18 分钟'
  },
  {
    id: 4,
    title: '💾 MySQL索引优化实战技巧',
    description: '从B+树原理到实际案例，全面掌握MySQL索引优化策略，提升查询性能10倍',
    date: '2025-01-20',
    category: '数据库',
    readTime: '25 分钟'
  },
  {
    id: 5,
    title: '🛡️ Spring Security 6.0 JWT认证完整实现',
    description: '构建安全的RESTful API，实现基于JWT的无状态认证授权机制',
    date: '2025-01-18',
    category: 'Spring框架',
    readTime: '22 分钟'
  },
  {
    id: 6,
    title: '📊 JVM调优实战：从理论到实践',
    description: '深入JVM内存模型，掌握GC调优技巧，解决生产环境性能问题',
    date: '2025-01-15',
    category: 'JVM',
    readTime: '30 分钟'
  },
  {
    id: 7,
    title: '🔄 Redis分布式锁的正确实现方式',
    description: '避免常见陷阱，使用Redisson实现高可用的分布式锁解决方案',
    date: '2025-01-12',
    category: '中间件',
    readTime: '16 分钟'
  },
  {
    id: 8,
    title: '📦 Docker容器化Spring Boot应用最佳实践',
    description: '从Dockerfile编写到K8s部署，打造云原生Java应用',
    date: '2025-01-10',
    category: '云原生',
    readTime: '20 分钟'
  },
  {
    id: 9,
    title: '⚡ RabbitMQ消息队列高级特性详解',
    description: '死信队列、延迟队列、消息确认机制等企业级应用场景实战',
    date: '2025-01-08',
    category: '中间件',
    readTime: '24 分钟'
  },
  {
    id: 10,
    title: '🏗️ DDD领域驱动设计在Java项目中的落地',
    description: '从战略设计到战术设计，构建高内聚低耦合的业务系统',
    date: '2025-01-05',
    category: '架构设计',
    readTime: '35 分钟'
  },
  {
    id: 11,
    title: '🔍 Elasticsearch全文搜索引擎实战',
    description: '构建高性能搜索系统，实现分词、高亮、聚合分析等功能',
    date: '2025-01-03',
    category: '搜索引擎',
    readTime: '28 分钟'
  },
  {
    id: 12,
    title: '🎯 MyBatis-Plus高级用法与性能优化',
    description: '动态SQL、分页插件、乐观锁等特性深度应用，提升开发效率',
    date: '2025-01-01',
    category: '持久层',
    readTime: '18 分钟'
  }
]

/**
 * 主处理函数
 */
export async function onRequest(context) {
  const { request, env } = context
  const method = request.method
  
  // 处理 OPTIONS 预检请求
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }
  
  // 只允许 POST 请求
  if (method !== 'POST' && method !== 'GET') {
    return new Response(JSON.stringify({ error: '只支持 GET 或 POST 请求' }), {
      status: 405,
      headers: corsHeaders
    })
  }
  
  // 检查 KV 绑定是否存在
  if (!env.ARTICLES_KV) {
    return new Response(JSON.stringify({ 
      error: 'KV 命名空间未配置',
      message: '请在 Cloudflare Pages 设置中绑定 ARTICLES_KV'
    }), {
      status: 500,
      headers: corsHeaders
    })
  }
  
  try {
    // 检查是否已有数据
    const existingData = await env.ARTICLES_KV.get('articles_list', { type: 'json' })
    
    if (existingData && existingData.length > 0 && method === 'GET') {
      return new Response(JSON.stringify({
        message: '数据已存在',
        count: existingData.length,
        articles: existingData,
        tip: '如需重新初始化，请使用 POST 请求'
      }), {
        status: 200,
        headers: corsHeaders
      })
    }
    
    // 写入默认数据到 KV
    await env.ARTICLES_KV.put('articles_list', JSON.stringify(defaultArticles))
    
    return new Response(JSON.stringify({
      success: true,
      message: '文章数据初始化成功！',
      count: defaultArticles.length,
      articles: defaultArticles
    }), {
      status: 200,
      headers: corsHeaders
    })
  } catch (error) {
    console.error('初始化失败:', error)
    return new Response(JSON.stringify({
      error: '初始化失败',
      message: error.message
    }), {
      status: 500,
      headers: corsHeaders
    })
  }
}
