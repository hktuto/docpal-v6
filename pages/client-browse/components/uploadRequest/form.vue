<script lang="ts" setup>
import { Download } from '@element-plus/icons-vue'

const props = defineProps<{
  selectedRow: any
  fileTypes: any[]
  submitLoading: boolean
  downloadLoading: boolean
}>()

const emit = defineEmits<{
  download: []
  submit: []
  docTypeChange: [row: any]
  formChange: [data: any]
  handleApply: [formModel: any]
}>()

const { t } = useI18n()
const formRef = ref()
const MetaFormRef = ref()

defineExpose({
  validate: () => formRef.value?.validate(),
  init: (...args: any[]) => MetaFormRef.value?.init(...args),
  setData: (data: any) => MetaFormRef.value?.setData(data)
})
</script>

<template>
  <div class="panel-middle">
    <div class="middle-top flex-x-end">
      <el-button type="info" :icon="Download" :loading="props.downloadLoading" @click="emit('download')">
        {{ $t('download') }}
      </el-button>
      <el-button type="primary" :loading="props.submitLoading" @click="emit('submit')">
        {{ $t('submit') }}
      </el-button>
    </div>
    <div class="middle-bottom">
      <el-form ref="formRef" :model="props.selectedRow" label-position="top">
        <el-form-item
          :label="t('dpDocument_fileName')"
          prop="name"
          :rules="[{ required: true, message: t('dpDocument_fileName') + t('render.hint.fieldRequired') }]"
        >
          <el-input v-model="props.selectedRow.name" />
        </el-form-item>
        <el-form-item :label="t('dpTool_approve')" prop="approved">
          <el-switch v-model="props.selectedRow.approved" />
        </el-form-item>
        <el-form-item :label="t('dpDocument_fileType')" prop="documentType">
          <el-select
            v-model="props.selectedRow.documentType"
            filterable
            default-first-option
            @change="emit('docTypeChange', props.selectedRow)"
          >
            <el-option v-for="item in props.fileTypes" :key="item.name" :value="item.name" :label="item.name" />
          </el-select>
        </el-form-item>
      </el-form>
      <MetaRenderForm2
        ref="MetaFormRef"
        mode="fileRequest"
        @formChange="emit('formChange', $event)"
        @handleApply="emit('handleApply', $event)"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.panel-middle {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-rows: min-content 1fr;
  gap: var(--app-space-xs);
}

.middle-top {
  padding: 0 12px;
}

.middle-bottom {
  min-height: 0;
  overflow: auto;
}

.el-form {
  padding: 0 12px;
}

:deep(.el-row) {
  margin: unset !important;
}
</style>
