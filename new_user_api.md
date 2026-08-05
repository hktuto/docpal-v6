# 用户中心 API 请求清单（Apifox 导入版）

## 1. 使用说明

本文同时支持两种 Apifox 调试方式：

### 1.1 方式一：经过 Gateway

- Gateway 转发规则：`/apis/v1/ucenter/* -> 用户中心服务 /*`
- 建议环境变量：
  - `gatewayUrl`: `http://网关地址`
  - `baseUrl`: `{{gatewayUrl}}/apis/ucenter`
- 适合联调真实网关鉴权、透传用户上下文

### 1.2 方式二：本地直连，不经过 Gateway

- 用户中心本地地址示例：`http://132.148.160.191:8002`
- 建议环境变量：
  - `localUrl`: `http://132.148.160.191:8002`
  - `baseUrl`: `{{localUrl}}`
- 服务本身实际路由已不再带 `/api`
- 本地直连时，优先推荐先调用 `/auth/login` 获取 `Authorization: Bearer {{accessToken}}`
- 如果本地配置开启了 `gateway.trustProxyHeaders=true`，也可以直接手工设置用户透传头模拟 gateway

## 2. 公共请求头

### 2.1 通用头

| Header | 是否必填 | 说明 |
|---|---|---|
| `Content-Type` | 否 | JSON 接口使用 `application/json` |
| `X-Tenant-Id` | 建议 | 租户 schema，未传时走默认 schema |
| `Authorization` | 认证接口按需 | `Bearer {{accessToken}}` |

### 2.2 本地直连推荐 Header

本地直连时，绝大多数需要登录的接口直接使用以下 Header 即可：

| Header | 是否必填 | 说明 |
|---|---|---|
| `X-Tenant-Id` | 建议 | 例如：`demo` |
| `Authorization` | 需要登录的接口必填 | 通过 `/auth/login` 获取 |

示例：

```text
X-Tenant-Id: demo
Authorization: Bearer {{accessToken}}
```

### 2.3 本地直连模拟 Gateway 用户头

如果本地配置 `gateway.trustProxyHeaders=true`，可以不登录，直接通过以下 Header 模拟当前用户：

| Header | 是否必填 | 说明 |
|---|---|---|
| `X-Tenant-Id` | 建议 | 例如：`demo` |
| `X-User-Id` | 是 | 当前用户业务 ID；会写入当前用户上下文 |
| `X-User-Name` | 否 | 当前用户名 |
| `X-User-Roles` | 否 | 角色列表，逗号分隔，例如 `admin,ucenter_admin` |
| `X-Is-Admin` | 否 | `true` / `false` |

普通用户示例：

```text
X-Tenant-Id: demo
X-User-Id: u10001
X-User-Name: zhangsan
X-User-Roles: user
X-Is-Admin: false
```

管理员示例：

```text
X-Tenant-Id: demo
X-User-Id: admin
X-User-Name: administrator
X-User-Roles: admin,ucenter_admin
X-Is-Admin: true
```

### 2.4 经过 Gateway 的透传头

以下 Header 主要用于经过 gateway 时透传，Apifox 联调网关时也可以观察这些头是否正确下发：

| Header | 说明 |
|---|---|
| `X-User-Id` | 当前用户业务 ID |
| `X-User-Name` | 当前用户名 |
| `X-User-Roles` | 角色列表 |
| `X-Is-Admin` | 是否管理员 |

## 3. 通用响应体

```json
{
  "result": true,
  "code": 200,
  "data": {},
  "message": "success"
}
```

错误场景：

```json
{
  "result": false,
  "code": 400101,
  "data": null,
  "message": "参数错误"
}
```

---

## 4. Auth

### 4.1 登录

- Replace Api: `/api/auth/login`
- Method: `POST`
- Path: `{{baseUrl}}/auth/login`
- 说明:
  - `username` 支持传 `user_name`、`user_id` 或邮箱
  - 登录标识匹配不区分大小写
  - 默认超管可使用 `Administrator` 或 `administrator` 登录
- Body(JSON):

```json
{
  "username": "Administrator",
  "password": "2'KMzF}zK2ZmwQe",
  "serviceId": "docpal", // new keyword
  "rememberMe": true
}
```

### 4.2 刷新令牌

- Replace Api: `/api/auth/token`
- Method: `POST`
- Path: `{{baseUrl}}/auth/refresh`
- Body(JSON):

```json
{
  "refreshToken": "{{refreshToken}}" // updated key value, no header
}
```

### 4.3 登出

- Replace Api: `/api/auth/logout`
- Method: `POST`
- Path: `{{baseUrl}}/auth/logout`
- Headers: `Authorization`
- Body(JSON，可选):

```json
{
  "sessionId": "{{sessionId}}"
}
```

### 4.4 全部登出

- Replace Api: `NA`
- Method: `POST`
- Path: `{{baseUrl}}/auth/logout-all`
- Headers: `Authorization`

### 4.5 当前登录信息

- Replace Api: `NA`
- Method: `GET`
- Path: `{{baseUrl}}/auth/current`
- Headers: `Authorization`

### 4.6 当前会话列表

- Replace Api: `NA`
- Method: `GET`
- Path: `{{baseUrl}}/auth/sessions`
- Headers: `Authorization`

### 4.7 注册 // question 

- Replace Api: `NA`
- Method: `POST`
- Path: `{{baseUrl}}/auth/register`
- 说明: 租户由 `X-Tenant-Id` 对应的 schema 决定，不再通过请求体传 `tenantId`
- Body(JSON):

```json
{
  "username": "newuser",
  "password": "NewUser123",
  "email": "newuser@example.com"
}
```

### 4.8 服务公钥换令牌

- Replace Api: `NA`
- Method: `POST`
- Path: `{{baseUrl}}/auth/exchange`
- Body(JSON):

```json
{
  "publicKey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
}
```

### 4.9 生成服务密钥对

- Replace Api: `NA`
- Method: `POST`
- Path: `{{baseUrl}}/auth/generate-key`
- Body(JSON):

```json
{
  "serviceId": "gateway-service"
}
```

### 4.10 获取我的密钥对

- Replace Api: `NA`
- Method: `POST`
- Path: `{{baseUrl}}/auth/get-my-key`
- Body(JSON):

```json
{
  "serviceId": "gateway-service"
}
```

### 4.11 验证 Token

- Replace Api: `NA`
- Method: `GET`
- Path: `{{baseUrl}}/auth/verify`
- Headers: `Authorization`

### 4.12 使用公钥验证 Token

- Replace Api: `NA`
- Method: `POST`
- Path: `{{baseUrl}}/auth/verify-with-key`
- Body(JSON):

```json
{
  "token": "{{accessToken}}",
  "publicKey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
}
```

### 4.13 注册 2FA 公钥

- Replace Api: `NA`
- Method: `POST`
- Path: `{{baseUrl}}/auth/2fa/register`
- Body(JSON):

```json
{
  "userId": "01JXXXXXXX",
  "publicKey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
}
```

### 4.14 验证 2FA

- Replace Api: `NA`
- Method: `POST`
- Path: `{{baseUrl}}/auth/2fa/verify`
- Body(JSON):

```json
{
  "mfaToken": "{{mfaToken}}",
  "signature": "{{signature}}"
}
```

### 4.15 获取密码策略

- Replace Api: `NA`
- Method: `GET`
- Path: `{{baseUrl}}/auth/password-policy`

### 4.16 修改密码

- Replace Api: `POST /api/ucenter/password/update-password`
- Method: `POST`
- Path: `{{baseUrl}}/auth/change-password`
- Headers: `Authorization`
- Body(JSON):

```json
{
  "oldPassword": "OldPass123",
  "newPassword": "NewPass123"
}
```

### 4.17 管理员重置密码

- Replace Api: `POST: /api/ucenter/password/update-password`
- Method: `POST`
- Path: `{{baseUrl}}/auth/reset-password`
- Headers: `Authorization`
- Body(JSON):

```json
{
  "userId": "01JXXXXXXX",
  "newPassword": "ResetPass123"
}
```

### 4.18 发起忘记密码

- Replace Api: `/api/ucenter/password/forget-password`
- Method: `POST`
- Path: `{{baseUrl}}/auth/forgot-password/request`
- Body(JSON):

```json
{
  "loginName": "admin"
}
```

### 4.19 确认忘记密码

- Replace APi: `/api/dms/user/resetPassword`
- Method: `POST`
- Path: `{{baseUrl}}/auth/forgot-password/confirm`
- Body(JSON):

```json
{
  "token": "{{resetToken}}",
  "newPassword": "ResetPass123"
}
```

---

## 5. Password

### 5.1 获取密码策略

- Replace Api: `POST: /admin/api/ucenter/password/config`
- Method: `GET`
- Path: `{{baseUrl}}/password/policy`

### 5.2 获取密码状态

- Replace Api: `GET: /api/ucenter/password/user-status`
- Method: `GET`
- Path: `{{baseUrl}}/password/status`
- Headers: `Authorization`
- Query:

| 参数 | 是否必填 | 说明 |
|---|---|---|
| `userId` | 否 | 管理员可传，支持内部 `id` 或业务 `user_id` |

### 5.3 修改密码

- Replace Api: `PATCH: /api/ucenter/password/update-password`
- Method: `POST`
- Path: `{{baseUrl}}/password/change`
- Headers: `Authorization`
- Body(JSON):

```json
{
  "oldPassword": "OldPass123",
  "newPassword": "NewPass123"
}
```

### 5.4 重置密码

- Replace Api: `/admin/api/ucenter/password/update-password`
- Method: `POST`
- Path: `{{baseUrl}}/password/reset`
- Headers: `Authorization`
- Body(JSON):

```json
{
  "userId": "01JXXXXXXX",
  "newPassword": "ResetPass123"
}
```

### 5.5 解锁用户

- Replace Api: `NA`
- Method: `POST`
- Path: `{{baseUrl}}/password/unlock-user`
- Headers: `Authorization`
- Body(JSON):

```json
{
  "userId": "01JXXXXXXX"
}
```

### 5.6 发起忘记密码

- Replace Api: `NA`
- Method: `POST`
- Path: `{{baseUrl}}/password/forgot/request`
- Body(JSON):

```json
{
  "loginName": "admin"
}
```

### 5.7 校验重置令牌

- Replace Api: `/api/ucenter/password/forget-password?userId=${userId}`
- Method: `POST`
- Path: `{{baseUrl}}/password/forgot/validate`
- Body(JSON):

```json
{
  "token": "{{resetToken}}"
}
```

### 5.8 确认忘记密码

- Replace Api: `/api/dms/user/resetPassword`
- Method: `POST`
- Path: `{{baseUrl}}/password/forgot/confirm`
- Body(JSON):

```json
{
  "token": "{{resetToken}}",
  "newPassword": "ResetPass123"
}
```

---

## 6. Users

### 6.1 用户分页

- Replace Api: `/admin/api/ucenter/get-all-users`
- Method: `POST`
- Path: `{{baseUrl}}/users/page`
- Body(JSON):

```json
{
  "page": 1,
  "pageSize": 10,
  "userName": "",
  "email": "",
  "userNameOrEmail": "",
  "status": "A",
  "userLevel": "standard",
  "registered": true,
  "isDesc": true,
  "orderBy": "createdDate"
}
```

### 6.2 创建用户

- Replace Api: `POST /admin/api/ucenter/user`
- Method: `POST`
- Path: `{{baseUrl}}/users`
- Headers: `Authorization`
- 说明:
  - `userId` 可选，未传时系统自动生成 ULID
  - `groupIds` 支持多选，可传用户组 ID 或组名
  - 系统会自动补入默认 `members` 用户组
- Body(JSON):

```json
{
  "userName": "zhangsan",
  "firstName": "San",
  "lastName": "Zhang",
  "email": "zhangsan@example.com",
  "userLevel": "standard",
  "status": "A",
  "groupIds": [
    "administrators"
  ]
}
```

### 6.3 用户统计

- Replace Api: `NA`
- Method: `GET`
- Path: `{{baseUrl}}/users/stats`

### 6.4 批量更新状态

- Method: `POST`
- Path: `{{baseUrl}}/users/batch-status`
- Body(JSON):

```json
{
  "userIds": [
    "01JXXXXXXX",
    "u10001"
  ],
  "status": "A"
}
```

### 6.5 批量删除

- Replace Api: `POST /admin/api/ucenter/users/batch/delete`
- Method: `POST`
- Path: `{{baseUrl}}/users/batch-delete`
- Body(JSON):

```json
{
  "userIds": [
    "01JXXXXXXX",
    "u10001"
  ]
}
```

### 6.6 根据标识获取用户

- Replace Api: `GET /admin/api/ucenter/user/{userId}`
- Method: `GET`
- Path: `{{baseUrl}}/users/{id}`
- Path 参数:

| 参数 | 说明 |
|---|---|
| `id` | 支持内部 `id`，当前实现也兼容可解析标识 |

### 6.7 更新用户

- Replace Api: `PATCH /admin/api/ucenter/user`
- Method: `PUT`
- Path: `{{baseUrl}}/users/update`
- Body(JSON):

```json
{
  "userId": "01JXXXXXXX",
  "userName": "lisi",
  "firstName": "Si",
  "lastName": "Li",
  "phone": "13900000000",
  "email": "lisi@example.com",
  "userLevel": "premium",
  "status": "A",
  "registered": true,
  "mustResetPassword": false
}
```

### 6.8 根据业务 ID 或内部 ID 获取用户

- Replace Api: `NA`
- Method: `GET`
- Path: `{{baseUrl}}/users/biz/{bizId}`
- Path 参数:

| 参数 | 说明 |
|---|---|
| `bizId` | 支持业务 `user_id` 或内部 `id` |

### 6.9 用户下拉

- Replace Api: `OY Please help check which one, this is for user dropdown`
- Method: `GET`
- Path: `{{baseUrl}}/users/select`
- Query:

| 参数 | 是否必填 | 说明 |
|---|---|---|
| `keyword` | 否 | 用户名/业务ID/邮箱模糊搜索 |
| `limit` | 否 | 默认 20，最大 50 |

### 6.10 应用侧当前用户详情

- Replace Api: `GET /api/dms/user/getApplication`
- Method: `GET`
- Path: `{{baseUrl}}/users/application`
- Query:

| 参数 | 是否必填 | 说明 |
|---|---|---|
| `userId` | 否 | 当 Header 未透传用户上下文时可显式指定 |

### 6.11 当前用户资料

- Replace Api: `NA`
- Method: `GET`
- Path: `{{baseUrl}}/users/current/profile`
- Headers: `Authorization`

### 6.12 更新当前用户资料

- Replace Api: `PATCH: /api/ucenter/user`
- Method: `PUT`
- Path: `{{baseUrl}}/users/current/profile`
- Headers: `Authorization`
- Body(JSON):

```json
{
  "firstName": "San",
  "lastName": "Zhang",
  "phone": "13800000000",
  "email": "zhangsan@example.com",
  "profile": {
    "avatar": "https://example.com/avatar.png",
    "title": "Engineer"
  }
}
```

### 6.13 下载导入模板

- Replace Api: `NA`
- Method: `GET`
- Path: `{{baseUrl}}/users/import/template`
- Headers: `Authorization`

### 6.14 导入预览

- Replace Api: `NA`
- Method: `POST`
- Path: `{{baseUrl}}/users/import/preview`
- Headers: `Authorization`
- Content-Type: `multipart/form-data`
- FormData:

| 参数 | 是否必填 | 类型 | 说明 |
|---|---|---|---|
| `file` | 是 | file | Excel 文件 |

### 6.15 导入提交

- Replace Api: `NA`
- Method: `POST`
- Path: `{{baseUrl}}/users/import/commit`
- Headers: `Authorization`
- Content-Type: `multipart/form-data`
- FormData:

| 参数 | 是否必填 | 类型 | 说明 |
|---|---|---|---|
| `file` | 是 | file | Excel 文件 |

### 6.16 获取导入任务详情

- Replace Api: `NA`
- Method: `GET`
- Path: `{{baseUrl}}/users/import/jobs/{jobId}`
- Headers: `Authorization`

### 6.17 导入任务分页

- Replace Api: `NA`
- Method: `POST`
- Path: `{{baseUrl}}/users/import/jobs/page`
- Headers: `Authorization`
- Body(JSON):

```json
{
  "page": 1,
  "pageSize": 10,
  "status": "SUCCESS",
  "fileName": "user-import.xlsx"
}
```

---

## 7. Groups

### 7.1 创建用户组

- Method: `POST`
- Path: `{{baseUrl}}/groups/create`
- Body(JSON):

```json
{
  "groupName": "dev-team",
  "groupLabel": "开发组",
  "description": "研发团队",
  "status": "A"
}
```

### 7.2 用户组分页

- Method: `POST`
- Path: `{{baseUrl}}/groups/page`
- Body(JSON):

```json
{
  "page": 1,
  "pageSize": 10,
  "groupName": "dev",
  "groupLabel": "开发",
  "status": "A",
  "isDesc": true,
  "orderBy": "createdDate"
}
```

### 7.3 更新用户组

- Method: `PUT`
- Path: `{{baseUrl}}/groups/update`
- Body(JSON):

```json
{
  "id": "01JGROUPXXX",
  "groupName": "dev-team",
  "groupLabel": "开发组",
  "description": "研发团队",
  "status": "A"
}
```

### 7.4 删除用户组

- Method: `DELETE`
- Path: `{{baseUrl}}/groups/{id}`

### 7.5 批量分配用户到组

- Method: `POST`
- Path: `{{baseUrl}}/groups/assign-users`
- Body(JSON):

```json
{
  "groupId": "01JGROUPXXX",
  "userIds": [
    "01JUSERXXX",
    "u10001"
  ]
}
```

### 7.6 批量移除组成员

- Method: `POST`
- Path: `{{baseUrl}}/groups/remove-users`
- Body(JSON):

```json
{
  "groupId": "01JGROUPXXX",
  "userIds": [
    "01JUSERXXX",
    "u10001"
  ]
}
```

### 7.7 用户组成员分页

- Method: `POST`
- Path: `{{baseUrl}}/groups/users`
- Body(JSON):

```json
{
  "groupId": "01JGROUPXXX",
  "page": 1,
  "pageSize": 10
}
```

### 7.8 用户组下拉

- Method: `GET`
- Path: `{{baseUrl}}/groups/select`
- Query:

| 参数 | 是否必填 | 说明 |
|---|---|---|
| `keyword` | 否 | 组名/组标签模糊搜索 |
| `limit` | 否 | 默认 20，最大 50 |

---

## 8. User Settings

### 8.1 获取用户设置

- Method: `GET`
- Path: `{{baseUrl}}/user-settings`
- Headers: `Authorization`

### 8.2 保存用户设置

- Method: `PUT`
- Path: `{{baseUrl}}/user-settings`
- Headers: `Authorization`
- Body(JSON):

```json
{
  "settings": {
    "theme": "dark",
    "language": "zh-CN"
  }
}
```

### 8.3 获取用户资料 Schema

- Method: `GET`
- Path: `{{baseUrl}}/user-settings/profile-schema`
- Headers: `Authorization`

### 8.4 保存用户资料 Schema

- Method: `PUT`
- Path: `{{baseUrl}}/user-settings/profile-schema`
- Headers: `Authorization`
- Body(JSON):

```json
{
  "schema": {
    "fields": [
      {
        "name": "avatar",
        "label": "头像",
        "type": "string"
      }
    ]
  }
}
```

---

## 9. ACL

### 9.1 ACL 健康检查

- Method: `GET`
- Path: `{{baseUrl}}/acl/test`

### 9.2 角色列表

- Method: `GET`
- Path: `{{baseUrl}}/acl/role/list`
- Query:

| 参数 | 是否必填 | 说明 |
|---|---|---|
| `name` | 否 | 角色名模糊搜索 |

### 9.3 角色树

- Method: `GET`
- Path: `{{baseUrl}}/acl/role/tree`

---

## 10. OIDC

### 10.1 发现文档

- Method: `GET`
- Path: `{{baseUrl}}/.well-known/openid-configuration`

### 10.2 JWKS

- Method: `GET`
- Path: `{{baseUrl}}/oauth2/jwks`

### 10.3 授权码模式授权端点

- Method: `GET`
- Path: `{{baseUrl}}/oauth2/authorize`
- Headers: `Authorization`
- Query:

| 参数 | 是否必填 | 说明 |
|---|---|---|
| `response_type` | 是 | 固定 `code` |
| `client_id` | 是 | 服务 ID |
| `redirect_uri` | 是 | 回调地址 |
| `scope` | 是 | 必须包含 `openid` |
| `state` | 否 | 防重放 |
| `nonce` | 否 | ID Token nonce |
| `code_challenge` | 是 | PKCE challenge |
| `code_challenge_method` | 否 | `S256` 或 `plain` |

### 10.4 Token 端点

- Method: `POST`
- Path: `{{baseUrl}}/oauth2/token`
- Content-Type: `application/x-www-form-urlencoded`
- 支持 `grant_type`:
  - `authorization_code`
  - `refresh_token`
  - `client_credentials`
  - `password`

#### 10.4.1 authorization_code 示例

```text
grant_type=authorization_code
client_id=gateway-service
client_assertion={{clientAssertion}}
client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
code={{code}}
redirect_uri={{redirectUri}}
code_verifier={{codeVerifier}}
```

#### 10.4.2 refresh_token 示例

```text
grant_type=refresh_token
client_id=gateway-service
refresh_token={{refreshToken}}
```

#### 10.4.3 client_credentials 示例

```text
grant_type=client_credentials
client_id=gateway-service
client_assertion={{clientAssertion}}
client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
```

#### 10.4.4 password 示例

```text
grant_type=password
client_id=gateway-service
client_assertion={{clientAssertion}}
client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
username=admin
password=Admin123
```

### 10.5 UserInfo

- Method: `GET`
- Path: `{{baseUrl}}/oauth2/userinfo`
- Headers: `Authorization`

---

## 11. Apifox 建议的环境变量

```text
gatewayUrl = http://localhost:8080
localUrl = http://127.0.0.1:8002
baseUrl = {{gatewayUrl}}/apis/ucenter
tenantId = demo
accessToken = 
refreshToken = 
sessionId = 
mfaToken = 
resetToken = 
clientAssertion = 
redirectUri = http://localhost:3000/callback
codeVerifier = 
code = 
```

本地直连时，建议把 `baseUrl` 临时切换为：

```text
baseUrl = {{localUrl}}
```

## 12. Apifox 调试建议

- 需要登录态的接口，统一在 Apifox 里配置 Bearer Token
- 需要租户隔离的接口，统一加 `X-Tenant-Id: {{tenantId}}`
- 文件上传接口选择 `form-data`
- `/oauth2/token` 选择 `x-www-form-urlencoded`
- 用户相关接口里的 `userId`、`userIds`，当前很多场景同时支持内部 `id` 与业务 `user_id`
