
type Operator = 'is' | 'isNot' | 'contains' | 'doesNotContain' | 'isEmpty' | 'isNotEmpty';
// 主视图接口
export interface ViewConfig {
  id: string;
  name: string;
  type: number;
  columns: ViewColumn[];
  sortInfo: SortInfo;
  groupInfo: GroupInfo[];
  filterInfo: FilterInfo;
  rowHeightLevel: number; // 行高
  displayColumns?: any[];
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

