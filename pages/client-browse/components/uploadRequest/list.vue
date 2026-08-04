<script lang="ts" setup>
import { CircleCheckFilled, WarningFilled } from '@element-plus/icons-vue'

const props = defineProps<{
  tableData: any[]
  fileTypes: any[]
  selectedRow: any
  checkAll: boolean
  applyDocumentType: string
}>()

const emit = defineEmits<{
  'update:checkAll': [value: boolean]
  'update:applyDocumentType': [value: string]
  apply: []
  nodeClick: [data: any]
  checkChange: []
  checkAll: [value: boolean]
}>()

const treeRef = ref()

defineExpose({
  getCheckedNodes: () => treeRef.value?.getCheckedNodes(),
  setCheckedKeys: (keys: string[]) => treeRef.value?.setCheckedKeys(keys)
})
</script>

<template>
  <div class="panel-left">
    <div class="left-top">
      <div class="flex-x-between">
        <el-select
          :model-value="props.applyDocumentType"
          filterable
          default-first-option
          @update:model-value="emit('update:applyDocumentType', $event)"
        >
          <el-option v-for="item in props.fileTypes" :key="item.name" :value="item.name" :label="item.name" />
        </el-select>
        <el-button class="el-icon--right" @click="emit('apply')">
          {{ $t('dpButtom_apply') }}
        </el-button>
      </div>
    </div>
    <div class="left-bottom">
      <el-checkbox
        :model-value="props.checkAll"
        @update:model-value="emit('update:checkAll', $event as boolean)"
        @change="emit('checkAll', $event as boolean)"
      >
        {{ $t('button.selectAll') }}
      </el-checkbox>
      <el-tree
        ref="treeRef"
        :data="props.tableData"
        show-checkbox
        node-key="id"
        default-expand-all
        highlight-current
        :current-node-key="props.selectedRow?.id"
        :expand-on-click-node="false"
        @node-click="emit('nodeClick', $event)"
        @check-change="emit('checkChange')"
      >
        <template #default="{ data }">
          <div class="flex-x-between tree-item">
            <div class="tree-item--title ellipsis" :title="data.name">
              {{ data.name }}
            </div>
            <div class="tree-item--right">
              <div class="tree-item--documentType ellipsis" :title="data.documentType">
                {{ data.documentType }}
              </div>
              <el-icon v-if="data.approved" color="#529b2e">
                <CircleCheckFilled />
              </el-icon>
              <el-icon v-else color="#c45656">
                <WarningFilled />
              </el-icon>
            </div>
          </div>
        </template>
      </el-tree>
    </div>
  </div>
</template>

<style scoped lang="scss">
.panel-left {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-rows: min-content 1fr;
  gap: var(--app-space-xs);
}

.left-bottom {
  min-height: 0;
  overflow: auto;
}

.tree-item {
  width: 100%;

  &--title {
    min-width: 0;
    display: block;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &--right {
    display: flex;
    align-items: center;
    gap: var(--app-input-padding);
  }

  &--documentType {
    min-width: 0;
    display: block;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
