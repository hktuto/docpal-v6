<template>
  <el-dropdown id="Workflow__PersonalWorkflow"
               v-if="checkLicenseFeatures('GENERATE_TEMPLATE') || checkLicenseFeatures('BULK_IMPORT')" trigger="click"
               @command="handleCommand">
    <el-button type="primary" class="el-icon--left">
      {{ $t('workflow_personalWorkflow') }}
      <el-icon class="el-icon--right">
        <arrow-down/>
      </el-icon>
    </el-button>
    <template #dropdown>
      <el-dropdown-menu>
        <template v-for="item in state.menuList">
          <el-dropdown-item v-if="item.show" :key="item.id" :command="item.id">
            {{ $t(item.label) }}
          </el-dropdown-item>
        </template>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
  <WorkflowPopoverTemplate ref="TemplateDialogRef"/>
  <WorkflowPopoverBulkImport ref="BulkImportDialogRef"/>
</template>

<script lang="ts" setup>
import {ArrowDown} from "@element-plus/icons-vue";

const emits = defineEmits([]);
const BulkImportDialogRef = ref()
const TemplateDialogRef = ref()
const state = reactive({
  menuList: [
    {id: 'template', label: 'workflow_GenerateDocument', show: checkLicenseFeatures('GENERATE_TEMPLATE')},
    // { id: 'bulkImport', label: 'workflow_bulkImport', show: checkLicenseFeatures('BULK_IMPORT') } // hide request by crystal
  ]
})

function handleCommand(command) {
  switch (command) {
    case 'template':
      TemplateDialogRef.value.handleOpen()
      break;
    case 'bulkImport':
      BulkImportDialogRef.value.handleOpen()
      break;
    default:
      break;
  }
}
</script>
<style lang="scss" scoped>
.mg-r {
  margin-right: var(--app-space-xs);
}
</style>
