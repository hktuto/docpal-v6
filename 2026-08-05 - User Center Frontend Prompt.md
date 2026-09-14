# User Center Frontend Prompt

关联文档：[[2026-08-05 - User Center Frontend Refactor Plan]]

以下提示词可以直接发给前端同学，作为本轮重构执行说明。

## Prompt

你现在要在 `E:\code\ui_v4` 中完成“新用户中心接入改造”，目标后端是 `E:\code\docpal-user-center`。

### 一、项目背景

新的用户中心服务通过 gateway 暴露，转发规则如下：

- path: `/apis/v1/ucenter/*`
- service: `http://132.148.160.191:8002/`
- strip: `true`

因此前端访问用户中心时，统一 baseURL 必须使用：

- `/apis/v1/ucenter`

不要再继续使用：

- `/api/ucenter`
- `/api`
- `/apis`
- 旧 `/auth/token`

### 二、本轮范围

只做以下模块：

1. `login`
2. `password`
3. `user`
4. `group`

明确不做：

1. `OIDC`
2. `2FA`
3. `Keycloak / SSO` 前端接入

### 三、必须遵守的后端规则

1. 登录接口是：
   - `POST /auth/login`
   - body 必须包含 `serviceId`

2. 刷新接口是：
   - `POST /auth/refresh`
   - body:

```json
{
  "refreshToken": "..."
}
```

3. 不要再把 `refreshToken` 放到 `Authorization` Header。

4. 当前管理员判断不要再依赖 token 自解码的 `roles`。
   - 以后以 `GET /auth/current` 返回的 `isAdmin` 为准。

5. 前端主标识统一为：
   - 用户：`userId`
   - 用户组：`groupId`

6. 前端主链路不要优先使用：
   - `GET /users/{id}`
   这个接口是内部主键兼容接口。

7. 用户详情优先改为：
   - `GET /users/biz/{bizId}`

8. 用户组相关所有表单值、下拉值、绑定值统一使用：
   - `groupId`

### 四、当前前端必须先处理的旧问题

请先清理以下旧假设：

1. `packages/authApp/pages/login.vue`
   - 现在没传 `serviceId`
   - 还在调用旧锁定检查接口

2. `packages/authApp/composables/useAuth.ts`
   - 还在解析 token `roles`
   - 还在用 `/auth/token`

3. `packages/authApp/utils/axiosResponseHelper.ts`
   - 401 自动刷新逻辑还是旧版

4. `pages/admin-user`
   - 还在大量使用旧 swagger 方法，例如：
     - `postUcenterGetAllUsers`
     - `postUcenterGroups`
     - `patchUcenterPasswordUpdatePassword`
     - `postUcenterUserBatchAddGroups`
     - `postUcenterGroupBatchAddUsers`

### 四点五、常见旧请求到新地址的快速对照

下面这些是优先级最高、也最容易在现有代码里搜到的旧请求或旧方法名：

| 旧请求 / 旧方法名 | 新地址 | 备注 |
| --- | --- | --- |
| `/api/auth/login` | `/auth/login` | body 新增 `serviceId` |
| `/api/auth/token`、`/auth/token` | `/auth/refresh` | `refreshToken` 放 Body |
| `getUcenterPasswordConfig` | `/password/policy` | `POST` 改 `GET` |
| `getUcenterPasswordUserStatus` | `/password/status` | 当前用户默认查自己 |
| `patchUcenterPasswordUpdatePassword` | `/password/change` | `PATCH` 改 `POST` |
| `postUcenterPasswordResetPassword` | `/password/reset` | 管理员接口 |
| `postUcenterPasswordForgetPassword` | `/password/forgot/request` | 参数统一为 `loginName` |
| `/api/dms/user/resetPassword` | `/password/forgot/confirm` | 忘记密码确认 |
| `getUcenterPasswordHasLockUserid` | 移除 | 新后端无此接口 |
| `getUcenterPasswordCheckLockUserUserid` | 移除 | 新后端无此接口 |
| `postUcenterGetAllUsers` | `/users/page` | 用户分页 |
| `patchUcenterUser` | `/users/update` | 更新用户 |
| 用户详情旧查法 | `/users/biz/{bizId}` | 前端主链路优先改为 `userId` |
| `postUcenterGroups` | `/groups/page` | 组分页 |
| `postUcenterMember` | `/groups/users` | 组成员分页 |
| `postUcenterGroupBatchAddUsers` | `/groups/assign-users` | `groupId + userIds` |
| `postUcenterUserBatchAddGroups` | 通过 `/users`、`/users/update` 场景化封装 | 不建议继续保留旧方法名 |
| `postUcenterMemberGroup` | 通过用户详情或组列表组合实现 | 新后端没有同名旧接口 |

### 五、建议实现方式

不要直接在页面里散落替换接口。

请先创建新的 UCenter 适配层，例如：

- `packages/authApp/services/ucenter/http.ts`
- `packages/authApp/services/ucenter/auth.ts`
- `packages/authApp/services/ucenter/password.ts`
- `pages/admin-user/services/ucenterUser.ts`
- `pages/admin-user/services/ucenterGroup.ts`

要求：

1. 所有用户中心接口统一走这层适配器。
2. 所有页面组件只调用适配层，不直接拼接用户中心路径。
3. 先保留现有 provider 结构，再替换 provider 底层实现。

### 六、分阶段执行

#### Phase 0：基础设施

先完成：

1. 新 UCenter Axios Client
2. `baseURL=/apis/v1/ucenter`
3. 新 refresh 逻辑
4. `/auth/current` 当前用户状态获取

#### Phase 1：登录与密码

完成：

1. `/auth/login`
2. `/auth/refresh`
3. `/auth/logout`
4. `/auth/current`
5. `/password/policy`
6. `/password/change`
7. `/password/reset`
8. `/password/forgot/request`
9. `/password/forgot/validate`
10. `/password/forgot/confirm`

#### Phase 2：用户

完成：

1. `/users/page`
2. `/users`
3. `/users/biz/{bizId}`
4. `/users/update`
5. `/users/batch-status`
6. `/users/batch-delete`
7. `/users/select`
8. `/users/current/profile`
9. `/users/application`

#### Phase 3：用户组

完成：

1. `/groups/page`
2. `/groups/create`
3. `/groups/update`
4. `DELETE /groups/{groupId}`
5. `/groups/users`
6. `/groups/assign-users`
7. `/groups/remove-users`
8. `/groups/select`

#### Phase 4：导入导出和设置

完成：

1. `/users/export`
2. `/users/import/template`
3. `/users/import/preview`
4. `/users/import/commit`
5. `/users/import/jobs/{jobId}`
6. `/users/import/jobs/page`
7. `/user-settings`
8. `/user-settings/profile-schema`

### 七、关键接口约束

#### 登录

请求示例：

```json
{
  "username": "administrator",
  "password": "Password1",
  "serviceId": "docpal-web"
}
```

#### 刷新令牌

请求示例：

```json
{
  "refreshToken": "<refresh_token>"
}
```

#### 忘记密码申请

请求示例：

```json
{
  "loginName": "administrator"
}
```

#### 管理员重置密码

请求示例：

```json
{
  "userId": "administrator",
  "newPassword": "Password1"
}
```

#### 用户组成员绑定

请求示例：

```json
{
  "groupId": "administrators",
  "userIds": ["administrator"]
}
```

### 八、需要特别注意的业务语义

1. 前端不要把组值保存为内部 `id`。
2. 用户组关系与业务处理都应围绕 `groupId`。
3. 当前用户链路和 token 主语义都围绕 `userId`。
4. 管理员态以 `/auth/current.isAdmin` 为准，不以 token `roles` 为准。
5. 本轮不要接 `OIDC` 和 `2FA`，也不要为它们补页面流程。

### 九、完成标准

至少保证以下功能可用：

1. 登录
2. 自动刷新 token
3. 退出登录
4. 获取当前用户
5. 修改密码
6. 忘记密码
7. 用户分页
8. 用户详情
9. 创建/编辑/删除用户
10. 用户组分页
11. 用户组详情
12. 用户组成员增删

### 十、代码风格建议

1. 先做 adapter，再改页面。
2. 尽量保留现有 UI 组件结构。
3. 接口命名使用新语义，不继续扩散旧 `postUcenter...` 风格。
4. 对外主字段统一使用：
   - `userId`
   - `groupId`

如果发现某个老页面只能拿到内部 `id`，先在 adapter 层兜底，不要把这种兼容继续扩散到新页面设计里。
