/**
 * API 测试端点
 * 用于诊断 Cloudflare Functions 是否正常工作
 */

export async function onRequest(context) {
  const { request } = context
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-HTTP-Method-Override',
    'Content-Type': 'application/json; charset=utf-8'
  }
  
  // 处理 OPTIONS 预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }
  
  // 获取请求信息
  const url = new URL(request.url)
  const method = request.method
  const methodOverride = request.headers.get('X-HTTP-Method-Override')
  
  const responseData = {
    success: true,
    message: 'Cloudflare Functions 工作正常！',
    details: {
      method: method,
      methodOverride: methodOverride,
      effectiveMethod: methodOverride || method,
      url: url.href,
      pathname: url.pathname,
      timestamp: new Date().toISOString(),
      headers: Object.fromEntries(request.headers.entries())
    }
  }
  
  return new Response(JSON.stringify(responseData, null, 2), {
    status: 200,
    headers: corsHeaders
  })
}
