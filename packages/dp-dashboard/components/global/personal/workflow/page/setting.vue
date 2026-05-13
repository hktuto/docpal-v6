<template>
  <el-dialog v-model="state.visible" :title="$t('dashboard.setting')" class="scroll-dialog" append-to-body :close-on-click-modal="false">
    <el-form label-position="top">
      <el-form-item label="Title">
        <el-input v-model="state.setting.title" clearable />
      </el-form-item>
      <el-form-item label="Which tab to show(Single Table Mode)">
        <el-select v-model="state.setting.selectedTable" clearable>
          <el-option v-for="item in workflowPageList" :key="item.value" :label="t(item.label)" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="Switch to tab page mode">
        <el-switch v-model="state.setting.isTabView" />
      </el-form-item>
      <el-form-item label="Workflow Name">
        <el-select v-model="state.setting.workflowIdList" clearable multiple>
          <el-option v-for="item in workflowList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button id="WorkPanel__DetailTask__Submit" type="primary" :loading="state.loading" @click="handleSubmit">
        {{ $t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
const { workflowList } = defineProps<{
  workflowList: any[]
}>()
const emits = defineEmits(['refresh'])
const { t } = useI18n()
const workflowPageList = ref([
  { value: 'myTask', label: 'workflow_myTask' },
  { value: 'activeTask', label: 'workflow_activeTask' },
  { value: 'allTask', label: 'workflow_allTask' }
])
const state = reactive({
  visible: false,
  setting: {}
})

function handleOpen(setting: any) {
  state.visible = true
  state.setting = deepCopy(setting)
}

function handleSubmit() {
  emits('refresh', state.setting)
  state.visible = false
}

defineExpose({ handleOpen })
</script>

<style lang="scss" scoped></style>
