import { Request, Response, NextFunction } from 'express';

// 简易国际化中间件
export const i18nMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // 从请求 header、cookie 或 query 参数获取语言设置
  const lang = req.headers['accept-language'] || req.query.lang || 'en';
  
  // 只支持中文和英文
  req.language = lang.toString().startsWith('en') ? 'en' : 'en';
  
  // 将语言设置注入到 response locals 中，方便视图访问
  res.locals.language = req.language;
  
  next();
};

// 为 Express.Request 扩展 language 属性
declare global {
  namespace Express {
    interface Request {
      language: string;
    }
  }
}

// 翻译文本
const translations: Record<string, Record<string, string>> = {
  en: {
    // 通用
    'app.name': 'Cimplico Marketplace',
    'app.tagline': '专业工作底稿市场',
    
    // 认证相关
    'auth.login': '登录',
    'auth.register': '注册',
    'auth.logout': '退出登录',
    'auth.email': '邮箱',
    'auth.password': '密码',
    'auth.confirmPassword': '确认密码',
    'auth.firstName': '名',
    'auth.lastName': '姓',
    
    // 错误消息
    'error.unauthorized': '未授权访问',
    'error.invalidCredentials': '邮箱或密码错误',
    'error.emailExists': '该邮箱已被注册',
    'error.passwordMismatch': '两次输入的密码不匹配',
    
    // 用户角色
    'role.user': '用户',
    'role.vendor': '供应商',
    'role.admin': '管理员',
    
    // 商品相关
    'product.category': '分类',
    'product.price': '价格',
    'product.free': '免费',
    'product.addToCart': '加入购物车',
    'product.download': '下载',
    'product.rating': '评分',
    
    // 供应商相关
    'vendor.becomeVendor': '成为供应商',
    'vendor.verificationStatus': '验证状态',
    'vendor.pending': '审核中',
    'vendor.approved': '已认证',
    'vendor.rejected': '未通过'
  },
  en: {
    // General
    'app.name': 'Cimplico Marketplace',
    'app.tagline': 'Professional Workpaper Marketplace',
    
    // Authentication
    'auth.login': 'Log In',
    'auth.register': 'Register',
    'auth.logout': 'Log Out',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.firstName': 'First Name',
    'auth.lastName': 'Last Name',
    
    // Error messages
    'error.unauthorized': 'Unauthorized access',
    'error.invalidCredentials': 'Invalid email or password',
    'error.emailExists': 'Email already registered',
    'error.passwordMismatch': 'Passwords do not match',
    
    // User roles
    'role.user': 'User',
    'role.vendor': 'Vendor',
    'role.admin': 'Administrator',
    
    // Product related
    'product.category': 'Category',
    'product.price': 'Price',
    'product.free': 'Free',
    'product.addToCart': 'Add to Cart',
    'product.download': 'Download',
    'product.rating': 'Rating',
    
    // Vendor related
    'vendor.becomeVendor': 'Become a Vendor',
    'vendor.verificationStatus': 'Verification Status',
    'vendor.pending': 'Pending',
    'vendor.approved': 'Approved',
    'vendor.rejected': 'Rejected'
  }
};

// 翻译函数
export const t = (key: string, lang: string = 'en'): string => {
  const language = lang.startsWith('en') ? 'en' : 'en';
  return translations[language][key] || key;
};
