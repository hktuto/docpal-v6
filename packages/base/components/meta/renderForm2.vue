<template>
  <div v-loading="state.loading" style="height: 100%">
    <FormVariablesRenderer class="meta-render-form" ref="FormVariablesRendererRef" @formChange="formChange" @handleApply="handleApply">
      <template v-for="item in state.variables" v-slot:[`slot-${item.name}`]>
        <div class="ai-suggestion-wrapper">
          <div
            v-if="state.aiAnalysis && state.aiAnalysis[item.name]"
            :id="`slot-${item.name}`"
            :key="item.name"
            :class="{ 'ai-suggestion-content': true, 'ai-suggestion-content--disabled': !checkAiSuggestionFormat(item, state.aiAnalysis[item.name]) }"
          >
            <SvgIcon src="/icons/file/ai.svg" />
            <pre>{{ state.aiAnalysis[item.name].label || state.aiAnalysis[item.name].value }}</pre>
            <div v-if="checkAiSuggestionFormat(item, state.aiAnalysis[item.name])" class="flex-x-start ai-button-list">
              <ElIcon class="iconButton" @click="aiFormChange(item, state.aiAnalysis[item.name])"><Check /> </ElIcon>
              <ElIcon class="iconButton" @click="deleteAiSuggestion(item.name)"><Close /> </ElIcon>
              <!--                    <el-button :icon="Check" type="link" text style="color: #fff"-->
              <!--                        ></el-button>-->
              <!--                    <el-button :icon="Close" type="link" text class="el-icon&#45;&#45;right" style="color: #fff"-->
              <!--                       ></el-button>-->
            </div>
          </div>
        </div>
      </template>
    </FormVariablesRenderer>
  </div>
</template>

<script lang="ts" setup>
import { Check, Close } from '@element-plus/icons-vue'
import { clientApi } from 'api'
import { useMetadata } from './metadata'
type initMetaFormOptions = {
  isFolder?: boolean
  aiAnalysis?: any
  aiDocId?: string
}

/**
 * fileRequest ： apply按钮, meta form
 * upload ：doc name,docType, meta form
 * changeDocType ：docType, meta form, documentType change
 * ai : doc name,docType, aiAnalysis, meta form
 * ai-edit ： aiAnalysis, meta form
 * normal : meta form
 */
const props = withDefaults(
  defineProps<{
    mode: 'fileRequest' | 'upload' | 'ai' | 'ai-edit' | 'changeDocType' | 'normal'
    showOcrLanguage: boolean
  }>(),
  {
    mode: 'normal',
    showOcrLanguage: false
  }
)
const emits = defineEmits(['formChange', 'handleApply'])
const metaDateFormat = useDisplayTimeFormat()
const metadataHelper = useMetadata()
const { t } = useI18n()
const state = reactive<any>({
  loading: false,
  data: [],
  variables: [],
  documentTypeSelected: '',
  aiAnalysis: {},
  aiDocId: '',
  initOptions: {},
  initData: {}
})

// #region module: Variables
const FormVariablesRendererRef = ref()
async function getVariables(isFolder: boolean = false) {
  try {
    const variableList = await metadataHelper.initVformVariableList(state.initOptions.documentType, state.initOptions)
    state.variables = [...variableList]
    if (['ai', 'upload', 'changeDocType'].includes(props.mode)) {
      state.variables.unshift({
        name: 'documentType',
        label: t('search.documentType'),
        type: 'select',
        required: true,
        options: {
          optionItems: await GetActiveDocpalTypeWithIsFolderApi(isFolder),
          clearable: false,
          filterable: true
        }
      })
    }

    if (['ai', 'upload', 'folderCabinet'].includes(props.mode)) {
      state.variables.unshift({
        name: 'docName',
        label: t('folder_cabinetNewItemTitle'),
        type: 'input',
        required: true,
        options: {
          clearable: false
        }
      })
    }

    nextTick(async () => {
      const formJson = await FormVariablesRendererRef.value.createJson(state.variables)
      console.log('formJson', formJson)
      if (props.mode === 'fileRequest') {
        const newFormJson = getApplyFormJson(formJson)
        FormVariablesRendererRef.value.setFormJson(newFormJson)
      } else if (props.mode === 'ai' || props.mode === 'ai-edit') {
        const newFormJson = getAIFormJson(formJson)
        FormVariablesRendererRef.value.setFormJson(newFormJson)
      }
    })
    return state.variables
  } catch (error) {
    return []
  }
}
function getApplyFormJson(formJson: any) {
  const widgetList: any = []
  formJson.widgetList.forEach((item: any) => {
    const gridItem: any = getMetaApplyFormGridItem()
    const buttonItem = getMetaApplyButton(item.options.name)
    gridItem.cols[0].widgetList.push(item)
    gridItem.cols[1].widgetList.push(buttonItem)
    widgetList.push(gridItem)
  })
  return { formConfig: formJson.formConfig, widgetList }
}
function getAIFormJson(formJson: any) {
  const widgetList: any = []
  formJson.widgetList.forEach((item: any) => {
    // const gridItem = getMetaApplyFormGridItem(24,24, ['ai-suggestion-container'])
    // const gridItem = getMetaApplyFormGridItem( )
    const slotItem = getMetaAISlot(item.options.name)
    // combine item and slot
    // gridItem.cols[0].widgetList.push(newItem)
    // gridItem.cols[0].widgetList.push(item, slotItem)
    // gridItem.cols[1].widgetList.push(slotItem)
    widgetList.push(item)
    widgetList.push(slotItem)
  })
  return { formConfig: formJson.formConfig, widgetList }
}
// function getValidate(rule = '^[a-zA-Z_][a-zA-Z0-9_]*$') {
//   return `if((value || value === 0 || value === false) && !/${rule}/.test(value)) callback(new Error("${rule}")) \nelse callback()`
// }
function clear() {
  state.variables = []
  FormVariablesRendererRef.value.createJson(state.variables)
}
async function init(documentType: any, initOptions: initMetaFormOptions) {
  state.initOptions = { ...initOptions, documentType }
  if (!documentType) {
    clear()
    return
  }
  try {
    state.loading = true
    state.data = []
    const metaList = await getVariables(initOptions?.isFolder)
    if (props.mode === 'ai' || props.mode === 'ai-edit') {
      if (initOptions.aiAnalysis) state.aiAnalysis = initOptions.aiAnalysis
      if (initOptions.aiDocId) state.aiDocId = initOptions.aiDocId
    }
    return metaList
  } catch (error) {
    console.error(error)
    return []
  } finally {
    state.loading = false
  }
}
// #endregion
async function setData(properties: any) {
  const _properties = JSON.parse(JSON.stringify(properties))
  const data = metadataHelper.getParseData(_properties, state.variables)
  state.initData = data
  state.variables.forEach((item: any) => {
    switch (item.type) {
      case 'textarea':
        if (data[item.name]) data[item.name] = data[item.name].replaceAll('<br/>', '\n')
        break
      case 'select':
        if (item.options?.multiple) {
          if (typeof data[item.name] !== 'string') break
          data[item.name] = data[item.name].replace('[', '').replace(']', '').replaceAll(' ', '').split(',')
        }
        break
      default:
        break
    }
  })
  await new Promise((resolve) => setTimeout(resolve, 10))
  FormVariablesRendererRef.value.setData(data)
  // return await FormVariablesRendererRef.value.setData(properties)
}
async function getData() {
  const data = await FormVariablesRendererRef.value.getData(true)
  if (!data) throw new Error("valid failed");
  state.variables.forEach((item: any) => {
    switch (item.type) {
      case 'textarea':
        if (data[item.name]) data[item.name] = data[item.name].replaceAll('\n', '<br/>')
        break
      case 'date':
      // if (data[item.name]) data[item.name] = formatDate(data[item.name], 'YYYY-MM-DD HH:mm:ss')
      default:
        break
    }
  })
  const validData = Object.keys(data).reduce((prev: any, key) => {
    prev[key] = data[key] ? data[key] : ''
    return prev
  }, {})
  return metadataHelper.getStringfyData(validData, state.variables)
}
async function formChange({ formData, fieldName, formModel, newValue, oldValue }: any) {
  emits('formChange', {
    formModel: metadataHelper.getStringfyData(formModel, state.variables),
    fieldName,
    newValue,
    oldValue
  })
  if (['changeDocType'].includes(props.mode)) {
    if (fieldName === 'documentType' && newValue !== oldValue && !!oldValue) {
      await init(newValue, state.initOptions)
      setTimeout(() => {
        setData({ ...state.initData, documentType: newValue })
      })
    }
  }
}
async function aiFormChange(row: any, analysis: any) {
  let value = analysis.value
  switch (row.type) {
    case 'date':
      value = formatDate(value, row.options.format)
      break
    default:
      break
  }
  const key = row.name
  FormVariablesRendererRef.value.setData({
    [key]: value
  })
}
async function deleteAiSuggestion(deleteName: string) {
  const _aiAnalysis = deepCopy(state.aiAnalysis)
  delete _aiAnalysis.documentType
  delete _aiAnalysis[deleteName]
  const params: any = {
    documentType: deleteName === 'documentType' || !state.aiAnalysis.documentType ? null : state.aiAnalysis?.documentType?.value,
    metaDatas: Object.keys(_aiAnalysis).reduce((prev: any, key) => {
      const item = _aiAnalysis[key]
      prev.push({
        name: key,
        value: item.value
      })
      return prev
    }, []),
    aiId: state.aiDocId
  }
  try {
    await clientApi.api.patchDmsDocumentUpdateaidocument(params).then(r => r.data)
    delete state.aiAnalysis[deleteName]
  } catch (error) {}
}
function handleApply(formModel: any) {
  emits('handleApply', formModel)
}

// #endregion
async function GetActiveDocpalTypeWithIsFolderApi(isFolder: boolean) {
  try {
    const docList: any = await clientApi.api.getDmsDocpalTypeActive().then((res) => res.data)
    return docList
      ?.filter((item) => item.isFolder === isFolder)
      .map((item) => ({
        ...item,
        value: item.name,
        label: item.name
      }))
  } catch (error) {
    return []
  }
}
function checkAiSuggestionFormat(row: any, aiAnalysis: any) {
  switch (row.type) {
    case 'date':
      const date = formatDate(aiAnalysis.value)
      return date !== 'Invalid Date' && date !== '-'
    case 'boolean':
      return false
    default:
      break
  }
  return true
}
defineExpose({ getData, setData, init })
</script>
<style lang="scss" scoped>
.ai-button-list {
  gap: var(--app-space-xs);
  .el-button {
    margin: unset;
    padding: unset;
  }
}
</style>

<style lang="scss">
.field-wrapper,
.static-content-item,
.slot-wrapper-render {
  //height: 100%;
}
.ai-suggestion-wrapper {
  width: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  margin-bottom: calc(var(--app-space-xs) * 2);
}
// padding: 24px 0 18px;
.ai-suggestion-content {
  --icon-color: #fff;
  --icon-size: 0.8rem;
  font-size: 0.8rem;
  padding: var(--app-space-xs);
  background-color: #ffc401;
  color: #fff;
  border-radius: calc(var(--app-space-xs) * 2);
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  gap: var(--app-space-xs);
  line-height: 1;

  pre {
    font-style: normal;
    font-weight: normal;
    padding: unset;
    margin: unset;
    white-space: pre-wrap; /* css-3 */
    word-wrap: break-word; /* InternetExplorer5.5+ */
    white-space: -moz-pre-wrap; /* Mozilla,since1999 */
    white-space: -pre-wrap; /* Opera4-6 */
    white-space: -o-pre-wrap;
    word-break: break-all;
  }
  .iconButton {
    cursor: pointer;
  }
  &--disabled {
    background-color: var(--app-grey-950);
    padding-right: var(--app-space-s);
  }
}
.meta-render-form {
  // padding: var(--app-space-xs);
  overflow: auto;
  .static-content-item {
    min-height: unset !important;
  }
  .invisible-content {
    background-color: aqua;
    min-height: unset;
    display: none;
  }
}
.meta-button-flex-end {
  display: flex !important;
  align-items: flex-end;
  .el-button {
    margin-bottom: 18px;
  }
}
</style>
