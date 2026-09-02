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

/** BranchOfficeItem */
export interface BranchOfficeItem {
    /** Branch Office */
    branch_office: string;
    /** Org Id */
    org_id?: number | null;
}

/** BranchOfficeListResponse */
export interface BranchOfficeListResponse {
    /** Items */
    items: BranchOfficeItem[];
    /** Count */
    count: number;
}

/** ConfiguredOracleQueryRequest */
export interface ConfiguredOracleQueryRequest {
    /**
     * Type
     * 单个配置类型
     */
    type?: string | null;
    /**
     * Types
     * 多个配置类型，批量查询时使用
     */
    types?: string[];
    /**
     * Params
     * 客户端传给配置化 Oracle SQL 的命名参数。 键对应 SQL 里的 :name 占位符；未传的占位符按 null 绑定。
     */
    params?: Record<string, string | number | boolean | null>;
}

/** ConfiguredOracleQueryResponse */
export interface ConfiguredOracleQueryResponse {
    /** Items */
    items: ConfiguredOracleQueryResult[];
    /** Count */
    count: number;
}

/** ConfiguredOracleQueryResult */
export interface ConfiguredOracleQueryResult {
    /** Type */
    type: string;
    /** Rows */
    rows: Record<string, any>[];
    /** Count */
    count: number;
}

/** ConversionRateItem */
export interface ConversionRateItem {
    /** From Currency */
    from_currency: string;
    /** To Currency */
    to_currency: string;
    /** Conversion Rate */
    conversion_rate: number;
}

/** ConversionRateListResponse */
export interface ConversionRateListResponse {
    /** Items */
    items: ConversionRateItem[];
    /** Count */
    count: number;
}

/** CurrencyItem */
export interface CurrencyItem {
    /** Currency Code */
    currency_code: string;
    /** Currency Name */
    currency_name: string;
    /** Symbol */
    symbol?: string | null;
}

/** CurrencyListResponse */
export interface CurrencyListResponse {
    /** Items */
    items: CurrencyItem[];
    /** Count */
    count: number;
}

/** CustomerContact */
export interface CustomerContact {
    /** Cust Account Role Id */
    cust_account_role_id: number;
    /** Primary Flag */
    primary_flag: string;
    /** Contact Name */
    contact_name: string;
}

/** CustomerDetail */
export interface CustomerDetail {
    /** Cust Account Id */
    cust_account_id: number;
    /** Account Number */
    account_number: string;
    /** Customer Name */
    customer_name: string;
    /** Customer Eng Name */
    customer_eng_name: string;
    /** Customer Location */
    customer_location?: string | null;
    /** Customer Complete Address */
    customer_complete_address?: string | null;
    /** Customer Telephone Number */
    customer_telephone_number?: string | null;
    /** Customer Back Group */
    customer_back_group?: string | null;
    /** Cust Group */
    cust_group?: string | null;
    /** Payment Term Id */
    payment_term_id?: number | null;
    /** Payment Term */
    payment_term?: string | null;
    /** Customer Contact */
    customer_contact?: string | null;
    /** Contacts */
    contacts?: CustomerContact[];
}

/** CustomerPoSearchResponse */
export interface CustomerPoSearchResponse {
    /** Items */
    items: CustomerPoSummary[];
    /** Count */
    count: number;
}

/** CustomerPoSummary */
export interface CustomerPoSummary {
    /** Customer Po */
    customer_po: string;
    /** Header Id */
    header_id: number;
    /** Order Number */
    order_number?: number | null;
    /** Order Date */
    order_date?: string | null;
    /** Currency Code */
    currency_code?: string | null;
    /** Account Number */
    account_number?: string | null;
    /** Customer Name */
    customer_name?: string | null;
}

/** CustomerSearchResponse */
export interface CustomerSearchResponse {
    /** Items */
    items: CustomerSummary[];
    /** Count */
    count: number;
}

/** CustomerSummary */
export interface CustomerSummary {
    /** Cust Account Id */
    cust_account_id: number;
    /** Account Number */
    account_number: string;
    /** Customer Name */
    customer_name: string;
    /** Customer Eng Name */
    customer_eng_name: string;
}

/** CustomerVisitCompanion */
export interface CustomerVisitCompanion {
    /**
     * Userid
     * @minLength 1
     * @maxLength 100
     */
    userId: string;
    /**
     * Username
     * @minLength 1
     * @maxLength 100
     */
    userName: string;
    /** Orgid */
    orgId?: string | null;
    /** Office */
    office?: string | null;
    /** Branchoffice */
    branchOffice?: string | null;
    /** Groupid */
    groupId?: string | null;
    /** Groupname */
    groupName?: string | null;
    /** Rolecode */
    roleCode?: string | null;
}

/** CustomerVisitCreateRequest */
export interface CustomerVisitCreateRequest {
    /**
     * Workflow Definition Id
     * @minLength 1
     * @maxLength 100
     */
    workflow_definition_id: string;
    /**
     * Workflow Run Id
     * @minLength 1
     * @maxLength 100
     */
    workflow_run_id: string;
    /** Process Instance Id */
    process_instance_id?: string | null;
    /** Current Stage Key */
    current_stage_key?: string | null;
    /** Current Stage Name */
    current_stage_name?: string | null;
    /**
     * Workflow Status
     * @default "draft"
     */
    workflow_status?: "draft" | "submitted" | "void" | "closed";
    /**
     * Sample Status
     * @default "not_required"
     */
    sample_status?: "not_required" | "wait_for_testing" | "under_testing" | "approved" | "failed";
    /**
     * Created By
     * @minLength 1
     * @maxLength 100
     */
    created_by: string;
    /** Visitor User Id */
    visitor_user_id?: string | null;
    /** Office */
    office?: string | null;
    /** Org Id */
    org_id?: string | null;
    /** Branch Office */
    branch_office?: string | null;
    /** Team Id */
    team_id?: string | null;
    /** Team Name */
    team_name?: string | null;
    /** Companions */
    companions?: CustomerVisitCompanion[];
    /**
     * Customer Number
     * @minLength 1
     * @maxLength 100
     */
    customer_number: string;
    /** Customer Chinese Name */
    customer_chinese_name?: string | null;
    /** Customer English Name */
    customer_english_name?: string | null;
    /** Customer Address */
    customer_address?: string | null;
    /** Customer Background */
    customer_background?: string | null;
    /** Customer Participants */
    customer_participants?: CustomerVisitParticipant[];
    /**
     * Activity Date
     * @format date
     */
    activity_date: string;
    /** Theme */
    theme?: string | null;
    /** Competitors */
    competitors?: string | null;
    /** Next Steps */
    next_steps?: string | null;
    /** Promote Brands */
    promote_brands?: string[];
    /** Support Needed */
    support_needed?: string | null;
    /** Meeting Summary */
    meeting_summary?: string | null;
    /** Remarks */
    remarks?: string | null;
    /** Form Payload */
    form_payload?: Record<string, any>;
    /** Workflow Payload */
    workflow_payload?: Record<string, any>;
    /** Source Snapshot */
    source_snapshot?: Record<string, any>;
}

/** CustomerVisitDetail */
export interface CustomerVisitDetail {
    /** Id */
    id: number;
    /** Activity Id */
    activity_id: string;
    /** Workflow Definition Id */
    workflow_definition_id: string;
    /** Workflow Run Id */
    workflow_run_id: string;
    /** Process Instance Id */
    process_instance_id?: string | null;
    /** Current Stage Key */
    current_stage_key?: string | null;
    /** Current Stage Name */
    current_stage_name?: string | null;
    /** Visitor Type */
    visitor_type: number;
    /** Created By */
    created_by: string;
    /** Visitor User Id */
    visitor_user_id?: string | null;
    /** Office */
    office?: string | null;
    /** Org Id */
    org_id?: string | null;
    /** Branch Office */
    branch_office?: string | null;
    /** Team Id */
    team_id?: string | null;
    /** Team Name */
    team_name?: string | null;
    /** Companions */
    companions?: CustomerVisitCompanion[];
    /** Customer Number */
    customer_number: string;
    /** Customer Chinese Name */
    customer_chinese_name?: string | null;
    /** Customer English Name */
    customer_english_name?: string | null;
    /** Customer Address */
    customer_address?: string | null;
    /** Customer Background */
    customer_background?: string | null;
    /** Customer Participants */
    customer_participants?: CustomerVisitParticipant[];
    /**
     * Activity Date
     * @format date
     */
    activity_date: string;
    /** Theme */
    theme?: string | null;
    /** Competitors */
    competitors?: string | null;
    /** Next Steps */
    next_steps?: string | null;
    /** Promote Brands */
    promote_brands?: string[];
    /** Support Needed */
    support_needed?: string | null;
    /** Meeting Summary */
    meeting_summary?: string | null;
    /** Remarks */
    remarks?: string | null;
    /** Workflow Status */
    workflow_status: "draft" | "submitted" | "void" | "closed";
    /** Sample Status */
    sample_status: "not_required" | "wait_for_testing" | "under_testing" | "approved" | "failed";
    /** Related Sample Id */
    related_sample_id?: string | null;
    /** Form Payload */
    form_payload?: Record<string, any>;
    /** Workflow Payload */
    workflow_payload?: Record<string, any>;
    /** Source Snapshot */
    source_snapshot?: Record<string, any>;
    /** Submit Time */
    submit_time?: string | null;
    /**
     * Created At
     * @format date-time
     */
    created_at: string;
    /**
     * Updated At
     * @format date-time
     */
    updated_at: string;
    /**
     * Is Deleted
     * @default false
     */
    is_deleted?: boolean;
}

/** CustomerVisitListResponse */
export interface CustomerVisitListResponse {
    /** Items */
    items: CustomerVisitSummary[];
    /** Count */
    count: number;
    /** Total */
    total: number;
    /** Page Num */
    page_num: number;
    /** Page Size */
    page_size: number;
}

/** CustomerVisitParticipant */
export interface CustomerVisitParticipant {
    /**
     * Name
     * @minLength 1
     * @maxLength 100
     */
    name: string;
    /** Position */
    position?: string | null;
    /** Tel */
    tel?: string | null;
    /** Email */
    email?: string | null;
}

/** CustomerVisitPatchChanges */
export interface CustomerVisitPatchChanges {
    /** Process Instance Id */
    process_instance_id?: string | null;
    /** Office */
    office?: string | null;
    /** Org Id */
    org_id?: string | null;
    /** Branch Office */
    branch_office?: string | null;
    /** Team Id */
    team_id?: string | null;
    /** Team Name */
    team_name?: string | null;
    /** Companions */
    companions?: CustomerVisitCompanion[] | null;
    /** Customer Number */
    customer_number?: string | null;
    /** Customer Chinese Name */
    customer_chinese_name?: string | null;
    /** Customer English Name */
    customer_english_name?: string | null;
    /** Customer Address */
    customer_address?: string | null;
    /** Customer Background */
    customer_background?: string | null;
    /** Customer Participants */
    customer_participants?: CustomerVisitParticipant[] | null;
    /** Activity Date */
    activity_date?: string | null;
    /** Theme */
    theme?: string | null;
    /** Competitors */
    competitors?: string | null;
    /** Next Steps */
    next_steps?: string | null;
    /** Promote Brands */
    promote_brands?: string[] | null;
    /** Support Needed */
    support_needed?: string | null;
    /** Meeting Summary */
    meeting_summary?: string | null;
    /** Remarks */
    remarks?: string | null;
    /** Form Payload */
    form_payload?: Record<string, any> | null;
    /** Workflow Payload */
    workflow_payload?: Record<string, any> | null;
    /** Source Snapshot */
    source_snapshot?: Record<string, any> | null;
}

/** CustomerVisitPatchRequest */
export interface CustomerVisitPatchRequest {
    /**
     * If Match Updated At
     * @format date-time
     */
    if_match_updated_at: string;
    changes: CustomerVisitPatchChanges;
}

/** CustomerVisitSampleStatusRequest */
export interface CustomerVisitSampleStatusRequest {
    /**
     * Current Stage Key
     * @minLength 1
     * @maxLength 100
     */
    current_stage_key: string;
    /**
     * Action
     * @minLength 1
     * @maxLength 100
     */
    action: string;
    /** Related Sample Id */
    related_sample_id?: string | null;
    /** Operator Id */
    operator_id?: string | null;
    /** Operator Name */
    operator_name?: string | null;
    /** Comment */
    comment?: string | null;
}

/** CustomerVisitStatusRequest */
export interface CustomerVisitStatusRequest {
    /**
     * Current Stage Key
     * @minLength 1
     * @maxLength 100
     */
    current_stage_key: string;
    /**
     * Action
     * @minLength 1
     * @maxLength 100
     */
    action: string;
    /** Operator Id */
    operator_id?: string | null;
    /** Operator Name */
    operator_name?: string | null;
    /** Comment */
    comment?: string | null;
    /** Next Stage Key */
    next_stage_key?: string | null;
    /** Next Stage Name */
    next_stage_name?: string | null;
}

/** CustomerVisitSummary */
export interface CustomerVisitSummary {
    /** Id */
    id: number;
    /** Activity Id */
    activity_id: string;
    /** Workflow Run Id */
    workflow_run_id: string;
    /** Current Stage Key */
    current_stage_key?: string | null;
    /** Current Stage Name */
    current_stage_name?: string | null;
    /** Workflow Status */
    workflow_status: "draft" | "submitted" | "void" | "closed";
    /** Sample Status */
    sample_status: "not_required" | "wait_for_testing" | "under_testing" | "approved" | "failed";
    /** Visitor Type */
    visitor_type: number;
    /** Created By */
    created_by: string;
    /** Customer Number */
    customer_number: string;
    /** Customer Chinese Name */
    customer_chinese_name?: string | null;
    /**
     * Activity Date
     * @format date
     */
    activity_date: string;
    /**
     * Created At
     * @format date-time
     */
    created_at: string;
    /**
     * Updated At
     * @format date-time
     */
    updated_at: string;
}

/** DeleteResponse */
export interface DeleteResponse {
    /** Deleted */
    deleted: boolean;
}

/** DropdownOption */
export interface DropdownOption {
    /** Label */
    label: string;
    /** Value */
    value: string;
}

/** DropdownOptionListResponse */
export interface DropdownOptionListResponse {
    /** Items */
    items: DropdownOption[];
    /** Count */
    count: number;
}

/** ExecuteResponse */
export interface ExecuteResponse {
    /** Affected Rows */
    affected_rows: number;
}

/** GitMatchOraclePreLogRequest */
export interface GitMatchOraclePreLogRequest {
    /** Org Id */
    org_id: number;
    /**
     * Po Number
     * PO 号，对应 segment1
     * @minLength 1
     */
    po_number: string;
    /**
     * Po Line Num
     * PO 行号
     * @min 1
     */
    po_line_num: number;
    /**
     * Po Shipment Num
     * 发运行号
     */
    po_shipment_num?: number | null;
}

/** GitMatchOraclePreLogResponse */
export interface GitMatchOraclePreLogResponse {
    /** Deleted */
    deleted: number;
    /** Inserted */
    inserted: number;
    /** Org Id */
    org_id: number;
    /** Po Number */
    po_number: string;
    /** Po Line Num */
    po_line_num: number;
    /** Shipment Num */
    shipment_num?: number | null;
}

/** GitMatchRequest */
export interface GitMatchRequest {
    /** Org Id */
    org_id: number;
    /**
     * Po Number
     * @minLength 1
     */
    po_number: string;
    /** Po Line Num */
    po_line_num?: string | number | null;
    /** Po Shipment Num */
    po_shipment_num?: string | number | null;
    /** Vendor Prefix */
    vendor_prefix?: string | null;
    /**
     * Wcl Item Name
     * @minLength 1
     */
    wcl_item_name: string;
    /** Unit Price */
    unit_price: number;
    /** Qty */
    qty: number;
    /**
     * Control Flag
     * @min 1
     * @max 3
     * @default 3
     */
    control_flag?: number;
}

/** GitMatchResponse */
export interface GitMatchResponse {
    /** Status */
    status: string;
    /** Match Type */
    match_type?: string | null;
    /** Item Id */
    item_id?: number | null;
    /** Item Number */
    item_number?: string | null;
    /** Po Number */
    po_number: string;
    /** Po Line Num */
    po_line_num?: string | number | null;
    /** Shipment Num */
    shipment_num?: string | number | null;
    /** Unit Price */
    unit_price?: number | null;
    /** Available Qty */
    available_qty?: number | null;
    /** Split Lines */
    split_lines?: GitMatchSplitLine[];
    /** Display */
    display: string;
    /**
     * Pre Log Written
     * @default false
     */
    pre_log_written?: boolean;
}

/** GitMatchSplitLine */
export interface GitMatchSplitLine {
    /** Line Num */
    line_num?: number | null;
    /** Shipment Num */
    shipment_num?: number | null;
    /** Available Qty */
    available_qty?: number | null;
}

/** HTTPValidationError */
export interface HTTPValidationError {
    /** Detail */
    detail?: ValidationError[];
}

/** HealthResponse */
export interface HealthResponse {
    /** Status */
    status: string;
    /** Oracle */
    oracle: string;
    /** Postgres */
    postgres: string;
}

/** ItemMasterItem */
export interface ItemMasterItem {
    /** Inventory Item Id */
    inventory_item_id: number;
    /** Organization Id */
    organization_id: number;
    /** Mpq */
    mpq?: number | null;
    /** Uom */
    uom?: string | null;
    /** Moq */
    moq?: number | null;
    /** Description */
    description?: string | null;
    /** Wcl Item No */
    wcl_item_no: string;
    /** Vendor Item No */
    vendor_item_no?: string | null;
    /** Coo */
    coo?: string | null;
    /** Brand */
    brand?: string | null;
    /** Customer Number */
    customer_number?: string | null;
    /** Customer Part Number */
    customer_part_number?: string | null;
}

/** ItemMasterPagedResponse */
export interface ItemMasterPagedResponse {
    /** Items */
    items: ItemMasterItem[];
    /** Count */
    count: number;
    /** Total */
    total: number;
    /** Page Num */
    page_num: number;
    /** Page Size */
    page_size: number;
}

/** OfficeItem */
export interface OfficeItem {
    /** Sub Office */
    sub_office: string;
    /** Org Id */
    org_id: number;
    /** Org Name */
    org_name?: string | null;
}

/** OfficeListResponse */
export interface OfficeListResponse {
    /** Items */
    items: OfficeItem[];
    /** Count */
    count: number;
}

/** OracleNextvalResponse */
export interface OracleNextvalResponse {
    /** Sequence Name */
    sequence_name: string;
    /** Nextval */
    nextval: number;
}

/** OrderDefaults */
export interface OrderDefaults {
    /** Cust Account Id */
    cust_account_id: number;
    /** Account Number */
    account_number: string;
    /**
     * Order Date
     * 默认订单日期 YYYY-MM-DD（当天）
     */
    order_date: string;
    /**
     * Currency Code
     * 订单币种，独立选择，不由价目表带出
     */
    currency_code?: string | null;
    /** Payment Term Id */
    payment_term_id?: number | null;
    /** Payment Term */
    payment_term?: string | null;
    salesperson?: SalespersonItem | null;
    /** Salespersons */
    salespersons?: SalespersonItem[];
    bill_to?: SiteLocation | null;
    ship_to?: SiteLocation | null;
    /** Address */
    address?: string | null;
    /** Bill To Locations */
    bill_to_locations?: SiteLocation[];
    /** Ship To Locations */
    ship_to_locations?: SiteLocation[];
}

/** OrderInfoByCustomerPo */
export interface OrderInfoByCustomerPo {
    /** Customer Po */
    customer_po: string;
    /** Header Id */
    header_id: number;
    /** Order Number */
    order_number?: number | null;
    /** Cust Account Id */
    cust_account_id?: number | null;
    /** Account Number */
    account_number?: string | null;
    /** Customer Name */
    customer_name?: string | null;
    /**
     * Order Date
     * 来自 OE 订单头 ORDERED_DATE
     */
    order_date?: string | null;
    /**
     * Currency Code
     * 来自 OE 订单头 TRANSACTIONAL_CURR_CODE
     */
    currency_code?: string | null;
    /** Payment Term Id */
    payment_term_id?: number | null;
    /** Payment Term */
    payment_term?: string | null;
    salesperson?: SalespersonItem | null;
    bill_to?: SiteLocation | null;
    ship_to?: SiteLocation | null;
    /** Address */
    address?: string | null;
    /** Org Id */
    org_id?: number | null;
    /** Order Type Id */
    order_type_id?: number | null;
    /** Order Type */
    order_type?: string | null;
    /** Price List Id */
    price_list_id?: number | null;
    /** Price List */
    price_list?: string | null;
    /** Flow Status Code */
    flow_status_code?: string | null;
}

/** OrderTypeItem */
export interface OrderTypeItem {
    /** Row Uid */
    row_uid: number;
    /** Org Id */
    org_id: number;
    /** Transaction Type Id */
    transaction_type_id: number;
    /** Order Type */
    order_type: string;
    /** Order Category Code */
    order_category_code?: string | null;
    /** Sub Office */
    sub_office?: string | null;
}

/** OrderTypeSearchResponse */
export interface OrderTypeSearchResponse {
    /** Items */
    items: OrderTypeItem[];
    /** Count */
    count: number;
}

/** OrgMappingItem */
export interface OrgMappingItem {
    /** Org Id */
    org_id: number;
    /** Organization Id */
    organization_id: number;
    /** Org Name */
    org_name?: string | null;
    /** Organization Code */
    organization_code?: string | null;
    /** Organization Name */
    organization_name?: string | null;
}

/** OrgMappingListResponse */
export interface OrgMappingListResponse {
    /** Items */
    items: OrgMappingItem[];
    /** Count */
    count: number;
}

/** OrgMappingResult */
export interface OrgMappingResult {
    /** Org Id */
    org_id: number;
    /** Organization Id */
    organization_id: number;
    /** Org Name */
    org_name?: string | null;
    /** Organization Code */
    organization_code?: string | null;
    /** Organization Name */
    organization_name?: string | null;
    /** Direction */
    direction: string;
}

/** PaymentTermItem */
export interface PaymentTermItem {
    /** Payment Term Id */
    payment_term_id: number;
    /** Payment Term */
    payment_term: string;
    /** Description */
    description?: string | null;
}

/** PaymentTermSearchResponse */
export interface PaymentTermSearchResponse {
    /** Items */
    items: PaymentTermItem[];
    /** Count */
    count: number;
}

/** PriceListItem */
export interface PriceListItem {
    /** Row Uid */
    row_uid: number;
    /** Organization Id */
    organization_id: number;
    /** Price List Id */
    price_list_id: number;
    /** Price List */
    price_list: string;
    /** Currency Code */
    currency_code?: string | null;
    /** Sub Office */
    sub_office?: string | null;
    /** Is Cny */
    is_cny?: string | null;
}

/** PriceListSearchResponse */
export interface PriceListSearchResponse {
    /** Items */
    items: PriceListItem[];
    /** Count */
    count: number;
}

/** QueryResponse */
export interface QueryResponse {
    /** Rows */
    rows: Record<string, any>[];
    /** Count */
    count: number;
}

/** QuotationCostHistoryItem */
export interface QuotationCostHistoryItem {
    /** Type */
    type?: string | null;
    /** Po Number */
    po_number?: string | null;
    /** Quantity */
    quantity?: number | null;
    /** Cost */
    cost?: number | null;
    /** Currency */
    currency?: string | null;
    /** Exchange Rate */
    exchange_rate?: number | null;
    /** Po Customer */
    po_customer?: string | null;
    /** Creation Date */
    creation_date?: string | null;
    /** Item */
    item?: string | null;
    /** Note To Vendor */
    note_to_vendor?: string | null;
    /** Moq */
    moq?: number | null;
}

/** QuotationCostHistoryRequest */
export interface QuotationCostHistoryRequest {
    /**
     * Currency
     * 目标币种，用于汇率换算
     */
    currency: string;
    /**
     * Part Number
     * 料号；可含 %
     */
    part_number?: string | null;
    /**
     * Series
     * 系列关键字；匹配 KOA%{series}%
     */
    series?: string | null;
    /**
     * Item
     * 兼容字段：part_number 与 series 都为空时当作 series
     */
    item?: string | null;
    /**
     * Type
     * QUOTATION 或 PO
     */
    type?: string | null;
    /**
     * Org Id
     * OU；与 brand 一起决定 PO 过滤分支（不含按人 EXISTS）
     */
    org_id?: number | null;
    /**
     * Brand
     * 品牌；org_id!=2 时 NCC 与其它品牌 PO 范围不同
     */
    brand?: string | null;
    /** Start Date */
    start_date?: string | null;
    /** End Date */
    end_date?: string | null;
    /**
     * Page
     * 页码，从 1 开始
     * @min 1
     * @default 1
     */
    page?: number;
    /**
     * Size
     * 每页条数
     * @min 1
     * @max 500
     * @default 10
     */
    size?: number;
}

/** QuotationCostHistoryResponse */
export interface QuotationCostHistoryResponse {
    /** Items */
    items: QuotationCostHistoryItem[];
    /** Count */
    count: number;
    /** Total */
    total: number;
    /** Page */
    page: number;
    /** Size */
    size: number;
}

/** RcvImpHeader */
export interface RcvImpHeader {
    /** Rcv Imp Header Id */
    rcv_imp_header_id: number;
    /** Creation Date */
    creation_date?: string | null;
    /** Last Update Date */
    last_update_date?: string | null;
    /** Last Updated By */
    last_updated_by?: string | null;
    /** Created By */
    created_by?: string | null;
    /** Org Id */
    org_id?: number | null;
    /** Group Id */
    group_id?: number | null;
}

/** RcvImpHeaderCreateRequest */
export interface RcvImpHeaderCreateRequest {
    /**
     * Org Id
     * OU org_id
     */
    org_id: number;
    /**
     * Group Id
     * 接口组号；导入前通常为空，跑收货接口过程后回写
     */
    group_id?: number | null;
    /**
     * Created By
     * 创建人，默认 middle_service
     */
    created_by?: string | null;
}

/** RcvImpLine */
export interface RcvImpLine {
    /** Rcv Imp Line Id */
    rcv_imp_line_id: number;
    /** Rcv Imp Header Id */
    rcv_imp_header_id?: number | null;
    /** Creation Date */
    creation_date?: string | null;
    /** Last Update Date */
    last_update_date?: string | null;
    /** Last Updated By */
    last_updated_by?: string | null;
    /** Created By */
    created_by?: string | null;
    /** Shipment Num */
    shipment_num?: string | null;
    /** Transaction Date */
    transaction_date?: string | null;
    /** Wcl Po Header */
    wcl_po_header?: string | null;
    /** Wcl Po Line */
    wcl_po_line?: number | null;
    /** Wcl Item Number */
    wcl_item_number?: string | null;
    /** Order Qty */
    order_qty?: number | null;
    /** Git Date */
    git_date?: string | null;
    /** Result */
    result?: string | null;
    /** Unit Price */
    unit_price?: number | null;
    /** Curr Code */
    curr_code?: string | null;
    /** Wcl Po Shipment Num */
    wcl_po_shipment_num?: number | null;
}

/** RcvImpLineCreateItem */
export interface RcvImpLineCreateItem {
    /** Shipment Num */
    shipment_num?: string | null;
    /** Transaction Date */
    transaction_date?: string | null;
    /**
     * Wcl Po Header
     * PO 号
     */
    wcl_po_header?: string | null;
    /**
     * Wcl Po Line
     * PO 行号；NCC 可空/0
     */
    wcl_po_line?: number | null;
    /**
     * Wcl Po Shipment Num
     * PO 发运行号
     */
    wcl_po_shipment_num?: number | null;
    /** Wcl Item Number */
    wcl_item_number?: string | null;
    /** Order Qty */
    order_qty?: number | null;
    /** Unit Price */
    unit_price?: number | null;
    /** Git Date */
    git_date?: string | null;
    /** Curr Code */
    curr_code?: string | null;
    /**
     * Result
     * 处理结果；新建通常为空
     */
    result?: string | null;
}

/** RcvImpLinesCreateRequest */
export interface RcvImpLinesCreateRequest {
    /**
     * Rcv Imp Header Id
     * 所属导入单头 ID
     */
    rcv_imp_header_id: number;
    /**
     * Created By
     * 创建人，默认 middle_service
     */
    created_by?: string | null;
    /**
     * Lines
     * 待插入的行列表
     * @minItems 1
     */
    lines: RcvImpLineCreateItem[];
}

/** RcvImpLinesCreateResponse */
export interface RcvImpLinesCreateResponse {
    /** Count */
    count: number;
    /** Items */
    items: RcvImpLine[];
    /**
     * Oracle Sync Queued
     * @default false
     */
    oracle_sync_queued?: boolean;
}

/** RcvImpProcessLineResult */
export interface RcvImpProcessLineResult {
    /** Rcv Imp Line Id */
    rcv_imp_line_id: number;
    /** Shipment Num */
    shipment_num?: string | null;
    /** Wcl Po Header */
    wcl_po_header?: string | null;
    /** Wcl Item Number */
    wcl_item_number?: string | null;
    /** Result */
    result?: string | null;
    /**
     * Interface Written
     * @default false
     */
    interface_written?: boolean;
}

/** RcvImpProcessResponse */
export interface RcvImpProcessResponse {
    /** Rcv Imp Header Id */
    rcv_imp_header_id: number;
    /** Group Id */
    group_id: number;
    /** Line Count */
    line_count: number;
    /** Done Count */
    done_count: number;
    /** Oracle Sync Queued */
    oracle_sync_queued: boolean;
    /** Lines */
    lines?: RcvImpProcessLineResult[];
}

/** SalespersonItem */
export interface SalespersonItem {
    /** Salesrep Id */
    salesrep_id: number;
    /** Salesrep Name */
    salesrep_name: string;
    /** Org Id */
    org_id?: number | null;
    /** Start Date */
    start_date?: null;
    /** End Date */
    end_date?: null;
}

/** SampleRequestAddTrackingRequest */
export interface SampleRequestAddTrackingRequest {
    /**
     * If Match Updated At
     * @format date-time
     */
    if_match_updated_at: string;
    /**
     * Tracking Number
     * @minLength 1
     * @maxLength 128
     */
    tracking_number: string;
    /** Tracking Date */
    tracking_date?: string | null;
    /**
     * Email Alert
     * @default "YES"
     */
    email_alert?: "YES" | "NO" | null;
    /** Updated By */
    updated_by?: string | null;
}

/** SampleRequestCreateRequest */
export interface SampleRequestCreateRequest {
    /**
     * Workflow Definition Id
     * @minLength 1
     * @maxLength 64
     */
    workflow_definition_id: string;
    /**
     * Workflow Run Id
     * @minLength 1
     * @maxLength 64
     */
    workflow_run_id: string;
    /** Process Instance Id */
    process_instance_id?: string | null;
    /**
     * Current Stage Key
     * @minLength 1
     * @maxLength 64
     */
    current_stage_key: string;
    /**
     * Current Stage Name
     * @minLength 1
     * @maxLength 128
     */
    current_stage_name: string;
    /**
     * Workflow Status
     * @default "draft"
     */
    workflow_status?:
        | "draft"
        | "pm_reviewing"
        | "sales_revising"
        | "awaiting_supplier"
        | "supplier_following"
        | "shipped_to_customer"
        | "waiting_test"
        | "under_test"
        | "approved"
        | "failed"
        | "cancelled"
        | "closed";
    /**
     * Approval Status
     * @default "pending"
     */
    approval_status?: "pending" | "approved" | "rejected";
    /**
     * Fulfillment Status
     * @default "not_started"
     */
    fulfillment_status?:
        | "not_started"
        | "supplier_pending"
        | "supplier_confirmed"
        | "in_transit"
        | "delivered_to_sales"
        | "delivered_to_customer";
    /**
     * Testing Status
     * @default "not_started"
     */
    testing_status?: "not_started" | "waiting_customer_test" | "testing" | "approved" | "failed";
    /**
     * Sales Owner Name
     * @minLength 1
     * @maxLength 128
     */
    sales_owner_name: string;
    /** Sales Sub Office Code */
    sales_sub_office_code?: string | null;
    /** Sales Branch Office Code */
    sales_branch_office_code?: string | null;
    /** Project Name */
    project_name?: string | null;
    /** Project Type */
    project_type?: "New" | "Old" | "SecondSource" | "Transfer" | null;
    /** Category */
    category?: string | null;
    /** Pilot Run Date */
    pilot_run_date?: string | null;
    /** Mass Production Date */
    mass_production_date?: string | null;
    /** Application Name */
    application_name?: string | null;
    /** Expected Sample Arrival Date */
    expected_sample_arrival_date?: string | null;
    /** Customer No */
    customer_no?: string | null;
    /** Customer Name Zh */
    customer_name_zh?: string | null;
    /** Customer Name En */
    customer_name_en?: string | null;
    /** Customer Address */
    customer_address?: string | null;
    /** Customer Website */
    customer_website?: string | null;
    /** Customer Contact */
    customer_contact?: string | null;
    /** Customer Phone */
    customer_phone?: string | null;
    /** Customer Email */
    customer_email?: string | null;
    /** Customer Background */
    customer_background?: "OEM" | "ODM" | "Trading" | null;
    /** End Customer Name */
    end_customer_name?: string | null;
    /** Foundry Snapshot */
    foundry_snapshot?: SampleRequestFoundrySnapshotItem[];
    /** Pm Comment */
    pm_comment?: string | null;
    /** Header Remark */
    header_remark?: string | null;
    /** Vendor Confirmed Date */
    vendor_confirmed_date?: string | null;
    /**
     * Sample Lines
     * @minItems 1
     */
    sample_lines: SampleRequestLine[];
    /** Api Snapshot */
    api_snapshot?: Record<string, any>;
    /** Form Payload */
    form_payload?: Record<string, any>;
    /** Workflow Payload */
    workflow_payload?: Record<string, any>;
    /** Created By */
    created_by?: string | null;
    /** Updated By */
    updated_by?: string | null;
}

/** SampleRequestDetail */
export interface SampleRequestDetail {
    /** Id */
    id: number;
    /** Request No */
    request_no: string;
    /** Workflow Definition Id */
    workflow_definition_id: string;
    /** Workflow Run Id */
    workflow_run_id: string;
    /** Process Instance Id */
    process_instance_id?: string | null;
    /** Current Stage Key */
    current_stage_key: string;
    /** Current Stage Name */
    current_stage_name: string;
    /** Workflow Status */
    workflow_status:
        | "draft"
        | "pm_reviewing"
        | "sales_revising"
        | "awaiting_supplier"
        | "supplier_following"
        | "shipped_to_customer"
        | "waiting_test"
        | "under_test"
        | "approved"
        | "failed"
        | "cancelled"
        | "closed";
    /** Approval Status */
    approval_status: "pending" | "approved" | "rejected";
    /** Fulfillment Status */
    fulfillment_status:
        | "not_started"
        | "supplier_pending"
        | "supplier_confirmed"
        | "in_transit"
        | "delivered_to_sales"
        | "delivered_to_customer";
    /** Testing Status */
    testing_status: "not_started" | "waiting_customer_test" | "testing" | "approved" | "failed";
    /** Sales Owner Name */
    sales_owner_name: string;
    /** Sales Sub Office Code */
    sales_sub_office_code?: string | null;
    /** Sales Branch Office Code */
    sales_branch_office_code?: string | null;
    /** Project Name */
    project_name?: string | null;
    /** Project Type */
    project_type?: "New" | "Old" | "SecondSource" | "Transfer" | null;
    /** Category */
    category?: string | null;
    /** Pilot Run Date */
    pilot_run_date?: string | null;
    /** Mass Production Date */
    mass_production_date?: string | null;
    /** Application Name */
    application_name?: string | null;
    /** Expected Sample Arrival Date */
    expected_sample_arrival_date?: string | null;
    /** Customer No */
    customer_no?: string | null;
    /** Customer Name Zh */
    customer_name_zh?: string | null;
    /** Customer Name En */
    customer_name_en?: string | null;
    /** Customer Address */
    customer_address?: string | null;
    /** Customer Website */
    customer_website?: string | null;
    /** Customer Contact */
    customer_contact?: string | null;
    /** Customer Phone */
    customer_phone?: string | null;
    /** Customer Email */
    customer_email?: string | null;
    /** Customer Background */
    customer_background?: "OEM" | "ODM" | "Trading" | null;
    /** End Customer Name */
    end_customer_name?: string | null;
    /** Document Brand */
    document_brand?: string | null;
    /** Foundry Snapshot */
    foundry_snapshot?: SampleRequestFoundrySnapshotItem[];
    /** Pm Comment */
    pm_comment?: string | null;
    /** Header Remark */
    header_remark?: string | null;
    /** Vendor Confirmed Date */
    vendor_confirmed_date?: string | null;
    /** Sample Lines */
    sample_lines?: SampleRequestLine[];
    /** Api Snapshot */
    api_snapshot?: Record<string, any>;
    /** Form Payload */
    form_payload?: Record<string, any>;
    /** Workflow Payload */
    workflow_payload?: Record<string, any>;
    /** Created By */
    created_by?: string | null;
    /** Updated By */
    updated_by?: string | null;
    /** Submitted At */
    submitted_at?: string | null;
    /** Completed At */
    completed_at?: string | null;
    /**
     * Created At
     * @format date-time
     */
    created_at: string;
    /**
     * Updated At
     * @format date-time
     */
    updated_at: string;
}

/** SampleRequestFoundrySnapshotItem */
export interface SampleRequestFoundrySnapshotItem {
    /**
     * Customer No
     * @minLength 1
     * @maxLength 64
     */
    customer_no: string;
    /** Customer Name Zh */
    customer_name_zh?: string | null;
    /** Customer Name En */
    customer_name_en?: string | null;
}

/** SampleRequestLine */
export interface SampleRequestLine {
    /** Line No */
    line_no?: number | null;
    /** Brand */
    brand?: string | null;
    /** Part Number */
    part_number?: string | null;
    /** Series */
    series?: string | null;
    /**
     * Request Qty
     * @exclusiveMin 0
     */
    request_qty: number;
    /** Pcs Per Unit */
    pcs_per_unit?: number | null;
    /** Monthly Usage Km */
    monthly_usage_km?: number | null;
    /** Customer Monthly Usage Km */
    customer_monthly_usage_km?: number | null;
    /** Car Use */
    car_use?: boolean | null;
    /** Selection Mode */
    selection_mode?: "customer_selected" | "sales_recommended" | null;
    /** Competitor Name */
    competitor_name?: string | null;
    /** Competitor Part Number */
    competitor_part_number?: string | null;
    /** Competitor Unit Price */
    competitor_unit_price?: number | null;
    /** Line Remark */
    line_remark?: string | null;
    /** Pm Name */
    pm_name?: string | null;
    /** Sales Admin Name */
    sales_admin_name?: string | null;
    /** Vendor Contact */
    vendor_contact?: string | null;
    /** Vendor Coo */
    vendor_coo?: string | null;
    /** Vendor Etd Date */
    vendor_etd_date?: string | null;
    /** Vendor Eta Date */
    vendor_eta_date?: string | null;
    /** Tracking Records */
    tracking_records?: SampleRequestTrackingRecord[];
}

/** SampleRequestListResponse */
export interface SampleRequestListResponse {
    /** Items */
    items: SampleRequestSummary[];
    /** Count */
    count: number;
    /** Total */
    total: number;
    /** Page Num */
    page_num: number;
    /** Page Size */
    page_size: number;
}

/** SampleRequestPatchChanges */
export interface SampleRequestPatchChanges {
    /** Process Instance Id */
    process_instance_id?: string | null;
    /** Sales Sub Office Code */
    sales_sub_office_code?: string | null;
    /** Sales Branch Office Code */
    sales_branch_office_code?: string | null;
    /** Project Name */
    project_name?: string | null;
    /** Project Type */
    project_type?: "New" | "Old" | "SecondSource" | "Transfer" | null;
    /** Category */
    category?: string | null;
    /** Pilot Run Date */
    pilot_run_date?: string | null;
    /** Mass Production Date */
    mass_production_date?: string | null;
    /** Application Name */
    application_name?: string | null;
    /** Expected Sample Arrival Date */
    expected_sample_arrival_date?: string | null;
    /** Customer No */
    customer_no?: string | null;
    /** Customer Name Zh */
    customer_name_zh?: string | null;
    /** Customer Name En */
    customer_name_en?: string | null;
    /** Customer Address */
    customer_address?: string | null;
    /** Customer Website */
    customer_website?: string | null;
    /** Customer Contact */
    customer_contact?: string | null;
    /** Customer Phone */
    customer_phone?: string | null;
    /** Customer Email */
    customer_email?: string | null;
    /** Customer Background */
    customer_background?: "OEM" | "ODM" | "Trading" | null;
    /** End Customer Name */
    end_customer_name?: string | null;
    /** Foundry Snapshot */
    foundry_snapshot?: SampleRequestFoundrySnapshotItem[] | null;
    /** Pm Comment */
    pm_comment?: string | null;
    /** Header Remark */
    header_remark?: string | null;
    /** Vendor Confirmed Date */
    vendor_confirmed_date?: string | null;
    /** Api Snapshot */
    api_snapshot?: Record<string, any> | null;
    /** Form Payload */
    form_payload?: Record<string, any> | null;
    /** Workflow Payload */
    workflow_payload?: Record<string, any> | null;
}

/** SampleRequestPatchRequest */
export interface SampleRequestPatchRequest {
    /**
     * If Match Updated At
     * @format date-time
     */
    if_match_updated_at: string;
    changes: SampleRequestPatchChanges;
    /** Updated By */
    updated_by?: string | null;
}

/** SampleRequestReplaceLinesRequest */
export interface SampleRequestReplaceLinesRequest {
    /**
     * If Match Updated At
     * @format date-time
     */
    if_match_updated_at: string;
    /**
     * Lines
     * @minItems 1
     */
    lines: SampleRequestLine[];
    /** Updated By */
    updated_by?: string | null;
}

/** SampleRequestStatusRequest */
export interface SampleRequestStatusRequest {
    /**
     * Current Stage Key
     * @minLength 1
     * @maxLength 64
     */
    current_stage_key: string;
    /**
     * Action
     * @minLength 1
     * @maxLength 64
     */
    action: string;
    /** Operator Id */
    operator_id?: string | null;
    /** Operator Name */
    operator_name?: string | null;
    /** Comment */
    comment?: string | null;
    /** Next Stage Key */
    next_stage_key?: string | null;
    /** Next Stage Name */
    next_stage_name?: string | null;
    /** Vendor Confirmed Date */
    vendor_confirmed_date?: string | null;
    /** Completed At */
    completed_at?: string | null;
}

/** SampleRequestSummary */
export interface SampleRequestSummary {
    /** Id */
    id: number;
    /** Request No */
    request_no: string;
    /** Workflow Run Id */
    workflow_run_id: string;
    /** Current Stage Key */
    current_stage_key: string;
    /** Current Stage Name */
    current_stage_name: string;
    /** Workflow Status */
    workflow_status:
        | "draft"
        | "pm_reviewing"
        | "sales_revising"
        | "awaiting_supplier"
        | "supplier_following"
        | "shipped_to_customer"
        | "waiting_test"
        | "under_test"
        | "approved"
        | "failed"
        | "cancelled"
        | "closed";
    /** Approval Status */
    approval_status: "pending" | "approved" | "rejected";
    /** Fulfillment Status */
    fulfillment_status:
        | "not_started"
        | "supplier_pending"
        | "supplier_confirmed"
        | "in_transit"
        | "delivered_to_sales"
        | "delivered_to_customer";
    /** Testing Status */
    testing_status: "not_started" | "waiting_customer_test" | "testing" | "approved" | "failed";
    /** Customer No */
    customer_no?: string | null;
    /** Document Brand */
    document_brand?: string | null;
    /** Sales Owner Name */
    sales_owner_name: string;
    /**
     * Created At
     * @format date-time
     */
    created_at: string;
    /**
     * Updated At
     * @format date-time
     */
    updated_at: string;
}

/** SampleRequestTrackingRecord */
export interface SampleRequestTrackingRecord {
    /**
     * Tracking Number
     * @minLength 1
     * @maxLength 128
     */
    tracking_number: string;
    /** Tracking Date */
    tracking_date?: string | null;
    /**
     * Email Alert
     * @default "YES"
     */
    email_alert?: "YES" | "NO" | null;
}

/** SeriesOption */
export interface SeriesOption {
    /** Value */
    value: string;
    /** Displayname */
    displayName: string;
}

/** SeriesPagedResponse */
export interface SeriesPagedResponse {
    /** Items */
    items: SeriesOption[];
    /** Count */
    count: number;
    /** Total */
    total: number;
    /** Page Num */
    page_num: number;
    /** Page Size */
    page_size: number;
}

/**
 * ShippingCopyDocument
 * A single ``(orgId, invoiceNo)`` pair — one shipping copy invoice.
 */
export interface ShippingCopyDocument {
    /**
     * Orgid
     * 组织 ID
     * @minLength 1
     * @maxLength 32
     */
    orgId: string;
    /**
     * Invoiceno
     * PI / invoice 号码
     * @minLength 1
     * @maxLength 64
     */
    invoiceNo: string;
    /**
     * Versionno
     * 可选。调用方指定的 PG ship date 版本号；传入时按该版本渲染并写入下载日志
     */
    versionNo?: number | null;
}

/** ShippingCopyDownloadLogItem */
export interface ShippingCopyDownloadLogItem {
    /** Id */
    id: number;
    /** Batch No */
    batch_no: string;
    /** Action Type */
    action_type: "download" | "preview";
    /** Type */
    type: string;
    /** Template Code */
    template_code: string;
    /** Org Id */
    org_id: string;
    /** Pi Num */
    pi_num: string;
    /** Version No */
    version_no?: number | null;
    /** Ship Date */
    ship_date?: string | null;
    /** Copy Num */
    copy_num: number;
    /** Page Count */
    page_count: number;
    /** File Name */
    file_name?: string | null;
    /** Operator Id */
    operator_id?: string | null;
    /** Operator Name */
    operator_name?: string | null;
    /** Client Ip */
    client_ip?: string | null;
    /** User Agent */
    user_agent?: string | null;
    /**
     * Created Date
     * @format date-time
     */
    created_date: string;
}

/** ShippingCopyDownloadLogResponse */
export interface ShippingCopyDownloadLogResponse {
    /** Items */
    items: ShippingCopyDownloadLogItem[];
    /** Count */
    count: number;
}

/**
 * ShippingCopyDownloadRequest
 * Multi-invoice download request — combined into a single PDF stream.
 */
export interface ShippingCopyDownloadRequest {
    /**
     * Type
     * @minLength 1
     * @maxLength 64
     * @default "print-hk"
     */
    type?: string;
    /**
     * Documents
     * 待下载的 (orgId, invoiceNo) 列表
     * @maxItems 200
     * @minItems 1
     */
    documents: ShippingCopyDocument[];
    /** Ckstatus */
    ckStatus?: string | null;
    /** Runtime toggles. New flags should be added here with safe defaults. */
    switches?: ShippingCopySwitches;
    /** Operatorid */
    operatorId?: string | null;
    /** Operatorname */
    operatorName?: string | null;
    /** Filename */
    fileName?: string | null;
}

/** ShippingCopyHistoryResponse */
export interface ShippingCopyHistoryResponse {
    /** Items */
    items: ShippingCopyShipDateVersion[];
    /** Count */
    count: number;
}

/** ShippingCopyLatestListItem */
export interface ShippingCopyLatestListItem {
    /** Org Id */
    org_id: string;
    /** Pi Num */
    pi_num: string;
    /** Customer Id */
    customer_id?: string | null;
    /** Customer Name */
    customer_name?: string | null;
    /** Invoice Date */
    invoice_date?: string | null;
    /** Version No */
    version_no?: number | null;
    /** Old Plan Date */
    old_plan_date?: string | null;
    /** New Plan Date */
    new_plan_date?: string | null;
    /** Updated Date */
    updated_date?: string | null;
    /**
     * Download Count
     * @default 0
     */
    download_count?: number;
}

/** ShippingCopyLatestListResponse */
export interface ShippingCopyLatestListResponse {
    /** Items */
    items: ShippingCopyLatestListItem[];
    /** Count */
    count: number;
    /** Pagenum */
    pageNum: number;
    /** Pagesize */
    pageSize: number;
    /** Total */
    total: number;
    /** Totalpages */
    totalPages: number;
}

/** ShippingCopyOrganizationItem */
export interface ShippingCopyOrganizationItem {
    /** Organization Id */
    organization_id: number;
    /** Organization Code */
    organization_code?: string | null;
    /** Organization Name */
    organization_name?: string | null;
    /** Operating Unit */
    operating_unit?: string | null;
}

/** ShippingCopyOrganizationListResponse */
export interface ShippingCopyOrganizationListResponse {
    /** Items */
    items: ShippingCopyOrganizationItem[];
    /** Count */
    count: number;
}

/**
 * ShippingCopyPreviewRequest
 * Single-invoice preview request.
 */
export interface ShippingCopyPreviewRequest {
    /**
     * Type
     * 模板类型，目前固定 print-hk
     * @minLength 1
     * @maxLength 64
     * @default "print-hk"
     */
    type?: string;
    /**
     * Orgid
     * 组织 ID
     * @minLength 1
     * @maxLength 32
     */
    orgId: string;
    /**
     * Invoiceno
     * PI / invoice 号码
     * @minLength 1
     * @maxLength 64
     */
    invoiceNo: string;
    /**
     * Ckstatus
     * 打印份数规则参数：'Y' 时按 HK 规则计算多份
     */
    ckStatus?: string | null;
    /** Runtime toggles. New flags should be added here with safe defaults. */
    switches?: ShippingCopySwitches;
}

/** ShippingCopyShipDateVersion */
export interface ShippingCopyShipDateVersion {
    /** Org Id */
    org_id: string;
    /** Pi Num */
    pi_num: string;
    /** Version No */
    version_no: number;
    /** Old Plan Date */
    old_plan_date?: string | null;
    /** New Plan Date */
    new_plan_date?: string | null;
    /**
     * Updated Date
     * @format date-time
     */
    updated_date: string;
}

/**
 * ShippingCopySwitches
 * Runtime toggles. New flags should be added here with safe defaults.
 */
export interface ShippingCopySwitches {
    /**
     * Uselatestpgshipdate
     * 是否使用 PG 最新版本 ship date 覆盖 Oracle ship date
     * @default true
     */
    useLatestPgShipDate?: boolean;
    /**
     * Debuglayout
     * 是否在响应/日志中输出渲染坐标（调试用）
     * @default false
     */
    debugLayout?: boolean;
}

/** SiteLocation */
export interface SiteLocation {
    /** Site Use Id */
    site_use_id: number;
    /** Site Use Code */
    site_use_code: string;
    /** Location */
    location?: string | null;
    /**
     * Primary Flag
     * @default "N"
     */
    primary_flag?: string;
    /** Payment Term Id */
    payment_term_id?: number | null;
    /** Payment Term */
    payment_term?: string | null;
    /** Address1 */
    address1?: string | null;
    /** Address2 */
    address2?: string | null;
    /** Address3 */
    address3?: string | null;
    /** Address4 */
    address4?: string | null;
    /** City */
    city?: string | null;
    /** Province */
    province?: string | null;
    /** State */
    state?: string | null;
    /** Country */
    country?: string | null;
    /** Postal Code */
    postal_code?: string | null;
    /** Address */
    address?: string | null;
}

/** SqlRequest */
export interface SqlRequest {
    /**
     * Sql
     * SQL statement
     * @minLength 1
     */
    sql: string;
    /**
     * Params
     * 命名绑定参数，键对应 SQL 里的 :name；值只能是 string/number/boolean/null。无绑定时保持 {}。
     */
    params?: Record<string, string | number | boolean | null>;
}

/** ValidationError */
export interface ValidationError {
    /** Location */
    loc: (string | number)[];
    /** Message */
    msg: string;
    /** Error Type */
    type: string;
    /** Input */
    input?: any;
    /** Context */
    ctx?: object;
}

/** WarehouseItem */
export interface WarehouseItem {
    /**
     * Warehouse Code
     * 子库存代码 SECONDARY_INVENTORY_NAME
     */
    warehouse_code: string;
    /** Description */
    description?: string | null;
    /** Organization Id */
    organization_id: number;
    /** Organization Code */
    organization_code?: string | null;
    /** Organization Name */
    organization_name?: string | null;
    /** Status Id */
    status_id?: number | null;
    /** Asset Inventory */
    asset_inventory?: number | null;
    /** Availability Type */
    availability_type?: number | null;
    /** Locator Type */
    locator_type?: number | null;
    /** Quantity Tracked */
    quantity_tracked?: number | null;
    /** Reservable Type */
    reservable_type?: number | null;
    /** Subinventory Type */
    subinventory_type?: number | null;
    /** Disable Date */
    disable_date?: string | null;
    /**
     * Active Flag
     * Y=有效，N=已禁用
     */
    active_flag: string;
}

/** WarehouseSearchResponse */
export interface WarehouseSearchResponse {
    /** Items */
    items: WarehouseItem[];
    /** Count */
    count: number;
}

/** WclQueryConfigItem */
export interface WclQueryConfigItem {
    /** Id */
    id: number;
    /** Type */
    type: string;
    /** Oracle Sql */
    oracle_sql: string;
    /**
     * Created At
     * @format date-time
     */
    created_at: string;
    /**
     * Updated At
     * @format date-time
     */
    updated_at: string;
}

/** WclQueryConfigListResponse */
export interface WclQueryConfigListResponse {
    /** Items */
    items: WclQueryConfigItem[];
    /** Count */
    count: number;
}

/** WclQueryConfigUpsertRequest */
export interface WclQueryConfigUpsertRequest {
    /**
     * Type
     * 配置类型编码，建议用于前端业务唯一标识
     * @minLength 1
     * @maxLength 100
     */
    type: string;
    /**
     * Oracle Sql
     * Oracle 只读查询 SQL，仅允许 SELECT / WITH ... SELECT
     * @minLength 1
     */
    oracle_sql: string;
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
        this.instance = axios.create({ ...axiosConfig, baseURL: axiosConfig.baseURL || "/apis/v1/ms" });
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
 * @title WCL Middle Service
 * @version 0.1.0
 * @baseUrl /apis/v1/ms
 */
export class Openapi<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
    oracle = {
        /**
         * No description
         *
         * @tags oracle
         * @name GetOracleHealth
         * @summary Health
         * @request GET:/oracle/health
         */
        getOracleHealth: (params: RequestParams = {}) =>
            this.request<Record<string, string>, any>({
                path: `/oracle/health`,
                method: "GET",
                format: "json",
                ...params,
            }),

        /**
         * @description 取序列下一个值（会推进序列）。
         *
         * @tags oracle
         * @name PostOracleNextval
         * @summary Nextval
         * @request POST:/oracle/nextval
         */
        postOracleNextval: (
            query: {
                /**
                 * Sequence Name
                 * Oracle 序列名，如 apps.rcv_interface_groups_s
                 * @minLength 1
                 */
                sequence_name: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<OracleNextvalResponse, HTTPValidationError>({
                path: `/oracle/nextval`,
                method: "POST",
                query: query,
                format: "json",
                ...params,
            }),

        /**
         * @description Read-only: only SELECT / WITH ... SELECT are accepted.
         *
         * @tags oracle
         * @name PostOracleQuery
         * @summary Query
         * @request POST:/oracle/query
         */
        postOracleQuery: (data: SqlRequest, params: RequestParams = {}) =>
            this.request<QueryResponse, HTTPValidationError>({
                path: `/oracle/query`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags configured-queries
         * @name PostOracleConfiguredQueriesQuery
         * @summary Query Configured Oracle
         * @request POST:/oracle/configured-queries/query
         */
        postOracleConfiguredQueriesQuery: (data: ConfiguredOracleQueryRequest, params: RequestParams = {}) =>
            this.request<ConfiguredOracleQueryResponse, HTTPValidationError>({
                path: `/oracle/configured-queries/query`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags customers
         * @name GetOracleCustomers
         * @summary Search Customers
         * @request GET:/oracle/customers
         */
        getOracleCustomers: (
            query?: {
                /**
                 * Q
                 * 按客户编号或 PARTY_NAME 模糊搜索
                 */
                q?: string | null;
                /**
                 * Limit
                 * 返回条数上限
                 * @min 1
                 * @default 50
                 */
                limit?: number;
            },
            params: RequestParams = {},
        ) =>
            this.request<CustomerSearchResponse, HTTPValidationError>({
                path: `/oracle/customers`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags customers
         * @name GetOracleCustomersAccountNumber
         * @summary Get Customer
         * @request GET:/oracle/customers/{account_number}
         */
        getOracleCustomersAccountNumber: (accountNumber: string, params: RequestParams = {}) =>
            this.request<CustomerDetail, HTTPValidationError>({
                path: `/oracle/customers/${accountNumber}`,
                method: "GET",
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags price-lists
         * @name GetOraclePriceLists
         * @summary List Price Lists
         * @request GET:/oracle/price-lists
         */
        getOraclePriceLists: (
            query?: {
                /**
                 * Q
                 * 按价格表名称模糊搜索
                 */
                q?: string | null;
                /**
                 * Sub Office
                 * 办事处，如 HK/SZ/GZ
                 */
                sub_office?: string | null;
                /**
                 * Organization Id
                 * 库存组织 ID
                 */
                organization_id?: number | null;
                /**
                 * Currency Code
                 * 币种，如 CNY/USD
                 */
                currency_code?: string | null;
                /**
                 * Is Cny
                 * 是否 CNY 价目表，YES/NO
                 */
                is_cny?: string | null;
                /**
                 * Limit
                 * 返回条数上限
                 * @min 1
                 * @default 100
                 */
                limit?: number;
            },
            params: RequestParams = {},
        ) =>
            this.request<PriceListSearchResponse, HTTPValidationError>({
                path: `/oracle/price-lists`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags price-lists
         * @name GetOraclePriceListsPriceListId
         * @summary Get Price List
         * @request GET:/oracle/price-lists/{price_list_id}
         */
        getOraclePriceListsPriceListId: (priceListId: number, params: RequestParams = {}) =>
            this.request<PriceListItem, HTTPValidationError>({
                path: `/oracle/price-lists/${priceListId}`,
                method: "GET",
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags order-info
         * @name GetOracleOrderInfoCurrencies
         * @summary List Currencies
         * @request GET:/oracle/order-info/currencies
         */
        getOracleOrderInfoCurrencies: (params: RequestParams = {}) =>
            this.request<CurrencyListResponse, any>({
                path: `/oracle/order-info/currencies`,
                method: "GET",
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags order-info
         * @name GetOracleOrderInfoOrderTypes
         * @summary List Order Types
         * @request GET:/oracle/order-info/order-types
         */
        getOracleOrderInfoOrderTypes: (
            query?: {
                /**
                 * Q
                 * 按订单类型名称模糊搜索
                 */
                q?: string | null;
                /**
                 * Sub Office
                 * 办事处，如 HK/SZ/GZ
                 */
                sub_office?: string | null;
                /**
                 * Org Id
                 * OU org_id
                 */
                org_id?: number | null;
                /**
                 * Order Category Code
                 * ORDER / RETURN 等
                 */
                order_category_code?: string | null;
                /**
                 * Limit
                 * @min 1
                 * @default 100
                 */
                limit?: number;
            },
            params: RequestParams = {},
        ) =>
            this.request<OrderTypeSearchResponse, HTTPValidationError>({
                path: `/oracle/order-info/order-types`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags order-info
         * @name GetOracleOrderInfoPaymentTerms
         * @summary List Payment Terms
         * @request GET:/oracle/order-info/payment-terms
         */
        getOracleOrderInfoPaymentTerms: (
            query?: {
                /**
                 * Q
                 * 按付款条款名称模糊搜索
                 */
                q?: string | null;
                /**
                 * Limit
                 * @min 1
                 * @default 200
                 */
                limit?: number;
            },
            params: RequestParams = {},
        ) =>
            this.request<PaymentTermSearchResponse, HTTPValidationError>({
                path: `/oracle/order-info/payment-terms`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags order-info
         * @name GetOracleOrderInfoOffices
         * @summary List Offices
         * @request GET:/oracle/order-info/offices
         */
        getOracleOrderInfoOffices: (params: RequestParams = {}) =>
            this.request<OfficeListResponse, any>({
                path: `/oracle/order-info/offices`,
                method: "GET",
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags order-info
         * @name GetOracleOrderInfoBranchOffices
         * @summary List Branch Offices
         * @request GET:/oracle/order-info/branch-offices
         */
        getOracleOrderInfoBranchOffices: (
            query?: {
                /**
                 * Org Id
                 * 按 OU 过滤
                 */
                org_id?: number | null;
            },
            params: RequestParams = {},
        ) =>
            this.request<BranchOfficeListResponse, HTTPValidationError>({
                path: `/oracle/order-info/branch-offices`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags order-info
         * @name GetOracleOrderInfoCustomerPos
         * @summary Search Customer Pos
         * @request GET:/oracle/order-info/customer-pos
         */
        getOracleOrderInfoCustomerPos: (
            query: {
                /**
                 * Q
                 * 按 Customer PO 模糊搜索
                 * @minLength 1
                 */
                q: string;
                /**
                 * Limit
                 * @min 1
                 * @default 50
                 */
                limit?: number;
            },
            params: RequestParams = {},
        ) =>
            this.request<CustomerPoSearchResponse, HTTPValidationError>({
                path: `/oracle/order-info/customer-pos`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),

        /**
         * @description 按 Customer PO 从 OE 订单头回填 Order Date / Currency / Payment Terms / Salesperson / Bill To / Ship To。
         *
         * @tags order-info
         * @name GetOracleOrderInfoByCustomerPo
         * @summary Get Order Info By Customer Po
         * @request GET:/oracle/order-info/by-customer-po
         */
        getOracleOrderInfoByCustomerPo: (
            query: {
                /**
                 * Customer Po
                 * 客户订单编号 Customer PO
                 * @minLength 1
                 */
                customer_po: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<OrderInfoByCustomerPo, HTTPValidationError>({
                path: `/oracle/order-info/by-customer-po`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags order-info
         * @name GetOracleOrderInfoDefaults
         * @summary Get Order Defaults
         * @request GET:/oracle/order-info/defaults
         */
        getOracleOrderInfoDefaults: (
            query: {
                /**
                 * Account Number
                 * 客户编号（客户主数据默认值，非 Customer PO）
                 */
                account_number: string;
                /**
                 * Org Id
                 * 可选，按 OU 过滤销售员
                 */
                org_id?: number | null;
            },
            params: RequestParams = {},
        ) =>
            this.request<OrderDefaults, HTTPValidationError>({
                path: `/oracle/order-info/defaults`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),

        /**
         * @description 列出 OU org_id 与库存组织 organization_id 的映射。
         *
         * @tags org-mapping
         * @name GetOracleOrgMapping
         * @summary List Org Mappings
         * @request GET:/oracle/org-mapping
         */
        getOracleOrgMapping: (params: RequestParams = {}) =>
            this.request<OrgMappingListResponse, any>({
                path: `/oracle/org-mapping`,
                method: "GET",
                format: "json",
                ...params,
            }),

        /**
         * @description org_id 与 ORGANIZATION_ID 互转，并返回名称信息。 - `get_organization_id_by_org_id`: 传 `org_id` - `get_org_id_by_organization_id`: 传 `organization_id`
         *
         * @tags org-mapping
         * @name GetOracleOrgMappingConvert
         * @summary Convert Org Ids
         * @request GET:/oracle/org-mapping/convert
         */
        getOracleOrgMappingConvert: (
            query?: {
                /**
                 * Org Id
                 * OU org_id → 返回 organization_id
                 */
                org_id?: number | null;
                /**
                 * Organization Id
                 * 库存组织 organization_id → 返回 org_id
                 */
                organization_id?: number | null;
            },
            params: RequestParams = {},
        ) =>
            this.request<OrgMappingResult, HTTPValidationError>({
                path: `/oracle/org-mapping/convert`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),

        /**
         * @description get_organization_id_by_org_id(org_id)，含 org_name / organization_code / organization_name。
         *
         * @tags org-mapping
         * @name GetOracleOrgMappingOrganizationIdOrgId
         * @summary Get Organization Id By Org Id
         * @request GET:/oracle/org-mapping/organization-id/{org_id}
         */
        getOracleOrgMappingOrganizationIdOrgId: (orgId: number, params: RequestParams = {}) =>
            this.request<OrgMappingResult, HTTPValidationError>({
                path: `/oracle/org-mapping/organization-id/${orgId}`,
                method: "GET",
                format: "json",
                ...params,
            }),

        /**
         * @description get_org_id_by_organization_id(organization_id)，含 org_name / organization_code / organization_name。
         *
         * @tags org-mapping
         * @name GetOracleOrgMappingOrgIdOrganizationId
         * @summary Get Org Id By Organization Id
         * @request GET:/oracle/org-mapping/org-id/{organization_id}
         */
        getOracleOrgMappingOrgIdOrganizationId: (organizationId: number, params: RequestParams = {}) =>
            this.request<OrgMappingResult, HTTPValidationError>({
                path: `/oracle/org-mapping/org-id/${organizationId}`,
                method: "GET",
                format: "json",
                ...params,
            }),

        /**
         * @description 对应 CQP POST /searchFromQuoAndPos/series：一个入口，按 part_number / series 分流。
         *
         * @tags quotation
         * @name PostOracleQuotationCostHistory
         * @summary Search Cost History
         * @request POST:/oracle/quotation/cost-history
         */
        postOracleQuotationCostHistory: (data: QuotationCostHistoryRequest, params: RequestParams = {}) =>
            this.request<QuotationCostHistoryResponse, HTTPValidationError>({
                path: `/oracle/quotation/cost-history`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description 查询仓库（子库存）列表。 来源：`MTL_SECONDARY_INVENTORIES` + `ORG_ORGANIZATION_DEFINITIONS`
         *
         * @tags warehouses
         * @name GetOracleWarehouses
         * @summary List Warehouses
         * @request GET:/oracle/warehouses
         */
        getOracleWarehouses: (
            query?: {
                /**
                 * Q
                 * 按仓库代码或描述模糊搜索
                 */
                q?: string | null;
                /**
                 * Organization Id
                 * 库存组织 ID
                 */
                organization_id?: number | null;
                /**
                 * Organization Code
                 * 库存组织代码，如 WHK/WSZ
                 */
                organization_code?: string | null;
                /**
                 * Active Only
                 * 仅返回未禁用仓库（disable_date 为空或未到期）
                 * @default true
                 */
                active_only?: boolean;
                /**
                 * Limit
                 * 返回条数上限
                 * @min 1
                 * @default 500
                 */
                limit?: number;
            },
            params: RequestParams = {},
        ) =>
            this.request<WarehouseSearchResponse, HTTPValidationError>({
                path: `/oracle/warehouses`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags warehouses
         * @name GetOracleWarehousesWarehouseCode
         * @summary Get Warehouse
         * @request GET:/oracle/warehouses/{warehouse_code}
         */
        getOracleWarehousesWarehouseCode: (
            warehouseCode: string,
            query: {
                /**
                 * Organization Id
                 * 库存组织 ID（仓库代码跨组织可能重复）
                 */
                organization_id: number;
            },
            params: RequestParams = {},
        ) =>
            this.request<WarehouseItem, HTTPValidationError>({
                path: `/oracle/warehouses/${warehouseCode}`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),

        /**
         * @description 查询当天 Corporate 汇率，来源 `APPS.GL_DAILY_RATES`。
         *
         * @tags conversion-rate
         * @name GetOracleConversionRate
         * @summary List Conversion Rates
         * @request GET:/oracle/conversion-rate
         */
        getOracleConversionRate: (
            query?: {
                /**
                 * From Currency
                 * 源币种（costCurrency），如 USD；不传则不过滤
                 */
                from_currency?: string | null;
                /**
                 * To Currency
                 * 目标币种（currency），如 CNY；不传则不过滤
                 */
                to_currency?: string | null;
                /**
                 * Limit
                 * 返回条数上限
                 * @min 1
                 * @default 500
                 */
                limit?: number;
            },
            params: RequestParams = {},
        ) =>
            this.request<ConversionRateListResponse, HTTPValidationError>({
                path: `/oracle/conversion-rate`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags shipping-copy
         * @name PostOracleShippingCopyPreview
         * @summary Preview
         * @request POST:/oracle/shipping-copy/preview
         */
        postOracleShippingCopyPreview: (
            data: ShippingCopyPreviewRequest,
            query?: {
                /**
                 * Debug
                 * 1 = 返回 JSON 调试结构（含坐标）
                 * @min 0
                 * @max 1
                 * @default 0
                 */
                debug?: number;
            },
            params: RequestParams = {},
        ) =>
            this.request<any, HTTPValidationError>({
                path: `/oracle/shipping-copy/preview`,
                method: "POST",
                query: query,
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags shipping-copy
         * @name PostOracleShippingCopyDownload
         * @summary Download
         * @request POST:/oracle/shipping-copy/download
         */
        postOracleShippingCopyDownload: (data: ShippingCopyDownloadRequest, params: RequestParams = {}) =>
            this.request<any, HTTPValidationError>({
                path: `/oracle/shipping-copy/download`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags shipping-copy
         * @name GetOracleShippingCopyListLatest
         * @summary List Latest Ship Dates
         * @request GET:/oracle/shipping-copy/list-latest
         */
        getOracleShippingCopyListLatest: (
            query?: {
                /**
                 * Pagenum
                 * @min 1
                 * @default 1
                 */
                pageNum?: number;
                /**
                 * Pagesize
                 * @min 1
                 * @max 500
                 * @default 50
                 */
                pageSize?: number;
                /**
                 * Orderby
                 * 排序字段，默认 old_plan_date desc
                 * @minLength 1
                 * @maxLength 64
                 * @default "old_plan_date desc"
                 */
                orderBy?: string;
                /**
                 * Orderbyasc
                 * 升序排序字段，支持逗号分隔，如 new_plan_date,updated_date
                 */
                orderByAsc?: string | null;
                /**
                 * Orderbydesc
                 * 降序排序字段，支持逗号分隔，如 new_plan_date,updated_date
                 */
                orderByDesc?: string | null;
                /** Orgid */
                orgId?: string | null;
                /** Invoiceno */
                invoiceNo?: string | null;
                /** Customerid */
                customerId?: string | null;
                /**
                 * Invoicedatestart
                 * invoice_date 起始日期，格式 YYYY-MM-DD
                 */
                invoiceDateStart?: string | null;
                /**
                 * Invoicedateend
                 * invoice_date 截止日期，格式 YYYY-MM-DD
                 */
                invoiceDateEnd?: string | null;
            },
            params: RequestParams = {},
        ) =>
            this.request<ShippingCopyLatestListResponse, HTTPValidationError>({
                path: `/oracle/shipping-copy/list-latest`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags shipping-copy
         * @name GetOracleShippingCopyOrganizations
         * @summary List Pg Organizations
         * @request GET:/oracle/shipping-copy/organizations
         */
        getOracleShippingCopyOrganizations: (
            query?: {
                /** Organizationid */
                organizationId?: number | null;
                /** Organizationcode */
                organizationCode?: string | null;
            },
            params: RequestParams = {},
        ) =>
            this.request<ShippingCopyOrganizationListResponse, HTTPValidationError>({
                path: `/oracle/shipping-copy/organizations`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags shipping-copy
         * @name GetOracleShippingCopyHistory
         * @summary List History For Pi
         * @request GET:/oracle/shipping-copy/history
         */
        getOracleShippingCopyHistory: (
            query: {
                /**
                 * Orgid
                 * @minLength 1
                 * @maxLength 32
                 */
                orgId: string;
                /**
                 * Invoiceno
                 * @minLength 1
                 * @maxLength 64
                 */
                invoiceNo: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<ShippingCopyHistoryResponse, HTTPValidationError>({
                path: `/oracle/shipping-copy/history`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags shipping-copy
         * @name GetOracleShippingCopyDownloadLog
         * @summary List Download Log
         * @request GET:/oracle/shipping-copy/download-log
         */
        getOracleShippingCopyDownloadLog: (
            query: {
                /**
                 * Orgid
                 * @minLength 1
                 * @maxLength 32
                 */
                orgId: string;
                /**
                 * Invoiceno
                 * @minLength 1
                 * @maxLength 64
                 */
                invoiceNo: string;
                /**
                 * Limit
                 * @min 1
                 * @max 500
                 * @default 50
                 */
                limit?: number;
            },
            params: RequestParams = {},
        ) =>
            this.request<ShippingCopyDownloadLogResponse, HTTPValidationError>({
                path: `/oracle/shipping-copy/download-log`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags shipping-copy
         * @name GetOracleShippingCopyDownloadStats
         * @summary Download Stats
         * @request GET:/oracle/shipping-copy/download-stats
         */
        getOracleShippingCopyDownloadStats: (
            query?: {
                /**
                 * Actiontype
                 * @maxLength 32
                 * @default "download"
                 */
                actionType?: string;
            },
            params: RequestParams = {},
        ) =>
            this.request<Record<string, any>, HTTPValidationError>({
                path: `/oracle/shipping-copy/download-stats`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags item-master
         * @name GetOracleBrands
         * @summary List Brands
         * @request GET:/oracle/brands
         */
        getOracleBrands: (
            query?: {
                /**
                 * Q
                 * 按品牌名模糊搜索
                 */
                q?: string | null;
                /**
                 * Limit
                 * 返回条数上限
                 * @min 1
                 * @default 500
                 */
                limit?: number;
            },
            params: RequestParams = {},
        ) =>
            this.request<DropdownOptionListResponse, HTTPValidationError>({
                path: `/oracle/brands`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags item-master
         * @name GetOracleSeries
         * @summary List Series
         * @request GET:/oracle/series
         */
        getOracleSeries: (
            query?: {
                /**
                 * Q
                 * 按系列（MFG_PART_NUM）模糊搜索
                 */
                q?: string | null;
                /**
                 * Brand
                 * 按品牌（ATTRIBUTE8）过滤，可选
                 */
                brand?: string | null;
                /**
                 * Pagenum
                 * 页码，从 1 开始
                 * @min 1
                 * @default 1
                 */
                pageNum?: number;
                /**
                 * Pagesize
                 * 每页条数
                 * @min 1
                 * @default 50
                 */
                pageSize?: number;
            },
            params: RequestParams = {},
        ) =>
            this.request<SeriesPagedResponse, HTTPValidationError>({
                path: `/oracle/series`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags item-master
         * @name GetOracleWclItemNos
         * @summary List Wcl Item Nos
         * @request GET:/oracle/wcl-item-nos
         */
        getOracleWclItemNos: (
            query?: {
                /**
                 * Q
                 * 按 WCL item no 模糊搜索
                 */
                q?: string | null;
                /**
                 * Brand
                 * 按品牌过滤
                 */
                brand?: string | null;
                /**
                 * Series
                 * 按系列 MFG_PART_NUM 精确过滤，可选
                 */
                series?: string | null;
                /**
                 * Pagenum
                 * 页码，从 1 开始
                 * @min 1
                 * @default 1
                 */
                pageNum?: number;
                /**
                 * Pagesize
                 * 每页条数
                 * @min 1
                 * @default 50
                 */
                pageSize?: number;
            },
            params: RequestParams = {},
        ) =>
            this.request<ItemMasterPagedResponse, HTTPValidationError>({
                path: `/oracle/wcl-item-nos`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags item-master
         * @name GetOracleVendorItemNos
         * @summary List Vendor Item Nos
         * @request GET:/oracle/vendor-item-nos
         */
        getOracleVendorItemNos: (
            query?: {
                /**
                 * Q
                 * 按 Vendor item no 模糊搜索
                 */
                q?: string | null;
                /**
                 * Brand
                 * 按品牌过滤
                 */
                brand?: string | null;
                /**
                 * Series
                 * 按系列 MFG_PART_NUM 精确过滤，可选
                 */
                series?: string | null;
                /**
                 * Pagenum
                 * 页码，从 1 开始
                 * @min 1
                 * @default 1
                 */
                pageNum?: number;
                /**
                 * Pagesize
                 * 每页条数
                 * @min 1
                 * @default 50
                 */
                pageSize?: number;
            },
            params: RequestParams = {},
        ) =>
            this.request<ItemMasterPagedResponse, HTTPValidationError>({
                path: `/oracle/vendor-item-nos`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags item-master
         * @name GetOracleItemMasterDetail
         * @summary Get Item Master Detail
         * @request GET:/oracle/item-master-detail
         */
        getOracleItemMasterDetail: (
            query: {
                /**
                 * Inventory Item Id
                 * MTL_SYSTEM_ITEMS_B.inventory_item_id
                 */
                inventory_item_id: number;
                /**
                 * Organization Id
                 * MTL_SYSTEM_ITEMS_B.organization_id
                 */
                organization_id: number;
            },
            params: RequestParams = {},
        ) =>
            this.request<Record<string, any>, HTTPValidationError>({
                path: `/oracle/item-master-detail`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),

        /**
         * @description 手动同步：按 org_id + PO + 行 + 发运先删后插 Oracle cmz_pre_git_log_wcl。
         *
         * @tags git-match
         * @name PostOracleGitMatchPreLog
         * @summary Replace Oracle Pre Git Log
         * @request POST:/oracle/git-match/pre-log
         */
        postOracleGitMatchPreLog: (data: GitMatchOraclePreLogRequest, params: RequestParams = {}) =>
            this.request<GitMatchOraclePreLogResponse, HTTPValidationError>({
                path: `/oracle/git-match/pre-log`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
    };
    postgres = {
        /**
         * No description
         *
         * @tags postgres
         * @name GetPostgresHealth
         * @summary Health
         * @request GET:/postgres/health
         */
        getPostgresHealth: (params: RequestParams = {}) =>
            this.request<Record<string, string>, any>({
                path: `/postgres/health`,
                method: "GET",
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags postgres
         * @name PostPostgresQuery
         * @summary Query
         * @request POST:/postgres/query
         */
        postPostgresQuery: (data: SqlRequest, params: RequestParams = {}) =>
            this.request<QueryResponse, HTTPValidationError>({
                path: `/postgres/query`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags postgres
         * @name PostPostgresExecute
         * @summary Execute
         * @request POST:/postgres/execute
         */
        postPostgresExecute: (data: SqlRequest, params: RequestParams = {}) =>
            this.request<ExecuteResponse, HTTPValidationError>({
                path: `/postgres/execute`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags cfg-wcl-query
         * @name GetPostgresCfgWclQuery
         * @summary List Wcl Query Configs
         * @request GET:/postgres/cfg-wcl-query
         */
        getPostgresCfgWclQuery: (
            query?: {
                /**
                 * Keyword
                 * 按 type 模糊搜索
                 */
                keyword?: string | null;
            },
            params: RequestParams = {},
        ) =>
            this.request<WclQueryConfigListResponse, HTTPValidationError>({
                path: `/postgres/cfg-wcl-query`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags cfg-wcl-query
         * @name PostPostgresCfgWclQuery
         * @summary Create Wcl Query Config
         * @request POST:/postgres/cfg-wcl-query
         */
        postPostgresCfgWclQuery: (data: WclQueryConfigUpsertRequest, params: RequestParams = {}) =>
            this.request<WclQueryConfigItem, HTTPValidationError>({
                path: `/postgres/cfg-wcl-query`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags cfg-wcl-query
         * @name GetPostgresCfgWclQueryDropdown
         * @summary List Wcl Query Type Dropdown
         * @request GET:/postgres/cfg-wcl-query/dropdown
         */
        getPostgresCfgWclQueryDropdown: (
            query?: {
                /**
                 * Keyword
                 * 按 type 模糊搜索
                 */
                keyword?: string | null;
            },
            params: RequestParams = {},
        ) =>
            this.request<DropdownOptionListResponse, HTTPValidationError>({
                path: `/postgres/cfg-wcl-query/dropdown`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags cfg-wcl-query
         * @name GetPostgresCfgWclQueryConfigId
         * @summary Get Wcl Query Config
         * @request GET:/postgres/cfg-wcl-query/{config_id}
         */
        getPostgresCfgWclQueryConfigId: (configId: number, params: RequestParams = {}) =>
            this.request<WclQueryConfigItem, HTTPValidationError>({
                path: `/postgres/cfg-wcl-query/${configId}`,
                method: "GET",
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags cfg-wcl-query
         * @name PutPostgresCfgWclQueryConfigId
         * @summary Update Wcl Query Config
         * @request PUT:/postgres/cfg-wcl-query/{config_id}
         */
        putPostgresCfgWclQueryConfigId: (
            configId: number,
            data: WclQueryConfigUpsertRequest,
            params: RequestParams = {},
        ) =>
            this.request<WclQueryConfigItem, HTTPValidationError>({
                path: `/postgres/cfg-wcl-query/${configId}`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags cfg-wcl-query
         * @name DeletePostgresCfgWclQueryConfigId
         * @summary Delete Wcl Query Config
         * @request DELETE:/postgres/cfg-wcl-query/{config_id}
         */
        deletePostgresCfgWclQueryConfigId: (configId: number, params: RequestParams = {}) =>
            this.request<DeleteResponse, HTTPValidationError>({
                path: `/postgres/cfg-wcl-query/${configId}`,
                method: "DELETE",
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags git-match
         * @name PostPostgresGitMatchStatus
         * @summary Get Git Match Status
         * @request POST:/postgres/git-match/status
         */
        postPostgresGitMatchStatus: (data: GitMatchRequest, params: RequestParams = {}) =>
            this.request<GitMatchResponse, HTTPValidationError>({
                path: `/postgres/git-match/status`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description 插入一条 rcv_imp_headers_wcl（PG），成功后异步插入 Oracle。
         *
         * @tags rcv-imp
         * @name PostPostgresRcvImpHeaders
         * @summary Create Rcv Imp Header
         * @request POST:/postgres/rcv-imp/headers
         */
        postPostgresRcvImpHeaders: (data: RcvImpHeaderCreateRequest, params: RequestParams = {}) =>
            this.request<RcvImpHeader, HTTPValidationError>({
                path: `/postgres/rcv-imp/headers`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description 批量插入 rcv_imp_lines_wcl（PG），成功后异步插入 Oracle。
         *
         * @tags rcv-imp
         * @name PostPostgresRcvImpLines
         * @summary Create Rcv Imp Lines
         * @request POST:/postgres/rcv-imp/lines
         */
        postPostgresRcvImpLines: (data: RcvImpLinesCreateRequest, params: RequestParams = {}) =>
            this.request<RcvImpLinesCreateResponse, HTTPValidationError>({
                path: `/postgres/rcv-imp/lines`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * @description 执行收货匹配并写入接口表（PG）。 对应 Oracle `wcl_rcv_imp_pkge.insert_rcv_interface_proc`。 group_id / 接口主键从 Oracle 序列取号；PG 成功后异步回写 Oracle。
         *
         * @tags rcv-imp
         * @name PostPostgresRcvImpHeadersRcvImpHeaderIdProcess
         * @summary Process Rcv Imp
         * @request POST:/postgres/rcv-imp/headers/{rcv_imp_header_id}/process
         */
        postPostgresRcvImpHeadersRcvImpHeaderIdProcess: (rcvImpHeaderId: number, params: RequestParams = {}) =>
            this.request<RcvImpProcessResponse, HTTPValidationError>({
                path: `/postgres/rcv-imp/headers/${rcvImpHeaderId}/process`,
                method: "POST",
                format: "json",
                ...params,
            }),
    };
    wfl = {
        /**
         * No description
         *
         * @tags customer-visits
         * @name PostWflCustomerVisits
         * @summary Create Customer Visit
         * @request POST:/wfl/customer-visits
         */
        postWflCustomerVisits: (data: CustomerVisitCreateRequest, params: RequestParams = {}) =>
            this.request<CustomerVisitDetail, HTTPValidationError>({
                path: `/wfl/customer-visits`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags customer-visits
         * @name GetWflCustomerVisits
         * @summary List Customer Visits
         * @request GET:/wfl/customer-visits
         */
        getWflCustomerVisits: (
            query?: {
                /**
                 * Activity Id
                 * 按业务单号查询
                 */
                activity_id?: string | null;
                /**
                 * Workflow Run Id
                 * 按 workflow 实例查询
                 */
                workflow_run_id?: string | null;
                /**
                 * Workflow Status
                 * 按 workflow 状态筛选
                 */
                workflow_status?: string | null;
                /**
                 * Sample Status
                 * 按样品状态筛选
                 */
                sample_status?: string | null;
                /**
                 * Customer Number
                 * 按客户编号筛选
                 */
                customer_number?: string | null;
                /**
                 * Customer Chinese Name
                 * 按客户中文名模糊查询
                 */
                customer_chinese_name?: string | null;
                /**
                 * Created By
                 * 按访客人名称筛选
                 */
                created_by?: string | null;
                /**
                 * Activity Date From
                 * 活动日期开始
                 */
                activity_date_from?: string | null;
                /**
                 * Activity Date To
                 * 活动日期结束
                 */
                activity_date_to?: string | null;
                /**
                 * Created From
                 * 创建日期开始
                 */
                created_from?: string | null;
                /**
                 * Created To
                 * 创建日期结束
                 */
                created_to?: string | null;
                /**
                 * Page Num
                 * 页码，从 0 开始
                 * @min 0
                 * @default 0
                 */
                page_num?: number;
                /**
                 * Page Size
                 * 每页条数
                 * @min 1
                 * @max 200
                 * @default 20
                 */
                page_size?: number;
            },
            params: RequestParams = {},
        ) =>
            this.request<CustomerVisitListResponse, HTTPValidationError>({
                path: `/wfl/customer-visits`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags customer-visits
         * @name GetWflCustomerVisitsRequestId
         * @summary Get Customer Visit
         * @request GET:/wfl/customer-visits/{request_id}
         */
        getWflCustomerVisitsRequestId: (requestId: number, params: RequestParams = {}) =>
            this.request<CustomerVisitDetail, HTTPValidationError>({
                path: `/wfl/customer-visits/${requestId}`,
                method: "GET",
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags customer-visits
         * @name PatchWflCustomerVisitsRequestId
         * @summary Patch Customer Visit
         * @request PATCH:/wfl/customer-visits/{request_id}
         */
        patchWflCustomerVisitsRequestId: (
            requestId: number,
            data: CustomerVisitPatchRequest,
            params: RequestParams = {},
        ) =>
            this.request<CustomerVisitDetail, HTTPValidationError>({
                path: `/wfl/customer-visits/${requestId}`,
                method: "PATCH",
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags customer-visits
         * @name PostWflCustomerVisitsRequestIdStatus
         * @summary Advance Customer Visit Status
         * @request POST:/wfl/customer-visits/{request_id}/status
         */
        postWflCustomerVisitsRequestIdStatus: (
            requestId: number,
            data: CustomerVisitStatusRequest,
            params: RequestParams = {},
        ) =>
            this.request<CustomerVisitDetail, HTTPValidationError>({
                path: `/wfl/customer-visits/${requestId}/status`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags customer-visits
         * @name PostWflCustomerVisitsRequestIdSampleStatus
         * @summary Sync Customer Visit Sample Status
         * @request POST:/wfl/customer-visits/{request_id}/sample-status
         */
        postWflCustomerVisitsRequestIdSampleStatus: (
            requestId: number,
            data: CustomerVisitSampleStatusRequest,
            params: RequestParams = {},
        ) =>
            this.request<CustomerVisitDetail, HTTPValidationError>({
                path: `/wfl/customer-visits/${requestId}/sample-status`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags sample-requests
         * @name PostWflSampleRequests
         * @summary Create Sample Request
         * @request POST:/wfl/sample-requests
         */
        postWflSampleRequests: (data: SampleRequestCreateRequest, params: RequestParams = {}) =>
            this.request<SampleRequestDetail, HTTPValidationError>({
                path: `/wfl/sample-requests`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags sample-requests
         * @name GetWflSampleRequests
         * @summary List Sample Requests
         * @request GET:/wfl/sample-requests
         */
        getWflSampleRequests: (
            query?: {
                /**
                 * Request No
                 * 按业务单号查询
                 */
                request_no?: string | null;
                /**
                 * Workflow Run Id
                 * 按 workflow 实例查询
                 */
                workflow_run_id?: string | null;
                /**
                 * Workflow Status
                 * 按主状态筛选
                 */
                workflow_status?: string | null;
                /**
                 * Approval Status
                 * 按审批状态筛选
                 */
                approval_status?: string | null;
                /**
                 * Fulfillment Status
                 * 按履约状态筛选
                 */
                fulfillment_status?: string | null;
                /**
                 * Testing Status
                 * 按测试状态筛选
                 */
                testing_status?: string | null;
                /**
                 * Customer No
                 * 按客户编号筛选
                 */
                customer_no?: string | null;
                /**
                 * Document Brand
                 * 按整单品牌筛选
                 */
                document_brand?: string | null;
                /**
                 * Sales Owner Name
                 * 按销售姓名模糊筛选
                 */
                sales_owner_name?: string | null;
                /**
                 * Created From
                 * 创建时间起始日期
                 */
                created_from?: string | null;
                /**
                 * Created To
                 * 创建时间结束日期
                 */
                created_to?: string | null;
                /**
                 * Page Num
                 * 页码，从 0 开始
                 * @min 0
                 * @default 0
                 */
                page_num?: number;
                /**
                 * Page Size
                 * 每页条数
                 * @min 1
                 * @max 200
                 * @default 20
                 */
                page_size?: number;
            },
            params: RequestParams = {},
        ) =>
            this.request<SampleRequestListResponse, HTTPValidationError>({
                path: `/wfl/sample-requests`,
                method: "GET",
                query: query,
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags sample-requests
         * @name GetWflSampleRequestsRequestId
         * @summary Get Sample Request
         * @request GET:/wfl/sample-requests/{request_id}
         */
        getWflSampleRequestsRequestId: (requestId: number, params: RequestParams = {}) =>
            this.request<SampleRequestDetail, HTTPValidationError>({
                path: `/wfl/sample-requests/${requestId}`,
                method: "GET",
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags sample-requests
         * @name PatchWflSampleRequestsRequestId
         * @summary Patch Sample Request
         * @request PATCH:/wfl/sample-requests/{request_id}
         */
        patchWflSampleRequestsRequestId: (
            requestId: number,
            data: SampleRequestPatchRequest,
            params: RequestParams = {},
        ) =>
            this.request<SampleRequestDetail, HTTPValidationError>({
                path: `/wfl/sample-requests/${requestId}`,
                method: "PATCH",
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags sample-requests
         * @name PostWflSampleRequestsRequestIdStatus
         * @summary Advance Sample Request Status
         * @request POST:/wfl/sample-requests/{request_id}/status
         */
        postWflSampleRequestsRequestIdStatus: (
            requestId: number,
            data: SampleRequestStatusRequest,
            params: RequestParams = {},
        ) =>
            this.request<SampleRequestDetail, HTTPValidationError>({
                path: `/wfl/sample-requests/${requestId}/status`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags sample-requests
         * @name PutWflSampleRequestsRequestIdLines
         * @summary Replace Sample Request Lines
         * @request PUT:/wfl/sample-requests/{request_id}/lines
         */
        putWflSampleRequestsRequestIdLines: (
            requestId: number,
            data: SampleRequestReplaceLinesRequest,
            params: RequestParams = {},
        ) =>
            this.request<SampleRequestDetail, HTTPValidationError>({
                path: `/wfl/sample-requests/${requestId}/lines`,
                method: "PUT",
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),

        /**
         * No description
         *
         * @tags sample-requests
         * @name PostWflSampleRequestsRequestIdLinesLineNoTracking
         * @summary Add Sample Request Tracking
         * @request POST:/wfl/sample-requests/{request_id}/lines/{line_no}/tracking
         */
        postWflSampleRequestsRequestIdLinesLineNoTracking: (
            requestId: number,
            lineNo: number,
            data: SampleRequestAddTrackingRequest,
            params: RequestParams = {},
        ) =>
            this.request<SampleRequestDetail, HTTPValidationError>({
                path: `/wfl/sample-requests/${requestId}/lines/${lineNo}/tracking`,
                method: "POST",
                body: data,
                type: ContentType.Json,
                format: "json",
                ...params,
            }),
    };
    health = {
        /**
         * No description
         *
         * @name GetHealth
         * @summary Health
         * @request GET:/health
         */
        getHealth: (params: RequestParams = {}) =>
            this.request<HealthResponse, any>({
                path: `/health`,
                method: "GET",
                format: "json",
                ...params,
            }),
    };
}
