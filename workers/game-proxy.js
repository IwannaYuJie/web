/**
 * Cloudflare Worker - 游戏合集反向代理 🎮
 * 
 * 功能说明:
 * - 将所有请求代理到你的主站点 /secret-games 路径
 * - 自动重写 HTML 中的链接，确保资源正确加载
 * - 隐藏原站域名，让别人看不出来源
 * - 支持所有静态资源(JS/CSS/图片等)
 * 
 * 使用场景:
 * - 访问 game.your-domain.com → 实际访问 your-main-site.com/secret-games
 * - 完全隐藏主站域名，保持游戏页面独立性
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // ============ 配置区域 ============
    // 修改为你的主站域名
    const TARGET_DOMAIN = 'jumaomaomaoju.cn';
    const TARGET_PATH = '/secret-games'; // 游戏页面路径
    
    // ============ 请求处理 ============
    
    // 1. 构建目标 URL
    let targetUrl;
    let needsRewrite = false; // 是否需要重写路径
    
    if (url.pathname === '/' || url.pathname === '') {
      // 根路径访问 - 获取主站首页但注入游戏路由
      targetUrl = `https://${TARGET_DOMAIN}/`;
      needsRewrite = true;
    } else {
      // 其他资源(JS/CSS/图片等)直接访问主站根路径
      targetUrl = `https://${TARGET_DOMAIN}${url.pathname}${url.search}`;
    }
    
    console.log(`[Proxy] ${request.url} → ${targetUrl} (rewrite: ${needsRewrite})`);
    
    // 2. 创建新请求(保留原始 headers)
    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'follow'
    });
    
    // 3. 发送请求到目标站点
    let response = await fetch(modifiedRequest);
    
    // 4. 克隆响应以便修改
    response = new Response(response.body, response);
    
    // 5. 修改响应头，移除可能暴露源站的信息
    const newHeaders = new Headers(response.headers);
    
    // 移除可能暴露源站的头
    newHeaders.delete('x-powered-by');
    newHeaders.delete('server');
    newHeaders.delete('x-vercel-id');
    newHeaders.delete('x-cloudflare-request-id');
    
    // 添加自定义头(可选)
    newHeaders.set('x-proxy-by', 'Cloudflare-Worker');
    
    // 6. 如果是 HTML，重写内容
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      let html = await response.text();
      
      // 重写绝对路径链接为相对路径
      html = html.replace(new RegExp(`https?://${TARGET_DOMAIN}`, 'g'), '');
      
      // 如果需要重写路径(访问根路径时)
      if (needsRewrite) {
        // 注入脚本,页面加载后自动跳转到游戏页面
        const redirectScript = `
          <script>
            // 如果当前不在游戏页面,自动跳转
            if (window.location.pathname === '/' || window.location.pathname === '') {
              window.history.replaceState(null, '', '/secret-games');
              // 触发 React Router 更新
              window.dispatchEvent(new PopStateEvent('popstate'));
            }
          </script>
        `;
        html = html.replace('</body>', redirectScript + '</body>');
      }
      
      // 重写 /secret-games 路径引用(保持 React Router 正常工作)
      // 注意:不要替换 pathname 中的 /secret-games,只替换链接
      html = html.replace(/href="\/secret-games"/g, 'href="/"');
      
      return new Response(html, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      });
    }
    
    // 7. 非 HTML 内容直接返回
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  }
};
