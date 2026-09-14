<script lang="ts" setup>
import { newClientApi } from 'api'

const props = defineProps<{
  options?: Object
  taskDetail?: any
}>()
const state = reactive<any>({
  formData: {},
  formJson: {},
  writableIds: [],
  readonly: false,
  originalFieldDisabled: {} as Record<string, boolean>
})
const { formData, formJson } = toRefs(state)
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

function collectFieldDisabledMap(json: string | object): Record<string, boolean> {
  const map: Record<string, boolean> = {}
  const walk = (list: any[] = []) => {
    list.forEach((widget) => {
      if (!widget) return
      const name = widget.options?.name
      if (name) map[name] = !!widget.options.disabled
      if (widget.widgetList?.length) walk(widget.widgetList)
      if (widget.cols?.length) {
        widget.cols.forEach((col: any) => walk(col.widgetList || []))
      }
      if (widget.tabs?.length) {
        widget.tabs.forEach((tab: any) => walk(tab.widgetList || []))
      }
      if (widget.rows?.length) {
        widget.rows.forEach((row: any) => {
          row.cols?.forEach((col: any) => walk(col.widgetList || []))
        })
      }
    })
  }
  const formJson = typeof json === 'string' ? JSON.parse(json) : json
  walk(formJson?.widgetList || [])
  return map
}

function getFieldBaseName(wName: string) {
  return wName.includes('@row') ? wName.split('@row')[0] : wName
}

// #region module: set
async function setForm(json: string | object, data?: object, properties: any[] = []) {
  if (JSON.stringify(json) === '{}') {
    FormRendererRef.value.setFormJson(defaultFormJson)
    state.originalFieldDisabled = {}
    return
  }
  // 必须在 setFormJson / disableForm 之前快照，否则 options.disabled 会被原地改写
  state.originalFieldDisabled = collectFieldDisabledMap(json)
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
  const result: any = {}
  const pList: any = []
  Object.keys(data).forEach((key) => {
    pList.push(revert(result, key, data[key]))
  })
  await Promise.all(pList)
  return result
}

async function revert(result: any, key: string, value: string) {
  // 处理sub-form
  const arrWidgetKeys = getWidgetNames(WidgetNames.arr)
  const numberWidgetKeys = getWidgetNames(WidgetNames.number)
  const selectWidgetKeys = getWidgetNames(WidgetNames.select, true)
  selectWidgetKeys.push(...getWidgetNames(WidgetNames.arrSelect))

  if (arrWidgetKeys.find((item: any) => item.name === key)) result[key] = value || []
  else if (selectWidgetKeys.find((item: any) => item.name === key)) result[key] = value || []
  else if (numberWidgetKeys.find((item: any) => item.name === key)) result[key] = value || value == 0 ? Number(value) : value
  else if (value !== null) result[key] = value
}

function handleTypeIds(properties: any) {
  state.writableIds = []
  properties.forEach((item: any) => {
    if (item.writable) state.writableIds.push(item.id)
  })
}

const formRenderSlotsRef = ref<any>({})

async function getFormData(needValidation = true, onlyWritable = false) {
  try {
    let formData
    if (!needValidation) {
      formData = await FormRendererRef.value.getFormData(false)
    } else {
      formData = await FormRendererRef.value
        .getFormData()
        .then((res: any) => {
          return res
        })
        .catch((error: any) => {
          console.log(error)
          return false
        })
    }
    if (!formData) return false
    let resultFormData = onlyWritable ? writableDataDeArray(deepCopy(formData)) : dataDeArray(deepCopy(formData))
    const slotData = await getSlotData(formRenderSlotsRef.value, needValidation)
    return {
      ...resultFormData,
      ...slotData
    }
  } catch (error: any) {
    throw error instanceof Error ? error : new Error(error?.message || String(error))
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
  return Object.keys(formDatas).reduce((prev: any, key: string) => {
    if (formDatas[key] == '0' || formDatas[key] == 'false' || !!formDatas[key]) {
      prev[key] = formDatas[key]
    }
    return prev
  }, {})
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

function enableForm(options?: { forceAll?: boolean }) {
  state.readonly = false
  const vForm = FormRendererRef.value?.vFormRenderRef
  if (!vForm) return

  // 强制全部可编辑（忽略设计态 disabled），兼容旧 enableForm 语义
  if (options?.forceAll) {
    vForm.enableForm()
    return
  }

  const disabledMap = state.originalFieldDisabled || {}
  const refs = Object.keys(vForm.widgetRefList || {})
    .map((wName) => ({ wName, foundW: vForm.getWidgetRef(wName) }))
    .filter((item) => !!item.foundW)

  // 先处理子表单容器，再按设计态恢复每个字段的 disabled
  refs.forEach(({ wName, foundW }) => {
    if (foundW.widget?.type !== 'sub-form') return
    const name = foundW.widget.options?.name || wName
    if (disabledMap[name]) foundW.disableSubForm?.()
    else foundW.enableSubForm?.()
  })

  refs.forEach(({ wName, foundW }) => {
    if (foundW.widget?.type === 'sub-form' || !foundW.setDisabled) return
    foundW.setDisabled(!!disabledMap[getFieldBaseName(wName)])
  })
}

function disableForm() {
  state.readonly = true
  FormRendererRef.value.vFormRenderRef.disableForm()
}

const WorkflowReaderDocumentRef = ref()
function handlePreviewFileInit(fileId: string) {
  if (WorkflowReaderDocumentRef.value && fileId) WorkflowReaderDocumentRef.value.init(fileId)
}

async function updateData(newData: any) {
  const _data = await handleData(newData)
  state.formData = { ..._data }
  FormRendererRef.value.setFormData(_data)
}

function formDataChange(newFormData: any) {
  emit('formChange', newFormData)
  formData.value = newFormData.formModel
}

onMounted(() => {})
defineExpose({ setForm, getFormData, disableForm, enableForm, updateData })
provide('workflowFormRender', {
  updateData,
  getFormData
})
</script>

<template>
  <div class="workflowFormContainer">
    <FormRenderer
      :class="{ vformReadonly: state.readonly, workflowForm: true }"
      ref="FormRendererRef"
      :formJson="formJson"
      :data="formData"
      @previewFileInit="handlePreviewFileInit"
      @formChange="formDataChange"
    >
      <template v-slot:previewFile="{ data }">
        <LazyContextFormReaderDocument class="WorkflowDetailReader" ref="WorkflowReaderDocumentRef" />
      </template>
      <template v-for="item in formRenderSlots" :key="item.name" v-slot:[item.name]="{ data }">
        <component
          :is="item.component"
          :ref="(el: any) => (formRenderSlotsRef[item.name] = el)"
          :disabled="state.readonly"
          :formData="formData"
          :options="data.options?.dynamicConfig"
          :vformOptions="data.options"
          :taskDetail="props.taskDetail"
        />
      </template>
    </FormRenderer>
    <slot name="action" />
  </div>
</template>

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
