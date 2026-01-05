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

export interface Result {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: object;
}

export interface ResultObject {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: object;
}

/** Document Type */
export interface DocumentTypeDTO {
    /** Document Type Name */
    name?: string;
    /** Is Folder Type */
    isFolder?: boolean;
    /** Document Type keywords */
    keywords?: KeywordDTO[];
}

/** Keyword */
export interface KeywordDTO {
    /** Keyword Name */
    name?: string;
    /** Keyword Type */
    type?: string;
    /** Keyword Value */
    value?: object;
}

export interface ResultListDocumentTypeDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: DocumentTypeDTO[];
}

export interface UserDashboard {
    /** @format int64 */
    id?: number;
    name?: string;
    access?: string;
    styleJson?: string;
    status?: string;
    createdBy?: string;
    modifiedBy?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
}

export interface ResultUserDashboard {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: UserDashboard;
}

export interface Plugin {
    /** @format int64 */
    id?: number;
    name?: string;
    status?: string;
    createdBy?: string;
    modifiedBy?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
}

export interface ResultPlugin {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: Plugin;
}

export interface VerificationPermissionReq {
    key?: string;
    userId?: string;
    businessId?: string;
    businessType?: string;
    operation?: string;
}

/** Entity for storing user search history records */
export interface SearchHistory {
    /** @format int64 */
    id?: number;
    /** Search query string */
    queryString: string;
    /**
     * Total number of search results
     * @format int64
     */
    totalSize: number;
    /** User identifier */
    userId: string;
    /** Tenant identifier */
    tenantId: string;
    /**
     * Record creation timestamp
     * @format date-time
     */
    createdDate: string;
    /**
     * Record last modification timestamp
     * @format date-time
     */
    modifiedDate: string;
}

/** Define information of user related permission that access control permission */
export interface AclUserPermission {
    id?: string;
    /** the id of acl user or user group */
    belongTo: string;
    /** the type of business, may be from business sub project */
    belongType: "U" | "G" | "R";
    /** the id of business, may be from business sub project */
    businessId: string;
    /** the type of business, may be from business sub project */
    businessType: "F" | "D" | "MT";
    /** the name of access control permission */
    aces: string;
    /** the scope of permission */
    scope: "local" | "inherited";
    /**
     * begin date
     * @format date-time
     */
    begin?: string;
    /**
     * end date
     * @format date-time
     */
    end?: string;
    /** Delete flag */
    deleteFlag: "YES" | "NO";
}

export interface ResultAclUserPermission {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** Define information of user related permission that access control permission */
    data?: AclUserPermission;
}

/** Define access control permission */
export interface AccessControlPermission {
    id?: string;
    /**
     * 名称
     * @example "Everything"
     */
    name: string;
    /** 类型 */
    type?: "System" | "Document";
    /** The id of access control entry */
    permissionEntryId: string;
    /** Permission status */
    state: "VALID" | "INVALID";
    /**
     * Delete flag
     * @example "NO"
     */
    deleteFlag: "YES" | "NO";
    /** created user id */
    createdBy: string;
    /** modified user id */
    modifiedBy: string;
    /**
     * Created date
     * @format date-time
     */
    createdDate: string;
    /**
     * modified date
     * @format date-time
     */
    modifiedDate: string;
}

export interface ResultAccessControlPermission {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** Define access control permission */
    data?: AccessControlPermission;
}

export interface ResultListAccessControlPermission {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: AccessControlPermission[];
}

export interface ResultListString {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: string[];
}

/** Define access control entry */
export interface AccessControlEntry {
    id?: string;
    /**
     * 名称
     * @example "Write"
     */
    name: string;
    /**
     * 标签
     * @example "Write"
     */
    label?: string;
    /** 类型 */
    type?: "System" | "Document";
    /** 是否删除的标记 */
    deleteFlag?: "YES" | "NO";
    /**
     * 创建者
     * @example "Administrator"
     */
    createdBy?: string;
    /**
     * 更新者
     * @example "Administrator"
     */
    modifiedBy?: string;
    /**
     * Created Date
     * @format date-time
     */
    createdDate?: string;
    /**
     * Modified Date
     * @format date-time
     */
    modifiedDate?: string;
}

export interface AclPermissionDTO {
    id?: string;
    /**
     * 名称
     * @example "Everything"
     */
    name: string;
    /** 类型 */
    type?: "System" | "Document";
    /** The id of access control entry */
    permissionEntryId: string;
    /** Permission status */
    state: "VALID" | "INVALID";
    /**
     * Delete flag
     * @example "NO"
     */
    deleteFlag: "YES" | "NO";
    /** created user id */
    createdBy: string;
    /** modified user id */
    modifiedBy: string;
    /**
     * Created date
     * @format date-time
     */
    createdDate: string;
    /**
     * modified date
     * @format date-time
     */
    modifiedDate: string;
    permissionEntrys?: AccessControlEntry[];
}

export interface ResultAclPermissionDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: AclPermissionDTO;
}

/** Define information of user that access control */
export interface AclUserInformation {
    id?: string;
    /** user id */
    userId: string;
    /** user name */
    username: string;
    /** user first name */
    firstName: string;
    /** user last name */
    lastName: string;
    /** email */
    email?: string;
    /** Password */
    password: string;
    /** Tenant ID */
    tenantId?: string;
    /** MobilePhone */
    phone?: string;
    /** source */
    source?: string;
    /** status */
    status?: string;
    /** user level */
    userLevel?: string;
    /** registered status */
    registered?: string;
    properties?: Record<string, object>;
    /**
     * Delete flag
     * @example "NO"
     */
    deleteFlag: "YES" | "NO";
    /** created user id */
    createdBy: string;
    /** modified user id */
    modifiedBy: string;
    /**
     * Created date
     * @format date-time
     */
    createdDate: string;
    /**
     * modified date
     * @format date-time
     */
    modifiedDate: string;
}

export interface ResultAclUserInformation {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** Define information of user that access control */
    data?: AclUserInformation;
}

/** Define relationship between acl user group with acl user */
export interface AclUserRelationshipWithUserGroup {
    id?: string;
    /** the id of acl user */
    userId: string;
    /** the id of acl user group */
    groupId: string;
    /**
     * Delete flag
     * @example "NO"
     */
    deleteFlag: "YES" | "NO";
}

export interface ResultBoolean {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: boolean;
}

/** Define information of user group that access control */
export interface AclUserGroup {
    id?: string;
    /**
     * user group name
     * @example "ITSales"
     */
    groupName: string;
    /**
     * user group label
     * @example "IT sale dept"
     */
    groupLabel?: string;
    /** tenant id */
    tenantId?: string;
    /**
     * Delete flag
     * @example "NO"
     */
    deleteFlag: "YES" | "NO";
    /** created user id */
    createdBy: string;
    /** modified user id */
    modifiedBy: string;
    /**
     * Created date
     * @format date-time
     */
    createdDate: string;
    /**
     * modified date
     * @format date-time
     */
    modifiedDate: string;
}

export interface ResultAclUserGroup {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** Define information of user group that access control */
    data?: AclUserGroup;
}

export interface AclUserGroupDTO {
    id?: string;
    /**
     * user group name
     * @example "ITSales"
     */
    groupName: string;
    /**
     * user group label
     * @example "IT sale dept"
     */
    groupLabel?: string;
    /** tenant id */
    tenantId?: string;
    /**
     * Delete flag
     * @example "NO"
     */
    deleteFlag: "YES" | "NO";
    /** created user id */
    createdBy: string;
    /** modified user id */
    modifiedBy: string;
    /**
     * Created date
     * @format date-time
     */
    createdDate: string;
    /**
     * modified date
     * @format date-time
     */
    modifiedDate: string;
    users?: AclUserInformation[];
}

export interface ResultListAclUserGroup {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: AclUserGroup[];
}

export interface ResultAccessControlEntry {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** Define access control entry */
    data?: AccessControlEntry;
}

/** Workflow (Request) */
export interface WorkflowRequestDTO {
    /** Process Key */
    processKey?: string;
    /** Message Name */
    messageName?: string;
    /** Process Business Key */
    businessKey?: string;
    /** Fuzzy query process Business Key */
    businessKeyLike?: string;
    /** Process Definition Id */
    processDefinitionId?: string;
    /** Process Instance Id */
    processInstanceId?: string;
    /** creator */
    creator?: string;
    /** User ID */
    userId?: string;
    /** Task ID */
    taskId?: string;
    /** Task Delete Reason */
    deleteReason?: string;
    /**
     * Task Due Date
     * @format date-time
     */
    dueDate?: string;
    /** process Category */
    processCategory?: string;
    /** Groups */
    groups?: string[];
    /** Form Properties */
    properties?: Record<string, string>;
    /** Variables */
    variables?: Record<string, object>;
    /** Form Attachments */
    attachments?: Record<string, string>;
    /**
     * Page num
     * @format int32
     */
    pageNum?: number;
    /**
     * Page Size
     * @format int32
     */
    pageSize?: number;
    /** processKeys */
    processKeys?: string[];
    /** Task Due Date */
    dueDates?: string[];
    /** createdDate */
    createdDate?: string[];
    involvedUser?: string;
    assignedUser?: string;
    candidateUser?: string;
    candidateOrAssigned?: string;
    interrelatedUserId?: string;
    /** @uniqueItems true */
    orderList?: string[];
}

/** Process Definition */
export interface ProcessDTO {
    /** Process ID */
    id?: string;
    /** Process Key */
    key?: string;
    /** Process Name */
    name?: string;
    /** Process Category */
    category?: string;
    /** Process Resource Name */
    resourceName?: string;
    /** Process Diagram Resource Name */
    diagramName?: string;
    /**
     * Process Version
     * @format int32
     */
    version?: number;
    /** Production Version Number */
    versionNumber?: string;
    /** Process Version ID */
    versionId?: string;
    /** Production Draft ID */
    draftId?: string;
}

export interface ResultListProcessDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: ProcessDTO[];
}

export interface SortObject {
    sorted?: boolean;
    empty?: boolean;
    unsorted?: boolean;
}

export interface WorkflowDateFilterDTO {
    filterType?: string;
    startDate?: string;
    endDate?: string;
}

export interface WorkflowJobRequestDTO {
    /**
     * Page Number
     * @format int32
     */
    pageNum?: number;
    /**
     * Page Size
     * @format int32
     */
    pageSize?: number;
    /** The sortBy fields */
    orderBy?: string;
    /** The sort ASC or DESC */
    isDesc?: boolean;
    startCreator?: string;
    workflowStatus?: string;
    overallStatus?: string;
    approver?: string;
    dateFilter?: WorkflowDateFilterDTO;
    variables?: {
        empty?: boolean;
        innerMap?: Record<string, object>;
        [key: string]: any;
    };
    workflowNames?: string[];
    sort?: SortObject;
}

export interface PaginationDTOWorkflowJobOutlineDTO {
    entryList?: WorkflowJobOutlineDTO[];
    /** @format int32 */
    totalSize?: number;
    /** @format int32 */
    currentPageSize?: number;
    /** @format int32 */
    pageNum?: number;
    /** @format int32 */
    pageCount?: number;
    isNextPageAvailable?: boolean;
}

export interface ResultPaginationDTOWorkflowJobOutlineDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTOWorkflowJobOutlineDTO;
}

export interface WorkflowJobDetailDTO {
    startDate?: string;
    endDate?: string;
    instanceId?: string;
    workflowState?: string;
    workflowName?: string;
    approver?: string;
    terminator?: string;
    inputData?: {
        empty?: boolean;
        innerMap?: Record<string, object>;
        [key: string]: any;
    };
    variables?: {
        empty?: boolean;
        innerMap?: Record<string, object>;
        [key: string]: any;
    };
}

export interface WorkflowJobOutlineDTO {
    startDate?: string;
    endDate?: string;
    state?: string;
    creator?: string;
    details?: WorkflowJobDetailDTO[];
}

export interface QueryWorkflowVariablesRequestDTO {
    processDefinitionName?: string;
}

export interface ResultListWorkflowVariableDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: WorkflowVariableDTO[];
}

export interface WorkflowVariableDTO {
    name?: string;
    type?: string;
}

/** User Dashboard RequestDTO */
export interface UserDashboardRequestDTO {
    /**
     * Page Number
     * @format int32
     */
    pageNum?: number;
    /**
     * Page Size
     * @format int32
     */
    pageSize?: number;
    /** The sortBy fields */
    orderBy?: string;
    /** The sort ASC or DESC */
    isDesc?: boolean;
    /** The Record Name */
    name?: string;
    /** The Record Creator */
    createdBy?: string;
    /** The Record Status (A,D,P.R) */
    status?: string;
    /** The User ID */
    userId?: string;
    sort?: SortObject;
}

export interface PaginationDTOUserDashboardResponseDTO {
    entryList?: UserDashboardResponseDTO[];
    /** @format int32 */
    totalSize?: number;
    /** @format int32 */
    currentPageSize?: number;
    /** @format int32 */
    pageNum?: number;
    /** @format int32 */
    pageCount?: number;
    isNextPageAvailable?: boolean;
}

export interface ResultPaginationDTOUserDashboardResponseDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTOUserDashboardResponseDTO;
}

/** UserDashboard ResponseDTO */
export interface UserDashboardResponseDTO {
    /** @format int64 */
    id?: number;
    name?: string;
    access?: string;
    styleJson?: string;
    status?: string;
    createdBy?: string;
    modifiedBy?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
    accessors?: string[];
}

/** UserDashboard RequestDTO */
export interface PluginRequestDTO {
    /**
     * Page Number
     * @format int32
     */
    pageNum?: number;
    /**
     * Page Size
     * @format int32
     */
    pageSize?: number;
    /** The sortBy fields */
    orderBy?: string;
    /** The sort ASC or DESC */
    isDesc?: boolean;
    /** The record creator */
    name?: string;
    /** The record creator */
    createdBy?: string;
    /** The record status (A,D,P.R) */
    status?: string;
    sort?: SortObject;
}

export interface PaginationDTOPluginResponseDTO {
    entryList?: PluginResponseDTO[];
    /** @format int32 */
    totalSize?: number;
    /** @format int32 */
    currentPageSize?: number;
    /** @format int32 */
    pageNum?: number;
    /** @format int32 */
    pageCount?: number;
    isNextPageAvailable?: boolean;
}

/** UserDashboard ResponseDTO */
export interface PluginResponseDTO {
    /** @format int64 */
    id?: number;
    name?: string;
    status?: string;
    createdBy?: string;
    createdByName?: string;
    modifiedBy?: string;
    modifiedByName?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
}

export interface ResultPaginationDTOPluginResponseDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTOPluginResponseDTO;
}

export interface OcrProcessedRequestDTO {
    startDate?: string;
    endDate?: string;
    workflow?: string;
    scanType?: string;
}

export interface OcrProcessedDetailDTO {
    name?: string;
    /** @format int32 */
    pageCount?: number;
    /** @format int32 */
    yearMonth?: number;
    /** @format int32 */
    date?: number;
}

export interface ResultListOcrProcessedDetailDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: OcrProcessedDetailDTO[];
}

export interface OcrTransactionLogRequestDTO {
    /**
     * Page Number
     * @format int32
     */
    pageNum?: number;
    /**
     * Page Size
     * @format int32
     */
    pageSize?: number;
    /** The sortBy fields */
    orderBy?: string;
    /** The sort ASC or DESC */
    isDesc?: boolean;
    /** businessName */
    businessName?: string;
    /** workflow */
    workflow?: string;
    /** state */
    state?: string;
    /** ocrProfileName */
    ocrProfileName?: string;
    /** scanType */
    scanType?: string;
    /** startDate, 格式：yyyy-MM-dd */
    startDate?: string;
    /** endDate, 格式：yyyy-MM-dd */
    endDate?: string;
    sort?: SortObject;
}

export interface OcrTransactionLogDTO {
    /** @format int64 */
    id?: number;
    businessName?: string;
    workflow?: string;
    state?: string;
    ocrProfileName?: string;
    scanType?: string;
    /** @format int32 */
    ocrPageCount?: number;
    /** @format int32 */
    fieldCount?: number;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
}

export interface PaginationDTOOcrTransactionLogDTO {
    entryList?: OcrTransactionLogDTO[];
    /** @format int32 */
    totalSize?: number;
    /** @format int32 */
    currentPageSize?: number;
    /** @format int32 */
    pageNum?: number;
    /** @format int32 */
    pageCount?: number;
    isNextPageAvailable?: boolean;
}

export interface ResultPaginationDTOOcrTransactionLogDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTOOcrTransactionLogDTO;
}

export interface OcrThredsholdRequestDTO {
    scanType?: string;
    startDate?: string;
    endDate?: string;
}

export interface OcrThresholdDTO {
    /** @format int32 */
    currentCount?: number;
    /** @format int32 */
    thresholdCount?: number;
}

export interface ResultOcrThresholdDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: OcrThresholdDTO;
}

export interface MailSendRequest {
    fromEmail?: string;
    to?: string;
    tos?: string[];
    ccs?: string[];
    bcc?: string[];
    subject?: string;
    text?: string;
    templateId?: string;
    variables?: Record<string, object>;
    files?: File[];
    userId?: string;
    accessToken?: string;
}

export interface BatchMailSendRequest {
    batchTaskId?: string;
    fromEmail: string;
    subject?: string;
    text?: string;
    templateId?: string;
    tos: string[];
    ccs?: string[];
    bcc?: string[];
    files?: File[];
    variables?: Record<string, object>;
    userId?: string;
    accessToken?: string;
    /** @format int64 */
    sendInterval?: number;
    /** @format int32 */
    batchSize?: number;
    /** @format int64 */
    batchInterval?: number;
    async?: boolean;
}

export interface BatchSendEmailResponseDTO {
    batchTaskId?: string;
    /** @format int32 */
    totalCount?: number;
    /** @format int32 */
    successCount?: number;
    /** @format int32 */
    failedCount?: number;
    status?: string;
    /** @format date-time */
    createdTime?: string;
    /** @format date-time */
    completedTime?: string;
    errorMessages?: string[];
    async?: boolean;
    /** @format double */
    progress?: number;
}

export interface ResultBatchSendEmailResponseDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: BatchSendEmailResponseDTO;
}

export interface DashBoardWorkflowRequestDTO {
    workflowId?: string;
    userId?: string;
    dateRange?: Record<string, string>;
    /** @uniqueItems true */
    timeGroup?: number[];
    /** @format date-time */
    gteDate?: string;
    /** @format date-time */
    lteDate?: string;
    /** @format int32 */
    pageNum?: number;
    /** @format int32 */
    pageSize?: number;
}

export interface ResultMapStringInteger {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: Record<string, number>;
}

export interface DashBoardWorkflowResponseDTO {
    key?: string;
    /** @format int32 */
    count?: number;
}

export interface ResultLinkedListDashBoardWorkflowResponseDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: DashBoardWorkflowResponseDTO[];
}

export interface ResultMapStringDouble {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: Record<string, number>;
}

export interface DashBoardRequestDTO {
    primaryType?: string;
    primaryTypes?: string[];
    filterByMetaDatas?: Record<string, object>;
    sizeUnit?: string;
    interval?: string;
    creator?: string;
    groupByMetadatas?: string[];
    dateRange?: Record<string, string>;
    orderBy?: string;
    isDesc?: boolean;
    isNeedSize?: boolean;
    isQueryList?: boolean;
    /** @format date-time */
    beginDate?: string;
    /** @format date-time */
    endDate?: string;
    /** @format int32 */
    pageSize?: number;
    /** @format int32 */
    pageIndex?: number;
}

export interface DateRangeDTO {
    from?: string;
    to?: string;
}

export interface DateRangeRequestDTO {
    dateRange?: DateRangeDTO;
    docTypes?: string[];
    groupBy?: string;
}

/** Define block inherited permission of document */
export interface BlockInheritedPermission {
    /** @format int64 */
    id?: number;
    /** the document id */
    docId?: string;
    /** the document path */
    docPath?: string;
    /** the block id of document */
    blockId?: string;
}

export interface ResultBlockInheritedPermission {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** Define block inherited permission of document */
    data?: BlockInheritedPermission;
}

export interface DocDTO {
    /** the document id */
    docId?: string;
    /** the document path */
    docPath?: string;
    /** the parent document id */
    parentDocId?: string;
}

export interface ResultListDocDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: DocDTO[];
}

export interface PageSearchHistory {
    /** @format int32 */
    totalPages?: number;
    /** @format int64 */
    totalElements?: number;
    /** @format int32 */
    number?: number;
    /** @format int32 */
    size?: number;
    /** @format int32 */
    numberOfElements?: number;
    content?: SearchHistory[];
    sort?: SortObject;
    first?: boolean;
    last?: boolean;
    pageable?: PageableObject;
    empty?: boolean;
}

export interface PageableObject {
    paged?: boolean;
    unpaged?: boolean;
    /** @format int32 */
    pageNumber?: number;
    /** @format int32 */
    pageSize?: number;
    /** @format int64 */
    offset?: number;
    sort?: SortObject;
}

export interface ResultListAclPermissionDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: AclPermissionDTO[];
}

export interface ResultListAclUserRelationshipWithUserGroup {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: AclUserRelationshipWithUserGroup[];
}

export interface ResultAclUserGroupDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: AclUserGroupDTO;
}

export interface ResultListPlugin {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: Plugin[];
}

/** All Condition ResponseDTO */
export interface ConditionResponseDTO {
    key?: string;
    label?: string;
    type?: string;
    options?: Record<string, object>[];
    belong?: string;
    isMultiple?: boolean;
}

export interface ResultListConditionResponseDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: ConditionResponseDTO[];
}

export interface DocPalEmailTemplate {
    id?: string;
    /** @format int64 */
    emailLayoutId?: number;
    emailTemplateJson?: string;
    emailTemplateVariable?: string;
    to?: string;
    from?: string;
    label?: string;
    cc?: string;
    bcc?: string;
    subject?: string;
    body?: string;
    status?: string;
    createdBy?: string;
    modifiedBy?: string;
    display?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
    emailLayoutName?: string;
}

export interface ResultListDocPalEmailTemplate {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: DocPalEmailTemplate[];
}

export interface AzureOcrSettingDTO {
    cutOffTime?: string;
    /** @format int32 */
    readThreshold?: number;
    /** @format int32 */
    preBuildThreshold?: number;
    /** @format int32 */
    customModelThreshold?: number;
    alertEmail?: string;
    emailTemplate?: string;
}

export interface ResultAzureOcrSettingDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: AzureOcrSettingDTO;
}

export interface AclEntryDTO {
    id?: string;
    /**
     * 名称
     * @example "Write"
     */
    name: string;
    /**
     * 标签
     * @example "Write"
     */
    label?: string;
    /** 类型 */
    type?: "System" | "Document";
    /** 是否删除的标记 */
    deleteFlag?: "YES" | "NO";
    /**
     * 创建者
     * @example "Administrator"
     */
    createdBy?: string;
    /**
     * 更新者
     * @example "Administrator"
     */
    modifiedBy?: string;
    /**
     * Created Date
     * @format date-time
     */
    createdDate?: string;
    /**
     * Modified Date
     * @format date-time
     */
    modifiedDate?: string;
    ids?: string[];
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
        this.instance = axios.create({ ...axiosConfig, baseURL: axiosConfig.baseURL || "http://132.148.160.191" });
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
 * @title DocPal REST API
 * @version 0.0.1
 * @baseUrl http://132.148.160.191
 *
 * DocPal REST API Documentation
 */
export class Public<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
    api = {
        /**
         * No description
         *
         * @tags Configuration
         * @name GetNuxeoTypes
         * @summary Get all document types
         * @request GET:/api/nuxeo/types
         */
        getNuxeoTypes: (
            query: {
                /** @format int32 */
                flag: number;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListDocumentTypeDTO, Result>({
                path: `/api/nuxeo/types`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Configuration
         * @name PostNuxeoTypes
         * @summary Get all document types
         * @request POST:/api/nuxeo/types
         */
        postNuxeoTypes: (
            query: {
                /** @format int32 */
                flag: number;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListDocumentTypeDTO, Result>({
                path: `/api/nuxeo/types`,
                method: "POST",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags UserDashboardController
         * @name PutUserDashboard
         * @summary Update user dashboard
         * @request PUT:/api/docpal/user/dashboard
         */
        putUserDashboard: (data: UserDashboard, params: RequestParams = {}) =>
            this.request<ResultUserDashboard, Result>({
                path: `/api/docpal/user/dashboard`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags UserDashboardController
         * @name PostUserDashboard
         * @summary Create user dashboard
         * @request POST:/api/docpal/user/dashboard
         */
        postUserDashboard: (data: UserDashboard, params: RequestParams = {}) =>
            this.request<ResultUserDashboard, Result>({
                path: `/api/docpal/user/dashboard`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags UserDashboardController
         * @name GetPlugins
         * @summary Obtain all dashboard plugin
         * @request GET:/api/docpal/plugins
         */
        getPlugins: (params: RequestParams = {}) =>
            this.request<ResultListPlugin, Result>({
                path: `/api/docpal/plugins`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags UserDashboardController
         * @name PutPlugins
         * @summary Update plugin
         * @request PUT:/api/docpal/plugins
         */
        putPlugins: (data: Plugin, params: RequestParams = {}) =>
            this.request<ResultPlugin, Result>({
                path: `/api/docpal/plugins`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags UserDashboardController
         * @name PostPlugins
         * @summary Create Dashboard Plugin
         * @request POST:/api/docpal/plugins
         */
        postPlugins: (data: Plugin, params: RequestParams = {}) =>
            this.request<ResultPlugin, Result>({
                path: `/api/docpal/plugins`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags VerificationPermissionController
         * @name PostVerificationPermission
         * @summary verification access control permission of acl user
         * @request POST:/api/verification/permission
         */
        postVerificationPermission: (data: VerificationPermissionReq, params: RequestParams = {}) =>
            this.request<ResultObject, Result>({
                path: `/api/verification/permission`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Search History
         * @name GetV1SearchHistory
         * @summary Get paginated search history
         * @request GET:/api/v1/search-history
         */
        getV1SearchHistory: (
            query: {
                /** User ID */
                userId: string;
                /** Tenant ID */
                tenantId: string;
                /**
                 * Page number (0-based)
                 * @format int32
                 * @default 0
                 */
                pageNum?: number;
                /**
                 * Page size
                 * @format int32
                 * @default 10
                 */
                pageSize?: number;
            },
            params: RequestParams = {},
        ) =>
            this.request<PageSearchHistory, Result>({
                path: `/api/v1/search-history`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Search History
         * @name PostV1SearchHistory
         * @summary Save search history record
         * @request POST:/api/v1/search-history
         */
        postV1SearchHistory: (data: SearchHistory, params: RequestParams = {}) =>
            this.request<SearchHistory, Result>({
                path: `/api/v1/search-history`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags AclUserPermissionController
         * @name GetUserPermission
         * @summary Query permission
         * @request GET:/api/user/permission
         */
        getUserPermission: (
            query: {
                businessId: string;
                userId: string;
                aces: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultAclUserPermission, Result>({
                path: `/api/user/permission`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags AclUserPermissionController
         * @name PostUserPermission
         * @summary create permission of acl user that deal with business
         * @request POST:/api/user/permission
         */
        postUserPermission: (data: AclUserPermission, params: RequestParams = {}) =>
            this.request<ResultAclUserPermission, Result>({
                path: `/api/user/permission`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags AclUserPermissionController
         * @name DeleteUserPermission
         * @summary Remove single permission
         * @request DELETE:/api/user/permission
         */
        deleteUserPermission: (data: AclUserPermission, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result>({
                path: `/api/user/permission`,
                method: "DELETE",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags AclUserPermissionController
         * @name PostUserPermissionReplace
         * @request POST:/api/user/permission/replace
         */
        postUserPermissionReplace: (data: AclUserPermission, params: RequestParams = {}) =>
            this.request<ResultAclUserPermission, Result>({
                path: `/api/user/permission/replace`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags AclPermissionController
         * @name PostPermissions
         * @summary Create access control permission
         * @request POST:/api/permissions
         */
        postPermissions: (data: AccessControlPermission, params: RequestParams = {}) =>
            this.request<ResultAccessControlPermission, Result>({
                path: `/api/permissions`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags AclPermissionController
         * @name DeletePermissions
         * @summary delete access control permission and entry list by name
         * @request DELETE:/api/permissions
         */
        deletePermissions: (data: AclPermissionDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result>({
                path: `/api/permissions`,
                method: "DELETE",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags AclPermissionController
         * @name PostPermissionsNames
         * @request POST:/api/permissions/names
         */
        postPermissionsNames: (data: string[], params: RequestParams = {}) =>
            this.request<ResultListAccessControlPermission, Result>({
                path: `/api/permissions/names`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags AclPermissionController
         * @name PostPermissionsEntries
         * @summary Query permission entry list by permission name list
         * @request POST:/api/permissions/entries
         */
        postPermissionsEntries: (data: string[], params: RequestParams = {}) =>
            this.request<ResultListString, Result>({
                path: `/api/permissions/entries`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags AclPermissionController
         * @name PostPermissionsBatchEntry
         * @summary batch add access control permission
         * @request POST:/api/permissions/batch/entry
         */
        postPermissionsBatchEntry: (data: AclPermissionDTO, params: RequestParams = {}) =>
            this.request<ResultAclPermissionDTO, Result>({
                path: `/api/permissions/batch/entry`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags AclUserController
         * @name PostPermissionUsers
         * @summary create acl user
         * @request POST:/api/permission/users
         */
        postPermissionUsers: (data: AclUserInformation, params: RequestParams = {}) =>
            this.request<ResultAclUserInformation, Result>({
                path: `/api/permission/users`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags AclUserRelationshipController
         * @name PostPermissionUserRelationships
         * @summary create user relation ship
         * @request POST:/api/permission/user/relationships
         */
        postPermissionUserRelationships: (data: AclUserRelationshipWithUserGroup[], params: RequestParams = {}) =>
            this.request<ResultBoolean, Result>({
                path: `/api/permission/user/relationships`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags AclUserRelationshipController
         * @name DeletePermissionUserRelationships
         * @summary remove user relation ship
         * @request DELETE:/api/permission/user/relationships
         */
        deletePermissionUserRelationships: (data: AclUserRelationshipWithUserGroup[], params: RequestParams = {}) =>
            this.request<ResultBoolean, Result>({
                path: `/api/permission/user/relationships`,
                method: "DELETE",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags AclUserGroupController
         * @name PostPermissionUserGroup
         * @summary create acl user group
         * @request POST:/api/permission/user/group
         */
        postPermissionUserGroup: (data: AclUserGroup, params: RequestParams = {}) =>
            this.request<ResultAclUserGroup, Result>({
                path: `/api/permission/user/group`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags AclUserGroupController
         * @name DeletePermissionUserGroup
         * @summary Remove user from user group
         * @request DELETE:/api/permission/user/group
         */
        deletePermissionUserGroup: (data: AclUserRelationshipWithUserGroup[], params: RequestParams = {}) =>
            this.request<ResultBoolean, Result>({
                path: `/api/permission/user/group`,
                method: "DELETE",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags AclUserGroupController
         * @name PostPermissionUserGroupUsers
         * @summary Add the list of acl user to user group
         * @request POST:/api/permission/user/group/users
         */
        postPermissionUserGroupUsers: (data: AclUserGroupDTO, params: RequestParams = {}) =>
            this.request<ResultAclUserGroup, Result>({
                path: `/api/permission/user/group/users`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags AclUserGroupController
         * @name PostPermissionUserGroupGroups
         * @request POST:/api/permission/user/group/groups
         */
        postPermissionUserGroupGroups: (data: AclUserGroupDTO, params: RequestParams = {}) =>
            this.request<ResultListAclUserGroup, Result>({
                path: `/api/permission/user/group/groups`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags AclUserGroupController
         * @name PostPermissionUserGroupAddUsers
         * @summary Add user to user group
         * @request POST:/api/permission/user/group/add/users
         */
        postPermissionUserGroupAddUsers: (data: AclUserRelationshipWithUserGroup[], params: RequestParams = {}) =>
            this.request<ResultBoolean, Result>({
                path: `/api/permission/user/group/add/users`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags AclEntryController
         * @name PostPermissionEntry
         * @summary Create Access control entry
         * @request POST:/api/permission/entry
         */
        postPermissionEntry: (data: AccessControlEntry, params: RequestParams = {}) =>
            this.request<ResultAccessControlEntry, Result>({
                path: `/api/permission/entry`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags AclEntryController
         * @name DeletePermissionEntry
         * @summary Batch delete entry by id list
         * @request DELETE:/api/permission/entry
         */
        deletePermissionEntry: (data: AclEntryDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result>({
                path: `/api/permission/entry`,
                method: "DELETE",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name PostWorkflowProcessListDeprecate
         * @request POST:/api/docpal/workflow/process/list/
         */
        postWorkflowProcessListDeprecate: (data: WorkflowRequestDTO, params: RequestParams = {}) =>
            this.request<ResultListProcessDTO, Result>({
                path: `/api/docpal/workflow/process/list/`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name PostWorkflowProcessList
         * @request POST:/api/docpal/workflow/process/list
         */
        postWorkflowProcessList: (data: WorkflowRequestDTO, params: RequestParams = {}) =>
            this.request<ResultListProcessDTO, Result>({
                path: `/api/docpal/workflow/process/list`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name PostWorkflowProcessCombineList
         * @request POST:/api/docpal/workflow/process/combine/list
         */
        postWorkflowProcessCombineList: (data: WorkflowRequestDTO, params: RequestParams = {}) =>
            this.request<ResultListProcessDTO, Result>({
                path: `/api/docpal/workflow/process/combine/list`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name PostWorkflowJobList
         * @request POST:/api/docpal/workflow/job/list
         */
        postWorkflowJobList: (data: WorkflowJobRequestDTO, params: RequestParams = {}) =>
            this.request<ResultPaginationDTOWorkflowJobOutlineDTO, Result>({
                path: `/api/docpal/workflow/job/list`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name PostWorkflowJobListDeprecate
         * @request POST:/api/docpal/workflow/job/list/
         */
        postWorkflowJobListDeprecate: (data: WorkflowJobRequestDTO, params: RequestParams = {}) =>
            this.request<ResultPaginationDTOWorkflowJobOutlineDTO, Result>({
                path: `/api/docpal/workflow/job/list/`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name PostWorkflowJobFilterDataDeprecate
         * @request POST:/api/docpal/workflow/job/filter_data/
         */
        postWorkflowJobFilterDataDeprecate: (data: QueryWorkflowVariablesRequestDTO, params: RequestParams = {}) =>
            this.request<ResultListWorkflowVariableDTO, Result>({
                path: `/api/docpal/workflow/job/filter_data/`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name PostWorkflowJobFilterData
         * @request POST:/api/docpal/workflow/job/filter_data
         */
        postWorkflowJobFilterData: (data: QueryWorkflowVariablesRequestDTO, params: RequestParams = {}) =>
            this.request<ResultListWorkflowVariableDTO, Result>({
                path: `/api/docpal/workflow/job/filter_data`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags UserDashboardController
         * @name PostUserDashboardPage
         * @summary Pagination search
         * @request POST:/api/docpal/user/dashboard/page
         */
        postUserDashboardPage: (data: UserDashboardRequestDTO, params: RequestParams = {}) =>
            this.request<ResultPaginationDTOUserDashboardResponseDTO, Result>({
                path: `/api/docpal/user/dashboard/page`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags UserDashboardController
         * @name PostPluginsPage
         * @summary Pagination Search
         * @request POST:/api/docpal/plugins/page
         */
        postPluginsPage: (data: PluginRequestDTO, params: RequestParams = {}) =>
            this.request<ResultPaginationDTOPluginResponseDTO, Result>({
                path: `/api/docpal/plugins/page`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ocr-statistical-controller
         * @name PostOcrQueryWorkflowInfo
         * @request POST:/api/docpal/ocr/query_workflow_info
         */
        postOcrQueryWorkflowInfo: (data: OcrProcessedRequestDTO, params: RequestParams = {}) =>
            this.request<ResultListOcrProcessedDetailDTO, Result>({
                path: `/api/docpal/ocr/query_workflow_info`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ocr-statistical-controller
         * @name PostOcrQueryScanTypeInfo
         * @request POST:/api/docpal/ocr/query_scan_type_info
         */
        postOcrQueryScanTypeInfo: (data: OcrProcessedRequestDTO, params: RequestParams = {}) =>
            this.request<ResultListOcrProcessedDetailDTO, Result>({
                path: `/api/docpal/ocr/query_scan_type_info`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ocr-statistical-controller
         * @name PostOcrQueryOcrTransactionLogs
         * @request POST:/api/docpal/ocr/query_ocr_transaction_logs
         */
        postOcrQueryOcrTransactionLogs: (data: OcrTransactionLogRequestDTO, params: RequestParams = {}) =>
            this.request<ResultPaginationDTOOcrTransactionLogDTO, Result>({
                path: `/api/docpal/ocr/query_ocr_transaction_logs`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ocr-statistical-controller
         * @name PostOcrQueryOcrThreshold
         * @request POST:/api/docpal/ocr/query_ocr_threshold
         */
        postOcrQueryOcrThreshold: (data: OcrThredsholdRequestDTO, params: RequestParams = {}) =>
            this.request<ResultOcrThresholdDTO, Result>({
                path: `/api/docpal/ocr/query_ocr_threshold`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ocr-statistical-controller
         * @name PostOcrQueryDailyWorkflowInfo
         * @request POST:/api/docpal/ocr/query_daily_workflow_info
         */
        postOcrQueryDailyWorkflowInfo: (data: OcrProcessedRequestDTO, params: RequestParams = {}) =>
            this.request<ResultListOcrProcessedDetailDTO, Result>({
                path: `/api/docpal/ocr/query_daily_workflow_info`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ocr-statistical-controller
         * @name PostOcrQueryDailyScanTypeInfo
         * @request POST:/api/docpal/ocr/query_daily_scan_type_info
         */
        postOcrQueryDailyScanTypeInfo: (data: OcrProcessedRequestDTO, params: RequestParams = {}) =>
            this.request<ResultListOcrProcessedDetailDTO, Result>({
                path: `/api/docpal/ocr/query_daily_scan_type_info`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalEmailController
         * @name PostEmailTemplateSend
         * @request POST:/api/docpal/email/template/send
         */
        postEmailTemplateSend: (data: MailSendRequest, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result>({
                path: `/api/docpal/email/template/send`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalEmailController
         * @name PostEmailSend
         * @summary Send test email using email template
         * @request POST:/api/docpal/email/send
         */
        postEmailSend: (data: MailSendRequest, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result>({
                path: `/api/docpal/email/send`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalEmailController
         * @name PostEmailSendFrom
         * @request POST:/api/docpal/email/send/from
         */
        postEmailSendFrom: (
            query: {
                mailSendRequest: MailSendRequest;
                multipartFiles: File[];
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultBoolean, Result>({
                path: `/api/docpal/email/send/from`,
                method: "POST",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalEmailController
         * @name PostEmailCustomizeSend
         * @request POST:/api/docpal/email/customize/send
         */
        postEmailCustomizeSend: (data: MailSendRequest, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result>({
                path: `/api/docpal/email/customize/send`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalEmailController
         * @name PostEmailBatchSend
         * @request POST:/api/docpal/email/batch/send
         */
        postEmailBatchSend: (data: BatchMailSendRequest, params: RequestParams = {}) =>
            this.request<ResultBatchSendEmailResponseDTO, Result>({
                path: `/api/docpal/email/batch/send`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalEmailController
         * @name PostEmailBatchSendundefined
         * @request POST:/api/docpal/email/batch-send
         */
        postEmailBatchSendundefined: (
            query: {
                request: string;
            },
            data: {
                files?: File[];
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultBatchSendEmailResponseDTO, Result>({
                path: `/api/docpal/email/batch-send`,
                method: "POST",
                query: query,
                body: data,
                type: ContentType.FormData,
                ...params,
            }),

        /**
         * No description
         *
         * @tags dash-board-controller
         * @name PostDashboardWorkflowspendtime
         * @request POST:/api/docpal/dashboard/WorkflowSpendTime
         */
        postDashboardWorkflowspendtime: (data: DashBoardWorkflowRequestDTO, params: RequestParams = {}) =>
            this.request<ResultMapStringInteger, Result>({
                path: `/api/docpal/dashboard/WorkflowSpendTime`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags dash-board-controller
         * @name PostDashboardWorkflowactivelist
         * @request POST:/api/docpal/dashboard/WorkflowActiveList
         */
        postDashboardWorkflowactivelist: (data: DashBoardWorkflowRequestDTO, params: RequestParams = {}) =>
            this.request<Result, Result>({
                path: `/api/docpal/dashboard/WorkflowActiveList`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags dash-board-controller
         * @name PostDashboardWorkflowactivatetasktrend
         * @request POST:/api/docpal/dashboard/WorkflowActivateTaskTrend
         */
        postDashboardWorkflowactivatetasktrend: (data: DashBoardWorkflowRequestDTO, params: RequestParams = {}) =>
            this.request<ResultLinkedListDashBoardWorkflowResponseDTO, Result>({
                path: `/api/docpal/dashboard/WorkflowActivateTaskTrend`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags dash-board-controller
         * @name PostDashboardWorkflowactivatetaskspendtime
         * @request POST:/api/docpal/dashboard/WorkflowActivateTaskSpendTime
         */
        postDashboardWorkflowactivatetaskspendtime: (data: DashBoardWorkflowRequestDTO, params: RequestParams = {}) =>
            this.request<ResultMapStringDouble, Result>({
                path: `/api/docpal/dashboard/WorkflowActivateTaskSpendTime`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags dash-board-controller
         * @name PostDashboardNewworkflowcounttrend
         * @request POST:/api/docpal/dashboard/NewWorkflowCountTrend
         */
        postDashboardNewworkflowcounttrend: (data: DashBoardWorkflowRequestDTO, params: RequestParams = {}) =>
            this.request<ResultLinkedListDashBoardWorkflowResponseDTO, Result>({
                path: `/api/docpal/dashboard/NewWorkflowCountTrend`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags dash-board-controller
         * @name PostDashboardNewfilesofuserssizebydtypebymonthlycumulation
         * @request POST:/api/docpal/dashboard/NewFilesOfUsersSizeByDTypeBymonthlyCumulation
         */
        postDashboardNewfilesofuserssizebydtypebymonthlycumulation: (
            data: DashBoardRequestDTO,
            params: RequestParams = {},
        ) =>
            this.request<Result, Result>({
                path: `/api/docpal/dashboard/NewFilesOfUsersSizeByDTypeBymonthlyCumulation`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags dash-board-controller
         * @name PostDashboardNewfilesofusersmetabydtypebyrange
         * @request POST:/api/docpal/dashboard/NewFilesOfUsersMetaByDTypeByRange
         */
        postDashboardNewfilesofusersmetabydtypebyrange: (data: DashBoardRequestDTO, params: RequestParams = {}) =>
            this.request<Result, Result>({
                path: `/api/docpal/dashboard/NewFilesOfUsersMetaByDTypeByRange`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags dash-board-controller
         * @name PostDashboardNewfilesofuserscountbydtypebymonthlycumulation
         * @request POST:/api/docpal/dashboard/NewFilesOfUsersCountByDTypeBymonthlyCumulation
         */
        postDashboardNewfilesofuserscountbydtypebymonthlycumulation: (
            data: DashBoardRequestDTO,
            params: RequestParams = {},
        ) =>
            this.request<Result, Result>({
                path: `/api/docpal/dashboard/NewFilesOfUsersCountByDTypeBymonthlyCumulation`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags dash-board-controller
         * @name PostDashboardNewfilesofuserbydtypebyrangefiltermatedata
         * @request POST:/api/docpal/dashboard/NewFilesOfUserByDTypeByRangeFilterMatedata
         */
        postDashboardNewfilesofuserbydtypebyrangefiltermatedata: (
            data: DashBoardRequestDTO,
            params: RequestParams = {},
        ) =>
            this.request<Result, Result>({
                path: `/api/docpal/dashboard/NewFilesOfUserByDTypeByRangeFilterMatedata`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags dash-board-controller
         * @name PostDashboardNewfilesofspecifyusersizebydtypebymonthlycumulation
         * @request POST:/api/docpal/dashboard/NewFilesOfSpecifyUserSizeByDTypeBymonthlyCumulation
         */
        postDashboardNewfilesofspecifyusersizebydtypebymonthlycumulation: (
            data: DashBoardRequestDTO,
            params: RequestParams = {},
        ) =>
            this.request<Result, Result>({
                path: `/api/docpal/dashboard/NewFilesOfSpecifyUserSizeByDTypeBymonthlyCumulation`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags dash-board-controller
         * @name PostDashboardNewfilesofspecifyusermetabydtypebyrange
         * @request POST:/api/docpal/dashboard/NewFilesOfSpecifyUserMetaByDTypeByRange
         */
        postDashboardNewfilesofspecifyusermetabydtypebyrange: (data: DashBoardRequestDTO, params: RequestParams = {}) =>
            this.request<Result, Result>({
                path: `/api/docpal/dashboard/NewFilesOfSpecifyUserMetaByDTypeByRange`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags dash-board-controller
         * @name PostDashboardNewfilesofspecifyusercountbydtypebymonthlycumulation
         * @request POST:/api/docpal/dashboard/NewFilesOfSpecifyUserCountByDTypeBymonthlyCumulation
         */
        postDashboardNewfilesofspecifyusercountbydtypebymonthlycumulation: (
            data: DashBoardRequestDTO,
            params: RequestParams = {},
        ) =>
            this.request<Result, Result>({
                path: `/api/docpal/dashboard/NewFilesOfSpecifyUserCountByDTypeBymonthlyCumulation`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags dash-board-controller
         * @name PostDashboardNewfilesofspecifyuserbydtypebyrangefiltermatedata
         * @request POST:/api/docpal/dashboard/NewFilesOfSpecifyUserByDTypeByRangeFilterMatedata
         */
        postDashboardNewfilesofspecifyuserbydtypebyrangefiltermatedata: (
            data: DashBoardRequestDTO,
            params: RequestParams = {},
        ) =>
            this.request<Result, Result>({
                path: `/api/docpal/dashboard/NewFilesOfSpecifyUserByDTypeByRangeFilterMatedata`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags dash-board-controller
         * @name PostDashboardNewfileslist
         * @request POST:/api/docpal/dashboard/NewFilesList
         */
        postDashboardNewfileslist: (data: DashBoardRequestDTO, params: RequestParams = {}) =>
            this.request<Result, Result>({
                path: `/api/docpal/dashboard/NewFilesList`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags dash-board-controller
         * @name PostDashboardDocumenttypeofsizebyrange
         * @request POST:/api/docpal/dashboard/DocumentTypeOfSizeByRange
         */
        postDashboardDocumenttypeofsizebyrange: (data: DateRangeRequestDTO, params: RequestParams = {}) =>
            this.request<Result, Result>({
                path: `/api/docpal/dashboard/DocumentTypeOfSizeByRange`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags dash-board-controller
         * @name PostDashboardDocumenttypeofsizebymonthlyrangecumulation
         * @request POST:/api/docpal/dashboard/DocumentTypeOfSizeByMonthlyRangeCumulation
         */
        postDashboardDocumenttypeofsizebymonthlyrangecumulation: (
            data: DashBoardRequestDTO,
            params: RequestParams = {},
        ) =>
            this.request<Result, Result>({
                path: `/api/docpal/dashboard/DocumentTypeOfSizeByMonthlyRangeCumulation`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags dash-board-controller
         * @name PostDashboardDocumenttypeofcountbyrange
         * @request POST:/api/docpal/dashboard/DocumentTypeOfCountByRange
         */
        postDashboardDocumenttypeofcountbyrange: (data: DateRangeRequestDTO, params: RequestParams = {}) =>
            this.request<Result, Result>({
                path: `/api/docpal/dashboard/DocumentTypeOfCountByRange`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocBlockPermissionController
         * @name PostBlockPermission
         * @summary Create DocBlockPermission
         * @request POST:/api/block/permission
         */
        postBlockPermission: (data: BlockInheritedPermission, params: RequestParams = {}) =>
            this.request<ResultBlockInheritedPermission, Result>({
                path: `/api/block/permission`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocBlockPermissionController
         * @name PostBlockPermissionFilter
         * @summary filter block document permission
         * @request POST:/api/block/permission/filter
         */
        postBlockPermissionFilter: (data: DocDTO, params: RequestParams = {}) =>
            this.request<ResultListDocDTO, Result>({
                path: `/api/block/permission/filter`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags AclPermissionController
         * @name PatchPermissionsUpdateEntry
         * @summary batch modify list of entries of permissions
         * @request PATCH:/api/permissions/update/entry
         */
        patchPermissionsUpdateEntry: (data: AclPermissionDTO, params: RequestParams = {}) =>
            this.request<ResultAclPermissionDTO, Result>({
                path: `/api/permissions/update/entry`,
                method: "PATCH",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags UserDashboardController
         * @name PatchUserDashboardIdStatusStatus
         * @summary Update status through id
         * @request PATCH:/api/docpal/user/dashboard/{id}/status/{status}
         */
        patchUserDashboardIdStatusStatus: (id: number, status: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result>({
                path: `/api/docpal/user/dashboard/${id}/status/${status}`,
                method: "PATCH",
                ...params,
            }),

        /**
         * No description
         *
         * @tags VerificationPermissionController
         * @name GetVerificationPermissionBusinessBusinessid
         * @request GET:/api/verification/permission/business/{businessId}
         */
        getVerificationPermissionBusinessBusinessid: (businessId: string, params: RequestParams = {}) =>
            this.request<ResultObject, Result>({
                path: `/api/verification/permission/business/${businessId}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags VerificationPermissionController
         * @name GetVerificationPermissionAclPermissionDeprecate
         * @request GET:/api/verification/permission/acl/permission/
         */
        getVerificationPermissionAclPermissionDeprecate: (
            query: {
                docId: string;
                userId: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultObject, Result>({
                path: `/api/verification/permission/acl/permission/`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags VerificationPermissionController
         * @name GetVerificationPermissionAclPermission
         * @request GET:/api/verification/permission/acl/permission
         */
        getVerificationPermissionAclPermission: (
            query: {
                docId: string;
                userId: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultObject, Result>({
                path: `/api/verification/permission/acl/permission`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags AclUserPermissionController
         * @name GetUserPermissionId
         * @summary Query detail
         * @request GET:/api/user/permission/{id}
         */
        getUserPermissionId: (id: string, params: RequestParams = {}) =>
            this.request<ResultAclUserPermission, Result>({
                path: `/api/user/permission/${id}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags AclUserPermissionController
         * @name GetUserPermissionAllUserid
         * @summary Query all permission of acl user
         * @request GET:/api/user/permission/all/{userId}
         */
        getUserPermissionAllUserid: (userId: string, params: RequestParams = {}) =>
            this.request<ResultListAclPermissionDTO, Result>({
                path: `/api/user/permission/all/${userId}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags AclPermissionController
         * @name GetPermissionsId
         * @summary query access control permission by id
         * @request GET:/api/permissions/{id}
         */
        getPermissionsId: (id: string, params: RequestParams = {}) =>
            this.request<ResultAclPermissionDTO, Result>({
                path: `/api/permissions/${id}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags AclPermissionController
         * @name DeletePermissionsId
         * @summary delete access control permission by id
         * @request DELETE:/api/permissions/{id}
         */
        deletePermissionsId: (id: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result>({
                path: `/api/permissions/${id}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags AclPermissionController
         * @name GetPermissionsNameName
         * @summary Query permission list by name
         * @request GET:/api/permissions/name/{name}
         */
        getPermissionsNameName: (name: string, params: RequestParams = {}) =>
            this.request<ResultAclPermissionDTO, Result>({
                path: `/api/permissions/name/${name}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags AclPermissionController
         * @name DeletePermissionsNameName
         * @summary delete access control permission by name
         * @request DELETE:/api/permissions/name/{name}
         */
        deletePermissionsNameName: (name: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result>({
                path: `/api/permissions/name/${name}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags AclUserController
         * @name GetPermissionUsersId
         * @summary query user information
         * @request GET:/api/permission/users/{id}
         */
        getPermissionUsersId: (id: string, params: RequestParams = {}) =>
            this.request<ResultAclUserInformation, Result>({
                path: `/api/permission/users/${id}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags AclUserController
         * @name DeletePermissionUsersId
         * @summary delete user by logic
         * @request DELETE:/api/permission/users/{id}
         */
        deletePermissionUsersId: (id: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result>({
                path: `/api/permission/users/${id}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags AclUserRelationshipController
         * @name GetPermissionUserRelationshipsGroupidGroupid
         * @summary query bind users
         * @request GET:/api/permission/user/relationships/groupId/{groupId}
         */
        getPermissionUserRelationshipsGroupidGroupid: (groupId: string, params: RequestParams = {}) =>
            this.request<ResultListAclUserRelationshipWithUserGroup, Result>({
                path: `/api/permission/user/relationships/groupId/${groupId}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags AclUserGroupController
         * @name GetPermissionUserGroupId
         * @summary Query user group information
         * @request GET:/api/permission/user/group/{id}
         */
        getPermissionUserGroupId: (id: string, params: RequestParams = {}) =>
            this.request<ResultAclUserGroup, Result>({
                path: `/api/permission/user/group/${id}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags AclUserGroupController
         * @name DeletePermissionUserGroupId
         * @summary Remove user group
         * @request DELETE:/api/permission/user/group/{id}
         */
        deletePermissionUserGroupId: (id: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result>({
                path: `/api/permission/user/group/${id}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags AclUserGroupController
         * @name GetPermissionUserGroupGroupidUsers
         * @summary Query user list of binding in user group
         * @request GET:/api/permission/user/group/{groupId}/users
         */
        getPermissionUserGroupGroupidUsers: (groupId: string, params: RequestParams = {}) =>
            this.request<ResultAclUserGroupDTO, Result>({
                path: `/api/permission/user/group/${groupId}/users`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags AclUserGroupController
         * @name GetPermissionUserGroupGroupsAll
         * @request GET:/api/permission/user/group/groups/all
         */
        getPermissionUserGroupGroupsAll: (
            query: {
                userIds: string[];
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultObject, Result>({
                path: `/api/permission/user/group/groups/all`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags AclUserGroupController
         * @name GetPermissionUserGroupAll
         * @request GET:/api/permission/user/group/all
         */
        getPermissionUserGroupAll: (
            query: {
                userId: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultObject, Result>({
                path: `/api/permission/user/group/all`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags AclEntryController
         * @name GetPermissionEntryId
         * @summary Query entry by id
         * @request GET:/api/permission/entry/{id}
         */
        getPermissionEntryId: (id: string, params: RequestParams = {}) =>
            this.request<ResultAccessControlEntry, Result>({
                path: `/api/permission/entry/${id}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags AclEntryController
         * @name DeletePermissionEntryId
         * @summary Delete entry by id
         * @request DELETE:/api/permission/entry/{id}
         */
        deletePermissionEntryId: (id: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result>({
                path: `/api/permission/entry/${id}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name GetWorkflowJobQueryStartCreatorListDeprecate
         * @request GET:/api/docpal/workflow/job/query_start_creator_list/
         */
        getWorkflowJobQueryStartCreatorListDeprecate: (params: RequestParams = {}) =>
            this.request<ResultListString, Result>({
                path: `/api/docpal/workflow/job/query_start_creator_list/`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name GetWorkflowJobQueryStartCreatorList
         * @request GET:/api/docpal/workflow/job/query_start_creator_list
         */
        getWorkflowJobQueryStartCreatorList: (params: RequestParams = {}) =>
            this.request<ResultListString, Result>({
                path: `/api/docpal/workflow/job/query_start_creator_list`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name GetWorkflowJobQueryApproverListDeprecate
         * @request GET:/api/docpal/workflow/job/query_approver_list/
         */
        getWorkflowJobQueryApproverListDeprecate: (params: RequestParams = {}) =>
            this.request<ResultListString, Result>({
                path: `/api/docpal/workflow/job/query_approver_list/`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name GetWorkflowJobQueryApproverList
         * @request GET:/api/docpal/workflow/job/query_approver_list
         */
        getWorkflowJobQueryApproverList: (params: RequestParams = {}) =>
            this.request<ResultListString, Result>({
                path: `/api/docpal/workflow/job/query_approver_list`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags user-controller
         * @name GetUserMembers
         * @request GET:/api/docpal/user/members
         */
        getUserMembers: (
            query: {
                userId: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultObject, Result>({
                path: `/api/docpal/user/members`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags UserDashboardController
         * @name GetUserDashboardId
         * @summary Obtain a dashboard detail
         * @request GET:/api/docpal/user/dashboard/{id}
         */
        getUserDashboardId: (id: number, params: RequestParams = {}) =>
            this.request<ResultUserDashboard, Result>({
                path: `/api/docpal/user/dashboard/${id}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags UserDashboardController
         * @name DeleteUserDashboardId
         * @summary Delete through id
         * @request DELETE:/api/docpal/user/dashboard/{id}
         */
        deleteUserDashboardId: (id: number, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result>({
                path: `/api/docpal/user/dashboard/${id}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags UserDashboardController
         * @name GetPluginsId
         * @summary Obtain a plugin detail
         * @request GET:/api/docpal/plugins/{id}
         */
        getPluginsId: (id: number, params: RequestParams = {}) =>
            this.request<ResultPlugin, Result>({
                path: `/api/docpal/plugins/${id}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags UserDashboardController
         * @name DeletePluginsId
         * @summary Delete plugin through id
         * @request DELETE:/api/docpal/plugins/{id}
         */
        deletePluginsId: (id: number, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result>({
                path: `/api/docpal/plugins/${id}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags ocr-statistical-controller
         * @name GetOcrConditionsDeprecate
         * @request GET:/api/docpal/ocr/conditions/
         */
        getOcrConditionsDeprecate: (params: RequestParams = {}) =>
            this.request<ResultListConditionResponseDTO, Result>({
                path: `/api/docpal/ocr/conditions/`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags ocr-statistical-controller
         * @name GetOcrConditions
         * @request GET:/api/docpal/ocr/conditions
         */
        getOcrConditions: (params: RequestParams = {}) =>
            this.request<ResultListConditionResponseDTO, Result>({
                path: `/api/docpal/ocr/conditions`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalEmailController
         * @name GetEmailTemplateList
         * @request GET:/api/docpal/email/template/list
         */
        getEmailTemplateList: (params: RequestParams = {}) =>
            this.request<ResultListDocPalEmailTemplate, Result>({
                path: `/api/docpal/email/template/list`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags azure-ocr-controller
         * @name GetAzureOcrQueryazureocrsetting
         * @request GET:/api/docpal/azure/ocr/queryAzureOcrSetting
         */
        getAzureOcrQueryazureocrsetting: (params: RequestParams = {}) =>
            this.request<ResultAzureOcrSettingDTO, Result>({
                path: `/api/docpal/azure/ocr/queryAzureOcrSetting`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags azure-ocr-controller
         * @name GetAzureOcrQueryazureocrsettingDeprecate
         * @request GET:/api/docpal/azure/ocr/queryAzureOcrSetting/
         */
        getAzureOcrQueryazureocrsettingDeprecate: (params: RequestParams = {}) =>
            this.request<ResultAzureOcrSettingDTO, Result>({
                path: `/api/docpal/azure/ocr/queryAzureOcrSetting/`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags AclUserPermissionController
         * @name DeleteUserPermissionBusinessBusinessidUserUseridAcesAces
         * @summary Remove permission of business
         * @request DELETE:/api/user/permission/business/{businessId}/user/{userId}/aces/{aces}
         */
        deleteUserPermissionBusinessBusinessidUserUseridAcesAces: (
            businessId: string,
            userId: string,
            aces: string,
            params: RequestParams = {},
        ) =>
            this.request<ResultBoolean, Result>({
                path: `/api/user/permission/business/${businessId}/user/${userId}/aces/${aces}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocBlockPermissionController
         * @name DeleteBlockPermissionDocumentDocidPathDocpath
         * @summary Delete block permission
         * @request DELETE:/api/block/permission/document/{docId}/path/{docPath}
         */
        deleteBlockPermissionDocumentDocidPathDocpath: (docId: string, docPath: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result>({
                path: `/api/block/permission/document/${docId}/path/${docPath}`,
                method: "DELETE",
                ...params,
            }),
    };
}
