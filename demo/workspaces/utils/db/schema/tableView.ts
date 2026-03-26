export type ViewType = 'table' | 'card' | 'kanban' | 'gantt' | 'calendar' | 'gallery';
type Operator = 'is' | 'isNot' | 'contains' | 'doesNotContain' | 'isEmpty' | 'isNotEmpty';
// 主视图接口
export interface ViewConfig {
  id: string;
  name: string;
  type: ViewType;
  columns: ViewColumn[];
  sortInfo?: SortInfo[];
  groupInfo?: GroupInfo[];
  filterInfo?: FilterInfo;
  rowHeightLevel: number; // 行高
  displayColumns?: any[];
  style?: ViewStyle;
}

// 列定义
export interface ViewColumn {
  width?: number;
  id: string;
  hidden?: boolean;
  fixed?: 'left' | 'right'
}

// 排序规则
export interface SortInfo {
  desc: boolean;
  fieldId: string;
}


// 分组信息
export interface GroupInfo {
  desc: boolean;
  fieldId: string;
}

// 过滤条件
export interface FilterCondition {
  value?: string[];
  fieldId: string;
  operator: Operator;
  fieldType: any;
  conditionId: string;
}

// 过滤信息
export interface FilterInfo {
  conditions: FilterCondition[];
  conjunction: 'and' | 'or';
}

export interface ViewStyle {
  cardCount: number;
  /** 作为封面的文档列 field_name */
  coverFieldId: string;
  isColNameVisible: boolean;
  isCoverFit: boolean;
  /** 是否显示封面区域（可与 coverFieldId 独立） */
  showCover?: boolean;
  isBordered?: boolean;
  isCompact?: boolean;
  cardShadow?: 'none' | 'small' | 'hover';
}
