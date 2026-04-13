interface GroupNodeWithValues<T extends Record<string, any> = any> {
  group: string;
  groupKey: string;
  groupValue: any;
  depth: number;
  children: Array<GroupNodeWithValues<T> | T>;
  [key: string]: any; // 允许动态添加其他属性
}
// 另一个渲染方案，用于渲染树形结构
export function createGroupTree<T extends Record<string, any>>(
  items: T[],
  groups: any[]
): GroupNodeWithValues<T>[] {
  if (!groups.length || !items.length) {
    return [];
  }

  function buildTree(
    items: T[],
    level: number,
    parentGroups: Record<string, any> = {}
  ): Array<GroupNodeWithValues<T> | T> {
    if (level >= groups.length) {
      return items;
    }

    const currentGroup = groups[level];
    const grouped = new Map<any, T[]>();

    // 分组
    items.forEach(item => {
      const keyValue = item[currentGroup.key];
      if (!grouped.has(keyValue)) {
        grouped.set(keyValue, []);
      }
      grouped.get(keyValue)!.push(item);
    });

    // 排序
    const sortedValues = Array.from(grouped.keys()).sort((a, b) => {
      const order = currentGroup.asc ? 1 : -1;
      if (typeof a === 'number' && typeof b === 'number') {
        return order * (a - b);
      }
      return order * String(a).localeCompare(String(b));
    });

    const result: GroupNodeWithValues<T>[] = [];

    sortedValues.forEach(value => {
      const groupItems = grouped.get(value)!;
      
      // 创建当前节点的分组信息对象
      const currentGroupInfo = {
        ...parentGroups,
        [currentGroup.key]: value
      };

      const children = buildTree(groupItems, level + 1, currentGroupInfo);

      // 构建节点
      const node: GroupNodeWithValues<T> = {
        group: `${currentGroup.key}: ${value}`,
        groupKey: currentGroup.key,
        groupValue: value,
        depth: level,
        children: children,
        ...currentGroupInfo // 展开所有父级分组信息
      };

      result.push(node);
    });

    return result;
  }

  return buildTree(items, 0) as GroupNodeWithValues<T>[];
}
