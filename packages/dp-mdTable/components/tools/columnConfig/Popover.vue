<template>
  <el-popover ref="popoverRef" :width="320" trigger="click" popper-class="column-visibility-popover">
    <template #reference>
      <el-button :disabled="disabled" type="default">
        <el-icon><View /></el-icon>
        隐藏列
      </el-button>
    </template>
    <template #default>
      <ToolsColumnConfig />
    </template>
  </el-popover>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { View } from '@element-plus/icons-vue'

interface Props {
  disabled?: boolean
}
defineProps<Props>()
const popoverRef = ref()

defineExpose({
  popoverRef
})
</script>
