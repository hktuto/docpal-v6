<template>
  <el-dropdown trigger="click" placement="top" @command="handleMethodSelect" @click.stop>
    <div class="footer-count">
      <template v-if="currentMethodLabel !== '-' && column.countMethod !== 'none' && column.countMethod">
        <span class="method-name">{{ currentMethodLabel }}</span>
        <span class="count-value">{{ displayValue }}</span>
        <el-icon class="dropdown-icon">
          <CaretBottom />
        </el-icon>
      </template>
      <template v-else>
        <span class="count-value--none">
          <span class="method-name">{{ t('mdTable.countMethod.statistics') }}</span>
          <el-icon class="dropdown-icon">
            <CaretBottom />
          </el-icon>
        </span>
      </template>
    </div>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="method in availableMethods"
          :key="method.value"
          :command="method.value"
          :class="{ 'is-active': column.countMethod === method.value }"
        >
          <span class="method-label">{{ method.label }}</span>
          <el-icon v-if="column.countMethod === method.value" class="check-icon">
            <Check />
          </el-icon>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { ElDropdown, ElDropdownMenu, ElDropdownItem, ElIcon } from 'element-plus'
import { Check, CaretBottom } from '@element-plus/icons-vue'
import type { ColumnConfig } from '../../composables/useColumns'
import { ColumnFieldType } from '../../composables/useColumns'
import { useMDTableReJect } from '../../composables/useMDTable'
import { calculateCount, type CountMethod, flattenAggregatedData } from '../../utils/tableCount'

const { t } = useI18n()

interface Props {
  column: ColumnConfig
  row?: any
}

const props = defineProps<Props>()

// 统计方法配置
interface MethodOption {
  value: CountMethod
  label: string
  numericOnly?: boolean // 仅数字类型可用
}

// 所有统计方法
const allMethods = computed<MethodOption[]>(() => [
  { value: 'none', label: t('mdTable.countMethod.none') },
  { value: 'sum', label: t('mdTable.countMethod.sum'), numericOnly: true },
  { value: 'max', label: t('mdTable.countMethod.max'), numericOnly: true },
  { value: 'min', label: t('mdTable.countMethod.min'), numericOnly: true },
  { value: 'avg', label: t('mdTable.countMethod.avg'), numericOnly: true },
  { value: 'count', label: t('mdTable.countMethod.count') },
  { value: 'empty', label: t('mdTable.countMethod.empty') },
  { value: 'filled', label: t('mdTable.countMethod.filled') },
  { value: 'unique', label: t('mdTable.countMethod.unique') },
  { value: 'emptyPercent', label: t('mdTable.countMethod.emptyPercent') },
  { value: 'filledPercent', label: t('mdTable.countMethod.filledPercent') }
])
const mdTable = useMDTableReJect()
const gridRef = mdTable.gridRef
// Inject gridRef 来获取表格数据
// 判断是否为数字类型
const isNumericType = computed(() => {
  const type = props.column.type
  return (
    type === 'number' ||
    type === 'integer' ||
    type === ColumnFieldType.Number ||
    type === ColumnFieldType.Currency ||
    type === ColumnFieldType.Percent ||
    type === ColumnFieldType.Rating ||
    type === ColumnFieldType.AutoNumber
  )
})

// 根据列类型获取可用的统计方法
const availableMethods = computed(() => {
  if (isNumericType.value) {
    return allMethods.value
  } else {
    return allMethods.value.filter((method) => !method.numericOnly)
  }
})

// 获取表格数据列表
const getTableData = (): any[] => {
  if (gridRef?.value) {
    try {
      const result = (gridRef.value as any).getTableData()
      return result?.fullData || []
    } catch (error) {
      console.error(t('mdTable.countMethod.getDataError'), error)
      return []
    }
  }
  return []
}

// 当前选中的统计方法标签
const currentMethodLabel = computed(() => {
  const method = props.column.countMethod || 'none'
  const methodOption = allMethods.value.find((m) => m.value === method)
  return methodOption?.label || '-'
})

// 显示值
const displayValue = computed(() => {
  const method = props.column.countMethod || 'none'
  const tableData = getTableData()
  const field = props.column.field || ''
  const sumData = tableData.filter((item: any) => !item.isAggregate)
  return calculateCount(method as CountMethod, field, sumData)
})

// 处理统计方法选择
const handleMethodSelect = (method: CountMethod) => {
  // 更新 column.countMethod
  if (props.column) {
    props.column.countMethod = method
  }
}
</script>

<style scoped lang="scss">
.footer-count {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
  min-width: 0;
  
  .method-name {
    font-size: 12px;
    color: #909399;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex-shrink: 1;
    min-width: 0;
  }

  .count-value {
    font-weight: 500;
    color: #606266;
    flex-shrink: 0;
  }
  
  .count-value--none {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;
    font-weight: 500;
    color: #606266;
    width: 100%;
    opacity: 0;
    min-width: 0;
    
    .method-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex-shrink: 1;
      min-width: 0;
    }
    
    .dropdown-icon {
      flex-shrink: 0;
    }
  }

  .dropdown-icon {
    font-size: 12px;
    color: #909399;
    transition: transform 0.2s;
    flex-shrink: 0;
  }
}
.el-dropdown {
  width: 100%;
  .footer-count {
    width: 100%;
    text-align: right;
    &:hover {
      .count-value--none {
        opacity: 1;
      }
    }
  }
}
:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;

  &.is-active {
    background-color: #ecf5ff;
    color: #409eff;

    .method-label {
      font-weight: 500;
    }
  }

  .method-label {
    flex: 1;
    font-size: 14px;
  }

  .check-icon {
    color: #409eff;
    font-size: 16px;
    margin-left: 8px;
  }
}
</style>
