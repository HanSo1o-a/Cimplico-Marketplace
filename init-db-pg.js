"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var pg_1 = require("pg");
var pg_pool_1 = require("drizzle-orm/pg-pool");
var schema = require("./shared/schema");
// 创建连接池
var pool = new pg_1.Pool({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/workpaper_market'
});
// 创建 drizzle ORM 实例
var db = (0, pg_pool_1.drizzle)(pool, { schema: schema });
function initDatabase() {
    return __awaiter(this, void 0, void 0, function () {
        var existingUsers, admin, vendor1, vendor2, user1, vendorProfile1, vendorProfile2, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('开始初始化数据库...');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 11, 12, 14]);
                    return [4 /*yield*/, db.select().from(schema.users)];
                case 2:
                    existingUsers = _a.sent();
                    if (!(existingUsers.length > 0)) return [3 /*break*/, 4];
                    console.log('数据库已有数据，跳过初始化');
                    return [4 /*yield*/, pool.end()];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
                case 4: return [4 /*yield*/, db.insert(schema.users).values({
                        email: 'admin@cimplico.com',
                        password: '$2b$10$XxPT7EJkZpP.RzclknQZxu1EKsxOa8mAMh3xT87sdoehRW0W7RXq2', // 密码: admin123
                        firstName: 'Admin',
                        lastName: 'User',
                        role: schema.UserRole.ADMIN,
                        status: 'ACTIVE',
                        avatar: null,
                        phone: null,
                        language: 'en'
                    }).returning()];
                case 5:
                    admin = (_a.sent())[0];
                    console.log('已创建管理员账户:', admin.email);
                    return [4 /*yield*/, db.insert(schema.users).values({
                            email: 'vendor1@example.com',
                            password: '$2b$10$XxPT7EJkZpP.RzclknQZxu1EKsxOa8mAMh3xT87sdoehRW0W7RXq2', // 密码: admin123
                            firstName: '李',
                            lastName: '明',
                            role: schema.UserRole.VENDOR,
                            status: 'ACTIVE',
                            avatar: null,
                            phone: '13800138000',
                            language: 'en'
                        }).returning()];
                case 6:
                    vendor1 = (_a.sent())[0];
                    return [4 /*yield*/, db.insert(schema.users).values({
                            email: 'vendor2@example.com',
                            password: '$2b$10$XxPT7EJkZpP.RzclknQZxu1EKsxOa8mAMh3xT87sdoehRW0W7RXq2', // 密码: admin123
                            firstName: '王',
                            lastName: '芳',
                            role: schema.UserRole.VENDOR,
                            status: 'ACTIVE',
                            avatar: null,
                            phone: '13900139000',
                            language: 'en'
                        }).returning()];
                case 7:
                    vendor2 = (_a.sent())[0];
                    console.log('已创建供应商账户:', vendor1.email, vendor2.email);
                    return [4 /*yield*/, db.insert(schema.users).values({
                            email: 'user1@example.com',
                            password: '$2b$10$XxPT7EJkZpP.RzclknQZxu1EKsxOa8mAMh3xT87sdoehRW0W7RXq2', // 密码: admin123
                            firstName: '张',
                            lastName: '伟',
                            role: schema.UserRole.USER,
                            status: 'ACTIVE',
                            avatar: null,
                            phone: '13700137000',
                            language: 'en'
                        }).returning()];
                case 8:
                    user1 = (_a.sent())[0];
                    console.log('已创建普通用户:', user1.email);
                    return [4 /*yield*/, db.insert(schema.vendorProfiles).values({
                            userId: vendor1.id,
                            companyName: '安永会计师事务所',
                            businessNumber: '91310000000000000X',
                            website: 'https://www.ey.com',
                            description: '全球领先的会计师事务所之一，提供高质量的审计、税务和咨询服务。',
                            verificationStatus: schema.VendorVerificationStatus.APPROVED,
                            rejectionReason: null
                        }).returning()];
                case 9:
                    vendorProfile1 = (_a.sent())[0];
                    return [4 /*yield*/, db.insert(schema.vendorProfiles).values({
                            userId: vendor2.id,
                            companyName: '财务专家团队',
                            businessNumber: '91110000000000000Y',
                            website: 'https://www.financeexperts.com',
                            description: '专业的财务分析和报表工具提供商，致力于提高财务工作效率。',
                            verificationStatus: schema.VendorVerificationStatus.APPROVED,
                            rejectionReason: null
                        }).returning()];
                case 10:
                    vendorProfile2 = (_a.sent())[0];
                    console.log('已创建供应商资料:', vendorProfile1.companyName, vendorProfile2.companyName);
                    console.log('数据库初始化完成');
                    return [3 /*break*/, 14];
                case 11:
                    error_1 = _a.sent();
                    console.error('初始化数据库时出错:', error_1);
                    return [3 /*break*/, 14];
                case 12: return [4 /*yield*/, pool.end()];
                case 13:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 14: return [2 /*return*/];
            }
        });
    });
}
initDatabase();
