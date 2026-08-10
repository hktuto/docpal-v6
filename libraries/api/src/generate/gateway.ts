/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface ClientAcRoleDO {
    additionUsers?: string[];
    createTime?: string;
    grade?: number;
    id?: string;
    name?: string;
    parentId?: string;
    status?: number;
    type?: number;
    updateTime?: string;
}

export interface ClientConfigurationRuleVO {
    id?: string;
    /** Using interface{} for flexibility */
    members?: any[];
    name?: string;
    /** Using interface{} for flexibility */
    rules?: any[];
}

export interface ClientGroupVO {
    groupId?: string;
    groupName?: string;
}

export interface ClientRoleTreeVO {
    children?: ClientRoleTreeVO[];
    id?: string;
    label?: string;
    parentId?: string;
}

export interface ClientRoleVO {
    roleId?: string;
    roleName?: string;
}

export interface ClientUserDetailVO {
    additionRoleList?: ClientRoleVO[];
    configurationRules?: ClientConfigurationRuleVO[];
    groups?: ClientGroupVO[];
    roleId?: string;
    roleName?: string;
    userId?: string;
}

export interface DtoApplicationUserDTO {
    aclUserDetail?: ClientUserDetailVO;
    company?: string;
    department?: string;
    email?: string;
    firstName?: string;
    /** null in example */
    groups?: any;
    id?: string;
    isConnected?: boolean;
    /** "2026-03-02 11:16:41 GMT" */
    jwtExpiredAt?: string;
    /** same as ID in example */
    kcUserId?: string;
    lastName?: string;
    mustResetPassword?: boolean;
    password?: string;
    phone?: string;
    properties?: any;
    registered?: boolean;
    role?: any;
    /** JWT token? */
    sessionId?: string;
    status?: string;
    timeout?: number;
    userId?: string;
    userLevel?: string;
    userName?: string;
    /** Duplicate of UserName, lowercase? */
    username?: string;
}

export interface DtoAssignUsersToGroupRequest {
    groupId: string;
    /** @minItems 1 */
    userIds: string[];
}

export interface DtoAssignedGroupDTO {
    description?: string;
    groupId?: string;
    groupName?: string;
    id?: string;
    status?: string;
}

export interface DtoBatchAssignUserGroupsRequest {
    /** @minItems 1 */
    groupIds: string[];
    /** @minItems 1 */
    userIds: string[];
}

export interface DtoBatchDeleteRequest {
    /** @minItems 1 */
    userIds: string[];
}

export interface DtoBatchRemoveUserGroupsRequest {
    /** @minItems 1 */
    groupIds: string[];
    /** @minItems 1 */
    userIds: string[];
}

export interface DtoBatchStatusRequest {
    status: "A" | "I" | "L" | "D";
    /** @minItems 1 */
    userIds: string[];
}

export interface DtoChangePasswordRequest {
    newPassword: string;
    oldPassword: string;
}

export interface DtoCreateGroupRequest {
    description?: string;
    /** @maxLength 64 */
    groupId?: string;
    /** @maxLength 128 */
    groupName?: string;
    /** @maxLength 128 */
    name?: string;
    status?: "A" | "I";
}

export interface DtoCreateUserRequest {
    email?: string;
    firstName?: string;
    groupIds?: string[];
    lastName?: string;
    mustResetPassword?: boolean;
    password?: string;
    phone?: string;
    registered?: boolean;
    status?: "A" | "I" | "L" | "D";
    /** @maxLength 64 */
    userId?: string;
    userLevel?: string;
    /** @maxLength 64 */
    userName: string;
}

export interface DtoForgotPasswordConfirmRequest {
    newPassword: string;
    token: string;
}

export interface DtoForgotPasswordRequest {
    loginName?: string;
    userId?: string;
    userName?: string;
}

export interface DtoGroupPageRequest {
    groupId?: string;
    groupName?: string;
    /** Default: false (Ascending) */
    isDesc?: boolean;
    /**
     * Default: createdDate
     * @default "createdDate"
     */
    orderBy?: string;
    /**
     * @min 0
     * @default 0
     */
    pageNum?: number;
    /**
     * @min 1
     * @max 100
     * @default 10
     */
    pageSize?: number;
    status?: string;
}

export interface DtoGroupPageResponse {
    list?: any;
    total?: number;
}

export interface DtoGroupResponse {
    createdBy?: string;
    createdDate?: string;
    description?: string;
    groupId?: string;
    groupName?: string;
    id?: string;
    modifiedBy?: string;
    modifiedDate?: string;
    status?: string;
}

export interface DtoGroupUserListRequest {
    groupId: string;
    isDesc?: boolean;
    orderBy?: string;
    /**
     * @min 0
     * @default 0
     */
    pageNum?: number;
    /**
     * @min 1
     * @max 100
     * @default 10
     */
    pageSize?: number;
}

export interface DtoImportJobPageRequest {
    fileName?: string;
    isDesc?: boolean;
    orderBy?: string;
    /** @min 0 */
    pageNum?: number;
    /**
     * @min 1
     * @max 100
     */
    pageSize?: number;
    status?: string;
}

export interface DtoImportJobPageResponse {
    list?: any;
    total?: number;
}

export interface DtoLogoutRequest {
    sessionId?: string;
}

export interface DtoRemoveUsersFromGroupRequest {
    groupId: string;
    /** @minItems 1 */
    userIds: string[];
}

export interface DtoResetPasswordRequest {
    newPassword: string;
    userId: string;
}

export interface DtoSaveProfileSchemaRequest {
    schema: Record<string, any>;
}

export interface DtoSaveUserSettingRequest {
    settings: Record<string, any>;
}

export interface DtoSelectOptionDTO {
    label?: string;
    value?: string;
}

export interface DtoUnlockUserRequest {
    userId: string;
}

export interface DtoUpdateGroupRequest {
    /** @maxLength 64 */
    currentGroupId?: string;
    description?: string;
    /** @maxLength 64 */
    groupId?: string;
    /** @maxLength 128 */
    groupName?: string;
    /** @maxLength 64 */
    id?: string;
    /** @maxLength 128 */
    name?: string;
    status?: "A" | "I";
}

export interface DtoUpdateUserRequest {
    email?: string;
    firstName?: string;
    lastName?: string;
    mustResetPassword?: boolean;
    phone?: string;
    registered?: boolean;
    status?: "A" | "I" | "L" | "D";
    userId: string;
    userLevel?: string;
    userName?: string;
}

export interface DtoUserPageRequest {
    email?: string;
    isDesc?: boolean;
    orderBy?: string;
    /** @min 0 */
    pageNum?: number;
    /**
     * @min 1
     * @max 100
     */
    pageSize?: number;
    registered?: boolean;
    status?: string;
    userLevel?: string;
    userName?: string;
    userNameOrEmail?: string;
}

export interface DtoUserPageResponse {
    list?: any;
    total?: number;
}

export interface DtoUserProfileRequest {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    profile?: Record<string, any>;
}

export interface DtoUserStatsResponse {
    activeEssential?: number;
    activePremium?: number;
    activeStandard?: number;
    essential?: number;
    /** Default 200 for now */
    licenseUserNum?: number;
    premium?: number;
    standard?: number;
    totalActive?: number;
}

export interface DtoValidateResetTokenRequest {
    token: string;
}

export interface HandlerAuthCurrentResponse {
    bizUserId?: string;
    isAdmin?: boolean;
    roles?: string[];
    sessionId?: string;
    tenantId?: string;
    userId?: string;
    userName?: string;
}

export interface HandlerCurrentProfileResponse {
    aclUserDetail?: ClientUserDetailVO;
    company?: string;
    department?: string;
    email?: string;
    firstName?: string;
    /** null in example */
    groups?: any;
    id?: string;
    isConnected?: boolean;
    /** "2026-03-02 11:16:41 GMT" */
    jwtExpiredAt?: string;
    /** same as ID in example */
    kcUserId?: string;
    lastName?: string;
    mustResetPassword?: boolean;
    password?: string;
    phone?: string;
    properties?: any;
    registered?: boolean;
    role?: any;
    /** JWT token? */
    sessionId?: string;
    status?: string;
    timeout?: number;
    userId?: string;
    userLevel?: string;
    userName?: string;
    /** Duplicate of UserName, lowercase? */
    username?: string;
}

export interface HandlerExchangeRequest {
    publicKey: string;
}

export interface HandlerGenerateKeyPairRequest {
    serviceId: string;
}

export interface HandlerGetMyKeyRequest {
    serviceId: string;
}

export interface HandlerImportCommitPayload {
    jobId?: string;
    result?: ServiceImportPreviewResult;
}

export interface HandlerImportJobDetailPayload {
    items?: ModelUserImportItem[];
    job?: ModelUserImportJob;
}

export interface HandlerImportPreviewPayload {
    jobId?: string;
    preview?: ServiceImportPreviewResult;
}

export type HandlerJSONMapResponse = Record<string, any>;

export interface HandlerLoginRequest {
    password: string;
    rememberMe?: boolean;
    serviceId: string;
    username: string;
}

export interface HandlerRefreshTokenRequest {
    refreshToken: string;
}

export interface HandlerRegister2FARequest {
    publicKey: string;
    userId: string;
}

export interface HandlerRegisterRequest {
    email: string;
    password: string;
    username: string;
}

export interface HandlerServiceKeyPairResponse {
    keyVersion?: number;
    kid?: string;
    privateKey?: string;
    publicKey?: string;
}

export interface HandlerValidateResetTokenResponse {
    bizUserId?: string;
    expiredAt?: string;
    userId?: string;
    userName?: string;
    valid?: boolean;
}

export interface HandlerVerify2FARequest {
    mfaToken: string;
    signature: string;
}

export interface HandlerVerifyWithKeyRequest {
    publicKey: string;
    token: string;
}

export interface ModelUser {
    createdBy?: string;
    createdDate?: string;
    deleteFlag?: boolean;
    email?: string;
    extJson?: number[];
    failedLoginCount?: number;
    firstName?: string;
    /** Use uuid type in Postgres for ULID storage (128-bit) */
    id?: string;
    lastLoginAt?: string;
    lastName?: string;
    lockedUntil?: string;
    modifiedBy?: string;
    modifiedDate?: string;
    mustResetPassword?: boolean;
    passwordAlgo?: string;
    passwordChangedAt?: string;
    passwordExpiresAt?: string;
    passwordHistoryJson?: number[];
    phone?: string;
    profileJson?: number[];
    registered?: boolean;
    status?: string;
    userId?: string;
    userLevel?: string;
    userName?: string;
}

export interface ModelUserImportItem {
    createdBy?: string;
    createdDate?: string;
    deleteFlag?: boolean;
    email?: string;
    errorMessage?: string;
    groupIds?: string;
    /** Use uuid type in Postgres for ULID storage (128-bit) */
    id?: string;
    jobId?: string;
    modifiedBy?: string;
    modifiedDate?: string;
    rawJson?: number[];
    rowNumber?: number;
    status?: string;
    userId?: string;
    userName?: string;
}

export interface ModelUserImportJob {
    createdBy?: string;
    createdDate?: string;
    deleteFlag?: boolean;
    errorMessage?: string;
    failureCount?: number;
    fileName?: string;
    /** Use uuid type in Postgres for ULID storage (128-bit) */
    id?: string;
    importMode?: string;
    modifiedBy?: string;
    modifiedDate?: string;
    operatorName?: string;
    operatorUserId?: string;
    resultJson?: number[];
    status?: string;
    successCount?: number;
    totalCount?: number;
}

export interface ResponseResponse {
    code?: number;
    data?: any;
    message?: string;
    result?: boolean;
}

export interface ServiceImportPreviewResult {
    headers?: string[];
    initialPassword?: string;
    notes?: string[];
    rows?: ServiceImportPreviewRow[];
    valid?: boolean;
}

export interface ServiceImportPreviewRow {
    email?: string;
    errors?: string[];
    finalUserId?: string;
    firstName?: string;
    groups?: string[];
    lastName?: string;
    mustResetPassword?: boolean;
    phone?: string;
    registered?: boolean;
    rowNumber?: number;
    status?: string;
    userId?: string;
    userLevel?: string;
    userName?: string;
    warnings?: string[];
}

export interface ServicePasswordPolicyConfig {
    containLowerAndUppercase?: boolean;
    containNumericDigits?: boolean;
    containSpecialCharacters?: boolean;
    enableExpirationTime?: boolean;
    enableLockoutPolicy?: boolean;
    enableReusePasswordLimit?: boolean;
    expirationDay?: number;
    forceResetPassword?: boolean;
    lockoutCount?: number;
    lockoutPeriod?: number;
    minPasswordLength?: number;
    retryPeriod?: number;
    reusePasswordCount?: number;
}

export interface ServicePasswordStatusResult {
    failedLoginCount?: number;
    isExpired?: boolean;
    isLocked?: boolean;
    lockedUntil?: string;
    mustResetPassword?: boolean;
    passwordChangedAt?: string;
    passwordExpiresAt?: string;
    status?: string;
    userId?: string;
    userLevel?: string;
    userName?: string;
}

export interface ServiceSessionRecord {
    bizUserId?: string;
    clientIp?: string;
    createdAt?: string;
    expiresAt?: string;
    lastSeenAt?: string;
    refreshJti?: string;
    rememberMe?: boolean;
    serviceId?: string;
    sessionId?: string;
    tenantId?: string;
    userAgent?: string;
    userId?: string;
    userName?: string;
}

export interface ServiceTokenValidationResult {
    bizUserId?: string;
    expiresAt?: string;
    issuedAt?: string;
    roles?: string[];
    serviceId?: string;
    sessionId?: string;
    tenantId?: string;
    /** "user" or "service" */
    type?: string;
    /** Only for User Tokens */
    userId?: string;
    userName?: string;
}

import type { AxiosInstance, AxiosRequestConfig, HeadersDefaults, ResponseType } from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
    /** set parameter to `true` for call `securityWorker` for this request */
    secure?: boolean;
    /** request path */
    path: string;
    /** content type of request body */
    type?: ContentType;
    /** query params */
    query?: QueryParamsType;
    /** format of response (i.e. response.json() -> format: "json") */
    format?: ResponseType;
    /** request body */
    body?: unknown;
}

export type RequestParams = Omit<FullRequestParams, "body" | "method" | "query" | "path">;

export interface ApiConfig<SecurityDataType = unknown> extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
    securityWorker?: (
        securityData: SecurityDataType | null,
    ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
    secure?: boolean;
    format?: ResponseType;
}

export enum ContentType {
    Json = "application/json",
    FormData = "multipart/form-data",
    UrlEncoded = "application/x-www-form-urlencoded",
    Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
    public instance: AxiosInstance;
    private securityData: SecurityDataType | null = null;
    private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
    private secure?: boolean;
    private format?: ResponseType;

    constructor({ securityWorker, secure, format, ...axiosConfig }: ApiConfig<SecurityDataType> = {}) {
        this.instance = axios.create({ ...axiosConfig, baseURL: axiosConfig.baseURL || "" });
        this.secure = secure;
        this.format = format;
        this.securityWorker = securityWorker;
    }

    public setSecurityData = (data: SecurityDataType | null) => {
        this.securityData = data;
    };

    protected mergeRequestParams(params1: AxiosRequestConfig, params2?: AxiosRequestConfig): AxiosRequestConfig {
        const method = params1.method || (params2 && params2.method);

        return {
            ...this.instance.defaults,
            ...params1,
            ...(params2 || {}),
            headers: {
                ...((method && this.instance.defaults.headers[method.toLowerCase() as keyof HeadersDefaults]) || {}),
                ...(params1.headers || {}),
                ...((params2 && params2.headers) || {}),
            },
        };
    }

    protected stringifyFormItem(formItem: unknown) {
        if (typeof formItem === "object" && formItem !== null) {
            return JSON.stringify(formItem);
        } else {
            return `${formItem}`;
        }
    }

    protected createFormData(input: Record<string, unknown>): FormData {
        if (input instanceof FormData) {
            return input;
        }
        return Object.keys(input || {}).reduce((formData, key) => {
            const property = input[key];
            const propertyContent: any[] = property instanceof Array ? property : [property];

            for (const formItem of propertyContent) {
                const isFileType = formItem instanceof Blob || formItem instanceof File;
                formData.append(key, isFileType ? formItem : this.stringifyFormItem(formItem));
            }

            return formData;
        }, new FormData());
    }

    public request = async <T = any, _E = any>({
        secure,
        path,
        type,
        query,
        format,
        body,
        ...params
    }: FullRequestParams): Promise<T> => {
        const secureParams =
            ((typeof secure === "boolean" ? secure : this.secure) &&
                this.securityWorker &&
                (await this.securityWorker(this.securityData))) ||
            {};
        const requestParams = this.mergeRequestParams(params, secureParams);
        const responseFormat = format || this.format || undefined;

        if (type === ContentType.FormData && body && body !== null && typeof body === "object") {
            body = this.createFormData(body as Record<string, unknown>);
        }

        if (type === ContentType.Text && body && body !== null && typeof body !== "string") {
            body = JSON.stringify(body);
        }

        return this.instance
            .request({
                ...requestParams,
                headers: {
                    ...(requestParams.headers || {}),
                    ...(type ? { "Content-Type": type } : {}),
                },
                params: query,
                responseType: responseFormat,
                data: body,
                url: path,
            })
            .then((response) => response.data);
    };
}

/**
 * @title DocPal User Center API
 * @version 1.0
 * @license Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0.html)
 * @termsOfService http://swagger.io/terms/
 * @contact API Support <support@swagger.io> (http://www.swagger.io/support)
 *
 * User Center Service for DocPal System
 */
export class Gateway<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
    wellKnown = {
        /**
         * @description 返回 OIDC 发现文档（OpenID Connect Discovery）。
         *
         * @tags oidc
         * @name GetWellKnownOpenidConfiguration
         * @summary OpenID Provider Metadata
         * @request GET:/.well-known/openid-configuration
         */
        getWellKnownOpenidConfiguration: (params: RequestParams = {}) =>
            this.request<HandlerJSONMapResponse, any>({
                path: `/.well-known/openid-configuration`,
                method: "GET",
                format: "json",
                ...params,
            }),
    };
    acl = {
        /**
         * @description Get flat list of roles
         *
         * @tags acl
         * @name GetAclRoleList
         * @summary Get Roles List
         * @request GET:/acl/role/list
         */
        getAclRoleList: (
            query?: {
                /** Role Name (Like) */
                name?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<
                ResponseResponse & {
                    data?: ClientAcRoleDO[];
                },
                ResponseResponse
            >({
                path: `/acl/role/list`,
                method: "GET",
                query: query,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Get the role tree structure
         *
         * @tags acl
         * @name GetAclRoleTree
         * @summary Get Role Hierarchy
         * @request GET:/acl/role/tree
         */
        getAclRoleTree: (params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: ClientRoleTreeVO;
                },
                ResponseResponse
            >({
                path: `/acl/role/tree`,
                method: "GET",
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Test if we can discover and call docpal-acl service
         *
         * @tags acl
         * @name GetAclTest
         * @summary Test ACL Connection
         * @request GET:/acl/test
         */
        getAclTest: (params: RequestParams = {}) =>
            this.request<ResponseResponse, ResponseResponse>({
                path: `/acl/test`,
                method: "GET",
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
    };
    auth = {
        /**
         * @description Enable 2FA for a user by registering their public key
         *
         * @tags auth
         * @name PostAuth2FaRegister
         * @summary Register User Public Key for 2FA
         * @request POST:/auth/2fa/register
         */
        postAuth2faRegister: (request: HandlerRegister2FARequest, params: RequestParams = {}) =>
            this.request<ResponseResponse, ResponseResponse>({
                path: `/auth/2fa/register`,
                method: "POST",
                body: request,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Verify the signature of the MFA challenge and issue tokens
         *
         * @tags auth
         * @name PostAuth2FaVerify
         * @summary Verify 2FA Challenge
         * @request POST:/auth/2fa/verify
         */
        postAuth2faVerify: (request: HandlerVerify2FARequest, params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: Record<string, string>;
                },
                ResponseResponse
            >({
                path: `/auth/2fa/verify`,
                method: "POST",
                body: request,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description 当前登录用户修改自己的密码。
         *
         * @tags password
         * @name PostAuthChangePassword
         * @summary 修改密码
         * @request POST:/auth/change-password
         * @secure
         */
        postAuthChangePassword: (request: DtoChangePasswordRequest, params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: boolean;
                },
                ResponseResponse
            >({
                path: `/auth/change-password`,
                method: "POST",
                body: request,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description 返回当前登录用户、租户、角色与 session 信息。
         *
         * @tags auth
         * @name GetAuthCurrent
         * @summary 获取当前登录信息
         * @request GET:/auth/current
         * @secure
         */
        getAuthCurrent: (params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: HandlerAuthCurrentResponse;
                },
                ResponseResponse
            >({
                path: `/auth/current`,
                method: "GET",
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Exchange public key for service token
         *
         * @tags auth
         * @name PostAuthExchange
         * @summary Exchange Token
         * @request POST:/auth/exchange
         */
        postAuthExchange: (request: HandlerExchangeRequest, params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: Record<string, string>;
                },
                ResponseResponse
            >({
                path: `/auth/exchange`,
                method: "POST",
                body: request,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description 使用临时重置令牌提交新密码。
         *
         * @tags password
         * @name PostAuthForgotPasswordConfirm
         * @summary 确认忘记密码
         * @request POST:/auth/forgot-password/confirm
         */
        postAuthForgotPasswordConfirm: (request: DtoForgotPasswordConfirmRequest, params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: boolean;
                },
                ResponseResponse
            >({
                path: `/auth/forgot-password/confirm`,
                method: "POST",
                body: request,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description 根据 userId、userName 或兼容字段 loginName 触发忘记密码邮件发送；接口默认返回成功，不暴露账户是否存在。
         *
         * @tags password
         * @name PostAuthForgotPasswordRequest
         * @summary 发起忘记密码
         * @request POST:/auth/forgot-password/request
         */
        postAuthForgotPasswordRequest: (request: DtoForgotPasswordRequest, params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: boolean;
                },
                ResponseResponse
            >({
                path: `/auth/forgot-password/request`,
                method: "POST",
                body: request,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Generate new ECC key pair for a service
         *
         * @tags auth
         * @name PostAuthGenerateKey
         * @summary Generate Service Key Pair
         * @request POST:/auth/generate-key
         */
        postAuthGenerateKey: (request: HandlerGenerateKeyPairRequest, params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: HandlerServiceKeyPairResponse;
                },
                ResponseResponse
            >({
                path: `/auth/generate-key`,
                method: "POST",
                body: request,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Re-derive key pair for a service using Master Secret
         *
         * @tags auth
         * @name PostAuthGetMyKey
         * @summary Get My Key Pair
         * @request POST:/auth/get-my-key
         */
        postAuthGetMyKey: (request: HandlerGetMyKeyRequest, params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: HandlerServiceKeyPairResponse;
                },
                ResponseResponse
            >({
                path: `/auth/get-my-key`,
                method: "POST",
                body: request,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Authenticate user with username, password and serviceId
         *
         * @tags auth
         * @name PostAuthLogin
         * @summary User Login
         * @request POST:/auth/login
         */
        postAuthLogin: (request: HandlerLoginRequest, params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: Record<string, string>;
                },
                ResponseResponse
            >({
                path: `/auth/login`,
                method: "POST",
                body: request,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description 注销当前登录会话；默认使用当前 Token 的 sessionId，也可通过请求体显式指定 sessionId。
         *
         * @tags auth
         * @name PostAuthLogout
         * @summary 注销当前会话
         * @request POST:/auth/logout
         * @secure
         */
        postAuthLogout: (request: DtoLogoutRequest, params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: boolean;
                },
                ResponseResponse
            >({
                path: `/auth/logout`,
                method: "POST",
                body: request,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description 注销当前登录用户的全部会话。
         *
         * @tags auth
         * @name PostAuthLogoutAll
         * @summary 注销全部会话
         * @request POST:/auth/logout-all
         * @secure
         */
        postAuthLogoutAll: (params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: boolean;
                },
                ResponseResponse
            >({
                path: `/auth/logout-all`,
                method: "POST",
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description 返回当前系统配置的密码策略。
         *
         * @tags password
         * @name GetAuthPasswordPolicy
         * @summary 获取密码策略
         * @request GET:/auth/password-policy
         */
        getAuthPasswordPolicy: (params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: ServicePasswordPolicyConfig;
                },
                any
            >({
                path: `/auth/password-policy`,
                method: "GET",
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Get new access and refresh tokens using a valid refresh token
         *
         * @tags auth
         * @name PostAuthRefresh
         * @summary Refresh Access Token
         * @request POST:/auth/refresh
         */
        postAuthRefresh: (request: HandlerRefreshTokenRequest, params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: Record<string, string>;
                },
                ResponseResponse
            >({
                path: `/auth/refresh`,
                method: "POST",
                body: request,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Register a new user
         *
         * @tags auth
         * @name PostAuthRegister
         * @summary Register User
         * @request POST:/auth/register
         */
        postAuthRegister: (request: HandlerRegisterRequest, params: RequestParams = {}) =>
            this.request<ResponseResponse, ResponseResponse>({
                path: `/auth/register`,
                method: "POST",
                body: request,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description 管理员重置指定用户密码。
         *
         * @tags password
         * @name PostAuthResetPassword
         * @summary 管理员重置密码
         * @request POST:/auth/reset-password
         * @secure
         */
        postAuthResetPassword: (request: DtoResetPasswordRequest, params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: boolean;
                },
                ResponseResponse
            >({
                path: `/auth/reset-password`,
                method: "POST",
                body: request,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description 返回当前登录用户的会话列表。
         *
         * @tags auth
         * @name GetAuthSessions
         * @summary 获取当前会话列表
         * @request GET:/auth/sessions
         * @secure
         */
        getAuthSessions: (params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: ServiceSessionRecord[];
                },
                ResponseResponse
            >({
                path: `/auth/sessions`,
                method: "GET",
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Verify JWT token
         *
         * @tags auth
         * @name GetAuthVerify
         * @summary Verify Token
         * @request GET:/auth/verify
         */
        getAuthVerify: (params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: ServiceTokenValidationResult;
                },
                ResponseResponse
            >({
                path: `/auth/verify`,
                method: "GET",
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Verify JWT token using provided public key
         *
         * @tags auth
         * @name PostAuthVerifyWithKey
         * @summary Verify Token with Key
         * @request POST:/auth/verify-with-key
         */
        postAuthVerifyWithKey: (request: HandlerVerifyWithKeyRequest, params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: ServiceTokenValidationResult;
                },
                ResponseResponse
            >({
                path: `/auth/verify-with-key`,
                method: "POST",
                body: request,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
    };
    groups = {
        /**
         * @description Add users to a group
         *
         * @tags group
         * @name PostGroupsAssignUsers
         * @summary Assign Users to Group
         * @request POST:/groups/assign-users
         */
        postGroupsAssignUsers: (request: DtoAssignUsersToGroupRequest, params: RequestParams = {}) =>
            this.request<ResponseResponse, ResponseResponse>({
                path: `/groups/assign-users`,
                method: "POST",
                body: request,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Create a new user group
         *
         * @tags group
         * @name PostGroupsCreate
         * @summary Create Group
         * @request POST:/groups/create
         */
        postGroupsCreate: (request: DtoCreateGroupRequest, params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: DtoGroupResponse;
                },
                ResponseResponse
            >({
                path: `/groups/create`,
                method: "POST",
                body: request,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Get paginated list of groups
         *
         * @tags group
         * @name PostGroupsPage
         * @summary Get Group Page
         * @request POST:/groups/page
         */
        postGroupsPage: (request: DtoGroupPageRequest, params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: DtoGroupPageResponse;
                },
                ResponseResponse
            >({
                path: `/groups/page`,
                method: "POST",
                body: request,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Remove users from a group by physically deleting relation records
         *
         * @tags group
         * @name PostGroupsRemoveUsers
         * @summary Remove Users from Group
         * @request POST:/groups/remove-users
         */
        postGroupsRemoveUsers: (request: DtoRemoveUsersFromGroupRequest, params: RequestParams = {}) =>
            this.request<ResponseResponse, ResponseResponse>({
                path: `/groups/remove-users`,
                method: "POST",
                body: request,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Get list of groups for dropdown selection
         *
         * @tags group
         * @name GetGroupsSelect
         * @summary Get Group Dropdown List
         * @request GET:/groups/select
         */
        getGroupsSelect: (params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: DtoSelectOptionDTO[];
                },
                any
            >({
                path: `/groups/select`,
                method: "GET",
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Update group information
         *
         * @tags group
         * @name PutGroupsUpdate
         * @summary Update Group
         * @request PUT:/groups/update
         */
        putGroupsUpdate: (request: DtoUpdateGroupRequest, params: RequestParams = {}) =>
            this.request<ResponseResponse, ResponseResponse>({
                path: `/groups/update`,
                method: "PUT",
                body: request,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Get paginated list of users in a group
         *
         * @tags group
         * @name PostGroupsUsers
         * @summary Get Group Users
         * @request POST:/groups/users
         */
        postGroupsUsers: (request: DtoGroupUserListRequest, params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: DtoUserPageResponse;
                },
                ResponseResponse
            >({
                path: `/groups/users`,
                method: "POST",
                body: request,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Soft delete a group and physically delete its user-group relations
         *
         * @tags group
         * @name DeleteGroupsId
         * @summary Delete Group
         * @request DELETE:/groups/{id}
         */
        deleteGroupsId: (id: string, params: RequestParams = {}) =>
            this.request<ResponseResponse, ResponseResponse>({
                path: `/groups/${id}`,
                method: "DELETE",
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
    };
    oauth2 = {
        /**
         * @description 支持 Authorization Code + PKCE。当前实现要求携带已登录用户的 Bearer Token。
         *
         * @tags oidc
         * @name GetOauth2Authorize
         * @summary OIDC 授权端点
         * @request GET:/oauth2/authorize
         */
        getOauth2Authorize: (
            query: {
                /** 固定为 code */
                response_type: string;
                /** 客户端 ID（serviceId） */
                client_id: string;
                /** 回调地址 */
                redirect_uri: string;
                /** 至少包含 openid */
                scope: string;
                /** CSRF 防护值 */
                state?: string;
                /** ID Token nonce */
                nonce?: string;
                /** PKCE code_challenge */
                code_challenge: string;
                /** S256 或 plain */
                code_challenge_method?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<any, void | HandlerJSONMapResponse>({
                path: `/oauth2/authorize`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * @description 返回 OIDC/JWT 验签所需的公钥集合（JWKS）。
         *
         * @tags oidc
         * @name GetOauth2Jwks
         * @summary JSON Web Key Set
         * @request GET:/oauth2/jwks
         */
        getOauth2Jwks: (params: RequestParams = {}) =>
            this.request<HandlerJSONMapResponse, HandlerJSONMapResponse>({
                path: `/oauth2/jwks`,
                method: "GET",
                format: "json",
                ...params,
            }),

        /**
         * @description 支持 authorization_code、refresh_token、client_credentials、password。
         *
         * @tags oidc
         * @name PostOauth2Token
         * @summary OIDC Token 端点
         * @request POST:/oauth2/token
         */
        postOauth2Token: (params: RequestParams = {}) =>
            this.request<HandlerJSONMapResponse, HandlerJSONMapResponse>({
                path: `/oauth2/token`,
                method: "POST",
                type: ContentType.UrlEncoded,
                format: "json",
                ...params,
            }),

        /**
         * @description 使用 Bearer Access Token 返回用户标准 Claims。
         *
         * @tags oidc
         * @name GetOauth2Userinfo
         * @summary OIDC UserInfo
         * @request GET:/oauth2/userinfo
         */
        getOauth2Userinfo: (params: RequestParams = {}) =>
            this.request<HandlerJSONMapResponse, HandlerJSONMapResponse>({
                path: `/oauth2/userinfo`,
                method: "GET",
                format: "json",
                ...params,
            }),
    };
    password = {
        /**
         * @description 当前登录用户修改自己的密码。
         *
         * @tags password
         * @name PostPasswordChange
         * @summary 修改密码
         * @request POST:/password/change
         * @secure
         */
        postPasswordChange: (request: DtoChangePasswordRequest, params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: boolean;
                },
                ResponseResponse
            >({
                path: `/password/change`,
                method: "POST",
                body: request,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description 使用临时重置令牌提交新密码。
         *
         * @tags password
         * @name PostPasswordForgotConfirm
         * @summary 确认忘记密码
         * @request POST:/password/forgot/confirm
         */
        postPasswordForgotConfirm: (request: DtoForgotPasswordConfirmRequest, params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: boolean;
                },
                ResponseResponse
            >({
                path: `/password/forgot/confirm`,
                method: "POST",
                body: request,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description 根据 userId、userName 或兼容字段 loginName 触发忘记密码邮件发送；接口默认返回成功，不暴露账户是否存在。
         *
         * @tags password
         * @name PostPasswordForgotRequest
         * @summary 发起忘记密码
         * @request POST:/password/forgot/request
         */
        postPasswordForgotRequest: (request: DtoForgotPasswordRequest, params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: boolean;
                },
                ResponseResponse
            >({
                path: `/password/forgot/request`,
                method: "POST",
                body: request,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description 校验忘记密码流程中的临时重置令牌是否有效。
         *
         * @tags password
         * @name PostPasswordForgotValidate
         * @summary 校验重置令牌
         * @request POST:/password/forgot/validate
         */
        postPasswordForgotValidate: (request: DtoValidateResetTokenRequest, params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: HandlerValidateResetTokenResponse;
                },
                ResponseResponse
            >({
                path: `/password/forgot/validate`,
                method: "POST",
                body: request,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description 返回当前系统配置的密码策略。
         *
         * @tags password
         * @name GetPasswordPolicy
         * @summary 获取密码策略
         * @request GET:/password/policy
         */
        getPasswordPolicy: (params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: ServicePasswordPolicyConfig;
                },
                any
            >({
                path: `/password/policy`,
                method: "GET",
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description 管理员重置指定用户密码。
         *
         * @tags password
         * @name PostPasswordReset
         * @summary 管理员重置密码
         * @request POST:/password/reset
         * @secure
         */
        postPasswordReset: (request: DtoResetPasswordRequest, params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: boolean;
                },
                ResponseResponse
            >({
                path: `/password/reset`,
                method: "POST",
                body: request,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description 获取当前用户的密码状态；管理员可通过 userId 查询指定用户。
         *
         * @tags password
         * @name GetPasswordStatus
         * @summary 获取密码状态
         * @request GET:/password/status
         * @secure
         */
        getPasswordStatus: (
            query?: {
                /** Target User ID */
                userId?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<
                ResponseResponse & {
                    data?: ServicePasswordStatusResult;
                },
                ResponseResponse
            >({
                path: `/password/status`,
                method: "GET",
                query: query,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description 管理员清空失败次数并解除用户锁定。
         *
         * @tags password
         * @name PostPasswordUnlockUser
         * @summary 解锁用户
         * @request POST:/password/unlock-user
         * @secure
         */
        postPasswordUnlockUser: (request: DtoUnlockUserRequest, params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: boolean;
                },
                ResponseResponse
            >({
                path: `/password/unlock-user`,
                method: "POST",
                body: request,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
    };
    userSettings = {
        /**
         * @description 读取当前登录用户的个性化设置。
         *
         * @tags setting
         * @name GetUserSettings
         * @summary 获取用户设置
         * @request GET:/user-settings
         * @secure
         */
        getUserSettings: (params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: HandlerJSONMapResponse;
                },
                ResponseResponse
            >({
                path: `/user-settings`,
                method: "GET",
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description 保存当前登录用户的个性化设置。
         *
         * @tags setting
         * @name PutUserSettings
         * @summary 保存用户设置
         * @request PUT:/user-settings
         * @secure
         */
        putUserSettings: (request: DtoSaveUserSettingRequest, params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: boolean;
                },
                ResponseResponse
            >({
                path: `/user-settings`,
                method: "PUT",
                body: request,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description 读取当前租户的用户资料 Schema。
         *
         * @tags setting
         * @name GetUserSettingsProfileSchema
         * @summary 获取用户资料 Schema
         * @request GET:/user-settings/profile-schema
         * @secure
         */
        getUserSettingsProfileSchema: (params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: HandlerJSONMapResponse;
                },
                ResponseResponse
            >({
                path: `/user-settings/profile-schema`,
                method: "GET",
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description 管理员保存当前租户的用户资料 Schema。
         *
         * @tags setting
         * @name PutUserSettingsProfileSchema
         * @summary 保存用户资料 Schema
         * @request PUT:/user-settings/profile-schema
         * @secure
         */
        putUserSettingsProfileSchema: (request: DtoSaveProfileSchemaRequest, params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: boolean;
                },
                ResponseResponse
            >({
                path: `/user-settings/profile-schema`,
                method: "PUT",
                body: request,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
    };
    users = {
        /**
         * @description Create a new user with optional multi-group assignment; userId defaults to userName and members group is always assigned
         *
         * @tags user
         * @name PostUsers
         * @summary Create User
         * @request POST:/users
         */
        postUsers: (request: DtoCreateUserRequest, params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: ModelUser;
                },
                ResponseResponse
            >({
                path: `/users`,
                method: "POST",
                body: request,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Get detailed user info including ACL details
         *
         * @tags user
         * @name GetUsersApplication
         * @summary Get Application User Details
         * @request GET:/users/application
         */
        getUsersApplication: (params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: DtoApplicationUserDTO;
                },
                ResponseResponse
            >({
                path: `/users/application`,
                method: "GET",
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Assign multiple groups to multiple users
         *
         * @tags user
         * @name PostUsersAssignGroups
         * @summary Batch Assign Groups To Users
         * @request POST:/users/assign-groups
         */
        postUsersAssignGroups: (request: DtoBatchAssignUserGroupsRequest, params: RequestParams = {}) =>
            this.request<ResponseResponse, ResponseResponse>({
                path: `/users/assign-groups`,
                method: "POST",
                body: request,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Soft delete multiple users and physically delete their user-group relations
         *
         * @tags user
         * @name PostUsersBatchDelete
         * @summary Batch Delete Users
         * @request POST:/users/batch-delete
         */
        postUsersBatchDelete: (request: DtoBatchDeleteRequest, params: RequestParams = {}) =>
            this.request<ResponseResponse, ResponseResponse>({
                path: `/users/batch-delete`,
                method: "POST",
                body: request,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Update status for multiple users
         *
         * @tags user
         * @name PostUsersBatchStatus
         * @summary Batch Update Status
         * @request POST:/users/batch-status
         */
        postUsersBatchStatus: (request: DtoBatchStatusRequest, params: RequestParams = {}) =>
            this.request<ResponseResponse, ResponseResponse>({
                path: `/users/batch-status`,
                method: "POST",
                body: request,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Get user details by business user_id
         *
         * @tags user
         * @name GetUsersBizBizid
         * @summary Get User By Identifier
         * @request GET:/users/biz/{bizId}
         */
        getUsersBizBizid: (bizId: string, params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: ModelUser;
                },
                ResponseResponse
            >({
                path: `/users/biz/${bizId}`,
                method: "GET",
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description 返回当前登录用户的资料信息。
         *
         * @tags user
         * @name GetUsersCurrentProfile
         * @summary 获取当前用户资料
         * @request GET:/users/current/profile
         * @secure
         */
        getUsersCurrentProfile: (params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: HandlerCurrentProfileResponse;
                },
                ResponseResponse
            >({
                path: `/users/current/profile`,
                method: "GET",
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description 更新当前登录用户的资料信息与 profile_json。
         *
         * @tags user
         * @name PutUsersCurrentProfile
         * @summary 更新当前用户资料
         * @request PUT:/users/current/profile
         * @secure
         */
        putUsersCurrentProfile: (request: DtoUserProfileRequest, params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: boolean;
                },
                ResponseResponse
            >({
                path: `/users/current/profile`,
                method: "PUT",
                body: request,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description 按当前筛选条件导出用户 Excel，导出字段与导入模板完全一致。
         *
         * @tags import
         * @name PostUsersExport
         * @summary 导出用户列表
         * @request POST:/users/export
         * @secure
         */
        postUsersExport: (request: DtoUserPageRequest, params: RequestParams = {}) =>
            this.request<File, ResponseResponse>({
                path: `/users/export`,
                method: "POST",
                body: request,
                secure: true,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * @description 上传 Excel 文件并执行用户导入；若 user_id 为空或已存在，会自动生成新的 user_id 并在结果中返回 finalUserId。
         *
         * @tags import
         * @name PostUsersImportCommit
         * @summary 提交用户导入
         * @request POST:/users/import/commit
         * @secure
         */
        postUsersImportCommit: (data: any, params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: HandlerImportCommitPayload;
                },
                ResponseResponse
            >({
                path: `/users/import/commit`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.FormData,
                format: "json",
                ...params,
            }),

        /**
         * @description 分页查询导入任务列表。
         *
         * @tags import
         * @name PostUsersImportJobsPage
         * @summary 导入任务分页
         * @request POST:/users/import/jobs/page
         * @secure
         */
        postUsersImportJobsPage: (request: DtoImportJobPageRequest, params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: DtoImportJobPageResponse;
                },
                ResponseResponse
            >({
                path: `/users/import/jobs/page`,
                method: "POST",
                body: request,
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description 返回指定导入任务的任务头信息与逐行处理结果。
         *
         * @tags import
         * @name GetUsersImportJobsJobid
         * @summary 获取导入任务详情
         * @request GET:/users/import/jobs/{jobId}
         * @secure
         */
        getUsersImportJobsJobid: (jobId: string, params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: HandlerImportJobDetailPayload;
                },
                ResponseResponse
            >({
                path: `/users/import/jobs/${jobId}`,
                method: "GET",
                secure: true,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description 上传 Excel 文件并返回导入预览结果与 jobId；预览会提示初始化密码及 user_id 冲突自动生成规则。
         *
         * @tags import
         * @name PostUsersImportPreview
         * @summary 预览用户导入
         * @request POST:/users/import/preview
         * @secure
         */
        postUsersImportPreview: (data: any, params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: HandlerImportPreviewPayload;
                },
                ResponseResponse
            >({
                path: `/users/import/preview`,
                method: "POST",
                body: data,
                secure: true,
                type: ContentType.FormData,
                format: "json",
                ...params,
            }),

        /**
         * @description 下载 Excel 用户导入模板文件，包含初始化密码与 user_id 自动生成说明。
         *
         * @tags import
         * @name GetUsersImportTemplate
         * @summary 下载用户导入模板
         * @request GET:/users/import/template
         * @secure
         */
        getUsersImportTemplate: (params: RequestParams = {}) =>
            this.request<File, ResponseResponse>({
                path: `/users/import/template`,
                method: "GET",
                secure: true,
                ...params,
            }),

        /**
         * @description Get paginated list of users
         *
         * @tags user
         * @name PostUsersPage
         * @summary Get User Page
         * @request POST:/users/page
         */
        postUsersPage: (request: DtoUserPageRequest, params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: DtoUserPageResponse;
                },
                ResponseResponse
            >({
                path: `/users/page`,
                method: "POST",
                body: request,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Remove multiple groups from multiple users
         *
         * @tags user
         * @name PostUsersRemoveGroups
         * @summary Batch Remove Groups From Users
         * @request POST:/users/remove-groups
         */
        postUsersRemoveGroups: (request: DtoBatchRemoveUserGroupsRequest, params: RequestParams = {}) =>
            this.request<ResponseResponse, ResponseResponse>({
                path: `/users/remove-groups`,
                method: "POST",
                body: request,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Get list of users for dropdown selection
         *
         * @tags user
         * @name GetUsersSelect
         * @summary Get User Dropdown List
         * @request GET:/users/select
         */
        getUsersSelect: (params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: DtoSelectOptionDTO[];
                },
                any
            >({
                path: `/users/select`,
                method: "GET",
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Get statistics of users
         *
         * @tags user
         * @name GetUsersStats
         * @summary Get User Statistics
         * @request GET:/users/stats
         */
        getUsersStats: (params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: DtoUserStatsResponse;
                },
                ResponseResponse
            >({
                path: `/users/stats`,
                method: "GET",
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Update user information
         *
         * @tags user
         * @name PutUsersUpdate
         * @summary Update User
         * @request PUT:/users/update
         */
        putUsersUpdate: (request: DtoUpdateUserRequest, params: RequestParams = {}) =>
            this.request<ResponseResponse, ResponseResponse>({
                path: `/users/update`,
                method: "PUT",
                body: request,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description Get user details by ID
         *
         * @tags user
         * @name GetUsersId
         * @summary Get User By ID
         * @request GET:/users/{id}
         */
        getUsersId: (id: string, params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: ModelUser;
                },
                ResponseResponse
            >({
                path: `/users/${id}`,
                method: "GET",
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description 根据用户业务 ID(user_id) 获取该用户当前分配的本地用户组列表。
         *
         * @tags user
         * @name GetUsersUseridGroups
         * @summary 获取用户所属用户组
         * @request GET:/users/{userId}/groups
         */
        getUsersUseridGroups: (userId: string, params: RequestParams = {}) =>
            this.request<
                ResponseResponse & {
                    data?: DtoAssignedGroupDTO[];
                },
                ResponseResponse
            >({
                path: `/users/${userId}/groups`,
                method: "GET",
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
    };
}
