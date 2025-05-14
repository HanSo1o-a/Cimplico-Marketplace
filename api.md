# WorkpaperMarket API Documentation

**Last Updated: 2025-04-22**

---

## Authentication & Permission Notes

- Most write operations (e.g., create, update, review) require user login and appropriate roles (e.g., vendor, admin).
- General users, vendors, and admins have different access levels. Some endpoints are only available to admins.

---

## Vendor Related

### Create Vendor

- `POST /api/vendors`
- Description: Promote the current user to vendor and create vendor profile.
- Permission: Logged-in user
- Request Body: `{ companyName, businessNumber, website?, description? }`
- Returns: Vendor profile object

### Update Vendor Profile

- `PUT /api/vendors/:id`
- Description: Update vendor information.
- Permission: Vendor owner or admin
- Request Body: Partial vendor fields
- Returns: Updated vendor object

### Get All Vendors *(Admin Only)*

- `GET /api/vendors/all`
- Description: Retrieve all vendors with user info.
- Permission: Admin
- Returns: Array of vendors

### Get Pending Vendors *(Admin Only)*

- `GET /api/admin/vendors/pending`
- `GET /api/vendors/pending`
- Description: Get all vendors pending approval.
- Permission: Admin
- Returns: Array of pending vendors

### Approve / Reject Vendor *(Admin Only)*

- `PATCH /api/admin/vendors/:id`
- Description: Update verification status or rejection reason.
- Request Body: `{ verificationStatus, rejectionReason? }`

- `POST /api/vendors/:id/approve`
- `POST /api/vendors/:id/reject`
- Description: Approve or reject vendor.
- Request Body (reject): `{ reason }`
- Returns: Updated vendor object

### Get Verified Vendors

- `GET /api/vendors`
- Description: List all approved vendors with listing count and user info.
- Returns: Array of vendors

### Get Vendor Details

- `GET /api/vendors/:id`
- Description: Get a vendor’s profile, user info, and listings.
- Returns: Vendor object

---

## Listing Related

### Get All Listings

- `GET /api/listings`
- Description: Retrieve all listings sorted by latest.
- Returns: Array of listings

### Get Pending Listings

- `GET /api/listings/pending`
- Description: Get all listings awaiting approval.
- Permission: Admin (implementation defined)
- Returns: Array of listings

### Get Featured Listings

- `GET /api/listings/featured?limit=4`
- Description: Get top featured listings.
- Returns: Array of listings

### Get Listing Details

- `GET /api/listings/:id`
- Description: Get listing details with vendor, comments, favorite status.
- Returns: Listing object

### Create Listing *(Vendor)*

- `POST /api/vendors/:vendorId/listings`
- Description: Vendor creates a new listing.
- Permission: Vendor or admin
- Request Body: Listing fields
- Returns: Created listing object

---

## Category Related

### Get All Categories

- `GET /api/categories`
- Description: Get all available categories.
- Returns: Array of categories

### Get Category Details

- `GET /api/categories/:id`
- Description: Get info of a specific category.
- Returns: Category object

---

## User Related

### Get Current User Info

- `GET /api/me`
- Description: Fetch current user profile.
- Permission: Logged-in user
- Returns: User object

### Get Current User’s Vendor Profile

- `GET /api/me/vendor`
- Description: Get vendor profile linked to current user.
- Permission: Vendor
- Returns: Vendor object

---

## Comment Related

### Get Listing Comments

- `GET /api/listings/:id/comments`
- Description: Get all comments for a specific listing.
- Returns: Array of comments

---

## Miscellaneous

### Get Saved Listings

- `GET /api/user/saved-listings`
- Description: Get current user’s saved listings.
- Permission: Logged-in user
- Returns: Array of listings

### Get Testimonials

- `GET /api/testimonials`
- Description: Get testimonials shown on the homepage.
- Returns: Array of testimonials

---

## Notes

- All responses are standard JSON format.
- Error responses include a `message` field.
- Authenticated endpoints require a valid cookie/session.



# WorkpaperMarket API 文档

**更新时间：2025-04-22**

---

## 认证与权限说明
- 绝大多数写操作（如创建、修改、审核等）需要用户登录，并具备相应角色（如供应商、管理员）。
- 普通用户、供应商、管理员权限不同，部分接口仅管理员可用。

---

## 供应商相关

### 创建供应商
- `POST /api/vendors`
- 说明：将当前用户升级为供应商，并创建供应商资料。
- 权限：登录用户
- 请求体：`{ companyName, businessNumber, website?, description? }`
- 返回：供应商资料对象

### 更新供应商资料
- `PUT /api/vendors/:id`
- 说明：更新指定供应商资料。
- 权限：供应商本人或管理员
- 请求体：部分供应商字段
- 返回：更新后的供应商资料

### 获取所有供应商（仅管理员）
- `GET /api/vendors/all`
- 说明：获取所有供应商及其用户信息。
- 权限：管理员
- 返回：供应商数组

### 获取待审核供应商列表（仅管理员）
- `GET /api/admin/vendors/pending`
- `GET /api/vendors/pending`
- 说明：获取所有待审核供应商及其用户信息。
- 权限：管理员
- 返回：供应商数组

### 审核供应商（仅管理员）
- `PATCH /api/admin/vendors/:id`
- 说明：更新供应商审核状态及原因。
- 权限：管理员
- 请求体：`{ verificationStatus, rejectionReason? }`
- 返回：更新后的供应商资料

### 批准/拒绝供应商（仅管理员）
- `POST /api/vendors/:id/approve`
- `POST /api/vendors/:id/reject`
- 说明：批准或拒绝供应商。
- 权限：管理员
- 请求体（拒绝时）：`{ reason }`
- 返回：更新后的供应商资料

### 获取认证供应商列表
- `GET /api/vendors`
- 说明：获取所有已认证供应商及其用户信息和商品数量。
- 权限：公开
- 返回：供应商数组

### 获取指定供应商资料
- `GET /api/vendors/:id`
- 说明：获取指定供应商资料、用户信息和商品列表。
- 权限：公开
- 返回：供应商对象

---

## 商品（Listing）相关

### 获取商品列表
- `GET /api/listings`
- 说明：获取所有商品，按创建时间倒序。
- 权限：公开
- 返回：商品数组

### 获取待审核商品列表
- `GET /api/listings/pending`
- 说明：获取所有待审核商品。
- 权限：公开/管理员（视实现）
- 返回：商品数组

### 获取特色商品
- `GET /api/listings/featured`
- 说明：获取特色商品（可传 `limit` 参数，默认4），附带供应商和用户信息。
- 权限：公开
- 返回：商品数组

### 获取商品详情
- `GET /api/listings/:id`
- 说明：获取商品详情、供应商、评论、是否已收藏等。
- 权限：公开
- 返回：商品对象

### 创建商品（供应商）
- `POST /api/vendors/:vendorId/listings`
- 说明：供应商创建商品。
- 权限：供应商本人或管理员
- 请求体：商品字段
- 返回：商品对象

---

## 分类相关

### 获取所有分类
- `GET /api/categories`
- 说明：获取所有商品分类。
- 权限：公开
- 返回：分类数组

### 获取分类详情
- `GET /api/categories/:id`
- 说明：获取指定分类信息。
- 权限：公开
- 返回：分类对象

---

## 用户相关

### 获取当前用户信息
- `GET /api/me`
- 说明：获取当前登录用户信息。
- 权限：登录用户
- 返回：用户对象

### 获取当前用户供应商资料
- `GET /api/me/vendor`
- 说明：获取当前用户的供应商资料。
- 权限：供应商
- 返回：供应商对象

---

## 评价（评论）相关

### 获取商品评论
- `GET /api/listings/:id/comments`
- 说明：获取指定商品的所有评论。
- 权限：公开
- 返回：评论数组

---

## 其它

### 获取用户收藏的商品
- `GET /api/user/saved-listings`
- 说明：获取当前用户收藏的所有商品。
- 权限：登录用户
- 返回：商品数组

### 获取首页用户评价（Testimonials）
- `GET /api/testimonials`
- 说明：获取首页展示的用户评价。
- 权限：公开
- 返回：评价数组

---

## 备注
- 具体字段结构请参考实际接口返回。
- 所有接口均返回标准 JSON 格式，错误时包含 message 字段。
- 需要登录的接口请携带有效 Cookie/session。
