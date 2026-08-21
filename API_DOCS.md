# API 文档

## 认证模块 (`/auth`)

### 1. 用户登录
*   **接口**: `POST /auth/login`
*   **描述**: 使用用户名、业务用户 ID 或邮箱和密码进行用户认证；登录标识匹配不区分大小写。默认超管可使用 `Administrator` 或 `administrator` 登录。用户 Token 会同时携带 `tenantId`（租户标识）、`serviceId`（应用/服务标识）与 `roles`（角色列表）。角色规则固定为：`administrator` 返回 `ROLE_USER`、`ROLE_SUPER`、`ROLE_ADMIN`；属于 `administrators` 用户组的用户返回 `ROLE_USER`、`ROLE_ADMIN`；其余用户返回 `ROLE_USER`。
*   **请求体**: `LoginRequest`
    *   `username` (string, 必填): 用户名、业务用户 ID 或邮箱
    *   `password` (string, 必填): 密码
    *   `serviceId` (string, 必填): 应用/服务 ID，例如 `docpal-web`、`docpal-h5`、`docpal-app`
*   **Response**:
    *   `access_token` (string): JWT 访问令牌
    *   `accessTokenExpiry` (string): 过期时间戳 (毫秒)
    *   `refresh_token` (string): JWT 刷新令牌
    *   `need2FA` (boolean): 是否需要双因素认证
    *   `mfaToken` (string): 临时 MFA 令牌 (仅当 need2FA=true 时返回)
    *   `challenge` (string): 待签名的挑战字符串 (仅当 need2FA=true 时返回)

### 2. 刷新令牌
*   **接口**: `POST /auth/refresh`
*   **描述**: 使用有效的刷新令牌获取新的访问令牌和刷新令牌；刷新后的用户 Token 继续保留原 Token 中的 `tenantId` 与 `serviceId`。
*   **请求体**: `RefreshTokenRequest`
    *   `refreshToken` (string, 必填): 刷新令牌
*   **响应**:
    *   `access_token` (string): 新的访问令牌
    *   `accessTokenExpiry` (string): 新的过期时间戳 (毫秒)
    *   `refresh_token` (string): 新的刷新令牌

### 3. 用户注册
*   **接口**: `POST /auth/register`
*   **描述**: 注册新用户。租户由当前请求绑定的 DB schema 决定，不再通过请求体或业务表字段保存 `tenantId`。
*   **请求体**: `RegisterRequest`
    *   `username` (string, 必填): 用户名
    *   `password` (string, 必填): 密码
    *   `email` (string, 必填): 邮箱地址
*   **响应**:
    *   `data` = `true`
    *   `message` = `用户注册成功`

### 3.1 用户登出
*   **接口**: `POST /auth/logout`
*   **描述**: 注销当前会话，默认按当前 Token 的 `sessionId` 登出。
*   **请求头**:
    *   `Authorization: Bearer <access_token>`
    *   `X-Tenant-Id`
*   **响应**:
    *   `data` = `true`
    *   `message` = `logout success`

### 3.2 全部登出
*   **接口**: `POST /auth/logout-all`
*   **描述**: 注销当前用户的全部会话。
*   **请求头**:
    *   `Authorization: Bearer <access_token>`
    *   `X-Tenant-Id`
*   **响应**:
    *   `data` = `true`
    *   `message` = `logout all success`

### 3.3 获取当前登录信息
*   **接口**: `GET /auth/current`
*   **描述**: 返回当前登录用户、租户、角色、sessionId。
*   **请求头**:
    *   `Authorization: Bearer <access_token>`
    *   `X-Tenant-Id`
*   **响应**:
    *   `userId` (string): 当前业务用户 ID
    *   `bizUserId` (string): 当前业务用户 ID，当前实现与 `userId` 一致
    *   `userName` (string): 用户名
    *   `tenantId` (string): 当前租户 ID
    *   `sessionId` (string): 当前会话 ID
    *   `roles` (string array): 当前解析出的角色列表
    *   `isAdmin` (boolean): 是否管理员

### 3.4 获取当前会话列表
*   **接口**: `GET /auth/sessions`
*   **描述**: 返回当前用户的 Redis Session 列表。
*   **请求头**:
    *   `Authorization: Bearer <access_token>`
    *   `X-Tenant-Id`

### 4. 换取令牌
*   **接口**: `POST /auth/exchange`
*   **描述**: 使用公钥换取服务令牌。该接口面向服务身份，`serviceId` 表示调用方应用/服务身份，不替代 `tenantId`。
*   **请求体**: `ExchangeRequest`
    *   `publicKey` (string, 必填): 公钥
*   **响应**:
    *   `token` (string): 服务令牌

### 5. 验证令牌
*   **接口**: `GET /auth/verify`
*   **描述**: 验证 Authorization 请求头中的 JWT 令牌。
*   **请求头**:
    *   `Authorization`: Bearer <token>
*   **响应**: `TokenValidationResult` (令牌信息)

### 6. 使用密钥验证令牌
*   **接口**: `POST /auth/verify-with-key`
*   **描述**: 使用指定的公钥验证 JWT 令牌。
*   **请求体**: `VerifyWithKeyRequest`
    *   `token` (string, 必填): JWT 令牌
    *   `publicKey` (string, 必填): 公钥
*   **响应**: `TokenValidationResult` (令牌信息)

### 7. 生成服务密钥对
*   **接口**: `POST /auth/generate-key`
*   **描述**: 为应用/服务生成新的 ECC 密钥对。
*   **请求体**: `GenerateKeyPairRequest`
    *   `serviceId` (string, 必填): 应用/服务 ID，用于服务密钥派生、`kid` 生成与服务级 Token 签发
*   **响应**:
    *   `privateKey` (string)
    *   `publicKey` (string)
    *   `keyVersion` (int): 当前派生密钥版本（来自 `jwt.serviceKeyVersion`，默认 `1`）
    *   `kid` (string): 密钥标识，格式 `serviceId.v{keyVersion}`

### 8. 获取我的密钥对
*   **接口**: `POST /auth/get-my-key`
*   **描述**: 使用主密钥重新派生服务的密钥对 (高权限接口)。
*   **请求体**: `GetMyKeyRequest`
    *   `serviceId` (string, 必填): 服务 ID
*   **响应**:
    *   `privateKey` (string)
    *   `publicKey` (string)
    *   `keyVersion` (int): 当前派生密钥版本（来自 `jwt.serviceKeyVersion`，默认 `1`）
    *   `kid` (string): 密钥标识，格式 `serviceId.v{keyVersion}`

### 9. 开启 2FA (注册公钥)
*   **接口**: `POST /auth/2fa/register`
*   **描述**: 为指定用户注册 ECC 公钥并开启双因素认证。
*   **请求体**: `Register2FARequest`
    *   `userId` (string, 必填): 用户 ID (ULID)
    *   `publicKey` (string, 必填): 用户的 ECC 公钥 (PEM 格式)
*   **响应**:
    *   `data` = `true`
    *   `message` = `success`

### 10. 验证 2FA 挑战
*   **接口**: `POST /auth/2fa/verify`
*   **描述**: 验证 MFA 挑战签名，成功后返回 Access Token。
*   **请求体**: `Verify2FARequest`
    *   `mfaToken` (string, 必填): 登录时返回的 MFA Token
    *   `signature` (string, 必填): 对 challenge 的 Base64 编码签名
*   **响应**:
    *   `access_token` (string)
    *   `accessTokenExpiry` (string)
    *   `refresh_token` (string)

### 11. 获取密码策略
*   **接口**: `GET /auth/password-policy`
*   **描述**: 读取系统配置表中的 `password_setting`，返回当前密码策略。

### 12. 修改密码
*   **接口**: `POST /auth/change-password`
*   **描述**: 当前登录用户修改密码。
*   **请求头**:
    *   `Authorization: Bearer <access_token>`
    *   `X-Tenant-Id`
*   **响应**:
    *   `data` = `true`
    *   `message` = `password changed successfully`

### 13. 管理员重置密码
*   **接口**: `POST /auth/reset-password`
*   **描述**: 管理员重置指定用户密码。
*   **请求头**:
    *   `Authorization: Bearer <access_token>`
    *   `X-Tenant-Id`
*   **响应**:
    *   `data` = `true`
    *   `message` = `password reset successfully`

### 14. 发起忘记密码
*   **接口**: `POST /auth/forgot-password/request`
*   **描述**: 根据 `userId`、`userName` 或兼容字段 `loginName` 发起忘记密码流程。接口默认返回成功，不暴露账户是否存在；仅当命中用户且配置了邮箱时，系统才会生成专属重置 token 并尝试发送邮件。此链路中的 `userId` 统一表示业务编号 `ucenter_user.user_id`。当前 SMTP 发信能力为临时方案，后续会迁移到通知中心统一处理。
*   **响应**:
    *   `data` = `true`
    *   `message` = `success`

### 15. 确认忘记密码
*   **接口**: `POST /auth/forgot-password/confirm`
*   **描述**: 使用临时重置令牌设置新密码。
*   **响应**:
    *   `data` = `true`
    *   `message` = `password reset successfully`

---

## 密码模块 (`/password`)

### 1. 获取密码策略
*   **接口**: `GET /password/policy`
*   **描述**: 读取 `cfg_system_setting.password_setting` 并返回密码策略。

### 2. 获取密码状态
*   **接口**: `GET /password/status`
*   **描述**: 获取当前用户密码状态；管理员可通过 `userId` 查询指定用户。

### 3. 修改密码
*   **接口**: `POST /password/change`
*   **描述**: 当前登录用户修改密码。
*   **响应**:
    *   `data` = `true`
    *   `message` = `password changed successfully`

### 4. 管理员重置密码
*   **接口**: `POST /password/reset`
*   **描述**: 管理员重置指定用户密码。
*   **响应**:
    *   `data` = `true`
    *   `message` = `password reset successfully`

### 5. 管理员解锁用户
*   **接口**: `POST /password/unlock-user`
*   **描述**: 清空失败次数并解除用户锁定。
*   **响应**:
    *   `data` = `true`
    *   `message` = `user unlocked successfully`

### 6. 发起忘记密码
*   **接口**: `POST /password/forgot/request`
*   **描述**: 发起忘记密码流程。接口默认返回成功，不暴露账户是否存在；仅当命中用户且配置了邮箱时，系统才会生成专属重置 token 并尝试发送邮件。
*   **响应**:
    *   `data` = `true`
    *   `message` = `success`

### 7. 校验重置令牌
*   **接口**: `POST /password/forgot/validate`
*   **描述**: 校验 forgot-password 临时重置令牌是否有效。
*   **响应**:
    *   `valid` (boolean): 当前 token 是否有效
    *   `userId` (string): 业务用户 ID
    *   `bizUserId` (string): 业务用户 ID，当前实现与 `userId` 一致
    *   `userName` (string): 用户名
    *   `expiredAt` (string): 过期时间，UTC

### 8. 确认忘记密码
*   **接口**: `POST /password/forgot/confirm`
*   **描述**: 使用临时令牌提交新密码。
*   **响应**:
    *   `data` = `true`
    *   `message` = `password reset successfully`

---

## OIDC 标准模块

### 1. OIDC 发现文档
*   **接口**: `GET /.well-known/openid-configuration`
*   **描述**: 返回 OIDC Provider 元数据（issuer、authorization_endpoint、token_endpoint、userinfo_endpoint、jwks_uri 等）。
*   **响应**: 标准 OIDC Discovery JSON。

### 2. JWKS 公钥集合
*   **接口**: `GET /oauth2/jwks`
*   **描述**: 返回 ES256 验签公钥集合，供外部系统按 `kid` 选择密钥验签。
*   **响应**:
    *   `keys` (array): JWK 列表（`kty`, `crv`, `alg`, `kid`, `x`, `y`）

### 3. 授权端点（Authorization Code + PKCE）
*   **接口**: `GET /oauth2/authorize`
*   **描述**: 生成授权码并重定向到 `redirect_uri`。当前实现要求携带已登录用户 Bearer Token。
*   **请求参数**:
    *   `response_type=code` (必填)
    *   `client_id` (必填，对应 `serviceId`)
    *   `redirect_uri` (必填)
    *   `scope` (必填，必须包含 `openid`)
    *   `state` (可选)
    *   `nonce` (可选)
    *   `code_challenge` (必填)
    *   `code_challenge_method` (可选，`S256`/`plain`，默认 `S256`)
*   **响应**: `302` 重定向到 `redirect_uri?code=...&state=...`

### 4. Token 端点
*   **接口**: `POST /oauth2/token`
*   **描述**: OIDC/OAuth2 标准令牌端点，支持以下 `grant_type`：
    *   `authorization_code`
    *   `refresh_token`
    *   `client_credentials`
    *   `password`（兼容模式）
*   **客户端认证**:
    *   使用 `private_key_jwt`（`client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer`）
    *   `client_assertion` 使用客户端私钥（ECC）签名
*   **响应**:
    *   `access_token`
    *   `token_type` (`Bearer`)
    *   `expires_in`
    *   `refresh_token`（部分授权类型）
    *   `id_token`（授权码模式）
    *   `scope`

### 5. UserInfo 端点
*   **接口**: `GET /oauth2/userinfo`
*   **描述**: 使用 Bearer Access Token 返回标准用户 claims。
*   **请求头**:
    *   `Authorization: Bearer <access_token>`
*   **响应**:
    *   `sub`
    *   `preferred_username`
    *   `email`
    *   `given_name`
    *   `family_name`
    *   `tenant_id`
    *   `service_id`

---

## 用户模块 (`/users`)

### 1. 获取应用用户详情
*   **接口**: `GET /users/application`
*   **描述**: 获取详细的用户信息，包括 ACL 详情和组信息。
*   **请求头**:
    *   `X-User-Id` (string, 可选): 用户 ID (业务 ID)
*   **查询参数**:
    *   `userId` (string, 可选): 用户 ID (如果请求头缺失则使用此参数)
*   **响应**: `ApplicationUserDTO`
    *   `aclUserDetail`: ACL 服务用户详情
    *   `groups`: 组列表 (来自本地数据库)
    *   `email`, `firstName`, `lastName`, `status` 等

### 2. 获取用户分页列表
*   **接口**: `POST /users/page`
*   **描述**: 获取包含 ACL 和组信息的分页用户列表。租户范围由当前 DB schema 决定。分页统一支持通用结构 `pageNum / pageSize / orderBy / isDesc`，四个字段均为可选，未传时按默认值处理。
*   **请求体**: `UserPageRequest`
    *   `pageNum` (int, 默认: 0，从 0 开始)
    *   `pageSize` (int, 默认: 10)
    *   `userName` (string, 可选)
    *   `email` (string, 可选)
    *   `userNameOrEmail` (string, 可选): 模糊搜索
    *   `status` (string, 可选)
    *   `userLevel` (string, 可选)
    *   `orderBy` (string): 分页排序字段
    *   `isDesc` (bool): 是否倒序
*   **响应**: `UserPageResponse`
    *   `total` (int64)
    *   `list` (`ApplicationUserDTO` 数组)

### 3. 获取用户统计
*   **接口**: `GET /users/stats`
*   **描述**: 获取用户统计信息。`totalActive`、`activeEssential`、`activePremium`、`activeStandard` 为实时统计；`essential`、`premium`、`standard`、`licenseUserNum` 读取 `cfg_system_setting` 中的 `ActiveUsersConfig` 配置。
*   **响应**: `UserStatsResponse`

### 4. 根据 ID 获取用户
*   **接口**: `GET /users/:id`
*   **描述**: 根据内部 ID (ULID) 获取用户详情。
*   **参数**:
    *   `id` (路径参数, 必填): 用户 ULID
*   **响应**: `User` 模型

### 5. 创建用户
*   **接口**: `POST /users`
*   **描述**: 创建用户。Identity 相关核心表通过统一表名入口切换，当前物理表为 `ucenter_user_tmp`。内部主键 `id` 在新增时自动生成；`userId` 作为业务编号，可选，未传时系统会按当前 schema 下的编号规则自动生成；`groupIds` 支持多选，且系统会自动补入默认 `members` 用户组。
*   **请求头**:
    *   `Authorization: Bearer <access_token>`
    *   `X-Tenant-Id`
*   **请求体**: `CreateUserRequest`
    *   `userId` (string, 可选): 业务用户编号；未传时按编号规则自动生成，例如 `USR00001`
    *   `userName` (string, 必填): 用户名
    *   `firstName` (string, 可选): 名
    *   `lastName` (string, 可选): 姓
    *   `email` (string, 可选): 邮箱地址
    *   `userLevel` (string, 可选): 用户等级，支持 `premium` / `standard` / `essential`，并兼容首字母大写输入
    *   `status` (string, 可选): 用户状态，支持 `A` / `I` / `L` / `D`
    *   `groupIds` (string 数组, 可选): 用户组业务编号、内部 ID 或组名，支持多选
*   **默认组**:
    *   `members`: 所有新建用户默认加入
    *   `administrators`: 初始化脚本会预置，可按需额外选中

### 6. 根据用户标识获取用户
*   **接口**: `GET /users/biz/:bizId`
*   **描述**: 根据业务 ID (`user_id`) 获取用户详情。
*   **参数**:
    *   `bizId` (路径参数, 必填): 业务 ID `user_id`
*   **响应**: `User` 模型

### 7. 获取用户所属用户组
*   **接口**: `GET /users/{userId}/groups`
*   **描述**: 根据用户业务 ID (`user_id`) 获取该用户当前分配的本地用户组列表。
*   **参数**:
    *   `userId` (路径参数, 必填): 业务 ID `user_id`
*   **响应**:
    *   `data` = `AssignedGroupDTO[]`
    *   字段包括 `id`、`groupId`、`groupName`、`description`、`status`

### 8. 更新用户
*   **接口**: `PUT /users/update`
*   **描述**: 更新用户信息。
*   **请求体**: `UpdateUserRequest`
    *   `userId` (string, 必填): 用户业务 ID `user_id`
    *   `firstName` (string)
    *   `lastName` (string)
    *   `phone` (string)
    *   `email` (string)
    *   `userLevel` (string)
*   **响应**:
    *   `data` = `true`
    *   `message` = `User updated successful`

### 9. 批量更新状态
*   **接口**: `POST /users/batch-status`
*   **描述**: 更新多个用户的状态 ('A' 或 'D')。
*   **请求体**: `BatchStatusRequest`
    *   `userIds` (字符串数组, 必填，仅支持业务 ID `user_id`)
    *   `status` (string, 必填): 'A' 或 'D'
*   **响应**:
    *   `data` = `true`
    *   `message` = `Batch status update successful`

### 10. 批量删除用户
*   **接口**: `POST /users/batch-delete`
*   **描述**: 软删除多个用户，`userIds` 仅支持业务 ID `user_id`；同时会同步物理删除用户组关系表中的关联记录。
*   **请求体**: `BatchDeleteRequest`
    *   `userIds` (字符串数组, 必填，仅支持业务 ID `user_id`)
*   **响应**:
    *   `data` = `true`
    *   `message` = `Batch delete successful`

### 11. 批量移除用户组
*   **接口**: `POST /users/remove-groups`
*   **描述**: 批量将一批用户从一批本地用户组中移除，关系表记录会直接物理删除。
*   **请求体**: `BatchRemoveUserGroupsRequest`
    *   `userIds` (字符串数组, 必填，仅支持业务 ID `user_id`)
    *   `groupIds` (字符串数组, 必填，支持组业务编号、内部 ID 或组名)
*   **响应**:
    *   `data` = `true`
    *   `message` = `Batch remove groups successful`

### 12. 批量给用户分配组
*   **接口**: `POST /users/assign-groups`
*   **描述**: 批量将一批用户加入一批本地用户组。若关系已存在则自动跳过，不会重复插入。
*   **请求体**: `BatchAssignUserGroupsRequest`
    *   `userIds` (字符串数组, 必填，仅支持业务 ID `user_id`)
    *   `groupIds` (字符串数组, 必填，支持组业务编号、内部 ID 或组名)
*   **响应**:
    *   `data` = `true`
    *   `message` = `Batch assign groups successful`

### 13. 获取当前用户资料
*   **接口**: `GET /users/current/profile`
*   **描述**: 返回当前登录用户资料。
*   **响应**: `ApplicationUserDTO`

### 14. 更新当前用户资料
*   **接口**: `PUT /users/current/profile`
*   **描述**: 更新当前登录用户资料和 `profile_json`。
*   **响应**:
    *   `data` = `true`
    *   `message` = `profile updated successfully`

### 15. 下载用户导入模板
*   **接口**: `GET /users/import/template`
*   **描述**: 下载 Excel 用户导入模板。模板说明页会展示默认初始化密码，以及 `user_id` 为空/冲突时自动生成的新规则。

### 16. 导出用户列表
*   **接口**: `POST /users/export`
*   **描述**: 按当前筛选条件导出用户 Excel，导出字段与导入模板完全一致，可直接修订后再导入；组字段导出为 `group_ids`，多个值用英文逗号分隔。
*   **请求体**: `UserPageRequest`

### 17. 预览用户导入
*   **接口**: `POST /users/import/preview`
*   **描述**: 上传 Excel 文件并返回校验结果。响应会包含 `initialPassword`、`notes`，以及每一行的 `warnings`；当 `user_id` 为空、重复或系统中已存在时，会提示提交阶段自动生成新 `user_id`。组绑定列使用 `group_ids`，按 `group_id` 进行匹配与绑定。
*   **请求类型**: `multipart/form-data`
*   **响应**:
    *   `jobId` (string): 预览任务 ID
    *   `preview` (`ImportPreviewResult`): 预览结果，包含 `headers`、`rows`、`valid`、`notes`、`initialPassword`

### 18. 提交用户导入
*   **接口**: `POST /users/import/commit`
*   **描述**: 上传 Excel 文件并执行导入。若 `user_id` 为空或已存在，系统会自动生成新的 `user_id`，并通过 `finalUserId` 返回最终值；未显式提供密码时使用 `import.defaultInitialPassword`。组绑定使用 `group_ids`，多个值用英文逗号分隔。
*   **请求类型**: `multipart/form-data`
*   **响应**:
    *   `jobId` (string): 导入任务 ID
    *   `result` (`ImportPreviewResult`): 导入结果摘要，包含逐行处理结果

### 19. 获取导入任务详情
*   **接口**: `GET /users/import/jobs/{jobId}`
*   **描述**: 获取管理员导入任务头信息及逐行处理结果。
*   **响应**:
    *   `job` (`UserImportJob`): 任务头信息
    *   `items` (`UserImportItem` array): 逐行处理结果

### 20. 导入任务分页
*   **接口**: `POST /users/import/jobs/page`
*   **描述**: 分页查询管理员导入任务。分页统一支持通用结构 `pageNum / pageSize / orderBy / isDesc`，四个字段均为可选，未传时按默认值处理。
*   **请求体**: `ImportJobPageRequest`
    *   `pageNum` (int, 默认: 0，从 0 开始)
    *   `pageSize` (int, 默认: 10)
    *   `status` (string, 可选)
    *   `fileName` (string, 可选)
    *   `orderBy` (string): 分页排序字段
    *   `isDesc` (bool): 是否倒序

### 21. 用户容量与等级限制
*   **说明**: 创建用户、注册用户、修改用户等级、激活用户时，会读取 `cfg_system_setting.ActiveUsersConfig` 做容量校验。
*   **当前限制字段**:
    *   `total`: 用户总数上限
    *   `active`: 激活用户上限
    *   `premium`: `premium` 等级用户上限
    *   `standard`: `standard` 等级用户上限
    *   `essential`: `essential` 等级用户上限

### 22. 获取用户下拉列表
*   **接口**: `GET /users/select`
*   **描述**: 获取活跃用户列表用于 UI 下拉选择。租户范围由当前 DB schema 决定。
*   **响应**: `SelectOptionDTO` 数组 (`label`, `value`)
    *   `label = user_name`
    *   `value = user_id`

---

## 组模块 (`/groups`)

### 1. 创建组
*   **接口**: `POST /groups/create`
*   **描述**: 创建新用户组。内部主键 `id` 在新增时自动生成；`groupId` 为业务编号，可选，未传时按当前 schema 下的编号规则自动生成。
*   **请求体**: `CreateGroupRequest`
    *   `name` (string, 可选): 组名称别名，等价于 `groupName`
    *   `groupId` (string, 可选): 组业务编号；为空时自动生成，例如 `GRP00001`
    *   `groupName` (string, 可选): 组名称；为空时回退到 `name`
*   **响应**: `GroupResponse`

### 2. 获取组分页列表
*   **接口**: `POST /groups/page`
*   **描述**: 获取组的分页列表。租户范围由当前 DB schema 决定。分页统一支持通用结构 `pageNum / pageSize / orderBy / isDesc`，四个字段均为可选，未传时按默认值处理。
*   **请求体**: `GroupPageRequest`
    *   `pageNum` (int, 默认: 0，从 0 开始)
    *   `pageSize` (int)
    *   `groupId` (string, 可选)
    *   `groupName` (string, 可选)
    *   `orderBy` (string): 分页排序字段
    *   `isDesc` (bool): 是否倒序
*   **响应**: `GroupPageResponse`

### 3. 更新组
*   **接口**: `PUT /groups/update`
*   **描述**: 更新组信息。业务上优先使用 `groupId/currentGroupId` 作为组标识；若需要兼容旧调用，仍支持内部 `id`。
*   **请求体**: `UpdateGroupRequest`
    *   `currentGroupId` (string, 可选): 当前组业务编号；如需修改 `groupId`，优先传该字段定位原组
    *   `id` (string, 可选): 兼容旧调用的内部主键
    *   `name` (string, 可选): 组名称别名，等价于 `groupName`
    *   `groupId` (string, 可选): 组业务编号
    *   `groupName` (string, 可选): 组名称
*   **响应**:
    *   `data` = `true`
    *   `message` = `Group updated successfully`

### 4. 删除组
*   **接口**: `DELETE /groups/:id`
*   **描述**: 软删除组。路径参数建议传 `groupId`，同时兼容旧内部 `id`；删除组前会先物理删除该组下的用户组关系记录。
*   **参数**:
    *   `id` (路径参数, 必填): 组业务编号 `groupId`
*   **响应**:
    *   `data` = `true`
    *   `message` = `Group deleted successfully`

### 5. 分配用户到组
*   **接口**: `POST /groups/assign-users`
*   **描述**: 将用户添加到组，业务处理和绑定统一按 `groupId` 执行；请求体中的 `userIds` 仅支持用户业务 ID `user_id`。若关系已存在则跳过，不会重复插入。
*   **请求体**: `AssignUsersToGroupRequest`
    *   `groupId` (string, 必填)
    *   `userIds` (字符串数组, 必填，仅支持业务 ID `user_id`)
*   **响应**:
    *   `data` = `true`
    *   `message` = `Users assigned successfully`

### 6. 从组移除用户
*   **接口**: `POST /groups/remove-users`
*   **描述**: 从组中移除用户，业务处理和绑定统一按 `groupId` 执行；请求体中的 `userIds` 仅支持用户业务 ID `user_id`。关系表记录会直接物理删除。
*   **请求体**: `RemoveUsersFromGroupRequest`
    *   `groupId` (string, 必填)
    *   `userIds` (字符串数组, 必填，仅支持业务 ID `user_id`)
*   **响应**:
    *   `data` = `true`
    *   `message` = `Users removed successfully`

### 7. 获取组内用户
*   **接口**: `POST /groups/users`
*   **描述**: 获取组内用户的分页列表，业务处理统一按 `groupId` 执行；为兼容历史数据，仍支持内部 ID 或组名输入。分页统一支持通用结构 `pageNum / pageSize / orderBy / isDesc`，四个字段均为可选，未传时按默认值处理。
*   **请求体**: `GroupUserListRequest`
    *   `groupId` (string, 必填)
    *   `pageNum` (int, 默认: 0，从 0 开始)
    *   `pageSize` (int)
    *   `orderBy` (string): 分页排序字段
    *   `isDesc` (bool): 是否倒序
*   **响应**: `UserPageResponse`

---

## 用户设置模块 (`/user-settings`)

### 1. 获取用户设置
*   **接口**: `GET /user-settings`
*   **描述**: 读取 `cfg_system_setting` 中当前用户的设置。
*   **响应**: JSON 对象，`data` 为当前用户设置内容

### 2. 保存用户设置
*   **接口**: `PUT /user-settings`
*   **描述**: 保存当前用户设置到 `cfg_system_setting`。
*   **响应**:
    *   `data` = `true`
    *   `message` = `user setting saved`

### 3. 获取用户 Profile Schema
*   **接口**: `GET /user-settings/profile-schema`
*   **描述**: 读取当前租户的用户资料 Schema。
*   **响应**: JSON 对象，`data` 为 profile schema 内容

### 4. 保存用户 Profile Schema
*   **接口**: `PUT /user-settings/profile-schema`
*   **描述**: 管理员保存当前租户的用户资料 Schema。
*   **响应**:
    *   `data` = `true`
    *   `message` = `profile schema saved`

### 8. 获取组下拉列表
*   **接口**: `GET /groups/select`
*   **描述**: 获取活跃组列表用于 UI 下拉选择。租户范围由当前 DB schema 决定。
*   **响应**: `SelectOptionDTO` 数组
    *   `label = group_name`
    *   `value = group_id`

---

## ACL 模块 (`/acl`)

### 1. 测试 ACL 连接
*   **接口**: `GET /acl/test`
*   **描述**: 通过 Nacos 检查与外部 ACL 服务的连接性。
*   **响应**: ACL 服务健康检查的 JSON 结果。

### 2. 获取角色列表
*   **接口**: `GET /acl/role/list`
*   **描述**: 从 ACL 服务获取角色扁平列表。
*   **查询参数**:
    *   `name` (string, 可选): 角色名称过滤 (模糊匹配)
*   **响应**: `AcRoleDO` 数组

### 3. 获取角色层级
*   **接口**: `GET /acl/role/tree`
*   **描述**: 从 ACL 服务获取角色树形结构。
*   **响应**: `RoleTreeVO`
