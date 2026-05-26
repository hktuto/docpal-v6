<script setup lang="ts">
import { ref } from 'vue'
import { View } from '@element-plus/icons-vue'

const { t } = useI18n()

interface Props {
  disabled?: boolean
}
defineProps<Props>()
const popoverRef = ref()

defineExpose({
  popoverRef
})
</script>

<template>
  <el-popover ref="popoverRef" :width="320" trigger="click" popper-class="column-visibility-popover">
    <template #reference>
      <el-button :icon="View" :disabled="disabled" type="default" :aria-label="t('mdTable.columnConfig.hideColumns')">
        {{ t('mdTable.columnConfig.hideColumns') }}
      </el-button>
    </template>
    <template #default>
      <ToolsColumnConfig />
    </template>
  </el-popover>
</template>
