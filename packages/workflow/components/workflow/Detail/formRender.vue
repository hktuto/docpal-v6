<template>
  <div class="workflowFormContainer">
    <FormRenderer
      :class="{ vformReadonly: state.readonly, workflowForm: true }"
      ref="FormRendererRef"
      :formJson="formJson"
      :data="formData"
      @previewFileInit="handlePreviewFileInit"
      @formChange="$emit('formChange')"
    >
      <template v-slot:previewFile="{ data }">
        <WorkflowDetailReader class="WorkflowDetailReader" ref="WorkflowReaderRef"> </WorkflowDetailReader>
      </template>
      <template v-for="item in formRenderSlots" :key="item.name" v-slot:[item.name]="{ data }">
        <component
          :is="item.component"
          :ref="(el: any) => (formRenderSlotsRef[item.name] = el)"
          :disabled="state.readonly"
          :formData="state.formData"
          :options="data.options?.dynamicConfig"
          :vformOptions="data.options"
          :taskDetail="props.taskDetail"
        />
      </template>
    </FormRenderer>
    <slot name="action" />
  </div>
</template>

<script lang="ts" setup>
import { clientApi } from 'api'
const props = defineProps<{
  options?: Object
  taskDetail?: any
}>()
const state = reactive<any>({
  formData: {},
  formJson: {},
  writableIds: [],
  readonly: false
})
// @ts-ignore
const { formRenderSlots } = useWorkflow()
const emit = defineEmits(['formChange'])

const WidgetNames = {
  arr: ['sub-form'],
  upload: ['file-upload'],
  number: ['number', 'slider'],
  select: ['select', 'async-select', 'ug-select', 'select-group'],
  arrSelect: ['time-range', 'date-range', 'checkbox']
}
const defaultFormJson = {
  widgetList: [],
  formConfig: {
    modelName: 'formData',
    refName: 'vForm',
    rulesName: 'rules',
    labelWidth: 80,
    labelPosition: 'top',
    size: '',
    labelAlign: 'label-left-align',
    cssCode: '',
    customClass: [],
    functions: '',
    layoutType: 'PC',
    jsonVersion: 3,
    onFormCreated: '',
    onFormMounted: '',
    onFormDataChange: '',
    dhList: [],
    saveRemoteOptions: 'never',
    labelFormUniqueName: true,
    onFormValidate: '',
    dataSources: []
  }
}

const FormRendererRef = ref()
// #region module: set
async function setForm(json: string | object, data?: object, properties: any[] = [], xml?: string) {
  if (JSON.stringify(json) === '{}') {
    FormRendererRef.value.setFormJson(defaultFormJson)
    return
  }
  state.formJson = json
  FormRendererRef.value.setFormJson(json)
  if (data && properties) {
    const _data = await handleData(data)
    // check if value in _data is undefine or null , if so remove it
    Object.keys(_data).forEach((key) => {
      if (_data[key] === undefined || _data[key] === null) delete _data[key]
    })
    state.formData = { ..._data }

    FormRendererRef.value.setFormData(_data)
    handleTypeIds(properties)
  } else {
    state.formData = { ...data }
  }
}
async function handleData(data: any) {
  // 处理sub-form
  const arrWidgetKeys = getWidgetNames(WidgetNames.arr)
  const uploadWidgetKeys = getWidgetNames(WidgetNames.upload)
  const numberWidgetKeys = getWidgetNames(WidgetNames.number)
  const selectWidgetKeys = getWidgetNames(WidgetNames.select, true)
  selectWidgetKeys.push(...getWidgetNames(WidgetNames.arrSelect))
  const result: any = {}
  const pList: any = []
  Object.keys(data).forEach((key) => {
    pList.push(revert(key, data[key]))
  })
  await Promise.all(pList)
  return result
  async function revert(key: string, value: string) {
    if (arrWidgetKeys.find((item: any) => item.name === key)) result[key] = value ? JSON.parse(value) : []
    else if (uploadWidgetKeys.find((item: any) => item.name === key)) {
      const uploadWidget = uploadWidgetKeys.find((item: any) => item.name === key)
      const mode = uploadWidget.uploadName === 'file' ? 'nuxeo' : 'workflow'
      result[key] = await revertUploadFile(value, mode)
    } else if (selectWidgetKeys.find((item: any) => item.name === key)) result[key] = value ? value.split(',') : ''
    else if (numberWidgetKeys.find((item: any) => item.name === key)) result[key] = value || value === 0 ? Number(value) : value
    else if (value !== null) result[key] = value
  }
}
async function revertUploadFile(ids: any, mode: 'workflow' | 'nuxeo' = 'workflow') {
  const pList: any = []
  const result: any = []
  if (!ids) return result
  ids = ids.split(',')
  for (const item of ids) {
    if (mode === 'nuxeo') {
      // @ts-ignore
      const promiseItem = clientApi.api.getDmsDocument({ idOrPath: item, nonPermission: true }).then((res) => res.data)
      pList.push(promiseItem)
    } else {
      const promiseItem = clientApi.api.getWorkflowTaskAttachmentInfo({ attachmentId: item }).then((res) => res.data)
      pList.push(promiseItem)
    }
  }
  const response = await Promise.all(pList)
  response.forEach((item) => {
    if (item && item.name) result.push({ id: item.contentId || item.id, name: item.properties?.['dc:title'] || item.name })
  })
  return result
}
function handleTypeIds(properties: any) {
  state.writableIds = []
  properties.forEach((item: any) => {
    if (item.writable) state.writableIds.push(item.id)
  })
}
// #endregion
// #region module: get
const formRenderSlotsRef = ref<any>({})
async function getFormData(needValidation = true, onlyWritable = false) {
  try {
    let formData = {}
    if (!needValidation) formData = await FormRendererRef.value.getFormData(false)
    else {
      formData = await FormRendererRef.value
        .getFormData()
        .then((res: any) => {
          return res
        })
        .catch((error: any) => {
          return false
        })
    }
    if (!formData) return false
    let resultFormData = onlyWritable ? writableDataDeArray(deepCopy(formData)) : dataDeArray(deepCopy(formData))
    const slotData = await getSlotData(formRenderSlotsRef.value, needValidation)
    const result = {
      ...resultFormData,
      ...slotData
    }
    // throw new Error("slotData", result)
    return result
  } catch (error) {
    console.error(error)
  }
}
async function getSlotData(refList: any, needValidation: boolean) {
  let pList: any = []
  Object.keys(refList).forEach((key) => {
    if (refList[key] && refList[key].getFormData) {
      pList.push(refList[key].getFormData(needValidation))
    }
  })
  const data = await Promise.all(pList)
  return data.reduce((prev, item) => {
    prev = { ...prev, ...item }
    return prev
  }, {})
}

function writableDataDeArray(formDatas: any) {
  const data: any = {}
  state.writableIds.forEach((item: any) => {
    data[item] = formDatas[item]
  })
  return dataDeArray(data)
}
function dataDeArray(formDatas: any) {
  const arrWidgetKeys = getWidgetNames(WidgetNames.arr)
  // TODO : remove later
  const data = Object.keys(formDatas).reduce((prev: any, key: string) => {
    if (formDatas[key] == '0' || formDatas[key] == 'false' || !!formDatas[key]) {
      prev[key] = formDatas[key]
    }
    return prev
  }, {})
  // const data = deepCopy(formDatas)
  Object.keys(data).forEach((key, _index) => {
    const _data = toRaw(formDatas[key])
    if (_data instanceof Array) {
      if (arrWidgetKeys.some((wid: any) => wid.name === key)) {
        data[key] = JSON.stringify(_data)
      } else if (_data.length > 0 && (!!_data[0].response || !!_data[0].id)) {
        const values = _data.reduce((prev, item) => {
          if (item.response) {
            item.response = item.response.data ? item.response.data : item.response
            const responseData = item.response instanceof Array ? item.response[0] : item.response
            prev.push(responseData.contentId || responseData.id)
          } else {
            prev.push(item.id)
          }
          return prev
        }, [])
        data[key] = values.join(',')
      } else {
        const values = _data.reduce((prev, item) => {
          prev.push(item)
          return prev
        }, [])
        data[key] = values.join(',')
      }
    }
  })
  return data
}
function getWidgetNames(widgetNames: string[], checkMultiple: boolean = false, checkNuxeo: boolean = false) {
  const containerWidgets = FormRendererRef.value.vFormRenderRef.getContainerWidgets()
  const fieldWidgets = FormRendererRef.value.vFormRenderRef.getFieldWidgets()
  return [...containerWidgets, ...fieldWidgets].reduce((prev, item) => {
    if (widgetNames.includes(item.type)) {
      if (checkMultiple) {
        if (item.field.options.multiple)
          prev.push({
            name: item.name
          })
      } else
        prev.push({
          name: item.name,
          uploadName: item?.field?.options?.uploadName || undefined
        })
    }
    return prev
  }, [])
}
// #endregion
// #region module:
function enableForm() {
  state.readonly = false
  FormRendererRef.value.vFormRenderRef.enableForm()
}
function disableForm() {
  state.readonly = true
  FormRendererRef.value.vFormRenderRef.disableForm()
}
// #endregion
// #region module: WorkflowReader
const WorkflowReaderRef = ref()
function handlePreviewFileInit(fileId: string) {
  if (WorkflowReaderRef.value && fileId) WorkflowReaderRef.value.init(fileId)
}
// #endregion
onMounted(() => {})
const { formData, formJson } = toRefs(state)
defineExpose({ setForm, getFormData, disableForm, enableForm })

async function updateData(newData: any) {
  const _data = await handleData(newData)
  state.formData = { ..._data }
  FormRendererRef.value.setFormData(_data)
}

provide('workflowFormRender', {
  updateData,
  getFormData
})
</script>

<style lang="scss" scoped>
.workflowForm {
  overflow: hidden;
  :deep(.el-form) {
    height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
    .container-wrapper {
      &.full-height {
        height: 100%;
        > * {
          height: 100%;
        }
        .field-wrapper,
        .static-content-item,
        .slot-wrapper-render {
          height: 100%;
        }
      }
    }
  }
  :deep(.flex-col) {
    display: flex;
    flex-flow: column nowrap;
    justify-content: flex-start;
    align-items: flex-start;
    gap: var(--app-space-xs);
    .field-wrapper {
      width: 100%;
      &:has(.full-height) {
        flex: 1 0 auto;
        .slot-wrapper-render,
        .static-content-item {
          height: 100%;
        }
      }
      .full-height {
        height: 100%;
        > * {
          height: 100%;
        }
      }
    }
  }
}
.workflowFormContainer {
  height: 100%;
  width: 100%;
  overflow: hidden;
  display: grid;
  grid-template-rows: 1fr min-content;
}
</style>
