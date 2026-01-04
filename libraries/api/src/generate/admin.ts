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
    messageKey?: string;
    locale?: string;
}

export interface ResultString {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: string;
    messageKey?: string;
    locale?: string;
}

export interface ResultObject {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: object;
    messageKey?: string;
    locale?: string;
}

/** Additional role data transfer object */
export interface AdditionRoleDTO {
    /** Role ID */
    roleId?: string;
    /** Role name */
    roleName?: string;
}

/** Attribute rule data transfer object */
export interface AttributeRuleDTO {
    /**
     * Attribute type (1=User, 2=Document, 3=System)
     * @format int32
     */
    attributeType?: number;
    /** Attribute name */
    attributeName?: string;
    /** Operator (AND, OR, NOT) */
    operator?: string;
    /** Attribute value */
    attributeValue?: string;
}

/** Configuration rule data transfer object */
export interface ConfigurationRuleDTO {
    /** Rule ID */
    id?: string;
    /** Rule name */
    name?: string;
    /** List of members */
    members?: MemberDTO[];
    /** List of rules */
    rules?: RuleDTO[];
}

/** Group data transfer object */
export interface GroupDTO {
    /** Group ID */
    groupId?: string;
    /** Group name */
    groupName?: string;
}

/** Member data transfer object */
export interface MemberDTO {
    /**
     * Member type (1=User, 2=Role, 3=Group)
     * @format int32
     */
    memberType?: number;
    /** Member ID (user/role/group ID) */
    memberId?: string;
    /**
     * Operator (1=Include, 2=Exclude)
     * @format int32
     */
    operator?: number;
}

export interface ResultSetUserDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** @uniqueItems true */
    data?: UserDTO[];
    messageKey?: string;
    locale?: string;
}

/** Rule data transfer object */
export interface RuleDTO {
    /** Logical operator (AND, OR) */
    operator?: string;
    /** List of attribute rules */
    rules?: AttributeRuleDTO[];
}

/** User's role */
export interface SimpleRoleVO {
    /** Role ID */
    roleId?: string;
    /** Role name */
    roleName?: string;
}

/** User */
export interface UserDTO {
    /** Is user connected */
    isConnected?: boolean;
    /**
     * Token timeout time
     * @format int32
     */
    timeout?: number;
    /** User session ID */
    sessionId?: string;
    /** Username */
    username?: string;
    /** User ID */
    userId?: string;
    /** User ID */
    id?: string;
    /** First Name */
    firstName?: string;
    /** Last Name */
    lastName?: string;
    /** User Email */
    email?: string;
    /** MobilePhone */
    phone?: string;
    /** User Password */
    password?: string;
    /** Datetime token expired at */
    jwtExpiredAt?: string;
    /** User Properties */
    properties?: Record<string, object>;
    /** active status , A = active , D = unActive */
    status?: string;
    /** User groups */
    groupDTOList?: GroupDTO[];
    /** User groups */
    groups?: GroupDTO[];
    /** User detail data transfer object */
    aclUserDetail?: UserDetailDTO;
    /** User's role */
    role?: SimpleRoleVO;
    /** Department */
    department?: string;
    /** Department */
    company?: string;
    /** User Level */
    userLevel?: string;
    /** Registered */
    registered?: string;
    userName?: string;
    kcUserId?: string;
}

/** User detail data transfer object */
export interface UserDetailDTO {
    /** User ID */
    userId?: string;
    /** Primary role ID */
    roleId?: string;
    /** Primary role name */
    roleName?: string;
    /** List of groups the user belongs to */
    groups?: GroupDTO[];
    /** List of configuration rules */
    configurationRules?: ConfigurationRuleDTO[];
    /** List of additional roles */
    additionRoleList?: AdditionRoleDTO[];
}

export interface ResultListMapStringObject {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: Record<string, object>[];
    messageKey?: string;
    locale?: string;
}

export interface ContactAttribute {
    value?: string;
    name?: string;
    dataType?: string;
    required?: boolean;
    validationRule?: string;
}

export interface ContactGroupRequestDTO {
    /** Fuzzy Search Parameter */
    q?: string;
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
    id?: string;
    name?: string;
    status?: string;
    description?: string;
    permissions?: Record<string, Permission>;
    attributes?: ContactAttribute[];
    operator?: string;
    verifyReadPermission?: boolean;
    sort?: SortObject;
    sortOrModifiedDate?: SortObject;
    descSort?: SortObject;
    desc?: boolean;
    orderByValue?: string;
    /** @format int32 */
    pageIndex?: number;
}

export interface Permission {
    users?: string[];
    roles?: string[];
    groups?: string[];
}

export interface SortObject {
    sorted?: boolean;
    empty?: boolean;
    unsorted?: boolean;
}

export interface BasicField {
    dataType?: string;
    value?: string;
    name?: string;
}

export interface ContactGroupResponseDTO {
    id?: string;
    name?: string;
    status?: string;
    createdBy?: string;
    modifiedBy?: string;
    createdByName?: string;
    modifiedByName?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
    permissions?: Record<string, BasicField[]>;
    attributes?: ContactAttribute[];
    hasPermissions?: string[];
}

export interface ResultListContactGroupResponseDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: ContactGroupResponseDTO[];
    messageKey?: string;
    locale?: string;
}

/** Updated import job information */
export interface ExternalStorageImportJobDTO {
    /** Unique identifier for the import job */
    id?: string;
    /**
     * Type of the job
     * @example "import_job"
     */
    type?: string;
    /** Profile ID associated with the job */
    profileId?: string;
    /** Name of the file being imported */
    fileName?: string;
    /** Name of the profile */
    profileName?: string;
    /** Source of the import */
    source?: string;
    /** Batch ID for grouping related jobs */
    batchId?: string;
    /** Status of the import job */
    status?: string;
    /** @format int64 */
    queue_order?: number;
    /** Activity log in JSON format */
    activityLog?: Record<string, object>[];
    /**
     * Creation timestamp
     * @format date-time
     */
    createdDate?: string;
    /**
     * Last modification timestamp
     * @format date-time
     */
    modifiedDate?: string;
}

export interface ResultExternalStorageImportJobDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** Updated import job information */
    data?: ExternalStorageImportJobDTO;
    messageKey?: string;
    locale?: string;
}

export interface ResultContactGroupResponseDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: ContactGroupResponseDTO;
    messageKey?: string;
    locale?: string;
}

export interface ResultMapStringObject {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: Record<string, object>;
    messageKey?: string;
    locale?: string;
}

/** Virtual Folder Setting (Request) */
export interface VirtualFolderSettingRequestDTO {
    /** Virtual Folder ID */
    id?: string;
    /** Virtual Folder Setting in JSON format */
    jsonValue?: string;
    type?: string;
    user?: string;
    userAllowList?: string[];
    groupAllowList?: string[];
}

export interface ResultVirtualFolderSettingResponseDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: VirtualFolderSettingResponseDTO;
    messageKey?: string;
    locale?: string;
}

export interface VirtualFolderSettingResponseDTO {
    id?: string;
    jsonValue?: string;
    userAllowList?: string[];
    groupAllowList?: string[];
    virtualFolderName?: string;
}

/** External Storage Configuration */
export interface ExternalStorageDTO {
    /** Unique identifier for the external storage */
    id?: string;
    /** Name of the external storage */
    name?: string;
    /** Platform [WINDOW|LINUX] */
    platform?: string;
    /** Storage path or directory */
    path?: string;
    /** Status of the external storage (ACTIVE, INACTIVE, etc.) */
    status?: string;
    /** Type of storage (FILE, DATABASE, etc.) */
    type?: string;
    /** Event ID for storage operations */
    eventId?: string;
    /** Authentication credentials for the storage */
    credentials?: Record<string, object>;
    /** Type of connection (e.g., S3, FTP, SFTP, etc.) */
    connection_type?: string;
    /** Connection settings configuration */
    connection_settings?: Record<string, object>;
    /** Work group associated with the storage */
    work_group?: string;
    /** Extended data and metadata */
    extend_data?: Record<string, object>;
    /**
     * Creation timestamp of the external storage profile
     * @format date-time
     */
    created_date?: string;
    /**
     * Last modification timestamp of the external storage profile
     * @format date-time
     */
    modified_date?: string;
    /** User who created the external storage profile */
    created_by?: string;
    /** User who last modified the external storage profile */
    last_modify_by?: string;
}

export interface ResultExternalStorageDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** External Storage Configuration */
    data?: ExternalStorageDTO;
    messageKey?: string;
    locale?: string;
}

/** External Storage Profile Configuration */
export interface ExternalProfileDTO {
    /** Unique identifier for the external storage profile */
    id?: string;
    /** Name of the external storage profile */
    name?: string;
    /** Status of the external storage profile (ACTIVE, INACTIVE, etc.) */
    status?: string;
    /** External storage ID that this external storage profile belongs to */
    external_storage_id?: string;
    /** Profile type (e.g., READ_ONLY, READ_WRITE, ADMIN) of the external storage profile */
    profile_type?: string;
    /**
     * Creation timestamp of the external storage profile
     * @format date-time
     */
    created_date?: string;
    /**
     * Last modification timestamp of the external storage profile
     * @format date-time
     */
    modified_date?: string;
    /** User who created the external storage profile */
    created_by?: string;
    /** User who last modified the external storage profile */
    last_modify_by?: string;
    /** Event ID of the external storage profile */
    event_id?: string;
    /** Profile import setting */
    import_setting?: Record<string, object>;
    /** Profile Process setting */
    process_setting?: Record<string, object>;
    /** Batch Id Setting of the external storage profile */
    batch_id_setting?: Record<string, object>;
    /** Capture setting of the external storage profile */
    capture_setting?: Record<string, object>;
    /** Output Setting of External Storage Profile */
    output_settings?: Record<string, object>[];
}

export interface ResultExternalProfileDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** External Storage Profile Configuration */
    data?: ExternalProfileDTO;
    messageKey?: string;
    locale?: string;
}

/** Event Calendar Setting */
export interface EventCalendarSetting {
    /** Event calendar setting ID */
    id?: string;
    /** Event calendar setting name */
    name?: string;
    /** Event color code (hex format) */
    color?: string;
    /** Event status (A, D, R) */
    status?: string;
    /** Whether the event type is registered */
    registered?: boolean;
    /** Location configuration settings */
    location?: Record<string, object>;
    permission?: Permission;
    /** Workflow Configuration Settings */
    flows?: Workflows[];
    /** Background color for event display */
    backgroundColor?: string;
    /** Text color for event display */
    textColor?: string;
    /** Highlight color for event selection */
    highlightColor?: string;
    /**
     * Available seats for the event
     * @format int32
     */
    availableSeat?: number;
}

/** Workflow Configuration Settings */
export interface Workflows {
    /** Workflow Key */
    key?: string;
    /** Workflow Name */
    name?: string;
    /** Workflow Template Key */
    type?: string;
}

export interface ResultEventCalendarSetting {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** Event Calendar Setting */
    data?: EventCalendarSetting;
    messageKey?: string;
    locale?: string;
}

export interface WhatsAppSettingDTO {
    accessToken?: string;
    phoneNum?: string;
    accountNum?: string;
    whatsAppSwitch?: boolean;
}

export interface ResultVoid {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: object;
    messageKey?: string;
    locale?: string;
}

/** Validation Rule Request DTO */
export interface ValidationRuleRequestDTO {
    /** Validation Rule ID */
    id?: string;
    /** Draft ID */
    draftId: string;
    /**
     * Version number
     * @format int32
     */
    version: number;
    /** Node name */
    nodeName: string;
    /** JSON Schema validation rules */
    validationRules: object;
}

export interface ResultValidationRuleResponseDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** Validation Rule Response DTO */
    data?: ValidationRuleResponseDTO;
    messageKey?: string;
    locale?: string;
}

/** Validation Rule Response DTO */
export interface ValidationRuleResponseDTO {
    /** Validation Rule ID */
    id?: string;
    /** Draft ID */
    draftId?: string;
    /**
     * Version number
     * @format int32
     */
    version?: number;
    /** Node name */
    nodeName?: string;
    /** JSON Schema validation rules */
    validationRules?: object;
    /** Created by */
    createdBy?: string;
    /** Modified by */
    modifiedBy?: string;
    /**
     * Created date
     * @format date-time
     */
    createdDate?: string;
    /**
     * Modified date
     * @format date-time
     */
    modifiedDate?: string;
}

export interface ActiveUserRequestDTO {
    /** Id */
    id?: string;
    kcUserId?: string;
    /** User Id */
    userId?: string;
    /** User Name */
    username?: string;
    /** User First Name */
    firstName?: string;
    /** User Last Name */
    lastName?: string;
    /** User Email Address */
    email?: string;
    /** User Status */
    status?: string;
    /** Group Id List */
    groups?: GroupDTO[];
    /** User Properties */
    properties?: Record<string, object>;
}

export interface ResultUserDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** User */
    data?: UserDTO;
    messageKey?: string;
    locale?: string;
}

export interface FieldProfile {
    type?: string;
    label?: string;
    /** @format int32 */
    sort?: number;
    allowUserEdit?: boolean;
    display?: boolean;
    readyOnly?: boolean;
    rules?: Record<string, object>;
}

/** User Profile Setting */
export interface UserProfileSettingDTO {
    schema?: string;
    type?: string;
    properties?: Record<string, FieldProfile>;
}

export interface ResultUserProfileSettingDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** User Profile Setting */
    data?: UserProfileSettingDTO;
    messageKey?: string;
    locale?: string;
}

export interface EmailTemplate {
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

/** Email Template ResponseDTO */
export interface EmailTemplateResponseDTO {
    id?: string;
    /** @format int64 */
    emailLayoutId?: number;
    /** @format int64 */
    emailLayoutName?: number;
    emailTemplateJson?: string;
    emailTemplateVariable?: string;
    to?: string;
    label?: string;
    from?: string;
    cc?: string;
    bcc?: string;
    subject?: string;
    body?: string;
    status?: string;
    createdBy?: string;
    modifiedBy?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
    useMap?: Record<string, object>;
}

export interface ResultEmailTemplateResponseDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** Email Template ResponseDTO */
    data?: EmailTemplateResponseDTO;
    messageKey?: string;
    locale?: string;
}

export interface EmailLayout {
    /** @format int64 */
    id?: number;
    name?: string;
    layoutContent?: string;
    status?: string;
    createdBy?: string;
    /** @format date-time */
    createdDate?: string;
    modifiedBy?: string;
    /** @format date-time */
    modifiedDate?: string;
}

export interface ResultEmailLayout {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: EmailLayout;
    messageKey?: string;
    locale?: string;
}

/** Document Template RequestDTO */
export interface DocumentTemplateRequestDTO {
    /** Fuzzy Search Parameter */
    q?: string;
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
    /** id */
    id?: string;
    /** Document Template Name */
    name?: string;
    /** Nuxeo Document Id */
    documentId?: string;
    /** Document Template File Type */
    fileType?: string;
    /** Document Template Source */
    source?: string;
    /** Document Template Variable */
    templateVariable?: string;
    /** Document Template Description */
    description?: string;
    /** Document Template CreatedBy */
    createdBy?: string;
    /** Document Template ModifiedBy */
    modifiedBy?: string;
    /**
     * Document Template CreatedDate
     * @format date-time
     */
    createdDate?: string;
    /**
     * Document Template ModifiedDate
     * @format date-time
     */
    modifiedDate?: string;
    /** @format binary */
    file?: File;
    fileTypes?: string[];
    createdBys?: string[];
    variables?: Record<string, object>;
    sort?: SortObject;
    sortOrModifiedDate?: SortObject;
    descSort?: SortObject;
    desc?: boolean;
    orderByValue?: string;
    /** @format int32 */
    pageIndex?: number;
}

/** Document Template ResponseDTO */
export interface DocumentTemplateResponseDTO {
    /** id */
    id?: string;
    /** Document Template Name */
    name?: string;
    /** Nuxeo Document Id */
    documentId?: string;
    /** Document Template File Type */
    fileType?: string;
    /** Document Template Variable */
    templateVariable?: string;
    /** Document Template Description */
    description?: string;
    /** Document Template CreatedBy */
    createdBy?: string;
    /** Document Template ModifiedBy */
    modifiedBy?: string;
    /**
     * Document Template CreatedDate
     * @format date-time
     */
    createdDate?: string;
    /**
     * Document Template ModifiedDate
     * @format date-time
     */
    modifiedDate?: string;
}

export interface ResultDocumentTemplateResponseDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** Document Template ResponseDTO */
    data?: DocumentTemplateResponseDTO;
    messageKey?: string;
    locale?: string;
}

/** Identity (Request) */
export interface IdentityRequestDTO {
    /** Id */
    id?: string;
    /** Group Id */
    groupId?: string;
    /** Group Name */
    groupName?: string;
    /** User Id */
    userId?: string;
    /** User Name */
    username?: string;
    /** User First Name */
    firstName?: string;
    /** User Last Name */
    lastName?: string;
    /** User Email Address */
    email?: string;
    /** Phone */
    phone?: string;
    /** User Login Password */
    password?: string;
    /** Group Id List */
    groups?: string[];
    /** User Id List */
    users?: string[];
    /** User Properties */
    properties?: Record<string, object>;
    /** User Status */
    status?: string;
    /** @format int32 */
    pageNum?: number;
    /** @format int32 */
    pageSize?: number;
    userNameOrEmail?: string;
    userLevel?: string;
    registered?: string;
    orderBy?: string;
    isDesc?: boolean;
    groupList?: string[];
}

/** RetentionPolicy event */
export interface RetentionEvent {
    id?: string;
    policyRetentionId?: string;
    eventType?: string;
    eventLabel?: string;
    eventValue?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
}

/** Retention Policy RequestDTO */
export interface RetentionPolicyRequestDTO {
    /** Fuzzy Search Parameter */
    q?: string;
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
    /** RetentionPolicy ID */
    id?: string;
    /** the name of retention policy */
    policyName?: string;
    /** the status of retention policy */
    status?: string;
    /** Is Auto */
    isAuto?: boolean;
    /** the approval user */
    approvalId?: string;
    /**
     * the period number
     * @format int32
     */
    periodNum?: number;
    /** the period unit */
    periodUnit?: string;
    /** the action type */
    actionType?: string;
    /**
     * the action delay day
     * @format int32
     */
    actionDelayDay?: number;
    /** RetentionPolicy trigger list */
    triggers?: RetentionTrigger[];
    /** RetentionPolicy event */
    events?: RetentionEvent[];
    /** Document Type list */
    documentTypes?: string[];
    /** ApprovalId list */
    approvalIds?: string[];
    /** the list of retention policy id */
    ids?: string[];
    sort?: SortObject;
    sortOrModifiedDate?: SortObject;
    descSort?: SortObject;
    desc?: boolean;
    orderByValue?: string;
}

/** RetentionPolicy trigger list */
export interface RetentionTrigger {
    id?: string;
    policyRetentionId?: string;
    documentType?: string;
    triggerMetaData?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
}

export interface ResultRetentionPolicyResponseDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** Retention Policy ResponseDTO */
    data?: RetentionPolicyResponseDTO;
    messageKey?: string;
    locale?: string;
}

/** Retention Policy ResponseDTO */
export interface RetentionPolicyResponseDTO {
    /** RetentionPolicy ID */
    id?: string;
    /** the name of retention policy */
    policyName?: string;
    /** the status of retention policy */
    status?: string;
    /** Is Auto */
    isAuto?: boolean;
    /** the approval user */
    approvalId?: string;
    /**
     * the period number
     * @format int32
     */
    periodNum?: number;
    /** the period unit */
    periodUnit?: string;
    /** the action type */
    actionType?: string;
    /**
     * the action delay day
     * @format int32
     */
    actionDelayDay?: number;
    /** RetentionPolicy trigger list */
    triggers?: RetentionTrigger[];
    /** RetentionPolicy event */
    events?: RetentionEvent[];
}

export interface HoldPolicy {
    id?: string;
    policyName?: string;
    holdApprovalId?: string;
    removeApprovalId?: string;
    status?: string;
    createdBy?: string;
    modifiedBy?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
    holdAuto?: boolean;
    holdReasonReq?: boolean;
    removeAuto?: boolean;
    removeReasonReq?: boolean;
}

export interface ResultHoldPolicy {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: HoldPolicy;
    messageKey?: string;
    locale?: string;
}

export interface PersonalDashboardRequestDTO {
    /** Fuzzy Search Parameter */
    q?: string;
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
    /** @format int64 */
    id?: number;
    name?: string;
    groupId?: string;
    styleJson?: string;
    sort?: SortObject;
    sortOrModifiedDate?: SortObject;
    descSort?: SortObject;
    desc?: boolean;
    orderByValue?: string;
    /** @format int32 */
    pageIndex?: number;
}

export interface MasterTable {
    id?: string;
    name?: string;
    status?: string;
    tableName?: string;
    createdBy?: string;
    modifiedBy?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
}

export interface ResultBoolean {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: boolean;
    messageKey?: string;
    locale?: string;
}

/** Relation Record */
export interface MTRecordDTO {
    /** Table Id */
    tableId?: string;
    /** Record Id */
    recordId?: string;
    /** Record Data List */
    data?: Record<string, object>;
}

/** Master Table Record RequestDTO */
export interface MTRecordRequestDTO {
    /** Query Keyword Condition */
    q?: string;
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
    /** Master Table ID */
    id?: string;
    /** Master Table Name */
    name?: string;
    /** Master Table Status */
    status?: boolean;
    /** Record Data List */
    data?: Record<string, object>[];
    /** Where Condition */
    where?: Record<string, object>;
    /** In Condition */
    in?: Record<string, object>;
    /** Relation Record */
    relationRecords?: MTRecordDTO[];
    sort?: SortObject;
    sortOrModifiedDate?: SortObject;
    descSort?: SortObject;
    desc?: boolean;
    orderByValue?: string;
    /** @format int32 */
    pageIndex?: number;
}

export interface IdGenerationRuleItem {
    /** @format int32 */
    index?: number;
    expression?: string;
    type?: string;
    value?: string;
}

export interface IdTemplate {
    id?: string;
    name?: string;
    /** @format int32 */
    idDigit?: number;
    /** @format int32 */
    startNumber?: number;
    lastIdValue?: string;
    prefix?: IdGenerationRuleItem[];
    suffix?: IdGenerationRuleItem[];
    enabled?: boolean;
    createdBy?: string;
    modifiedBy?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
    createdByName?: string;
    modifiedByName?: string;
}

export interface ResultIdTemplate {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: IdTemplate;
    messageKey?: string;
    locale?: string;
}

export interface EasyFormResult {
    /** Action Item Id */
    id?: string;
    /** Action Type, Example value： Email、Workflow、CaseType  */
    actionType?: string;
    /** Bound business Key, Example value：customApproval */
    actionKey?: string;
    /** DeploymentId of Bound business, Example value：customApproval:1:7212b388-36f3-4aff-9b03-bc500537dd23 */
    actionId?: string;
    /** Name of Bound business */
    actionName?: string;
    /** Mapping data structure between form columns and bound business fields */
    dataMapping?: ParamMappingDTO[];
    /** Status, Active or Deactivated */
    status?: string;
    /** Email Subject */
    subject?: string;
    /** Email Body Text */
    text?: string;
    /** Email TO */
    to?: string;
    /** Email CC */
    cc?: string;
    /** Email BCC */
    bcc?: string;
}

/** Mapping data structure between form columns and bound business fields */
export interface ParamMappingDTO {
    source?: string;
    target?: string;
}

/** DAM setting. (Request) */
export interface DAMConversionSettingRequestDTO {
    /**
     * id
     * @format int64
     */
    id?: number;
    /** name */
    name?: string;
    /** sourceType */
    sourceType?: string;
    /** targetType */
    targetType?: string;
    /** label */
    label?: string;
    /** operation */
    operation?: string;
}

export interface Company {
    id?: string;
    code?: string;
    name?: string;
    phone?: string;
    email?: string;
    fax?: string;
    website?: string;
    type?: string;
    address?: string;
    logoUrl?: string;
    creditCode?: string;
    industry?: string;
    /** @format date-time */
    establishedDate?: string;
    legalPerson?: string;
    description?: string;
    scale?: string;
    /** @format int32 */
    employeeCount?: number;
    status?: string;
    createdBy?: string;
    /** @format date-time */
    createdDate?: string;
    modifiedBy?: string;
    /** @format date-time */
    modifiedDate?: string;
}

export interface ResultCompany {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: Company;
    messageKey?: string;
    locale?: string;
}

/** Company Chop (Request) */
export interface CompanyChopRequestDTO {
    /** Fuzzy Search Parameter */
    q?: string;
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
    /** ID */
    id?: string;
    /** Company Id */
    companyId?: string;
    /** Chop name */
    name?: string;
    /** mime_type */
    mimeType?: string;
    /** Permission- Role List */
    roles?: string[];
    /** Permission- User List */
    users?: string[];
    /** status */
    status?: string;
    /** @format binary */
    file?: File;
    sort?: SortObject;
    sortOrModifiedDate?: SortObject;
    descSort?: SortObject;
    desc?: boolean;
    orderByValue?: string;
    /** @format int32 */
    pageIndex?: number;
}

export interface CompanyChop {
    id?: string;
    companyId?: string;
    name?: string;
    fileId?: string;
    mimeType?: string;
    roles?: string;
    users?: string;
    status?: string;
    createdBy?: string;
    /** @format date-time */
    createdDate?: string;
    modifiedBy?: string;
    /** @format date-time */
    modifiedDate?: string;
}

export interface ResultCompanyChop {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: CompanyChop;
    messageKey?: string;
    locale?: string;
}

/** Case Table ResponseDTO */
export interface CaseTableResponseDTO {
    id?: string;
    caseTypeId?: string;
    label?: string;
    status?: string;
    createdBy?: string;
    modifiedBy?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
    fields?: MTColumnInfo[];
}

export interface CaseType {
    id?: string;
    name?: string;
    uniqueName?: string;
    caseIdPrefix?: string;
    /** @format int32 */
    caseIdDigit?: number;
    /** @format int32 */
    startNumber?: number;
    enable?: boolean;
    publishStatus?: string;
    /** Case Table ResponseDTO */
    primaryForm?: CaseTableResponseDTO;
    productionVersion?: string;
    createdBy?: string;
    modifiedBy?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
    caseDefinitionKey?: string;
    caseDefinitionId?: string;
    latestVersion?: string;
    latestVersionId?: string;
    productionVersionId?: string;
    tableName?: string;
    /** Case Table ResponseDTO */
    upPrimaryForm?: CaseTableResponseDTO;
}

export interface MTColumnInfo {
    columnName?: string;
    dataType?: string;
    /** @format int32 */
    length?: number;
    relationTable?: string;
    relationField?: string;
    displayField?: string;
    nullRelation?: boolean;
    /** @format int32 */
    sort?: number;
    primaryKey?: boolean;
    required?: boolean;
    unique?: boolean;
}

export interface ResultCaseType {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: CaseType;
    messageKey?: string;
    locale?: string;
}

/** Case model dashboard (RequestDTO) */
export interface CmmnDashboardRequestDTO {
    q?: string;
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
    id?: string;
    label?: string;
    caseTypeId?: string;
    /** Case definition version Id */
    cmmnVersionId?: string;
    /** @deprecated */
    userGroup?: string;
    permissions?: Record<string, string[]>;
    versionNumber?: string;
    styleJson?: string;
    /** Is need to detail */
    detail?: boolean;
    businessKey?: string;
    status?: string;
    /** Where Condition */
    where?: Record<string, object>;
    sort?: SortObject;
    sortOrModifiedDate?: SortObject;
    descSort?: SortObject;
    desc?: boolean;
    orderByValue?: string;
    /** @format int32 */
    pageIndex?: number;
}

/** Case model dashboard (RequestDTO) */
export interface CmmnDashboardResponseDTO {
    id?: string;
    caseTypeId?: string;
    deploymentId?: string;
    cmmnVersionId?: string;
    label?: string;
    /** @deprecated */
    userGroup?: string;
    status?: string;
    styleJson?: string;
    createdBy?: string;
    modifiedBy?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
    createdByName?: string;
    modifiedByName?: string;
    permissions?: BasicField[];
}

export interface ResultCmmnDashboardResponseDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** Case model dashboard (RequestDTO) */
    data?: CmmnDashboardResponseDTO;
    messageKey?: string;
    locale?: string;
}

/** Calendar (Request) */
export interface CalendarTaskReq {
    /** Task ID */
    taskId?: string;
    /** Task Description */
    title?: string;
    /** Operate User */
    operator?: string;
    /**
     * Start Time
     * @format date-time
     */
    startTime?: string;
    /**
     * End Time
     * @format date-time
     */
    endTime?: string;
    /** Task Category */
    category?: string;
    /** Task Assignee */
    assignee?: string;
    /** Task Location */
    location?: string;
    /**
     * Task Level
     * @format int32
     */
    level?: number;
    /** Task Status */
    status?: string;
    /** Task Remark */
    remark?: string;
    /** Business ID */
    bizId?: string;
    /** Fuzzy Search */
    q?: string;
    /** ID */
    id?: string;
    /** Event ID */
    eventId?: string;
    /** Event Name */
    eventName?: string;
    /** Event Description */
    eventDescription?: string;
    /** Action Type[Create/Edit/Cancel/Remove] */
    actionType?: string;
    /** Event all day */
    isAllDay?: boolean;
    /** Business Data */
    bizData?: Record<string, object>;
    /** Event Related User */
    relatedUsers?: Record<string, object>;
    /** Event Related Case */
    relatedCases?: Record<string, object>;
    /** Event Related Workflow */
    relatedWorkflows?: Record<string, object>;
    /** Reminder Providers */
    reminders?: Record<string, object>[];
    /** Where AND Condition */
    where?: Record<string, object>;
    users?: string[];
    processKeys?: string[];
    caseKeys?: string[];
}

/** Calendar Task ResponseDTO */
export interface CalendarTaskRespDTO {
    /** ID */
    id?: string;
    /** Event ID */
    eventId?: string;
    /** Event Name */
    eventName?: string;
    /** Event Description */
    eventDescription?: string;
    /** Action Type */
    actionType?: string;
    /** Event all day */
    isAllDay?: boolean;
    /** Event Related Users */
    relatedUsers?: Record<string, object>;
    /** Event Related Case */
    relatedCases?: Record<string, object>;
    /** Event Related Workflow */
    relatedWorkflows?: Record<string, object>;
    taskId?: string;
    title?: string;
    location?: string;
    /** @format date-time */
    startTime?: string;
    /** @format date-time */
    endTime?: string;
    bizId?: string;
    category?: string;
    assignee?: string;
    status?: string;
    /** @format int32 */
    level?: number;
    remark?: string;
    createdBy?: string;
    /** @format date-time */
    createdDate?: string;
    modifiedBy?: string;
    /** @format date-time */
    modifiedDate?: string;
    assigneeName?: string;
    reminders?: TaskReminder[];
}

export interface EmailReminder {
    emailTemplateId?: string;
    receiverType?: string;
    from?: string;
    to?: string;
    cc?: string;
    bcc?: string;
    variables?: Record<string, object>;
}

export interface ResultCalendarTaskRespDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** Calendar Task ResponseDTO */
    data?: CalendarTaskRespDTO;
    messageKey?: string;
    locale?: string;
}

export interface TaskReminder {
    id?: string;
    taskId?: string;
    reminderType?: string;
    /** @format int32 */
    intervalTime?: number;
    reminderJson?: string;
    createdBy?: string;
    /** @format date-time */
    createdDate?: string;
    modifiedBy?: string;
    /** @format date-time */
    modifiedDate?: string;
    emailReminder?: EmailReminder;
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

export interface ProfileMappingRequestDTO {
    /** @format int64 */
    id?: number;
    name?: string;
    scanProfile?: string;
    normalizeSetting?: string;
    status?: string;
}

export interface AzureOcrApiKeyDTO {
    apiKey?: string;
    description?: string;
}

export interface RoleRequest {
    id?: string;
    name?: string;
    grade?: string;
    /** @format int32 */
    status?: number;
    /** @format int32 */
    type?: number;
    parentId?: string;
    additionUsers?: string[];
}

/** Resource permission data transfer object */
export interface ResourcePermissionDTO {
    /** Permission ID */
    id?: string;
    /** Resource ID (e.g., document ID) */
    resourceId?: string;
    /**
     * Resource type (1=Document)
     * @format int32
     */
    resourceType?: number;
    /**
     * Target type (1=User, 2=Role, 3=Group, 4=User Set)
     * @format int32
     */
    targetType?: number;
    /** Target ID (user/role/group/user set ID) */
    targetId?: string;
    /**
     * Permission level (1=Read, 2=ReadWrite, 3=Manage, 4=Custom, 5=Config)
     * @format int32
     */
    permissionLevel?: number;
    /** List of permission IDs (used when permissionLevel=4/5) */
    permissionIds?: number[];
    /** Configuration rule name */
    configurationRuleName?: string;
    /** List of members */
    members?: MemberDTO[];
    /** List of rules */
    rules?: RuleDTO[];
    /**
     * Create time
     * @format date-time
     */
    createTime?: string;
    /**
     * Update time
     * @format date-time
     */
    updateTime?: string;
}

export interface ResourcePermissionRequest {
    id?: string;
    resourceId?: string;
    /** @format int32 */
    resourceType?: number;
    /** @format int32 */
    targetType?: number;
    targetId?: string;
    /** @format int32 */
    permissionLevel?: number;
    permissionIds?: string[];
    configurationRuleName?: string;
    members?: MemberDTO[];
    rules?: RuleDTO[];
}

/** Resource permission view object */
export interface ResourcePermissionVO {
    /** Permission ID */
    id?: string;
    /** Resource ID (e.g., document ID) */
    resourceId?: string;
    /**
     * Resource type (1=Document, 2=Folder)
     * @format int32
     */
    resourceType?: number;
    /**
     * Target type (1=User, 2=Role, 3=Group, 4=User Set)
     * @format int32
     */
    targetType?: number;
    /** Target ID (user/role/group/user set ID) */
    targetId?: string;
    /**
     * Permission level (1=Read, 2=ReadWrite, 3=Manage, 4=Custom, 5=Config)
     * @format int32
     */
    permissionLevel?: number;
    /** List of permission IDs (used when permissionLevel=4/5) */
    permissionIds?: number[];
    /** Configuration rule name */
    configurationRuleName?: string;
    /** List of members */
    members?: MemberDTO[];
    /** List of rules */
    rules?: RuleDTO[];
    /**
     * Create time
     * @format date-time
     */
    createTime?: string;
    /**
     * Update time
     * @format date-time
     */
    updateTime?: string;
    /** Whether the permission is inherited */
    isInherit?: boolean;
    /** Inherited from which resource */
    inheritFrom?: string;
    /** Target name (user/role/group name) */
    targetName?: string;
    /** Inheritance path */
    inheritFromPath?: string;
    /** Whether copy inherit is enabled */
    isEnableCopyInherit?: boolean;
}

export interface ResultResourcePermissionVO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** Resource permission view object */
    data?: ResourcePermissionVO;
    messageKey?: string;
    locale?: string;
}

export interface ResultResourcePermissionDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** Resource permission data transfer object */
    data?: ResourcePermissionDTO;
    messageKey?: string;
    locale?: string;
}

export interface WorkflowInstanceDTO {
    processDefinitionKey?: string;
    creator?: string;
    messageName?: string;
    businessKey?: string;
    instanceId?: string;
    startTime?: string;
    state?: string;
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
    dateFormatVariables?: string[];
}

export interface WorkflowInstanceRequest {
    currWorkflowInstance?: WorkflowInstanceDTO;
    nextWorkflowInstance?: WorkflowInstanceDTO;
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

export interface ResultListBasicField {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: BasicField[];
    messageKey?: string;
    locale?: string;
}

export interface ResultListContactAttribute {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: ContactAttribute[];
    messageKey?: string;
    locale?: string;
}

export interface ContactRequestDTO {
    /** Fuzzy Search Parameter */
    q?: string;
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
    id?: string;
    groupId?: string;
    email?: string;
    name?: string;
    status?: string;
    customData?: Record<string, object>;
    operator?: string;
    sort?: SortObject;
    sortOrModifiedDate?: SortObject;
    descSort?: SortObject;
    desc?: boolean;
    orderByValue?: string;
    /** @format int32 */
    pageIndex?: number;
}

export interface PaginationDTOMapStringObject {
    entryList?: Record<string, object>[];
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

export interface ResultPaginationDTOMapStringObject {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTOMapStringObject;
    messageKey?: string;
    locale?: string;
}

export interface ContactImportRequestDTO {
    groupId?: string;
    /** @format binary */
    file?: File;
    columns?: string;
    dataMapping?: Record<string, string>;
    replace?: boolean;
    operator?: string;
}

/** Import ResponseDTO */
export interface ImportResponseDTO {
    /** @format int32 */
    totalRecords?: number;
    /** @format int32 */
    successCount?: number;
    /** @format int32 */
    failureCount?: number;
    status?: string;
}

export interface ResultImportResponseDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** Import ResponseDTO */
    data?: ImportResponseDTO;
    messageKey?: string;
    locale?: string;
}

export interface ResultMapStringInteger {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: Record<string, number>;
    messageKey?: string;
    locale?: string;
}

export interface PaginationDTOContactGroupResponseDTO {
    entryList?: ContactGroupResponseDTO[];
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

export interface ResultPaginationDTOContactGroupResponseDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTOContactGroupResponseDTO;
    messageKey?: string;
    locale?: string;
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

export interface PasswordConfigDTO {
    /**
     * @format int32
     * @min 8
     * @max 24
     */
    minPasswordLength?: number;
    containLowerAndUppercase?: boolean;
    containNumericDigits?: boolean;
    containSpecialCharacters?: boolean;
    forceResetPassword?: boolean;
    enableExpirationTime?: boolean;
    /**
     * @format int32
     * @min 1
     * @max 2147483647
     */
    expirationDay?: number;
    enableLockoutPolicy?: boolean;
    /**
     * @format int32
     * @min 1
     * @max 255
     */
    retryPeriod?: number;
    /**
     * @format int32
     * @min 1
     * @max 2147483647
     */
    lockoutPeriod?: number;
    /**
     * @format int32
     * @min 1
     * @max 255
     */
    lockoutCount?: number;
    enableReusePasswordLimit?: boolean;
    /**
     * @format int32
     * @min 0
     * @max 10
     */
    reusePasswordCount?: number;
}

/** EasyShare (Request) */
export interface SharePageRequestDTO {
    /**
     * page
     * @format int32
     */
    page?: number;
    /**
     * size
     * @format int32
     */
    size?: number;
    /** orderByAsc */
    orderByAsc?: string;
    /** orderByDesc */
    orderByDesc?: string;
    /** searchKey */
    searchKey?: string;
}

export interface ResultMapObjectObject {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: Record<string, object>;
    messageKey?: string;
    locale?: string;
}

/** SmartFolder RequestDTO */
export interface SmartFolderRequestDTO {
    /** Fuzzy Search Parameter */
    q?: string;
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
    id?: string;
    name?: string;
    bind?: string;
    json_value?: string;
    userGroupIds?: string[];
    sort?: SortObject;
    sortOrModifiedDate?: SortObject;
    descSort?: SortObject;
    desc?: boolean;
    orderByValue?: string;
    /** @format int32 */
    pageIndex?: number;
}

export interface PaginationDTOSmartFolderResponseDTO {
    entryList?: SmartFolderResponseDTO[];
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

export interface ResultPaginationDTOSmartFolderResponseDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTOSmartFolderResponseDTO;
    messageKey?: string;
    locale?: string;
}

/** Smart Folder */
export interface SmartFolderResponseDTO {
    id?: string;
    name?: string;
    bind?: string;
    json_value?: string;
    userGroups?: string[];
}

/** Versioning (Request) */
export interface VersioningRequestDTO {
    /** Document ID or Path */
    idOrPath?: string;
    /** Version Number */
    versionNum?: string;
    /** Increment */
    increment?: string;
}

/** Document */
export interface DocumentDTO {
    /** Document ID */
    id?: string;
    /** Document Name */
    name?: string;
    /** Document Description */
    description?: string;
    /** Document Path */
    path?: string;
    /** Document Type */
    type?: string;
    /** Document Version */
    version?: string;
    /**
     * Document Status
     * @format int32
     */
    status?: number;
    statusName?: string;
    /** Document Creator */
    createdBy?: string;
    /** Document Modifier */
    modifiedBy?: string;
    /**
     * Document Created Date
     * @format date-time
     */
    createdDate?: string;
    /**
     * Document Modification Date
     * @format date-time
     */
    modifiedDate?: string;
    /** Is Document Folder */
    isFolder?: boolean;
    /** Is Document Checked Out */
    isCheckedOut?: boolean;
    /** Document Properties */
    properties?: Record<string, object>;
    /** Document File Content */
    fileContent?: FileContentDTO;
    /** parentRef */
    parentRef?: string;
    /** logicalPath */
    logicalPath?: string;
    auditComment?: string;
    auditName?: string;
    /** Permission Name */
    permissionName?: string[];
    /** Contributors */
    contributors?: string[];
    /** File Suffix */
    fileSuffix?: string;
    /** OCR State */
    ocrState?: string;
    /** ID of Document Folder Cabinet */
    dfcId?: string;
    permissionIds?: number[];
    comeFrom?: string;
    drivePreviewLink?: string;
    originalPath?: string;
    fileContentName?: string;
    fileContentMimeType?: string;
    /** @format int64 */
    fileContentLength?: number;
    fileContentMinioFileVersion?: string;
    fileContentDigestAlgorithm?: string;
    fileContentDigest?: string;
    fileContentData?: string;
    fileContentExtension?: string;
}

/** Document File Content */
export interface FileContentDTO {
    digestAlgorithm?: string;
    digest?: string;
    data?: string;
    name?: string;
    mime_type?: string;
    /** @format int64 */
    length?: number;
    minio_file_version?: string;
}

export interface ResultDocumentDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** Document */
    data?: DocumentDTO;
    messageKey?: string;
    locale?: string;
}

export interface ResultListUserDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: UserDTO[];
    messageKey?: string;
    locale?: string;
}

/** Batch delete users */
export interface BatchDeleteUserDTO {
    /** keycloak user ids */
    userIds?: string[];
}

/** Batch delete users */
export interface BatchAddUsersToGroupsDTO {
    /** keycloak user ids */
    userIds?: string[];
    /** groups ids */
    groupIds?: string[];
}

/** Batch add groups to user */
export interface UserBatchAddGroupsDTO {
    /** acl_user id */
    userId?: string;
    /** group ids */
    groupIds?: string[];
}

export interface ResultListGroupDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: GroupDTO[];
    messageKey?: string;
    locale?: string;
}

export interface ResultGroupDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** Group data transfer object */
    data?: GroupDTO;
    messageKey?: string;
    locale?: string;
}

/** Batch add users to group */
export interface GroupBatchAddUsersDTO {
    /** groupId */
    groupId?: string;
    /** keycloak user ids */
    userIds?: string[];
}

export interface ResultMapStringInstant {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: Record<string, string>;
    messageKey?: string;
    locale?: string;
}

/** Document (Request) */
export interface DocumentRequestDTO {
    /** Parent Document */
    parentDocPath?: string;
    /** Parent ID */
    parentId?: string;
    /** Document ID or Path */
    idOrPath?: string;
    /** Document Name */
    name?: string;
    /** Document Creator */
    creator?: string;
    /** Document Type */
    type?: string;
    /** Document File Suffix */
    fileSuffix?: string;
    /** Document Properties */
    properties?: Record<string, object>;
    /** Document Language */
    languages?: string[];
    mixinType?: string[];
    /**
     * Page Number
     * @format int32
     */
    pageNumber?: number;
    /**
     * Page Size
     * @format int32
     */
    pageSize?: number;
    /** File Type */
    fileType?: string;
    emailId?: string;
    /** FolderCabinet Template Id */
    templateId?: string;
    /** Every level folder cabinet template Id */
    layoutId?: string;
    /** The Id of document folder cabinet */
    dfcId?: string;
    oldDocPalType?: string;
    watermarkTemplateId?: string;
    version?: string;
    needMetadata?: boolean;
    title?: string;
    fileName?: string;
}

/** Open Observe Audit Log Search Request */
export interface OpenObserveAuditLogSearchRequest {
    documentId?: string;
    eventCategory?: string;
    eventId?: string;
    /** @format date-time */
    eventDateFrom?: string;
    /** @format date-time */
    eventDateTo?: string;
    orderBy?: string;
    /** @format int32 */
    pageNum?: number;
    /** @format int32 */
    pageSize?: number;
    principalName?: string;
    path?: string;
    masterTables?: string[];
    userIds?: string[];
    isDesc?: boolean;
}

export interface AuditTemplateResponseExtendDTO {
    /** @format int64 */
    id?: number;
    label?: string;
    eventId?: string;
    nuxeoEventId?: string;
    documentId?: string;
    comment?: string;
    docPath?: string;
    docType?: string;
    eventType?: string;
    eventCategory?: string;
    /** @format date-time */
    eventDate?: string;
    envetDateStr?: string;
    principalName?: string;
    extended?: Record<string, object>;
    currentPath?: string;
    logicalPath?: string;
}

export interface PaginationDTOAuditTemplateResponseExtendDTO {
    entryList?: AuditTemplateResponseExtendDTO[];
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

export interface ResultPaginationDTOAuditTemplateResponseExtendDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTOAuditTemplateResponseExtendDTO;
    messageKey?: string;
    locale?: string;
}

/** Create office file request body */
export interface OfficeFileCreateDTO {
    path?: string;
    fileName?: string;
    /** @format int32 */
    fileType?: number;
    documentType?: string;
    metaData?: string;
}

/** Document (Request) */
export interface DocStructureRequestDTO {
    /** Document ID or Path */
    documentPath?: string;
    /** Document Name */
    documentName?: string;
    /** Document Creator */
    creator?: string;
    /** DocPal Type */
    docPalType?: string;
    /** Is Folder */
    isFolder?: boolean;
    /** File Type */
    fileType?: string;
    /** Document Properties */
    properties?: Record<string, object>;
    /** Document Language */
    languages?: string[];
    /** Sub-Document List */
    subDocuments?: DocStructureRequestDTO[];
}

/** Document (Request) */
export interface DocStructureResponseDTO {
    documentParentId?: string;
    /** Document ID or Path */
    documentPath?: string;
    /** Document Name */
    documentName?: string;
    /** Document Creator */
    creator?: string;
    /** DocPal Type */
    docPalType?: string;
    /** Is Folder */
    isFolder?: boolean;
    /** File Type */
    fileType?: string;
    /** Document Properties */
    properties?: Record<string, object>;
    /** Document Language */
    languages?: string[];
    /** Sub-Document List */
    subDocuments?: DocStructureResponseDTO[];
}

export interface ResultDocStructureResponseDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** Document (Request) */
    data?: DocStructureResponseDTO;
    messageKey?: string;
    locale?: string;
}

export interface ResultListDocumentDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: DocumentDTO[];
    messageKey?: string;
    locale?: string;
}

/** Document */
export interface DocumentThumbnailDTO {
    /** Document ID */
    id?: string;
    /** Document Name */
    name?: string;
    /** Document Path */
    path?: string;
    /** Is Document Folder */
    isFolder?: boolean;
    /** Document lastModified */
    modifiedDate?: string;
    /** Document Modifier */
    modifiedBy?: string;
    /** Document create date */
    createdDate?: string;
    /** Document source modified date */
    fileModifiedDate?: string;
    /**
     * Document content size
     * @format double
     */
    fileSize?: number;
    source?: string;
    uploadId?: string;
    mimeType?: string;
    documentType?: string;
    docPalType?: string;
    /** @format int32 */
    status?: number;
    statusName?: string;
    contributors?: string[];
    tags?: string[];
    version?: string;
    collections?: Record<string, string>[];
    permissionIds?: number[];
    holdDocument?: HoldDocument;
    retentionDocument?: RetentionDocument;
    comeFrom?: string;
    drivePreviewLink?: string;
    originalPath?: string;
}

export interface HoldDocument {
    id?: string;
    policyHoldId?: string;
    documentId?: string;
    documentName?: string;
    documentPath?: string;
    applyBy?: string;
    /** @format date-time */
    applyDate?: string;
    applyReason?: string;
    applyApprovedBy?: string;
    /** @format date-time */
    applyApprovedDate?: string;
    applyProcessInstanceId?: string;
    removeBy?: string;
    /** @format date-time */
    removeDate?: string;
    removeReason?: string;
    removeApprovedBy?: string;
    /** @format date-time */
    removeApprovedDate?: string;
    removeProcessInstanceId?: string;
    status?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
    policyHoldName?: string;
    valid?: boolean;
}

export interface PaginationDTODocumentThumbnailDTO {
    entryList?: DocumentThumbnailDTO[];
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

export interface ResultPaginationDTODocumentThumbnailDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTODocumentThumbnailDTO;
    messageKey?: string;
    locale?: string;
}

export interface RetentionDocument {
    id?: string;
    policyRetentionId?: string;
    documentId?: string;
    documentName?: string;
    documentPath?: string;
    applyBy?: string;
    /** @format date-time */
    applyDate?: string;
    applyApprovedBy?: string;
    /** @format date-time */
    applyApprovedDate?: string;
    applyProcessInstanceId?: string;
    removeBy?: string;
    /** @format date-time */
    removeDate?: string;
    /** @format date-time */
    expireDate?: string;
    status?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
    policyName?: string;
    approver?: string;
}

export interface ResultListVirtualFolderSettingResponseDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: VirtualFolderSettingResponseDTO[];
    messageKey?: string;
    locale?: string;
}

export interface SystemSetting {
    /** @format int64 */
    id?: number;
    name?: string;
    systemId?: string;
    systemIdType?: string;
    jsonValue?: string;
}

export interface FeatureSaveRequestDTO {
    tenantId?: string;
    featuresMap?: Record<string, Record<string, boolean>>;
}

export interface ResultMapStringMapStringBoolean {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: Record<string, Record<string, boolean>>;
    messageKey?: string;
    locale?: string;
}

export interface ActiveUserConfigDTO {
    tenantId?: string;
    activeUsersConfig?: Record<string, number>;
    /** @format int32 */
    concurrentSession?: number;
}

export interface BusinessResultRecord {
    /** @format int64 */
    id?: number;
    messageId?: string;
    idOrPath?: string;
    userId?: string;
    businessId?: string;
    fileName?: string;
    filePath?: string;
    /** @format int64 */
    fileSize?: number;
    logicalPath?: string;
    category?: "OCR" | "PDF" | "CONVERSION" | "DAM" | "OTHER" | "EXTRACT";
    status: "CREATE" | "PENDING" | "COMPLETED" | "FINISH" | "ERROR" | "PENDING_FOR_SENDING_MESSAGE";
    operation?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    lastUpdateDate?: string;
    /** @format date-time */
    startDate?: string;
    /** @format date-time */
    endDate?: string;
    errorCode?: string;
    errorMsg?: string;
    /** @format int64 */
    reSubmitCount?: number;
}

export interface PageBusinessResultRecord {
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
    content?: BusinessResultRecord[];
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

export interface ResultPageBusinessResultRecord {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PageBusinessResultRecord;
    messageKey?: string;
    locale?: string;
}

/** External Storage Import Job Request */
export interface ExternalStorageImportJobRequestDTO {
    /** Fuzzy Search Parameter */
    q?: string;
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
    /** Profile ID filter */
    id?: string;
    /** Profile ID filter */
    profileId?: string;
    /** File name filter */
    fileName?: string;
    /** Profile name filter */
    profileName?: string;
    /** Source filter */
    source?: string;
    /** Batch ID filter */
    batchId?: string;
    /** Status filter */
    status?: string;
    /** Start date for filtering */
    startDate?: string;
    /** End date for filtering */
    endDate?: string;
    sort?: SortObject;
    sortOrModifiedDate?: SortObject;
    descSort?: SortObject;
    desc?: boolean;
    orderByValue?: string;
    /** @format int32 */
    pageIndex?: number;
}

export interface PaginationDTOExternalStorageImportJobDTO {
    entryList?: ExternalStorageImportJobDTO[];
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

export interface ResultPaginationDTOExternalStorageImportJobDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTOExternalStorageImportJobDTO;
    messageKey?: string;
    locale?: string;
}

/** External Storage Profile Configuration */
export interface ExternalProfileRequestDTO {
    /** Fuzzy Search Parameter */
    q?: string;
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
    /** Unique identifier for the external storage profile */
    id?: string;
    /** Name of the external storage profile */
    name?: string;
    /** Status of the external storage profile (ACTIVE, INACTIVE, etc.) */
    status?: string;
    sort?: SortObject;
    sortOrModifiedDate?: SortObject;
    descSort?: SortObject;
    desc?: boolean;
    orderByValue?: string;
    /** @format int32 */
    pageIndex?: number;
    /** External storage ID that this external storage profile belongs to */
    external_storage_id?: string;
    /** Profile type (e.g., READ_ONLY, READ_WRITE, ADMIN) of the external storage profile */
    profile_type?: string;
    /**
     * Creation timestamp of the external storage profile
     * @format date-time
     */
    created_date?: string;
    /**
     * Last modification timestamp of the external storage profile
     * @format date-time
     */
    modified_date?: string;
    /** User who created the external storage profile */
    created_by?: string;
    /** User who last modified the external storage profile */
    last_modify_by?: string;
    /** Event ID of the external storage profile */
    event_id?: string;
    /** Profile import setting */
    import_setting?: Record<string, object>;
    /** Profile Process setting */
    process_setting?: Record<string, object>;
    /** Batch Id Setting of the external storage profile */
    batch_id_setting?: Record<string, object>;
    /** Capture setting of the external storage profile */
    capture_setting?: Record<string, object>;
    /** Output Setting of External Storage Profile */
    output_setting?: Record<string, object>;
}

export interface PaginationDTOExternalProfileDTO {
    entryList?: ExternalProfileDTO[];
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

export interface ResultPaginationDTOExternalProfileDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTOExternalProfileDTO;
    messageKey?: string;
    locale?: string;
}

/** External Storage Request DTO */
export interface ExternalStorageRequestDTO {
    /** Fuzzy Search Parameter */
    q?: string;
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
    /** Unique identifier for the external storage */
    id?: string;
    /** Name of the external storage */
    name?: string;
    /** Storage path or directory */
    path?: string;
    /** Platform [WINDOW|LINUX] */
    platform?: string;
    /** Status of the external storage (ACTIVE, INACTIVE, etc.) */
    status?: string;
    /** Authentication credentials for the storage */
    credentials?: Record<string, object>;
    sort?: SortObject;
    sortOrModifiedDate?: SortObject;
    descSort?: SortObject;
    desc?: boolean;
    orderByValue?: string;
    /** @format int32 */
    pageIndex?: number;
    /** Type of connection (e.g., S3, FTP, SFTP, etc.) */
    connection_type?: string;
    /** Connection settings configuration */
    connection_settings?: Record<string, object>;
    /** Work group associated with the storage */
    work_group?: string;
    /** Extended data and metadata */
    extend_data?: Record<string, object>;
}

export interface PaginationDTOExternalStorageDTO {
    entryList?: ExternalStorageDTO[];
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

export interface ResultPaginationDTOExternalStorageDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTOExternalStorageDTO;
    messageKey?: string;
    locale?: string;
}

export interface BasePageRequest {
    /** Fuzzy Search Parameter */
    q?: string;
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
    sort?: SortObject;
    sortOrModifiedDate?: SortObject;
    descSort?: SortObject;
    desc?: boolean;
    orderByValue?: string;
    /** @format int32 */
    pageIndex?: number;
}

export interface PaginationDTOEventCalendarSetting {
    entryList?: EventCalendarSetting[];
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

export interface ResultPaginationDTOEventCalendarSetting {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTOEventCalendarSetting;
    messageKey?: string;
    locale?: string;
}

export interface DocPalTypeMetadata {
    id?: string;
    docpalTypeId?: string;
    schemaName?: string;
    metadata?: string;
    metaDataType?: string;
    dataType?: string;
    display?: boolean;
    options?: string;
    isRequire?: boolean;
    status?: string;
    createdBy?: string;
    modifiedBy?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
    docPalType?: string;
}

/** DocPalType (RequestDTO) */
export interface DocPalTypeRequestDTO {
    /** Fuzzy Search Parameter */
    q?: string;
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
    id?: string;
    name?: string;
    category?: string;
    dataType?: string;
    enable?: boolean;
    metadata?: DocPalTypeMetadata[];
    types?: string[];
    categories?: string[];
    createBys?: string[];
    metadataFieldMap?: Record<string, object>;
    sort?: SortObject;
    sortOrModifiedDate?: SortObject;
    descSort?: SortObject;
    desc?: boolean;
    orderByValue?: string;
    /** @format int32 */
    pageIndex?: number;
}

export interface DocPalTypeResponseDTO {
    id?: string;
    name?: string;
    category?: string;
    dataType?: string;
    enable?: boolean;
    createdBy?: string;
    modifiedBy?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
    metadata?: DocPalTypeMetadata[];
}

export interface ResultDocPalTypeResponseDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: DocPalTypeResponseDTO;
    messageKey?: string;
    locale?: string;
}

export interface DocPalType {
    id?: string;
    name?: string;
    category?: string;
    dataType?: string;
    enable?: boolean;
    createdBy?: string;
    modifiedBy?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
}

export interface PaginationDTODocPalType {
    entryList?: DocPalType[];
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

export interface ResultPaginationDTODocPalType {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTODocPalType;
    messageKey?: string;
    locale?: string;
}

export interface DocPalTypeRelated {
    id?: string;
    docPalTypeId?: string;
    rootDocPalType?: string;
    metaData?: string;
    docPalType?: string;
}

export interface ResultDocPalTypeRelated {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: DocPalTypeRelated;
    messageKey?: string;
    locale?: string;
}

export interface QueryMetadataRequestDTO {
    /** Fuzzy Search Parameter */
    q?: string;
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
    metadataName?: string;
    docpalTypeName?: string;
    sort?: SortObject;
    sortOrModifiedDate?: SortObject;
    descSort?: SortObject;
    desc?: boolean;
    orderByValue?: string;
    /** @format int32 */
    pageIndex?: number;
}

export type BooleanValidation = MetadataValidation;

export type CaseValidation = MetadataValidation;

export type DateValidation = MetadataValidation & {
    dateOrDateTime?: string;
    format?: string;
    defaultValue?: string;
};

export type DocumentValidation = MetadataValidation;

export type MasterTableValidation = MetadataValidation & {
    masterTableName?: string;
    displayColumn?: string;
    valueColumn?: string;
};

export interface MetadataMaskRuleDTO {
    maskType?: string;
    /** @format int32 */
    maskLength?: number;
}

export interface MetadataResponseVO {
    name?: string;
    dataType?: string;
    createdBy?: string;
    lastModifiedDate?: string;
    id?: string;
    display?: boolean;
    validationRule?:
        | BooleanValidation
        | CaseValidation
        | DateValidation
        | DocumentValidation
        | MasterTableValidation
        | NumberValidation
        | SelectValidation
        | TextValidation
        | UserRoleUserGroupValidation
        | UserValidation
        | WorkflowValidation;
    maskRule?: MetadataMaskRuleDTO;
}

export interface MetadataValidation {
    validationRuleName?: string;
    isMultiple?: boolean;
}

export type NumberValidation = MetadataValidation & {
    /** @format int32 */
    minimum?: number;
    /** @format int32 */
    maximum?: number;
    multipleOf?: number;
};

export interface PaginationDTOMetadataResponseVO {
    entryList?: MetadataResponseVO[];
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

export interface ResultPaginationDTOMetadataResponseVO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTOMetadataResponseVO;
    messageKey?: string;
    locale?: string;
}

export type SelectValidation = MetadataValidation & {
    options?: string[];
};

export type TextValidation = MetadataValidation & {
    /** @format int32 */
    maxLength?: number;
};

export type UserRoleUserGroupValidation = MetadataValidation & {
    allow?: string;
};

export type UserValidation = MetadataValidation;

export type WorkflowValidation = MetadataValidation;

export interface MetaDataDefinitionRequestDTO {
    id?: string;
    docpalType?: string;
    name?: string;
    validationRule?:
        | BooleanValidation
        | CaseValidation
        | DateValidation
        | DocumentValidation
        | MasterTableValidation
        | NumberValidation
        | SelectValidation
        | TextValidation
        | UserRoleUserGroupValidation
        | UserValidation
        | WorkflowValidation;
    maskRule?: MetadataMaskRuleDTO;
    langs?: {
        empty?: boolean;
        [key: string]: any;
    };
}

export interface DocpalTypeRequestV2DTO {
    id?: string;
    name?: string;
    category?: string;
    isFolder?: boolean;
    status?: string;
    langs?: {
        empty?: boolean;
        [key: string]: any;
    };
    metadataFields?: Record<string, object>[];
    permission?: Permission;
}

export interface AddMetadataRequestDTO {
    docType?: string;
    name?: string;
    display?: boolean;
    metaDataDefinition?: MetaDataDefinitionRequestDTO;
    metadataId?: string;
    metadataPermissionRule?: MetadataPermissionRuleDTO;
    metadataPermission?: MetadataPermissionDTO;
}

export interface MetadataPermissionCondition {
    attribute?: string;
    condition?: string;
    value?: string;
}

export interface MetadataPermissionDTO {
    hiddenPermissions?: MetadataPermissionRuleDTO[];
    maskPermissions?: MetadataPermissionRuleDTO[];
    readOnlyPermissions?: MetadataPermissionRuleDTO[];
    createdDate?: string;
    lastModifiedDate?: string;
}

export interface MetadataPermissionRuleDTO {
    name?: string;
    conditions?: MetadataPermissionCondition[];
}

export interface DocumentTypeResponseVO {
    name?: string;
    isFolder?: string;
    category?: string;
    active?: string;
    createdBy?: string;
    lastModifiedDate?: string;
    id?: string;
    langs?: string;
    metadatas?: MetadataResponseVO[];
}

export interface PaginationDTODocumentTypeResponseVO {
    entryList?: DocumentTypeResponseVO[];
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

export interface ResultPaginationDTODocumentTypeResponseVO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTODocumentTypeResponseVO;
    messageKey?: string;
    locale?: string;
}

export interface MoveMetadataRequestDTO {
    docpalTypeId?: string;
    metadataId?: string;
    /** @format int32 */
    moveIndex?: number;
}

export interface DocpalTypeDetailResponseVO {
    docpalTypeName?: string;
    category?: string;
    isFolder?: string;
    langs?: Record<string, object>;
    permission?: Permission;
    metadataList?: DocpalTypeMetadataResponseVO[];
}

export interface DocpalTypeMetadataResponseVO {
    id?: string;
    name?: string;
    dataType?: string;
    display?: boolean;
    lastModifiedDate?: string;
    metadataPermission?: MetadataPermissionDTO;
}

export interface ResultDocpalTypeDetailResponseVO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: DocpalTypeDetailResponseVO;
    messageKey?: string;
    locale?: string;
}

/** DocPalType (RequestDTO) */
export interface DocPalTypeMetadataRequestDTO {
    docType?: string;
    metaData?: string;
    dataType?: string;
    display?: boolean;
    options?: string;
    isRequire?: boolean;
    status?: string;
}

export interface ProcessDefinitionDraftRequestDTO {
    /** Process Definition Draft ID */
    draftId?: string;
    /** Whether draft */
    isDraft?: boolean;
    /** Process Definition Draft Key */
    key?: string;
    /** Process Definition Draft Name */
    name?: string;
    /** Process Definition Draft Status */
    status?: string;
    /** Publish Status of process definition */
    publishStatus?: string;
    /** Process Definition Name Space */
    nameSpace?: string;
    /** Process Definition Json */
    jsonValue?: string;
    /** @format binary */
    file?: File;
    /** Email Template List */
    templateIds?: string[];
    /** Folder Cabinet Setting ID */
    folderCabinetSettingId?: string;
    /**  Permissions [Start Or View] */
    permissions?: Record<string, string>[];
    /** Process Definition Version Id */
    versionId?: string;
    /** Process Definition Version Number */
    versionNumber?: string;
}

export interface BizPermissionDTO {
    id?: string;
    permissionId?: string;
    permissionName?: string;
    licensee?: string;
}

/** Process Definition ResponseDTO */
export interface ProcessDefinitionResponseDTO {
    /** Process Definition ID */
    id?: string;
    /** Process Definition Draft ID */
    draftId?: string;
    /** Process Definition Name */
    name?: string;
    /** Process Definition Key */
    key?: string;
    /** Process Definition Status */
    status?: string;
    /** Publish Status of process definition */
    publishStatus?: string;
    "Latest Version"?: string;
    "Latest Version Id"?: string;
    "Production Version"?: string;
    /** Process Definition Target Name Space */
    nameSpace?: string;
    /** Process Definition ID */
    processDefinitionId?: string;
    /** Process Definition is draft */
    isDraft?: boolean;
    /** Folder Cabinet Setting ID */
    folderCabinetSettingId?: string;
    permissions?: BizPermissionDTO[];
    /** @format int32 */
    deployVersion?: number;
}

export interface ResultProcessDefinitionResponseDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** Process Definition ResponseDTO */
    data?: ProcessDefinitionResponseDTO;
    messageKey?: string;
    locale?: string;
}

/** Process Definition Version RequestDTO */
export interface ProcessVersionRequestDTO {
    /** Fuzzy Search Parameter */
    q?: string;
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
    id?: string;
    draftId?: string;
    versionNumber?: string;
    jsonValue?: string;
    /** @format binary */
    file?: File;
    name?: string;
    publishStatus?: string;
    operator?: string;
    sort?: SortObject;
    sortOrModifiedDate?: SortObject;
    descSort?: SortObject;
    desc?: boolean;
    orderByValue?: string;
    /** @format int32 */
    pageIndex?: number;
}

export interface PaginationDTOProcessDefinitionVersion {
    entryList?: ProcessDefinitionVersion[];
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

export interface ProcessDefinitionVersion {
    id?: string;
    draftId?: string;
    versionNumber?: string;
    productionVersion?: string;
    source?: string;
    publishStatus?: string;
    isProduction?: string;
    processDefinitionId?: string;
    processDefinitionKey?: string;
    bytes?: string[];
    jsonValue?: string;
    createdBy?: string;
    modifiedBy?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
}

export interface ResultPaginationDTOProcessDefinitionVersion {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTOProcessDefinitionVersion;
    messageKey?: string;
    locale?: string;
}

export interface ResultProcessDefinitionVersion {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: ProcessDefinitionVersion;
    messageKey?: string;
    locale?: string;
}

export interface DocumentTypeMetadataMapping {
    /** @format int64 */
    id?: number;
    name?: string;
    metaDataMapper?: string;
    /** @format int32 */
    version?: number;
    createUserId?: string;
    createUserName?: string;
    /** @format date-time */
    createTime?: string;
    updateUserId?: string;
    updateUserName?: string;
    /** @format date-time */
    updateTime?: string;
}

/** Workflow (Request) */
export interface WorkflowRequestDTO {
    /** Version ID */
    versionId?: string;
    /** Deployment ID */
    deploymentId?: string;
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
    /** Process Instance Name */
    processDefinitionName?: string;
    /** Process Instance Id */
    processInstanceId?: string;
    /** creator */
    creator?: string;
    /** User ID */
    userId?: string;
    /** Task Name */
    taskName?: string;
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
    /** process Category List */
    categories?: string[];
    /** Groups */
    groups?: string[];
    /** Form Properties */
    properties?: Record<string, string>;
    /** Variables */
    variables?: Record<string, object>;
    /** Display Columns For Show Extract Variables, frontend haven't used it yet */
    displayColumns?: string[];
    /** Form Attachments */
    attachments?: Record<string, string>;
    /** Activity ID */
    activityId?: string;
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
    /** createdDate */
    createdDate?: string[];
    /** Task Due Date */
    dueDates?: string[];
    involvedUser?: string;
    assignedUser?: string;
    candidateUser?: string;
    candidateOrAssigned?: string;
    interrelatedUserId?: string;
    /** @uniqueItems true */
    orderList?: string[];
    /**
     * Page Index
     * @deprecated
     * @format int32
     */
    pageIndex?: number;
}

/** Process Instance */
export interface InstanceDTO {
    /** Execution Id */
    id?: string;
    /** Activity Id */
    activityId?: string;
    /** Business Key */
    businessKey?: string;
    /** Calllback Id */
    callbackId?: string;
    /** Callback Type */
    callbackType?: string;
    /** Deployment Id */
    deploymentId?: string;
    /** Description */
    description?: string;
    /** Localized Description */
    localizedDescription?: string;
    /** Localized Name */
    localizedName?: string;
    /** Name */
    name?: string;
    /** Parent Id */
    parentId?: string;
    /** Process Definition Id */
    processDefinitionId?: string;
    /** Process Definition Key */
    processDefinitionKey?: string;
    /** Process Definition Name */
    processDefinitionName?: string;
    /**
     * Process Definition Version
     * @format int32
     */
    processDefinitionVersion?: number;
    /** Process Instance Id */
    processInstanceId?: string;
    /** Process Variables */
    processVariables?: Record<string, object>;
    /** Propagated Stage Instance Id */
    propagatedStageInstanceId?: string;
    /** Reference Id */
    referenceId?: string;
    /** Reference Type */
    referenceType?: string;
    /** Root Process Instance Id */
    rootProcessInstanceId?: string;
    /** Super Execution Id */
    superExecutionId?: string;
    /**
     * Start Time
     * @format date-time
     */
    startTime?: string;
    /** Start User Id */
    startUserId?: string;
    /** Tenant Id */
    tenantId?: string;
    /** Is Ended */
    isEnded?: boolean;
    /** Is Suspended */
    isSuspended?: boolean;
}

export interface ResultListTaskDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: TaskDTO[];
    messageKey?: string;
    locale?: string;
}

/** Task */
export interface TaskDTO {
    /** Task ID */
    id?: string;
    /** Task Name */
    name?: string;
    /** Task Description */
    description?: string;
    /** Task Definition ID */
    taskDefinitionId?: string;
    /** Process Definition Version ID */
    processDefinitionVersionId?: string;
    /** Task Definition Key */
    taskDefinitionKey?: string;
    /** Task Assignee */
    assignee?: string;
    /** Task Form Key */
    formKey?: string;
    /** Task Instance ID */
    instanceId?: string;
    /** Task Parent ID */
    parentId?: string;
    /**
     * Task Creation Date
     * @format date-time
     */
    createDate?: string;
    /**
     * Task Due Date
     * @format date-time
     */
    dueDate?: string;
    /**
     * Task Claim Date
     * @format date-time
     */
    claimDate?: string;
    /** Process Instance */
    taskInstance?: InstanceDTO;
    businessKey?: string;
    processDefinitionName?: string;
    startUserId?: string;
    createDateStr?: string;
    dueDateStr?: string;
    variables?: Record<string, object>;
}

export interface PaginationDTOTaskDTO {
    entryList?: TaskDTO[];
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

export interface ResultPaginationDTOTaskDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTOTaskDTO;
    messageKey?: string;
    locale?: string;
}

export interface ResultTaskDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** Task */
    data?: TaskDTO;
    messageKey?: string;
    locale?: string;
}

export interface DocPalDocumentType {
    /** @format int64 */
    id?: number;
    name?: string;
    metaDataMapper?: Record<string, string>;
}

export interface DocPalDocumentTypeMapping {
    documentType?: DocPalDocumentType[];
}

export interface ResultListDocumentTypeMetadataMapping {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: DocumentTypeMetadataMapping[];
    messageKey?: string;
    locale?: string;
}

export interface DocumentTypeProfileSettingRequest {
    /** @format int64 */
    id?: number;
    documentType?: string;
    profileID?: string;
    profileName?: string;
    rootPath?: string;
    folder?: Folder;
    /** @format int32 */
    version?: number;
    createUserId?: string;
    createUserName?: string;
    /** @format date-time */
    createTime?: string;
    updateUserId?: string;
    updateUserName?: string;
    /** @format date-time */
    updateTime?: string;
}

export interface Folder {
    name?: string;
    title?: string;
    folder?: Folder;
}

export interface DocumentTypeProfileSetting {
    /** @format int64 */
    id?: number;
    documentType?: string;
    profileID?: string;
    profileName?: string;
    rootPath?: string;
    folder?: string;
    /** @format int32 */
    version?: number;
    createUserId?: string;
    createUserName?: string;
    /** @format date-time */
    createTime?: string;
    updateUserId?: string;
    updateUserName?: string;
    /** @format date-time */
    updateTime?: string;
}

export interface ResultDocumentTypeProfileSetting {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: DocumentTypeProfileSetting;
    messageKey?: string;
    locale?: string;
}

export interface WorkflowRetryManagerDTO {
    /** @format int64 */
    id?: number;
    /** @format int32 */
    tryCount?: number;
    creator?: string;
    groupId?: string;
    messageName?: string;
    businessKey?: string;
    startTime?: string;
    state?: string;
}

export interface QueryWorkflowJobRequest {
    /** Fuzzy Search Parameter */
    q?: string;
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
    state?: string;
    businessKey?: string;
    sort?: SortObject;
    sortOrModifiedDate?: SortObject;
    descSort?: SortObject;
    desc?: boolean;
    orderByValue?: string;
    /** @format int32 */
    pageIndex?: number;
}

export interface PaginationDTOWorkflowRetryManagerDTO {
    entryList?: WorkflowRetryManagerDTO[];
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

export interface ResultPaginationDTOWorkflowRetryManagerDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTOWorkflowRetryManagerDTO;
    messageKey?: string;
    locale?: string;
}

/** Form Property */
export interface FormPropertyDTO {
    /** Property Key */
    id?: string;
    /** Property Name */
    name?: string;
    /** Property Type */
    type?: string;
    /** Property Value */
    value?: string;
    /** Is Property Readable */
    readable?: boolean;
    /** Is Property Required */
    required?: boolean;
    /** Is Property Writable */
    writable?: boolean;
    /** Enum Options */
    options?: Record<string, string>;
    /**
     * time
     * @format date-time
     */
    time?: string;
}

export interface ResultListFormPropertyDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: FormPropertyDTO[];
    messageKey?: string;
    locale?: string;
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
    messageKey?: string;
    locale?: string;
}

export interface ResultListInstanceDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: InstanceDTO[];
    messageKey?: string;
    locale?: string;
}

export interface ProcessDefinitionDraft {
    id?: string;
    key?: string;
    name?: string;
    status?: string;
    publishStatus?: string;
    latestVersion?: string;
    productionVersion?: string;
    bytes?: string[];
    jsonValue?: string;
    startFormProperties?: string;
    createdBy?: string;
    modifiedBy?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
    folderCabinetSettingId?: string;
    latestVersionId?: string;
    productionVersionId?: string;
}

/** Workflow Process Definition RequestDTO */
export interface ProcessDefinitionRequestDTO {
    /** Fuzzy Search Parameter */
    q?: string;
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
    /** Process Definition ID */
    id?: string;
    /** Process Definition Key */
    key?: string;
    /** Process Definition Name */
    name?: string;
    /** DeploymentId of Process Definition */
    deploymentId?: string;
    /** Process Definition Status */
    status?: string;
    /** publish Status */
    publishStatus?: string;
    /** Process categories */
    categories?: string[];
    sort?: SortObject;
    sortOrModifiedDate?: SortObject;
    descSort?: SortObject;
    desc?: boolean;
    orderByValue?: string;
    /** @format int32 */
    pageIndex?: number;
}

export interface PaginationDTOProcessDefinitionDraft {
    entryList?: ProcessDefinitionDraft[];
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

export interface ResultPaginationDTOProcessDefinitionDraft {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTOProcessDefinitionDraft;
    messageKey?: string;
    locale?: string;
}

export interface WorkflowDraftRequestDTO {
    /** Process Definition Draft ID */
    draftId?: string;
    /** Whether draft */
    isDraft?: boolean;
    /** Process Definition Draft Key */
    key?: string;
    /** Process Definition Draft Name */
    name?: string;
    /** Process Definition Draft Status */
    status?: string;
    /** Publish Status of process definition */
    publishStatus?: string;
    /** Process Definition Name Space */
    nameSpace?: string;
    /** Process Definition Json */
    jsonValue?: string;
    /** @format binary */
    file?: File;
    /** Email Template List */
    templateIds?: string[];
    /** Folder Cabinet Setting ID */
    folderCabinetSettingId?: string;
    /**  Permissions [Start Or View] */
    permissions?: Record<string, string>[];
    /** Process Definition Version Id */
    versionId?: string;
    /** Process Definition Version Number */
    versionNumber?: string;
    /** Process Definition Operator */
    operator?: string;
}

export interface ConditionValidationReq {
    processDefinitionKey?: string;
    processInstanceId?: string;
    validationData?: Record<string, object>;
    conditionRules?: Record<string, string>[][];
}

export interface PaginationDTOWhatsAppLogDTO {
    entryList?: WhatsAppLogDTO[];
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

export interface ResultWhatsAppOverviewResponse {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: WhatsAppOverviewResponse;
    messageKey?: string;
    locale?: string;
}

export interface WhatsAppLogDTO {
    id?: string;
    status?: string;
    responseMessage?: string;
    /** @format date-time */
    createdDate?: string;
}

export interface WhatsAppOverviewResponse {
    whatsAppSetting?: WhatsAppSettingDTO;
    responseTime?: string;
    successPercent?: string;
    status?: string;
    whatsAppLogDTOPage?: PaginationDTOWhatsAppLogDTO;
}

export interface ResultPaginationDTOWhatsAppLogDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTOWhatsAppLogDTO;
    messageKey?: string;
    locale?: string;
}

export interface Font {
    /**
     * @format int32
     * @min 1
     * @max 144
     */
    size?: number;
    color?: string;
    name?: string;
}

export interface Offset {
    /** @format float */
    x?: number;
    /** @format float */
    y?: number;
}

export interface WMKTemplateRequestDTO {
    id?: string;
    name: string;
    enabled?: boolean;
    createdBy?: string;
    modifiedBy?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
    watermarkSettings?: WatermarkSettingsDTO[];
}

export interface WatermarkSettingsDTO {
    id?: string;
    /** @format int32 */
    order?: number;
    name?: string;
    type?: string;
    content?: string;
    contentType?: string;
    position?: string;
    offset?: Offset;
    centerOffset?: Offset;
    /** @format int32 */
    rotate?: number;
    scale?: string;
    font?: Font;
    /** @format float */
    opacity?: number;
    templateId?: string;
    enabled?: boolean;
    createdBy?: string;
    modifiedBy?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
    data?: string;
}

export interface ResultWMKTemplateRequestDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: WMKTemplateRequestDTO;
    messageKey?: string;
    locale?: string;
}

export interface PageWatermarkSettingsTemplate {
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
    content?: WatermarkSettingsTemplate[];
    sort?: SortObject;
    first?: boolean;
    last?: boolean;
    pageable?: PageableObject;
    empty?: boolean;
}

export interface ResultPageWatermarkSettingsTemplate {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PageWatermarkSettingsTemplate;
    messageKey?: string;
    locale?: string;
}

export interface WatermarkSettingsTemplate {
    id?: string;
    name?: string;
    enabled?: boolean;
    createdBy?: string;
    modifiedBy?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
}

export interface ResultWatermarkSettingsDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: WatermarkSettingsDTO;
    messageKey?: string;
    locale?: string;
}

/** User batch active params */
export interface UserBatchActiveDTO {
    /** acl_user ids */
    ids?: string[];
    /** keycloak user ids */
    userIds?: string[];
    /** active A/D */
    active?: string;
}

/** Email Template RequestDTO */
export interface EmailTemplateRequestDTO {
    /** Fuzzy Search Parameter */
    q?: string;
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
    /** Email Template ID */
    id?: string;
    /** The status of Email Template */
    status?: string;
    /** The email subject or name */
    subject?: string;
    /** The email template label */
    label?: string;
    /**
     * Email Layout ID
     * @format int64
     */
    emailLayoutId?: number;
    /** Email Template JSON */
    emailTemplateJson?: string;
    /** Email Template Variable */
    emailTemplateVariable?: string;
    /** The email recipient's key */
    to?: string;
    from?: string;
    /** The email cc's key */
    cc?: string;
    /** The email bcc's key */
    bcc?: string;
    /** The email main body */
    body?: string;
    /** Email Template Created By */
    createdBy?: string;
    /** Email Template Modified By */
    modifiedBy?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
    /** Email Layout ID List */
    emailLayoutIds?: number[];
    name?: string;
    sort?: SortObject;
    sortOrModifiedDate?: SortObject;
    descSort?: SortObject;
    desc?: boolean;
    orderByValue?: string;
    /** @format int32 */
    pageIndex?: number;
}

export interface PaginationDTOEmailTemplate {
    entryList?: EmailTemplate[];
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

export interface ResultPaginationDTOEmailTemplate {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTOEmailTemplate;
    messageKey?: string;
    locale?: string;
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

export interface ResultSendEmailResponseDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: SendEmailResponseDTO;
    messageKey?: string;
    locale?: string;
}

export interface SendEmailResponseDTO {
    /** @format int64 */
    emailLogId?: number;
    successSendEmail?: boolean;
}

/** Email Layout RequestDTO */
export interface EmailLayoutRequestDTO {
    /** Fuzzy Search Parameter */
    q?: string;
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
    /**
     * Email Layout ID
     * @format int64
     */
    id?: number;
    /** Email Layout Name */
    name?: string;
    /** The status of Email Layout */
    status?: string;
    /** Email Layout Layout Content */
    layoutContent?: string;
    /** Email Layout Created By */
    createdBy?: string;
    /** Email Layout Modified By */
    modifiedBy?: string;
    sort?: SortObject;
    sortOrModifiedDate?: SortObject;
    descSort?: SortObject;
    desc?: boolean;
    orderByValue?: string;
    /** @format int32 */
    pageIndex?: number;
}

export interface PaginationDTOEmailLayout {
    entryList?: EmailLayout[];
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

export interface ResultPaginationDTOEmailLayout {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTOEmailLayout;
    messageKey?: string;
    locale?: string;
}

export interface DocumentTemplate {
    id?: string;
    name?: string;
    documentId?: string;
    fileType?: string;
    source?: string;
    templateVariable?: string;
    description?: string;
    createdBy?: string;
    modifiedBy?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
}

export interface PaginationDTODocumentTemplate {
    entryList?: DocumentTemplate[];
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

export interface ResultPaginationDTODocumentTemplate {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTODocumentTemplate;
    messageKey?: string;
    locale?: string;
}

export interface LanguageEntity {
    /** @format int64 */
    id?: number;
    locale?: string;
    languageKey?: string;
    languageContent?: string;
}

export interface ResultLanguageEntity {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: LanguageEntity;
    messageKey?: string;
    locale?: string;
}

export interface FormPropertiesRelation {
    /** @format int64 */
    id?: number;
    processKey?: string;
    userTaskId?: string;
    jsonValue?: string;
    versionId?: string;
}

export interface ErrorEnumEntity {
    /** @format int64 */
    id?: number;
    language?: string;
    /** @format int32 */
    errorCode?: number;
    errorMessage?: string;
    createUserId?: string;
    createUserName?: string;
    /** @format date-time */
    createTime?: string;
    updateUserId?: string;
    updateUserName?: string;
    /** @format date-time */
    updateTime?: string;
}

export interface ErrorEnumEntityDTO {
    /** @format int64 */
    id?: number;
    language?: string;
    /** @format int32 */
    errorCode?: number;
    errorMessage?: string;
    createUserId?: string;
    createUserName?: string;
    /** @format date-time */
    createTime?: string;
    updateUserId?: string;
    updateUserName?: string;
    /** @format date-time */
    updateTime?: string;
    /** @format int32 */
    pageNum?: number;
    /** @format int32 */
    pageSize?: number;
    entity?: ErrorEnumEntity;
}

export interface PaginationDTORetentionPolicy {
    entryList?: RetentionPolicy[];
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

export interface ResultPaginationDTORetentionPolicy {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTORetentionPolicy;
    messageKey?: string;
    locale?: string;
}

export interface RetentionPolicy {
    id?: string;
    policyName?: string;
    isAuto?: boolean;
    approvalId?: string;
    /** @format int32 */
    periodNum?: number;
    periodUnit?: string;
    actionType?: string;
    /** @format int32 */
    actionDelayDay?: number;
    status?: string;
    lastModifiedBy?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
    /** @uniqueItems true */
    triggers?: RetentionTrigger[];
    /** @uniqueItems true */
    events?: RetentionEvent[];
}

/** HoldPolicy RequestDTO */
export interface HoldPolicyRequestDTO {
    /** Fuzzy Search Parameter */
    q?: string;
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
    /** HoldPolicy ID */
    id?: string;
    /** HoldPolicy name */
    policyName?: string;
    /** HoldPolicy status */
    status?: string;
    sort?: SortObject;
    sortOrModifiedDate?: SortObject;
    descSort?: SortObject;
    desc?: boolean;
    orderByValue?: string;
}

export interface PaginationDTOHoldPolicy {
    entryList?: HoldPolicy[];
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

export interface ResultPaginationDTOHoldPolicy {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTOHoldPolicy;
    messageKey?: string;
    locale?: string;
}

export interface PaginationDTOPersonalDashboard {
    entryList?: PersonalDashboard[];
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

export interface PersonalDashboard {
    /** @format int64 */
    id?: number;
    name?: string;
    creator?: string;
    editor?: string;
    groupId?: string;
    styleJson?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
}

export interface ResultPaginationDTOPersonalDashboard {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTOPersonalDashboard;
    messageKey?: string;
    locale?: string;
}

export interface ResultPersonalDashboard {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PersonalDashboard;
    messageKey?: string;
    locale?: string;
}

export interface OAuth2SettingRequestDTO {
    clientId: string;
    clientSecret: string;
    tenantId?: string;
    redirectUri: string;
    authenticationMethod: "DEFAULT" | "MICROSOFT_OFFICE_365" | "GOOGLE";
    senderAddress?: string;
    /** @format date-time */
    expireTime?: string;
    userId?: string;
    code?: string;
    state?: string;
    scope?: string;
}

/** GrpcMetadataResp */
export interface GrpcMetadataResp {
    id?: string;
    name?: string;
    remark?: string;
    status?: string;
    type?: string;
    group?: string[];
    langs?: Record<string, object>;
    _rev?: string;
    business_type?: string;
    business_type_property?: Record<string, object>;
    data_type?: string;
    create_by?: string;
    /** @format date-time */
    create_date?: string;
    last_modify_by?: string;
    /** @format date-time */
    modify_date?: string;
}

export interface ResultGrpcMetadataResp {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** GrpcMetadataResp */
    data?: GrpcMetadataResp;
    messageKey?: string;
    locale?: string;
}

export interface NotificationSetting {
    /** @format int64 */
    id?: number;
    type?: "SUB_DOCUMENT" | "SUBSCRIPTION";
    moduleName?: string;
    description?: string;
    funcPoint?: string;
    pointEnable?: boolean;
    templateId?: string;
    scope?: string;
    realm?: string;
    createdBy?: string;
    modifiedBy?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
}

export interface SubNotificationRequest {
    action?:
        | "DOCUMENT_CREATE"
        | "DOCUMENT_MODIFY"
        | "DOCUMENT_REPLACE"
        | "DOCUMENT_TRASH"
        | "DOCUMENT_DELETE"
        | "DOCUMENT_COMMENT_ADD"
        | "DOCUMENT_FORMAT_CONVERT"
        | "DOCUMENT_DOWNLOAD"
        | "DOCUMENT_UPLOAD"
        | "UPLOAD_REQUEST_OPEN_LINK"
        | "UPLOAD_REQUEST_UPLOAD_FILE"
        | "AI_ANALYSIS_MODULE_UPLOAD_FOLDER"
        | "AI_ANALYSIS_MODULE_REPLACE_FILE"
        | "DOCUMENT_ACL_MODULE"
        | "DOCUMENT_ACL_ADD"
        | "DOCUMENT_ACL_REMOVE"
        | "DOCUMENT_SHARE_OPEN_LINK"
        | "DOCUMENT_SHARE_DOWNLOAD_FILE"
        | "DOCUMENT_FOLDER_CABINET_NOTIFICATION"
        | "DOCUMENT_FOLDER_CABINET_SUMMARY_REPORT"
        | "WORKFLOW_CUSTOM"
        | "WORKFLOW_APPLY"
        | "WORKFLOW_SUCCESS"
        | "WORKFLOW_REJECTED";
    variables?: Record<string, object>;
    notificationUserId?: string[];
    businessId?: string;
    setting?: NotificationSetting;
    messageBody?: string;
}

/** Metadata (RequestDTO) */
export interface MetadataRequestDTO {
    /** Fuzzy Search Parameter */
    q?: string;
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
    id?: string;
    name?: string;
    group?: string;
    dataType?: string;
    status?: string;
    sort?: SortObject;
    sortOrModifiedDate?: SortObject;
    descSort?: SortObject;
    desc?: boolean;
    orderByValue?: string;
    /** @format int32 */
    pageIndex?: number;
}

export interface MessageTemplateRequestDTO {
    /** Fuzzy Search Parameter */
    q?: string;
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
    templateName?: string;
    usages?: string;
    createdBy?: string;
    modifiedBy?: string;
    sort?: SortObject;
    sortOrModifiedDate?: SortObject;
    descSort?: SortObject;
    desc?: boolean;
    orderByValue?: string;
    /** @format int32 */
    pageIndex?: number;
}

export interface MessageTemplateVO {
    /** @format int64 */
    id?: number;
    templateName?: string;
    usages?: string;
    whatsAppStatus?: string;
    language?: string;
    createdBy?: string;
    modifiedBy?: string;
    /** @format date-time */
    modifiedDate?: string;
    whatsAppRejectedReason?: string;
}

export interface PaginationDTOMessageTemplateVO {
    entryList?: MessageTemplateVO[];
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

export interface ResultPaginationDTOMessageTemplateVO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTOMessageTemplateVO;
    messageKey?: string;
    locale?: string;
}

export interface ParamDTO {
    name?: string;
    value?: string;
}

export interface TemplateMsgManageDTO {
    name?: string;
    header?: string;
    body?: string;
    footer?: string;
    textMessage?: string;
    language?: string;
    needConfirm?: boolean;
    confirmButtonName?: string;
    headerParameters?: ParamDTO[];
    bodyParameters?: ParamDTO[];
    textParameters?: ParamDTO[];
}

export interface CreateMessageResponseDTO {
    id?: string;
    category?: string;
    status?: string;
    whatsAppRejectedReason?: string;
}

export interface ResultCreateMessageResponseDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: CreateMessageResponseDTO;
    messageKey?: string;
    locale?: string;
}

/** All Table Fields */
export interface MTFieldInfo {
    fieldName?: string;
    dataType?: string;
    required?: boolean;
    unique?: boolean;
    primaryKey?: boolean;
    defaultValue?: object;
    relationTable?: string;
    relationField?: string;
    displayField?: string;
}

/** Master Table RequestDTO */
export interface MasterTableRequestDTO {
    /** Fuzzy Search Parameter */
    q?: string;
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
    /** Master Table ID */
    id?: string;
    /** Master Table Name */
    name?: string;
    /** Master Table Status is Active or Disable (A or D) */
    status?: string;
    /** Create by list */
    createdBys?: string[];
    /** All Table Fields */
    fields?: MTFieldInfo[];
    /** New Data List */
    data?: Record<string, object>[];
    /** Where Condition */
    where?: Record<string, object>;
    sort?: SortObject;
    sortOrModifiedDate?: SortObject;
    descSort?: SortObject;
    desc?: boolean;
    orderByValue?: string;
    /** @format int32 */
    pageIndex?: number;
}

/** Master Table ResponseDTO */
export interface MasterTableResponseDTO {
    id?: string;
    name?: string;
    status?: string;
    description?: string;
    createdBy?: string;
    modifiedBy?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
    fields?: MTColumnInfo[];
    userId?: string;
    aces?: string;
    read?: boolean;
    edit?: boolean;
    create?: boolean;
    enable?: boolean;
}

export interface ResultMasterTableResponseDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** Master Table ResponseDTO */
    data?: MasterTableResponseDTO;
    messageKey?: string;
    locale?: string;
}

export interface PaginationDTOMasterTableResponseDTO {
    entryList?: MasterTableResponseDTO[];
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

export interface ResultPaginationDTOMasterTableResponseDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTOMasterTableResponseDTO;
    messageKey?: string;
    locale?: string;
}

/** Master Table Logs RequestDTO */
export interface MTAuditLogRequestDTO {
    /** Fuzzy Search Parameter */
    q?: string;
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
    /** Master Table ID */
    id?: string;
    /** Master Table Name */
    name?: string;
    /** Master Table Logs eventId */
    eventId?: string;
    /** Master Table Logs Event Category list */
    categories?: string[];
    /** Master Table Logs Principal Name list */
    creators?: string[];
    /** Master Table Logs Principal Name list */
    eventCategory?: string;
    sort?: SortObject;
    sortOrModifiedDate?: SortObject;
    descSort?: SortObject;
    desc?: boolean;
    orderByValue?: string;
    /** @format int32 */
    pageIndex?: number;
}

export interface MTAddColumnRequestDTO {
    id?: string;
    fieldName?: string;
    dataType?: string;
    required?: boolean;
    defaultValue?: object;
    unique?: boolean;
    relationTable?: string;
    relationField?: string;
    displayField?: string;
}

export interface DeleteMTRecordRequestDTO {
    tableId?: string;
    recordIds?: string[];
}

export interface MTPermissionDTO {
    aces?: string;
    masterTableId?: string;
    masterTableName?: string;
    userId?: string;
    userName?: string;
    userType?: string;
    read?: boolean;
    edit?: boolean;
    create?: boolean;
    enable?: boolean;
}

export interface InternalShareQueryDTO {
    /** @format int64 */
    id?: number;
    internalShareId?: string;
    shareByUserId?: string;
    shareByUserIds?: string[];
    permission?: string;
    /** @format date-time */
    startDate?: string;
    /** @format date-time */
    expiredDate?: string;
    /** @format date-time */
    beforeExpiredDate?: string;
    /** @format date-time */
    afterExpiredDate?: string;
    isSendEmail?: boolean;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    beforeCreatedDate?: string;
    /** @format date-time */
    afterCreatedate?: string;
    createdUserId?: string;
    modifiedUserId?: string;
    /** @format date-time */
    modifiedDate?: string;
    /** @format int64 */
    detailId?: number;
    /** @format int64 */
    biggerThenDetailId?: number;
    shareToUserId?: string;
    shareToUserIds?: string[];
    documentId?: string;
    documentIds?: string;
    documentName?: string;
    documentType?: string;
    /** @format date-time */
    documentLastModifiedDate?: string;
    permissionId?: string;
    isAddAcl?: boolean;
    isFolder?: boolean;
    /** @format date-time */
    detailCreatedDate?: string;
    /** @format date-time */
    detailModifiedDate?: string;
    ids?: number[];
    detailIds?: number[];
    /** @format int32 */
    pageNum?: number;
    /** @format int32 */
    pageSize?: number;
    /** @format int32 */
    status?: number;
    /** The sortBy fields */
    orderBy?: string;
    /** The sort ASC or DESC */
    isDesc?: boolean;
    /** @format int64 */
    biggerThenId?: number;
}

export interface PaginationDTOInternalShareQueryDTO {
    entryList?: InternalShareQueryDTO[];
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

export interface ResultPaginationDTOInternalShareQueryDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTOInternalShareQueryDTO;
    messageKey?: string;
    locale?: string;
}

/** ID Template RequestDTO */
export interface IdTemplateRequestDTO {
    /** Fuzzy Search Parameter */
    q?: string;
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
    /** ID */
    id?: string;
    /** Name */
    name?: string;
    sort?: SortObject;
    sortOrModifiedDate?: SortObject;
    descSort?: SortObject;
    desc?: boolean;
    orderByValue?: string;
    /** @format int32 */
    pageIndex?: number;
}

export interface PaginationDTOIdTemplate {
    entryList?: IdTemplate[];
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

export interface ResultPaginationDTOIdTemplate {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTOIdTemplate;
    messageKey?: string;
    locale?: string;
}

/** GenerateId (Request) */
export interface GenerateIdReq {
    templateId?: string;
    templateName?: string;
    variables?: Record<string, string>;
    category?: string;
}

export interface GenerateXApiKeyRequestDTO {
    userId?: string;
}

/** Form Designer (Request) */
export interface FormDesignRequestDTO {
    /** Fuzzy query parameter name */
    q?: string;
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
    /** Form Design ID */
    id?: string;
    /** Form Design Name */
    name?: string;
    /** Form Design Publish Status (value is A or D) */
    publishStatus?: string;
    /** Form Designer Process Definition Key */
    processDefinitionKey?: string;
    /** Form Design Permission */
    permission?: string;
    /** Form Design Permission List */
    permissions?: Record<string, string[]>;
    /** Disable or Enable form design */
    enable?: boolean;
    /** Form Design Information List */
    information?: PlanTableFieldDTO[];
    /** Form Design Preview Style */
    previewStyle?: string;
    /** Form Design Form Result List */
    formResult?: EasyFormResult[];
    /** Form Design Creator */
    createdBy?: string;
    /** Form Design Modifier */
    modifiedBy?: string;
    /** New Data List */
    data?: Record<string, object>[];
    /** Where Condition */
    where?: Record<string, object>;
    /** Where Condition (Not Equal) */
    notEquals?: Record<string, object>;
    /** Where Condition (Equal) */
    equals?: Record<string, object>;
    sort?: SortObject;
    sortOrModifiedDate?: SortObject;
    descSort?: SortObject;
    desc?: boolean;
    orderByValue?: string;
    /** @format int32 */
    pageIndex?: number;
}

/** Form Design Information List */
export interface PlanTableFieldDTO {
    id?: string;
    name?: string;
    type?: string;
    accesstype?: string;
    fieldMappingId?: string;
    masterTable?: string;
    documentType?: string;
    displayField?: string;
    vocabulary?: string;
    require?: string;
    readOnly?: string;
}

/** Form Designer (Response) */
export interface FormDesignResponseDTO {
    /** Form Design ID */
    id?: string;
    /** Form Design Name */
    name?: string;
    /** Form Design Publish Status */
    publishStatus?: string;
    /** Form Designer Process Definition Key */
    processDefinitionKey?: string;
    /** Form Design Permission */
    permission?: string;
    /** Form Design Permission List */
    permissions?: Record<string, string[]>;
    /** Disable or Enable form design */
    enable?: boolean;
    /** Form Design Information List */
    information?: PlanTableFieldDTO[];
    /** Form Design Preview */
    previewStyle?: string;
    /** Form Design Form Result List */
    formResult?: EasyFormResult[];
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
    formInfo?: FormInfoDTO;
    createdBy?: string;
    modifiedBy?: string;
}

export interface FormFieldMapping {
    id?: string;
    formInfoId?: string;
    columnName?: string;
    fieldName?: string;
    dataType?: string;
    status?: string;
    required?: boolean;
    unique?: boolean;
    primaryKey?: boolean;
}

export interface FormInfoDTO {
    id?: string;
    bizId?: string;
    label?: string;
    tableName?: string;
    tableNamePrefix?: string;
    status?: string;
    createdBy?: string;
    modifiedBy?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
    fieldMappings?: FormFieldMapping[];
}

export interface ResultFormDesignResponseDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** Form Designer (Response) */
    data?: FormDesignResponseDTO;
    messageKey?: string;
    locale?: string;
}

/** Form Designer (Request) */
export interface FormDesignDataDTO {
    /** Form Design ID */
    id?: string;
    /** Email Business Log id */
    emailBusinessLogId?: string;
    /** Form Data */
    data?: Record<string, object>;
    /** Business Number */
    bizNo?: string;
    /** Business Type */
    bizType?: string;
}

export interface EasyFormEmailDTO {
    subject?: string;
    body?: string;
    userEmails?: UserEmailDTO[];
    easyFormId?: string;
}

export interface UserEmailDTO {
    username?: string;
    email?: string;
}

/** Easy Form Result (RequestDTO) */
export interface EasyFormResultRequestDTO {
    /** Fuzzy Search Parameter */
    q?: string;
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
    /** Form Design ID */
    id?: string;
    /** Form Design Name */
    name?: string;
    formResult?: EasyFormResult;
    sort?: SortObject;
    sortOrModifiedDate?: SortObject;
    descSort?: SortObject;
    desc?: boolean;
    orderByValue?: string;
    /** @format int32 */
    pageIndex?: number;
}

export interface ResultEasyFormResult {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: EasyFormResult;
    messageKey?: string;
    locale?: string;
}

export interface ResultListLinkedHashMapStringObject {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: Record<string, object>[];
    messageKey?: string;
    locale?: string;
}

/** Easy Form Email RequestDTO */
export interface EasyFormEmailQueryRequestDTO {
    /** Fuzzy Search Parameter */
    q?: string;
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
    email?: string;
    subject?: string;
    easyFormId?: string;
    status?: string;
    sort?: SortObject;
    sortOrModifiedDate?: SortObject;
    descSort?: SortObject;
    desc?: boolean;
    orderByValue?: string;
    /** @format int32 */
    pageIndex?: number;
}

export interface EasyFormActionDTO {
    actionType?: string;
    workflowInstanceId?: string;
    caseId?: string;
    caseDefinitionVersionId?: string;
    actionId?: string;
    actionName?: string;
}

export interface EasyFormEmailLogDTO {
    /** @format int64 */
    id?: number;
    email?: string;
    subject?: string;
    createdBy?: string;
    status?: string;
    /** @format date-time */
    sentDate?: string;
    relatedWorkflows?: EasyFormActionDTO[];
    relateCases?: EasyFormActionDTO[];
}

export interface PaginationDTOEasyFormEmailLogDTO {
    entryList?: EasyFormEmailLogDTO[];
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

export interface ResultPaginationDTOEasyFormEmailLogDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTOEasyFormEmailLogDTO;
    messageKey?: string;
    locale?: string;
}

export interface PaginationDTOFormDesignResponseDTO {
    entryList?: FormDesignResponseDTO[];
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

export interface ResultPaginationDTOFormDesignResponseDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTOFormDesignResponseDTO;
    messageKey?: string;
    locale?: string;
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

export interface ExecuteSqlDTO {
    executeQuerySqlTemplate?: string;
    tableName?: string;
    taskName?: string;
    /** @format int32 */
    initStartDate?: number;
    /** @format int32 */
    initEndDate?: number;
}

export interface PaginationDTOCompanyChop {
    entryList?: CompanyChop[];
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

export interface ResultPaginationDTOCompanyChop {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTOCompanyChop;
    messageKey?: string;
    locale?: string;
}

/** Company Profile RequestDTO */
export interface CompanyRequestDTO {
    /** Fuzzy Search Parameter */
    q?: string;
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
    /** ID */
    id?: string;
    /** Name */
    name?: string;
    /** Contact Phone */
    phone?: string;
    /** Contact Email */
    email?: string;
    /** Contact Fax */
    fax?: string;
    /** Website */
    website?: string;
    /** Contact Address */
    address?: string;
    sort?: SortObject;
    sortOrModifiedDate?: SortObject;
    descSort?: SortObject;
    desc?: boolean;
    orderByValue?: string;
    /** @format int32 */
    pageIndex?: number;
}

export interface PaginationDTOCompany {
    entryList?: Company[];
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

export interface ResultPaginationDTOCompany {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTOCompany;
    messageKey?: string;
    locale?: string;
}

export interface CaseTypeInfo {
    caseTypeId?: string;
    label?: string;
    metadata?: string;
    dataType?: string;
    options?: string;
    require?: boolean;
    status?: string;
}

export interface CaseTypeResponseDTO {
    id?: string;
    name?: string;
    caseIdPrefix?: string;
    /** @format int32 */
    caseIdDigit?: number;
    /** @format int32 */
    startNumber?: number;
    latestVersion?: string;
    latestVersionId?: string;
    productionVersion?: string;
    productionVersionId?: string;
    enable?: boolean;
    publishStatus?: string;
    createdBy?: string;
    modifiedBy?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
    caseDefinitionKey?: string;
    caseDefinitionId?: string;
    /** Case Model PlanItem Information DTO */
    startTask?: PlanItemDefinitionDTO;
    caseVersions?: CmmnVersion[];
    informations?: CaseTypeInfo[];
}

export interface CmmnVersion {
    id?: string;
    deploymentId?: string;
    caseTypeId?: string;
    versionNumber?: string;
    caseDefinitionId?: string;
    caseDefinitionKey?: string;
    productionVersion?: string;
    publishStatus?: string;
    bytes?: string[];
    styleJson?: string;
    /** Case Table ResponseDTO */
    primaryForm?: CaseTableResponseDTO;
    createdBy?: string;
    modifiedBy?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
    production?: boolean;
}

/** Case Model PlanItem Information DTO */
export interface PlanItemDefinitionDTO {
    /** PlanItem Definition Id */
    key?: string;
    /** PlanItem Definition Name */
    name?: string;
    /** PlanItem Definition Type */
    type?: string;
    /** PlanItem Definition ParentId */
    parent?: string;
    /** PlanItem Definition criterion */
    criterion?: Record<string, string>;
    /** PlanItem Definition Rules or Behavior */
    rules?: Record<string, object>;
    /** PlanItem Definition Sub-List */
    subItems?: PlanItemDefinitionDTO[];
    fields?: PlanTableFieldDTO[];
    /** Form Design Information List */
    assigneeField?: PlanTableFieldDTO;
    isStartTask?: boolean;
    upProcessTaskKey?: string;
    upFormProperties?: FormPropertyDTO[];
}

export interface ResultCaseTypeResponseDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: CaseTypeResponseDTO;
    messageKey?: string;
    locale?: string;
}

export interface CaseModelDraft {
    id?: string;
    caseTypeId?: string;
    caseDefinitionKey?: string;
    caseDefinitionId?: string;
    bytes?: string[];
    styleJson?: string;
    serialNo?: string;
    createdBy?: string;
    /** @format date-time */
    createdDate?: string;
    fileName?: string;
}

export interface ResultCaseModelDraft {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: CaseModelDraft;
    messageKey?: string;
    locale?: string;
}

export interface CopyCaseTypeRequest {
    caseIdPrefix?: string;
    /** @format int32 */
    caseIdDigit?: number;
    /** @format int32 */
    startNumber?: number;
    /** ID */
    id?: string;
    /** Name */
    name?: string;
    /** Case Version Id */
    versionId?: string;
}

export interface ResultCmmnVersion {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: CmmnVersion;
    messageKey?: string;
    locale?: string;
}

export interface CmmnVersionRequestDTO {
    /** Fuzzy Search Parameter */
    q?: string;
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
    /** ID of case type */
    caseTypeId?: string;
    /** Version Number */
    versionNumber?: string;
    /** The style json */
    styleJson?: string;
    sort?: SortObject;
    sortOrModifiedDate?: SortObject;
    descSort?: SortObject;
    desc?: boolean;
    orderByValue?: string;
    /** @format int32 */
    pageIndex?: number;
}

export interface PaginationDTOCmmnVersion {
    entryList?: CmmnVersion[];
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

export interface ResultPaginationDTOCmmnVersion {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTOCmmnVersion;
    messageKey?: string;
    locale?: string;
}

/** Case Type RequestDTO */
export interface CaseTypeRequestDTO {
    /** Fuzzy Search Parameter */
    q?: string;
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
    /** ID */
    id?: string;
    /** Name */
    name?: string;
    /** is enable */
    enable?: boolean;
    caseIds?: string[];
    sort?: SortObject;
    sortOrModifiedDate?: SortObject;
    descSort?: SortObject;
    desc?: boolean;
    orderByValue?: string;
    /** @format int32 */
    pageIndex?: number;
}

export interface PaginationDTOCaseType {
    entryList?: CaseType[];
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

export interface ResultPaginationDTOCaseType {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTOCaseType;
    messageKey?: string;
    locale?: string;
}

export interface ResultListCaseTypeResponseDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: CaseTypeResponseDTO[];
    messageKey?: string;
    locale?: string;
}

export interface CmmnTriggerEventReqDTO {
    caseInstanceId?: string;
    planItemDefinitionId?: string;
    planItemInstanceId?: string;
    state?: string;
}

/** Case Table RequestDTO */
export interface CaseTableRequestDTO {
    /** Fuzzy Search */
    q?: string;
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
    /** Case Table ID */
    id?: string;
    /** Case Table label */
    label?: string;
    /** Case Type ID */
    caseTypeId?: string;
    startCmmnVersion?: CmmnVersion;
    /** Case Table Name */
    tableName?: string;
    /** Case Table Status is Active or Disable (A or D) */
    status?: string;
    /** All Table Fields */
    fields?: MTFieldInfo[];
    /** Create by list */
    createdBys?: string[];
    /** New Data List */
    data?: Record<string, object>[];
    /** Where Condition */
    where?: Record<string, object>;
    /** Where Condition (Not Equal) */
    notEquals?: Record<string, object>;
    /** Where Condition (Equal) */
    equals?: Record<string, object>;
    /** Where And Condition */
    andConditions?: WhereCondition[];
    c?: Record<string, object>;
    /** User */
    operator?: UserDTO;
    sort?: SortObject;
    sortOrModifiedDate?: SortObject;
    descSort?: SortObject;
    desc?: boolean;
    orderByValue?: string;
    /** @format int32 */
    pageIndex?: number;
}

/** Where And Condition */
export interface WhereCondition {
    columnName?: string;
    operator?: "EQ" | "NEQ" | "LIKE" | "IN" | "NOT_IN" | "NOT_EXIST" | "RANGE" | "GT" | "LT" | "GTE" | "LTE";
    value?: object;
    arrays?: object[];
    start?: object;
    end?: object;
}

export interface CaseTable {
    id?: string;
    caseTypeId?: string;
    label?: string;
    tableName?: string;
    status?: string;
    createdBy?: string;
    modifiedBy?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
}

export interface ResultCaseTable {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: CaseTable;
    messageKey?: string;
    locale?: string;
}

export interface ResultCaseTableResponseDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** Case Table ResponseDTO */
    data?: CaseTableResponseDTO;
    messageKey?: string;
    locale?: string;
}

/** Case Instance TaskDTO (Request) */
export interface CaseInstanceTaskDTO {
    caseInstanceId?: string;
    taskId?: string;
    assignee?: string;
    variables?: Record<string, object>;
}

/** Task */
export interface CmmnTaskDTO {
    /** Task ID */
    id?: string;
    /** Task Name */
    name?: string;
    /** Task Description */
    description?: string;
    /** Task Definition ID */
    taskDefinitionId?: string;
    /** Process Definition Version ID */
    processDefinitionVersionId?: string;
    /** Task Definition Key */
    taskDefinitionKey?: string;
    /** Task Assignee */
    assignee?: string;
    /** Task Form Key */
    formKey?: string;
    /** Task Instance ID */
    instanceId?: string;
    /** Task Parent ID */
    parentId?: string;
    /**
     * Task Creation Date
     * @format date-time
     */
    createDate?: string;
    /**
     * Task Due Date
     * @format date-time
     */
    dueDate?: string;
    /**
     * Task Claim Date
     * @format date-time
     */
    claimDate?: string;
    /** Process Instance */
    taskInstance?: InstanceDTO;
    businessKey?: string;
    processDefinitionName?: string;
    startUserId?: string;
    createDateStr?: string;
    dueDateStr?: string;
    variables?: Record<string, object>;
    state?: string;
    /** @format date-time */
    endTime?: string;
    /** @format int64 */
    durationInMillis?: number;
    caseDefinitionId?: string;
    caseInstanceId?: string;
    assignees?: string[];
    candidateGroups?: string[];
}

export interface ResultListCmmnTaskDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: CmmnTaskDTO[];
    messageKey?: string;
    locale?: string;
}

/** Case Instance (Request) */
export interface CaseInstanceRequestDTO {
    /** Fuzzy Search Parameter */
    q?: string;
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
    caseTypeId?: string;
    /** Case Definition ID */
    caseDefinitionId?: string;
    /** Case Definition Key */
    caseDefinitionKey?: string;
    /** Case ID or alias business key */
    businessKey?: string;
    /** Case Instance ID */
    caseInstanceId?: string;
    /** Is Active */
    isActive?: boolean;
    /** Request Parameters */
    parameters?: Record<string, object>;
    /** Operation User Id */
    operator?: string;
    /** State */
    state?: string;
    /** Execution ID */
    executionId?: string;
    /** PlanItem Instance Id list */
    planItemInstanceIds?: string[];
    /** PlanItem Definition Type list */
    planItemDefinitionTypes?: string[];
    sort?: SortObject;
    sortOrModifiedDate?: SortObject;
    descSort?: SortObject;
    desc?: boolean;
    orderByValue?: string;
    /** @format int32 */
    pageIndex?: number;
}

/** Case Instance (Request) */
export interface CaseInstanceDTO {
    id?: string;
    parentId?: string;
    businessKey?: string;
    businessStatus?: string;
    name?: string;
    caseDefinitionId?: string;
    caseDefinitionKey?: string;
    caseDefinitionName?: string;
    /** @format int32 */
    caseDefinitionVersion?: number;
    caseDefinitionDeploymentId?: string;
    state?: string;
    /** @format date-time */
    startTime?: string;
    startUserId?: string;
    /** @format date-time */
    lastReactivationTime?: string;
    lastReactivationUserId?: string;
    callbackId?: string;
    callbackType?: string;
    referenceId?: string;
    referenceType?: string;
    completable?: boolean;
    tenantId?: string;
    variables?: Record<string, object>;
}

export interface ResultCaseInstanceDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** Case Instance (Request) */
    data?: CaseInstanceDTO;
    messageKey?: string;
    locale?: string;
}

/** Case Model Plan Form DTO */
export interface CmmnPlanFormDTO {
    id?: string;
    name?: string;
    type?: string;
    casetable?: string;
    fields?: PlanTableFieldDTO[];
}

/** PlanItemInstanceDTO */
export interface PlanItemInstanceDTO {
    caseDefinitionId?: string;
    caseInstanceId?: string;
    derivedCaseDefinitionId?: string;
    formKey?: string;
    id?: string;
    name?: string;
    planItemDefinitionId?: string;
    planItemDefinitionType?: string;
    referenceId?: string;
    referenceType?: string;
    stageInstanceId?: string;
    startUserId?: string;
    state?: string;
    /** @format date-time */
    completedTime?: string;
    /** @format date-time */
    createTime?: string;
    /** @format date-time */
    endedTime?: string;
    /** @format date-time */
    exitTime?: string;
    active?: boolean;
    businessKey?: string;
    operator?: string;
    variables?: Record<string, object>;
    /** Workflow Instance Request Variables */
    workflowVariables?: Record<string, object>;
    /** Workflow PlanItem Instance */
    subItems?: PlanItemInstanceDTO[];
    /** Case Model Plan Form DTO */
    planForm?: CmmnPlanFormDTO;
    processInstanceId?: string;
    humanTaskId?: string;
}

export interface ResultListPlanItemInstanceDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PlanItemInstanceDTO[];
    messageKey?: string;
    locale?: string;
}

export interface CmmnDashboard {
    id?: string;
    caseTypeId?: string;
    deploymentId?: string;
    cmmnVersionId?: string;
    label?: string;
    /** @deprecated */
    userGroup?: string;
    permissions?: string[];
    status?: string;
    styleJson?: string;
    createdBy?: string;
    modifiedBy?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
}

export interface ResultCmmnDashboard {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: CmmnDashboard;
    messageKey?: string;
    locale?: string;
}

export interface PaginationDTOCmmnDashboardResponseDTO {
    entryList?: CmmnDashboardResponseDTO[];
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

export interface ResultPaginationDTOCmmnDashboardResponseDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTOCmmnDashboardResponseDTO;
    messageKey?: string;
    locale?: string;
}

/** Case Process RequestDTO */
export interface CmmnProcessRequestDTO {
    q?: string;
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
    caseInstanceId?: string;
    businessKey?: string;
    caseDefinitionId?: string;
    processDefinitionKeys?: string[];
    assignee?: string;
    candidateOrAssigned?: string;
    category?: string;
    workflow?: string;
    sort?: SortObject;
    sortOrModifiedDate?: SortObject;
    descSort?: SortObject;
    desc?: boolean;
    orderByValue?: string;
    /** @format int32 */
    pageIndex?: number;
}

/** Case Instance Process Instance Information */
export interface CmmnProcessInstanceDTO {
    /** process Instance ID */
    processInstanceId?: string;
    /** Business Key */
    businessKey?: string;
    /** Task ID */
    taskId?: string;
    /** is complete state */
    complete?: boolean;
    /** process Instance state */
    state?: string;
    /** Assigned user of current task */
    assignedUser?: string;
    /** Error Message */
    errorMsg?: string;
    /** Process Instance */
    instance?: InstanceDTO;
    tasks?: TaskDTO[];
    /** process Instance ID */
    caseInstanceId?: string;
    /**
     * Start Time
     * @format date-time
     */
    startTime?: string;
    /**
     * End Time
     * @format date-time
     */
    endTime?: string;
    /** Start UserId */
    startUserId?: string;
    /** Process Definition Id */
    processDefinitionId?: string;
    /** Process Definition Key */
    processDefinitionKey?: string;
    /** Process Definition Name */
    processDefinitionName?: string;
    /** Process Definition Deployment Id */
    deploymentId?: string;
}

export interface PaginationDTOCmmnProcessInstanceDTO {
    entryList?: CmmnProcessInstanceDTO[];
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

export interface ResultPaginationDTOCmmnProcessInstanceDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTOCmmnProcessInstanceDTO;
    messageKey?: string;
    locale?: string;
}

export interface ResultListCalendarTaskRespDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: CalendarTaskRespDTO[];
    messageKey?: string;
    locale?: string;
}

/** The folder cabinet metadata */
export interface FCMetadata {
    /** Name */
    name?: string;
    /** Type */
    type?: string;
    /** Value */
    value?: object;
}

export interface FCNotificationConfig {
    id?: string;
    folderCabinetId?: string;
    reminderType?: string;
    /** @format int32 */
    intervalTime?: number;
    /**
     * @deprecated
     * @format int32
     */
    notificationReminder?: number;
    /**
     * @deprecated
     * @format int32
     */
    reportDay?: number;
    /**
     * @deprecated
     * @format int32
     */
    emailReminder?: number;
    tos?: string;
    ccs?: string;
}

/** Email Reminder */
export interface FCReminder {
    /**
     * Interval Time
     * @format int32
     */
    intervalTime?: number;
    /** Recipients list */
    tos?: string[];
    /** ccRecipients list */
    ccs?: string[];
}

/** The bind owners of this folder cabinet */
export interface FolderCabinetBinds {
    /** @format int64 */
    id?: number;
    folderCabinetId?: string;
    bindId?: string;
    type?: string;
    label?: string;
}

/** Folder Cabinet RequestDTO */
export interface FolderCabinetRequestDTO {
    /** Fuzzy Search Parameter */
    q?: string;
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
    /** Folder Cabinet ID */
    id?: string;
    /** Document ID of Nuxeo */
    rootId?: string;
    /** The parent ID of this folder cabinet */
    parentId?: string;
    /** The name of folder cabinet */
    label?: string;
    /** The document type of nuxeo */
    documentType?: string;
    /** The document path of nuxeo */
    documentPath?: string;
    /** Whether it is a folder? */
    folder?: boolean;
    /** Whether it allow other document-type file? */
    allow?: boolean;
    /** Whether it allow multiple file? */
    multiple?: boolean;
    repeatName?: boolean;
    pathIds?: string;
    /** The create user of this folder cabinet */
    createdBy?: string;
    /** The last modify user of this folder cabinet */
    modifiedBy?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
    /** choose metadata */
    metadata?: FCMetadata[];
    /** The label Rule list */
    labelRule?: string;
    /** The bind owners of this folder cabinet */
    binds?: FolderCabinetBinds[];
    /** Email Reminder */
    notificationReminder?: FCReminder;
    /** Email Reminder */
    emailReport?: FCReminder;
    /** Email Reminder */
    emailReminder?: FCReminder;
    /** The default value list of label rule */
    metadataValue?: string;
    systemReminderConfig?: FCNotificationConfig;
    summaryReportEmail?: FCNotificationConfig;
    delayEmail?: FCNotificationConfig;
    sort?: SortObject;
    sortOrModifiedDate?: SortObject;
    descSort?: SortObject;
    desc?: boolean;
    orderByValue?: string;
    /** @format int32 */
    pageIndex?: number;
}

/** Document Access Control Entry */
export interface DocumentACLEntryDTO {
    /** Access Control Entry ID */
    id?: string;
    /** User ID */
    userId?: string;
    /** User Permission */
    permission?: string;
    /** Granted By */
    grarntedBy?: string;
    /** Start Date */
    startDate?: string;
    /** End Date */
    endDate?: string;
    print?: boolean;
}

/** Folder Cabinet ResponseDTO */
export interface FolderCabinetResponseDTO {
    /** FolderCabinet ID */
    id?: string;
    /** Folder Cabinet Setting ID */
    folderCabinetSettingId?: string;
    /** Document ID of Nuxeo */
    rootId?: string;
    /** The parent ID of this folder cabinet */
    parentId?: string;
    /** The name of folder cabinet */
    label?: string;
    /** The document type of nuxeo */
    documentType?: string;
    /** The document path of nuxeo */
    documentPath?: string;
    /** Whether it is a folder? */
    folder?: boolean;
    /** Whether it allow other document-type file? */
    allow?: boolean;
    /** Whether it allow multiple file? */
    multiple?: boolean;
    pathIds?: string;
    /** The create user of this folder cabinet */
    createdBy?: string;
    /** The last modify user of this folder cabinet */
    modifiedBy?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
    complete?: boolean;
    /** The bind owners of this folder cabinet */
    binds?: FolderCabinetBinds[];
    /** The label Rule list */
    labelRule?: string;
    /** The sublist of this folder cabinet */
    children?: FolderCabinetResponseDTO[];
    /** choose metadata */
    metadata?: FCMetadata[];
    /** Email Reminder */
    notificationReminder?: FCReminder;
    /** Email Reminder */
    emailReport?: FCReminder;
    /** Email Reminder */
    emailReminder?: FCReminder;
    repeatName?: boolean;
    metadataValue?: string;
    acls?: DocumentACLEntryDTO[];
}

export interface ResultFolderCabinetResponseDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** Folder Cabinet ResponseDTO */
    data?: FolderCabinetResponseDTO;
    messageKey?: string;
    locale?: string;
}

export interface PaginationDTOFolderCabinetResponseDTO {
    entryList?: FolderCabinetResponseDTO[];
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

export interface ResultPaginationDTOFolderCabinetResponseDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTOFolderCabinetResponseDTO;
    messageKey?: string;
    locale?: string;
}

export interface FolderCabinet {
    id?: string;
    parentId?: string;
    pathIds?: string;
    label?: string;
    documentId?: string;
    documentType?: string;
    documentPath?: string;
    allow?: boolean;
    multiple?: boolean;
    complete?: boolean;
    folder?: boolean;
    metadata?: FCMetadata[];
    labelRule?: string;
    permission?: string;
    repeatName?: boolean;
    metadataValue?: string;
    createdBy?: string;
    modifiedBy?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
    binds?: FolderCabinetBinds[];
    children?: FolderCabinet[];
    configList?: FCNotificationConfig[];
}

export interface ResultFolderCabinet {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: FolderCabinet;
    messageKey?: string;
    locale?: string;
}

export interface OcrTransactionLogRequestDTO {
    /** Fuzzy Search Parameter */
    q?: string;
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
    sort?: SortObject;
    sortOrModifiedDate?: SortObject;
    descSort?: SortObject;
    desc?: boolean;
    orderByValue?: string;
    /** @format int32 */
    pageIndex?: number;
}

export interface OcrTransactionLogDTO {
    /** @format int64 */
    id?: number;
    businessName?: string;
    workflow?: string;
    state?: string;
    ocrProfileName?: string;
    scanType?: string;
    processStatus?: string;
    /** @format date-time */
    createdDate?: string;
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
    messageKey?: string;
    locale?: string;
}

export interface UserRoleGroupDTO {
    roleId?: string;
    roleName?: string;
    groups?: GroupDTO[];
}

export interface ResultMapStringUserRoleGroupDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: Record<string, UserRoleGroupDTO>;
    messageKey?: string;
    locale?: string;
}

export interface RoleUsersRequest {
    roleId?: string;
    userIds?: string[];
}

export interface BasePageDTO {
    /** @format int32 */
    pageNum?: number;
    /** @format int32 */
    pageSize?: number;
    conditions?: BaseQueryConditionDTO[];
}

export interface BaseQueryConditionDTO {
    column: string;
    /**
     * 条件类型
     * @example "EQ"
     */
    type:
        | "EQ"
        | "NE"
        | "GT"
        | "GE"
        | "LT"
        | "LE"
        | "LIKE"
        | "LIKE_LEFT"
        | "LIKE_RIGHT"
        | "NOT_LIKE"
        | "NOT_LIKE_LEFT"
        | "NOT_LIKE_RIGHT"
        | "IS_NULL"
        | "IS_NOT_NULL"
        | "ORDER_BY_ASC"
        | "ORDER_BY_DESC"
        | "IN"
        | "NOT_IN"
        | "BETWEEN"
        | "NOT_BETWEEN"
        | "IN_SQL"
        | "NOT_IN_SQL"
        | "EQ,NE,GT,GE,LT,LE,LIKE,LIKE_LEFT,LIKE_RIGHT,NOT_LIKE,NOT_LIKE_LEFT,NOT_LIKE_RIGHT,IS_NULL,IS_NOT_NULL,ORDER_BY_ASC,ORDER_BY_DESC,IN,NOT_IN,BETWEEN,NOT_BETWEEN";
    values: string;
}

export interface PaginationDTORoleUsersVO {
    entryList?: RoleUsersVO[];
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

export interface ResultPaginationDTORoleUsersVO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTORoleUsersVO;
    messageKey?: string;
    locale?: string;
}

export interface RoleUsersVO {
    userId?: string;
    userName?: string;
    email?: string;
    acRoleId?: string;
    /** @format int32 */
    id?: number;
}

export interface ResultMapStringListUserDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: Record<string, UserDTO[]>;
    messageKey?: string;
    locale?: string;
}

export interface PaginationDTORoleVO {
    entryList?: RoleVO[];
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

export interface ResultPaginationDTORoleVO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PaginationDTORoleVO;
    messageKey?: string;
    locale?: string;
}

export interface RoleVO {
    name?: string;
    parentId?: string;
    /** @format int32 */
    grade?: number;
    /** @format int32 */
    status?: number;
    /** @format int32 */
    type?: number;
    /** @format date-time */
    createTime?: string;
    /** @format date-time */
    updateTime?: string;
    userIds?: string[];
    parentRoleName?: string;
    id?: string;
}

export interface ResultListRoleDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: RoleDTO[];
    messageKey?: string;
    locale?: string;
}

/** Role data transfer object */
export interface RoleDTO {
    /** Role ID */
    id?: string;
    /** Role name */
    name?: string;
    /** Parent role ID */
    parentId?: string;
    /**
     * Role grade/level in hierarchy
     * @format int32
     */
    grade?: number;
    /**
     * Create time
     * @format date-time
     */
    createTime?: string;
    /**
     * Update time
     * @format date-time
     */
    updateTime?: string;
    /**
     * Role status (0=Disabled, 1=Enabled)
     * @format int32
     */
    status?: number;
    /**
     * Role type (1=System, 2=Custom)
     * @format int32
     */
    type?: number;
    /**
     * Number of users in this role
     * @format int64
     */
    count?: number;
    /** Child roles */
    children?: RoleDTO[];
    /** Additional user IDs */
    additionUsers?: string[];
}

export interface ResultListResourcePermissionVO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: ResourcePermissionVO[];
    messageKey?: string;
    locale?: string;
}

/** ACL document List request */
export interface AclDocumentListRequest {
    /** User/Role/Group/UserSet id list */
    targetIds?: string[];
    /** documentId */
    documentId?: string;
    orderBy?: string;
    desc?: boolean;
}

/** ACL Document View Object */
export interface AclDocumentVO {
    /** Unique identifier for the document or folder */
    id?: string;
    /** Name of the document or folder */
    name?: string;
    /** Path of the document or folder */
    path?: string;
    /** Parent ID of the document or folder */
    parentId?: string;
    /** Type of the document (e.g., folder) */
    documentType?: string;
    /** Read permissions (users or groups allowed to read) */
    read?: string;
    /** Read-write permissions (users or groups allowed to read and write) */
    readWrite?: string;
    /** Management permissions (users or groups allowed to manage) */
    manage?: string;
    /** Custom field for additional information */
    custom?: string;
    /** Is folder */
    isFolder?: boolean;
}

export interface ResultListAclDocumentVO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: AclDocumentVO[];
    messageKey?: string;
    locale?: string;
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

export interface UpdatePasswordDTO {
    oldPassword?: string;
    newPassword?: string;
}

/** ResetEasyShare (Request) */
export interface ShareSaveRequestDTO {
    /** Share Id */
    shareId?: string;
    /** Document shared to a list of email */
    emailList?: string[];
    /** Password for shared document(s) */
    password?: string;
    /**
     * How long the token can last for? (in # of minutes)
     * @format int32
     */
    tokenLiveInMinutes?: number;
}

/** EasyShare */
export interface EasyShareDTO {
    /** Token for access shared document */
    access_token?: string;
    /** UUID of saved Nuxeo PATH */
    shareId?: string;
    /** document in Nuxeo with PATH */
    documentURL?: string;
}

export interface ResultEasyShareDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** EasyShare */
    data?: EasyShareDTO;
    messageKey?: string;
    locale?: string;
}

export interface ResultSmartFolderResponseDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** Smart Folder */
    data?: SmartFolderResponseDTO;
    messageKey?: string;
    locale?: string;
}

export interface ViewSettingRequestDTO {
    id?: string;
    json_value?: string;
}

export interface ResultViewSettingResponseDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: ViewSettingResponseDTO;
    messageKey?: string;
    locale?: string;
}

export interface ViewSettingResponseDTO {
    json_value?: string;
}

/** External Storage Profile Output setting */
export interface ExternalProfileOutputDTO {
    id?: string;
    profileId?: string;
    documentType?: string;
    outputFormat?: string;
    status?: string;
    color?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
    lastModifyBy?: string;
    destinationType?: string;
    destinationDriveId?: string;
    outputPath?: string;
    outputFileName?: string;
    txtSetting?: Record<string, object>;
    imageSetting?: Record<string, object>;
}

/** Status Update Request */
export interface StatusRequest {
    /** Status (A, D, R) */
    status?: string;
    /** Reason for status change (optional) */
    reason?: string;
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

export interface ResultUserStatusDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** user status DTO */
    data?: UserStatusDTO;
    messageKey?: string;
    locale?: string;
}

/** user status DTO */
export interface UserStatusDTO {
    accountExpire?: boolean;
    firstLoginForceResetPassword?: boolean;
    /** @format int32 */
    expirationDay?: number;
}

export interface LockUserDTO {
    lockStatus?: boolean;
    /** @format int32 */
    lockMinutes?: number;
}

export interface ResultLockUserDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: LockUserDTO;
    messageKey?: string;
    locale?: string;
}

export interface ResultPasswordConfigDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PasswordConfigDTO;
    messageKey?: string;
    locale?: string;
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
    messageKey?: string;
    locale?: string;
}

export interface ResultListSmartFolderResponseDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: SmartFolderResponseDTO[];
    messageKey?: string;
    locale?: string;
}

export interface ResultObjects {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: object;
    messageKey?: string;
    locale?: string;
}

export interface AuditTemplate {
    id?: string;
    eventId?: string;
    nuxeoEventId?: string;
    documentId?: string;
    comment?: string;
    docPath?: string;
    docType?: string;
    eventType?: string;
    eventCategory?: string;
    label?: string;
    /** @format date-time */
    createTime?: string;
    /** @format date-time */
    updateTime?: string;
}

export interface ResultListAuditTemplate {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: AuditTemplate[];
    messageKey?: string;
    locale?: string;
}

/** CustomIcon */
export interface CustomIconDTO {
    docTypeId?: string;
}

export interface ResultListCustomIconDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: CustomIconDTO[];
    messageKey?: string;
    locale?: string;
}

export interface ResultInteger {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** @format int32 */
    data?: number;
    messageKey?: string;
    locale?: string;
}

/** AccountPropertyDTO */
export interface AccountPropertyDTO {
    /** @format int32 */
    total?: number;
    /** @format int32 */
    active?: number;
    /** @format int32 */
    premium?: number;
    /** @format int32 */
    standard?: number;
    /** @format int32 */
    essential?: number;
}

export interface ResultAccountPropertyDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** AccountPropertyDTO */
    data?: AccountPropertyDTO;
    messageKey?: string;
    locale?: string;
}

export interface ResultListBusinessResultRecord {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: BusinessResultRecord[];
    messageKey?: string;
    locale?: string;
}

export interface MQMessageTotalDTO {
    streamKey?: string;
    /** @format int64 */
    messageTotal?: number;
}

export interface ResultListMQMessageTotalDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: MQMessageTotalDTO[];
    messageKey?: string;
    locale?: string;
}

export interface MQConsumeGroupStatusDTO {
    consumeGroup?: string;
    create?: number;
    pending?: number;
    completed?: number;
    finish?: number;
    error?: number;
}

export interface ResultListMQConsumeGroupStatusDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: MQConsumeGroupStatusDTO[];
    messageKey?: string;
    locale?: string;
}

export interface MQDayTotalDTO {
    daytime?: string;
    num?: number;
}

export interface ResultListMQDayTotalDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: MQDayTotalDTO[];
    messageKey?: string;
    locale?: string;
}

export interface MQConfigurationInfo {
    mqName?: string;
    /** @format int64 */
    length?: number;
    /** @format int64 */
    groupCount?: number;
    consumeGroups?: Record<string, object>[];
}

export interface ResultListMQConfigurationInfo {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: MQConfigurationInfo[];
    messageKey?: string;
    locale?: string;
}

export interface ResultListExternalStorageImportJobDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: ExternalStorageImportJobDTO[];
    messageKey?: string;
    locale?: string;
}

export interface ResultListExternalStorageDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: ExternalStorageDTO[];
    messageKey?: string;
    locale?: string;
}

export interface ResultListExternalProfileDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: ExternalProfileDTO[];
    messageKey?: string;
    locale?: string;
}

export interface ResultListEventCalendarSetting {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: EventCalendarSetting[];
    messageKey?: string;
    locale?: string;
}

export interface ResultListDocPalTypeRelated {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: DocPalTypeRelated[];
    messageKey?: string;
    locale?: string;
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
    /** Schema That Belong To Keyword */
    schema?: string;
    /** Keyword Is Multiple Value */
    isMultiValue?: boolean;
    /** Keyword Default Value */
    defaultValue?: object;
    /** Value Scope Of This Keyword */
    valueScope?: KeywordValueScope;
}

/** Value Scope Of This Keyword */
export interface KeywordValueScope {
    scope?: string;
    scopeName?: string;
}

export interface ResultDocumentTypeDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** Document Type */
    data?: DocumentTypeDTO;
    messageKey?: string;
    locale?: string;
}

export interface ResultListMetadataResponseVO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: MetadataResponseVO[];
    messageKey?: string;
    locale?: string;
}

export interface ResultListDocPalType {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: DocPalType[];
    messageKey?: string;
    locale?: string;
}

export interface ResultListLong {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: number[];
    messageKey?: string;
    locale?: string;
}

export interface ResultListDocumentTypeProfileSetting {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: DocumentTypeProfileSetting[];
    messageKey?: string;
    locale?: string;
}

export interface ResultMapStringListMapStringString {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: Record<string, Record<string, string>[]>;
    messageKey?: string;
    locale?: string;
}

/** Process Instance Information */
export interface ProcessInstanceDTO {
    /** process Instance ID */
    processInstanceId?: string;
    /** Business Key */
    businessKey?: string;
    /** Task ID */
    taskId?: string;
    /** is complete state */
    complete?: boolean;
    /** process Instance state */
    state?: string;
    /** Assigned user of current task */
    assignedUser?: string;
    /** Error Message */
    errorMsg?: string;
    /** Process Instance */
    instance?: InstanceDTO;
    tasks?: TaskDTO[];
}

export interface ResultProcessInstanceDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** Process Instance Information */
    data?: ProcessInstanceDTO;
    messageKey?: string;
    locale?: string;
}

/** Form Property */
export interface FormPropertiesDTO {
    /** Property Key */
    id?: string;
    /** Property Name */
    name?: string;
    /** Property Type */
    type?: string;
    /** Property Value */
    value?: string;
    /** Is Property Readable */
    readable?: boolean;
    /** Is Property Required */
    required?: boolean;
    /** Is Property Writable */
    writable?: boolean;
    /** Property expression */
    expression?: string;
    /** Property variable */
    variable?: string;
    /** Property defaultExpression */
    defaultExpression?: string;
    /** Enum Options */
    options?: Record<string, string>;
}

export interface ProcessDefinitionDTO {
    id?: string;
    category?: string;
    name?: string;
    key?: string;
    description?: string;
    /** @format int32 */
    version?: number;
    resourceName?: string;
    deploymentId?: string;
    diagramResourceName?: string;
    hasStartFormKey?: boolean;
    hasGraphicalNotation?: boolean;
    getTenantId?: string;
    getDerivedFrom?: string;
    getDerivedFromRoot?: string;
    /** @format int32 */
    getDerivedVersion?: number;
    getEngineVersion?: string;
    userTasks?: UserTaskDTO[];
    permissions?: Record<string, string>[];
    fcDataMapping?: Record<string, string>[];
    suspended?: boolean;
}

export interface ResultListProcessDefinitionDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: ProcessDefinitionDTO[];
    messageKey?: string;
    locale?: string;
}

export interface UserTaskDTO {
    id?: string;
    name?: string;
    flowElementType?: string;
    formProperties?: FormPropertiesDTO[];
}

export interface ResultProcessDefinitionDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: ProcessDefinitionDTO;
    messageKey?: string;
    locale?: string;
}

/** BPMN Dynamic Form Information DTO */
export interface BpmnDynamicFormDTO {
    id?: string;
    name?: string;
    type?: string;
    properties?: FormPropertyDTO[];
}

export interface ResultListBpmnDynamicFormDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: BpmnDynamicFormDTO[];
    messageKey?: string;
    locale?: string;
}

export interface ResultBpmnDynamicFormDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** BPMN Dynamic Form Information DTO */
    data?: BpmnDynamicFormDTO;
    messageKey?: string;
    locale?: string;
}

export interface ResultListProcessDefinitionDraft {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: ProcessDefinitionDraft[];
    messageKey?: string;
    locale?: string;
}

export interface LanguageDTO {
    name?: string;
    code?: string;
}

export interface ResultListLanguageDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: LanguageDTO[];
    messageKey?: string;
    locale?: string;
}

export interface ResultListWatermarkSettingsTemplate {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: WatermarkSettingsTemplate[];
    messageKey?: string;
    locale?: string;
}

export interface ResultListWatermarkSettingsDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: WatermarkSettingsDTO[];
    messageKey?: string;
    locale?: string;
}

export interface ResultListWMContentTypeDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: WMContentTypeDTO[];
    messageKey?: string;
    locale?: string;
}

export interface WMContentTypeDTO {
    value?: string;
    label?: string;
    metadata?: string;
}

export interface ResultListDocumentTypeDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: DocumentTypeDTO[];
    messageKey?: string;
    locale?: string;
}

export interface ResultEmailTemplate {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: EmailTemplate;
    messageKey?: string;
    locale?: string;
}

export interface ResultListEmailLayout {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: EmailLayout[];
    messageKey?: string;
    locale?: string;
}

export interface ResultListEmailTemplate {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: EmailTemplate[];
    messageKey?: string;
    locale?: string;
}

export interface ResultDocumentTemplate {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: DocumentTemplate;
    messageKey?: string;
    locale?: string;
}

export interface ResultListDocumentTemplate {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: DocumentTemplate[];
    messageKey?: string;
    locale?: string;
}

export interface ResultMapStringString {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: Record<string, string>;
    messageKey?: string;
    locale?: string;
}

export interface ResultMapStringBoolean {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: Record<string, boolean>;
    messageKey?: string;
    locale?: string;
}

export interface ResultSetString {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** @uniqueItems true */
    data?: string[];
    messageKey?: string;
    locale?: string;
}

/** KeyCloakPropertyDTO */
export interface KeyCloakPropertyDTO {
    /** url */
    url?: string;
    /** 域 */
    realm?: string;
    /** clientId */
    clientId?: string;
    /** sslRequired */
    sslRequired?: string;
    /** publicClient */
    publicClient?: boolean;
    /**
     * confidentialPort
     * @format int32
     */
    confidentialPort?: number;
    /** enable SSO */
    enableSSO?: boolean;
}

/** KeyCloakPropertyVO */
export interface KeyCloakPropertyVO {
    /** isLdap */
    isLdap?: boolean;
    /** KeyCloakPropertyDTO */
    keyCloakProperty?: KeyCloakPropertyDTO;
    /** AccountPropertyDTO */
    accountProperty?: AccountPropertyDTO;
}

export interface ResultKeyCloakPropertyVO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** KeyCloakPropertyVO */
    data?: KeyCloakPropertyVO;
    messageKey?: string;
    locale?: string;
}

export interface ResultListRetentionTrigger {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: RetentionTrigger[];
    messageKey?: string;
    locale?: string;
}

export interface ResultOAuth2SettingRequestDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: OAuth2SettingRequestDTO;
    messageKey?: string;
    locale?: string;
}

export interface ResultOAuth2AuthenticationMethod {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: ("DEFAULT" | "MICROSOFT_OFFICE_365" | "GOOGLE")[];
    messageKey?: string;
    locale?: string;
}

export interface Content {
    type?: string;
    format?: string;
    text?: string;
}

export interface MessageTemplateDTO {
    /** @format int64 */
    id?: number;
    status?: string;
    name?: string;
    category?: string;
    language?: string;
    parameter_format?: string;
    needSendTextMessage?: boolean;
    headerVariables?: string[];
    bodyVariables?: string[];
    textVariables?: string[];
    components?: Content[];
}

export interface ResultListMessageTemplateDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: MessageTemplateDTO[];
    messageKey?: string;
    locale?: string;
}

export interface ResultMessageTemplateDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: MessageTemplateDTO;
    messageKey?: string;
    locale?: string;
}

export interface MessageTemplateListDTO {
    templateNames?: string[];
}

export interface ResultMessageTemplateListDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: MessageTemplateListDTO;
    messageKey?: string;
    locale?: string;
}

export interface MessageCountDTO {
    name?: string;
    /** @format int64 */
    readCount?: number;
    /** @format int64 */
    sendCount?: number;
}

export interface MessageTemplateDetailDTO {
    template?: TemplateMsgManageDTO;
    whatsAppRejectedReason?: string;
    messageCounts?: MessageCountDTO[];
    templateStatuses?: TemplateStatusDTO[];
}

export interface ResultMessageTemplateDetailDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: MessageTemplateDetailDTO;
    messageKey?: string;
    locale?: string;
}

export interface TemplateStatusDTO {
    name?: string;
    status?: string;
}

export interface ResultListMasterTableResponseDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: MasterTableResponseDTO[];
    messageKey?: string;
    locale?: string;
}

export interface MTFieldTypeMapping {
    value?: string;
    label?: string;
    key?: string;
    unique?: boolean;
}

export interface ResultListMTFieldTypeMapping {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: MTFieldTypeMapping[];
    messageKey?: string;
    locale?: string;
}

export interface ResultMapStringMapStringObject {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: Record<string, Record<string, object>>;
    messageKey?: string;
    locale?: string;
}

export interface ResultListIdTemplate {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: IdTemplate[];
    messageKey?: string;
    locale?: string;
}

/** Process Definition ResponseDTO */
export interface PDResponseDTO {
    key?: string;
    label?: string;
    type?: string;
    properties?: FormPropertyDTO[];
}

export interface ResultListPDResponseDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PDResponseDTO[];
    messageKey?: string;
    locale?: string;
}

export interface EasyFormBaseEmailDTO {
    subject?: string;
    body?: string;
    userEmails?: UserEmailDTO[];
}

export interface ResultEasyFormBaseEmailDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: EasyFormBaseEmailDTO;
    messageKey?: string;
    locale?: string;
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

export interface ConversionSupportDestType {
    targetFileType?: string;
    type?: "Document" | "Image" | "Video";
    operation?: Record<string, string>;
}

export interface ResultHashMapStringListConversionSupportDestType {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: Record<string, ConversionSupportDestType[]>;
    messageKey?: string;
    locale?: string;
}

export interface ResultListCompanyChop {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: CompanyChop[];
    messageKey?: string;
    locale?: string;
}

export interface ResultListCaseType {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: CaseType[];
    messageKey?: string;
    locale?: string;
}

export interface ResultListCmmnVersion {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: CmmnVersion[];
    messageKey?: string;
    locale?: string;
}

export interface ResultListPlanItemDefinitionDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PlanItemDefinitionDTO[];
    messageKey?: string;
    locale?: string;
}

export interface ResultListPlanTableFieldDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: PlanTableFieldDTO[];
    messageKey?: string;
    locale?: string;
}

export interface CmmnInstance {
    id?: string;
    procInstId?: string;
    caseId?: string;
    caseTypeId?: string;
    deploymentId?: string;
    cmmnVersionId?: string;
    status?: string;
    createdBy?: string;
    modifiedBy?: string;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
}

export interface ResultListCmmnInstance {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: CmmnInstance[];
    messageKey?: string;
    locale?: string;
}

/** Case Model Data Permission DTO */
export interface CmmnDataFilterPermission {
    /** Bind Business Id */
    bindId?: string;
    /** Bind Business Type */
    bindType?: string;
    /**
     * User Group Id
     * @deprecated
     */
    userGroupId?: string;
    /** metadata */
    metadata?: string;
    /** Condition Type */
    conditionType?: string;
    /** Field Value */
    fieldValue?: string;
    /** Field Mapping Id */
    fieldMappingId?: string;
}

/** Case Model Deployment DTO */
export interface CmmnDeploymentDTO {
    id?: string;
    name?: string;
    category?: string;
    key?: string;
    caseDefinitionId?: string;
    parentDeploymentId?: string;
    /** @format date-time */
    deploymentTime?: string;
    newState?: boolean;
    derivedFrom?: string;
    derivedFromRoot?: string;
    engineVersion?: string;
    inserted?: boolean;
    idPrefix?: string;
    updated?: boolean;
    deleted?: boolean;
    primaryForm?: string;
    caseTables?: CmmnPlanFormDTO[];
    permissions?: CmmnPlanPermissionDTO[];
}

/** Case Model Plan Permission DTO */
export interface CmmnPlanPermissionDTO {
    ref?: string;
    referenceTable?: string;
    name?: string;
    group?: string;
    role?: string;
    dataPermissions?: PlanTableFieldDTO[];
    filterPermissions?: CmmnDataFilterPermission[];
}

export interface ResultCmmnDeploymentDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** Case Model Deployment DTO */
    data?: CmmnDeploymentDTO;
    messageKey?: string;
    locale?: string;
}

export interface ResultListCaseTable {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: CaseTable[];
    messageKey?: string;
    locale?: string;
}

/** Case Model Information DTO */
export interface CaseDefinitionDTO {
    id?: string;
    category?: string;
    name?: string;
    key?: string;
    description?: string;
    /** @format int32 */
    version?: number;
    resourceName?: string;
    deploymentId?: string;
    diagramResourceName?: string;
    tenantId?: string;
    primaryForm?: string;
    planForms?: CmmnPlanFormDTO[];
    planItems?: PlanItemDefinitionDTO[];
    permissions?: CmmnPlanPermissionDTO[];
}

export interface ResultListCaseDefinitionDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: CaseDefinitionDTO[];
    messageKey?: string;
    locale?: string;
}

export interface ResultListCmmnPlanFormDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: CmmnPlanFormDTO[];
    messageKey?: string;
    locale?: string;
}

export interface ResultListUserEventInstanceDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: UserEventInstanceDTO[];
    messageKey?: string;
    locale?: string;
}

/** Case User Event InstanceDTO */
export interface UserEventInstanceDTO {
    id?: string;
    name?: string;
    elementId?: string;
    caseInstanceId?: string;
    caseDefinitionId?: string;
    planItemDefinitionId?: string;
    stageInstanceId?: string;
    state?: string;
}

export interface CaseFormFieldData {
    id?: string;
    name?: string;
    type?: string;
    value?: object;
    masterTable?: string;
    documentType?: string;
    displayField?: string;
    vocabulary?: string;
    require?: string;
    readOnly?: string;
}

/** Case Model Form Data DTO */
export interface CaseInstanceFormDataDTO {
    id?: string;
    name?: string;
    type?: string;
    casetable?: string;
    fields?: PlanTableFieldDTO[];
    rows?: CaseFormFieldData[];
}

export interface ResultCaseInstanceFormDataDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** Case Model Form Data DTO */
    data?: CaseInstanceFormDataDTO;
    messageKey?: string;
    locale?: string;
}

export interface ResultCmmnPlanFormDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** Case Model Plan Form DTO */
    data?: CmmnPlanFormDTO;
    messageKey?: string;
    locale?: string;
}

export interface ResultListCaseInstanceDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: CaseInstanceDTO[];
    messageKey?: string;
    locale?: string;
}

/** case instance activity item */
export interface CmmnActivityItem {
    id?: string;
    name?: string;
    planItemDefinitionId?: string;
    planItemDefinitionType?: string;
    state?: string;
    /** @format date-time */
    completedTime?: string;
    /** @format date-time */
    createTime?: string;
    /** @format date-time */
    endedTime?: string;
    /** @format date-time */
    occurredTime?: string;
}

export interface ResultListCmmnActivityItem {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: CmmnActivityItem[];
    messageKey?: string;
    locale?: string;
}

export interface ResultListCmmnDashboard {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: CmmnDashboard[];
    messageKey?: string;
    locale?: string;
}

export interface ResultListDocumentACLEntryDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: DocumentACLEntryDTO[];
    messageKey?: string;
    locale?: string;
}

export interface ResultListFolderCabinetResponseDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: FolderCabinetResponseDTO[];
    messageKey?: string;
    locale?: string;
}

export interface AzureOcrProfileMapping {
    /** @format int64 */
    id?: number;
    /** @format date-time */
    createdDate?: string;
    /** @format date-time */
    modifiedDate?: string;
    createdBy?: string;
    modifiedBy?: string;
    ocrProfileName?: string;
    scanProfile?: string;
    normalizeSetting?: string;
    scanType?: string;
    status?: string;
}

export interface AzureSettingDTO {
    azureOcrApiKey?: AzureOcrApiKeyDTO;
    azureOcrSetting?: AzureOcrSettingDTO;
    azureOcrProfileMappings?: AzureOcrProfileMapping[];
    ocrTransactionLogs?: PaginationDTOOcrTransactionLogDTO;
}

export interface ResultAzureSettingDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: AzureSettingDTO;
    messageKey?: string;
    locale?: string;
}

export interface ResultUserDetailDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** User detail data transfer object */
    data?: UserDetailDTO;
    messageKey?: string;
    locale?: string;
}

export interface ResultListAclUserInformation {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: AclUserInformation[];
    messageKey?: string;
    locale?: string;
}

export interface ResultRoleDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** Role data transfer object */
    data?: RoleDTO;
    messageKey?: string;
    locale?: string;
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

export interface ResultIdentityRequestDTO {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    /** Identity (Request) */
    data?: IdentityRequestDTO;
    messageKey?: string;
    locale?: string;
}

/** Delete Workflow (Request) */
export interface DeleteWorkflowReq {
    /** Process Business Key */
    businessKey?: string;
    /** Process Instance Id */
    processInstanceId?: string;
    /** Start User Id */
    startUserId?: string;
    /** Assigned User ID */
    assignee?: string;
    /** Relation User ID */
    relationUserId?: string;
    /** Task ID */
    taskId?: string;
    /** Task Delete Reason */
    deleteReason?: string;
}

export interface ResultListFormPropertiesRelation {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: FormPropertiesRelation[];
    messageKey?: string;
    locale?: string;
}

export interface ResultListLanguageEntity {
    result?: boolean;
    /** @format int32 */
    code?: number;
    message?: string;
    data?: LanguageEntity[];
    messageKey?: string;
    locale?: string;
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
        this.instance = axios.create({
            ...axiosConfig,
            baseURL: axiosConfig.baseURL || "http://sit-v3.wclsolution.com",
        });
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
 * @title OpenAPI definition
 * @version v0
 * @baseUrl http://sit-v3.wclsolution.com
 */
export class Admin<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
    api = {
        /**
         * No description
         *
         * @tags Workflow
         * @name GetWorkflowTaskCandidatesbytaskdefinitionkeyDeprecate
         * @summary Retrieve task candidates by process task definition
         * @request GET:/api/docpal/workflow/task/candidatesByTaskDefinitionKey/
         * @deprecated
         */
        getWorkflowTaskCandidatesbytaskdefinitionkeyDeprecate: (
            query: {
                taskDefinitionKey: string;
                processKey: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultSetUserDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/task/candidatesByTaskDefinitionKey/`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name PostWorkflowTaskCandidatesbytaskdefinitionkeyDeprecate
         * @summary Retrieve task candidates by process task definition
         * @request POST:/api/docpal/workflow/task/candidatesByTaskDefinitionKey/
         * @deprecated
         */
        postWorkflowTaskCandidatesbytaskdefinitionkeyDeprecate: (
            query: {
                taskDefinitionKey: string;
                processKey: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultSetUserDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/task/candidatesByTaskDefinitionKey/`,
                method: "POST",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name GetWorkflowTaskCandidatesbytaskdefinitionkey
         * @summary Retrieve task candidates by process task definition
         * @request GET:/api/docpal/workflow/task/candidatesByTaskDefinitionKey
         * @deprecated
         */
        getWorkflowTaskCandidatesbytaskdefinitionkey: (
            query: {
                taskDefinitionKey: string;
                processKey: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultSetUserDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/task/candidatesByTaskDefinitionKey`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name PostWorkflowTaskCandidatesbytaskdefinitionkey
         * @summary Retrieve task candidates by process task definition
         * @request POST:/api/docpal/workflow/task/candidatesByTaskDefinitionKey
         * @deprecated
         */
        postWorkflowTaskCandidatesbytaskdefinitionkey: (
            query: {
                taskDefinitionKey: string;
                processKey: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultSetUserDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/task/candidatesByTaskDefinitionKey`,
                method: "POST",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ContactController
         * @name GetContactgroupIdContactdetaillist
         * @summary Get contact detail list include filter and sort by
         * @request GET:/api/docpal/contactGroup/{id}/contactDetailList
         * @deprecated
         */
        getContactgroupIdContactdetaillist: (id: string, data: any, params: RequestParams = {}) =>
            this.request<ResultListMapStringObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/contactGroup/${id}/contactDetailList`,
                method: "GET",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ContactController
         * @name PostContactgroupIdContactdetaillist
         * @summary Get contact detail list include filter and sort by
         * @request POST:/api/docpal/contactGroup/{id}/contactDetailList
         * @deprecated
         */
        postContactgroupIdContactdetaillist: (id: string, data: any, params: RequestParams = {}) =>
            this.request<ResultListMapStringObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/contactGroup/${id}/contactDetailList`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ContactController
         * @name GetContactgroupList
         * @summary Query all contact group without filter condition
         * @request GET:/api/docpal/contactGroup/list
         * @deprecated
         */
        getContactgroupList: (
            query: {
                requestDTO: ContactGroupRequestDTO;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListContactGroupResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/contactGroup/list`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ContactController
         * @name PostContactgroupList
         * @summary Query all contact group without filter condition
         * @request POST:/api/docpal/contactGroup/list
         * @deprecated
         */
        postContactgroupList: (
            query: {
                requestDTO: ContactGroupRequestDTO;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListContactGroupResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/contactGroup/list`,
                method: "POST",
                query: query,
                ...params,
            }),

        /**
         * @description Get detailed information of an import job by ID
         *
         * @tags Document
         * @name GetRegisteredServerImportjobsId
         * @summary Get import job details
         * @request GET:/api/registered-server/importJobs/{id}
         */
        getRegisteredServerImportjobsId: (id: string, params: RequestParams = {}) =>
            this.request<ResultExternalStorageImportJobDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/registered-server/importJobs/${id}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Document
         * @name PutRegisteredServerImportjobsId
         * @summary Update import job of external storage
         * @request PUT:/api/registered-server/importJobs/{id}
         */
        putRegisteredServerImportjobsId: (id: string, data: ExternalStorageImportJobDTO, params: RequestParams = {}) =>
            this.request<ResultExternalStorageImportJobDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/registered-server/importJobs/${id}`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Document
         * @name GetRegisteredServerContactgroupId
         * @summary Get contact group by id
         * @request GET:/api/registered-server/contactGroup/{id}
         */
        getRegisteredServerContactgroupId: (
            id: string,
            query: {
                operator: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultContactGroupResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/registered-server/contactGroup/${id}`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Document
         * @name PutRegisteredServerContactgroupId
         * @request PUT:/api/registered-server/contactGroup/{id}
         */
        putRegisteredServerContactgroupId: (id: string, data: ContactGroupRequestDTO, params: RequestParams = {}) =>
            this.request<ResultContactGroupResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/registered-server/contactGroup/${id}`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * @description Delete a contact group by ContactGroupId
         *
         * @tags Document
         * @name DeleteRegisteredServerContactgroupId
         * @summary Delete contact group by id
         * @request DELETE:/api/registered-server/contactGroup/{id}
         */
        deleteRegisteredServerContactgroupId: (
            id: string,
            query: {
                operator: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/registered-server/contactGroup/${id}`,
                method: "DELETE",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Document
         * @name PatchRegisteredServerContactgroupId
         * @request PATCH:/api/registered-server/contactGroup/{id}
         */
        patchRegisteredServerContactgroupId: (id: string, data: ContactGroupRequestDTO, params: RequestParams = {}) =>
            this.request<ResultContactGroupResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/registered-server/contactGroup/${id}`,
                method: "PATCH",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Document
         * @name GetRegisteredServerContactgroupIdContactdetailContactdetailid
         * @summary Get contact detail by id
         * @request GET:/api/registered-server/contactGroup/{id}/contactDetail/{contactDetailId}
         */
        getRegisteredServerContactgroupIdContactdetailContactdetailid: (
            id: string,
            contactDetailId: string,
            query: {
                operator: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultMapStringObject, Result | (ResultObject | Result | ResultString)>({
                path: `/registered-server/contactGroup/${id}/contactDetail/${contactDetailId}`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Document
         * @name PutRegisteredServerContactgroupIdContactdetailContactdetailid
         * @summary Edit contact record with the specified information
         * @request PUT:/api/registered-server/contactGroup/{id}/contactDetail/{contactDetailId}
         */
        putRegisteredServerContactgroupIdContactdetailContactdetailid: (
            id: string,
            contactDetailId: string,
            query: {
                operator: string;
            },
            data: Record<string, object>,
            params: RequestParams = {},
        ) =>
            this.request<ResultMapStringObject, Result | (ResultObject | Result | ResultString)>({
                path: `/registered-server/contactGroup/${id}/contactDetail/${contactDetailId}`,
                method: "PUT",
                query: query,
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Document
         * @name DeleteRegisteredServerContactgroupIdContactdetailContactdetailid
         * @summary Delete contact record
         * @request DELETE:/api/registered-server/contactGroup/{id}/contactDetail/{contactDetailId}
         */
        deleteRegisteredServerContactgroupIdContactdetailContactdetailid: (
            id: string,
            contactDetailId: string,
            query: {
                operator: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/registered-server/contactGroup/${id}/contactDetail/${contactDetailId}`,
                method: "DELETE",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags NuxeoAdminController
         * @name GetNuxeoAdminVirtualfolderSetting
         * @request GET:/api/nuxeo/admin/virtualfolder/setting
         * @deprecated
         */
        getNuxeoAdminVirtualfolderSetting: (params: RequestParams = {}) =>
            this.request<ResultListVirtualFolderSettingResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/admin/virtualfolder/setting`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags NuxeoAdminController
         * @name PutNuxeoAdminVirtualfolderSetting
         * @request PUT:/api/nuxeo/admin/virtualfolder/setting
         * @deprecated
         */
        putNuxeoAdminVirtualfolderSetting: (data: VirtualFolderSettingRequestDTO, params: RequestParams = {}) =>
            this.request<ResultVirtualFolderSettingResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/admin/virtualfolder/setting`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags NuxeoAdminController
         * @name PostNuxeoAdminVirtualfolderSetting
         * @request POST:/api/nuxeo/admin/virtualfolder/setting
         * @deprecated
         */
        postNuxeoAdminVirtualfolderSetting: (data: VirtualFolderSettingRequestDTO, params: RequestParams = {}) =>
            this.request<ResultListVirtualFolderSettingResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/admin/virtualfolder/setting`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags NuxeoAdminController
         * @name GetNuxeoAdminSetting
         * @request GET:/api/nuxeo/admin/setting
         * @deprecated
         */
        getNuxeoAdminSetting: (systemId: string, params: RequestParams = {}) =>
            this.request<ResultMapObjectObject, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/admin/setting`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags NuxeoAdminController
         * @name PutNuxeoAdminSetting
         * @request PUT:/api/nuxeo/admin/setting
         * @deprecated
         */
        putNuxeoAdminSetting: (systemId: string, data: string, params: RequestParams = {}) =>
            this.request<ResultString, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/admin/setting`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags NuxeoAdminController
         * @name PostNuxeoAdminSetting
         * @request POST:/api/nuxeo/admin/setting
         * @deprecated
         */
        postNuxeoAdminSetting: (data: SystemSetting, params: RequestParams = {}) =>
            this.request<ResultString, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/admin/setting`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags NuxeoAdminController
         * @name GetNuxeoAdminSettingSystemId
         * @request GET:/api/nuxeo/admin/setting/{system_id}
         * @deprecated
         */
        getNuxeoAdminSettingSystemId: (systemId: string, params: RequestParams = {}) =>
            this.request<ResultMapObjectObject, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/admin/setting/${systemId}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags NuxeoAdminController
         * @name PutNuxeoAdminSettingSystemId
         * @request PUT:/api/nuxeo/admin/setting/{system_id}
         * @deprecated
         */
        putNuxeoAdminSettingSystemId: (systemId: string, data: string, params: RequestParams = {}) =>
            this.request<ResultString, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/admin/setting/${systemId}`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags NuxeoAdminController
         * @name GetNuxeoAdminIcon
         * @request GET:/api/nuxeo/admin/icon
         * @deprecated
         */
        getNuxeoAdminIcon: (
            query: {
                docTypeId: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<string[], Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/admin/icon`,
                method: "GET",
                query: query,
                format: "blob",
                ...params,
            }),

        /**
         * No description
         *
         * @tags NuxeoAdminController
         * @name PutNuxeoAdminIcon
         * @request PUT:/api/nuxeo/admin/icon
         * @deprecated
         */
        putNuxeoAdminIcon: (
            data: {
                id: string;
                image: {
                    direct?: boolean;
                    char?: string;
                    /** @format int32 */
                    short?: number;
                    /** @format int32 */
                    int?: number;
                    /** @format int64 */
                    long?: number;
                    /** @format float */
                    float?: number;
                    /** @format double */
                    double?: number;
                    readOnly?: boolean;
                };
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultString, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/admin/icon`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * @description Get detailed information of an import job by ID
         *
         * @tags ExternalStorageImportJobController
         * @name GetImportjobsId
         * @summary Get import job details
         * @request GET:/api/importJobs/{id}
         * @deprecated
         */
        getImportjobsId: (id: string, params: RequestParams = {}) =>
            this.request<ResultExternalStorageImportJobDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/importJobs/${id}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags ExternalStorageImportJobController
         * @name PutImportjobsId
         * @summary Update import job
         * @request PUT:/api/importJobs/{id}
         * @deprecated
         */
        putImportjobsId: (id: string, data: ExternalStorageImportJobDTO, params: RequestParams = {}) =>
            this.request<ResultExternalStorageImportJobDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/importJobs/${id}`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ExternalStorageImportJobController
         * @name DeleteImportjobsId
         * @summary Delete import job
         * @request DELETE:/api/importJobs/{id}
         * @deprecated
         */
        deleteImportjobsId: (id: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/importJobs/${id}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * @description Retrieve detailed information of a specific external storage
         *
         * @tags ExternalStorageController
         * @name GetExternalstorageId
         * @summary Get External Storage Detail
         * @request GET:/api/externalStorage/{id}
         * @deprecated
         */
        getExternalstorageId: (id: string, params: RequestParams = {}) =>
            this.request<ResultExternalStorageDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/externalStorage/${id}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags ExternalStorageController
         * @name PutExternalstorageId
         * @summary Update an existing external storage configuration
         * @request PUT:/api/externalStorage/{id}
         * @deprecated
         */
        putExternalstorageId: (id: string, data: ExternalStorageDTO, params: RequestParams = {}) =>
            this.request<ResultExternalStorageDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/externalStorage/${id}`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ExternalStorageController
         * @name DeleteExternalstorageId
         * @summary Delete External Storage
         * @request DELETE:/api/externalStorage/{id}
         * @deprecated
         */
        deleteExternalstorageId: (id: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/externalStorage/${id}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags ExternalStorageController
         * @name GetExternalstorageIdProfilesProfileid
         * @summary Get a external profile in external storage id
         * @request GET:/api/externalStorage/{id}/profiles/{profileId}
         * @deprecated
         */
        getExternalstorageIdProfilesProfileid: (id: string, profileId: string, params: RequestParams = {}) =>
            this.request<ResultExternalProfileDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/externalStorage/${id}/profiles/${profileId}`,
                method: "GET",
                ...params,
            }),

        /**
         * @description Update an existing external profile for a specific external storage
         *
         * @tags ExternalStorageController
         * @name PutExternalstorageIdProfilesProfileid
         * @summary Update a external profile in external storage id
         * @request PUT:/api/externalStorage/{id}/profiles/{profileId}
         * @deprecated
         */
        putExternalstorageIdProfilesProfileid: (
            id: string,
            profileId: string,
            data: ExternalProfileDTO,
            params: RequestParams = {},
        ) =>
            this.request<ResultExternalProfileDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/externalStorage/${id}/profiles/${profileId}`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ExternalStorageController
         * @name DeleteExternalstorageIdProfilesProfileid
         * @summary Delete a external profile in external storage id
         * @request DELETE:/api/externalStorage/{id}/profiles/{profileId}
         * @deprecated
         */
        deleteExternalstorageIdProfilesProfileid: (id: string, profileId: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/externalStorage/${id}/profiles/${profileId}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags EventCalendarController
         * @name GetEventCalendarsSettingId
         * @summary Get Event Calendar Setting by ID
         * @request GET:/api/event/calendars/setting/{id}
         * @deprecated
         */
        getEventCalendarsSettingId: (id: string, params: RequestParams = {}) =>
            this.request<ResultEventCalendarSetting, Result | (ResultObject | Result | ResultString)>({
                path: `/event/calendars/setting/${id}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags EventCalendarController
         * @name PutEventCalendarsSettingId
         * @summary Update Event Calendar Setting
         * @request PUT:/api/event/calendars/setting/{id}
         * @deprecated
         */
        putEventCalendarsSettingId: (id: string, data: EventCalendarSetting, params: RequestParams = {}) =>
            this.request<ResultEventCalendarSetting, Result | (ResultObject | Result | ResultString)>({
                path: `/event/calendars/setting/${id}`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags EventCalendarController
         * @name DeleteEventCalendarsSettingId
         * @summary Remove Event Calendar Setting
         * @request DELETE:/api/event/calendars/setting/{id}
         * @deprecated
         */
        deleteEventCalendarsSettingId: (id: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/event/calendars/setting/${id}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags whats-app-controller
         * @name PutWhatsappUpdateWhatsappSetting
         * @request PUT:/api/docpal/whatsapp/update_whatsapp_setting
         */
        putWhatsappUpdateWhatsappSetting: (data: WhatsAppSettingDTO, params: RequestParams = {}) =>
            this.request<ResultVoid, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/whatsapp/update_whatsapp_setting`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ValidationRuleController
         * @name GetValidationRulesVersiondraftid
         * @summary Get validation rule by version:draftId
         * @request GET:/api/docpal/validation-rules/{versionDraftId}
         */
        getValidationRulesVersiondraftid: (versionDraftId: string, params: RequestParams = {}) =>
            this.request<ResultValidationRuleResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/validation-rules/${versionDraftId}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags ValidationRuleController
         * @name PutValidationRulesVersiondraftid
         * @summary Update validation rule by version:draftId
         * @request PUT:/api/docpal/validation-rules/{versionDraftId}
         */
        putValidationRulesVersiondraftid: (
            versionDraftId: string,
            data: ValidationRuleRequestDTO,
            params: RequestParams = {},
        ) =>
            this.request<ResultValidationRuleResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/validation-rules/${versionDraftId}`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags User Management APIs
         * @name PutUserStatus
         * @summary Update User State
         * @request PUT:/api/docpal/user/status
         */
        putUserStatus: (data: ActiveUserRequestDTO, params: RequestParams = {}) =>
            this.request<ResultUserDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/user/status`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags User Management APIs
         * @name PutNuxeoUserStatus
         * @summary Update User State
         * @request PUT:/api/nuxeo/user/status
         */
        putNuxeoUserStatus: (data: ActiveUserRequestDTO, params: RequestParams = {}) =>
            this.request<ResultUserDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/user/status`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags UserSettingController
         * @name GetUserSetting
         * @summary Get User Setting
         * @request GET:/api/docpal/user/setting
         * @deprecated
         */
        getUserSetting: (params: RequestParams = {}) =>
            this.request<ResultString, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/user/setting`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags UserSettingController
         * @name PutUserSetting
         * @request PUT:/api/docpal/user/setting
         * @deprecated
         */
        putUserSetting: (data: string, params: RequestParams = {}) =>
            this.request<ResultString, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/user/setting`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags UserSettingController
         * @name PatchUserSetting
         * @request PATCH:/api/docpal/user/setting
         * @deprecated
         */
        patchUserSetting: (data: string, params: RequestParams = {}) =>
            this.request<ResultString, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/user/setting`,
                method: "PATCH",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags UserSettingController
         * @name GetUserProfileSetting
         * @summary Get Global User Profile Setting
         * @request GET:/api/docpal/user/profile/setting
         * @deprecated
         */
        getUserProfileSetting: (params: RequestParams = {}) =>
            this.request<ResultUserProfileSettingDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/user/profile/setting`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags UserSettingController
         * @name PutUserProfileSetting
         * @summary Save Global User Profile Setting
         * @request PUT:/api/docpal/user/profile/setting
         * @deprecated
         */
        putUserProfileSetting: (data: UserProfileSettingDTO, params: RequestParams = {}) =>
            this.request<ResultUserProfileSettingDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/user/profile/setting`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags UserSettingController
         * @name PostUserProfileSetting
         * @summary Save Global User Profile Setting
         * @request POST:/api/docpal/user/profile/setting
         * @deprecated
         */
        postUserProfileSetting: (data: UserProfileSettingDTO, params: RequestParams = {}) =>
            this.request<ResultUserProfileSettingDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/user/profile/setting`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags EmailController
         * @name PutTemplateEmail
         * @summary Modify (Email Template)
         * @request PUT:/api/docpal/template/email
         * @deprecated
         */
        putTemplateEmail: (data: EmailTemplate, params: RequestParams = {}) =>
            this.request<ResultEmailTemplateResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/template/email`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags EmailController
         * @name PostTemplateEmail
         * @summary Create Email Template
         * @request POST:/api/docpal/template/email
         * @deprecated
         */
        postTemplateEmail: (data: EmailTemplate, params: RequestParams = {}) =>
            this.request<ResultEmailTemplateResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/template/email`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags EmailController
         * @name DeleteTemplateEmail
         * @summary Delete email template by id
         * @request DELETE:/api/docpal/template/email
         * @deprecated
         */
        deleteTemplateEmail: (id: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/template/email`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags EmailController
         * @name PutTemplateEmailTemplate
         * @summary Modify (Email Template)
         * @request PUT:/api/docpal/template/email/template
         * @deprecated
         */
        putTemplateEmailTemplate: (data: EmailTemplate, params: RequestParams = {}) =>
            this.request<ResultEmailTemplateResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/template/email/template`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags EmailController
         * @name PostTemplateEmailTemplate
         * @summary Create Email Template
         * @request POST:/api/docpal/template/email/template
         * @deprecated
         */
        postTemplateEmailTemplate: (data: EmailTemplate, params: RequestParams = {}) =>
            this.request<ResultEmailTemplateResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/template/email/template`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags EmailController
         * @name PutTemplateEmailLayout
         * @summary Update (Email Layout)
         * @request PUT:/api/docpal/template/email/layout
         * @deprecated
         */
        putTemplateEmailLayout: (data: EmailLayout, params: RequestParams = {}) =>
            this.request<ResultEmailLayout, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/template/email/layout`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags EmailController
         * @name PostTemplateEmailLayout
         * @summary Create (Email Layout)
         * @request POST:/api/docpal/template/email/layout
         * @deprecated
         */
        postTemplateEmailLayout: (data: EmailLayout, params: RequestParams = {}) =>
            this.request<ResultEmailLayout, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/template/email/layout`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocumentTemplateController
         * @name PutTemplateDocument
         * @summary Update (Document Template)
         * @request PUT:/api/docpal/template/document
         */
        putTemplateDocument: (data: DocumentTemplateRequestDTO, params: RequestParams = {}) =>
            this.request<ResultDocumentTemplateResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/template/document`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocumentTemplateController
         * @name PostTemplateDocument
         * @summary Create (Document Template)
         * @request POST:/api/docpal/template/document
         */
        postTemplateDocument: (
            query: {
                /** Document Template RequestDTO */
                requestDTO: DocumentTemplateRequestDTO;
            },
            data: {
                /** @format binary */
                file?: File;
                /** @format string */
                name?: string;
                /** @format string */
                fileType?: string;
                /** @format string */
                id?: string;
                /** @format string */
                documentId?: string;
                /** @format map */
                templateVariable?: map;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultDocumentTemplateResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/template/document`,
                method: "POST",
                query: query,
                body: data,
                type: ContentType.FormData,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocumentTemplateController
         * @name PutTemplateDocumentUpload
         * @summary Upload File (Document Template)
         * @request PUT:/api/docpal/template/document/upload
         */
        putTemplateDocumentUpload: (
            query: {
                /** Document Template RequestDTO */
                requestDTO: DocumentTemplateRequestDTO;
            },
            data: {
                /** @format binary */
                file?: File;
                /** @format string */
                id?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultDocumentTemplateResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/template/document/upload`,
                method: "PUT",
                query: query,
                body: data,
                type: ContentType.FormData,
                ...params,
            }),

        /**
         * No description
         *
         * @tags system-feature-controller
         * @name PutSystemfeatureUser
         * @request PUT:/api/docpal/systemfeature/user
         * @deprecated
         */
        putSystemfeatureUser: (data: IdentityRequestDTO, params: RequestParams = {}) =>
            this.request<Result, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/systemfeature/user`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags RetentionPolicyController
         * @name PutPolicyRetentions
         * @summary Modify retention policy
         * @request PUT:/api/docpal/policy/retentions
         */
        putPolicyRetentions: (data: RetentionPolicyRequestDTO, params: RequestParams = {}) =>
            this.request<ResultRetentionPolicyResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/policy/retentions`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags RetentionPolicyController
         * @name PostPolicyRetentions
         * @summary Create a new retention policy
         * @request POST:/api/docpal/policy/retentions
         */
        postPolicyRetentions: (data: RetentionPolicyRequestDTO, params: RequestParams = {}) =>
            this.request<ResultRetentionPolicyResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/policy/retentions`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags HoldPolicyController
         * @name PutPolicyHolds
         * @summary Update hold policy
         * @request PUT:/api/docpal/policy/holds
         */
        putPolicyHolds: (data: HoldPolicy, params: RequestParams = {}) =>
            this.request<ResultHoldPolicy, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/policy/holds`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags HoldPolicyController
         * @name PostPolicyHolds
         * @summary Create a new hold policy
         * @request POST:/api/docpal/policy/holds
         */
        postPolicyHolds: (data: HoldPolicy, params: RequestParams = {}) =>
            this.request<ResultHoldPolicy, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/policy/holds`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags PersonalDashboardController
         * @name PutPersonalDashboardUpdate
         * @request PUT:/api/docpal/personal/dashboard/update
         */
        putPersonalDashboardUpdate: (data: PersonalDashboardRequestDTO, params: RequestParams = {}) =>
            this.request<ResultVoid, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/personal/dashboard/update`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags MasterTableController
         * @name GetMasterTables
         * @summary Get all master tables
         * @request GET:/api/docpal/master/tables
         * @deprecated
         */
        getMasterTables: (params: RequestParams = {}) =>
            this.request<ResultListMasterTableResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/master/tables`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags MasterTableController
         * @name PutMasterTables
         * @summary Update information (Master Table)
         * @request PUT:/api/docpal/master/tables
         * @deprecated
         */
        putMasterTables: (data: MasterTable, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/master/tables`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags MasterTableController
         * @name PostMasterTables
         * @summary Creation (Master Table)
         * @request POST:/api/docpal/master/tables
         * @deprecated
         */
        postMasterTables: (data: MasterTableRequestDTO, params: RequestParams = {}) =>
            this.request<ResultMasterTableResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/master/tables`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags MasterTableController
         * @name PutMasterTablesIdRecord
         * @summary update data (master table)
         * @request PUT:/api/docpal/master/tables/{id}/record
         * @deprecated
         */
        putMasterTablesIdRecord: (id: string, data: MTRecordRequestDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/master/tables/${id}/record`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags MasterTableController
         * @name DeleteMasterTablesIdRecord
         * @summary Delete record
         * @request DELETE:/api/docpal/master/tables/{id}/record
         * @deprecated
         */
        deleteMasterTablesIdRecord: (
            id: string,
            query: {
                recordId: string;
            },
            data: any,
            params: RequestParams = {},
        ) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/master/tables/${id}/record`,
                method: "DELETE",
                query: query,
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags IdTemplateController
         * @name GetIdTemplatesId
         * @summary Get detail of ID template
         * @request GET:/api/docpal/id-templates/{id}
         * @deprecated
         */
        getIdTemplatesId: (id: string, params: RequestParams = {}) =>
            this.request<ResultIdTemplate, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/id-templates/${id}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags IdTemplateController
         * @name PutIdTemplatesId
         * @summary Update ID template
         * @request PUT:/api/docpal/id-templates/{id}
         * @deprecated
         */
        putIdTemplatesId: (id: string, data: IdTemplate, params: RequestParams = {}) =>
            this.request<ResultIdTemplate, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/id-templates/${id}`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags IdTemplateController
         * @name DeleteIdTemplatesId
         * @summary Delete ID template
         * @request DELETE:/api/docpal/id-templates/{id}
         * @deprecated
         */
        deleteIdTemplatesId: (id: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/id-templates/${id}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags FormDesignController
         * @name PutFormDesignDraftidFormresultStatus
         * @request PUT:/api/docpal/form/design/{draftId}/formResult/status
         * @deprecated
         */
        putFormDesignDraftidFormresultStatus: (draftId: string, data: EasyFormResult, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/form/design/${draftId}/formResult/status`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DAMSettingController
         * @name PutDamSetting
         * @request PUT:/api/docpal/dam/setting
         * @deprecated
         */
        putDamSetting: (data: DAMConversionSettingRequestDTO, params: RequestParams = {}) =>
            this.request<Result, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/dam/setting`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ContactController
         * @name GetContactgroupId
         * @summary Get contact group by id
         * @request GET:/api/docpal/contactGroup/{id}
         * @deprecated
         */
        getContactgroupId: (id: string, params: RequestParams = {}) =>
            this.request<ResultContactGroupResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/contactGroup/${id}`,
                method: "GET",
                ...params,
            }),

        /**
         * @description Update contact group with the specified information
         *
         * @tags ContactController
         * @name PutContactgroupId
         * @summary Update contact group
         * @request PUT:/api/docpal/contactGroup/{id}
         * @deprecated
         */
        putContactgroupId: (id: string, data: ContactGroupRequestDTO, params: RequestParams = {}) =>
            this.request<ResultContactGroupResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/contactGroup/${id}`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * @description Delete a contact group by ContactGroupId
         *
         * @tags ContactController
         * @name DeleteContactgroupId
         * @summary Delete contact group by id
         * @request DELETE:/api/docpal/contactGroup/{id}
         * @deprecated
         */
        deleteContactgroupId: (id: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/contactGroup/${id}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * @description Update contact group with the specified information
         *
         * @tags ContactController
         * @name PatchContactgroupId
         * @summary Reference to update contact group
         * @request PATCH:/api/docpal/contactGroup/{id}
         * @deprecated
         */
        patchContactgroupId: (id: string, data: ContactGroupRequestDTO, params: RequestParams = {}) =>
            this.request<ResultContactGroupResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/contactGroup/${id}`,
                method: "PATCH",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ContactController
         * @name GetContactgroupIdContactdetailContactdetailid
         * @summary Get contact detail by id
         * @request GET:/api/docpal/contactGroup/{id}/contactDetail/{contactDetailId}
         * @deprecated
         */
        getContactgroupIdContactdetailContactdetailid: (
            id: string,
            contactDetailId: string,
            params: RequestParams = {},
        ) =>
            this.request<ResultMapStringObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/contactGroup/${id}/contactDetail/${contactDetailId}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags ContactController
         * @name PutContactgroupIdContactdetailContactdetailid
         * @request PUT:/api/docpal/contactGroup/{id}/contactDetail/{contactDetailId}
         * @deprecated
         */
        putContactgroupIdContactdetailContactdetailid: (
            id: string,
            contactDetailId: string,
            data: Record<string, object>,
            params: RequestParams = {},
        ) =>
            this.request<ResultMapStringObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/contactGroup/${id}/contactDetail/${contactDetailId}`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ContactController
         * @name DeleteContactgroupIdContactdetailContactdetailid
         * @summary Delete contact record
         * @request DELETE:/api/docpal/contactGroup/{id}/contactDetail/{contactDetailId}
         * @deprecated
         */
        deleteContactgroupIdContactdetailContactdetailid: (
            id: string,
            contactDetailId: string,
            data: any,
            params: RequestParams = {},
        ) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/contactGroup/${id}/contactDetail/${contactDetailId}`,
                method: "DELETE",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ContactController
         * @name PatchContactgroupIdContactdetailContactdetailid
         * @summary Edit contact record with the specified information
         * @request PATCH:/api/docpal/contactGroup/{id}/contactDetail/{contactDetailId}
         * @deprecated
         */
        patchContactgroupIdContactdetailContactdetailid: (
            id: string,
            contactDetailId: string,
            data: Record<string, object>,
            params: RequestParams = {},
        ) =>
            this.request<ResultMapStringObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/contactGroup/${id}/contactDetail/${contactDetailId}`,
                method: "PATCH",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Profile APIs
         * @name GetCompanyprofilesCompanyid
         * @summary Get company details
         * @request GET:/api/docpal/companyProfiles/{companyId}
         * @deprecated
         */
        getCompanyprofilesCompanyid: (companyId: string, params: RequestParams = {}) =>
            this.request<ResultCompany, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/companyProfiles/${companyId}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Profile APIs
         * @name PutCompanyprofilesCompanyid
         * @summary Update existing company profile
         * @request PUT:/api/docpal/companyProfiles/{companyId}
         * @deprecated
         */
        putCompanyprofilesCompanyid: (companyId: string, data: Company, params: RequestParams = {}) =>
            this.request<ResultCompany, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/companyProfiles/${companyId}`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Profile APIs
         * @name DeleteCompanyprofilesCompanyid
         * @summary Remove a company profile (logical deletion)
         * @request DELETE:/api/docpal/companyProfiles/{companyId}
         * @deprecated
         */
        deleteCompanyprofilesCompanyid: (companyId: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/companyProfiles/${companyId}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Profile APIs
         * @name GetCompanyprofilesCompanyidChopsCompanychopid
         * @summary Retrieve details of a single chop
         * @request GET:/api/docpal/companyProfiles/{companyId}/chops/{companyChopId}
         * @deprecated
         */
        getCompanyprofilesCompanyidChopsCompanychopid: (
            companyId: string,
            companyChopId: string,
            params: RequestParams = {},
        ) =>
            this.request<ResultCompanyChop, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/companyProfiles/${companyId}/chops/${companyChopId}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Profile APIs
         * @name PutCompanyprofilesCompanyidChopsCompanychopid
         * @summary Update existing chop details
         * @request PUT:/api/docpal/companyProfiles/{companyId}/chops/{companyChopId}
         * @deprecated
         */
        putCompanyprofilesCompanyidChopsCompanychopid: (
            companyId: string,
            companyChopId: string,
            query: {
                /** Company Chop (Request) */
                requestDTO: CompanyChopRequestDTO;
            },
            data: {
                /** @format binary */
                file?: File;
                /** @format string */
                name?: string;
                /**
                 * @format string
                 * @default "A"
                 */
                status?: string;
                /**
                 * @format array
                 * @default "ceo,it"
                 */
                roles?: stringArray;
                /**
                 * @format array
                 * @default "admin,test_user"
                 */
                users?: stringArray;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultCompanyChop, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/companyProfiles/${companyId}/chops/${companyChopId}`,
                method: "PUT",
                query: query,
                body: data,
                type: ContentType.FormData,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Profile APIs
         * @name DeleteCompanyprofilesCompanyidChopsCompanychopid
         * @summary Remove a company chop
         * @request DELETE:/api/docpal/companyProfiles/{companyId}/chops/{companyChopId}
         * @deprecated
         */
        deleteCompanyprofilesCompanyidChopsCompanychopid: (
            companyId: string,
            companyChopId: string,
            params: RequestParams = {},
        ) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/companyProfiles/${companyId}/chops/${companyChopId}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Profile APIs
         * @name PutCompanyprofilesCompanyidChopsCompanychopidStatus
         * @summary Change status of a chop
         * @request PUT:/api/docpal/companyProfiles/{companyId}/chops/{companyChopId}/status
         * @deprecated
         */
        putCompanyprofilesCompanyidChopsCompanychopidStatus: (
            companyId: string,
            companyChopId: string,
            data: CompanyChop,
            params: RequestParams = {},
        ) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/companyProfiles/${companyId}/chops/${companyChopId}/status`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTypeController
         * @name GetCaseTypes
         * @summary Retrieve all case types
         * @request GET:/api/docpal/case/types
         * @deprecated
         */
        getCaseTypes: (
            query?: {
                name?: string;
                deployed?: boolean;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListCaseType, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/types`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTypeController
         * @name PutCaseTypes
         * @summary Update case type
         * @request PUT:/api/docpal/case/types
         * @deprecated
         */
        putCaseTypes: (data: CaseType, params: RequestParams = {}) =>
            this.request<ResultCaseType, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/types`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTypeController
         * @name PostCaseTypes
         * @summary Create a new case type
         * @request POST:/api/docpal/case/types
         * @deprecated
         */
        postCaseTypes: (data: CaseType, params: RequestParams = {}) =>
            this.request<ResultCaseType, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/types`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTypeController
         * @name PutCaseTypesEnable
         * @summary Enable or Disable case type
         * @request PUT:/api/docpal/case/types/enable
         * @deprecated
         */
        putCaseTypesEnable: (data: CaseType, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/types/enable`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CmmnDashboardController
         * @name PutCaseDashboard
         * @summary Update case dashboard
         * @request PUT:/api/docpal/case/dashboard
         * @deprecated
         */
        putCaseDashboard: (data: CmmnDashboardRequestDTO, params: RequestParams = {}) =>
            this.request<ResultCmmnDashboardResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/dashboard`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CmmnDashboardController
         * @name PostCaseDashboard
         * @summary Create a new case dashboard
         * @request POST:/api/docpal/case/dashboard
         * @deprecated
         */
        postCaseDashboard: (data: CmmnDashboardRequestDTO, params: RequestParams = {}) =>
            this.request<ResultCmmnDashboardResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/dashboard`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CmmnDashboardController
         * @name PutCaseDashboardStatus
         * @summary Update status of case dashboard
         * @request PUT:/api/docpal/case/dashboard/status
         * @deprecated
         */
        putCaseDashboardStatus: (data: CmmnDashboardRequestDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/dashboard/status`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CalendarController
         * @name PutCalendars
         * @summary Update Event Task
         * @request PUT:/api/docpal/calendars
         * @deprecated
         */
        putCalendars: (data: CalendarTaskReq, params: RequestParams = {}) =>
            this.request<ResultCalendarTaskRespDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/calendars`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CalendarController
         * @name PostCalendars
         * @summary Create a new event task
         * @request POST:/api/docpal/calendars
         * @deprecated
         */
        postCalendars: (data: CalendarTaskReq, params: RequestParams = {}) =>
            this.request<ResultCalendarTaskRespDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/calendars`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags azure-ocr-controller
         * @name PutAzureOcrUpdateocrsetting
         * @request PUT:/api/docpal/azure/ocr/updateOcrSetting
         */
        putAzureOcrUpdateocrsetting: (data: AzureOcrSettingDTO, params: RequestParams = {}) =>
            this.request<ResultVoid, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/azure/ocr/updateOcrSetting`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags azure-ocr-controller
         * @name PutAzureOcrUpdateocrprofilemapping
         * @request PUT:/api/docpal/azure/ocr/updateOcrProfileMapping
         */
        putAzureOcrUpdateocrprofilemapping: (data: ProfileMappingRequestDTO, params: RequestParams = {}) =>
            this.request<ResultVoid, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/azure/ocr/updateOcrProfileMapping`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags azure-ocr-controller
         * @name PutAzureOcrUpdateapisetting
         * @request PUT:/api/docpal/azure/ocr/updateApiSetting
         */
        putAzureOcrUpdateapisetting: (data: AzureOcrApiKeyDTO, params: RequestParams = {}) =>
            this.request<ResultVoid, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/azure/ocr/updateApiSetting`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * @description Update specified role information
         *
         * @tags Role Permission Management
         * @name PutAclRole
         * @summary Update Role
         * @request PUT:/api/docpal/acl/role
         */
        putAclRole: (data: RoleRequest, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/acl/role`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * @description Create a new role
         *
         * @tags Role Permission Management
         * @name PostAclRole
         * @summary Add Role
         * @request POST:/api/docpal/acl/role
         */
        postAclRole: (data: RoleRequest, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/acl/role`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * @description get resource-permission detail by resource-permission.id
         *
         * @tags Resource Permission Management
         * @name GetAclResourcePermissionsId
         * @summary get resource-permission detail by resource-permission.id
         * @request GET:/api/docpal/acl/resource-permissions/{id}
         */
        getAclResourcePermissionsId: (id: string, params: RequestParams = {}) =>
            this.request<ResultResourcePermissionVO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/acl/resource-permissions/${id}`,
                method: "GET",
                ...params,
            }),

        /**
         * @description Update existing resource permission information
         *
         * @tags Resource Permission Management
         * @name PutAclResourcePermissionsId
         * @summary Update Resource Permission
         * @request PUT:/api/docpal/acl/resource-permissions/{id}
         */
        putAclResourcePermissionsId: (id: string, data: ResourcePermissionRequest, params: RequestParams = {}) =>
            this.request<ResultResourcePermissionVO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/acl/resource-permissions/${id}`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * @description unbind permission from resource by resource-permission.id
         *
         * @tags Resource Permission Management
         * @name DeleteAclResourcePermissionsId
         * @summary unbind permission from resource
         * @request DELETE:/api/docpal/acl/resource-permissions/{id}
         */
        deleteAclResourcePermissionsId: (id: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/acl/resource-permissions/${id}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * @description Update the permission level and permission ID list of a resource permission
         *
         * @tags Resource Permission Management
         * @name PutAclResourcePermissionsLevelId
         * @summary Update Permission Level
         * @request PUT:/api/docpal/acl/resource-permissions/level/{id}
         */
        putAclResourcePermissionsLevelId: (
            id: string,
            query: {
                /**
                 * Permission Level (1=Read 2=Read/Write 3=Manage 4=Custom 5=Config Set)
                 * @format int32
                 */
                permissionLevel: number;
                /** Permission ID list (used when permissionLevel=4/5) */
                permissionIds?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultResourcePermissionDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/acl/resource-permissions/level/${id}`,
                method: "PUT",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Manager
         * @name PostWorkflowManagerUpdateVariables
         * @request POST:/api/workflow/manager/update_variables
         * @deprecated
         */
        postWorkflowManagerUpdateVariables: (data: WorkflowInstanceDTO, params: RequestParams = {}) =>
            this.request<Result, Result | (ResultObject | Result | ResultString)>({
                path: `/workflow/manager/update_variables`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Manager
         * @name PostWorkflowManagerStartMiddleWorkflow
         * @request POST:/api/workflow/manager/start_middle_workflow
         * @deprecated
         */
        postWorkflowManagerStartMiddleWorkflow: (data: WorkflowInstanceRequest, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/workflow/manager/start_middle_workflow`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Manager
         * @name PostWorkflowManagerStartFirstWorkflow
         * @request POST:/api/workflow/manager/start_first_workflow
         * @deprecated
         */
        postWorkflowManagerStartFirstWorkflow: (data: WorkflowInstanceDTO, params: RequestParams = {}) =>
            this.request<Result, Result | (ResultObject | Result | ResultString)>({
                path: `/workflow/manager/start_first_workflow`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Manager
         * @name PostWorkflowManagerChangeWorkflowStateForSubmit
         * @request POST:/api/workflow/manager/change_workflow_state_for_submit
         * @deprecated
         */
        postWorkflowManagerChangeWorkflowStateForSubmit: (data: WorkflowInstanceDTO, params: RequestParams = {}) =>
            this.request<Result, Result | (ResultObject | Result | ResultString)>({
                path: `/workflow/manager/change_workflow_state_for_submit`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Manager
         * @name PostWorkflowManagerChangeWorkflowState
         * @request POST:/api/workflow/manager/change_workflow_state
         * @deprecated
         */
        postWorkflowManagerChangeWorkflowState: (data: WorkflowInstanceDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/workflow/manager/change_workflow_state`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Manager
         * @name PostWorkflowManagerCalendars
         * @request POST:/api/workflow/manager/calendars
         * @deprecated
         */
        postWorkflowManagerCalendars: (data: CalendarTaskReq, params: RequestParams = {}) =>
            this.request<ResultString, Result | (ResultObject | Result | ResultString)>({
                path: `/workflow/manager/calendars`,
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
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/verification/permission`,
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
            this.request<PageSearchHistory, Result | (ResultObject | Result | ResultString)>({
                path: `/v1/search-history`,
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
            this.request<SearchHistory, Result | (ResultObject | Result | ResultString)>({
                path: `/v1/search-history`,
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
            this.request<ResultAclUserPermission, Result | (ResultObject | Result | ResultString)>({
                path: `/user/permission`,
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
            this.request<ResultAclUserPermission, Result | (ResultObject | Result | ResultString)>({
                path: `/user/permission`,
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
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/user/permission`,
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
            this.request<ResultAclUserPermission, Result | (ResultObject | Result | ResultString)>({
                path: `/user/permission/replace`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * @description Create a new external storage import job
         *
         * @tags Document
         * @name PostRegisteredServerImportjobs
         * @summary Create new import job of external storage
         * @request POST:/api/registered-server/importJobs
         */
        postRegisteredServerImportjobs: (data: ExternalStorageImportJobDTO, params: RequestParams = {}) =>
            this.request<ResultExternalStorageImportJobDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/registered-server/importJobs`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * @description Create a new external storage import job
         *
         * @tags Document
         * @name PostRegisteredServerImportjobsAdd
         * @summary Create new import job of external storage
         * @request POST:/api/registered-server/importJobs/add
         */
        postRegisteredServerImportjobsAdd: (data: ExternalStorageImportJobDTO, params: RequestParams = {}) =>
            this.request<ResultExternalStorageImportJobDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/registered-server/importJobs/add`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Document
         * @name PostRegisteredServerContactgroup
         * @request POST:/api/registered-server/contactGroup
         */
        postRegisteredServerContactgroup: (data: ContactGroupRequestDTO, params: RequestParams = {}) =>
            this.request<ResultContactGroupResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/registered-server/contactGroup`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Document
         * @name PostRegisteredServerContactgroupIdPermission
         * @request POST:/api/registered-server/contactGroup/{id}/permission
         */
        postRegisteredServerContactgroupIdPermission: (
            id: string,
            query: {
                operator: string;
            },
            data: BasicField,
            params: RequestParams = {},
        ) =>
            this.request<ResultListBasicField, Result | (ResultObject | Result | ResultString)>({
                path: `/registered-server/contactGroup/${id}/permission`,
                method: "POST",
                query: query,
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Document
         * @name PatchRegisteredServerContactgroupIdPermission
         * @request PATCH:/api/registered-server/contactGroup/{id}/permission
         */
        patchRegisteredServerContactgroupIdPermission: (
            id: string,
            query: {
                operator: string;
            },
            data: BasicField,
            params: RequestParams = {},
        ) =>
            this.request<ResultListBasicField, Result | (ResultObject | Result | ResultString)>({
                path: `/registered-server/contactGroup/${id}/permission`,
                method: "PATCH",
                query: query,
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Document
         * @name PostRegisteredServerContactgroupIdNewfields
         * @request POST:/api/registered-server/contactGroup/{id}/newFields
         */
        postRegisteredServerContactgroupIdNewfields: (
            id: string,
            query: {
                operator: string;
            },
            data: ContactAttribute,
            params: RequestParams = {},
        ) =>
            this.request<ResultListContactAttribute, Result | (ResultObject | Result | ResultString)>({
                path: `/registered-server/contactGroup/${id}/newFields`,
                method: "POST",
                query: query,
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Document
         * @name PostRegisteredServerContactgroupIdContactdetail
         * @summary Adding a new contact record
         * @request POST:/api/registered-server/contactGroup/{id}/contactDetail
         */
        postRegisteredServerContactgroupIdContactdetail: (
            id: string,
            query: {
                operator: string;
            },
            data: Record<string, object>,
            params: RequestParams = {},
        ) =>
            this.request<ResultMapStringObject, Result | (ResultObject | Result | ResultString)>({
                path: `/registered-server/contactGroup/${id}/contactDetail`,
                method: "POST",
                query: query,
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Document
         * @name PostRegisteredServerContactgroupIdContactdetaillist
         * @summary Get contact detail list include filter and sort by
         * @request POST:/api/registered-server/contactGroup/{id}/contactDetailList
         */
        postRegisteredServerContactgroupIdContactdetaillist: (
            id: string,
            query: {
                operator: string;
            },
            data: Record<string, object>,
            params: RequestParams = {},
        ) =>
            this.request<ResultListMapStringObject, Result | (ResultObject | Result | ResultString)>({
                path: `/registered-server/contactGroup/${id}/contactDetailList`,
                method: "POST",
                query: query,
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Document
         * @name PostRegisteredServerContactgroupIdContactdetailPage
         * @summary Page query contact detail list
         * @request POST:/api/registered-server/contactGroup/{id}/contactDetail/page
         */
        postRegisteredServerContactgroupIdContactdetailPage: (
            id: string,
            query: {
                operator: string;
            },
            data: ContactRequestDTO,
            params: RequestParams = {},
        ) =>
            this.request<ResultPaginationDTOMapStringObject, Result | (ResultObject | Result | ResultString)>({
                path: `/registered-server/contactGroup/${id}/contactDetail/page`,
                method: "POST",
                query: query,
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Document
         * @name PostRegisteredServerContactgroupIdContactdetailImport
         * @request POST:/api/registered-server/contactGroup/{id}/contactDetail/import
         */
        postRegisteredServerContactgroupIdContactdetailImport: (
            id: string,
            query: {
                requestDTO: ContactImportRequestDTO;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultImportResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/registered-server/contactGroup/${id}/contactDetail/import`,
                method: "POST",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Document
         * @name PostRegisteredServerContactgroupIdContactdetailExport
         * @summary Export contact record for file type include excel, csv, vcf
         * @request POST:/api/registered-server/contactGroup/{id}/contactDetail/export
         */
        postRegisteredServerContactgroupIdContactdetailExport: (
            id: string,
            query: {
                operator: string;
                fileType: string;
            },
            data: object,
            params: RequestParams = {},
        ) =>
            this.request<string[], Result | (ResultObject | Result | ResultString)>({
                path: `/registered-server/contactGroup/${id}/contactDetail/export`,
                method: "POST",
                query: query,
                body: data,
                type: ContentType.FormData,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Document
         * @name PostRegisteredServerContactgroupReadTitle
         * @request POST:/api/registered-server/contactGroup/read/title
         */
        postRegisteredServerContactgroupReadTitle: (
            data: {
                /** @format binary */
                file: File;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultMapStringInteger, Result | (ResultObject | Result | ResultString)>({
                path: `/registered-server/contactGroup/read/title`,
                method: "POST",
                body: data,
                type: ContentType.FormData,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Document
         * @name PostRegisteredServerContactgroupPage
         * @request POST:/api/registered-server/contactGroup/page
         */
        postRegisteredServerContactgroupPage: (data: ContactGroupRequestDTO, params: RequestParams = {}) =>
            this.request<ResultPaginationDTOContactGroupResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/registered-server/contactGroup/page`,
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
            this.request<ResultAccessControlPermission, Result | (ResultObject | Result | ResultString)>({
                path: `/permissions`,
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
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/permissions`,
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
            this.request<ResultListAccessControlPermission, Result | (ResultObject | Result | ResultString)>({
                path: `/permissions/names`,
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
            this.request<ResultListString, Result | (ResultObject | Result | ResultString)>({
                path: `/permissions/entries`,
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
            this.request<ResultAclPermissionDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/permissions/batch/entry`,
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
            this.request<ResultAclUserInformation, Result | (ResultObject | Result | ResultString)>({
                path: `/permission/users`,
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
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/permission/user/relationships`,
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
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/permission/user/relationships`,
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
            this.request<ResultAclUserGroup, Result | (ResultObject | Result | ResultString)>({
                path: `/permission/user/group`,
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
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/permission/user/group`,
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
            this.request<ResultAclUserGroup, Result | (ResultObject | Result | ResultString)>({
                path: `/permission/user/group/users`,
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
            this.request<ResultListAclUserGroup, Result | (ResultObject | Result | ResultString)>({
                path: `/permission/user/group/groups`,
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
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/permission/user/group/add/users`,
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
            this.request<ResultAccessControlEntry, Result | (ResultObject | Result | ResultString)>({
                path: `/permission/entry`,
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
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/permission/entry`,
                method: "DELETE",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Password Controller
         * @name PostPasswordSaveConfig
         * @request POST:/api/password/save-config
         */
        postPasswordSaveConfig: (data: PasswordConfigDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/password/save-config`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags External Share
         * @name PostNuxeoSharePage
         * @request POST:/api/nuxeo/share/page
         */
        postNuxeoSharePage: (data: SharePageRequestDTO, params: RequestParams = {}) =>
            this.request<ResultMapObjectObject, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/share/page`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags External Share
         * @name PostNuxeoShareGet
         * @request POST:/api/nuxeo/share/get
         */
        postNuxeoShareGet: (data: SharePageRequestDTO, params: RequestParams = {}) =>
            this.request<ResultMapObjectObject, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/share/get`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags SmartFolderController
         * @name PostNuxeoSfolderPage
         * @summary Pagination Search (Smart Folder)
         * @request POST:/api/nuxeo/sfolder/page
         * @deprecated
         */
        postNuxeoSfolderPage: (data: SmartFolderRequestDTO, params: RequestParams = {}) =>
            this.request<ResultPaginationDTOSmartFolderResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/sfolder/page`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Versioning Controller
         * @name PostNuxeoRestoreversionDeprecate
         * @summary Restores a document to the input version document
         * @request POST:/api/nuxeo/restoreVersion/
         */
        postNuxeoRestoreversionDeprecate: (data: VersioningRequestDTO, params: RequestParams = {}) =>
            this.request<ResultDocumentDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/restoreVersion/`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Versioning Controller
         * @name PostNuxeoRestoreversion
         * @summary Restores a document to the input version document
         * @request POST:/api/nuxeo/restoreVersion
         */
        postNuxeoRestoreversion: (data: VersioningRequestDTO, params: RequestParams = {}) =>
            this.request<ResultDocumentDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/restoreVersion`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Identity
         * @name PostNuxeoIdentityUsers
         * @summary List users
         * @request POST:/api/nuxeo/identity/users
         */
        postNuxeoIdentityUsers: (data: IdentityRequestDTO, params: RequestParams = {}) =>
            this.request<ResultListUserDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/identity/users`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Identity
         * @name PostNuxeoIdentityUsersBatchDelete
         * @summary Batch delete users
         * @request POST:/api/nuxeo/identity/users/batch/delete
         */
        postNuxeoIdentityUsersBatchDelete: (data: BatchDeleteUserDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/identity/users/batch/delete`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Identity
         * @name PostNuxeoIdentityUsersBatchAddGroups
         * @summary Batch add groups to users
         * @request POST:/api/nuxeo/identity/users/batch/add/groups
         */
        postNuxeoIdentityUsersBatchAddGroups: (data: BatchAddUsersToGroupsDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/identity/users/batch/add/groups`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Identity
         * @name PostNuxeoIdentityUser
         * @request POST:/api/nuxeo/identity/user
         */
        postNuxeoIdentityUser: (data: IdentityRequestDTO, params: RequestParams = {}) =>
            this.request<ResultUserDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/identity/user`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Identity
         * @name DeleteNuxeoIdentityUser
         * @request DELETE:/api/nuxeo/identity/user
         */
        deleteNuxeoIdentityUser: (data: IdentityRequestDTO, params: RequestParams = {}) =>
            this.request<ResultUserDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/identity/user`,
                method: "DELETE",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Identity
         * @name PatchNuxeoIdentityUser
         * @summary Update User
         * @request PATCH:/api/nuxeo/identity/user
         */
        patchNuxeoIdentityUser: (data: IdentityRequestDTO, params: RequestParams = {}) =>
            this.request<ResultUserDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/identity/user`,
                method: "PATCH",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Identity
         * @name PostNuxeoIdentityUserBatchRemoveGroups
         * @summary Batch remove groups from user
         * @request POST:/api/nuxeo/identity/user/batch/remove/groups
         */
        postNuxeoIdentityUserBatchRemoveGroups: (data: UserBatchAddGroupsDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/identity/user/batch/remove/groups`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Identity
         * @name PostNuxeoIdentityUserBatchAddGroups
         * @summary Batch add groups to user
         * @request POST:/api/nuxeo/identity/user/batch/add/groups
         */
        postNuxeoIdentityUserBatchAddGroups: (data: UserBatchAddGroupsDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/identity/user/batch/add/groups`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Identity
         * @name PostNuxeoIdentityMembership
         * @request POST:/api/nuxeo/identity/membership
         */
        postNuxeoIdentityMembership: (data: IdentityRequestDTO, params: RequestParams = {}) =>
            this.request<ResultUserDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/identity/membership`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Identity
         * @name DeleteNuxeoIdentityMembership
         * @summary Remove user from group
         * @request DELETE:/api/nuxeo/identity/membership
         */
        deleteNuxeoIdentityMembership: (data: IdentityRequestDTO, params: RequestParams = {}) =>
            this.request<ResultIdentityRequestDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/identity/membership`,
                method: "DELETE",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Identity
         * @name PostNuxeoIdentityMember
         * @request POST:/api/nuxeo/identity/member
         */
        postNuxeoIdentityMember: (data: IdentityRequestDTO, params: RequestParams = {}) =>
            this.request<ResultListUserDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/identity/member`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Identity
         * @name PostNuxeoIdentityMembergroup
         * @request POST:/api/nuxeo/identity/memberGroup
         */
        postNuxeoIdentityMembergroup: (data: IdentityRequestDTO, params: RequestParams = {}) =>
            this.request<ResultListGroupDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/identity/memberGroup`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Identity
         * @name PostNuxeoIdentityGroups
         * @request POST:/api/nuxeo/identity/groups
         */
        postNuxeoIdentityGroups: (params: RequestParams = {}) =>
            this.request<ResultListGroupDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/identity/groups`,
                method: "POST",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Identity
         * @name PostNuxeoIdentityGroupsActive
         * @request POST:/api/nuxeo/identity/groups/active
         */
        postNuxeoIdentityGroupsActive: (params: RequestParams = {}) =>
            this.request<ResultListGroupDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/identity/groups/active`,
                method: "POST",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Identity
         * @name PostNuxeoIdentityGroup
         * @request POST:/api/nuxeo/identity/group
         */
        postNuxeoIdentityGroup: (data: IdentityRequestDTO, params: RequestParams = {}) =>
            this.request<ResultGroupDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/identity/group`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Identity
         * @name DeleteNuxeoIdentityGroup
         * @request DELETE:/api/nuxeo/identity/group
         */
        deleteNuxeoIdentityGroup: (data: IdentityRequestDTO, params: RequestParams = {}) =>
            this.request<ResultGroupDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/identity/group`,
                method: "DELETE",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Identity
         * @name PatchNuxeoIdentityGroup
         * @summary Update group
         * @request PATCH:/api/nuxeo/identity/group
         */
        patchNuxeoIdentityGroup: (data: IdentityRequestDTO, params: RequestParams = {}) =>
            this.request<ResultGroupDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/identity/group`,
                method: "PATCH",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Identity
         * @name PostNuxeoIdentityGroupBatchRemoveUsers
         * @summary Batch remove users from group
         * @request POST:/api/nuxeo/identity/group/batch/remove/users
         */
        postNuxeoIdentityGroupBatchRemoveUsers: (data: GroupBatchAddUsersDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/identity/group/batch/remove/users`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Identity
         * @name PostNuxeoIdentityGroupBatchAddUsers
         * @summary Batch add users to group
         * @request POST:/api/nuxeo/identity/group/batch/add/users
         */
        postNuxeoIdentityGroupBatchAddUsers: (data: GroupBatchAddUsersDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/identity/group/batch/add/users`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Identity
         * @name PostNuxeoIdentityGetlicenseusernumandactivecount
         * @request POST:/api/nuxeo/identity/getLicenseUserNumAndActiveCount
         */
        postNuxeoIdentityGetlicenseusernumandactivecount: (params: RequestParams = {}) =>
            this.request<ResultMapObjectObject, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/identity/getLicenseUserNumAndActiveCount`,
                method: "POST",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Identity
         * @name PostNuxeoIdentityGetkeycloakallusers
         * @summary Find all active user list
         * @request POST:/api/nuxeo/identity/getKeyCloakAllUsers
         */
        postNuxeoIdentityGetkeycloakallusers: (params: RequestParams = {}) =>
            this.request<ResultListUserDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/identity/getKeyCloakAllUsers`,
                method: "POST",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Identity
         * @name PostNuxeoIdentityGetallusers
         * @request POST:/api/nuxeo/identity/getAllUsers
         */
        postNuxeoIdentityGetallusers: (data: IdentityRequestDTO, params: RequestParams = {}) =>
            this.request<ResultMapStringObject, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/identity/getAllUsers`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Identity
         * @name PostNuxeoIdentityUserPage
         * @request POST:/api/nuxeo/identity/user/page
         */
        postNuxeoIdentityUserPage: (data: IdentityRequestDTO, params: RequestParams = {}) =>
            this.request<ResultMapStringObject, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/identity/user/page`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Identity
         * @name PostNuxeoIdentityCopyusers
         * @request POST:/api/nuxeo/identity/copyUsers
         */
        postNuxeoIdentityCopyusers: (params: RequestParams = {}) =>
            this.request<ResultListUserDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/identity/copyUsers`,
                method: "POST",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Versioning Controller
         * @name PostNuxeoGetversionsDeprecate
         * @summary Get All Versions by Document ID or Path
         * @request POST:/api/nuxeo/getVersions/
         */
        postNuxeoGetversionsDeprecate: (data: VersioningRequestDTO, params: RequestParams = {}) =>
            this.request<ResultMapStringInstant, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/getVersions/`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Versioning Controller
         * @name PostNuxeoGetversions
         * @summary Get All Versions by Document ID or Path
         * @request POST:/api/nuxeo/getVersions
         */
        postNuxeoGetversions: (data: VersioningRequestDTO, params: RequestParams = {}) =>
            this.request<ResultMapStringInstant, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/getVersions`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Versioning Controller
         * @name PostNuxeoGetversionnum
         * @summary Get Version Number by Document ID or Path
         * @request POST:/api/nuxeo/getVersionNum
         */
        postNuxeoGetversionnum: (data: VersioningRequestDTO, params: RequestParams = {}) =>
            this.request<ResultString, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/getVersionNum`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Versioning Controller
         * @name PostNuxeoGetspecificversion
         * @summary Get Specific Version by Document ID/Path and version number
         * @request POST:/api/nuxeo/getSpecificVersion
         */
        postNuxeoGetspecificversion: (data: VersioningRequestDTO, params: RequestParams = {}) =>
            this.request<ResultDocumentDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/getSpecificVersion`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Versioning Controller
         * @name PostNuxeoGetlatestversion
         * @summary Get Latest Version by Document ID or Path
         * @request POST:/api/nuxeo/getLatestVersion
         */
        postNuxeoGetlatestversion: (data: VersioningRequestDTO, params: RequestParams = {}) =>
            this.request<ResultDocumentDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/getLatestVersion`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Document
         * @name GetNuxeoDocument
         * @summary Get document information
         * @request GET:/api/nuxeo/document
         */
        getNuxeoDocument: (
            query: {
                idOrPath: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultDocumentDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/document`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Document
         * @name PostNuxeoDocument
         * @summary Get a document
         * @request POST:/api/nuxeo/document
         */
        postNuxeoDocument: (data: DocumentRequestDTO, params: RequestParams = {}) =>
            this.request<ResultDocumentDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/document`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Document
         * @name PostNuxeoDocumentQueryauditevent
         * @request POST:/api/nuxeo/document/queryAuditEvent
         */
        postNuxeoDocumentQueryauditevent: (data: OpenObserveAuditLogSearchRequest, params: RequestParams = {}) =>
            this.request<
                ResultPaginationDTOAuditTemplateResponseExtendDTO,
                Result | (ResultObject | Result | ResultString)
            >({
                path: `/nuxeo/document/queryAuditEvent`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Document
         * @name PostNuxeoDocumentPreview
         * @summary Preview document content
         * @request POST:/api/nuxeo/document/preview
         */
        postNuxeoDocumentPreview: (data: DocumentRequestDTO, params: RequestParams = {}) =>
            this.request<string[], Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/document/preview`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Document
         * @name PostNuxeoDocumentOfficeCreate
         * @request POST:/api/nuxeo/document/office/create
         */
        postNuxeoDocumentOfficeCreate: (data: OfficeFileCreateDTO, params: RequestParams = {}) =>
            this.request<ResultString, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/document/office/create`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Document
         * @name PostNuxeoDocumentDownload
         * @summary Download a document file
         * @request POST:/api/nuxeo/document/download
         */
        postNuxeoDocumentDownload: (data: DocumentRequestDTO, params: RequestParams = {}) =>
            this.request<string[], Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/document/download`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Document
         * @name PostNuxeoDocumentCreate
         * @summary Create a document
         * @request POST:/api/nuxeo/document/create
         */
        postNuxeoDocumentCreate: (
            query: {
                /** Document (Request) */
                documentRequestDTO: DocumentRequestDTO;
            },
            data: {
                /** @format binary */
                file?: File;
                /** @format string */
                type?: string;
                /** @format string */
                idOrPath?: string;
                /** @format string */
                name?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultDocumentDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/document/create`,
                method: "POST",
                query: query,
                body: data,
                type: ContentType.FormData,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Document
         * @name PostNuxeoDocumentCreatefolders
         * @summary Create folders
         * @request POST:/api/nuxeo/document/createFolders
         */
        postNuxeoDocumentCreatefolders: (data: DocumentRequestDTO, params: RequestParams = {}) =>
            this.request<ResultDocumentDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/document/createFolders`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Document
         * @name PostNuxeoDocumentCreatedocument
         * @summary Create a document
         * @request POST:/api/nuxeo/document/createDocument
         */
        postNuxeoDocumentCreatedocument: (
            data: {
                /** @format binary */
                file?: File;
                /** @format string */
                ""?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultDocumentDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/document/createDocument`,
                method: "POST",
                body: data,
                type: ContentType.FormData,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Document
         * @name PostNuxeoDocumentCreateStructure
         * @request POST:/api/nuxeo/document/create/structure
         */
        postNuxeoDocumentCreateStructure: (data: DocStructureRequestDTO, params: RequestParams = {}) =>
            this.request<ResultDocStructureResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/document/create/structure`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Document
         * @name PostNuxeoDocumentCollections
         * @summary Get collections of a document is in
         * @request POST:/api/nuxeo/document/collections
         */
        postNuxeoDocumentCollections: (data: DocumentRequestDTO, params: RequestParams = {}) =>
            this.request<ResultListDocumentDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/document/collections`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Document
         * @name PostNuxeoDocumentCollectionsDeprecate
         * @summary Get collections of a document is in
         * @request POST:/api/nuxeo/document/collections/
         */
        postNuxeoDocumentCollectionsDeprecate: (data: DocumentRequestDTO, params: RequestParams = {}) =>
            this.request<ResultListDocumentDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/document/collections/`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Document
         * @name PostNuxeoDocumentChildrenThumbnail
         * @summary Get children of thumbnail Result
         * @request POST:/api/nuxeo/document/children/thumbnail
         */
        postNuxeoDocumentChildrenThumbnail: (data: DocumentRequestDTO, params: RequestParams = {}) =>
            this.request<ResultPaginationDTODocumentThumbnailDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/document/children/thumbnail`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Document
         * @name PostNuxeoDocumentChildrenThumbnailV2
         * @summary Get children of thumbnail Result
         * @request POST:/api/nuxeo/document/children/thumbnail_v2
         */
        postNuxeoDocumentChildrenThumbnailV2: (data: DocumentRequestDTO, params: RequestParams = {}) =>
            this.request<ResultPaginationDTODocumentThumbnailDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/document/children/thumbnail_v2`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Document
         * @name PostNuxeoDocumentBreadcrumb
         * @summary Get document breadcrumb
         * @request POST:/api/nuxeo/document/breadcrumb
         */
        postNuxeoDocumentBreadcrumb: (data: DocumentRequestDTO, params: RequestParams = {}) =>
            this.request<ResultListDocumentDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/document/breadcrumb`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags NuxeoAdminController
         * @name PostNuxeoAdminInitworkflowdefinition
         * @request POST:/api/nuxeo/admin/initWorkflowDefinition
         * @deprecated
         */
        postNuxeoAdminInitworkflowdefinition: (params: RequestParams = {}) =>
            this.request<ResultVoid, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/admin/initWorkflowDefinition`,
                method: "POST",
                ...params,
            }),

        /**
         * No description
         *
         * @tags NuxeoAdminController
         * @name GetNuxeoAdminFeature
         * @request GET:/api/nuxeo/admin/feature
         * @deprecated
         */
        getNuxeoAdminFeature: (
            query: {
                tenantId: string;
                terminalName?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultMapStringMapStringBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/admin/feature`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags NuxeoAdminController
         * @name PostNuxeoAdminFeature
         * @request POST:/api/nuxeo/admin/feature
         * @deprecated
         */
        postNuxeoAdminFeature: (data: FeatureSaveRequestDTO, params: RequestParams = {}) =>
            this.request<ResultMapStringMapStringBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/admin/feature`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags NuxeoAdminController
         * @name GetNuxeoAdminActiveUsersConfiguration
         * @summary Query active users configuration
         * @request GET:/api/nuxeo/admin/active-users/configuration
         * @deprecated
         */
        getNuxeoAdminActiveUsersConfiguration: (
            query: {
                tenantId: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultAccountPropertyDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/admin/active-users/configuration`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags NuxeoAdminController
         * @name PostNuxeoAdminActiveUsersConfiguration
         * @summary Save active users configuration
         * @request POST:/api/nuxeo/admin/active-users/configuration
         * @deprecated
         */
        postNuxeoAdminActiveUsersConfiguration: (data: ActiveUserConfigDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/admin/active-users/configuration`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags MessageQueue
         * @name PostMessageQueueMessageidResubmit
         * @summary ReInvoke business
         * @request POST:/api/message/queue/{messageId}/reSubmit
         */
        postMessageQueueMessageidResubmit: (
            messageId: string,
            query?: {
                businessId?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/message/queue/${messageId}/reSubmit`,
                method: "POST",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags MessageQueue
         * @name PostMessageQueuePage
         * @summary The Page of BusinessResultRecord
         * @request POST:/api/message/queue/page
         */
        postMessageQueuePage: (
            query: {
                /** @format int32 */
                pageNum: number;
                /** @format int32 */
                pageSize: number;
                orderBy: string;
                isDesc: boolean;
            },
            data: BusinessResultRecord,
            params: RequestParams = {},
        ) =>
            this.request<ResultPageBusinessResultRecord, Result | (ResultObject | Result | ResultString)>({
                path: `/message/queue/page`,
                method: "POST",
                query: query,
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ExternalStorageImportJobController
         * @name PostImportjobsPage
         * @summary Paginated query for import jobs
         * @request POST:/api/importJobs/page
         * @deprecated
         */
        postImportjobsPage: (data: ExternalStorageImportJobRequestDTO, params: RequestParams = {}) =>
            this.request<
                ResultPaginationDTOExternalStorageImportJobDTO,
                Result | (ResultObject | Result | ResultString)
            >({
                path: `/importJobs/page`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ExternalStorageImportJobController
         * @name PostImportjobsJobqueueFirst
         * @summary Place a task in the first queue
         * @request POST:/api/importJobs/jobQueue/first
         * @deprecated
         */
        postImportjobsJobqueueFirst: (data: ExternalStorageImportJobRequestDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/importJobs/jobQueue/first`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * @description Save a external storage import job
         *
         * @tags ExternalStorageImportJobController
         * @name PostImportjobsAdd
         * @summary Save import job record
         * @request POST:/api/importJobs/add
         * @deprecated
         */
        postImportjobsAdd: (data: ExternalStorageImportJobDTO, params: RequestParams = {}) =>
            this.request<ResultExternalStorageImportJobDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/importJobs/add`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ExternalStorageImportJobController
         * @name GetImportjobs
         * @summary Get all import jobs list
         * @request GET:/api/importJobs
         * @deprecated
         */
        getImportjobs: (
            query: {
                /** External Storage Import Job Request */
                requestDTO: ExternalStorageImportJobRequestDTO;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListExternalStorageImportJobDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/importJobs`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * @description Save a external storage import job
         *
         * @tags ExternalStorageImportJobController
         * @name PostImportjobs
         * @summary Save import job record
         * @request POST:/api/importJobs
         * @deprecated
         */
        postImportjobs: (data: ExternalStorageImportJobDTO, params: RequestParams = {}) =>
            this.request<ResultExternalStorageImportJobDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/importJobs`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ExternalStorageController
         * @name GetExternalstorage
         * @summary Get External Storage Detail List
         * @request GET:/api/externalStorage
         * @deprecated
         */
        getExternalstorage: (
            query: {
                /** External Storage Request DTO */
                externalStorageVO: ExternalStorageRequestDTO;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListExternalStorageDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/externalStorage`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * @description Create a new external storage configuration
         *
         * @tags ExternalStorageController
         * @name PostExternalstorage
         * @summary Create a new external storage
         * @request POST:/api/externalStorage
         * @deprecated
         */
        postExternalstorage: (data: ExternalStorageDTO, params: RequestParams = {}) =>
            this.request<ResultExternalStorageDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/externalStorage`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * @description Create a new external profile for a specific external storage
         *
         * @tags ExternalStorageController
         * @name PostExternalstorageIdProfiles
         * @summary Create a new external profile in external storage id
         * @request POST:/api/externalStorage/{id}/profiles
         * @deprecated
         */
        postExternalstorageIdProfiles: (id: string, data: ExternalProfileDTO, params: RequestParams = {}) =>
            this.request<ResultExternalProfileDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/externalStorage/${id}/profiles`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ExternalStorageController
         * @name PostExternalstorageIdProfilesPage
         * @summary Paging query external storage profiles by external storage id
         * @request POST:/api/externalStorage/{id}/profiles/page
         * @deprecated
         */
        postExternalstorageIdProfilesPage: (id: string, data: ExternalProfileRequestDTO, params: RequestParams = {}) =>
            this.request<ResultPaginationDTOExternalProfileDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/externalStorage/${id}/profiles/page`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ExternalStorageController
         * @name PostExternalstorageIdConnectionTest
         * @summary Testing SMB connection is correct
         * @request POST:/api/externalStorage/{id}/connection/test
         * @deprecated
         */
        postExternalstorageIdConnectionTest: (id: string, data: Record<string, string>, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/externalStorage/${id}/connection/test`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * @description Create a new external profile output record
         *
         * @tags ExternalStorageController
         * @name PostExternalstorageProfilesProfileidOutputrecord
         * @summary Create External Profile Output
         * @request POST:/api/externalStorage/profiles/{profileId}/outputRecord
         * @deprecated
         */
        postExternalstorageProfilesProfileidOutputrecord: (
            profileId: string,
            data: Record<string, object>,
            params: RequestParams = {},
        ) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/externalStorage/profiles/${profileId}/outputRecord`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ExternalStorageController
         * @name GetExternalstorageProfilesProfileidOutputrecordOutputrecordid
         * @request GET:/api/externalStorage/profiles/{profileId}/outputRecord/{outputRecordId}
         * @deprecated
         */
        getExternalstorageProfilesProfileidOutputrecordOutputrecordid: (
            profileId: string,
            outputRecordId: string,
            params: RequestParams = {},
        ) =>
            this.request<ResultMapStringObject, Result | (ResultObject | Result | ResultString)>({
                path: `/externalStorage/profiles/${profileId}/outputRecord/${outputRecordId}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags ExternalStorageController
         * @name PostExternalstorageProfilesProfileidOutputrecordOutputrecordid
         * @summary Duplicate (Copy) a exist External Profile Output
         * @request POST:/api/externalStorage/profiles/{profileId}/outputRecord/{outputRecordId}
         * @deprecated
         */
        postExternalstorageProfilesProfileidOutputrecordOutputrecordid: (
            profileId: string,
            outputRecordId: string,
            params: RequestParams = {},
        ) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/externalStorage/profiles/${profileId}/outputRecord/${outputRecordId}`,
                method: "POST",
                ...params,
            }),

        /**
         * No description
         *
         * @tags ExternalStorageController
         * @name DeleteExternalstorageProfilesProfileidOutputrecordOutputrecordid
         * @request DELETE:/api/externalStorage/profiles/{profileId}/outputRecord/{outputRecordId}
         * @deprecated
         */
        deleteExternalstorageProfilesProfileidOutputrecordOutputrecordid: (
            profileId: string,
            outputRecordId: string,
            params: RequestParams = {},
        ) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/externalStorage/profiles/${profileId}/outputRecord/${outputRecordId}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags ExternalStorageController
         * @name PatchExternalstorageProfilesProfileidOutputrecordOutputrecordid
         * @summary Update a external profile output record
         * @request PATCH:/api/externalStorage/profiles/{profileId}/outputRecord/{outputRecordId}
         * @deprecated
         */
        patchExternalstorageProfilesProfileidOutputrecordOutputrecordid: (
            profileId: string,
            outputRecordId: string,
            data: Record<string, object>,
            params: RequestParams = {},
        ) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/externalStorage/profiles/${profileId}/outputRecord/${outputRecordId}`,
                method: "PATCH",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ExternalStorageController
         * @name PostExternalstoragePage
         * @summary Paging query External Storage
         * @request POST:/api/externalStorage/page
         * @deprecated
         */
        postExternalstoragePage: (data: ExternalStorageRequestDTO, params: RequestParams = {}) =>
            this.request<ResultPaginationDTOExternalStorageDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/externalStorage/page`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags EventCalendarController
         * @name PostEventCalendarsSetting
         * @summary Create Event Calendar Setting
         * @request POST:/api/event/calendars/setting
         * @deprecated
         */
        postEventCalendarsSetting: (data: EventCalendarSetting, params: RequestParams = {}) =>
            this.request<ResultEventCalendarSetting, Result | (ResultObject | Result | ResultString)>({
                path: `/event/calendars/setting`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags EventCalendarController
         * @name PostEventCalendarsSettingPage
         * @summary Paging query Event Calendar Settings
         * @request POST:/api/event/calendars/setting/page
         * @deprecated
         */
        postEventCalendarsSettingPage: (data: BasePageRequest, params: RequestParams = {}) =>
            this.request<ResultPaginationDTOEventCalendarSetting, Result | (ResultObject | Result | ResultString)>({
                path: `/event/calendars/setting/page`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name PostDocpaltypeSettings
         * @summary Creation DocPalType
         * @request POST:/api/docpalType/settings
         */
        postDocpaltypeSettings: (data: DocPalTypeRequestDTO, params: RequestParams = {}) =>
            this.request<ResultDocPalTypeResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpalType/settings`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name PostDocpaltypeSettingsPage
         * @summary Pagination search
         * @request POST:/api/docpalType/settings/page
         */
        postDocpaltypeSettingsPage: (data: DocPalTypeRequestDTO, params: RequestParams = {}) =>
            this.request<ResultPaginationDTODocPalType, Result | (ResultObject | Result | ResultString)>({
                path: `/docpalType/settings/page`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name GetDocpaltypeSettingsNameNameRelated
         * @summary Query all related docpal type of current docpal type
         * @request GET:/api/docpalType/settings/name/{name}/related
         */
        getDocpaltypeSettingsNameNameRelated: (name: string, params: RequestParams = {}) =>
            this.request<ResultListDocPalTypeRelated, Result | (ResultObject | Result | ResultString)>({
                path: `/docpalType/settings/name/${name}/related`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name PostDocpaltypeSettingsNameNameRelated
         * @summary Create/Bound related docpal type into current docpal type
         * @request POST:/api/docpalType/settings/name/{name}/related
         */
        postDocpaltypeSettingsNameNameRelated: (name: string, data: DocPalTypeRelated, params: RequestParams = {}) =>
            this.request<ResultDocPalTypeRelated, Result | (ResultObject | Result | ResultString)>({
                path: `/docpalType/settings/name/${name}/related`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name PatchDocpaltypeSettingsNameNameRelated
         * @summary Update related docpal type
         * @request PATCH:/api/docpalType/settings/name/{name}/related
         */
        patchDocpaltypeSettingsNameNameRelated: (name: string, data: DocPalTypeRelated, params: RequestParams = {}) =>
            this.request<ResultDocPalTypeRelated, Result | (ResultObject | Result | ResultString)>({
                path: `/docpalType/settings/name/${name}/related`,
                method: "PATCH",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name PostDocpaltypeSettingsMetadataV2Query
         * @request POST:/api/docpalType/settings/metadata-v2/query
         */
        postDocpaltypeSettingsMetadataV2Query: (data: QueryMetadataRequestDTO, params: RequestParams = {}) =>
            this.request<ResultPaginationDTOMetadataResponseVO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpalType/settings/metadata-v2/query`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name PostDocpaltypeSettingsMetadataV2ExportMetadataCvs
         * @request POST:/api/docpalType/settings/metadata-v2/export-metadata-cvs
         */
        postDocpaltypeSettingsMetadataV2ExportMetadataCvs: (
            data: QueryMetadataRequestDTO,
            params: RequestParams = {},
        ) =>
            this.request<void, Result | (ResultObject | Result | ResultString)>({
                path: `/docpalType/settings/metadata-v2/export-metadata-cvs`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name PostDocpaltypeSettingsMetadataV2Duplicate
         * @request POST:/api/docpalType/settings/metadata-v2/duplicate
         */
        postDocpaltypeSettingsMetadataV2Duplicate: (data: MetaDataDefinitionRequestDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpalType/settings/metadata-v2/duplicate`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name PostDocpaltypeSettingsMetadataV2Create
         * @request POST:/api/docpalType/settings/metadata-v2/create
         */
        postDocpaltypeSettingsMetadataV2Create: (data: MetaDataDefinitionRequestDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpalType/settings/metadata-v2/create`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name PostDocpaltypeSettingsDocpalTypeV2Update
         * @request POST:/api/docpalType/settings/docpal-type-v2/update
         */
        postDocpaltypeSettingsDocpalTypeV2Update: (data: DocpalTypeRequestV2DTO, params: RequestParams = {}) =>
            this.request<ResultDocPalTypeResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpalType/settings/docpal-type-v2/update`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name PostDocpaltypeSettingsDocpalTypeV2UpdateMetadataDocpaltypeid
         * @request POST:/api/docpalType/settings/docpal-type-v2/update-metadata/{docpalTypeId}
         */
        postDocpaltypeSettingsDocpalTypeV2UpdateMetadataDocpaltypeid: (
            docpalTypeId: string,
            data: AddMetadataRequestDTO,
            params: RequestParams = {},
        ) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpalType/settings/docpal-type-v2/update-metadata/${docpalTypeId}`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name PostDocpaltypeSettingsDocpalTypeV2Query
         * @request POST:/api/docpalType/settings/docpal-type-v2/query
         */
        postDocpaltypeSettingsDocpalTypeV2Query: (data: DocPalTypeRequestDTO, params: RequestParams = {}) =>
            this.request<ResultPaginationDTODocumentTypeResponseVO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpalType/settings/docpal-type-v2/query`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name PostDocpaltypeSettingsDocpalTypeV2MoveMetadata
         * @request POST:/api/docpalType/settings/docpal-type-v2/move-metadata
         */
        postDocpaltypeSettingsDocpalTypeV2MoveMetadata: (data: MoveMetadataRequestDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpalType/settings/docpal-type-v2/move-metadata`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name PostDocpaltypeSettingsDocpalTypeV2MetadataQuery
         * @request POST:/api/docpalType/settings/docpal-type-v2/metadata/query
         */
        postDocpaltypeSettingsDocpalTypeV2MetadataQuery: (data: QueryMetadataRequestDTO, params: RequestParams = {}) =>
            this.request<ResultDocpalTypeDetailResponseVO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpalType/settings/docpal-type-v2/metadata/query`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name PostDocpaltypeSettingsDocpalTypeV2ExportMetadataCvs
         * @request POST:/api/docpalType/settings/docpal-type-v2/export-metadata-cvs
         */
        postDocpaltypeSettingsDocpalTypeV2ExportMetadataCvs: (
            data: QueryMetadataRequestDTO,
            params: RequestParams = {},
        ) =>
            this.request<void, Result | (ResultObject | Result | ResultString)>({
                path: `/docpalType/settings/docpal-type-v2/export-metadata-cvs`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name PostDocpaltypeSettingsDocpalTypeV2ExportDocpalTypeCvs
         * @request POST:/api/docpalType/settings/docpal-type-v2/export-docpal-type-cvs
         */
        postDocpaltypeSettingsDocpalTypeV2ExportDocpalTypeCvs: (
            data: DocPalTypeRequestDTO,
            params: RequestParams = {},
        ) =>
            this.request<void, Result | (ResultObject | Result | ResultString)>({
                path: `/docpalType/settings/docpal-type-v2/export-docpal-type-cvs`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name PostDocpaltypeSettingsDocpalTypeV2Duplicate
         * @request POST:/api/docpalType/settings/docpal-type-v2/duplicate
         */
        postDocpaltypeSettingsDocpalTypeV2Duplicate: (data: DocpalTypeRequestV2DTO, params: RequestParams = {}) =>
            this.request<ResultDocPalTypeResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpalType/settings/docpal-type-v2/duplicate`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name PostDocpaltypeSettingsDocpalTypeV2Create
         * @request POST:/api/docpalType/settings/docpal-type-v2/create
         */
        postDocpaltypeSettingsDocpalTypeV2Create: (data: DocpalTypeRequestV2DTO, params: RequestParams = {}) =>
            this.request<ResultDocPalTypeResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpalType/settings/docpal-type-v2/create`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name PostDocpaltypeSettingsDocpalTypeV2AddMetadataDocpaltypeid
         * @request POST:/api/docpalType/settings/docpal-type-v2/add-metadata/{docpalTypeId}
         */
        postDocpaltypeSettingsDocpalTypeV2AddMetadataDocpaltypeid: (
            docpalTypeId: string,
            data: AddMetadataRequestDTO,
            params: RequestParams = {},
        ) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpalType/settings/docpal-type-v2/add-metadata/${docpalTypeId}`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name PostDocpaltypeSettingsCopyName
         * @summary Copy DocPal Type
         * @request POST:/api/docpalType/settings/copy/{name}
         * @deprecated
         */
        postDocpaltypeSettingsCopyName: (name: string, data: DocPalTypeRequestDTO, params: RequestParams = {}) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpalType/settings/copy/${name}`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name PostDocpaltypeSettingsCheckDuplicate
         * @summary Check duplicate name of docpal type
         * @request POST:/api/docpalType/settings/check/duplicate
         */
        postDocpaltypeSettingsCheckDuplicate: (data: DocPalTypeRequestDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpalType/settings/check/duplicate`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name PostDocpaltypeSettingsBatchMetadata
         * @summary Batch add multiple metadata into docpal type
         * @request POST:/api/docpalType/settings/batch/metadata
         * @deprecated
         */
        postDocpaltypeSettingsBatchMetadata: (data: DocPalTypeRequestDTO, params: RequestParams = {}) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpalType/settings/batch/metadata`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name PostDocpaltypeSettingsAddMetadata
         * @summary Add a new metadata into docpal type
         * @request POST:/api/docpalType/settings/add/metadata
         */
        postDocpaltypeSettingsAddMetadata: (data: DocPalTypeMetadataRequestDTO, params: RequestParams = {}) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpalType/settings/add/metadata`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Version Controller
         * @name PostWorkflowVersionVersionidDeploy
         * @summary Promote to Production - Deploy the current version to production for used it
         * @request POST:/api/docpal/workflow/version/{versionId}/deploy
         * @deprecated
         */
        postWorkflowVersionVersionidDeploy: (
            versionId: string,
            query: {
                requestDTO: ProcessDefinitionDraftRequestDTO;
            },
            data: {
                /** @format binary */
                file?: File;
                /** @format string */
                jsonValue?: stringJson;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultProcessDefinitionResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/version/${versionId}/deploy`,
                method: "POST",
                query: query,
                body: data,
                type: ContentType.FormData,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Version Controller
         * @name PostWorkflowVersionReplaceDraft
         * @summary Save to Draft
         * @request POST:/api/docpal/workflow/version/replace/draft
         * @deprecated
         */
        postWorkflowVersionReplaceDraft: (data: ProcessVersionRequestDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/version/replace/draft`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Version Controller
         * @name PostWorkflowVersionPage
         * @summary Pagination search of process definition version
         * @request POST:/api/docpal/workflow/version/page
         * @deprecated
         */
        postWorkflowVersionPage: (data: ProcessVersionRequestDTO, params: RequestParams = {}) =>
            this.request<ResultPaginationDTOProcessDefinitionVersion, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/version/page`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Version Controller
         * @name PostWorkflowVersionNew
         * @summary Save New Version of process definition
         * @request POST:/api/docpal/workflow/version/new
         * @deprecated
         */
        postWorkflowVersionNew: (
            query: {
                /** Process Definition Version RequestDTO */
                requestDTO: ProcessVersionRequestDTO;
            },
            data: {
                /** @format binary */
                file?: File;
                /** @format string */
                draftId?: string;
                /** @format string */
                jsonValue?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultProcessDefinitionVersion, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/version/new`,
                method: "POST",
                query: query,
                body: data,
                type: ContentType.FormData,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name PostWorkflowUpdatemetadatamapping
         * @request POST:/api/docpal/workflow/updateMetadataMapping
         */
        postWorkflowUpdatemetadatamapping: (data: DocumentTypeMetadataMapping, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/updateMetadataMapping`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name PostWorkflowTasks
         * @request POST:/api/docpal/workflow/tasks
         * @deprecated
         */
        postWorkflowTasks: (data: WorkflowRequestDTO, params: RequestParams = {}) =>
            this.request<ResultListTaskDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/tasks`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name PostWorkflowTasksUser
         * @request POST:/api/docpal/workflow/tasks/user
         * @deprecated
         */
        postWorkflowTasksUser: (data: WorkflowRequestDTO, params: RequestParams = {}) =>
            this.request<ResultPaginationDTOTaskDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/tasks/user`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name PostWorkflowTaskUnclaim
         * @request POST:/api/docpal/workflow/task/unclaim
         * @deprecated
         */
        postWorkflowTaskUnclaim: (data: WorkflowRequestDTO, params: RequestParams = {}) =>
            this.request<ResultTaskDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/task/unclaim`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name PostWorkflowTaskMove
         * @request POST:/api/docpal/workflow/task/move
         * @deprecated
         */
        postWorkflowTaskMove: (data: WorkflowRequestDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/task/move`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name PostWorkflowTaskClaim
         * @request POST:/api/docpal/workflow/task/claim
         * @deprecated
         */
        postWorkflowTaskClaim: (data: WorkflowRequestDTO, params: RequestParams = {}) =>
            this.request<ResultTaskDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/task/claim`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name PostWorkflowSavemetadatamapping
         * @request POST:/api/docpal/workflow/saveMetadataMapping
         */
        postWorkflowSavemetadatamapping: (data: DocPalDocumentTypeMapping, params: RequestParams = {}) =>
            this.request<ResultListDocumentTypeMetadataMapping, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/saveMetadataMapping`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name PostWorkflowSavedocumenttypeprofile
         * @request POST:/api/docpal/workflow/saveDocumentTypeProfile
         */
        postWorkflowSavedocumenttypeprofile: (data: DocumentTypeProfileSettingRequest, params: RequestParams = {}) =>
            this.request<ResultDocumentTypeProfileSetting, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/saveDocumentTypeProfile`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name PostWorkflowRetryFailWorkflow
         * @request POST:/api/docpal/workflow/retry_fail_workflow
         * @deprecated
         */
        postWorkflowRetryFailWorkflow: (data: WorkflowRetryManagerDTO, params: RequestParams = {}) =>
            this.request<Result, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/retry_fail_workflow`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name PostWorkflowQueryWorkflowRetryPage
         * @request POST:/api/docpal/workflow/query_workflow_retry_page
         * @deprecated
         */
        postWorkflowQueryWorkflowRetryPage: (data: QueryWorkflowJobRequest, params: RequestParams = {}) =>
            this.request<ResultPaginationDTOWorkflowRetryManagerDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/query_workflow_retry_page`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name PostWorkflowProperties
         * @request POST:/api/docpal/workflow/properties
         * @deprecated
         */
        postWorkflowProperties: (data: WorkflowRequestDTO, params: RequestParams = {}) =>
            this.request<ResultListFormPropertyDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/properties`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name PostWorkflowProcessModel
         * @summary Retrieve process model (BPMN) XML
         * @request POST:/api/docpal/workflow/process/model
         * @deprecated
         */
        postWorkflowProcessModel: (data: WorkflowRequestDTO, params: RequestParams = {}) =>
            this.request<string[], Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/process/model`,
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
         * @summary Retrieve process definition
         * @request POST:/api/docpal/workflow/process/list
         * @deprecated
         */
        postWorkflowProcessList: (data: WorkflowRequestDTO, params: RequestParams = {}) =>
            this.request<ResultListProcessDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/process/list`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name PostWorkflowProcessInstance
         * @request POST:/api/docpal/workflow/process/instance
         * @deprecated
         */
        postWorkflowProcessInstance: (data: WorkflowRequestDTO, params: RequestParams = {}) =>
            this.request<ResultListInstanceDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/process/instance`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Process Definition Controller
         * @name PostWorkflowProcessDefinitionValidate
         * @summary Validate BPMN 2.0 XML file whether process definition grammatical
         * @request POST:/api/docpal/workflow/process/definition/validate
         * @deprecated
         */
        postWorkflowProcessDefinitionValidate: (
            query: {
                /** @format binary */
                file: File;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/process/definition/validate`,
                method: "POST",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Process Definition Controller
         * @name PostWorkflowProcessDefinitionUpload
         * @summary Create new workflow (process definition)
         * @request POST:/api/docpal/workflow/process/definition/upload
         * @deprecated
         */
        postWorkflowProcessDefinitionUpload: (
            query: {
                requestDTO: ProcessDefinitionDraftRequestDTO;
            },
            data: {
                /** @format binary */
                file?: File;
                /** @format string */
                draftId?: string;
                /** @format string */
                name?: string;
                /** @format string */
                key?: string;
                /** @format boolean */
                isDraft?: boolean;
                /**
                 * @format string
                 * @default "V1"
                 */
                versionId?: string;
                /** @format string */
                jsonValue?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultProcessDefinitionResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/process/definition/upload`,
                method: "POST",
                query: query,
                body: data,
                type: ContentType.FormData,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Process Definition Controller
         * @name PostWorkflowProcessDefinitionSave
         * @summary Save workflow of someone version
         * @request POST:/api/docpal/workflow/process/definition/save
         * @deprecated
         */
        postWorkflowProcessDefinitionSave: (
            query: {
                requestDTO: ProcessDefinitionDraftRequestDTO;
            },
            data: {
                /** @format binary */
                file?: File;
                /** @format string */
                draftId?: string;
                /** @format string */
                name?: string;
                /** @format string */
                key?: string;
                /** @format boolean */
                isDraft?: boolean;
                /** @format string */
                versionId?: string;
                /** @format string */
                jsonValue?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultProcessDefinitionResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/process/definition/save`,
                method: "POST",
                query: query,
                body: data,
                type: ContentType.FormData,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Process Definition Controller
         * @name PostWorkflowProcessDefinitionParse
         * @summary Validate BPMN 2.0 XML file whether process definition grammatical
         * @request POST:/api/docpal/workflow/process/definition/parse
         * @deprecated
         */
        postWorkflowProcessDefinitionParse: (
            query: {
                /** @format binary */
                file: File;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/process/definition/parse`,
                method: "POST",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Process Definition Controller
         * @name GetWorkflowProcessDefinitionDraftDraftidJson
         * @summary Get json of process definition
         * @request GET:/api/docpal/workflow/process/definition/draft/{draftId}/json
         * @deprecated
         */
        getWorkflowProcessDefinitionDraftDraftidJson: (draftId: string, params: RequestParams = {}) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/process/definition/draft/${draftId}/json`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Process Definition Controller
         * @name PostWorkflowProcessDefinitionDraftDraftidJson
         * @summary Update json of process definition, please use string json
         * @request POST:/api/docpal/workflow/process/definition/draft/{draftId}/json
         * @deprecated
         */
        postWorkflowProcessDefinitionDraftDraftidJson: (
            draftId: string,
            data: ProcessDefinitionDraft,
            params: RequestParams = {},
        ) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/process/definition/draft/${draftId}/json`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Process Definition Controller
         * @name PostWorkflowProcessDefinitionDraftDraftidImport
         * @summary Import zip file for create new process definition
         * @request POST:/api/docpal/workflow/process/definition/draft/{draftId}/import
         * @deprecated
         */
        postWorkflowProcessDefinitionDraftDraftidImport: (
            draftId: string,
            query: {
                /** @format binary */
                file: File;
                versionNumber?: string;
            },
            data: {
                /** @format string */
                draftId?: string;
                /** @format binary */
                file?: File;
                versionNumber?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultProcessDefinitionResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/process/definition/draft/${draftId}/import`,
                method: "POST",
                query: query,
                body: data,
                type: ContentType.FormData,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Process Definition Controller
         * @name PostWorkflowProcessDefinitionDraftDraftidExport
         * @summary Export process definition
         * @request POST:/api/docpal/workflow/process/definition/draft/{draftId}/export
         * @deprecated
         */
        postWorkflowProcessDefinitionDraftDraftidExport: (
            draftId: string,
            query?: {
                versionNumber?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<string[], Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/process/definition/draft/${draftId}/export`,
                method: "POST",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Process Definition Controller
         * @name PostWorkflowProcessDefinitionDraftPage
         * @summary Pagination search of process definition model
         * @request POST:/api/docpal/workflow/process/definition/draft/page
         * @deprecated
         */
        postWorkflowProcessDefinitionDraftPage: (data: ProcessDefinitionRequestDTO, params: RequestParams = {}) =>
            this.request<ResultPaginationDTOProcessDefinitionDraft, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/process/definition/draft/page`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Process Definition Controller
         * @name PostWorkflowProcessDefinitionCopyCopiedkey
         * @summary Copy workflow (process definition)
         * @request POST:/api/docpal/workflow/process/definition/copy/{copiedKey}
         * @deprecated
         */
        postWorkflowProcessDefinitionCopyCopiedkey: (
            copiedKey: string,
            data: WorkflowDraftRequestDTO,
            params: RequestParams = {},
        ) =>
            this.request<ResultProcessDefinitionResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/process/definition/copy/${copiedKey}`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Process Definition Controller
         * @name PostWorkflowProcessDefinitionCopyFromFlowable
         * @summary Data Patch API
         * @request POST:/api/docpal/workflow/process/definition/copy/from/flowable
         * @deprecated
         */
        postWorkflowProcessDefinitionCopyFromFlowable: (data: string[], params: RequestParams = {}) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/process/definition/copy/from/flowable`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Process Definition Controller
         * @name PostWorkflowProcessDefinitionActiveDraftid
         * @request POST:/api/docpal/workflow/process/definition/active/{draftId}
         * @deprecated
         */
        postWorkflowProcessDefinitionActiveDraftid: (draftId: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/process/definition/active/${draftId}`,
                method: "POST",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name PostWorkflowProcessConditionValidate
         * @request POST:/api/docpal/workflow/process/condition/validate
         * @deprecated
         */
        postWorkflowProcessConditionValidate: (data: ConditionValidationReq, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/process/condition/validate`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name PostWorkflowDeletemetadatamapping
         * @request POST:/api/docpal/workflow/deleteMetadataMapping
         */
        postWorkflowDeletemetadatamapping: (data: DocumentTypeMetadataMapping, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/deleteMetadataMapping`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name PostWorkflowChecknameortitle
         * @request POST:/api/docpal/workflow/checkNameOrTitle
         */
        postWorkflowChecknameortitle: (data: Record<string, string>, params: RequestParams = {}) =>
            this.request<ResultString, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/checkNameOrTitle`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags whats-app-controller
         * @name PostWhatsappOverview
         * @request POST:/api/docpal/whatsapp/overview
         */
        postWhatsappOverview: (data: BasePageRequest, params: RequestParams = {}) =>
            this.request<ResultWhatsAppOverviewResponse, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/whatsapp/overview`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags whats-app-controller
         * @name PostWhatsappFindWhatsappLog
         * @request POST:/api/docpal/whatsapp/find_whatsapp_log
         */
        postWhatsappFindWhatsappLog: (data: BasePageRequest, params: RequestParams = {}) =>
            this.request<ResultPaginationDTOWhatsAppLogDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/whatsapp/find_whatsapp_log`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Watermark Template
         * @name PostWatermarkTemplates
         * @summary Create watermark template and watermark setting list
         * @request POST:/api/docpal/watermark/templates
         * @deprecated
         */
        postWatermarkTemplates: (data: WMKTemplateRequestDTO, params: RequestParams = {}) =>
            this.request<ResultWMKTemplateRequestDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/watermark/templates`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Watermark Template
         * @name PatchWatermarkTemplates
         * @summary Modify watermark template and watermark setting list
         * @request PATCH:/api/docpal/watermark/templates
         * @deprecated
         */
        patchWatermarkTemplates: (data: WMKTemplateRequestDTO, params: RequestParams = {}) =>
            this.request<ResultWMKTemplateRequestDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/watermark/templates`,
                method: "PATCH",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Watermark Template
         * @name PostWatermarkTemplatesPage
         * @summary Watermark template page query
         * @request POST:/api/docpal/watermark/templates/page
         * @deprecated
         */
        postWatermarkTemplatesPage: (
            query: {
                /** @format int32 */
                pageNum: number;
                /** @format int32 */
                pageSize: number;
            },
            data: WMKTemplateRequestDTO,
            params: RequestParams = {},
        ) =>
            this.request<ResultPageWatermarkSettingsTemplate, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/watermark/templates/page`,
                method: "POST",
                query: query,
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Watermark Template
         * @name PostWatermarkTemplatesAppend
         * @request POST:/api/docpal/watermark/templates/append
         * @deprecated
         */
        postWatermarkTemplatesAppend: (data: WMKTemplateRequestDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/watermark/templates/append`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Watermark Settings
         * @name PostWatermarkSettings
         * @summary create single watermark settings
         * @request POST:/api/docpal/watermark/settings
         * @deprecated
         */
        postWatermarkSettings: (data: WatermarkSettingsDTO, params: RequestParams = {}) =>
            this.request<ResultWatermarkSettingsDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/watermark/settings`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Watermark Settings
         * @name PatchWatermarkSettings
         * @summary update single watermark settings
         * @request PATCH:/api/docpal/watermark/settings
         * @deprecated
         */
        patchWatermarkSettings: (data: WatermarkSettingsDTO, params: RequestParams = {}) =>
            this.request<ResultWatermarkSettingsDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/watermark/settings`,
                method: "PATCH",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ValidationRuleController
         * @name PostValidationRules
         * @summary Create validation rule
         * @request POST:/api/docpal/validation-rules
         */
        postValidationRules: (data: ValidationRuleRequestDTO, params: RequestParams = {}) =>
            this.request<ResultValidationRuleResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/validation-rules`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags User Management APIs
         * @name PostUserPage
         * @request POST:/api/docpal/user/page
         */
        postUserPage: (data: IdentityRequestDTO, params: RequestParams = {}) =>
            this.request<ResultMapStringObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/user/page`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags User Management APIs
         * @name PostUserBatchActive
         * @summary Batch update user active status
         * @request POST:/api/docpal/user/batch/active
         */
        postUserBatchActive: (data: UserBatchActiveDTO, params: RequestParams = {}) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/user/batch/active`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags User Management APIs
         * @name PostNuxeoUserBatchActive
         * @summary Batch update user active status
         * @request POST:/api/nuxeo/user/batch/active
         */
        postNuxeoUserBatchActive: (data: UserBatchActiveDTO, params: RequestParams = {}) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/user/batch/active`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags EmailController
         * @name PostTemplateEmailPage
         * @summary Pagination search (Email Template)
         * @request POST:/api/docpal/template/email/page
         * @deprecated
         */
        postTemplateEmailPage: (data: EmailTemplateRequestDTO, params: RequestParams = {}) =>
            this.request<ResultPaginationDTOEmailTemplate, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/template/email/page`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags EmailController
         * @name PostTemplateEmailTemplatePage
         * @summary Pagination search (Email Template)
         * @request POST:/api/docpal/template/email/template/page
         * @deprecated
         */
        postTemplateEmailTemplatePage: (data: EmailTemplateRequestDTO, params: RequestParams = {}) =>
            this.request<ResultPaginationDTOEmailTemplate, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/template/email/template/page`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags EmailController
         * @name PostTemplateEmailSend
         * @summary Send test email using email template
         * @request POST:/api/docpal/template/email/send
         * @deprecated
         */
        postTemplateEmailSend: (data: MailSendRequest, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/template/email/send`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags EmailController
         * @name PostTemplateEmailSendCustomize
         * @summary Send Customize Email
         * @request POST:/api/docpal/template/email/send/customize
         * @deprecated
         */
        postTemplateEmailSendCustomize: (data: MailSendRequest, params: RequestParams = {}) =>
            this.request<ResultSendEmailResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/template/email/send/customize`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags EmailController
         * @name PostTemplateEmailLayoutPage
         * @summary Pagination search (Email Layout)
         * @request POST:/api/docpal/template/email/layout/page
         * @deprecated
         */
        postTemplateEmailLayoutPage: (data: EmailLayoutRequestDTO, params: RequestParams = {}) =>
            this.request<ResultPaginationDTOEmailLayout, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/template/email/layout/page`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocumentTemplateController
         * @name PostTemplateDocumentParse
         * @summary Parsing PDF File for get data
         * @request POST:/api/docpal/template/document/parse
         */
        postTemplateDocumentParse: (
            query: {
                /** @format binary */
                file: File;
                id?: string;
            },
            data: {
                /** @format binary */
                file?: File;
                /** @format string */
                id?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultMapStringObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/template/document/parse`,
                method: "POST",
                query: query,
                body: data,
                type: ContentType.FormData,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocumentTemplateController
         * @name PostTemplateDocumentPage
         * @summary Pagination search (Document Template)
         * @request POST:/api/docpal/template/document/page
         */
        postTemplateDocumentPage: (data: DocumentTemplateRequestDTO, params: RequestParams = {}) =>
            this.request<ResultPaginationDTODocumentTemplate, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/template/document/page`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocumentTemplateController
         * @name PostTemplateDocumentGenerateFile
         * @summary Download Test File (Use Document Template)
         * @request POST:/api/docpal/template/document/generate/file
         */
        postTemplateDocumentGenerateFile: (data: DocumentTemplateRequestDTO, params: RequestParams = {}) =>
            this.request<string[], Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/template/document/generate/file`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocumentTemplateController
         * @name PostTemplateDocumentGeneratePdf
         * @request POST:/api/docpal/template/document/generate/PDF
         */
        postTemplateDocumentGeneratePdf: (
            query: {
                /** Document Template RequestDTO */
                requestDTO: DocumentTemplateRequestDTO;
            },
            params: RequestParams = {},
        ) =>
            this.request<string[], Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/template/document/generate/PDF`,
                method: "POST",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags system-feature-controller
         * @name PostSystemfeatureUsersMembers
         * @request POST:/api/docpal/systemfeature/users/members
         * @deprecated
         */
        postSystemfeatureUsersMembers: (data: UserDTO, params: RequestParams = {}) =>
            this.request<Result, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/systemfeature/users/members`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags system-feature-controller
         * @name PostSystemfeatureCreateuser
         * @request POST:/api/docpal/systemfeature/createUser
         * @deprecated
         */
        postSystemfeatureCreateuser: (data: IdentityRequestDTO, params: RequestParams = {}) =>
            this.request<Result, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/systemfeature/createUser`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags form-properties-relation-controller
         * @name PostRelationUpdatelanguage
         * @request POST:/api/docpal/relation/updateLanguage
         * @deprecated
         */
        postRelationUpdatelanguage: (data: LanguageEntity, params: RequestParams = {}) =>
            this.request<ResultLanguageEntity, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/relation/updateLanguage`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags form-properties-relation-controller
         * @name PostRelationSave
         * @request POST:/api/docpal/relation/save
         * @deprecated
         */
        postRelationSave: (data: FormPropertiesRelation, params: RequestParams = {}) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/relation/save`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags form-properties-relation-controller
         * @name PostRelationErrorenumSave
         * @request POST:/api/docpal/relation/errorEnum/save
         * @deprecated
         */
        postRelationErrorenumSave: (data: ErrorEnumEntityDTO, params: RequestParams = {}) =>
            this.request<Result, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/relation/errorEnum/save`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags form-properties-relation-controller
         * @name PostRelationErrorenumQuerybyentity
         * @request POST:/api/docpal/relation/errorEnum/queryByEntity
         * @deprecated
         */
        postRelationErrorenumQuerybyentity: (data: ErrorEnumEntityDTO, params: RequestParams = {}) =>
            this.request<Result, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/relation/errorEnum/queryByEntity`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags form-properties-relation-controller
         * @name PostRelationTasksQuerybyentityDeprecate
         * @request POST:/api/docpal/relation/tasks/queryByEntity/
         * @deprecated
         */
        postRelationTasksQuerybyentityDeprecate: (data: ErrorEnumEntityDTO, params: RequestParams = {}) =>
            this.request<Result, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/relation/tasks/queryByEntity/`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags form-properties-relation-controller
         * @name PostRelationDeletelanguage
         * @request POST:/api/docpal/relation/deleteLanguage
         * @deprecated
         */
        postRelationDeletelanguage: (
            query: {
                /** @format int64 */
                id: number;
            },
            params: RequestParams = {},
        ) =>
            this.request<Result, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/relation/deleteLanguage`,
                method: "POST",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags form-properties-relation-controller
         * @name PostRelationAddlanguage
         * @request POST:/api/docpal/relation/addLanguage
         * @deprecated
         */
        postRelationAddlanguage: (data: LanguageEntity, params: RequestParams = {}) =>
            this.request<ResultLanguageEntity, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/relation/addLanguage`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags RetentionPolicyController
         * @name PostPolicyRetentionsPage
         * @summary Pagination search
         * @request POST:/api/docpal/policy/retentions/page
         */
        postPolicyRetentionsPage: (data: RetentionPolicyRequestDTO, params: RequestParams = {}) =>
            this.request<ResultPaginationDTORetentionPolicy, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/policy/retentions/page`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags RetentionPolicyController
         * @name PostPolicyRetentionsInit
         * @request POST:/api/docpal/policy/retentions/init
         */
        postPolicyRetentionsInit: (params: RequestParams = {}) =>
            this.request<ResultVoid, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/policy/retentions/init`,
                method: "POST",
                ...params,
            }),

        /**
         * No description
         *
         * @tags HoldPolicyController
         * @name PostPolicyHoldsPage
         * @summary Pagination search
         * @request POST:/api/docpal/policy/holds/page
         */
        postPolicyHoldsPage: (data: HoldPolicyRequestDTO, params: RequestParams = {}) =>
            this.request<ResultPaginationDTOHoldPolicy, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/policy/holds/page`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags HoldPolicyController
         * @name PostPolicyHoldsInit
         * @request POST:/api/docpal/policy/holds/init
         */
        postPolicyHoldsInit: (params: RequestParams = {}) =>
            this.request<ResultVoid, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/policy/holds/init`,
                method: "POST",
                ...params,
            }),

        /**
         * No description
         *
         * @tags PersonalDashboardController
         * @name PostPersonalDashboard
         * @request POST:/api/docpal/personal/dashboard
         */
        postPersonalDashboard: (data: PersonalDashboardRequestDTO, params: RequestParams = {}) =>
            this.request<ResultPaginationDTOPersonalDashboard, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/personal/dashboard`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags PersonalDashboardController
         * @name PostPersonalDashboardSave
         * @request POST:/api/docpal/personal/dashboard/save
         */
        postPersonalDashboardSave: (data: PersonalDashboardRequestDTO, params: RequestParams = {}) =>
            this.request<ResultPersonalDashboard, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/personal/dashboard/save`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags OAuth2SettingController
         * @name GetOauth2Setting
         * @summary Query mail OAuth2.0 Setting of current login user
         * @request GET:/api/docpal/oauth2/setting
         * @deprecated
         */
        getOauth2Setting: (params: RequestParams = {}) =>
            this.request<ResultOAuth2SettingRequestDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/oauth2/setting`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags OAuth2SettingController
         * @name PostOauth2Setting
         * @summary Obtain authorization url of OAuth2.0
         * @request POST:/api/docpal/oauth2/setting
         * @deprecated
         */
        postOauth2Setting: (data: OAuth2SettingRequestDTO, params: RequestParams = {}) =>
            this.request<ResultString, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/oauth2/setting`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags OAuth2SettingController
         * @name PostOauth2Refresh
         * @summary Refresh the credential of OAuth2.0
         * @request POST:/api/docpal/oauth2/refresh
         * @deprecated
         */
        postOauth2Refresh: (data: OAuth2SettingRequestDTO, params: RequestParams = {}) =>
            this.request<ResultString, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/oauth2/refresh`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags OAuth2SettingController
         * @name GetOauth2Code
         * @request GET:/api/docpal/oauth2/code
         * @deprecated
         */
        getOauth2Code: (
            query: {
                code: string;
                scope: string;
                state: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/oauth2/code`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags OAuth2SettingController
         * @name PostOauth2Code
         * @summary Get the credential of OAuth2.0 by code and state
         * @request POST:/api/docpal/oauth2/code
         * @deprecated
         */
        postOauth2Code: (data: OAuth2SettingRequestDTO, params: RequestParams = {}) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/oauth2/code`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags MetadataSchemaController
         * @name PostMetadata
         * @summary Save metadata
         * @request POST:/api/docpal/metadata
         */
        postMetadata: (data: GrpcMetadataResp, params: RequestParams = {}) =>
            this.request<ResultGrpcMetadataResp, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/metadata`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags MetadataSchemaController
         * @name PostMetadataSubnotification
         * @request POST:/api/docpal/metadata/subNotification
         */
        postMetadataSubnotification: (data: SubNotificationRequest, params: RequestParams = {}) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/metadata/subNotification`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags MetadataSchemaController
         * @name PostMetadataPage
         * @request POST:/api/docpal/metadata/page
         */
        postMetadataPage: (data: MetadataRequestDTO, params: RequestParams = {}) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/metadata/page`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags MetadataSchemaController
         * @name PostMetadataNotification
         * @request POST:/api/docpal/metadata/notification
         */
        postMetadataNotification: (data: MailSendRequest, params: RequestParams = {}) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/metadata/notification`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags template-message-controller
         * @name PostMessageTemplateList
         * @request POST:/api/docpal/message/template/list
         */
        postMessageTemplateList: (data: MessageTemplateRequestDTO, params: RequestParams = {}) =>
            this.request<ResultPaginationDTOMessageTemplateVO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/message/template/list`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags template-message-controller
         * @name PostMessageTemplateEdit
         * @request POST:/api/docpal/message/template/edit
         */
        postMessageTemplateEdit: (data: TemplateMsgManageDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/message/template/edit`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags template-message-controller
         * @name PostMessageTemplateCreate
         * @request POST:/api/docpal/message/template/create
         */
        postMessageTemplateCreate: (data: TemplateMsgManageDTO, params: RequestParams = {}) =>
            this.request<ResultCreateMessageResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/message/template/create`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags MasterTableController
         * @name PostMasterTablesIdStructureExport
         * @summary Export table structure
         * @request POST:/api/docpal/master/tables/{id}/structure/export
         * @deprecated
         */
        postMasterTablesIdStructureExport: (
            id: string,
            data: any,
            query?: {
                /** @default "excel" */
                format?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<string[], Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/master/tables/${id}/structure/export`,
                method: "POST",
                query: query,
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags MasterTableController
         * @name PostMasterTablesIdRecordExport
         * @summary Export data of a master table
         * @request POST:/api/docpal/master/tables/{id}/record/export
         * @deprecated
         */
        postMasterTablesIdRecordExport: (
            id: string,
            query?: {
                operation?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<string[], Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/master/tables/${id}/record/export`,
                method: "POST",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags MasterTableController
         * @name PostMasterTablesIdField
         * @summary Add single field to master table
         * @request POST:/api/docpal/master/tables/{id}/field
         * @deprecated
         */
        postMasterTablesIdField: (id: string, data: MTFieldInfo, params: RequestParams = {}) =>
            this.request<ResultMasterTableResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/master/tables/${id}/field`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags MasterTableController
         * @name PostMasterTablesStructureImport
         * @summary Import Excel to create master table
         * @request POST:/api/docpal/master/tables/structure/import
         * @deprecated
         */
        postMasterTablesStructureImport: (
            data: {
                /** @format binary */
                file?: File;
            },
            query?: {
                /** @default "excel" */
                format?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultMasterTableResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/master/tables/structure/import`,
                method: "POST",
                query: query,
                body: data,
                type: ContentType.FormData,
                ...params,
            }),

        /**
         * No description
         *
         * @tags MasterTableController
         * @name GetMasterTablesRecords
         * @summary query records with related fields of master table
         * @request GET:/api/docpal/master/tables/records
         * @deprecated
         */
        getMasterTablesRecords: (
            query: {
                relationTable: string;
                relationField: string;
                displayField: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/master/tables/records`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags MasterTableController
         * @name PostMasterTablesRecords
         * @summary Query all records of master table
         * @request POST:/api/docpal/master/tables/records
         * @deprecated
         */
        postMasterTablesRecords: (data: MTRecordRequestDTO, params: RequestParams = {}) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/master/tables/records`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags MasterTableController
         * @name PostMasterTablesRecord
         * @summary Insert data into a master table
         * @request POST:/api/docpal/master/tables/record
         * @deprecated
         */
        postMasterTablesRecord: (data: MasterTableRequestDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/master/tables/record`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags MasterTableController
         * @name PostMasterTablesRecordPageNonpermission
         * @request POST:/api/docpal/master/tables/record/page/nonPermission
         * @deprecated
         */
        postMasterTablesRecordPageNonpermission: (data: MTRecordRequestDTO, params: RequestParams = {}) =>
            this.request<ResultListMapStringObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/master/tables/record/page/nonPermission`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags MasterTableController
         * @name PostMasterTablesRecordImport
         * @summary Upload json for import data into a master table
         * @request POST:/api/docpal/master/tables/record/import
         * @deprecated
         */
        postMasterTablesRecordImport: (data: MasterTableRequestDTO, params: RequestParams = {}) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/master/tables/record/import`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags MasterTableController
         * @name PostMasterTablesRecordImportFile
         * @summary Upload .csv file for import data into a master table
         * @request POST:/api/docpal/master/tables/record/import/file
         * @deprecated
         */
        postMasterTablesRecordImportFile: (
            query: {
                /** @format binary */
                file: File;
                id: string;
            },
            data: {
                /** @format binary */
                file?: File;
                /** @format string */
                id?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/master/tables/record/import/file`,
                method: "POST",
                query: query,
                body: data,
                type: ContentType.FormData,
                ...params,
            }),

        /**
         * No description
         *
         * @tags MasterTableController
         * @name PostMasterTablesPage
         * @summary Pagination search (Master Table)
         * @request POST:/api/docpal/master/tables/page
         * @deprecated
         */
        postMasterTablesPage: (data: MasterTableRequestDTO, params: RequestParams = {}) =>
            this.request<ResultPaginationDTOMasterTableResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/master/tables/page`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags MasterTableController
         * @name PostMasterTablesLogs
         * @summary Pagination Search (Audit Logs of master table)
         * @request POST:/api/docpal/master/tables/logs
         * @deprecated
         */
        postMasterTablesLogs: (data: MTAuditLogRequestDTO, params: RequestParams = {}) =>
            this.request<
                ResultPaginationDTOAuditTemplateResponseExtendDTO,
                Result | (ResultObject | Result | ResultString)
            >({
                path: `/docpal/master/tables/logs`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags MasterTableController
         * @name PostMasterTablesLogsPageConditions
         * @request POST:/api/docpal/master/tables/logs/page/conditions
         * @deprecated
         */
        postMasterTablesLogsPageConditions: (data: MTAuditLogRequestDTO, params: RequestParams = {}) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/master/tables/logs/page/conditions`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags MasterTableController
         * @name PostMasterTablesInit
         * @request POST:/api/docpal/master/tables/init
         * @deprecated
         */
        postMasterTablesInit: (params: RequestParams = {}) =>
            this.request<void, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/master/tables/init`,
                method: "POST",
                ...params,
            }),

        /**
         * No description
         *
         * @tags MasterTableController
         * @name PostMasterTablesFields
         * @summary Add multiple fields to master table
         * @request POST:/api/docpal/master/tables/fields
         * @deprecated
         */
        postMasterTablesFields: (data: MasterTableRequestDTO, params: RequestParams = {}) =>
            this.request<ResultMasterTableResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/master/tables/fields`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags MasterTableController
         * @name PostMasterTablesColumnAdd
         * @summary For master table adding column
         * @request POST:/api/docpal/master/tables/column/add
         * @deprecated
         */
        postMasterTablesColumnAdd: (data: MTAddColumnRequestDTO, params: RequestParams = {}) =>
            this.request<ResultMasterTableResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/master/tables/column/add`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags MasterTableController
         * @name PostMasterTablesBatchDelete
         * @summary delete master table record
         * @request POST:/api/docpal/master/tables/batch/delete
         * @deprecated
         */
        postMasterTablesBatchDelete: (data: DeleteMTRecordRequestDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/master/tables/batch/delete`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags MasterTableController
         * @name PostMasterTablesAclsRemove
         * @summary Remove permission of current master table
         * @request POST:/api/docpal/master/tables/acls/remove
         * @deprecated
         */
        postMasterTablesAclsRemove: (data: MTPermissionDTO, params: RequestParams = {}) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/master/tables/acls/remove`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags MasterTableController
         * @name PostMasterTablesAclsUpdate
         * @summary Remove permission of current master table
         * @request POST:/api/docpal/master/tables/acls/update
         * @deprecated
         */
        postMasterTablesAclsUpdate: (data: MTPermissionDTO, params: RequestParams = {}) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/master/tables/acls/update`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags MasterTableController
         * @name PostMasterTablesAclsDelete
         * @summary Delete permission of current master table
         * @request POST:/api/docpal/master/tables/acls/delete
         * @deprecated
         */
        postMasterTablesAclsDelete: (data: MTPermissionDTO, params: RequestParams = {}) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/master/tables/acls/delete`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags MasterTableController
         * @name PostMasterTablesAclsAdd
         * @summary Add permission of current master table
         * @request POST:/api/docpal/master/tables/acls/add
         * @deprecated
         */
        postMasterTablesAclsAdd: (data: MTPermissionDTO, params: RequestParams = {}) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/master/tables/acls/add`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Management
         * @name GetManagementLoggersDeprecate
         * @summary Retrieve the available loggers of the services
         * @request GET:/api/docpal/management/loggers/
         */
        getManagementLoggersDeprecate: (
            query?: {
                service?: string;
                logger?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultMapStringMapStringObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/management/loggers/`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Management
         * @name PostManagementLoggersDeprecate
         * @summary Change the log level of services' loggers
         * @request POST:/api/docpal/management/loggers/
         */
        postManagementLoggersDeprecate: (
            query?: {
                service?: string;
                logger?: string;
                level?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<Result, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/management/loggers/`,
                method: "POST",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Management
         * @name GetManagementLoggers
         * @summary Retrieve the available loggers of the services
         * @request GET:/api/docpal/management/loggers
         */
        getManagementLoggers: (
            query?: {
                service?: string;
                logger?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultMapStringMapStringObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/management/loggers`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Management
         * @name PostManagementLoggers
         * @summary Change the log level of services' loggers
         * @request POST:/api/docpal/management/loggers
         */
        postManagementLoggers: (
            query?: {
                service?: string;
                logger?: string;
                level?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<Result, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/management/loggers`,
                method: "POST",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags InternalShareController
         * @name PostInternalsharePage
         * @request POST:/api/docpal/internalShare/page
         */
        postInternalsharePage: (data: InternalShareQueryDTO, params: RequestParams = {}) =>
            this.request<ResultPaginationDTOInternalShareQueryDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/internalShare/page`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags InternalShareController
         * @name PostInternalshareCheckdocumentisinshare
         * @request POST:/api/docpal/internalShare/checkDocumentIsInShare
         */
        postInternalshareCheckdocumentisinshare: (data: InternalShareQueryDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/internalShare/checkDocumentIsInShare`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags IdTemplateController
         * @name GetIdTemplates
         * @summary Get all ID templates
         * @request GET:/api/docpal/id-templates
         * @deprecated
         */
        getIdTemplates: (params: RequestParams = {}) =>
            this.request<ResultListIdTemplate, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/id-templates`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags IdTemplateController
         * @name PostIdTemplates
         * @summary Create a ID template
         * @request POST:/api/docpal/id-templates
         * @deprecated
         */
        postIdTemplates: (data: IdTemplate, params: RequestParams = {}) =>
            this.request<ResultIdTemplate, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/id-templates`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags IdTemplateController
         * @name PostIdTemplatesValidate
         * @summary Verify id templates
         * @request POST:/api/docpal/id-templates/validate
         * @deprecated
         */
        postIdTemplatesValidate: (data: IdTemplate, params: RequestParams = {}) =>
            this.request<ResultString, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/id-templates/validate`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags IdTemplateController
         * @name PostIdTemplatesPage
         * @summary Paging query id templates
         * @request POST:/api/docpal/id-templates/page
         * @deprecated
         */
        postIdTemplatesPage: (data: IdTemplateRequestDTO, params: RequestParams = {}) =>
            this.request<ResultPaginationDTOIdTemplate, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/id-templates/page`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags IdTemplateController
         * @name PostIdTemplatesGenerate
         * @summary Generated ID using id template
         * @request POST:/api/docpal/id-templates/generate
         * @deprecated
         */
        postIdTemplatesGenerate: (data: GenerateIdReq, params: RequestParams = {}) =>
            this.request<ResultString, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/id-templates/generate`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags alert-controller
         * @name PostGenerateXApiKey
         * @request POST:/api/docpal/generate_x_api_key
         */
        postGenerateXApiKey: (data: GenerateXApiKeyRequestDTO, params: RequestParams = {}) =>
            this.request<ResultString, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/generate_x_api_key`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags FormDesignController
         * @name PostFormDesign
         * @summary Create a form design
         * @request POST:/api/docpal/form/design
         * @deprecated
         */
        postFormDesign: (data: FormDesignRequestDTO, params: RequestParams = {}) =>
            this.request<ResultFormDesignResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/form/design`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags FormDesignController
         * @name PostFormDesignSubmitData
         * @summary Submit form data
         * @request POST:/api/docpal/form/design/submit/data
         * @deprecated
         */
        postFormDesignSubmitData: (
            query: {
                /** Form Designer (Request) */
                formDataDTO: FormDesignDataDTO;
            },
            data: {
                /** @format string */
                id?: string;
                /** @format map */
                data?: map;
                /** @format string */
                bizNo?: string;
                /** @format string */
                bizType?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/form/design/submit/data`,
                method: "POST",
                query: query,
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags FormDesignController
         * @name PostFormDesignSendEmail
         * @request POST:/api/docpal/form/design/send_email
         * @deprecated
         */
        postFormDesignSendEmail: (data: EasyFormEmailDTO, params: RequestParams = {}) =>
            this.request<ResultVoid, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/form/design/send_email`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags FormDesignController
         * @name PostFormDesignSavePreview
         * @summary Save preview style
         * @request POST:/api/docpal/form/design/save/preview
         * @deprecated
         */
        postFormDesignSavePreview: (data: FormDesignRequestDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/form/design/save/preview`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags FormDesignController
         * @name PostFormDesignSavePermission
         * @summary Save Permission
         * @request POST:/api/docpal/form/design/save/permission
         * @deprecated
         */
        postFormDesignSavePermission: (data: FormDesignRequestDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/form/design/save/permission`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags FormDesignController
         * @name PostFormDesignSaveInformation
         * @summary Save information
         * @request POST:/api/docpal/form/design/save/information
         * @deprecated
         */
        postFormDesignSaveInformation: (data: FormDesignRequestDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/form/design/save/information`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags FormDesignController
         * @name PostFormDesignSaveFormresult
         * @summary Save Form Result
         * @request POST:/api/docpal/form/design/save/formResult
         * @deprecated
         */
        postFormDesignSaveFormresult: (data: FormDesignRequestDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/form/design/save/formResult`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags FormDesignController
         * @name PostFormDesignSaveFormresultAppend
         * @request POST:/api/docpal/form/design/save/formResult/append
         * @deprecated
         */
        postFormDesignSaveFormresultAppend: (data: EasyFormResultRequestDTO, params: RequestParams = {}) =>
            this.request<ResultEasyFormResult, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/form/design/save/formResult/append`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags FormDesignController
         * @name PostFormDesignRecords
         * @request POST:/api/docpal/form/design/records
         * @deprecated
         */
        postFormDesignRecords: (data: FormDesignRequestDTO, params: RequestParams = {}) =>
            this.request<ResultListLinkedHashMapStringObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/form/design/records`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags FormDesignController
         * @name PostFormDesignRecordPage
         * @summary Paging search form data
         * @request POST:/api/docpal/form/design/record/page
         * @deprecated
         */
        postFormDesignRecordPage: (data: FormDesignRequestDTO, params: RequestParams = {}) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/form/design/record/page`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags FormDesignController
         * @name PostFormDesignPublish
         * @summary Publish Form Design
         * @request POST:/api/docpal/form/design/publish
         * @deprecated
         */
        postFormDesignPublish: (data: FormDesignRequestDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/form/design/publish`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags FormDesignController
         * @name PostFormDesignPageEmailLog
         * @request POST:/api/docpal/form/design/page_email_log
         * @deprecated
         */
        postFormDesignPageEmailLog: (data: EasyFormEmailQueryRequestDTO, params: RequestParams = {}) =>
            this.request<ResultPaginationDTOEasyFormEmailLogDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/form/design/page_email_log`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags FormDesignController
         * @name PostFormDesignPage
         * @summary Paging Query (form design)
         * @request POST:/api/docpal/form/design/page
         * @deprecated
         */
        postFormDesignPage: (data: FormDesignRequestDTO, params: RequestParams = {}) =>
            this.request<ResultPaginationDTOFormDesignResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/form/design/page`,
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
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/email/template/send`,
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
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/email/send`,
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
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/email/send/from`,
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
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/email/customize/send`,
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
            this.request<ResultBatchSendEmailResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/email/batch/send`,
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
            this.request<ResultBatchSendEmailResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/email/batch-send`,
                method: "POST",
                query: query,
                body: data,
                type: ContentType.FormData,
                ...params,
            }),

        /**
         * No description
         *
         * @tags data-statistics-controller
         * @name PostDataStatisticsExecuteDailyStatistics
         * @request POST:/api/docpal/data_statistics/execute_daily_statistics
         */
        postDataStatisticsExecuteDailyStatistics: (data: ExecuteSqlDTO, params: RequestParams = {}) =>
            this.request<Result, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/data_statistics/execute_daily_statistics`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DAMSettingController
         * @name PostDamGetallsetting
         * @request POST:/api/docpal/dam/getAllSetting
         * @deprecated
         */
        postDamGetallsetting: (params: RequestParams = {}) =>
            this.request<ResultMapObjectObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/dam/getAllSetting`,
                method: "POST",
                ...params,
            }),

        /**
         * No description
         *
         * @tags DAMSettingController
         * @name PostDamEditsetting
         * @request POST:/api/docpal/dam/editSetting
         * @deprecated
         */
        postDamEditsetting: (data: DAMConversionSettingRequestDTO, params: RequestParams = {}) =>
            this.request<Result, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/dam/editSetting`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DAMSettingController
         * @name PostDamDeletesettings
         * @request POST:/api/docpal/dam/deleteSettings
         * @deprecated
         */
        postDamDeletesettings: (data: number[], params: RequestParams = {}) =>
            this.request<Result, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/dam/deleteSettings`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * @description Create a new contact group with the specified information
         *
         * @tags ContactController
         * @name PostContactgroup
         * @summary Create a new contact group
         * @request POST:/api/docpal/contactGroup
         * @deprecated
         */
        postContactgroup: (data: ContactGroupRequestDTO, params: RequestParams = {}) =>
            this.request<ResultContactGroupResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/contactGroup`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ContactController
         * @name PostContactgroupIdPermission
         * @summary Add the contact permission
         * @request POST:/api/docpal/contactGroup/{id}/permission
         * @deprecated
         */
        postContactgroupIdPermission: (id: string, data: BasicField, params: RequestParams = {}) =>
            this.request<ResultListBasicField, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/contactGroup/${id}/permission`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ContactController
         * @name PatchContactgroupIdPermission
         * @summary Remove the contact permission
         * @request PATCH:/api/docpal/contactGroup/{id}/permission
         * @deprecated
         */
        patchContactgroupIdPermission: (id: string, data: BasicField, params: RequestParams = {}) =>
            this.request<ResultListBasicField, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/contactGroup/${id}/permission`,
                method: "PATCH",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ContactController
         * @name PostContactgroupIdNewfields
         * @summary Add new field to contact Group
         * @request POST:/api/docpal/contactGroup/{id}/newFields
         * @deprecated
         */
        postContactgroupIdNewfields: (id: string, data: ContactAttribute, params: RequestParams = {}) =>
            this.request<ResultListContactAttribute, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/contactGroup/${id}/newFields`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ContactController
         * @name PostContactgroupIdContactdetail
         * @summary Adding a new contact record
         * @request POST:/api/docpal/contactGroup/{id}/contactDetail
         * @deprecated
         */
        postContactgroupIdContactdetail: (id: string, data: Record<string, object>, params: RequestParams = {}) =>
            this.request<ResultMapStringObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/contactGroup/${id}/contactDetail`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ContactController
         * @name PostContactgroupIdContactdetailPage
         * @summary Page query contact detail list
         * @request POST:/api/docpal/contactGroup/{id}/contactDetail/page
         * @deprecated
         */
        postContactgroupIdContactdetailPage: (id: string, data: ContactRequestDTO, params: RequestParams = {}) =>
            this.request<ResultPaginationDTOMapStringObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/contactGroup/${id}/contactDetail/page`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * @description Import contacts from Excel or CSV file into the specified contact group
         *
         * @tags ContactController
         * @name PostContactgroupIdContactdetailImport
         * @summary Import contacts from file
         * @request POST:/api/docpal/contactGroup/{id}/contactDetail/import
         * @deprecated
         */
        postContactgroupIdContactdetailImport: (
            id: string,
            query: {
                requestDTO: ContactImportRequestDTO;
            },
            data: {
                /** @format binary */
                file?: File;
                /** @format Boolean */
                replace?: replace;
                /**
                 * @format object string
                 * @example {"name":"{{file-customer}}","email":"{{file-email}}","description":"{{file-column}}"}
                 */
                columns?: map;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultImportResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/contactGroup/${id}/contactDetail/import`,
                method: "POST",
                query: query,
                body: data,
                type: ContentType.FormData,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ContactController
         * @name PostContactgroupIdContactdetailExport
         * @summary Export contact record for file type include excel, csv, vcf
         * @request POST:/api/docpal/contactGroup/{id}/contactDetail/export
         * @deprecated
         */
        postContactgroupIdContactdetailExport: (
            id: string,
            query: {
                /** File Type */
                fileType: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<string[], Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/contactGroup/${id}/contactDetail/export`,
                method: "POST",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ContactController
         * @name PostContactgroupReadTitle
         * @summary Get header list through read the file
         * @request POST:/api/docpal/contactGroup/read/title
         * @deprecated
         */
        postContactgroupReadTitle: (
            data: {
                /** @format binary */
                file?: File;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultMapStringInteger, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/contactGroup/read/title`,
                method: "POST",
                body: data,
                type: ContentType.FormData,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ContactController
         * @name PostContactgroupPage
         * @summary Page query contact group
         * @request POST:/api/docpal/contactGroup/page
         * @deprecated
         */
        postContactgroupPage: (data: ContactGroupRequestDTO, params: RequestParams = {}) =>
            this.request<ResultPaginationDTOContactGroupResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/contactGroup/page`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Profile APIs
         * @name PostCompanyprofiles
         * @summary Create a new company profile by filling out required fields
         * @request POST:/api/docpal/companyProfiles
         * @deprecated
         */
        postCompanyprofiles: (data: Company, params: RequestParams = {}) =>
            this.request<ResultCompany, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/companyProfiles`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Profile APIs
         * @name GetCompanyprofilesCompanyidChops
         * @summary Retrieve list of all chops in one company
         * @request GET:/api/docpal/companyProfiles/{companyId}/chops
         * @deprecated
         */
        getCompanyprofilesCompanyidChops: (
            companyId: string,
            query: {
                /** Company Chop (Request) */
                requestDTO: CompanyChopRequestDTO;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListCompanyChop, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/companyProfiles/${companyId}/chops`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Profile APIs
         * @name PostCompanyprofilesCompanyidChops
         * @summary Create a new company chop
         * @request POST:/api/docpal/companyProfiles/{companyId}/chops
         * @deprecated
         */
        postCompanyprofilesCompanyidChops: (
            companyId: string,
            query: {
                /** Company Chop (Request) */
                requestDTO: CompanyChopRequestDTO;
            },
            data: {
                /** @format binary */
                file?: File;
                /** @format string */
                name?: string;
                /**
                 * @format string
                 * @default "A"
                 */
                status?: string;
                /**
                 * @format array
                 * @default "ceo,it"
                 */
                roles?: stringArray;
                /**
                 * @format array
                 * @default "admin,test_user"
                 */
                users?: stringArray;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultCompanyChop, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/companyProfiles/${companyId}/chops`,
                method: "POST",
                query: query,
                body: data,
                type: ContentType.FormData,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Profile APIs
         * @name PostCompanyprofilesCompanyidChopsPage
         * @summary Retrieve list of all chops in one company
         * @request POST:/api/docpal/companyProfiles/{companyId}/chops/page
         * @deprecated
         */
        postCompanyprofilesCompanyidChopsPage: (
            companyId: string,
            data: CompanyChopRequestDTO,
            params: RequestParams = {},
        ) =>
            this.request<ResultPaginationDTOCompanyChop, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/companyProfiles/${companyId}/chops/page`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Profile APIs
         * @name PostCompanyprofilesPage
         * @summary Paginated query for fetch list of all company Profiles
         * @request POST:/api/docpal/companyProfiles/page
         * @deprecated
         */
        postCompanyprofilesPage: (data: CompanyRequestDTO, params: RequestParams = {}) =>
            this.request<ResultPaginationDTOCompany, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/companyProfiles/page`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTypeController
         * @name PostCaseTypesIdPublish
         * @summary Publish CMMN file to workflow application
         * @request POST:/api/docpal/case/types/{id}/publish
         * @deprecated
         */
        postCaseTypesIdPublish: (
            id: string,
            data: {
                /**
                 * CMMN XML file
                 * @format binary
                 */
                file?: File;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultCaseTypeResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/types/${id}/publish`,
                method: "POST",
                body: data,
                type: ContentType.FormData,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTypeController
         * @name PostCaseTypesIdDraftSave
         * @summary Save draft cmmn xml
         * @request POST:/api/docpal/case/types/{id}/draft/save
         * @deprecated
         */
        postCaseTypesIdDraftSave: (
            id: string,
            query: {
                /** @format binary */
                file: File;
            },
            data: {
                /**
                 * this is a .xml file
                 * @format binary
                 */
                file?: File;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultCaseModelDraft, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/types/${id}/draft/save`,
                method: "POST",
                query: query,
                body: data,
                type: ContentType.FormData,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTypeController
         * @name PostCaseTypesIdDraftDownload
         * @summary Download draft cmmn xml (case model definition)
         * @request POST:/api/docpal/case/types/{id}/draft/download
         * @deprecated
         */
        postCaseTypesIdDraftDownload: (id: string, params: RequestParams = {}) =>
            this.request<string[], Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/types/${id}/draft/download`,
                method: "POST",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTypeController
         * @name PostCaseTypesIdDownloadDraft
         * @summary Download draft cmmn xml (case model definition)
         * @request POST:/api/docpal/case/types/{id}/download/draft
         * @deprecated
         */
        postCaseTypesIdDownloadDraft: (id: string, params: RequestParams = {}) =>
            this.request<string[], Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/types/${id}/download/draft`,
                method: "POST",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTypeController
         * @name PostCaseTypesIdCopy
         * @summary New Case for new case type
         * @request POST:/api/docpal/case/types/{id}/copy
         * @deprecated
         */
        postCaseTypesIdCopy: (id: string, data: CopyCaseTypeRequest, params: RequestParams = {}) =>
            this.request<ResultCaseTypeResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/types/${id}/copy`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTypeController
         * @name PostCaseTypesVersionVersionidRefresh
         * @request POST:/api/docpal/case/types/version/{versionId}/refresh
         * @deprecated
         */
        postCaseTypesVersionVersionidRefresh: (versionId: string, params: RequestParams = {}) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/types/version/${versionId}/refresh`,
                method: "POST",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTypeController
         * @name PostCaseTypesVersionVersionidNew
         * @summary Create a new version of case type
         * @request POST:/api/docpal/case/types/version/{versionId}/new
         * @deprecated
         */
        postCaseTypesVersionVersionidNew: (versionId: string, params: RequestParams = {}) =>
            this.request<ResultCmmnVersion, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/types/version/${versionId}/new`,
                method: "POST",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTypeController
         * @name PostCaseTypesVersionVersionidActive
         * @summary Deploy a version case type
         * @request POST:/api/docpal/case/types/version/{versionId}/active
         * @deprecated
         */
        postCaseTypesVersionVersionidActive: (versionId: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/types/version/${versionId}/active`,
                method: "POST",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTypeController
         * @name PostCaseTypesVersionPage
         * @summary Paging query case-model version
         * @request POST:/api/docpal/case/types/version/page
         * @deprecated
         */
        postCaseTypesVersionPage: (data: CmmnVersionRequestDTO, params: RequestParams = {}) =>
            this.request<ResultPaginationDTOCmmnVersion, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/types/version/page`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTypeController
         * @name PostCaseTypesStylejsonSave
         * @summary Save style json of cmmn xml
         * @request POST:/api/docpal/case/types/styleJson/save
         * @deprecated
         */
        postCaseTypesStylejsonSave: (data: CmmnVersionRequestDTO, params: RequestParams = {}) =>
            this.request<ResultCmmnVersion, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/types/styleJson/save`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTypeController
         * @name PostCaseTypesRefresh
         * @request POST:/api/docpal/case/types/refresh
         * @deprecated
         */
        postCaseTypesRefresh: (
            query: {
                id: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/types/refresh`,
                method: "POST",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseInstanceController
         * @name PostCaseTypesRecordsList
         * @summary Get all case instance data of deployed case type without permission
         * @request POST:/api/docpal/case/types/records/list
         * @deprecated
         */
        postCaseTypesRecordsList: (data: CmmnDashboardRequestDTO, params: RequestParams = {}) =>
            this.request<ResultListLinkedHashMapStringObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/types/records/list`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTypeController
         * @name PostCaseTypesPage
         * @summary Pagination search (Case Type)
         * @request POST:/api/docpal/case/types/page
         * @deprecated
         */
        postCaseTypesPage: (data: CaseTypeRequestDTO, params: RequestParams = {}) =>
            this.request<ResultPaginationDTOCaseType, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/types/page`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTypeController
         * @name PostCaseTypesList
         * @summary Retrieve case list through the list of case id
         * @request POST:/api/docpal/case/types/list
         * @deprecated
         */
        postCaseTypesList: (data: CaseTypeRequestDTO, params: RequestParams = {}) =>
            this.request<ResultListCaseTypeResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/types/list`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseInstanceController
         * @name PostCaseTriggerEvent
         * @summary Trigger event for completed
         * @request POST:/api/docpal/case/trigger/event
         * @deprecated
         */
        postCaseTriggerEvent: (data: CmmnTriggerEventReqDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/trigger/event`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTableController
         * @name GetCaseTables
         * @summary Retrieve all case tables
         * @request GET:/api/docpal/case/tables
         * @deprecated
         */
        getCaseTables: (params: RequestParams = {}) =>
            this.request<ResultListCaseTable, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/tables`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTableController
         * @name PostCaseTables
         * @summary Create (Case Table)
         * @request POST:/api/docpal/case/tables
         * @deprecated
         */
        postCaseTables: (data: CaseTableRequestDTO, params: RequestParams = {}) =>
            this.request<ResultCaseTable, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/tables`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTableController
         * @name PostCaseTablesIdField
         * @summary Add single field to Case Table
         * @request POST:/api/docpal/case/tables/{id}/field
         * @deprecated
         */
        postCaseTablesIdField: (id: string, data: MTFieldInfo, params: RequestParams = {}) =>
            this.request<ResultCaseTableResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/tables/${id}/field`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTableController
         * @name DeleteCaseTablesIdField
         * @summary Delete field when not data (Case Table)
         * @request DELETE:/api/docpal/case/tables/{id}/field
         * @deprecated
         */
        deleteCaseTablesIdField: (
            id: string,
            query: {
                columnName: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/tables/${id}/field`,
                method: "DELETE",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTableController
         * @name PostCaseTablesRecord
         * @summary Insert data into a Case Table
         * @request POST:/api/docpal/case/tables/record
         * @deprecated
         */
        postCaseTablesRecord: (data: CaseTableRequestDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/tables/record`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTableController
         * @name PostCaseTablesRecordPage
         * @summary Pagination Search (Case Table Record)
         * @request POST:/api/docpal/case/tables/record/page
         * @deprecated
         */
        postCaseTablesRecordPage: (data: CaseTableRequestDTO, params: RequestParams = {}) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/tables/record/page`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseInstanceController
         * @name PostCaseInstanceTasks
         * @summary Retrieve all tasks of this case instance
         * @request POST:/api/docpal/case/instance/tasks
         * @deprecated
         */
        postCaseInstanceTasks: (data: CaseInstanceTaskDTO, params: RequestParams = {}) =>
            this.request<ResultListCmmnTaskDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/instance/tasks`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseInstanceController
         * @name PostCaseInstanceTasksComplete
         * @summary Complete task
         * @request POST:/api/docpal/case/instance/tasks/complete
         * @deprecated
         */
        postCaseInstanceTasksComplete: (data: CaseInstanceTaskDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/instance/tasks/complete`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseInstanceController
         * @name PostCaseInstanceStart
         * @summary Start a case model definition to get a case instance
         * @request POST:/api/docpal/case/instance/start
         * @deprecated
         */
        postCaseInstanceStart: (data: CaseInstanceRequestDTO, params: RequestParams = {}) =>
            this.request<ResultCaseInstanceDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/instance/start`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseInstanceController
         * @name PostCaseInstancePlanitems
         * @summary Retrieve all or activated planItem instances of this case instance
         * @request POST:/api/docpal/case/instance/planItems
         * @deprecated
         */
        postCaseInstancePlanitems: (data: PlanItemInstanceDTO, params: RequestParams = {}) =>
            this.request<ResultListPlanItemInstanceDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/instance/planItems`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseInstanceController
         * @name PostCaseInstancePlanitemsPlanitemidEnable
         * @summary Enable plan item instance
         * @request POST:/api/docpal/case/instance/planItems/{planItemId}/enable
         * @deprecated
         */
        postCaseInstancePlanitemsPlanitemidEnable: (planItemId: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/instance/planItems/${planItemId}/enable`,
                method: "POST",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseInstanceController
         * @name PostCaseInstancePlanitemsComplete
         * @summary Complete PlanItem instance
         * @request POST:/api/docpal/case/instance/planItems/complete
         * @deprecated
         */
        postCaseInstancePlanitemsComplete: (data: PlanItemInstanceDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/instance/planItems/complete`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CmmnDashboardController
         * @name PostCaseDashboardSaveStyle
         * @summary Save dashboard Json
         * @request POST:/api/docpal/case/dashboard/save/style
         * @deprecated
         */
        postCaseDashboardSaveStyle: (data: CmmnDashboardRequestDTO, params: RequestParams = {}) =>
            this.request<ResultCmmnDashboard, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/dashboard/save/style`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CmmnDashboardController
         * @name PostCaseDashboardPage
         * @summary Pagination search (Case Dashboard)
         * @request POST:/api/docpal/case/dashboard/page
         * @deprecated
         */
        postCaseDashboardPage: (data: CmmnDashboardRequestDTO, params: RequestParams = {}) =>
            this.request<ResultPaginationDTOCmmnDashboardResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/dashboard/page`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CmmnDashboardController
         * @name PostCaseDashboardInstanceCaseidProcessInstanceTasks
         * @summary Query sub-process tasks of this case instance
         * @request POST:/api/docpal/case/dashboard/instance/{caseId}/process/instance/tasks
         * @deprecated
         */
        postCaseDashboardInstanceCaseidProcessInstanceTasks: (
            caseId: string,
            data: CmmnProcessRequestDTO,
            params: RequestParams = {},
        ) =>
            this.request<ResultPaginationDTOTaskDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/dashboard/instance/${caseId}/process/instance/tasks`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CmmnDashboardController
         * @name PostCaseDashboardInstanceCaseidProcessInstancePage
         * @summary Pagination Search process instance of this case instance
         * @request POST:/api/docpal/case/dashboard/instance/{caseId}/process/instance/page
         * @deprecated
         */
        postCaseDashboardInstanceCaseidProcessInstancePage: (
            caseId: string,
            data: CmmnDashboardRequestDTO,
            params: RequestParams = {},
        ) =>
            this.request<ResultPaginationDTOCmmnProcessInstanceDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/dashboard/instance/${caseId}/process/instance/page`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CmmnDashboardController
         * @name PostCaseDashboardDatapatchRolepermission
         * @request POST:/api/docpal/case/dashboard/dataPatch/rolePermission
         * @deprecated
         */
        postCaseDashboardDatapatchRolepermission: (params: RequestParams = {}) =>
            this.request<void, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/dashboard/dataPatch/rolePermission`,
                method: "POST",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CalendarController
         * @name GetCalendarsWidgetSetting
         * @summary Obtain calendar widget settings
         * @request GET:/api/docpal/calendars/widget/setting
         * @deprecated
         */
        getCalendarsWidgetSetting: (params: RequestParams = {}) =>
            this.request<ResultMapStringObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/calendars/widget/setting`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CalendarController
         * @name PostCalendarsWidgetSetting
         * @summary Save calendar settings
         * @request POST:/api/docpal/calendars/widget/setting
         * @deprecated
         */
        postCalendarsWidgetSetting: (data: Record<string, object>, params: RequestParams = {}) =>
            this.request<ResultMapStringObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/calendars/widget/setting`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CalendarController
         * @name GetCalendarsSetting
         * @summary Obtain calendar settings
         * @request GET:/api/docpal/calendars/setting
         * @deprecated
         */
        getCalendarsSetting: (params: RequestParams = {}) =>
            this.request<ResultMapStringObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/calendars/setting`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CalendarController
         * @name PostCalendarsSetting
         * @summary Save calendar settings
         * @request POST:/api/docpal/calendars/setting
         * @deprecated
         */
        postCalendarsSetting: (data: Record<string, object>, params: RequestParams = {}) =>
            this.request<ResultMapStringObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/calendars/setting`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CalendarController
         * @name PostCalendarsList
         * @summary Query list
         * @request POST:/api/docpal/calendars/list
         * @deprecated
         */
        postCalendarsList: (data: CalendarTaskReq, params: RequestParams = {}) =>
            this.request<ResultListCalendarTaskRespDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/calendars/list`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags FolderCabinetController
         * @name PostCabinetTemplate
         * @summary create folder cabinet template
         * @request POST:/api/docpal/cabinet/template
         * @deprecated
         */
        postCabinetTemplate: (data: FolderCabinetRequestDTO, params: RequestParams = {}) =>
            this.request<ResultFolderCabinetResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/cabinet/template`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags FolderCabinetController
         * @name PatchCabinetTemplate
         * @summary Modify folder/file into exist folder cabinet template
         * @request PATCH:/api/docpal/cabinet/template
         * @deprecated
         */
        patchCabinetTemplate: (data: FolderCabinetRequestDTO, params: RequestParams = {}) =>
            this.request<ResultFolderCabinetResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/cabinet/template`,
                method: "PATCH",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags FolderCabinetController
         * @name GetCabinetTemplatePermission
         * @request GET:/api/docpal/cabinet/template/permission
         * @deprecated
         */
        getCabinetTemplatePermission: (
            query: {
                id: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListDocumentACLEntryDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/cabinet/template/permission`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags FolderCabinetController
         * @name PostCabinetTemplatePermission
         * @summary Add permission for folder cabinet template
         * @request POST:/api/docpal/cabinet/template/permission
         * @deprecated
         */
        postCabinetTemplatePermission: (data: DocumentACLEntryDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/cabinet/template/permission`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags FolderCabinetController
         * @name DeleteCabinetTemplatePermission
         * @summary Delete permission from folder cabinet template
         * @request DELETE:/api/docpal/cabinet/template/permission
         * @deprecated
         */
        deleteCabinetTemplatePermission: (
            query: {
                id: string;
                userId: string;
                permission?: string;
            },
            data: any,
            params: RequestParams = {},
        ) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/cabinet/template/permission`,
                method: "DELETE",
                query: query,
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags FolderCabinetController
         * @name PostCabinetTemplatePage
         * @summary Pagination search folder cabinet
         * @request POST:/api/docpal/cabinet/template/page
         * @deprecated
         */
        postCabinetTemplatePage: (data: FolderCabinetRequestDTO, params: RequestParams = {}) =>
            this.request<ResultPaginationDTOFolderCabinetResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/cabinet/template/page`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags FolderCabinetController
         * @name PostCabinetTemplateDuplicateName
         * @summary Checking duplicate name
         * @request POST:/api/docpal/cabinet/template/duplicate/name
         * @deprecated
         */
        postCabinetTemplateDuplicateName: (data: FolderCabinet, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/cabinet/template/duplicate/name`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags FolderCabinetController
         * @name PostCabinetImport
         * @summary Import a folder cabinet
         * @request POST:/api/docpal/cabinet/import
         * @deprecated
         */
        postCabinetImport: (
            query: {
                documentPath: string;
                /** @format binary */
                multipartFile: File;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultFolderCabinet, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/cabinet/import`,
                method: "POST",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags FolderCabinetController
         * @name PostCabinetExporttojson
         * @summary Export a folder cabinet
         * @request POST:/api/docpal/cabinet/exportToJson
         * @deprecated
         */
        postCabinetExporttojson: (
            query: {
                folderCabinetId: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<string[], Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/cabinet/exportToJson`,
                method: "POST",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags azure-ocr-controller
         * @name PostAzureOcrQueryocrtransactionlogs
         * @request POST:/api/docpal/azure/ocr/queryOcrTransactionLogs
         */
        postAzureOcrQueryocrtransactionlogs: (data: OcrTransactionLogRequestDTO, params: RequestParams = {}) =>
            this.request<ResultPaginationDTOOcrTransactionLogDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/azure/ocr/queryOcrTransactionLogs`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags azure-ocr-controller
         * @name PostAzureOcrCreateocrprofilemapping
         * @request POST:/api/docpal/azure/ocr/createOcrProfileMapping
         */
        postAzureOcrCreateocrprofilemapping: (data: ProfileMappingRequestDTO, params: RequestParams = {}) =>
            this.request<ResultVoid, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/azure/ocr/createOcrProfileMapping`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * @description Batch retrieve roles and group information for multiple users
         *
         * @tags User Management
         * @name PostAclUserRolesAndGroups
         * @summary Batch Get User Roles and Groups
         * @request POST:/api/docpal/acl/user/roles-and-groups
         */
        postAclUserRolesAndGroups: (data: string[], params: RequestParams = {}) =>
            this.request<ResultMapStringUserRoleGroupDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/acl/user/roles-and-groups`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * @description Add specified users to a specific role
         *
         * @tags Role-User Management
         * @name PostAclRoleUsers
         * @summary Add Users to Role
         * @request POST:/api/docpal/acl/role/users
         */
        postAclRoleUsers: (data: RoleUsersRequest, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/acl/role/users`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * @description Remove specified users from a specific role
         *
         * @tags Role-User Management
         * @name DeleteAclRoleUsers
         * @summary Remove Users from Role
         * @request DELETE:/api/docpal/acl/role/users
         */
        deleteAclRoleUsers: (data: number[], params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/acl/role/users`,
                method: "DELETE",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * @description Get paginated list of role to users relationships
         *
         * @tags Role-User Management
         * @name PostAclRoleUsersPage
         * @summary Get Role to Users Relationship Page
         * @request POST:/api/docpal/acl/role/users/page
         */
        postAclRoleUsersPage: (data: BasePageDTO, params: RequestParams = {}) =>
            this.request<ResultPaginationDTORoleUsersVO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/acl/role/users/page`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * @description Get user list grouped by role IDs
         *
         * @tags Role-User Management
         * @name PostAclRoleUsersByRoles
         * @summary Get Users by Role IDs
         * @request POST:/api/docpal/acl/role/users/by-roles
         */
        postAclRoleUsersByRoles: (data: string[], params: RequestParams = {}) =>
            this.request<ResultMapStringListUserDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/acl/role/users/by-roles`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * @description Get paginated role list
         *
         * @tags Role Permission Management
         * @name PostAclRolePage
         * @summary Role Page
         * @request POST:/api/docpal/acl/role/page
         */
        postAclRolePage: (data: BasePageDTO, params: RequestParams = {}) =>
            this.request<ResultPaginationDTORoleVO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/acl/role/page`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * @description Get role list
         *
         * @tags Role Permission Management
         * @name PostAclRoleList
         * @summary Role List
         * @request POST:/api/docpal/acl/role/list
         */
        postAclRoleList: (data: BaseQueryConditionDTO[], params: RequestParams = {}) =>
            this.request<ResultListRoleDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/acl/role/list`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * @description Batch retrieve role hierarchies by role ID list
         *
         * @tags Role Permission Management
         * @name PostAclRoleHierarchy
         * @summary Get Multiple Role Hierarchies
         * @request POST:/api/docpal/acl/role/hierarchy
         */
        postAclRoleHierarchy: (data: string[], params: RequestParams = {}) =>
            this.request<ResultListRoleDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/acl/role/hierarchy`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * @description Create a new resource permission
         *
         * @tags Resource Permission Management
         * @name PostAclResourcePermissions
         * @summary Create Resource Permission
         * @request POST:/api/docpal/acl/resource-permissions
         */
        postAclResourcePermissions: (data: ResourcePermissionRequest, params: RequestParams = {}) =>
            this.request<ResultResourcePermissionDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/acl/resource-permissions`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * @description Include parent permission to current resource(document)
         *
         * @tags Resource Permission Management
         * @name PostAclResourcePermissionsIncludeInheritResourceid
         * @summary Include inherit permission to current resource by resource id
         * @request POST:/api/docpal/acl/resource-permissions/include-inherit/{resourceId}
         */
        postAclResourcePermissionsIncludeInheritResourceid: (resourceId: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/acl/resource-permissions/include-inherit/${resourceId}`,
                method: "POST",
                ...params,
            }),

        /**
         * @description Copy parent permission to current resource(document)
         *
         * @tags Resource Permission Management
         * @name PostAclResourcePermissionsCopyInheritResourceid
         * @summary Copy inherit permission to current resource by resource id
         * @request POST:/api/docpal/acl/resource-permissions/copy-inherit/{resourceId}
         */
        postAclResourcePermissionsCopyInheritResourceid: (resourceId: string, params: RequestParams = {}) =>
            this.request<ResultListResourcePermissionVO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/acl/resource-permissions/copy-inherit/${resourceId}`,
                method: "POST",
                ...params,
            }),

        /**
         * @description This endpoint retrieves a list of ACL documents based on the provided request parameters.
         *
         * @tags Document Management
         * @name PostAclDocumentList
         * @summary Retrieve a list of ACL documents
         * @request POST:/api/docpal/acl/document/list
         */
        postAclDocumentList: (data: AclDocumentListRequest, params: RequestParams = {}) =>
            this.request<ResultString, ResultListAclDocumentVO | Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/acl/document/list`,
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
            this.request<ResultBlockInheritedPermission, Result | (ResultObject | Result | ResultString)>({
                path: `/block/permission`,
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
            this.request<ResultListDocDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/block/permission/filter`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * @description Update the status of an import job
         *
         * @tags Document
         * @name PatchRegisteredServerImportjobsIdStatus
         * @summary Update import job status
         * @request PATCH:/api/registered-server/importJobs/{id}/status
         */
        patchRegisteredServerImportjobsIdStatus: (
            id: string,
            data: ExternalStorageImportJobRequestDTO,
            params: RequestParams = {},
        ) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/registered-server/importJobs/${id}/status`,
                method: "PATCH",
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
            this.request<ResultAclPermissionDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/permissions/update/entry`,
                method: "PATCH",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Password Controller
         * @name PatchPasswordUpdatePassword
         * @request PATCH:/api/password/update-password
         */
        patchPasswordUpdatePassword: (data: UpdatePasswordDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/password/update-password`,
                method: "PATCH",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Password Controller
         * @name PatchPasswordUnlockUserid
         * @request PATCH:/api/password/unlock/{userId}
         */
        patchPasswordUnlockUserid: (userId: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/password/unlock/${userId}`,
                method: "PATCH",
                ...params,
            }),

        /**
         * No description
         *
         * @tags External Share
         * @name DeleteNuxeoShare
         * @request DELETE:/api/nuxeo/share
         */
        deleteNuxeoShare: (data: string[], params: RequestParams = {}) =>
            this.request<Result, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/share`,
                method: "DELETE",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags External Share
         * @name PatchNuxeoShare
         * @request PATCH:/api/nuxeo/share
         */
        patchNuxeoShare: (data: ShareSaveRequestDTO, params: RequestParams = {}) =>
            this.request<ResultEasyShareDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/share`,
                method: "PATCH",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags SmartFolderController
         * @name GetNuxeoSfolderDeprecate
         * @request GET:/api/nuxeo/sfolder/
         * @deprecated
         */
        getNuxeoSfolderDeprecate: (
            query?: {
                name?: string;
                userGroupIds?: string[];
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListSmartFolderResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/sfolder/`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags SmartFolderController
         * @name PatchNuxeoSfolderDeprecate
         * @summary Save Smart Folder
         * @request PATCH:/api/nuxeo/sfolder/
         * @deprecated
         */
        patchNuxeoSfolderDeprecate: (data: SmartFolderRequestDTO, params: RequestParams = {}) =>
            this.request<ResultSmartFolderResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/sfolder/`,
                method: "PATCH",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags SmartFolderController
         * @name GetNuxeoSfolder
         * @request GET:/api/nuxeo/sfolder
         * @deprecated
         */
        getNuxeoSfolder: (
            query?: {
                name?: string;
                userGroupIds?: string[];
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListSmartFolderResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/sfolder`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags SmartFolderController
         * @name PatchNuxeoSfolder
         * @summary Save Smart Folder
         * @request PATCH:/api/nuxeo/sfolder
         * @deprecated
         */
        patchNuxeoSfolder: (data: SmartFolderRequestDTO, params: RequestParams = {}) =>
            this.request<ResultSmartFolderResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/sfolder`,
                method: "PATCH",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ViewSettingController
         * @name GetNuxeoSettingView
         * @request GET:/api/nuxeo/setting/view
         * @deprecated
         */
        getNuxeoSettingView: (params: RequestParams = {}) =>
            this.request<ResultViewSettingResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/setting/view`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags ViewSettingController
         * @name PatchNuxeoSettingView
         * @request PATCH:/api/nuxeo/setting/view
         * @deprecated
         */
        patchNuxeoSettingView: (data: ViewSettingRequestDTO, params: RequestParams = {}) =>
            this.request<ResultViewSettingResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/setting/view`,
                method: "PATCH",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Identity
         * @name PatchNuxeoIdentityUserPassword
         * @summary Update user password
         * @request PATCH:/api/nuxeo/identity/user/password
         */
        patchNuxeoIdentityUserPassword: (
            query: {
                userId: string;
                password: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/identity/user/password`,
                method: "PATCH",
                query: query,
                ...params,
            }),

        /**
         * @description Update the status of an import job
         *
         * @tags ExternalStorageImportJobController
         * @name PatchImportjobsIdStatus
         * @summary Update import job status
         * @request PATCH:/api/importJobs/{id}/status
         * @deprecated
         */
        patchImportjobsIdStatus: (id: string, data: ExternalStorageImportJobRequestDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/importJobs/${id}/status`,
                method: "PATCH",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * @description Change the status of an external storage (A/D)
         *
         * @tags ExternalStorageController
         * @name PatchExternalstorageIdStatus
         * @summary Active/Inactive a external storage
         * @request PATCH:/api/externalStorage/{id}/status
         * @deprecated
         */
        patchExternalstorageIdStatus: (id: string, data: ExternalStorageRequestDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/externalStorage/${id}/status`,
                method: "PATCH",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * @description Update profile status of a specific external storage, status value=[A/D]
         *
         * @tags ExternalStorageController
         * @name PatchExternalstorageIdProfilesProfileidStatus
         * @summary Active/Inactive a external profile
         * @request PATCH:/api/externalStorage/{id}/profiles/{profileId}/status
         * @deprecated
         */
        patchExternalstorageIdProfilesProfileidStatus: (
            id: string,
            profileId: string,
            data: ExternalProfileDTO,
            params: RequestParams = {},
        ) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/externalStorage/${id}/profiles/${profileId}/status`,
                method: "PATCH",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ExternalStorageController
         * @name PatchExternalstorageIdProfilesProfileidProcess
         * @summary Update an setting of existing external profile for a specific external storage
         * @request PATCH:/api/externalStorage/{id}/profiles/{profileId}/process
         * @deprecated
         */
        patchExternalstorageIdProfilesProfileidProcess: (
            id: string,
            profileId: string,
            data: Record<string, object>,
            params: RequestParams = {},
        ) =>
            this.request<ResultExternalProfileDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/externalStorage/${id}/profiles/${profileId}/process`,
                method: "PATCH",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ExternalStorageController
         * @name PatchExternalstorageIdProfilesProfileidImport
         * @summary Update an import setting of existing external profile for a specific external storage
         * @request PATCH:/api/externalStorage/{id}/profiles/{profileId}/import
         * @deprecated
         */
        patchExternalstorageIdProfilesProfileidImport: (
            id: string,
            profileId: string,
            data: Record<string, object>,
            params: RequestParams = {},
        ) =>
            this.request<ResultExternalProfileDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/externalStorage/${id}/profiles/${profileId}/import`,
                method: "PATCH",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ExternalStorageController
         * @name PatchExternalstorageIdProfilesProfileidGeneral
         * @summary Update an general setting of existing external profile for a specific external storage
         * @request PATCH:/api/externalStorage/{id}/profiles/{profileId}/general
         * @deprecated
         */
        patchExternalstorageIdProfilesProfileidGeneral: (
            id: string,
            profileId: string,
            data: ExternalProfileDTO,
            params: RequestParams = {},
        ) =>
            this.request<ResultExternalProfileDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/externalStorage/${id}/profiles/${profileId}/general`,
                method: "PATCH",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ExternalStorageController
         * @name PatchExternalstorageIdProfilesProfileidCapture
         * @summary Update an capture setting of existing external profile for a specific external storage
         * @request PATCH:/api/externalStorage/{id}/profiles/{profileId}/capture
         * @deprecated
         */
        patchExternalstorageIdProfilesProfileidCapture: (
            id: string,
            profileId: string,
            data: Record<string, object>,
            params: RequestParams = {},
        ) =>
            this.request<ResultExternalProfileDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/externalStorage/${id}/profiles/${profileId}/capture`,
                method: "PATCH",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ExternalStorageController
         * @name PatchExternalstorageProfilesProfileidOutputrecordOutputrecordidStatus
         * @summary Active/Inactive a external profile output record
         * @request PATCH:/api/externalStorage/profiles/{profileId}/outputRecord/{outputRecordId}/status
         * @deprecated
         */
        patchExternalstorageProfilesProfileidOutputrecordOutputrecordidStatus: (
            profileId: string,
            outputRecordId: string,
            data: ExternalProfileOutputDTO,
            params: RequestParams = {},
        ) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/externalStorage/profiles/${profileId}/outputRecord/${outputRecordId}/status`,
                method: "PATCH",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags EventCalendarController
         * @name PatchEventCalendarsSettingIdStatus
         * @summary Update Event Calendar Setting Status
         * @request PATCH:/api/event/calendars/setting/{id}/status
         * @deprecated
         */
        patchEventCalendarsSettingIdStatus: (id: string, data: StatusRequest, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/event/calendars/setting/${id}/status`,
                method: "PATCH",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name PatchDocpaltypeSettingsMetadataV2Update
         * @request PATCH:/api/docpalType/settings/metadata-v2/update
         */
        patchDocpaltypeSettingsMetadataV2Update: (data: MetaDataDefinitionRequestDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpalType/settings/metadata-v2/update`,
                method: "PATCH",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name GetDocpaltypeSettingsActive
         * @summary Query the list of activated docpal types
         * @request GET:/api/docpalType/settings/active
         */
        getDocpaltypeSettingsActive: (params: RequestParams = {}) =>
            this.request<ResultListDocPalType, Result | (ResultObject | Result | ResultString)>({
                path: `/docpalType/settings/active`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name PatchDocpaltypeSettingsActive
         * @summary Active or UnActive DocPal Type
         * @request PATCH:/api/docpalType/settings/active
         */
        patchDocpaltypeSettingsActive: (data: DocPalTypeRequestDTO, params: RequestParams = {}) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpalType/settings/active`,
                method: "PATCH",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Watermark Template
         * @name PatchWatermarkTemplatesDeprecate
         * @summary Modify watermark template and watermark setting list
         * @request PATCH:/api/docpal/watermark/templates/
         * @deprecated
         */
        patchWatermarkTemplatesDeprecate: (data: WMKTemplateRequestDTO, params: RequestParams = {}) =>
            this.request<ResultWMKTemplateRequestDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/watermark/templates/`,
                method: "PATCH",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Watermark Settings
         * @name PatchWatermarkSettingsDeprecate
         * @summary update single watermark settings
         * @request PATCH:/api/docpal/watermark/settings/
         * @deprecated
         */
        patchWatermarkSettingsDeprecate: (data: WatermarkSettingsDTO, params: RequestParams = {}) =>
            this.request<ResultWatermarkSettingsDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/watermark/settings/`,
                method: "PATCH",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocumentTemplateController
         * @name PatchTemplateDocumentUpdatetemplatevariable
         * @summary Update document template variables
         * @request PATCH:/api/docpal/template/document/updateTemplateVariable
         */
        patchTemplateDocumentUpdatetemplatevariable: (
            data: {
                /** @format string */
                id?: string;
                /** @format string */
                templateVariable?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultDocumentTemplateResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/template/document/updateTemplateVariable`,
                method: "PATCH",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags RetentionPolicyController
         * @name PatchPolicyRetentionsIdStatusStatus
         * @summary Modify status by id
         * @request PATCH:/api/docpal/policy/retentions/{id}/status/{status}
         */
        patchPolicyRetentionsIdStatusStatus: (id: string, status: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/policy/retentions/${id}/status/${status}`,
                method: "PATCH",
                ...params,
            }),

        /**
         * No description
         *
         * @tags HoldPolicyController
         * @name PatchPolicyHoldsIdStatusStatus
         * @summary Modify status by id
         * @request PATCH:/api/docpal/policy/holds/{id}/status/{status}
         */
        patchPolicyHoldsIdStatusStatus: (id: string, status: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/policy/holds/${id}/status/${status}`,
                method: "PATCH",
                ...params,
            }),

        /**
         * No description
         *
         * @tags MasterTableController
         * @name PatchMasterTablesIdRecordStatus
         * @summary Enable or Disable Record
         * @request PATCH:/api/docpal/master/tables/{id}/record/status
         * @deprecated
         */
        patchMasterTablesIdRecordStatus: (id: string, data: MTRecordRequestDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/master/tables/${id}/record/status`,
                method: "PATCH",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags FormDesignController
         * @name PatchFormDesignName
         * @summary Update name of form design
         * @request PATCH:/api/docpal/form/design/name
         * @deprecated
         */
        patchFormDesignName: (data: FormDesignRequestDTO, params: RequestParams = {}) =>
            this.request<ResultFormDesignResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/form/design/name`,
                method: "PATCH",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags FormDesignController
         * @name PatchFormDesignEnableId
         * @summary Enable a form design
         * @request PATCH:/api/docpal/form/design/enable/{id}
         * @deprecated
         */
        patchFormDesignEnableId: (id: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/form/design/enable/${id}`,
                method: "PATCH",
                ...params,
            }),

        /**
         * No description
         *
         * @tags FormDesignController
         * @name PatchFormDesignDisableId
         * @summary Disable a form design
         * @request PATCH:/api/docpal/form/design/disable/{id}
         * @deprecated
         */
        patchFormDesignDisableId: (id: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/form/design/disable/${id}`,
                method: "PATCH",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Profile APIs
         * @name PatchCompanyprofilesCompanyidStatus
         * @summary Update company status [Active or Unactive]
         * @request PATCH:/api/docpal/companyProfiles/{companyId}/status
         * @deprecated
         */
        patchCompanyprofilesCompanyidStatus: (companyId: string, data: Company, params: RequestParams = {}) =>
            this.request<ResultCompany, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/companyProfiles/${companyId}/status`,
                method: "PATCH",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTypeController
         * @name PatchCaseTypesVersionVersionidSave
         * @summary Edit XML file [cmmn.xml] of version
         * @request PATCH:/api/docpal/case/types/version/{versionId}/save
         * @deprecated
         */
        patchCaseTypesVersionVersionidSave: (
            versionId: string,
            query: {
                /** @format binary */
                file: File;
            },
            data: {
                /** @format binary */
                file?: File;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultCmmnVersion, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/types/version/${versionId}/save`,
                method: "PATCH",
                query: query,
                body: data,
                type: ContentType.FormData,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTypeController
         * @name PatchCaseTypesVersionVersionidSaveall
         * @summary [Test API] Save XML file for all version of case definition
         * @request PATCH:/api/docpal/case/types/version/{versionId}/saveAll
         * @deprecated
         */
        patchCaseTypesVersionVersionidSaveall: (
            versionId: string,
            query: {
                /** @format binary */
                file: File;
            },
            data: {
                /** @format binary */
                file?: File;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultVoid, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/types/version/${versionId}/saveAll`,
                method: "PATCH",
                query: query,
                body: data,
                type: ContentType.FormData,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTableController
         * @name PatchCaseTablesFields
         * @summary The Case Table has been augmented with the addition of multiple columns.
         * @request PATCH:/api/docpal/case/tables/fields
         * @deprecated
         */
        patchCaseTablesFields: (data: CaseTableRequestDTO, params: RequestParams = {}) =>
            this.request<ResultCaseTableResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/tables/fields`,
                method: "PATCH",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CalendarController
         * @name PatchCalendarsIdStatusStatus
         * @summary Modify status by id
         * @request PATCH:/api/docpal/calendars/{id}/status/{status}
         * @deprecated
         */
        patchCalendarsIdStatusStatus: (id: string, status: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/calendars/${id}/status/${status}`,
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
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/verification/permission/business/${businessId}`,
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
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/verification/permission/acl/permission/`,
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
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/verification/permission/acl/permission`,
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
            this.request<ResultAclUserPermission, Result | (ResultObject | Result | ResultString)>({
                path: `/user/permission/${id}`,
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
            this.request<ResultListAclPermissionDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/user/permission/all/${userId}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Document
         * @name GetRegisteredServerContactgroupIdUserUseridPermission
         * @summary Get permission of contact group
         * @request GET:/api/registered-server/contactGroup/{id}/user/{userId}/permission
         */
        getRegisteredServerContactgroupIdUserUseridPermission: (
            id: string,
            userId: string,
            params: RequestParams = {},
        ) =>
            this.request<ResultListString, Result | (ResultObject | Result | ResultString)>({
                path: `/registered-server/contactGroup/${id}/user/${userId}/permission`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Document
         * @name GetRegisteredServerContactgroupList
         * @summary Query all contact group without filter condition
         * @request GET:/api/registered-server/contactGroup/list
         */
        getRegisteredServerContactgroupList: (
            query: {
                operator: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListContactGroupResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/registered-server/contactGroup/list`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Document
         * @name GetRegisteredServerContactgroupHistorical
         * @summary Query all historical contact group without filter condition
         * @request GET:/api/registered-server/contactGroup/historical
         */
        getRegisteredServerContactgroupHistorical: (params: RequestParams = {}) =>
            this.request<ResultListContactGroupResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/registered-server/contactGroup/historical`,
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
            this.request<ResultAclPermissionDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/permissions/${id}`,
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
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/permissions/${id}`,
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
            this.request<ResultAclPermissionDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/permissions/name/${name}`,
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
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/permissions/name/${name}`,
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
            this.request<ResultAclUserInformation, Result | (ResultObject | Result | ResultString)>({
                path: `/permission/users/${id}`,
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
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/permission/users/${id}`,
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
            this.request<ResultListAclUserRelationshipWithUserGroup, Result | (ResultObject | Result | ResultString)>({
                path: `/permission/user/relationships/groupId/${groupId}`,
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
            this.request<ResultAclUserGroup, Result | (ResultObject | Result | ResultString)>({
                path: `/permission/user/group/${id}`,
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
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/permission/user/group/${id}`,
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
            this.request<ResultAclUserGroupDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/permission/user/group/${groupId}/users`,
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
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/permission/user/group/groups/all`,
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
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/permission/user/group/all`,
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
            this.request<ResultAccessControlEntry, Result | (ResultObject | Result | ResultString)>({
                path: `/permission/entry/${id}`,
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
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/permission/entry/${id}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Password Controller
         * @name GetPasswordUserStatus
         * @request GET:/api/password/user-status
         */
        getPasswordUserStatus: (params: RequestParams = {}) =>
            this.request<ResultUserStatusDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/password/user-status`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Password Controller
         * @name GetPasswordHasLockUserid
         * @request GET:/api/password/has-lock/{userId}
         */
        getPasswordHasLockUserid: (userId: string, params: RequestParams = {}) =>
            this.request<ResultLockUserDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/password/has-lock/${userId}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Password Controller
         * @name GetPasswordConfig
         * @request GET:/api/password/config
         */
        getPasswordConfig: (params: RequestParams = {}) =>
            this.request<ResultPasswordConfigDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/password/config`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Password Controller
         * @name GetPasswordCheckLockUserUserid
         * @request GET:/api/password/check-lock-user/{userId}
         */
        getPasswordCheckLockUserUserid: (
            userId: string,
            query?: {
                skipAddLoginCount?: boolean;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultLockUserDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/password/check-lock-user/${userId}`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Password Controller
         * @name GetPasswordCheckExpire
         * @request GET:/api/password/check-expire
         */
        getPasswordCheckExpire: (params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/password/check-expire`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags User Management APIs
         * @name GetNuxeoUserKeycloakKeycloakuserid
         * @summary Get keycloak user through keycloak user id
         * @request GET:/api/nuxeo/user/keycloak/{keycloakUserId}
         */
        getNuxeoUserKeycloakKeycloakuserid: (keycloakUserId: string, params: RequestParams = {}) =>
            this.request<ResultUserDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/user/keycloak/${keycloakUserId}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags SmartFolderController
         * @name GetNuxeoSfolderId
         * @request GET:/api/nuxeo/sfolder/{id}
         * @deprecated
         */
        getNuxeoSfolderId: (id: string, params: RequestParams = {}) =>
            this.request<ResultSmartFolderResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/sfolder/${id}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags SmartFolderController
         * @name DeleteNuxeoSfolderId
         * @request DELETE:/api/nuxeo/sfolder/{id}
         * @deprecated
         */
        deleteNuxeoSfolderId: (id: string, params: RequestParams = {}) =>
            this.request<ResultSmartFolderResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/sfolder/${id}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags SmartFolderController
         * @name GetNuxeoSfolderPageConditions
         * @summary Obtain all conditions that has been used
         * @request GET:/api/nuxeo/sfolder/page/conditions
         * @deprecated
         */
        getNuxeoSfolderPageConditions: (params: RequestParams = {}) =>
            this.request<ResultListConditionResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/sfolder/page/conditions`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Identity
         * @name GetNuxeoIdentitySendInitPasswordEmailUserid
         * @request GET:/api/nuxeo/identity/send-init-password-email/{userId}
         */
        getNuxeoIdentitySendInitPasswordEmailUserid: (userId: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/identity/send-init-password-email/${userId}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags wopi-host-controller
         * @name GetNuxeoGetofficetokenId
         * @request GET:/api/nuxeo/getOfficeToken/{id}
         */
        getNuxeoGetofficetokenId: (id: string, params: RequestParams = {}) =>
            this.request<ResultString, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/getOfficeToken/${id}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Document
         * @name GetNuxeoDocumentVersions
         * @request GET:/api/nuxeo/document/versions
         */
        getNuxeoDocumentVersions: (
            query: {
                idOrPath: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultObjects, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/document/versions`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Document
         * @name GetNuxeoDocumentQueryaudittemplate
         * @request GET:/api/nuxeo/document/queryAuditTemplate
         */
        getNuxeoDocumentQueryaudittemplate: (params: RequestParams = {}) =>
            this.request<ResultListAuditTemplate, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/document/queryAuditTemplate`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags NuxeoAdminController
         * @name GetNuxeoAdminVirtualfolderSettingId
         * @request GET:/api/nuxeo/admin/virtualfolder/setting/{id}
         * @deprecated
         */
        getNuxeoAdminVirtualfolderSettingId: (id: string, params: RequestParams = {}) =>
            this.request<ResultVirtualFolderSettingResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/admin/virtualfolder/setting/${id}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags NuxeoAdminController
         * @name DeleteNuxeoAdminVirtualfolderSettingId
         * @request DELETE:/api/nuxeo/admin/virtualfolder/setting/{id}
         * @deprecated
         */
        deleteNuxeoAdminVirtualfolderSettingId: (id: string, params: RequestParams = {}) =>
            this.request<ResultVirtualFolderSettingResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/admin/virtualfolder/setting/${id}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags NuxeoAdminController
         * @name GetNuxeoAdminSettingLanguage
         * @request GET:/api/nuxeo/admin/setting/language
         * @deprecated
         */
        getNuxeoAdminSettingLanguage: (params: RequestParams = {}) =>
            this.request<ResultString, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/admin/setting/language`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags NuxeoAdminController
         * @name GetNuxeoAdminIcons
         * @request GET:/api/nuxeo/admin/icons
         * @deprecated
         */
        getNuxeoAdminIcons: (params: RequestParams = {}) =>
            this.request<ResultListCustomIconDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/admin/icons`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags NuxeoAdminController
         * @name GetNuxeoAdminConcurrentSession
         * @summary Query concurrent session configuration
         * @request GET:/api/nuxeo/admin/concurrent-session
         * @deprecated
         */
        getNuxeoAdminConcurrentSession: (
            query: {
                tenantId: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultInteger, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/admin/concurrent-session`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags MessageQueue
         * @name GetMessageQueueDocumentidMessage
         * @summary Query record By documentId
         * @request GET:/api/message/queue/{documentId}/message
         */
        getMessageQueueDocumentidMessage: (documentId: string, params: RequestParams = {}) =>
            this.request<ResultListBusinessResultRecord, Result | (ResultObject | Result | ResultString)>({
                path: `/message/queue/${documentId}/message`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags MessageQueue
         * @name GetMessageQueueTotal
         * @summary message total of every message queue
         * @request GET:/api/message/queue/total
         */
        getMessageQueueTotal: (
            query?: {
                messageQueueName?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListMQMessageTotalDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/message/queue/total`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags MessageQueue
         * @name GetMessageQueueReportStatusgroup
         * @summary Statistics by state
         * @request GET:/api/message/queue/report/statusGroup
         */
        getMessageQueueReportStatusgroup: (
            query?: {
                mqName?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListMQConsumeGroupStatusDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/message/queue/report/statusGroup`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags MessageQueue
         * @name GetMessageQueueReportHoursgroup
         * @summary Statistics by per hours
         * @request GET:/api/message/queue/report/hoursGroup
         */
        getMessageQueueReportHoursgroup: (
            query: {
                mqName: string;
                date: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListMQDayTotalDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/message/queue/report/hoursGroup`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags MessageQueue
         * @name GetMessageQueueReportDaygroup
         * @summary Statistics by per day
         * @request GET:/api/message/queue/report/dayGroup
         */
        getMessageQueueReportDaygroup: (
            query?: {
                mqName?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListMQDayTotalDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/message/queue/report/dayGroup`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags MessageQueue
         * @name GetMessageQueueConsumes
         * @summary The configuration of message queue
         * @request GET:/api/message/queue/consumes
         */
        getMessageQueueConsumes: (params: RequestParams = {}) =>
            this.request<ResultListMQConfigurationInfo, Result | (ResultObject | Result | ResultString)>({
                path: `/message/queue/consumes`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags ExternalStorageImportJobController
         * @name GetImportjobsPageConditions
         * @request GET:/api/importJobs/page/conditions
         * @deprecated
         */
        getImportjobsPageConditions: (params: RequestParams = {}) =>
            this.request<ResultListConditionResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/importJobs/page/conditions`,
                method: "GET",
                ...params,
            }),

        /**
         * @description Retrieve all profiles for a specific external storage
         *
         * @tags ExternalStorageController
         * @name GetExternalstorageIdProfilesList
         * @summary Get all profile by external storage id
         * @request GET:/api/externalStorage/{id}/profiles/list
         * @deprecated
         */
        getExternalstorageIdProfilesList: (id: string, params: RequestParams = {}) =>
            this.request<ResultListExternalProfileDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/externalStorage/${id}/profiles/list`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags ExternalStorageController
         * @name GetExternalstorageProfilesProfileidOutputrecordList
         * @summary Retrieve all output settings of specific profile
         * @request GET:/api/externalStorage/profiles/{profileId}/outputRecord/list
         * @deprecated
         */
        getExternalstorageProfilesProfileidOutputrecordList: (profileId: string, params: RequestParams = {}) =>
            this.request<ResultListMapStringObject, Result | (ResultObject | Result | ResultString)>({
                path: `/externalStorage/profiles/${profileId}/outputRecord/list`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags EventCalendarController
         * @name GetEventCalendarsSettings
         * @summary Get All Event Calendar Settings
         * @request GET:/api/event/calendars/settings
         * @deprecated
         */
        getEventCalendarsSettings: (
            query: {
                /** Event Calendar Setting */
                eventCalendarSetting: EventCalendarSetting;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListEventCalendarSetting, Result | (ResultObject | Result | ResultString)>({
                path: `/event/calendars/settings`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name GetDocpaltypeSettingsPageConditions
         * @summary Obtain all conditions that has been used
         * @request GET:/api/docpalType/settings/page/conditions
         */
        getDocpaltypeSettingsPageConditions: (params: RequestParams = {}) =>
            this.request<ResultListConditionResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpalType/settings/page/conditions`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name GetDocpaltypeSettingsNameName
         * @summary Obtain docpal type detail through name
         * @request GET:/api/docpalType/settings/name/{name}
         */
        getDocpaltypeSettingsNameName: (name: string, params: RequestParams = {}) =>
            this.request<ResultDocPalTypeResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpalType/settings/name/${name}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name DeleteDocpaltypeSettingsNameName
         * @summary Delete docpal type
         * @request DELETE:/api/docpalType/settings/name/{name}
         * @deprecated
         */
        deleteDocpaltypeSettingsNameName: (name: string, params: RequestParams = {}) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpalType/settings/name/${name}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name GetDocpaltypeSettingsMetadataDocumenttype
         * @summary Obtain all docpal type metadata list
         * @request GET:/api/docpalType/settings/metadata/{documentType}
         */
        getDocpaltypeSettingsMetadataDocumenttype: (documentType: string, params: RequestParams = {}) =>
            this.request<ResultDocumentTypeDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpalType/settings/metadata/${documentType}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name GetDocpaltypeSettingsMetadataV2QueryCache
         * @request GET:/api/docpalType/settings/metadata-v2/query-cache
         */
        getDocpaltypeSettingsMetadataV2QueryCache: (params: RequestParams = {}) =>
            this.request<ResultListMetadataResponseVO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpalType/settings/metadata-v2/query-cache`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name GetDocpaltypeSettingsExportMetadataDocumenttype
         * @summary Download .csv template file of master table for use import data
         * @request GET:/api/docpalType/settings/export/metadata/{documentType}
         * @deprecated
         */
        getDocpaltypeSettingsExportMetadataDocumenttype: (documentType: string, params: RequestParams = {}) =>
            this.request<string[], Result | (ResultObject | Result | ResultString)>({
                path: `/docpalType/settings/export/metadata/${documentType}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name GetDocpaltypeSettingsCategories
         * @summary Obtain all docpal type categories
         * @request GET:/api/docpalType/settings/categories
         */
        getDocpaltypeSettingsCategories: (params: RequestParams = {}) =>
            this.request<ResultListString, Result | (ResultObject | Result | ResultString)>({
                path: `/docpalType/settings/categories`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name GetDocpaltypeSettingsAll
         * @summary Find all docpal type
         * @request GET:/api/docpalType/settings/all
         */
        getDocpaltypeSettingsAll: (params: RequestParams = {}) =>
            this.request<ResultListDocPalType, Result | (ResultObject | Result | ResultString)>({
                path: `/docpalType/settings/all`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Version Controller
         * @name GetWorkflowVersion
         * @summary Get Version Data
         * @request GET:/api/docpal/workflow/version
         * @deprecated
         */
        getWorkflowVersion: (
            query: {
                draftId: string;
                versionNumber: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultProcessDefinitionVersion, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/version`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Version Controller
         * @name GetWorkflowVersionVersionid
         * @summary Get Version Data
         * @request GET:/api/docpal/workflow/version/{versionId}
         * @deprecated
         */
        getWorkflowVersionVersionid: (versionId: string, params: RequestParams = {}) =>
            this.request<ResultProcessDefinitionVersion, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/version/${versionId}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Version Controller
         * @name DeleteWorkflowVersionVersionid
         * @request DELETE:/api/docpal/workflow/version/{versionId}
         * @deprecated
         */
        deleteWorkflowVersionVersionid: (versionId: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/version/${versionId}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Version Controller
         * @name GetWorkflowVersionVersionidBpmnxml
         * @summary Download BPMN20.xml through version id of a workflow
         * @request GET:/api/docpal/workflow/version/{versionId}/bpmnXml
         * @deprecated
         */
        getWorkflowVersionVersionidBpmnxml: (versionId: string, params: RequestParams = {}) =>
            this.request<string[], Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/version/${versionId}/bpmnXml`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Version Controller
         * @name GetWorkflowVersionKeyProcessdefinitionkey
         * @summary Get Latest Version Data by process definition key
         * @request GET:/api/docpal/workflow/version/key/{processDefinitionKey}
         * @deprecated
         */
        getWorkflowVersionKeyProcessdefinitionkey: (processDefinitionKey: string, params: RequestParams = {}) =>
            this.request<ResultProcessDefinitionVersion, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/version/key/${processDefinitionKey}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Version Controller
         * @name GetWorkflowVersionJson
         * @summary Download Json through version number and draft id
         * @request GET:/api/docpal/workflow/version/json
         * @deprecated
         */
        getWorkflowVersionJson: (
            query: {
                draftId: string;
                versionNumber: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultString, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/version/json`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Version Controller
         * @name GetWorkflowVersionBpmnxml
         * @summary Download BPMN20.xml through version number and draft id
         * @request GET:/api/docpal/workflow/version/bpmnXml
         * @deprecated
         */
        getWorkflowVersionBpmnxml: (
            query: {
                draftId: string;
                versionNumber?: string;
                versionId?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<string[], Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/version/bpmnXml`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name GetWorkflowVariablesInstanceid
         * @request GET:/api/docpal/workflow/variables/{instanceId}
         * @deprecated
         */
        getWorkflowVariablesInstanceid: (instanceId: string, params: RequestParams = {}) =>
            this.request<ResultMapStringObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/variables/${instanceId}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name GetWorkflowStartFormProperties
         * @request GET:/api/docpal/workflow/start-form/properties
         * @deprecated
         */
        getWorkflowStartFormProperties: (
            query: {
                processKey: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListFormPropertyDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/start-form/properties`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name GetWorkflowQuerydocumenttypeprofileid
         * @request GET:/api/docpal/workflow/querydocumentTypeProFileId
         */
        getWorkflowQuerydocumenttypeprofileid: (
            query: {
                documentType: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListLong, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/querydocumentTypeProFileId`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name GetWorkflowQuerymetadatamapping
         * @request GET:/api/docpal/workflow/queryMetadataMapping
         */
        getWorkflowQuerymetadatamapping: (
            query?: {
                /** @format int64 */
                id?: number;
                name?: string;
                metaDataMapper?: string;
                /** @format int32 */
                version?: number;
                createUserId?: string;
                createUserName?: string;
                /** @format date-time */
                createTime?: string;
                updateUserId?: string;
                updateUserName?: string;
                /** @format date-time */
                updateTime?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListDocumentTypeMetadataMapping, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/queryMetadataMapping`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name GetWorkflowQuerymetadatamappingnames
         * @request GET:/api/docpal/workflow/queryMetadataMappingNames
         */
        getWorkflowQuerymetadatamappingnames: (params: RequestParams = {}) =>
            this.request<ResultListString, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/queryMetadataMappingNames`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name GetWorkflowQuerydocumenttypeprofile
         * @request GET:/api/docpal/workflow/queryDocumentTypeProfile
         */
        getWorkflowQuerydocumenttypeprofile: (
            query?: {
                /** @format int64 */
                id?: number;
                documentType?: string;
                profileID?: string;
                profileName?: string;
                rootPath?: string;
                folder?: string;
                /** @format int32 */
                version?: number;
                createUserId?: string;
                createUserName?: string;
                /** @format date-time */
                createTime?: string;
                updateUserId?: string;
                updateUserName?: string;
                /** @format date-time */
                updateTime?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListDocumentTypeProfileSetting, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/queryDocumentTypeProfile`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name GetWorkflowQuerydocumenttypeprofilesettings
         * @request GET:/api/docpal/workflow/queryDocumentTypeProFileSettings
         */
        getWorkflowQuerydocumenttypeprofilesettings: (params: RequestParams = {}) =>
            this.request<ResultMapStringListMapStringString, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/queryDocumentTypeProFileSettings`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name GetWorkflowProcessInstanceProcessinstanceid
         * @request GET:/api/docpal/workflow/process/instance/{processInstanceId}
         * @deprecated
         */
        getWorkflowProcessInstanceProcessinstanceid: (processInstanceId: string, params: RequestParams = {}) =>
            this.request<ResultProcessInstanceDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/process/instance/${processInstanceId}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name GetWorkflowProcessGetprocessdefinitionlist
         * @request GET:/api/docpal/workflow/process/getProcessDefinitionList
         * @deprecated
         */
        getWorkflowProcessGetprocessdefinitionlist: (
            query?: {
                processKey?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListProcessDefinitionDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/process/getProcessDefinitionList`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Process Definition Controller
         * @name GetWorkflowProcessDefinitionProcessdefinitionkey
         * @summary Get deployed process definition through process definition key
         * @request GET:/api/docpal/workflow/process/definition/{processDefinitionKey}
         * @deprecated
         */
        getWorkflowProcessDefinitionProcessdefinitionkey: (processDefinitionKey: string, params: RequestParams = {}) =>
            this.request<ResultProcessDefinitionDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/process/definition/${processDefinitionKey}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Process Definition Controller
         * @name GetWorkflowProcessDefinitionProcessdefinitionkeyHistory
         * @summary Find historical process definitions through process definition key
         * @request GET:/api/docpal/workflow/process/definition/{processDefinitionKey}/history
         * @deprecated
         */
        getWorkflowProcessDefinitionProcessdefinitionkeyHistory: (
            processDefinitionKey: string,
            params: RequestParams = {},
        ) =>
            this.request<ResultListProcessDefinitionDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/process/definition/${processDefinitionKey}/history`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Process Definition Controller
         * @name GetWorkflowProcessDefinitionForms
         * @summary Get the list of form properties associated with the process definition
         * @request GET:/api/docpal/workflow/process/definition/forms
         * @deprecated
         */
        getWorkflowProcessDefinitionForms: (
            query?: {
                processDefinitionKey?: string;
                processDefinitionId?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListBpmnDynamicFormDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/process/definition/forms`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Process Definition Controller
         * @name GetWorkflowProcessDefinitionFormsElementkey
         * @summary Get form properties of single element associated with the process definition
         * @request GET:/api/docpal/workflow/process/definition/forms/{elementKey}
         * @deprecated
         */
        getWorkflowProcessDefinitionFormsElementkey: (
            elementKey: string,
            query?: {
                processDefinitionKey?: string;
                processDefinitionId?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListFormPropertyDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/process/definition/forms/${elementKey}`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Process Definition Controller
         * @name GetWorkflowProcessDefinitionFormsStart
         * @summary Get start-form properties associated with the process definition
         * @request GET:/api/docpal/workflow/process/definition/forms/start
         * @deprecated
         */
        getWorkflowProcessDefinitionFormsStart: (
            query: {
                /** Workflow Process Definition RequestDTO */
                requestDTO: ProcessDefinitionRequestDTO;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultBpmnDynamicFormDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/process/definition/forms/start`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Process Definition Controller
         * @name GetWorkflowProcessDefinitionDraftDraftid
         * @summary Get draft through process definition key
         * @request GET:/api/docpal/workflow/process/definition/draft/{draftId}
         * @deprecated
         */
        getWorkflowProcessDefinitionDraftDraftid: (draftId: string, params: RequestParams = {}) =>
            this.request<ResultProcessDefinitionResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/process/definition/draft/${draftId}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Process Definition Controller
         * @name DeleteWorkflowProcessDefinitionDraftDraftid
         * @summary Delete process definition through process definition draft id
         * @request DELETE:/api/docpal/workflow/process/definition/draft/{draftId}
         * @deprecated
         */
        deleteWorkflowProcessDefinitionDraftDraftid: (
            draftId: string,
            query?: {
                enforce?: boolean;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/process/definition/draft/${draftId}`,
                method: "DELETE",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Process Definition Controller
         * @name GetWorkflowProcessDefinitionDraftDraftidDownloadXml
         * @summary Get draft BPMN2.0 XML file through draft id
         * @request GET:/api/docpal/workflow/process/definition/draft/{draftId}/download/xml
         * @deprecated
         */
        getWorkflowProcessDefinitionDraftDraftidDownloadXml: (draftId: string, params: RequestParams = {}) =>
            this.request<string[], Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/process/definition/draft/${draftId}/download/xml`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Process Definition Controller
         * @name GetWorkflowProcessDefinitionDraftAll
         * @request GET:/api/docpal/workflow/process/definition/draft/all
         * @deprecated
         */
        getWorkflowProcessDefinitionDraftAll: (params: RequestParams = {}) =>
            this.request<ResultListProcessDefinitionDraft, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/process/definition/draft/all`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Process Definition Controller
         * @name GetWorkflowProcessDefinitionDownloadXml
         * @summary Download BPMN2.0 XML file through process definition ID
         * @request GET:/api/docpal/workflow/process/definition/download/xml
         * @deprecated
         */
        getWorkflowProcessDefinitionDownloadXml: (
            query: {
                processDefinitionId: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<string[], Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/process/definition/download/xml`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name GetWorkflowForms
         * @summary Get the list of form properties associated with the process definition
         * @request GET:/api/docpal/workflow/forms
         * @deprecated
         */
        getWorkflowForms: (
            query?: {
                processDefinitionKey?: string;
                processDefinitionId?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListBpmnDynamicFormDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/forms`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name GetWorkflowFormsElementkey
         * @summary Get form properties of single element associated with the process definition
         * @request GET:/api/docpal/workflow/forms/{elementKey}
         * @deprecated
         */
        getWorkflowFormsElementkey: (
            elementKey: string,
            query?: {
                processDefinitionKey?: string;
                processDefinitionId?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListFormPropertyDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/forms/${elementKey}`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags whats-app-controller
         * @name GetWhatsappTestConnection
         * @request GET:/api/docpal/whatsapp/test_connection
         */
        getWhatsappTestConnection: (params: RequestParams = {}) =>
            this.request<ResultString, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/whatsapp/test_connection`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags whats-app-controller
         * @name GetWhatsappLanguageList
         * @request GET:/api/docpal/whatsapp/language_list
         */
        getWhatsappLanguageList: (params: RequestParams = {}) =>
            this.request<ResultListLanguageDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/whatsapp/language_list`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Watermark Template
         * @name GetWatermarkTemplatesId
         * @summary Query watermark template by ID
         * @request GET:/api/docpal/watermark/templates/{id}
         * @deprecated
         */
        getWatermarkTemplatesId: (id: string, params: RequestParams = {}) =>
            this.request<ResultWMKTemplateRequestDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/watermark/templates/${id}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Watermark Template
         * @name DeleteWatermarkTemplatesId
         * @summary Delete watermark template by id
         * @request DELETE:/api/docpal/watermark/templates/{id}
         * @deprecated
         */
        deleteWatermarkTemplatesId: (id: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/watermark/templates/${id}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Watermark Template
         * @name GetWatermarkTemplatesNameName
         * @summary Query watermark template by name
         * @request GET:/api/docpal/watermark/templates/name/{name}
         * @deprecated
         */
        getWatermarkTemplatesNameName: (name: string, params: RequestParams = {}) =>
            this.request<ResultWMKTemplateRequestDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/watermark/templates/name/${name}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Watermark Template
         * @name DeleteWatermarkTemplatesNameName
         * @summary Delete watermark template by name
         * @request DELETE:/api/docpal/watermark/templates/name/{name}
         * @deprecated
         */
        deleteWatermarkTemplatesNameName: (name: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/watermark/templates/name/${name}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Watermark Template
         * @name GetWatermarkTemplatesAll
         * @summary Query all watermark template
         * @request GET:/api/docpal/watermark/templates/all
         * @deprecated
         */
        getWatermarkTemplatesAll: (params: RequestParams = {}) =>
            this.request<ResultListWatermarkSettingsTemplate, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/watermark/templates/all`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Watermark Settings
         * @name GetWatermarkSettingsId
         * @summary query watermark settings
         * @request GET:/api/docpal/watermark/settings/{id}
         * @deprecated
         */
        getWatermarkSettingsId: (id: string, params: RequestParams = {}) =>
            this.request<ResultWatermarkSettingsDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/watermark/settings/${id}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Watermark Settings
         * @name DeleteWatermarkSettingsId
         * @summary Delete watermark settings by id
         * @request DELETE:/api/docpal/watermark/settings/{id}
         * @deprecated
         */
        deleteWatermarkSettingsId: (id: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/watermark/settings/${id}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Watermark Settings
         * @name GetWatermarkSettingsTemplateTemplateid
         * @summary Query list of watermark settings by template id
         * @request GET:/api/docpal/watermark/settings/template/{templateId}
         * @deprecated
         */
        getWatermarkSettingsTemplateTemplateid: (templateId: string, params: RequestParams = {}) =>
            this.request<ResultListWatermarkSettingsDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/watermark/settings/template/${templateId}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Watermark Settings
         * @name GetWatermarkSettingsRepairdata
         * @request GET:/api/docpal/watermark/settings/repairData
         * @deprecated
         */
        getWatermarkSettingsRepairdata: (params: RequestParams = {}) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/watermark/settings/repairData`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Watermark Settings
         * @name GetWatermarkSettingsPreviewId
         * @summary preview watermark settings to return byte array
         * @request GET:/api/docpal/watermark/settings/preview/{id}
         * @deprecated
         */
        getWatermarkSettingsPreviewId: (id: string, params: RequestParams = {}) =>
            this.request<string[], Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/watermark/settings/preview/${id}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Watermark Settings
         * @name GetWatermarkSettingsContenttype
         * @summary Get list of content type of watermark setting
         * @request GET:/api/docpal/watermark/settings/contentType
         * @deprecated
         */
        getWatermarkSettingsContenttype: (params: RequestParams = {}) =>
            this.request<ResultListWMContentTypeDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/watermark/settings/contentType`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags User Management APIs
         * @name GetUsers
         * @request GET:/api/docpal/users
         */
        getUsers: (params: RequestParams = {}) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/users`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags User Management APIs
         * @name GetNuxeoUserUserid
         * @summary Get User information through user-id
         * @request GET:/api/nuxeo/user/{userId}
         */
        getNuxeoUserUserid: (userId: string, params: RequestParams = {}) =>
            this.request<ResultUserDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/user/${userId}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags User Management APIs
         * @name GetUserUserid
         * @summary Get User information through user-id
         * @request GET:/api/docpal/user/{userId}
         */
        getUserUserid: (userId: string, params: RequestParams = {}) =>
            this.request<ResultUserDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/user/${userId}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags UserSettingController
         * @name GetUserSystemFields
         * @summary Get system fields
         * @request GET:/api/docpal/user/system/fields
         * @deprecated
         */
        getUserSystemFields: (params: RequestParams = {}) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/user/system/fields`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags User Management APIs, UserSettingController
         * @name GetUserGetapplication
         * @summary Get current user information
         * @request GET:/api/docpal/user/getApplication
         * @deprecated
         */
        getUserGetapplication: (params: RequestParams = {}) =>
            this.request<ResultUserDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/user/getApplication`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags User Management APIs
         * @name GetNuxeoUserGetapplication
         * @summary Get current user information
         * @request GET:/api/nuxeo/user/getApplication
         */
        getNuxeoUserGetapplication: (params: RequestParams = {}) =>
            this.request<ResultUserDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/user/getApplication`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name GetTypesSetting
         * @summary Load User Setting
         * @request GET:/api/docpal/types/setting
         */
        getTypesSetting: (params: RequestParams = {}) =>
            this.request<ResultString, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/types/setting`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name GetTypesList
         * @summary Obtain all list of actived docpal types
         * @request GET:/api/docpal/types/list
         */
        getTypesList: (
            query?: {
                isFolder?: boolean;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListDocumentTypeDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/types/list`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name GetTypesActive
         * @summary Obtain all list of actived docpal types
         * @request GET:/api/docpal/types/active
         */
        getTypesActive: (
            query?: {
                all?: boolean;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListDocumentTypeDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/types/active`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags EmailController
         * @name GetTemplateEmailId
         * @summary Obtain email template detail
         * @request GET:/api/docpal/template/email/{id}
         * @deprecated
         */
        getTemplateEmailId: (id: string, params: RequestParams = {}) =>
            this.request<ResultEmailTemplate, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/template/email/${id}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags EmailController
         * @name GetTemplateEmailTemplateId
         * @summary Obtain email template detail
         * @request GET:/api/docpal/template/email/template/{id}
         * @deprecated
         */
        getTemplateEmailTemplateId: (id: string, params: RequestParams = {}) =>
            this.request<ResultEmailTemplate, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/template/email/template/${id}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags EmailController
         * @name DeleteTemplateEmailTemplateId
         * @summary Delete email template by id
         * @request DELETE:/api/docpal/template/email/template/{id}
         * @deprecated
         */
        deleteTemplateEmailTemplateId: (id: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/template/email/template/${id}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags EmailController
         * @name GetTemplateEmailTemplateLayouts
         * @summary Obtain all layouts used by email template
         * @request GET:/api/docpal/template/email/template/layouts
         * @deprecated
         */
        getTemplateEmailTemplateLayouts: (params: RequestParams = {}) =>
            this.request<ResultListEmailLayout, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/template/email/template/layouts`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags EmailController
         * @name GetTemplateEmailLayouts
         * @summary Obtain all layouts used by email template
         * @request GET:/api/docpal/template/email/layouts
         * @deprecated
         */
        getTemplateEmailLayouts: (params: RequestParams = {}) =>
            this.request<ResultListEmailLayout, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/template/email/layouts`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags EmailController
         * @name GetTemplateEmailLayoutId
         * @summary Obtain email layout by id
         * @request GET:/api/docpal/template/email/layout/{id}
         * @deprecated
         */
        getTemplateEmailLayoutId: (id: number, params: RequestParams = {}) =>
            this.request<ResultEmailLayout, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/template/email/layout/${id}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags EmailController
         * @name DeleteTemplateEmailLayoutId
         * @summary Delete email layout by id
         * @request DELETE:/api/docpal/template/email/layout/{id}
         * @deprecated
         */
        deleteTemplateEmailLayoutId: (id: number, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/template/email/layout/${id}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags EmailController
         * @name GetTemplateEmailLayoutAll
         * @summary Obtain all email layout
         * @request GET:/api/docpal/template/email/layout/all
         * @deprecated
         */
        getTemplateEmailLayoutAll: (params: RequestParams = {}) =>
            this.request<ResultListEmailLayout, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/template/email/layout/all`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags EmailController
         * @name GetTemplateEmailAll
         * @request GET:/api/docpal/template/email/all
         * @deprecated
         */
        getTemplateEmailAll: (params: RequestParams = {}) =>
            this.request<ResultListEmailTemplate, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/template/email/all`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocumentTemplateController
         * @name GetTemplateDocumentId
         * @summary Get Document Template
         * @request GET:/api/docpal/template/document/{id}
         */
        getTemplateDocumentId: (id: string, params: RequestParams = {}) =>
            this.request<ResultDocumentTemplate, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/template/document/${id}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocumentTemplateController
         * @name DeleteTemplateDocumentId
         * @summary Delete Document Template by id
         * @request DELETE:/api/docpal/template/document/{id}
         */
        deleteTemplateDocumentId: (id: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/template/document/${id}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocumentTemplateController
         * @name GetTemplateDocumentSupportFiletype
         * @request GET:/api/docpal/template/document/support/fileType
         */
        getTemplateDocumentSupportFiletype: (params: RequestParams = {}) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/template/document/support/fileType`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocumentTemplateController
         * @name GetTemplateDocumentRefreshId
         * @summary Refresh document template variables
         * @request GET:/api/docpal/template/document/refresh/{id}
         */
        getTemplateDocumentRefreshId: (id: string, params: RequestParams = {}) =>
            this.request<ResultDocumentTemplateResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/template/document/refresh/${id}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocumentTemplateController
         * @name GetTemplateDocumentPageConditions
         * @summary Obtain all conditions that has been used
         * @request GET:/api/docpal/template/document/page/conditions
         */
        getTemplateDocumentPageConditions: (params: RequestParams = {}) =>
            this.request<ResultListConditionResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/template/document/page/conditions`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocumentTemplateController
         * @name GetTemplateDocumentAll
         * @summary Get All Document Template
         * @request GET:/api/docpal/template/document/all
         */
        getTemplateDocumentAll: (params: RequestParams = {}) =>
            this.request<ResultListDocumentTemplate, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/template/document/all`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags system-feature-controller
         * @name GetSystemfeatureUsers
         * @request GET:/api/docpal/systemfeature/users
         * @deprecated
         */
        getSystemfeatureUsers: (params: RequestParams = {}) =>
            this.request<Result, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/systemfeature/users`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags system-feature-controller
         * @name GetSystemfeatureUsersNameUsername
         * @request GET:/api/docpal/systemfeature/users/name/{username}
         * @deprecated
         */
        getSystemfeatureUsersNameUsername: (username: string, params: RequestParams = {}) =>
            this.request<Result, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/systemfeature/users/name/${username}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags system-feature-controller
         * @name GetSystemfeatureKeycloakTokenVerification
         * @request GET:/api/docpal/systemfeature/keycloak-token-verification
         * @deprecated
         */
        getSystemfeatureKeycloakTokenVerification: (params: RequestParams = {}) =>
            this.request<ResultMapStringString, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/systemfeature/keycloak-token-verification`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags system-feature-controller
         * @name GetSystemfeatureGetfeatures
         * @request GET:/api/docpal/systemfeature/getFeatures
         * @deprecated
         */
        getSystemfeatureGetfeatures: (params: RequestParams = {}) =>
            this.request<ResultMapStringBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/systemfeature/getFeatures`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags GlobalSettingController
         * @name GetSettingWorkflowConditionSetting
         * @request GET:/api/docpal/setting/workflow/condition/setting
         * @deprecated
         */
        getSettingWorkflowConditionSetting: (params: RequestParams = {}) =>
            this.request<ResultListMapStringObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/setting/workflow/condition/setting`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags GlobalSettingController
         * @name GetSettingFeaturerolemapping
         * @request GET:/api/docpal/setting/featureRoleMapping
         * @deprecated
         */
        getSettingFeaturerolemapping: (params: RequestParams = {}) =>
            this.request<ResultListMapStringObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/setting/featureRoleMapping`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags User Management APIs
         * @name GetRoles
         * @request GET:/api/docpal/roles
         */
        getRoles: (params: RequestParams = {}) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/roles`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags form-properties-relation-controller
         * @name GetRelationQuerylanguagelocale
         * @request GET:/api/docpal/relation/queryLanguageLocale
         * @deprecated
         */
        getRelationQuerylanguagelocale: (params: RequestParams = {}) =>
            this.request<ResultSetString, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/relation/queryLanguageLocale`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags form-properties-relation-controller
         * @name GetRelationInitelanguagecache
         * @request GET:/api/docpal/relation/initeLanguageCache
         * @deprecated
         */
        getRelationInitelanguagecache: (params: RequestParams = {}) =>
            this.request<Result, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/relation/initeLanguageCache`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags form-properties-relation-controller
         * @name GetRelationGetkeycloakproperty
         * @summary get keyCloakProperty
         * @request GET:/api/docpal/relation/getKeyCloakProperty
         * @deprecated
         */
        getRelationGetkeycloakproperty: (params: RequestParams = {}) =>
            this.request<ResultKeyCloakPropertyVO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/relation/getKeyCloakProperty`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags RetentionPolicyController
         * @name GetPolicyRetentionsId
         * @summary Obtain RetentionPolicy detail
         * @request GET:/api/docpal/policy/retentions/{id}
         */
        getPolicyRetentionsId: (id: string, params: RequestParams = {}) =>
            this.request<ResultRetentionPolicyResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/policy/retentions/${id}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags RetentionPolicyController
         * @name DeletePolicyRetentionsId
         * @summary Delete the retention policy it must not have been used yet
         * @request DELETE:/api/docpal/policy/retentions/{id}
         */
        deletePolicyRetentionsId: (id: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/policy/retentions/${id}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags RetentionPolicyController
         * @name GetPolicyRetentionsPageConditions
         * @summary Obtain all conditions that has been used
         * @request GET:/api/docpal/policy/retentions/page/conditions
         */
        getPolicyRetentionsPageConditions: (params: RequestParams = {}) =>
            this.request<ResultListConditionResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/policy/retentions/page/conditions`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags RetentionPolicyController
         * @name GetPolicyRetentionsDocumenttypeUsed
         * @summary Query used document-type of retention policies
         * @request GET:/api/docpal/policy/retentions/documentType/used
         */
        getPolicyRetentionsDocumenttypeUsed: (
            query: {
                documentType: string;
                /** @format int64 */
                id: number;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListRetentionTrigger, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/policy/retentions/documentType/used`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags HoldPolicyController
         * @name GetPolicyHoldsId
         * @summary Obtain hold policy detail
         * @request GET:/api/docpal/policy/holds/{id}
         */
        getPolicyHoldsId: (id: string, params: RequestParams = {}) =>
            this.request<ResultHoldPolicy, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/policy/holds/${id}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags HoldPolicyController
         * @name DeletePolicyHoldsId
         * @summary Delete the hold policy it must not have been used yet
         * @request DELETE:/api/docpal/policy/holds/{id}
         */
        deletePolicyHoldsId: (id: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/policy/holds/${id}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags PersonalDashboardController
         * @name GetPersonalDashboardId
         * @summary Obtain a dashboard detail
         * @request GET:/api/docpal/personal/dashboard/{id}
         */
        getPersonalDashboardId: (id: number, params: RequestParams = {}) =>
            this.request<ResultPersonalDashboard, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/personal/dashboard/${id}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags PersonalDashboardController
         * @name DeletePersonalDashboardId
         * @request DELETE:/api/docpal/personal/dashboard/{id}
         */
        deletePersonalDashboardId: (id: number, params: RequestParams = {}) =>
            this.request<ResultVoid, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/personal/dashboard/${id}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags OAuth2SettingController
         * @name GetOauth2Authenticationmethod
         * @summary Get all authentication way of OAuth2.0
         * @request GET:/api/docpal/oauth2/authenticationMethod
         * @deprecated
         */
        getOauth2Authenticationmethod: (params: RequestParams = {}) =>
            this.request<ResultOAuth2AuthenticationMethod, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/oauth2/authenticationMethod`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags OAuth2SettingController
         * @name GetOauth2AccesstokenSenderaddressSenderaddress
         * @request GET:/api/docpal/oauth2/accessToken/senderAddress/{senderAddress}
         * @deprecated
         */
        getOauth2AccesstokenSenderaddressSenderaddress: (senderAddress: string, params: RequestParams = {}) =>
            this.request<ResultString, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/oauth2/accessToken/senderAddress/${senderAddress}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags MetadataSchemaController
         * @name GetMetadataNameName
         * @request GET:/api/docpal/metadata/name/{name}
         */
        getMetadataNameName: (name: string, params: RequestParams = {}) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/metadata/name/${name}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags MetadataSchemaController
         * @name GetMetadataAll
         * @request GET:/api/docpal/metadata/all
         */
        getMetadataAll: (params: RequestParams = {}) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/metadata/all`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags template-message-controller
         * @name GetMessageTemplateQueryMessageTemplates
         * @request GET:/api/docpal/message/template/query_message_templates
         */
        getMessageTemplateQueryMessageTemplates: (params: RequestParams = {}) =>
            this.request<ResultListMessageTemplateDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/message/template/query_message_templates`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags template-message-controller
         * @name GetMessageTemplateQueryMessageTemplateTemplatename
         * @request GET:/api/docpal/message/template/query_message_template/{templateName}
         */
        getMessageTemplateQueryMessageTemplateTemplatename: (templateName: string, params: RequestParams = {}) =>
            this.request<ResultMessageTemplateDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/message/template/query_message_template/${templateName}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags template-message-controller
         * @name GetMessageTemplateFindTemplateNameList
         * @request GET:/api/docpal/message/template/find_template_name_list
         */
        getMessageTemplateFindTemplateNameList: (params: RequestParams = {}) =>
            this.request<ResultMessageTemplateListDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/message/template/find_template_name_list`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags template-message-controller
         * @name GetMessageTemplateFindTemplateInfoTemplatename
         * @request GET:/api/docpal/message/template/find_template_info/{templateName}
         */
        getMessageTemplateFindTemplateInfoTemplatename: (templateName: string, params: RequestParams = {}) =>
            this.request<ResultMessageTemplateDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/message/template/find_template_info/${templateName}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags template-message-controller
         * @name GetMessageTemplateDetailsId
         * @request GET:/api/docpal/message/template/details/{id}
         */
        getMessageTemplateDetailsId: (id: number, params: RequestParams = {}) =>
            this.request<ResultMessageTemplateDetailDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/message/template/details/${id}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags MasterTableController
         * @name GetMasterTablesId
         * @summary Get all fields of master table and include associated data structures
         * @request GET:/api/docpal/master/tables/{id}
         * @deprecated
         */
        getMasterTablesId: (id: string, params: RequestParams = {}) =>
            this.request<ResultMasterTableResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/master/tables/${id}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags MasterTableController
         * @name DeleteMasterTablesId
         * @request DELETE:/api/docpal/master/tables/{id}
         * @deprecated
         */
        deleteMasterTablesId: (
            id: string,
            query?: {
                enforceable?: boolean;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/master/tables/${id}`,
                method: "DELETE",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags MasterTableController
         * @name GetMasterTablesIdStructure
         * @summary Get data structure of master table，but not relation fields
         * @request GET:/api/docpal/master/tables/{id}/structure
         * @deprecated
         */
        getMasterTablesIdStructure: (id: string, params: RequestParams = {}) =>
            this.request<ResultMasterTableResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/master/tables/${id}/structure`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags MasterTableController
         * @name GetMasterTablesIdRecordRecordid
         * @summary Query row data record in single master table
         * @request GET:/api/docpal/master/tables/{id}/record/{recordId}
         * @deprecated
         */
        getMasterTablesIdRecordRecordid: (id: string, recordId: string, params: RequestParams = {}) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/master/tables/${id}/record/${recordId}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags MasterTableController
         * @name GetMasterTablesIdRecordTemplate
         * @summary Download excel template file of master table for use import data
         * @request GET:/api/docpal/master/tables/{id}/record/template
         * @deprecated
         */
        getMasterTablesIdRecordTemplate: (
            id: string,
            query?: {
                operation?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<string[], Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/master/tables/${id}/record/template`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags MasterTableController
         * @name GetMasterTablesIdAcls
         * @summary Obtain all permission of current master table
         * @request GET:/api/docpal/master/tables/{id}/acls
         * @deprecated
         */
        getMasterTablesIdAcls: (id: string, params: RequestParams = {}) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/master/tables/${id}/acls`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags MasterTableController
         * @name GetMasterTablesPageConditions
         * @request GET:/api/docpal/master/tables/page/conditions
         * @deprecated
         */
        getMasterTablesPageConditions: (params: RequestParams = {}) =>
            this.request<ResultListConditionResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/master/tables/page/conditions`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags MasterTableController
         * @name GetMasterTablesNameName
         * @summary Obtain structure of master table through table label
         * @request GET:/api/docpal/master/tables/name/{name}
         * @deprecated
         */
        getMasterTablesNameName: (name: string, params: RequestParams = {}) =>
            this.request<ResultMasterTableResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/master/tables/name/${name}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags MasterTableController
         * @name GetMasterTablesDownloadFailure
         * @summary Download data that failed to upload .csv file
         * @request GET:/api/docpal/master/tables/download/failure
         * @deprecated
         */
        getMasterTablesDownloadFailure: (
            query: {
                id: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<string[], Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/master/tables/download/failure`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags MasterTableController
         * @name GetMasterTablesDatatypeMapping
         * @summary Obtain dataType mapping of master table
         * @request GET:/api/docpal/master/tables/dataType/mapping
         * @deprecated
         */
        getMasterTablesDatatypeMapping: (params: RequestParams = {}) =>
            this.request<ResultListMTFieldTypeMapping, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/master/tables/dataType/mapping`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Management
         * @name GetManagementServices
         * @summary Retrieve available services
         * @request GET:/api/docpal/management/services
         */
        getManagementServices: (params: RequestParams = {}) =>
            this.request<ResultListString, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/management/services`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Management
         * @name GetManagementServicesDeprecate
         * @summary Retrieve available services
         * @request GET:/api/docpal/management/services/
         */
        getManagementServicesDeprecate: (params: RequestParams = {}) =>
            this.request<ResultListString, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/management/services/`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Management
         * @name GetManagementLoggersLevels
         * @summary Retrieve the available logger levels of the services
         * @request GET:/api/docpal/management/loggers/levels
         */
        getManagementLoggersLevels: (service: string, params: RequestParams = {}) =>
            this.request<ResultMapStringObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/management/loggers/levels`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Management
         * @name GetManagementLoggersServiceLevels
         * @summary Retrieve the available logger levels of the services
         * @request GET:/api/docpal/management/loggers/{service}/levels
         */
        getManagementLoggersServiceLevels: (service: string, params: RequestParams = {}) =>
            this.request<ResultMapStringObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/management/loggers/${service}/levels`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Management
         * @name GetManagementLoggersLevelsDeprecate
         * @summary Retrieve the available logger levels of the services
         * @request GET:/api/docpal/management/loggers/levels/
         */
        getManagementLoggersLevelsDeprecate: (service: string, params: RequestParams = {}) =>
            this.request<ResultMapStringObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/management/loggers/levels/`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Management
         * @name GetManagementLoggersServiceLevelsDeprecate
         * @summary Retrieve the available logger levels of the services
         * @request GET:/api/docpal/management/loggers/{service}/levels/
         */
        getManagementLoggersServiceLevelsDeprecate: (service: string, params: RequestParams = {}) =>
            this.request<ResultMapStringObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/management/loggers/${service}/levels/`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Management
         * @name GetManagementInfoServiceDeprecate
         * @summary Retrieve the services' Java and build information
         * @request GET:/api/docpal/management/info/{service}/
         */
        getManagementInfoServiceDeprecate: (service: string, params: RequestParams = {}) =>
            this.request<ResultMapStringMapStringObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/management/info/${service}/`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Management
         * @name GetManagementInfoService
         * @summary Retrieve the services' Java and build information
         * @request GET:/api/docpal/management/info/{service}
         */
        getManagementInfoService: (service: string, params: RequestParams = {}) =>
            this.request<ResultMapStringMapStringObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/management/info/${service}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Management
         * @name GetManagementInfo
         * @summary Retrieve the services' Java and build information
         * @request GET:/api/docpal/management/info
         */
        getManagementInfo: (service: string, params: RequestParams = {}) =>
            this.request<ResultMapStringMapStringObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/management/info`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Management
         * @name GetManagementHealthServiceDeprecate
         * @summary Retrieve the health, whether it is up or down, of the services
         * @request GET:/api/docpal/management/health/{service}/
         */
        getManagementHealthServiceDeprecate: (service: string, params: RequestParams = {}) =>
            this.request<ResultMapStringMapStringObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/management/health/${service}/`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Management
         * @name GetManagementHealthService
         * @summary Retrieve the health, whether it is up or down, of the services
         * @request GET:/api/docpal/management/health/{service}
         */
        getManagementHealthService: (service: string, params: RequestParams = {}) =>
            this.request<ResultMapStringMapStringObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/management/health/${service}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Management
         * @name GetManagementHealth
         * @summary Retrieve the health, whether it is up or down, of the services
         * @request GET:/api/docpal/management/health
         */
        getManagementHealth: (service: string, params: RequestParams = {}) =>
            this.request<ResultMapStringMapStringObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/management/health`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags IdTemplateController
         * @name GetIdTemplatesNameName
         * @summary Find ID template by name
         * @request GET:/api/docpal/id-templates/name/{name}
         * @deprecated
         */
        getIdTemplatesNameName: (name: string, params: RequestParams = {}) =>
            this.request<ResultIdTemplate, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/id-templates/name/${name}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags IdTemplateController
         * @name GetIdTemplatesList
         * @summary Find all id templates
         * @request GET:/api/docpal/id-templates/list
         * @deprecated
         */
        getIdTemplatesList: (params: RequestParams = {}) =>
            this.request<ResultListIdTemplate, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/id-templates/list`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags User Management APIs
         * @name GetGroups
         * @request GET:/api/docpal/groups
         */
        getGroups: (params: RequestParams = {}) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/groups`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags FormDesignController
         * @name GetFormDesignIdDetail
         * @summary Retrieve form design detail of published
         * @request GET:/api/docpal/form/design/{id}/detail
         * @deprecated
         */
        getFormDesignIdDetail: (id: string, params: RequestParams = {}) =>
            this.request<ResultFormDesignResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/form/design/${id}/detail`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags FormDesignController
         * @name GetFormDesignProcessDefinitions
         * @request GET:/api/docpal/form/design/process/definitions
         * @deprecated
         */
        getFormDesignProcessDefinitions: (params: RequestParams = {}) =>
            this.request<ResultListPDResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/form/design/process/definitions`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags FormDesignController
         * @name GetFormDesignEmailId
         * @request GET:/api/docpal/form/design/email/{id}
         * @deprecated
         */
        getFormDesignEmailId: (id: string, params: RequestParams = {}) =>
            this.request<ResultEasyFormBaseEmailDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/form/design/email/${id}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags FormDesignController
         * @name GetFormDesignEmailHistoryLogId
         * @request GET:/api/docpal/form/design/email/history/log/{id}
         * @deprecated
         */
        getFormDesignEmailHistoryLogId: (id: number, params: RequestParams = {}) =>
            this.request<ResultEasyFormBaseEmailDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/form/design/email/history/log/${id}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags FormDesignController
         * @name GetFormDesignDraftId
         * @summary Retrieve form design draft
         * @request GET:/api/docpal/form/design/draft/{id}
         * @deprecated
         */
        getFormDesignDraftId: (id: string, params: RequestParams = {}) =>
            this.request<ResultFormDesignResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/form/design/draft/${id}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags FormDesignController
         * @name GetFormDesignDatatypeMapping
         * @summary Obtain dataType mapping of form design
         * @request GET:/api/docpal/form/design/dataType/mapping
         * @deprecated
         */
        getFormDesignDatatypeMapping: (params: RequestParams = {}) =>
            this.request<ResultListMTFieldTypeMapping, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/form/design/dataType/mapping`,
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
            this.request<ResultListDocPalEmailTemplate, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/email/template/list`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags DAMSettingController
         * @name GetDamGetsupportedformat
         * @request GET:/api/docpal/dam/getSupportedFormat
         * @deprecated
         */
        getDamGetsupportedformat: (params: RequestParams = {}) =>
            this.request<
                ResultHashMapStringListConversionSupportDestType,
                Result | (ResultObject | Result | ResultString)
            >({
                path: `/docpal/dam/getSupportedFormat`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags ContactController
         * @name GetContactgroupIdUserUseridPermission
         * @summary Get permission of contact group
         * @request GET:/api/docpal/contactGroup/{id}/user/{userId}/permission
         * @deprecated
         */
        getContactgroupIdUserUseridPermission: (id: string, userId: string, params: RequestParams = {}) =>
            this.request<ResultListString, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/contactGroup/${id}/user/${userId}/permission`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Profile APIs
         * @name GetCompanyprofilesCompanyidChopsCompanychopidFile
         * @summary Download company chop file
         * @request GET:/api/docpal/companyProfiles/{companyId}/chops/{companyChopId}/file
         * @deprecated
         */
        getCompanyprofilesCompanyidChopsCompanychopidFile: (
            companyId: string,
            companyChopId: string,
            params: RequestParams = {},
        ) =>
            this.request<string[], Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/companyProfiles/${companyId}/chops/${companyChopId}/file`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTypeController
         * @name GetCaseTypesIdVersions
         * @summary Create a new version case type
         * @request GET:/api/docpal/case/types/{id}/versions
         * @deprecated
         */
        getCaseTypesIdVersions: (id: string, params: RequestParams = {}) =>
            this.request<ResultListCmmnVersion, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/types/${id}/versions`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTypeController
         * @name GetCaseTypesIdStylejson
         * @summary Query style json of cmmn xml
         * @request GET:/api/docpal/case/types/{id}/styleJson
         * @deprecated
         */
        getCaseTypesIdStylejson: (
            id: string,
            query?: {
                versionNumber?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultString, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/types/${id}/styleJson`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTypeController
         * @name GetCaseTypesIdStarttask
         * @summary Retrieve startup task for the case definition of the latest version
         * @request GET:/api/docpal/case/types/{id}/startTask
         * @deprecated
         */
        getCaseTypesIdStarttask: (
            id: string,
            query?: {
                startMatchSign?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListPlanItemDefinitionDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/types/${id}/startTask`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTypeController
         * @name GetCaseTypesIdExport
         * @summary 导出Case数据，包含CaseType、CaseModelDraft、CmmnVersion和cmmn.xml文件
         * @request GET:/api/docpal/case/types/{id}/export
         * @deprecated
         */
        getCaseTypesIdExport: (
            id: string,
            query?: {
                versionNumber?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<string[], Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/types/${id}/export`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTypeController
         * @name GetCaseTypesIdDownloadXml
         * @summary Download cmmn.xml of version (case model definition)
         * @request GET:/api/docpal/case/types/{id}/download/xml
         * @deprecated
         */
        getCaseTypesIdDownloadXml: (
            id: string,
            query?: {
                versionNumber?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<string[], Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/types/${id}/download/xml`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTypeController
         * @name GetCaseTypesIdDownloadDeployVersion
         * @summary Download latest version cmmn xml (case model definition)
         * @request GET:/api/docpal/case/types/{id}/download/deploy/version
         * @deprecated
         */
        getCaseTypesIdDownloadDeployVersion: (id: string, params: RequestParams = {}) =>
            this.request<string[], Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/types/${id}/download/deploy/version`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTypeController
         * @name GetCaseTypesIdCaseinfo
         * @summary Get form fields of deployed version based on this case type
         * @request GET:/api/docpal/case/types/{id}/caseInfo
         * @deprecated
         */
        getCaseTypesIdCaseinfo: (id: string, params: RequestParams = {}) =>
            this.request<ResultListPlanTableFieldDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/types/${id}/caseInfo`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTypeController
         * @name GetCaseTypesCasetypeid
         * @summary Retrieve case type detail
         * @request GET:/api/docpal/case/types/{caseTypeId}
         * @deprecated
         */
        getCaseTypesCasetypeid: (
            caseTypeId: string,
            query?: {
                versionNumber?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultCaseTypeResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/types/${caseTypeId}`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTypeController
         * @name GetCaseTypesCasetypeidPermissions
         * @request GET:/api/docpal/case/types/{caseTypeId}/permissions
         * @deprecated
         */
        getCaseTypesCasetypeidPermissions: (caseTypeId: string, params: RequestParams = {}) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/types/${caseTypeId}/permissions`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTypeController
         * @name GetCaseTypesCasetypeidPermissionsUserid
         * @request GET:/api/docpal/case/types/{caseTypeId}/permissions/{userId}
         * @deprecated
         */
        getCaseTypesCasetypeidPermissionsUserid: (caseTypeId: string, userId: string, params: RequestParams = {}) =>
            this.request<ResultMapStringString, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/types/${caseTypeId}/permissions/${userId}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseInstanceController
         * @name GetCaseTypesCasetypeidInstances
         * @summary Retrieve all case instances of this case type
         * @request GET:/api/docpal/case/types/{caseTypeId}/instances
         * @deprecated
         */
        getCaseTypesCasetypeidInstances: (caseTypeId: string, params: RequestParams = {}) =>
            this.request<ResultListCmmnInstance, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/types/${caseTypeId}/instances`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTypeController
         * @name GetCaseTypesCasedefinitionkeyDeployment
         * @request GET:/api/docpal/case/types/{caseDefinitionKey}/deployment
         * @deprecated
         */
        getCaseTypesCasedefinitionkeyDeployment: (caseDefinitionKey: string, params: RequestParams = {}) =>
            this.request<ResultCmmnDeploymentDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/types/${caseDefinitionKey}/deployment`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTypeController
         * @name GetCaseTypesVersionVersionid
         * @summary Retrieve detail of case model version
         * @request GET:/api/docpal/case/types/version/{versionId}
         * @deprecated
         */
        getCaseTypesVersionVersionid: (versionId: string, params: RequestParams = {}) =>
            this.request<ResultCmmnVersion, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/types/version/${versionId}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTypeController
         * @name GetCaseTypesVersionVersionidStarttask
         * @summary Retrieve startup task for the case definition of the specified version
         * @request GET:/api/docpal/case/types/version/{versionId}/startTask
         * @deprecated
         */
        getCaseTypesVersionVersionidStarttask: (versionId: string, params: RequestParams = {}) =>
            this.request<ResultListPlanItemDefinitionDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/types/version/${versionId}/startTask`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTypeController
         * @name GetCaseTypesPermissionsRules
         * @summary Retrieve case type permission rules
         * @request GET:/api/docpal/case/types/permissions/rules
         * @deprecated
         */
        getCaseTypesPermissionsRules: (params: RequestParams = {}) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/types/permissions/rules`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTypeController
         * @name GetCaseTypesDatatypeMapping
         * @summary Obtain support column mapping
         * @request GET:/api/docpal/case/types/dataType/mapping
         * @deprecated
         */
        getCaseTypesDatatypeMapping: (params: RequestParams = {}) =>
            this.request<ResultListMTFieldTypeMapping, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/types/dataType/mapping`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTableController
         * @name GetCaseTablesId
         * @summary Retrieve detail of case table and include associated data structures
         * @request GET:/api/docpal/case/tables/{id}
         * @deprecated
         */
        getCaseTablesId: (id: string, params: RequestParams = {}) =>
            this.request<ResultCaseTableResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/tables/${id}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTableController
         * @name DeleteCaseTablesId
         * @request DELETE:/api/docpal/case/tables/{id}
         * @deprecated
         */
        deleteCaseTablesId: (id: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/tables/${id}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTableController
         * @name GetCaseTablesNameExist
         * @request GET:/api/docpal/case/tables/name/exist
         * @deprecated
         */
        getCaseTablesNameExist: (
            query: {
                tablename: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/tables/name/exist`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTableController
         * @name GetCaseTablesCasetypeCasetypeid
         * @summary Retrieve a list of case tables that belong to the specified case type
         * @request GET:/api/docpal/case/tables/caseType/{caseTypeId}
         * @deprecated
         */
        getCaseTablesCasetypeCasetypeid: (caseTypeId: string, params: RequestParams = {}) =>
            this.request<ResultListCaseTable, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/tables/caseType/${caseTypeId}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTableController
         * @name GetCaseTablesCasequery
         * @request GET:/api/docpal/case/tables/caseQuery
         * @deprecated
         */
        getCaseTablesCasequery: (
            query: {
                tableName: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/tables/caseQuery`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseInstanceController
         * @name GetCaseSupportSubcase
         * @summary Filter case definition to select as sub-case
         * @request GET:/api/docpal/case/support/subCase
         * @deprecated
         */
        getCaseSupportSubcase: (params: RequestParams = {}) =>
            this.request<ResultListCaseDefinitionDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/support/subCase`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseInstanceController
         * @name GetCaseSupportSubcaseFields
         * @summary Extract input field list of sub-case definition
         * @request GET:/api/docpal/case/support/subCase/fields
         * @deprecated
         */
        getCaseSupportSubcaseFields: (
            query: {
                caseDefinitionId: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListPlanTableFieldDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/support/subCase/fields`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseInstanceController
         * @name GetCaseInstanceCaseinstanceidForms
         * @request GET:/api/docpal/case/instance/{caseInstanceId}/forms
         * @deprecated
         */
        getCaseInstanceCaseinstanceidForms: (caseInstanceId: string, params: RequestParams = {}) =>
            this.request<ResultListCmmnPlanFormDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/instance/${caseInstanceId}/forms`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseInstanceController
         * @name GetCaseInstanceCaseinstanceidEvents
         * @request GET:/api/docpal/case/instance/{caseInstanceId}/events
         * @deprecated
         */
        getCaseInstanceCaseinstanceidEvents: (caseInstanceId: string, params: RequestParams = {}) =>
            this.request<ResultListUserEventInstanceDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/instance/${caseInstanceId}/events`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseInstanceController
         * @name GetCaseInstanceTasksTaskidForm
         * @summary Retrieve form information of task
         * @request GET:/api/docpal/case/instance/tasks/{taskId}/form
         * @deprecated
         */
        getCaseInstanceTasksTaskidForm: (taskId: string, params: RequestParams = {}) =>
            this.request<ResultCaseInstanceFormDataDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/instance/tasks/${taskId}/form`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseInstanceController
         * @name GetCaseInstanceProcessDefinitions
         * @summary Retrieve process definition of this case instance through case definition key
         * @request GET:/api/docpal/case/instance/process/definitions
         * @deprecated
         */
        getCaseInstanceProcessDefinitions: (
            query: {
                businessKey: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListProcessDefinitionDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/instance/process/definitions`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseInstanceController
         * @name GetCaseInstancePlanitemsPlanitemidForm
         * @summary Retrieve form information of plan item instance
         * @request GET:/api/docpal/case/instance/planItems/{planItemId}/form
         * @deprecated
         */
        getCaseInstancePlanitemsPlanitemidForm: (
            planItemId: string,
            query?: {
                caseDefinitionId?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultCmmnPlanFormDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/instance/planItems/${planItemId}/form`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseInstanceController
         * @name GetCaseDefinitions
         * @summary Retrieve all case model definitions
         * @request GET:/api/docpal/case/definitions
         * @deprecated
         */
        getCaseDefinitions: (params: RequestParams = {}) =>
            this.request<ResultListCaseDefinitionDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/definitions`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseInstanceController
         * @name GetCaseDefinitionsCasedefinitionkeyInstances
         * @summary Retrieve case instances of this case model
         * @request GET:/api/docpal/case/definitions/{caseDefinitionKey}/instances
         * @deprecated
         */
        getCaseDefinitionsCasedefinitionkeyInstances: (caseDefinitionKey: string, params: RequestParams = {}) =>
            this.request<ResultListCaseInstanceDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/definitions/${caseDefinitionKey}/instances`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseInstanceController
         * @name GetCaseDefinitionCasedefinitionkeyProcessDefinitions
         * @summary Retrieve process definition of this case instance through case definition key
         * @request GET:/api/docpal/case/definition/{caseDefinitionKey}/process/definitions
         * @deprecated
         */
        getCaseDefinitionCasedefinitionkeyProcessDefinitions: (caseDefinitionKey: string, params: RequestParams = {}) =>
            this.request<ResultListProcessDefinitionDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/definition/${caseDefinitionKey}/process/definitions`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CmmnDashboardController
         * @name GetCaseDashboardId
         * @summary Retrieve case dashboard detail
         * @request GET:/api/docpal/case/dashboard/{id}
         * @deprecated
         */
        getCaseDashboardId: (id: string, params: RequestParams = {}) =>
            this.request<ResultCmmnDashboardResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/dashboard/${id}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CmmnDashboardController
         * @name DeleteCaseDashboardId
         * @summary Delete the case dashboard it must not have been used yet
         * @request DELETE:/api/docpal/case/dashboard/{id}
         * @deprecated
         */
        deleteCaseDashboardId: (id: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/dashboard/${id}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CmmnDashboardController
         * @name GetCaseDashboardVersionVersionidStages
         * @summary Get stages of the current version that it is case definition
         * @request GET:/api/docpal/case/dashboard/version/{versionId}/stages
         * @deprecated
         */
        getCaseDashboardVersionVersionidStages: (versionId: string, params: RequestParams = {}) =>
            this.request<ResultListPlanItemInstanceDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/dashboard/version/${versionId}/stages`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CmmnDashboardController
         * @name GetCaseDashboardVersionVersionidPrimaryform
         * @summary Get primary form of the current version that it is case definition
         * @request GET:/api/docpal/case/dashboard/version/{versionId}/primaryForm
         * @deprecated
         */
        getCaseDashboardVersionVersionidPrimaryform: (versionId: string, params: RequestParams = {}) =>
            this.request<ResultCmmnPlanFormDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/dashboard/version/${versionId}/primaryForm`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CmmnDashboardController
         * @name GetCaseDashboardVersionVersionidPrimaryformData
         * @summary Retrieve information and information data of this case version
         * @request GET:/api/docpal/case/dashboard/version/{versionId}/primaryForm/data
         * @deprecated
         */
        getCaseDashboardVersionVersionidPrimaryformData: (versionId: string, params: RequestParams = {}) =>
            this.request<ResultCaseInstanceFormDataDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/dashboard/version/${versionId}/primaryForm/data`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CmmnDashboardController
         * @name GetCaseDashboardVersionVersionidActivity
         * @summary Get all activity of the current version that it is case definition
         * @request GET:/api/docpal/case/dashboard/version/{versionId}/activity
         * @deprecated
         */
        getCaseDashboardVersionVersionidActivity: (versionId: string, params: RequestParams = {}) =>
            this.request<ResultListPlanItemInstanceDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/dashboard/version/${versionId}/activity`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CmmnDashboardController
         * @name GetCaseDashboardVersionVersionidActions
         * @request GET:/api/docpal/case/dashboard/version/{versionId}/actions
         * @deprecated
         */
        getCaseDashboardVersionVersionidActions: (versionId: string, params: RequestParams = {}) =>
            this.request<ResultListPlanItemInstanceDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/dashboard/version/${versionId}/actions`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CmmnDashboardController
         * @name GetCaseDashboardInstanceCaseinstanceidMilestoneStatus
         * @summary Obtain Milestone Status of a case instance
         * @request GET:/api/docpal/case/dashboard/instance/{caseInstanceId}/milestone/status
         * @deprecated
         */
        getCaseDashboardInstanceCaseinstanceidMilestoneStatus: (caseInstanceId: string, params: RequestParams = {}) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/dashboard/instance/${caseInstanceId}/milestone/status`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CmmnDashboardController
         * @name GetCaseDashboardInstanceCaseidTasks
         * @summary Retrieve all tasks of this case instance
         * @request GET:/api/docpal/case/dashboard/instance/{caseId}/tasks
         * @deprecated
         */
        getCaseDashboardInstanceCaseidTasks: (caseId: string, params: RequestParams = {}) =>
            this.request<ResultListCmmnTaskDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/dashboard/instance/${caseId}/tasks`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CmmnDashboardController
         * @name GetCaseDashboardInstanceCaseidStages
         * @summary Retrieve stages of current case instance
         * @request GET:/api/docpal/case/dashboard/instance/{caseId}/stages
         * @deprecated
         */
        getCaseDashboardInstanceCaseidStages: (caseId: string, params: RequestParams = {}) =>
            this.request<ResultListPlanItemInstanceDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/dashboard/instance/${caseId}/stages`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CmmnDashboardController
         * @name GetCaseDashboardInstanceCaseidPrimaryformData
         * @summary Retrieve primary form data (Case Dashboard) structure
         * @request GET:/api/docpal/case/dashboard/instance/{caseId}/primaryForm/data
         * @deprecated
         */
        getCaseDashboardInstanceCaseidPrimaryformData: (caseId: string, params: RequestParams = {}) =>
            this.request<ResultCaseInstanceFormDataDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/dashboard/instance/${caseId}/primaryForm/data`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CmmnDashboardController
         * @name GetCaseDashboardInstanceCaseidPlanitems
         * @summary Retrieve planItems
         * @request GET:/api/docpal/case/dashboard/instance/{caseId}/planItems
         * @deprecated
         */
        getCaseDashboardInstanceCaseidPlanitems: (
            caseId: string,
            query: {
                type: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListPlanItemInstanceDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/dashboard/instance/${caseId}/planItems`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CmmnDashboardController
         * @name GetCaseDashboardInstanceCaseidPersonalTasks
         * @summary Retrieve personal tasks of this case instance
         * @request GET:/api/docpal/case/dashboard/instance/{caseId}/personal/tasks
         * @deprecated
         */
        getCaseDashboardInstanceCaseidPersonalTasks: (caseId: string, params: RequestParams = {}) =>
            this.request<ResultListCmmnTaskDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/dashboard/instance/${caseId}/personal/tasks`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CmmnDashboardController
         * @name GetCaseDashboardInstanceCaseidEvents
         * @summary Retrieve all events of this case instance
         * @request GET:/api/docpal/case/dashboard/instance/{caseId}/events
         * @deprecated
         */
        getCaseDashboardInstanceCaseidEvents: (caseId: string, params: RequestParams = {}) =>
            this.request<ResultListPlanItemInstanceDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/dashboard/instance/${caseId}/events`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CmmnDashboardController
         * @name GetCaseDashboardInstanceCaseidActivity
         * @summary Retrieve activities of this case instance
         * @request GET:/api/docpal/case/dashboard/instance/{caseId}/activity
         * @deprecated
         */
        getCaseDashboardInstanceCaseidActivity: (caseId: string, params: RequestParams = {}) =>
            this.request<ResultListCmmnActivityItem, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/dashboard/instance/${caseId}/activity`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CmmnDashboardController
         * @name GetCaseDashboardInstanceCaseidActions
         * @summary Retrieve activities of this case instance
         * @request GET:/api/docpal/case/dashboard/instance/{caseId}/actions
         * @deprecated
         */
        getCaseDashboardInstanceCaseidActions: (
            caseId: string,
            query: {
                userId: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListPlanItemInstanceDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/dashboard/instance/${caseId}/actions`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CmmnDashboardController
         * @name GetCaseDashboardInstanceStagePlanitems
         * @summary Retrieve all planItem instance of this case instance
         * @request GET:/api/docpal/case/dashboard/instance/stage/planItems
         * @deprecated
         */
        getCaseDashboardInstanceStagePlanitems: (
            query: {
                /** Case Instance Id */
                caseInstanceId: any;
                /** Stage Plan Item Definition Id */
                stageDefinitionId: any;
                /** PlanItemInstanceDTO */
                planItemInstanceDTO: PlanItemInstanceDTO;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListPlanItemInstanceDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/dashboard/instance/stage/planItems`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CmmnDashboardController
         * @name GetCaseDashboardCasetypeCasetypeid
         * @summary Retrieve all Case View Dashboard
         * @request GET:/api/docpal/case/dashboard/caseType/{caseTypeId}
         * @deprecated
         */
        getCaseDashboardCasetypeCasetypeid: (caseTypeId: string, params: RequestParams = {}) =>
            this.request<ResultListCmmnDashboard, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/dashboard/caseType/${caseTypeId}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CmmnDashboardController
         * @name GetCaseDashboardCasetypeCasetypeidVersionnumberVersionnumber
         * @summary Retrieve case dashboard detail
         * @request GET:/api/docpal/case/dashboard/caseType/{caseTypeId}/versionNumber/{versionNumber}
         * @deprecated
         */
        getCaseDashboardCasetypeCasetypeidVersionnumberVersionnumber: (
            caseTypeId: string,
            versionNumber: string,
            params: RequestParams = {},
        ) =>
            this.request<ResultListCmmnDashboard, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/dashboard/caseType/${caseTypeId}/versionNumber/${versionNumber}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CmmnDashboardController
         * @name GetCaseDashboardCasetypeCasetypeidStages
         * @summary Retrieve stages of current case instance
         * @request GET:/api/docpal/case/dashboard/caseType/{caseTypeId}/stages
         * @deprecated
         */
        getCaseDashboardCasetypeCasetypeidStages: (caseTypeId: string, params: RequestParams = {}) =>
            this.request<ResultListPlanItemInstanceDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/dashboard/caseType/${caseTypeId}/stages`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CmmnDashboardController
         * @name GetCaseDashboardCasetypeCasetypeidPrimaryform
         * @summary Retrieve primary form (Case Dashboard)
         * @request GET:/api/docpal/case/dashboard/caseType/{caseTypeId}/primaryForm
         * @deprecated
         */
        getCaseDashboardCasetypeCasetypeidPrimaryform: (caseTypeId: string, params: RequestParams = {}) =>
            this.request<ResultCmmnPlanFormDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/dashboard/caseType/${caseTypeId}/primaryForm`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CmmnDashboardController
         * @name GetCaseDashboardCasetypeCasetypeidActivity
         * @request GET:/api/docpal/case/dashboard/caseType/{caseTypeId}/activity
         * @deprecated
         */
        getCaseDashboardCasetypeCasetypeidActivity: (caseTypeId: string, params: RequestParams = {}) =>
            this.request<ResultListPlanItemInstanceDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/dashboard/caseType/${caseTypeId}/activity`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CmmnDashboardController
         * @name GetCaseDashboardCasetypeCasetypeidActions
         * @request GET:/api/docpal/case/dashboard/caseType/{caseTypeId}/actions
         * @deprecated
         */
        getCaseDashboardCasetypeCasetypeidActions: (caseTypeId: string, params: RequestParams = {}) =>
            this.request<ResultListPlanItemInstanceDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/dashboard/caseType/${caseTypeId}/actions`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CalendarController
         * @name GetCalendarsId
         * @request GET:/api/docpal/calendars/{id}
         * @deprecated
         */
        getCalendarsId: (id: string, params: RequestParams = {}) =>
            this.request<ResultCalendarTaskRespDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/calendars/${id}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CalendarController
         * @name DeleteCalendarsId
         * @summary Delete the Task  it must not have been used yet
         * @request DELETE:/api/docpal/calendars/{id}
         * @deprecated
         */
        deleteCalendarsId: (id: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/calendars/${id}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CalendarController
         * @name GetCalendarsSettingTables
         * @summary Obtain calendar tables
         * @request GET:/api/docpal/calendars/setting/tables
         * @deprecated
         */
        getCalendarsSettingTables: (params: RequestParams = {}) =>
            this.request<ResultMapStringString, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/calendars/setting/tables`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CalendarController
         * @name GetCalendarsActive
         * @request GET:/api/docpal/calendars/active
         * @deprecated
         */
        getCalendarsActive: (params: RequestParams = {}) =>
            this.request<ResultListCalendarTaskRespDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/calendars/active`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags FolderCabinetController
         * @name GetCabinetIdUseWorkflow
         * @summary Query workflow list of use this folder cabinet
         * @request GET:/api/docpal/cabinet/{id}/use/workflow
         * @deprecated
         */
        getCabinetIdUseWorkflow: (id: string, params: RequestParams = {}) =>
            this.request<ResultListConditionResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/cabinet/${id}/use/workflow`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags FolderCabinetController
         * @name GetCabinetTemplateId
         * @summary get folder cabinet template tree
         * @request GET:/api/docpal/cabinet/template/{id}
         * @deprecated
         */
        getCabinetTemplateId: (id: string, params: RequestParams = {}) =>
            this.request<ResultFolderCabinetResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/cabinet/template/${id}`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags FolderCabinetController
         * @name GetCabinetTemplateIdInformation
         * @request GET:/api/docpal/cabinet/template/{id}/information
         * @deprecated
         */
        getCabinetTemplateIdInformation: (id: string, params: RequestParams = {}) =>
            this.request<ResultFolderCabinet, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/cabinet/template/${id}/information`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags FolderCabinetController
         * @name GetCabinetList
         * @summary query all folder cabinet list of top level
         * @request GET:/api/docpal/cabinet/list
         * @deprecated
         */
        getCabinetList: (params: RequestParams = {}) =>
            this.request<ResultListFolderCabinetResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/cabinet/list`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags azure-ocr-controller
         * @name GetAzureOcrQueryazuresetting
         * @request GET:/api/docpal/azure/ocr/queryAzureSetting
         */
        getAzureOcrQueryazuresetting: (params: RequestParams = {}) =>
            this.request<ResultAzureSettingDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/azure/ocr/queryAzureSetting`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags azure-ocr-controller
         * @name GetAzureOcrQueryazureocrmodels
         * @request GET:/api/docpal/azure/ocr/queryAzureOcrModels
         */
        getAzureOcrQueryazureocrmodels: (params: RequestParams = {}) =>
            this.request<ResultListString, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/azure/ocr/queryAzureOcrModels`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags alert-controller
         * @name GetAzureOcrJudgeandsendalertemail
         * @request GET:/api/docpal/azure/ocr/judgeAndSendAlertEmail
         */
        getAzureOcrJudgeandsendalertemail: (
            query: {
                scanType: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<Result, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/azure/ocr/judgeAndSendAlertEmail`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags azure-ocr-controller
         * @name GetAzureOcrConditions
         * @request GET:/api/docpal/azure/ocr/conditions
         */
        getAzureOcrConditions: (params: RequestParams = {}) =>
            this.request<ResultListConditionResponseDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/azure/ocr/conditions`,
                method: "GET",
                ...params,
            }),

        /**
         * @description Get detailed information about a specific user, including roles, groups, and configuration rules
         *
         * @tags User Management
         * @name GetAclUserUserid
         * @summary Get User Details
         * @request GET:/api/docpal/acl/user/{userId}
         */
        getAclUserUserid: (userId: string, params: RequestParams = {}) =>
            this.request<ResultUserDetailDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/acl/user/${userId}`,
                method: "GET",
                ...params,
            }),

        /**
         * @description Get dropdown list of users in roles
         *
         * @tags Role-User Management
         * @name GetAclRoleUsersDropdown
         * @summary Get Role Users Dropdown List
         * @request GET:/api/docpal/acl/role/users/dropdown
         */
        getAclRoleUsersDropdown: (params: RequestParams = {}) =>
            this.request<ResultListAclUserInformation, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/acl/role/users/dropdown`,
                method: "GET",
                ...params,
            }),

        /**
         * @description Get hierarchy structure of all roles in the system
         *
         * @tags Role Permission Management
         * @name GetAclRoleRoot
         * @summary Get All Role Structure for Admin
         * @request GET:/api/docpal/acl/role/root
         */
        getAclRoleRoot: (params: RequestParams = {}) =>
            this.request<ResultRoleDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/acl/role/root`,
                method: "GET",
                ...params,
            }),

        /**
         * @description Get role hierarchy structure by role ID
         *
         * @tags Role Permission Management
         * @name GetAclRoleHierarchyRoleid
         * @summary Get Role Hierarchy
         * @request GET:/api/docpal/acl/role/hierarchy/{roleId}
         */
        getAclRoleHierarchyRoleid: (roleId: string, params: RequestParams = {}) =>
            this.request<ResultRoleDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/acl/role/hierarchy/${roleId}`,
                method: "GET",
                ...params,
            }),

        /**
         * @description Get permission list by resource ID
         *
         * @tags Resource Permission Management
         * @name GetAclResourcePermissionsResourceResourceid
         * @summary Get Resource Permission List
         * @request GET:/api/docpal/acl/resource-permissions/resource/{resourceId}
         */
        getAclResourcePermissionsResourceResourceid: (resourceId: string, params: RequestParams = {}) =>
            this.request<ResultListResourcePermissionVO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/acl/resource-permissions/resource/${resourceId}`,
                method: "GET",
                ...params,
            }),

        /**
         * @description Retrieve all documents under the specified document ID. If no ID is provided, returns root directory documents
         *
         * @tags Document Management
         * @name GetAclDocumentDocumentid
         * @summary Get Document Details
         * @request GET:/api/docpal/acl/document/{documentId}
         */
        getAclDocumentDocumentid: (documentId: string, params: RequestParams = {}) =>
            this.request<DocumentDTO, void | Result>({
                path: `/docpal/acl/document/${documentId}`,
                method: "GET",
                ...params,
            }),

        /**
         * @description Retrieve all documents under the specified document ID. If no ID is provided, returns root directory documents
         *
         * @tags Document Management
         * @name GetAclDocument
         * @summary Get Document Details
         * @request GET:/api/docpal/acl/document
         */
        getAclDocument: (documentId: string, params: RequestParams = {}) =>
            this.request<DocumentDTO, void | Result>({
                path: `/docpal/acl/document`,
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
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/user/permission/business/${businessId}/user/${userId}/aces/${aces}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags system-admin-controller
         * @name DeleteSystemAdminClean
         * @request DELETE:/api/system_admin/clean
         * @deprecated
         */
        deleteSystemAdminClean: (params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/system_admin/clean`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Document
         * @name DeleteRegisteredServerContactgroupIdFieldsFieldname
         * @request DELETE:/api/registered-server/contactGroup/{id}/fields/{fieldName}
         */
        deleteRegisteredServerContactgroupIdFieldsFieldname: (
            id: string,
            fieldName: string,
            query: {
                operator: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListContactAttribute, Result | (ResultObject | Result | ResultString)>({
                path: `/registered-server/contactGroup/${id}/fields/${fieldName}`,
                method: "DELETE",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Document
         * @name DeleteRegisteredServerContactgroupIdContactContactdetailid
         * @summary Physically delete contact records
         * @request DELETE:/api/registered-server/contactGroup/{id}/contact/{contactDetailId}
         */
        deleteRegisteredServerContactgroupIdContactContactdetailid: (
            id: string,
            contactDetailId: string,
            query: {
                operator: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/registered-server/contactGroup/${id}/contact/${contactDetailId}`,
                method: "DELETE",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name DeleteDocpaltypeSettingsNameMetadata
         * @summary Remove metadata from DocPal Type
         * @request DELETE:/api/docpalType/settings/{name}/metadata
         */
        deleteDocpaltypeSettingsNameMetadata: (name: string, data: DocPalTypeMetadata, params: RequestParams = {}) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpalType/settings/${name}/metadata`,
                method: "DELETE",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name DeleteDocpaltypeSettingsNameMetadataMetadataname
         * @summary Remove metadata from DocPal Type
         * @request DELETE:/api/docpalType/settings/{name}/metadata/{metadataName}
         */
        deleteDocpaltypeSettingsNameMetadataMetadataname: (
            name: string,
            metadataName: string,
            params: RequestParams = {},
        ) =>
            this.request<ResultObject, Result | (ResultObject | Result | ResultString)>({
                path: `/docpalType/settings/${name}/metadata/${metadataName}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name DeleteDocpaltypeSettingsRelatedId
         * @summary Delete related docpal type
         * @request DELETE:/api/docpalType/settings/related/{id}
         */
        deleteDocpaltypeSettingsRelatedId: (id: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpalType/settings/related/${id}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name DeleteDocpaltypeSettingsMetadataV2DeleteMetadataid
         * @request DELETE:/api/docpalType/settings/metadata-v2/delete/{metadataId}
         */
        deleteDocpaltypeSettingsMetadataV2DeleteMetadataid: (metadataId: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpalType/settings/metadata-v2/delete/${metadataId}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags DocPalTypeSettingController
         * @name DeleteDocpaltypeSettingsDocpalTypeV2DeleteMetadataDocpaltypeid
         * @request DELETE:/api/docpalType/settings/docpal-type-v2/delete-metadata/{docpalTypeId}
         */
        deleteDocpaltypeSettingsDocpalTypeV2DeleteMetadataDocpaltypeid: (
            docpalTypeId: string,
            data: AddMetadataRequestDTO,
            params: RequestParams = {},
        ) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpalType/settings/docpal-type-v2/delete-metadata/${docpalTypeId}`,
                method: "DELETE",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Version Controller
         * @name DeleteWorkflowVersionDraftidDraftid
         * @request DELETE:/api/docpal/workflow/version/draftId/{draftId}
         * @deprecated
         */
        deleteWorkflowVersionDraftidDraftid: (draftId: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/version/draftId/${draftId}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name DeleteWorkflowProcess
         * @request DELETE:/api/docpal/workflow/process
         * @deprecated
         */
        deleteWorkflowProcess: (
            query?: {
                processInstanceId?: string;
                /** @format date-time */
                createdDate?: string;
                /** @format date-time */
                endedDate?: string;
                completed?: boolean;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListInstanceDTO, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/process`,
                method: "DELETE",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name DeleteWorkflowProcessUser
         * @summary Delete process instance by user id
         * @request DELETE:/api/docpal/workflow/process/user
         * @deprecated
         */
        deleteWorkflowProcessUser: (
            query: {
                /** Delete Workflow (Request) */
                deleteWorkflowReq: DeleteWorkflowReq;
            },
            data: any,
            params: RequestParams = {},
        ) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/process/user`,
                method: "DELETE",
                query: query,
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Process Definition Controller
         * @name DeleteWorkflowProcessDefinitionSuspendDraftid
         * @summary Suspend a process definition
         * @request DELETE:/api/docpal/workflow/process/definition/suspend/{draftId}
         * @deprecated
         */
        deleteWorkflowProcessDefinitionSuspendDraftid: (draftId: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/process/definition/suspend/${draftId}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow Process Definition Controller
         * @name DeleteWorkflowProcessDefinitionRemoveDraftid
         * @summary Remove process definition from workflow list
         * @request DELETE:/api/docpal/workflow/process/definition/remove/{draftId}
         * @deprecated
         */
        deleteWorkflowProcessDefinitionRemoveDraftid: (draftId: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/process/definition/remove/${draftId}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Workflow
         * @name DeleteWorkflowDeletedocumenttypeprofile
         * @request DELETE:/api/docpal/workflow/deleteDocumentTypeProfile
         */
        deleteWorkflowDeletedocumenttypeprofile: (
            query: {
                /** @format int64 */
                profileID: number;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/workflow/deleteDocumentTypeProfile`,
                method: "DELETE",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags template-message-controller
         * @name DeleteMessageTemplateId
         * @request DELETE:/api/docpal/message/template/{id}
         */
        deleteMessageTemplateId: (id: number, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/message/template/${id}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags MasterTableController
         * @name DeleteMasterTablesIdRecordBatch
         * @summary Batch delete record by id array
         * @request DELETE:/api/docpal/master/tables/{id}/record/batch
         * @deprecated
         */
        deleteMasterTablesIdRecordBatch: (
            id: string,
            query: {
                recordIds: string[];
            },
            data: any,
            params: RequestParams = {},
        ) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/master/tables/${id}/record/batch`,
                method: "DELETE",
                query: query,
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags MasterTableController
         * @name DeleteMasterTablesIdFields
         * @summary Delete field when not data (Master Table)
         * @request DELETE:/api/docpal/master/tables/{id}/fields
         * @deprecated
         */
        deleteMasterTablesIdFields: (
            id: string,
            query: {
                columnName: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/master/tables/${id}/fields`,
                method: "DELETE",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags InternalShareController
         * @name DeleteInternalshare
         * @request DELETE:/api/docpal/internalShare
         */
        deleteInternalshare: (data: InternalShareQueryDTO, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/internalShare`,
                method: "DELETE",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags FormDesignController
         * @name DeleteFormDesignId
         * @request DELETE:/api/docpal/form/design/{id}
         * @deprecated
         */
        deleteFormDesignId: (id: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/form/design/${id}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags FormDesignController
         * @name DeleteFormDesignDraftidFormresultFormresultid
         * @request DELETE:/api/docpal/form/design/{draftId}/formResult/{formResultId}
         * @deprecated
         */
        deleteFormDesignDraftidFormresultFormresultid: (
            draftId: string,
            formResultId: string,
            params: RequestParams = {},
        ) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/form/design/${draftId}/formResult/${formResultId}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags ContactController
         * @name DeleteContactgroupIdFieldsFieldname
         * @summary Add new field to contact Group
         * @request DELETE:/api/docpal/contactGroup/{id}/fields/{fieldName}
         * @deprecated
         */
        deleteContactgroupIdFieldsFieldname: (id: string, fieldName: string, data: any, params: RequestParams = {}) =>
            this.request<ResultListContactAttribute, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/contactGroup/${id}/fields/${fieldName}`,
                method: "DELETE",
                body: data,
                type: ContentType.Json,
                ...params,
            }),

        /**
         * No description
         *
         * @tags ContactController
         * @name DeleteContactgroupIdContactContactdetailid
         * @summary Physically delete contact records
         * @request DELETE:/api/docpal/contactGroup/{id}/contact/{contactDetailId}
         * @deprecated
         */
        deleteContactgroupIdContactContactdetailid: (id: string, contactDetailId: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/contactGroup/${id}/contact/${contactDetailId}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseTypeController
         * @name DeleteCaseTypesId
         * @summary Delete the case type it must not have been used yet
         * @request DELETE:/api/docpal/case/types/{id}
         * @deprecated
         */
        deleteCaseTypesId: (id: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/types/${id}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseInstanceController
         * @name DeleteCaseInstance
         * @request DELETE:/api/docpal/case/instance
         * @deprecated
         */
        deleteCaseInstance: (
            query?: {
                caseId?: string;
                caseInstanceId?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/instance`,
                method: "DELETE",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags CaseInstanceController
         * @name DeleteCaseInstanceCaseid
         * @request DELETE:/api/docpal/case/instance/{caseId}
         * @deprecated
         */
        deleteCaseInstanceCaseid: (caseId: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/case/instance/${caseId}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags FolderCabinetController
         * @name DeleteCabinetId
         * @summary Delete folder cabinet template and all sub folder cabinet
         * @request DELETE:/api/docpal/cabinet/{id}
         * @deprecated
         */
        deleteCabinetId: (id: string, params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/cabinet/${id}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags FolderCabinetController
         * @name DeleteCabinetAll
         * @summary Delete folder cabinet template and all sub folder cabinet
         * @request DELETE:/api/docpal/cabinet/all
         * @deprecated
         */
        deleteCabinetAll: (params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/cabinet/all`,
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
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/block/permission/document/${docId}/path/${docPath}`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags Identity
         * @name GetNuxeoIdentityIscanmodified
         * @summary group is can modified ?
         * @request GET:/api/nuxeo/identity/isCanModified
         */
        getNuxeoIdentityIscanmodified: (
            query: {
                groupId: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/identity/isCanModified`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Identity
         * @name PutNuxeoIdentityIscanmodified
         * @summary group is can modified ?
         * @request PUT:/api/nuxeo/identity/isCanModified
         */
        putNuxeoIdentityIscanmodified: (
            query: {
                groupId: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/identity/isCanModified`,
                method: "PUT",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Identity
         * @name PostNuxeoIdentityIscanmodified
         * @summary group is can modified ?
         * @request POST:/api/nuxeo/identity/isCanModified
         */
        postNuxeoIdentityIscanmodified: (
            query: {
                groupId: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/identity/isCanModified`,
                method: "POST",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Identity
         * @name DeleteNuxeoIdentityIscanmodified
         * @summary group is can modified ?
         * @request DELETE:/api/nuxeo/identity/isCanModified
         */
        deleteNuxeoIdentityIscanmodified: (
            query: {
                groupId: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/identity/isCanModified`,
                method: "DELETE",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Identity
         * @name OptionsNuxeoIdentityIscanmodified
         * @summary group is can modified ?
         * @request OPTIONS:/api/nuxeo/identity/isCanModified
         */
        optionsNuxeoIdentityIscanmodified: (
            query: {
                groupId: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/identity/isCanModified`,
                method: "OPTIONS",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Identity
         * @name HeadNuxeoIdentityIscanmodified
         * @summary group is can modified ?
         * @request HEAD:/api/nuxeo/identity/isCanModified
         */
        headNuxeoIdentityIscanmodified: (
            query: {
                groupId: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/identity/isCanModified`,
                method: "HEAD",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags Identity
         * @name PatchNuxeoIdentityIscanmodified
         * @summary group is can modified ?
         * @request PATCH:/api/nuxeo/identity/isCanModified
         */
        patchNuxeoIdentityIscanmodified: (
            query: {
                groupId: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/nuxeo/identity/isCanModified`,
                method: "PATCH",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags form-properties-relation-controller
         * @name GetRelationQuery
         * @request GET:/api/docpal/relation/query
         * @deprecated
         */
        getRelationQuery: (
            query?: {
                /** @format int64 */
                id?: number;
                processKey?: string;
                userTaskId?: string;
                jsonValue?: string;
                versionId?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListFormPropertiesRelation, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/relation/query`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags form-properties-relation-controller
         * @name PutRelationQuery
         * @request PUT:/api/docpal/relation/query
         * @deprecated
         */
        putRelationQuery: (
            query?: {
                /** @format int64 */
                id?: number;
                processKey?: string;
                userTaskId?: string;
                jsonValue?: string;
                versionId?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListFormPropertiesRelation, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/relation/query`,
                method: "PUT",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags form-properties-relation-controller
         * @name PostRelationQuery
         * @request POST:/api/docpal/relation/query
         * @deprecated
         */
        postRelationQuery: (
            query?: {
                /** @format int64 */
                id?: number;
                processKey?: string;
                userTaskId?: string;
                jsonValue?: string;
                versionId?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListFormPropertiesRelation, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/relation/query`,
                method: "POST",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags form-properties-relation-controller
         * @name DeleteRelationQuery
         * @request DELETE:/api/docpal/relation/query
         * @deprecated
         */
        deleteRelationQuery: (
            query?: {
                /** @format int64 */
                id?: number;
                processKey?: string;
                userTaskId?: string;
                jsonValue?: string;
                versionId?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListFormPropertiesRelation, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/relation/query`,
                method: "DELETE",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags form-properties-relation-controller
         * @name OptionsRelationQuery
         * @request OPTIONS:/api/docpal/relation/query
         * @deprecated
         */
        optionsRelationQuery: (
            query?: {
                /** @format int64 */
                id?: number;
                processKey?: string;
                userTaskId?: string;
                jsonValue?: string;
                versionId?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListFormPropertiesRelation, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/relation/query`,
                method: "OPTIONS",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags form-properties-relation-controller
         * @name HeadRelationQuery
         * @request HEAD:/api/docpal/relation/query
         * @deprecated
         */
        headRelationQuery: (
            query?: {
                /** @format int64 */
                id?: number;
                processKey?: string;
                userTaskId?: string;
                jsonValue?: string;
                versionId?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListFormPropertiesRelation, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/relation/query`,
                method: "HEAD",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags form-properties-relation-controller
         * @name PatchRelationQuery
         * @request PATCH:/api/docpal/relation/query
         * @deprecated
         */
        patchRelationQuery: (
            query?: {
                /** @format int64 */
                id?: number;
                processKey?: string;
                userTaskId?: string;
                jsonValue?: string;
                versionId?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListFormPropertiesRelation, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/relation/query`,
                method: "PATCH",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags form-properties-relation-controller
         * @name GetRelationQuerylanguage
         * @request GET:/api/docpal/relation/queryLanguage
         * @deprecated
         */
        getRelationQuerylanguage: (
            query?: {
                /** @format int64 */
                id?: number;
                locale?: string;
                languageKey?: string;
                languageContent?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListLanguageEntity, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/relation/queryLanguage`,
                method: "GET",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags form-properties-relation-controller
         * @name PutRelationQuerylanguage
         * @request PUT:/api/docpal/relation/queryLanguage
         * @deprecated
         */
        putRelationQuerylanguage: (
            query?: {
                /** @format int64 */
                id?: number;
                locale?: string;
                languageKey?: string;
                languageContent?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListLanguageEntity, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/relation/queryLanguage`,
                method: "PUT",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags form-properties-relation-controller
         * @name PostRelationQuerylanguage
         * @request POST:/api/docpal/relation/queryLanguage
         * @deprecated
         */
        postRelationQuerylanguage: (
            query?: {
                /** @format int64 */
                id?: number;
                locale?: string;
                languageKey?: string;
                languageContent?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListLanguageEntity, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/relation/queryLanguage`,
                method: "POST",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags form-properties-relation-controller
         * @name DeleteRelationQuerylanguage
         * @request DELETE:/api/docpal/relation/queryLanguage
         * @deprecated
         */
        deleteRelationQuerylanguage: (
            query?: {
                /** @format int64 */
                id?: number;
                locale?: string;
                languageKey?: string;
                languageContent?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListLanguageEntity, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/relation/queryLanguage`,
                method: "DELETE",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags form-properties-relation-controller
         * @name OptionsRelationQuerylanguage
         * @request OPTIONS:/api/docpal/relation/queryLanguage
         * @deprecated
         */
        optionsRelationQuerylanguage: (
            query?: {
                /** @format int64 */
                id?: number;
                locale?: string;
                languageKey?: string;
                languageContent?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListLanguageEntity, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/relation/queryLanguage`,
                method: "OPTIONS",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags form-properties-relation-controller
         * @name HeadRelationQuerylanguage
         * @request HEAD:/api/docpal/relation/queryLanguage
         * @deprecated
         */
        headRelationQuerylanguage: (
            query?: {
                /** @format int64 */
                id?: number;
                locale?: string;
                languageKey?: string;
                languageContent?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListLanguageEntity, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/relation/queryLanguage`,
                method: "HEAD",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags form-properties-relation-controller
         * @name PatchRelationQuerylanguage
         * @request PATCH:/api/docpal/relation/queryLanguage
         * @deprecated
         */
        patchRelationQuerylanguage: (
            query?: {
                /** @format int64 */
                id?: number;
                locale?: string;
                languageKey?: string;
                languageContent?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ResultListLanguageEntity, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/relation/queryLanguage`,
                method: "PATCH",
                query: query,
                ...params,
            }),

        /**
         * No description
         *
         * @tags form-properties-relation-controller
         * @name GetRelationIsldapmode
         * @summary is Ldap Mode
         * @request GET:/api/docpal/relation/isLdapMode
         * @deprecated
         */
        getRelationIsldapmode: (params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/relation/isLdapMode`,
                method: "GET",
                ...params,
            }),

        /**
         * No description
         *
         * @tags form-properties-relation-controller
         * @name PutRelationIsldapmode
         * @summary is Ldap Mode
         * @request PUT:/api/docpal/relation/isLdapMode
         * @deprecated
         */
        putRelationIsldapmode: (params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/relation/isLdapMode`,
                method: "PUT",
                ...params,
            }),

        /**
         * No description
         *
         * @tags form-properties-relation-controller
         * @name PostRelationIsldapmode
         * @summary is Ldap Mode
         * @request POST:/api/docpal/relation/isLdapMode
         * @deprecated
         */
        postRelationIsldapmode: (params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/relation/isLdapMode`,
                method: "POST",
                ...params,
            }),

        /**
         * No description
         *
         * @tags form-properties-relation-controller
         * @name DeleteRelationIsldapmode
         * @summary is Ldap Mode
         * @request DELETE:/api/docpal/relation/isLdapMode
         * @deprecated
         */
        deleteRelationIsldapmode: (params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/relation/isLdapMode`,
                method: "DELETE",
                ...params,
            }),

        /**
         * No description
         *
         * @tags form-properties-relation-controller
         * @name OptionsRelationIsldapmode
         * @summary is Ldap Mode
         * @request OPTIONS:/api/docpal/relation/isLdapMode
         * @deprecated
         */
        optionsRelationIsldapmode: (params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/relation/isLdapMode`,
                method: "OPTIONS",
                ...params,
            }),

        /**
         * No description
         *
         * @tags form-properties-relation-controller
         * @name HeadRelationIsldapmode
         * @summary is Ldap Mode
         * @request HEAD:/api/docpal/relation/isLdapMode
         * @deprecated
         */
        headRelationIsldapmode: (params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/relation/isLdapMode`,
                method: "HEAD",
                ...params,
            }),

        /**
         * No description
         *
         * @tags form-properties-relation-controller
         * @name PatchRelationIsldapmode
         * @summary is Ldap Mode
         * @request PATCH:/api/docpal/relation/isLdapMode
         * @deprecated
         */
        patchRelationIsldapmode: (params: RequestParams = {}) =>
            this.request<ResultBoolean, Result | (ResultObject | Result | ResultString)>({
                path: `/docpal/relation/isLdapMode`,
                method: "PATCH",
                ...params,
            }),
    };
    public = {
        /**
         * No description
         *
         * @tags Public Application Version
         * @name GetPublicVersion
         * @request GET:/public/version
         * @deprecated
         */
        getPublicVersion: (params: RequestParams = {}) =>
            this.request<ResultString, Result | (ResultObject | Result | ResultString)>({
                path: `/public/version`,
                method: "GET",
                ...params,
            }),
    };
}
