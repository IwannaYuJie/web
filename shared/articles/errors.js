// 可直接向客户端展示的业务或请求错误；其他异常由接口层统一隐藏。
export class ArticleError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.name = 'ArticleError'
    this.status = status
  }
}
