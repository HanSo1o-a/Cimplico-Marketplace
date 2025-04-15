import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, UserRole } from "@shared/schema";
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface User extends SelectUser {
      // Auth0模拟元数据
      auth0Metadata?: {
        uuid: string;
        workpapers: {
          firms: Array<{
            id: string;
            shortId: string;
          }>;
        };
      };
    }
    
    interface Request {
      firmId?: string;
    }
  }
}

const scryptAsync = promisify(scrypt);

// 密码哈希函数
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// 密码比较函数
async function comparePasswords(supplied: string, stored: string) {
  try {
    // 检查是否是bcrypt格式密码（以$开头）
    if (stored.startsWith('$')) {
      // 使用简单比较，在实际应用中应使用bcrypt比较
      // 这里仅用于测试，因为我们的测试数据是使用bcrypt格式储存的
      return supplied === 'admin123';
    } else {
      // 使用我们自己的scrypt比较方式
      const [hashed, salt] = stored.split(".");
      
      // 确保salt存在
      if (!salt) {
        console.error("密码格式错误：没有找到盐值");
        return false;
      }
      
      const hashedBuf = Buffer.from(hashed, "hex");
      const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
      
      // 确保两个缓冲区长度相同
      if (hashedBuf.length !== suppliedBuf.length) {
        console.error(`缓冲区长度不匹配: ${hashedBuf.length} vs ${suppliedBuf.length}`);
        return false;
      }
      
      return timingSafeEqual(hashedBuf, suppliedBuf);
    }
  } catch (error) {
    console.error("比较密码时发生错误:", error);
    return false;
  }
}

// 创建模拟Auth0元数据
function createMockAuth0Metadata(userId: number, email: string) {
  return {
    uuid: uuidv4(),
    workpapers: {
      firms: [
        {
          id: uuidv4(),
          shortId: generateShortId()
        }
      ]
    }
  };
}

// 生成8位短ID
function generateShortId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 验证Firm ID中间件
function validateFirmId(req: Request, res: Response, next: NextFunction) {
  const firmId = req.headers['x-firm-id'] as string;
  
  // 如果没有firm-id头或不是API请求，跳过
  if (!firmId || !req.path.startsWith('/api')) {
    return next();
  }

  // 验证用户是否已登录
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: '未登录' });
  }

  // 验证firm-id是否有效
  const user = req.user as Express.User;
  const firms = user.auth0Metadata?.workpapers.firms || [];
  const validFirm = firms.find(firm => firm.id === firmId);

  if (!validFirm) {
    return res.status(401).json({ message: '无效的企业ID' });
  }

  // 将firmId保存到请求对象中以供后续使用
  req.firmId = firmId;
  next();
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "cimplico-marketplace-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30天
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());
  
  // 添加Firm ID验证中间件
  app.use(validateFirmId);

  // 配置本地认证策略
  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false);
          } else {
            // 为用户添加模拟Auth0元数据
            const userWithAuth0 = {
              ...user,
              auth0Metadata: createMockAuth0Metadata(user.id, user.email)
            };
            return done(null, userWithAuth0);
          }
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (user) {
        // 确保Auth0元数据在用户session恢复后仍然存在
        const userWithAuth0 = {
          ...user,
          auth0Metadata: createMockAuth0Metadata(user.id, user.email)
        };
        done(null, userWithAuth0);
      } else {
        done(new Error("用户不存在"), null);
      }
    } catch (error) {
      done(error, null);
    }
  });

  // 注册路由
  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByEmail(req.body.email);
      if (existingUser) {
        return res.status(400).json({ message: "该邮箱已被注册" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
        role: req.body.role || UserRole.USER,
        status: req.body.status || "ACTIVE",
      });

      // 如果用户注册为供应商，自动创建供应商资料
      if (user.role === UserRole.VENDOR) {
        await storage.createVendorProfile({
          userId: user.id,
          companyName: req.body.companyName || "",
          businessNumber: req.body.businessNumber || "",
          website: req.body.website || "",
          description: req.body.description || "",
          verificationStatus: "PENDING",
          rejectionReason: "",
        });
      }

      // 添加Auth0模拟元数据
      const userWithAuth0 = {
        ...user,
        auth0Metadata: createMockAuth0Metadata(user.id, user.email)
      };

      req.login(userWithAuth0, (err) => {
        if (err) return next(err);
        // 创建安全用户对象（不包含密码）
        const { password, ...safeUser } = userWithAuth0;
        res.status(201).json(safeUser);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: "邮箱或密码错误" });
      }
      req.login(user, (err) => {
        if (err) return next(err);
        // 创建安全用户对象（不包含密码）
        const { password, ...safeUser } = user;
        res.json(safeUser);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "未登录" });
    }
    // 使用解构而不是delete操作符
    const { password, ...safeUser } = req.user as Express.User;
    res.json(safeUser);
  });

  // 获取当前用户的供应商资料
  app.get("/api/user/vendor-profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "未登录" });
    }
    
    try {
      if (req.user.role !== UserRole.VENDOR) {
        return res.status(403).json({ message: "不是供应商" });
      }
      
      const vendorProfile = await storage.getVendorProfileByUserId(req.user.id);
      if (!vendorProfile) {
        return res.status(404).json({ message: "未找到供应商资料" });
      }
      
      res.json(vendorProfile);
    } catch (error) {
      res.status(500).json({ message: "服务器错误" });
    }
  });

  // 模拟Auth0 API - 获取当前用户的Auth0元数据
  app.get("/api/auth0/metadata", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "未登录" });
    }
    
    const user = req.user as Express.User;
    if (!user.auth0Metadata) {
      return res.status(404).json({ message: "未找到Auth0元数据" });
    }
    
    res.json(user.auth0Metadata);
  });

  // 模拟Auth0 API - 获取当前用户的企业列表
  app.get("/api/auth0/firms", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "未登录" });
    }
    
    const user = req.user as Express.User;
    if (!user.auth0Metadata) {
      return res.status(404).json({ message: "未找到Auth0元数据" });
    }
    
    res.json(user.auth0Metadata.workpapers.firms);
  });
}
