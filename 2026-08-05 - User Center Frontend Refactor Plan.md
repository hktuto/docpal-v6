# User Center Frontend Refactor Plan

关联文档：[[2026-08-05 - User Center Frontend Prompt]]

## 1. 背景与结论

本次前端接入目标不是“补几个新接口”，而是把 `ui_v4` 现有的旧用户中心接入方式整体切到新的 `docpal-user-center`。

当前后端真实网关转发规则是：

- Gateway Path: `/apis/v1/ucenter/*`
- Service: `http://132.148.160.191:8002/`
- `strip: true`

这意味着前端访问用户中心时，统一入口应为：

- `baseURL = /apis/v1/ucenter`

而不是当前工程里散落的：

- `/api`
- `/apis`
- `/api/ucenter`
- `/auth/token`
- 旧 swagger 生成的 `postUcenter...` 风格路径

本次接入范围建议聚焦四块核心功能：

- `login`
- `password`
- `user`
- `group`

明确不纳入本轮前端接入范围：

- `OIDC`
- `2FA`
- `Keycloak / SSO` 登录链路

原因很直接：后端虽然保留了 OIDC 和 2FA 路由，但当前项目目标已经明确“不需要接入 OIDC 和 2FA”，前端不应该继续围绕这两块做流程绑定。

## 2. 后端真实接口面

以下是本轮前端最应关注的真实接口面。

### 2.1 登录与会话

| 模块 | 接口 | 方法 | 前端注意点 |
| --- | --- | --- | --- |
| Auth | `/auth/login` | `POST` | `serviceId` 必填；登录名支持 `username/user_id/email` |
| Auth | `/auth/refresh` | `POST` | `refreshToken` 在 Body，不在 Header |
| Auth | `/auth/logout` | `POST` | 需登录态 |
| Auth | `/auth/logout-all` | `POST` | 需登录态 |
| Auth | `/auth/current` | `GET` | 当前登录用户、`tenantId`、`sessionId`、`roles`、`isAdmin` |
| Auth | `/auth/sessions` | `GET` | 当前会话列表，可后置接入 |

### 2.2 密码

| 模块 | 接口 | 方法 | 前端注意点 |
| --- | --- | --- | --- |
| Password | `/password/policy` | `GET` | 可替代旧 `getUcenterPasswordConfig` |
| Password | `/password/status` | `GET` | 当前用户默认查自己；管理员可带 `userId` |
| Password | `/password/change` | `POST` | 当前登录用户改密 |
| Password | `/password/reset` | `POST` | 管理员重置指定用户密码 |
| Password | `/password/forgot/request` | `POST` | Body 字段为 `loginName`，不是旧的 `userId` |
| Password | `/password/forgot/validate` | `POST` | 校验重置令牌 |
| Password | `/password/forgot/confirm` | `POST` | 提交新密码 |
| Password | `/password/unlock-user` | `POST` | 管理解锁 |

### 2.3 用户

| 模块 | 接口 | 方法 | 前端注意点 |
| --- | --- | --- | --- |
| Users | `/users/page` | `POST` | 用户分页 |
| Users | `/users` | `POST` | 创建用户；支持直接传 `groupIds` |
| Users | `/users/stats` | `GET` | 用户统计 |
| Users | `/users/batch-status` | `POST` | 批量启停 |
| Users | `/users/batch-delete` | `POST` | 批量删除 |
| Users | `/users/{id}` | `GET` | 这是内部主键查询，不建议前端主链使用 |
| Users | `/users/biz/{bizId}` | `GET` | 前端应优先使用这个接口按 `user_id` 查询 |
| Users | `/users/update` | `PUT` | 更新用户 |
| Users | `/users/select` | `GET` | 用户下拉 |
| Users | `/users/application` | `GET` | 应用侧当前用户详情 |
| Users | `/users/current/profile` | `GET/PUT` | 当前用户资料 |
| Users | `/users/export` | `POST` | 用户导出，`user.csv` 里漏了这条 |
| Users | `/users/import/*` | `GET/POST` | 导入模板、预览、提交、任务详情、任务分页 |

### 2.4 用户组

| 模块 | 接口 | 方法 | 前端注意点 |
| --- | --- | --- | --- |
| Groups | `/groups/create` | `POST` | 创建组 |
| Groups | `/groups/page` | `POST` | 组分页 |
| Groups | `/groups/update` | `PUT` | 更新组，建议用 `currentGroupId/groupId` |
| Groups | `/groups/{id}` | `DELETE` | 建议传 `groupId`，不要继续传内部 `id` |
| Groups | `/groups/assign-users` | `POST` | 批量分配用户到组 |
| Groups | `/groups/remove-users` | `POST` | 批量移除组成员 |
| Groups | `/groups/users` | `POST` | 组成员分页 |
| Groups | `/groups/select` | `GET` | 组下拉，`value` 应使用 `groupId` |

## 3. 旧请求地址与新地址映射

下面这张表把当前前端里可能出现的旧路径、相似路径、旧生成方法名和新地址尽量整理到一起，前端迁移时可以直接对照。

### 3.1 登录与密码映射

| 功能 | 旧路径 / 相似路径 | 旧方法名 | 新地址 | 备注 |
| --- | --- | --- | --- | --- |
| 登录 | `/api/auth/login` | 直接 axios 调用 | `/auth/login` | 新 body 必须补 `serviceId` |
| 刷新令牌 | `/api/auth/token`、`/auth/token` | `useAuth.ts` / `axiosResponseHelper.ts` 旧 refresh 逻辑 | `/auth/refresh` | `refreshToken` 从 Header 改为 Body |
| 登出 | `/api/auth/logout` | 直接 axios 调用 | `/auth/logout` | 需登录态 |
| 当前用户 | 无统一旧路径 | 旧代码常直接解 token | `/auth/current` | 管理员态以 `isAdmin` 为准 |
| 获取密码策略 | `/admin/api/ucenter/password/config` | `getUcenterPasswordConfig` | `/password/policy` | 方法由 `POST` 改为 `GET` |
| 获取密码状态 | `/api/ucenter/password/user-status` | `getUcenterPasswordUserStatus` | `/password/status` | 当前用户默认查自己，管理员可带 `userId` |
| 修改密码 | `/api/ucenter/password/update-password` | `patchUcenterPasswordUpdatePassword` | `/password/change` | 方法由 `PATCH` 改为 `POST` |
| 管理员重置密码 | `/admin/api/ucenter/password/update-password`、`/api/ucenter/password/update-password` | `postUcenterPasswordResetPassword` | `/password/reset` | 管理员接口 |
| 发起忘记密码 | `/api/ucenter/password/forget-password` | `postUcenterPasswordForgetPassword` | `/password/forgot/request` | 参数由 `userId/username` 收敛为 `loginName` |
| 校验重置令牌 | 无明确旧路径 | 无 | `/password/forgot/validate` | 新增能力 |
| 提交忘记密码 | `/api/dms/user/resetPassword` | 直接 axios 或旧 client | `/password/forgot/confirm` | 新用户中心内闭环 |
| 初始密码修改 | 旧初始化密码接口 | `postUcenterPasswordInitPassword` | `/password/change` 或 `/password/reset` | 需按真实业务场景拆分 |
| 登录前锁定预检查 | 无对应新接口 | `getUcenterPasswordHasLockUserid`、`getUcenterPasswordCheckLockUserUserid` | 移除 | 新后端无这两条接口 |

### 3.2 用户与用户组映射

| 功能 | 旧路径 / 相似路径 | 旧方法名 | 新地址 | 备注 |
| --- | --- | --- | --- | --- |
| 用户分页 | 旧 `/api/ucenter/user/page` 风格接口 | `postUcenterGetAllUsers` | `/users/page` | 新接口固定 `POST` |
| 创建用户 | 旧 `/api/ucenter/user` 风格接口 | 页面内历史自定义调用 | `/users` | 可直接带 `groupIds` |
| 更新用户 | 旧 `/api/ucenter/user` 或 patch 风格接口 | `patchUcenterUser` | `/users/update` | 建议统一传业务字段 |
| 用户详情 | 旧详情接口、内部主键接口 | 页面里混用 `id` | `/users/biz/{bizId}` | 前端主链路优先用 `userId` |
| 内部主键查询用户 | `/users/{id}` 相似旧接口 | 历史兼容 | `/users/{id}` | 仅兼容使用，不建议作为主链路 |
| 用户下拉 | 旧 `/member/select` 风格接口 | 历史生成方法 | `/users/select` | 值字段应使用 `userId` |
| 用户统计 | 无明确旧路径 | 无 | `/users/stats` | 新增能力 |
| 批量启停 | 旧批量状态接口 | 页面内历史自定义调用 | `/users/batch-status` | 新接口固定 `POST` |
| 批量删除 | 旧批量删除接口 | 页面内历史自定义调用 | `/users/batch-delete` | 新接口固定 `POST` |
| 当前用户资料 | 旧 profile 接口 | 历史自定义调用 | `/users/current/profile` | `GET/PUT` |
| 应用侧当前用户详情 | 无明确旧路径 | 无 | `/users/application` | 新增能力 |
| 用户导出 | 旧导出接口不统一 | 无 | `/users/export` | `user.csv` 原先漏掉 |
| 下载导入模板 | 无明确旧路径 | 无 | `/users/import/template` | 管理员接口 |
| 导入预览 | 无明确旧路径 | 无 | `/users/import/preview` | 管理员接口 |
| 导入提交 | 无明确旧路径 | 无 | `/users/import/commit` | 管理员接口 |
| 导入任务详情 | 无明确旧路径 | 无 | `/users/import/jobs/{jobId}` | 管理员接口 |
| 导入任务分页 | 无明确旧路径 | 无 | `/users/import/jobs/page` | 管理员接口 |
| 用户组分页 | 旧 `/group/list` 风格接口 | `postUcenterGroups` | `/groups/page` | 值字段统一为 `groupId` |
| 创建组 | 旧 `/group/create` 风格接口 | 页面内历史自定义调用 | `/groups/create` | |
| 更新组 | 旧 `/group/update` 风格接口 | 页面内历史自定义调用 | `/groups/update` | 建议用 `currentGroupId/groupId` |
| 删除组 | 旧按内部 `id` 删除 | 页面内历史自定义调用 | `/groups/{groupId}` | 前端应传 `groupId` |
| 组成员分页 | 旧 `/member` 风格接口 | `postUcenterMember` | `/groups/users` | 当前是组成员分页接口 |
| 给组添加成员 | 旧批量加用户接口 | `postUcenterGroupBatchAddUsers` | `/groups/assign-users` | `groupId + userIds` |
| 从组移除成员 | 旧批量移除成员接口 | 页面内历史自定义调用 | `/groups/remove-users` | `groupId + userIds` |
| 获取用户所在组 | 旧 `/member/group` 风格接口 | `postUcenterMemberGroup` | 通过用户详情或组列表组合实现 | 新后端没有单独同名旧接口 |
| 给用户分配组 | 旧批量加组接口 | `postUcenterUserBatchAddGroups` | 通过 `/users`、`/users/update` 或专门适配层转换 | 需要前端按页面场景封装 |
| 组下拉 | 旧 `/group/select` 风格接口 | 页面内历史自定义调用 | `/groups/select` | 值字段统一为 `groupId` |

### 3.3 这次迁移最值得优先替换的旧方法

优先级最高的一批旧方法如下：

- `getUcenterPasswordHasLockUserid`
- `getUcenterPasswordCheckLockUserUserid`
- `getUcenterPasswordConfig`
- `getUcenterPasswordUserStatus`
- `patchUcenterPasswordUpdatePassword`
- `postUcenterPasswordResetPassword`
- `postUcenterPasswordForgetPassword`
- `postUcenterPasswordInitPassword`
- `postUcenterGetAllUsers`
- `patchUcenterUser`
- `postUcenterGroups`
- `postUcenterMember`
- `postUcenterMemberGroup`
- `postUcenterUserBatchAddGroups`
- `postUcenterGroupBatchAddUsers`

这些方法背后对应的旧语义，基本就是本轮最需要迁掉的用户中心旧接入层。

## 4. 当前 `ui_v4` 的真实问题

基于 `packages/authApp`、`pages/admin-user`、`libraries/api` 的实际代码，当前前端主要问题如下。

### 3.1 登录链路仍然是旧假设

当前文件：

- `packages/authApp/pages/login.vue`
- `packages/authApp/composables/useAuth.ts`
- `packages/authApp/utils/axiosResponseHelper.ts`

现状问题：

1. 登录时未传 `serviceId`，但新后端要求 `serviceId` 必填。
2. 刷新令牌仍调用旧接口 `/auth/token`。
3. 刷新令牌仍把 `refreshToken` 放到 `Authorization` Header。
4. 当前管理员判断仍依赖解析 token 的 `roles`。
5. 当前代码把 `ROLE_ADMIN/ROLE_SUPER` 当作前端管理员依据。

这与新后端真实规则不一致：

1. 刷新接口已经改为 `POST /auth/refresh`
2. `refreshToken` 需要放在 Body：`{ refreshToken }`
3. 当前用户 token 默认不再适合作为“角色唯一来源”
4. `isAdmin` 应以 `/auth/current` 返回值为准

### 3.2 登录页还调用了新后端不存在的旧密码接口

当前 `login.vue` 里仍使用：

- `getUcenterPasswordHasLockUserid`
- `getUcenterPasswordCheckLockUserUserid`

这两条不在当前新用户中心的真实接口列表中，必须移除。

建议：

- 登录失败直接显示后端错误消息
- 是否锁定统一由登录返回或 `/password/status` 处理
- 不再在登录前后做旧式“预检查锁定接口”

### 3.3 `admin-user` 仍依赖旧 swagger 生成方法名

当前管理端广泛依赖以下旧方法：

- `postUcenterGetAllUsers`
- `postUcenterGroups`
- `patchUcenterPasswordUpdatePassword`
- `postUcenterUserBatchAddGroups`
- `postUcenterGroupBatchAddUsers`
- `postUcenterMember`
- `postUcenterMemberGroup`

这些旧命名本质上暴露出两个问题：

1. 当前前端不是按“真实 REST 路由”组织，而是被旧 swagger 方法名绑死。
2. 当前 `user/group` 的业务标识已经和新后端不一致。

### 3.4 `user_id/group_id` 与内部主键 `id` 仍在混用

这在管理页里很明显：

- 用户详情打开时已经倾向用 `userId`
- 但很多接口仍沿用内部 `id`
- 用户组编辑、删除、下拉值仍混用 `id` 和 `groupId`
- 某些表单仍把组值字段绑定到 `item.id`

新后端的方向已经很明确：

- 用户业务主标识：`userId`
- 用户组业务主标识：`groupId`
- 关系绑定和业务流转都应该尽量使用业务编号

前端主链路不应继续围绕内部主键设计。

### 3.5 `user.csv` 里有缺项和超范围项

`user.csv` 的整理方向是有帮助的，但当前还需要修正：

1. 它把 `OIDC`、`2FA` 也列进来了，但本轮前端不需要接。
2. 它漏掉了真实存在且业务重要的 `/users/export`。
3. 它没有强调 gateway 前缀已经是 `/apis/v1/ucenter/*`。
4. 它没有强调 `GET /users/{id}` 不应作为前端主查询接口。

## 5. 建议的前端重构策略

建议不要在现有页面里直接全量替换接口调用，而是先做一层新的用户中心适配层，再逐页迁移。

### 4.1 先建新的 UCenter 适配层

建议新增一个单独的适配层，例如：

- `packages/authApp/services/ucenter/http.ts`
- `packages/authApp/services/ucenter/auth.ts`
- `packages/authApp/services/ucenter/password.ts`
- `pages/admin-user/services/ucenterUser.ts`
- `pages/admin-user/services/ucenterGroup.ts`

适配层职责：

1. 统一 `baseURL = /apis/v1/ucenter`
2. 统一 token 注入和 refresh
3. 统一处理后端 `Response{ code, message, data }`
4. 统一把前端业务模型映射到新接口 DTO

不要把这些差异继续散落在：

- `login.vue`
- `useAuth.ts`
- `axiosResponseHelper.ts`
- 各个 `dialog.vue`
- 各个 `provider`

### 4.2 保留页面 Provider 结构，但替换其底层实现

`pages/admin-user/util/userProvider.ts` 这套 provider 机制可以保留。

建议做法：

1. 保留 `userProvider/groupProvider` 注入模式
2. 先把 provider 内部实现改成调用新的 UCenter Adapter
3. 页面组件尽量少动 UI 结构

这样可以把风险压到最小。

## 6. 分阶段重构计划

### Phase 0：接入基础设施

目标：

- 建立新的 UCenter Axios/Adapter
- 切换 gateway baseURL
- 统一 refresh token 逻辑

必须完成：

1. 新增 `UCENTER_PROXY=/apis/v1/ucenter`
2. 新增独立 UCenter http client
3. `POST /auth/refresh` 使用 body：

```json
{
  "refreshToken": "..."
}
```

4. 停止再调用旧 `/auth/token`
5. 停止再用 token `roles` 推导管理员

验收标准：

- 登录后能稳定刷新 token
- 401 重试逻辑不再调用旧接口

### Phase 1：登录与密码

目标：

- 先把 `authApp` 跑通

必须完成：

1. `login.vue`
   - 登录 body 增加 `serviceId`
   - 移除旧锁定预检查接口
2. `useAuth.ts`
   - 登录成功后用 `/auth/current` 获取 `isAdmin`
   - 不再读取 token `roles`
3. `axiosResponseHelper.ts`
   - 刷新接口改为 `/auth/refresh`
   - `refreshToken` 改为 body 传参
4. `forgetPassword.vue`
   - `userId` 改为 `loginName`
5. `resetPassword.vue`
   - 改密接口切换到 `/password/change`
   - token 重置流程切换到 `/password/forgot/confirm`
6. `initPassword.vue`
   - 统一走新密码策略与重置接口

验收标准：

- 登录
- 自动刷新
- 退出登录
- 忘记密码
- 重置密码
- 首次改密

全部跑通。

### Phase 2：用户管理

目标：

- 跑通用户列表、详情、创建、编辑、状态、删除

必须完成：

1. 用户分页改为 `/users/page`
2. 用户详情优先改为 `/users/biz/{bizId}`
3. 创建用户时直接调用 `/users`，并传 `groupIds`
4. 管理员重置密码改为 `/password/reset`
5. 批量启停改为 `/users/batch-status`
6. 批量删除改为 `/users/batch-delete`
7. 用户下拉改为 `/users/select`

特别注意：

- 前端详情页不要再把 `/users/{id}` 当主链路
- `userId` 是主业务标识

### Phase 3：用户组管理

目标：

- 跑通组分页、详情、编辑、组成员管理

必须完成：

1. 组分页改为 `/groups/page`
2. 组详情主标识改为 `groupId`
3. 删除组改为 `DELETE /groups/{groupId}`
4. 组成员分页改为 `/groups/users`
5. 添加成员改为 `/groups/assign-users`
6. 移除成员改为 `/groups/remove-users`
7. 组下拉值统一使用 `groupId`

特别注意：

- 所有表单项不要再把组值存成 `id`
- 组编辑优先用 `currentGroupId/groupId`

### Phase 4：导入导出与用户设置

目标：

- 补上用户中心管理端完整能力

建议接入：

1. `/users/export`
2. `/users/import/template`
3. `/users/import/preview`
4. `/users/import/commit`
5. `/users/import/jobs/{jobId}`
6. `/users/import/jobs/page`
7. `/user-settings`
8. `/user-settings/profile-schema`

特别注意：

- 导入导出字段统一用 `group_ids`
- 组值使用 `groupId`
- 用户资料 schema 保存接口是管理员接口

### Phase 5：清理旧集成

最后再做：

1. 停止继续使用旧 `postUcenter...` 生成方法
2. 逐步移除 `Keycloak` / `OIDC` / `2FA` 相关前端接入代码
3. 清理旧 `/api/ucenter`、`/api`、`/apis` 兼容路径写法
4. 清理基于 token `roles` 的管理员判断

## 7. 核心功能实施建议

### 6.1 Login

建议以 `/auth/login + /auth/refresh + /auth/current` 作为完整链路。

前端状态建议只保留：

- `access_token`
- `refresh_token`
- `userId`
- `userName`
- `tenantId`
- `isAdmin`

不建议再把“管理员判断”寄托在 token 自解码结果上。

### 6.2 Password

建议统一围绕 `/password/*` 建能力，不再混用旧 `ucenterPassword...` 命名。

推荐页面映射：

- 登录后修改密码：`POST /password/change`
- 管理员重置用户密码：`POST /password/reset`
- 忘记密码申请：`POST /password/forgot/request`
- 校验 token：`POST /password/forgot/validate`
- 提交新密码：`POST /password/forgot/confirm`

### 6.3 User

前端主标识统一用：

- `userId`

仅当历史页面必须兼容时，才保留内部 `id` 作为回退字段。

### 6.4 Group

前端主标识统一用：

- `groupId`

组下拉、组编辑、组详情、组成员绑定都应该围绕 `groupId`。

## 8. `user.csv` 的修订建议

建议前端同学拿 `user.csv` 继续拆任务时，做如下修订：

1. 所有新路径前统一加说明：
   - gateway 前缀为 `/apis/v1/ucenter`
2. 从本轮范围中移除：
   - `OIDC`
   - `2FA`
3. 新增一行：
   - `POST /users/export`
4. 对 `GET /users/{id}` 增加备注：
   - 仅内部主键兼容接口，前端主链路优先改用 `/users/biz/{bizId}`
5. 对所有 `group` 相关接口补充备注：
   - 前端值字段统一使用 `groupId`
6. 对所有 `user` 详情、绑定、当前用户相关逻辑补充备注：
   - 前端主标识统一使用 `userId`

## 9. 风险与注意事项

### 8.1 旧生成代码不要直接当最终接入层

当前 `libraries/api/src/generate/admin.ts`、`newClient.ts` 仍大量保留旧接口定义。

建议：

- 先写新的 UCenter 适配层
- 再决定是否生成新的用户中心 client

### 8.2 当前后端虽保留 OIDC/2FA 路由，但前端本轮不要接

否则会把 auth 链路复杂度拉高，还会继续拖着旧 Keycloak 假设不放。

### 8.3 后端部分管理路由当前注册上没有完全显式挂鉴权中间件

前端不要把这理解成“公开接口”。

管理页仍然只应在登录态、管理态下访问。

### 8.4 当前用户页和组页都存在旧值语义

必须在重构时统一：

- 用户主值：`userId`
- 组主值：`groupId`

否则后续会继续出现“页面拿的是业务 ID，接口发的是内部 ID”的混乱。

## 10. 推荐交付顺序

建议前端按以下顺序排期：

1. `authApp` 登录、刷新、当前用户、退出
2. `authApp` 忘记密码、重置密码、首次改密
3. `admin-user` 用户列表、详情、创建、编辑、重置密码
4. `admin-user` 组列表、详情、成员管理
5. 导入导出、任务页、用户设置
6. 删除旧接入、删掉 OIDC/2FA/Keycloak 残余依赖

如果只允许先做一版最小可上线方案，建议优先完成：

1. Login
2. Refresh
3. Current User
4. Password
5. User List
6. User Detail
7. Group List
8. Group Member Management
