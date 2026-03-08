/**
 * Cloudflare Pages Functions - 邮件发送工具函数
 * 复用共享邮件模块，避免多处维护模板。
 */

export { sendSuccessEmail, sendFailureEmail } from '../_shared/email.js'
