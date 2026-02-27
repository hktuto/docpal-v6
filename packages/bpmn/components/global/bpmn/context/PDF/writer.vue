<script setup lang="ts">
import type { Node } from '@antv/x6'
import { useDebounceFn } from '@vueuse/core'
import { newAdminApi } from 'api'

const { t } = useI18n()
const { node } = defineProps<{
  node: Node
}>()
const graphProvider = inject(BPMN_PROVIDER)
const editorProvider = inject(EDITOR_PROVIDER)
if (!graphProvider || !editorProvider) {
  throw createError('provider not found')
}
const { bpmnGlobalRules } = editorProvider.BpmnRule

graphProvider?.graph.value?.on('history:change', async () => {
  initForm()
})
const state = reactive({
  fileField: '',
  fileList: [],
  _fileList: [],
  fields: []
})

const stringFields = computed(() => {
  if (!bpmnGlobalRules.value || bpmnGlobalRules.value.length === 0) return []

  return bpmnGlobalRules.value.filter((item: any) => item.validationRule.type === 'text').map((item: any) => {
    return {
      id: '${variables:get(' + item.id + ')}',
      name: item.name
    }
  })
})

const fileFieldOptions = computed(() => {
  if (!bpmnGlobalRules.value || bpmnGlobalRules.value.length === 0) return []

  return bpmnGlobalRules.value.filter((item: any) => item.validationRule.type === 'text').map((item: any) => {
    return {
      id: '${variables:get(' + item.id + ')}',
      name: item.name
    }
  })
})

const displayFieldList = ref([])

function initForm() {
  const fileField = node.data.data.extensionElements['flowable:field'].find((el: any) => el.attr_name === 'fileField')
  state.fileField = fileField ? fileField['flowable:expression'].__cdata : ''
  generateDisplayFieldList()
}

function generateDisplayFieldList() {
  const nodeData = node.getData()
  if (!nodeData.data.extensionElements || !nodeData.data.extensionElements['flowable:field']) displayFieldList.value = []
  displayFieldList.value = nodeData.data.extensionElements['flowable:field']
    .filter((f: any) => f.attr_name !== 'fileField' && f.attr_name !== 'pdfExample')
}

const loading = ref(false)

function fieldMappingUpdate(newVal: string, name: string) {
  graphProvider?.graph.value?.startBatch('update-reader-pdf-field-data')

  const nodeData = node.getData()
  const newData = {
    ...nodeData,
    version: (nodeData.version || 0) + 1
  }
  const index = newData.data.extensionElements['flowable:field'].findIndex((f: any) => f.attr_name === name)
  newData.data.extensionElements['flowable:field'][index]['flowable:expression'].__cdata = newVal || ''

  node.setData(newData, { overwrite: true, deep: true, silent: false })

  graphProvider?.graph.value?.stopBatch('update-reader-pdf-field-data')
  initForm()
}

const handelFileOnChange = useDebounceFn(
  async (file: any, _fileList: any) => {
    state.fileList = _fileList.reduce((prev: any, item: any) => {
      prev.push(item)
      return prev
    }, [])
    state._fileList = [...state.fileList]

    state.fields = []
    const formData = new FormData()
    formData.append('file', state.fileList[0].raw)
    loading.value = true
    const { fields, id } = await newAdminApi.postDmsTemplateDocumentParse({}, formData).then(res => res.data)
    // 轉bpmn json
    state.fields = fields
    state.id = id
    if (!id) return

    graphProvider?.graph.value?.startBatch('update-read-pdf-data')
    const nodeData = node.getData()
    const newData = {
      ...nodeData,
      version: (nodeData.version || 0) + 1
    }

    // find flowable:field in extensionElements
    const fileField = nodeData.data.extensionElements['flowable:field'].find((el: any) => el.attr_name === 'fileField')
    let newPdfId = { attr_name: 'pdfExample', ['flowable:expression']: { __cdata: id } }

    newData.data.extensionElements['flowable:field'] = [
      fileField,
      newPdfId,
      // loop field here
      ...fields.map((f: any) => {
        return {
          attr_name: f.name,
          fields_type: f.type,
          ['flowable:expression']: { __cdata: '' }
        }
      })
    ]
    // remove old field, and create new field
    node.setData(newData, { overwrite: true, deep: true, silent: false })
    graphProvider?.graph.value?.stopBatch('update-read-pdf-data')
    generateDisplayFieldList()
    loading.value = false
  },
  500,
  { maxWait: 5000 }
)

const beforeRemove = (file: any, _fileList: any) => {
  state.fileList = _fileList
}

watch(() => node, async () => {
  if (node && node.data) {
    console.log(node, node.data)
    initForm()
  }
}, {
  immediate: true,
  deep: true
})
</script>

<template>
  <div>
    <BpmnSidebarEditLabel :node="node" />
    <el-form label-width="auto" label-position="top" :disabled="editorProvider.readonly.value">
      <el-form-item :label="t('Save Filled PDF to')">
        <el-select v-model="state.fileField" :placeholder="t('common_selectedIsRequiredMsg')"
                   @change="(val:any) => fieldMappingUpdate(val, 'fileField')">
          <el-option v-for="item in fileFieldOptions" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('PDF form Example')">
        <el-upload
          v-model:file-list="state.fileList"
          class="upload-demo"
          action="#"
          accept=".pdf"
          :limit="1"
          :auto-upload="false"
          :on-change="handelFileOnChange"
          :before-remove="beforeRemove"
        >
          <el-button type="primary">{{ t('Click to upload') }}</el-button>
        </el-upload>
      </el-form-item>
    </el-form>

    <el-divider style="top: -10px" />

    <div v-loading="loading">
      {{ $t('Field Mapping') }}
      <el-form label-width="auto" label-position="top" v-for="(item, index) in displayFieldList"
               :disabled="editorProvider.readonly.value">
        <el-form-item :key="item.attr_name" :label="item.attr_name">
          <el-select v-model="item['flowable:expression'].__cdata" :placeholder="t('common_selectOccupancyContent')"
                     @change="(val:any) => fieldMappingUpdate(val, item.attr_name)" clearable>
            <el-option v-for="fieldItem in stringFields" :key="fieldItem.id" :value="fieldItem.id"
                       :label="fieldItem.name.replace('${variables:get(', '').replace(')}', '')" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped lang="scss">

</style>
