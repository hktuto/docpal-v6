<template>
  <el-dialog v-model="dialogVisible" class="scroll-dialog outputDialog" :title="isEdit ? $t('externalStorage.outputEdit') : $t('externalStorage.outputNew')">
    <el-form label-position="top" :model="form" :rules="rules" ref="formRef">
      <el-form-item :label="$t('docType_documentType')" prop="document_type">
        <el-select class="documentType" v-model="form.document_type" filterable clearable>
          <el-option v-for="item in documentTypeOpts" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('externalStorage.outputFormat')" prop="output_format">
        <el-select class="outputFormat" v-model="form.output_format" filterable clearable @change="handleOutputFormatChange">
          <el-option v-for="item in outputFormatOpts" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <template v-if="form.output_format === 'Text'">
        <el-form-item :label="$t('externalStorage.keepLineBreaks')" prop="keep_line_breaks" required>
          <el-select class="keepLineBreaks" v-model="form.keep_line_breaks" filterable clearable>
            <el-option label="Yes" value="Yes" />
            <el-option label="No" value="No" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('externalStorage.insertPageBreakChar')" prop="insert_page_break_char" required>
          <el-select class="insertPageBreakChar" v-model="form.insert_page_break_char" filterable clearable>
            <el-option label="Yes" value="Yes" />
            <el-option label="No" value="No" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('externalStorage.useBlankLineAsParaSep')" prop="use_blank_line_as_para_sep" required>
          <el-select class="useBlankLineAsParaSep" v-model="form.use_blank_line_as_para_sep" filterable clearable>
            <el-option label="Yes" value="Yes" />
            <el-option label="No" value="No" />
          </el-select>
        </el-form-item>
      </template>
      <template v-if="['Image'].includes(form.output_format)">
        <el-form-item :label="$t('DAM_fileType')" prop="file_type" required>
          <el-select class="fileType" v-model="form.file_type" filterable clearable>
            <el-option v-for="item in fileTypeOpts" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('externalStorage.resolution')" prop="resolution" required>
          <el-select class="resolution" v-model="form.resolution" filterable clearable>
            <el-option v-for="item in resolutionOpts" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('externalStorage.quality')" prop="quality" required>
          <el-input class="quality" v-model="form.quality" type="number" min="1" max="100" />
        </el-form-item>
      </template>
      <el-form-item v-if="['PDF', 'Image'].includes(form.output_format)" :label="$t('externalStorage.color')" prop="color">
        <el-select class="color" v-model="form.color" filterable clearable>
          <el-option v-for="item in colorOpts" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>

      <el-form-item :label="$t('externalStorage.destination')" prop="destination">
        <el-select class="destination" v-model="form.destination" filterable clearable>
          <el-option v-for="item in destinationOpts" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>

      <el-form-item v-if="form.destination === 'external'" :label="$t('externalStorage.externalStorageProfile')" prop="share_drive_profile">
        <el-select class="shareDriveProfile" v-model="form.share_drive_profile" filterable clearable>
          <el-option v-for="item in externalStorageProfileOpts" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <template v-if="form.destination !== 'workflow'">
        <el-form-item :label="$t('externalStorage.path')" prop="path">
          <el-input class="path" v-model="form.path" ref="pathInput" />
          <el-dropdown @command="(value: string) => handleVariableSelect(value, 'path')">
            <el-button type="primary" class="el-icon--right pathAddVariable"> {{ $t('docTemplate.variable.addVariable') }} </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="item in pathVOpts" :key="item.value" :command="item.value">{{ item.label }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-form-item>
        <el-form-item :label="$t('externalStorage.fileName')" prop="file_name">
          <el-input class="fileName" v-model="form.file_name" ref="fileNameInput" />
          <el-dropdown @command="(value: string) => handleVariableSelect(value, 'file_name')">
            <el-button type="primary" class="el-icon--right fileNameAddVariable"> {{ $t('docTemplate.variable.addVariable') }} </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="item in fileNameVOpts" :key="item.value" :command="item.value">{{ item.label }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-form-item>
        <el-alert title="An excessively long 'Path' may prevent normal access!" type="warning" show-icon />
      </template>
      <template v-else>
        <el-form-item :label="$t('workflow_workflow')" prop="workflow">
          <el-select class="workflow" v-model="form.workflow" filterable clearable>
            <el-option v-for="item in workflowOpts" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-divider />
        <WorkflowVariableMapping v-if="form.workflow" ref="WorkflowVariableMappingRef" :setting="setting" :workflow="form.workflow" :varList="workflowVOpts" />
      </template>
      <el-form-item v-if="form.destination === 'external'" :label="$t('externalStorage.duplicateNameStrategy')" prop="duplicate_name_strategy" required>
        <el-select class="duplicateNameStrategy" v-model="form.duplicate_name_strategy" filterable clearable>
          <el-option v-for="item in duplicateNameStrategyOpts" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button class="cancel-btn" @click="dialogVisible = false">{{ $t('cancelText') }}</el-button>
      <el-button class="save-btn" type="primary" @click="save">{{ $t('common_save') }}</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { adminApi } from 'api'
import { QuestionFilled } from '@element-plus/icons-vue'
const props = defineProps({
  storageId: String,
  id: String,
  settings: Object
})
const emits = defineEmits(['refresh'])
const outputFormatData = {
  PDF: {
    color: 'original'
  },
  Image: {
    file_type: 'TIFF',
    resolution: 1,
    quality: 80,
    color: 'original'
  },
  Text: {
    keep_line_breaks: 'Yes',
    insert_page_break_char: 'Yes',
    use_blank_line_as_para_sep: 'Yes'
  },
  Word: {
    color: 'original'
  },
  originalFile: {
    color: 'original'
  }
}
const destinationData = {
  external: {
    file_name: '${Profile_id}',
    path: '/',
    duplicate_name_strategy: 'replace',
    share_drive_profile: ''
  },
  docPal: {
    file_name: '',
    path: '/'
  },
  workflow: {}
}
const publicKeys = ['document_type', 'output_format', 'destination']
const defaultValue = {
  document_type: 'File',
  output_format: '',
  destination: 'external'
}
const { t } = useI18n()
const dialogVisible = ref(false)
const isEdit = ref(false)
const outputOptioins = inject('outputOptioins')
const {
  outputFormatOpts,
  documentTypeOpts,
  fileTypeOpts,
  resolutionOpts,
  colorOpts,
  destinationOpts,
  externalStorageProfileOpts,
  duplicateNameStrategyOpts,
  pathVOpts,
  fileNameVOpts,
  workflowOpts,
  workflowVOpts
} = outputOptioins
const formRef = ref<any>(null)
const form = ref<any>({
  ...defaultValue
})
const setting = ref<any>(null)
const rules = {
  file_name: [{ required: true, message: t('render.hint.fieldRequired', { name: t('docType_documentType') }), trigger: 'blur' }],
  document_type: [{ required: true, message: t('render.hint.fieldRequired', { name: t('docType_documentType') }), trigger: 'change' }],
  output_format: [{ required: true, message: t('render.hint.fieldRequired', { name: t('externalStorage.outputFormat') }), trigger: 'change' }],
  color: [{ required: true, message: t('render.hint.fieldRequired', { name: t('externalStorage.color') }), trigger: 'change' }],
  destination: [{ required: true, message: t('render.hint.fieldRequired', { name: t('externalStorage.destination') }), trigger: 'change' }],
  share_drive_profile: [{ required: true, message: t('render.hint.fieldRequired', { name: t('externalStorage.externalStorageProfile') }), trigger: 'change' }],
  path: [{ required: true, message: t('render.hint.fieldRequired', { name: t('externalStorage.path') }), trigger: 'blur' }],
  file_type: [{ required: true, message: t('render.hint.fieldRequired', { name: t('DAM_fileType') }), trigger: 'change' }],
  resolution: [{ required: true, message: t('render.hint.fieldRequired', { name: t('externalStorage.resolution') }), trigger: 'change' }],
  quality: [{ required: true, message: t('render.hint.fieldRequired', { name: t('externalStorage.quality') }), trigger: 'blur' }],
  keep_line_breaks: [{ required: true, message: t('render.hint.fieldRequired', { name: t('externalStorage.keepLineBreaks') }), trigger: 'change' }], // 新增
  insert_page_break_char: [{ required: true, message: t('render.hint.fieldRequired', { name: t('externalStorage.insertPageBreakChar') }), trigger: 'change' }], // 新增
  use_blank_line_as_para_sep: [
    { required: true, message: t('render.hint.fieldRequired', { name: t('externalStorage.useBlankLineAsParaSep') }), trigger: 'change' }
  ], // 新增
  duplicate_name_strategy: [
    { required: true, message: t('render.hint.fieldRequired', { name: t('externalStorage.duplicateNameStrategy') }), trigger: 'change' }
  ] // 新增
}
const WorkflowVariableMappingRef = ref<any>(null)

function handleOpen(data: any, _isEdit = false) {
  isEdit.value = _isEdit
  setting.value = null
  if (!!data) {
    form.value = {
      ...defaultValue,
      ...data
    }
    setting.value = { ...data }
  } else {
    form.value = {
      ...defaultValue
    }
  }
  dialogVisible.value = true
  setTimeout(() => {
    formRef.value.clearValidate()
  })
}
function handleOutputFormatChange(value: string) {
  const outputFormat = { ...outputFormatData[value] }
  const destination = destinationData[form.value.destination] ? { ...destinationData[form.value.destination] } : {}
  form.value = {
    ...outputFormat,
    ...destination,
    ...form.value
  }
}
const pathInput = ref<any>(null)
const fileNameInput = ref<any>(null)
function handleVariableSelect(variable: string, attr = 'file_name') {
  if(!form.value[attr]) form.value[attr] = ''
  // 识别当前光标位置
  const input = attr === 'file_name' ? fileNameInput.value.input : pathInput.value.input
  const start = input.selectionStart
  const end = input.selectionEnd
  form.value[attr] = form.value[attr].substring(0, start) + variable + form.value[attr].substring(end)
}
async function save() {
  try {
    await formRef.value.validate()
    const _params = getParams()
    if (form.value.workflow) {
      _params.workflow_mapping = WorkflowVariableMappingRef.value.getData()
    }
    if (isEdit.value) {
      await adminApi.api.patchExternalstorageProfilesProfileidOutputrecordOutputrecordid(props.id as string, setting.value.id, _params)
    } else {
      await adminApi.api.postExternalstorageProfilesProfileidOutputrecord(props.id as string, _params)
    }
    emits('refresh')
    dialogVisible.value = false
  } catch (error) {
    console.log(error)
  } finally {
  }
  function getParams() {
    const params = {}
    const outputFormat = { ...outputFormatData[form.value.output_format] }
    const destination = destinationData[form.value.destination] ? { ...destinationData[form.value.destination] } : {}
    publicKeys.forEach((key) => {
      params[key] = form.value[key] || defaultValue[key]
    })
    Object.keys(outputFormat).forEach((key) => {
      params[key] = form.value[key] || outputFormat[key]
    })
    Object.keys(destination).forEach((key) => {
      params[key] = form.value[key] || destination[key]
    })
    return params
  }
}

defineExpose({
  handleOpen
})
</script>
