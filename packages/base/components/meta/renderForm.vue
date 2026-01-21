<template>
  <div v-loading="state.loading" style="height: 100%">
    <FormVariablesRenderer class="meta-render-form" ref="FormVariablesRendererRef" @formChange="formChange" @handleApply="handleApply">
      <template v-for="item in state.variables" v-slot:[`slot-${item.name}`]>
        <div class="ai-suggestion-wrapper">
          <div v-if="state.aiAnalysis && state.aiAnalysis[item.name]" :id="`slot-${item.name}`" :key="item.name" class="ai-suggestion-content">
            <SvgIcon src="/icons/file/ai.svg" />
            <pre>{{ state.aiAnalysis[item.name].label || state.aiAnalysis[item.name].value }}</pre>
            <div class="flex-x-start ai-button-list">
              <ElIcon class="iconButton" @click="aiFormChange(item.name, state.aiAnalysis[item.name])">
                <Check />
              </ElIcon>
              <ElIcon class="iconButton" @click="deleteAiSuggestion(item.name)">
                <Close />
              </ElIcon>
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
import { clientApi } from 'api'
import { Check, Close } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'

type initMetaFormOptions = {
  isFolder?: boolean
  aiAnalysis?: any
  aiDocId?: string
}
const { t } = useI18n()
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
const metaDateFormat = userDisplayTimeSetting()
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
const ignoreList = [
  'dc:title',
  'dc:creator',
  'dc:modified',
  'dc:lastContributor',
  'dc:created',
  'dc:publisher',
  'dc:contributors',
  'common:icon',
  'common:icon-expanded',
  'uid:uid',
  'uid:major_version',
  'uid:minor_version',
  'file:content',
  'files:files',
  'nxtag:tags',
  'relatedtext:relatedtextresources',
  'sec:clearanceLevel',
  'sec:securityKeyword'
]
// #region module: Variables
const FormVariablesRendererRef = ref()

async function getVariables(isFolder: boolean = false) {
  try {
    const date = new Date().valueOf()
    state.variables = []
    state.data.forEach((item: any, index: any) => {
      if (!item.options) item.options = {}
      if (item.display && ignoreList.indexOf(item.metaData) === -1) {
        const _item: any = {
          name: item.metaData,
          label: t(item.metaData),
          type: item.dataType || 'input',
          required: item.isRequire || false,
          options: {}
        }

        switch (item.dataType) {
          case 'input':
          case 'textarea':
            if (item.options?.length) _item.options.maxLength = item.options.length
            if (item.options?.regex) _item.options.onValidate = getValidate(item.options.regex)
            // _item.onValidate = getValidate('^[a-zA-Z_][a-zA-Z0-9_]*$')
            if (!_item.options.maxLength) _item.options.maxLength = 200
            break
          case 'date':
            if (metaDateFormat) {
              _item.options.format = metaDateFormat
              if (metaDateFormat?.includes('HH') || metaDateFormat?.includes('hh')) _item.options.type = 'datetime'
            }
            break
          case 'select':
            if (item.values) _item.options.optionItems = item.values
            _item.options.clearable = true
            _item.options.filterable = true
            _item.options.multiple = item.options.multiple
            if (!_item.options.multipleLimit) _item.options.multipleLimit = 5
            break
          default:
            break
        }
        if (item.metaDataType === 'array') {
          _item.options = { ..._item.options, multiple: true }
        }
        state.variables.push(_item)
      }
    })
    // if(props.showOcrLanguage) {
    //     const index = state.variables.findIndex(item => item.name === 'dc:language')
    //     if(index !== -1) state.variables.splice(index, 1)
    //
    //     const language = await getOcrSupportedLanguage()
    //     state.variables.unshift({
    //         name: 'dc:language',
    //         label: t('filePopover_OCRLanguages'),
    //         type: 'select',
    //         required: true,
    //         options: {
    //             optionItems: language.map((item) => ({ label: t(`dpLanuage.${item}`), value: item }) ),
    //             clearable: false,
    //             filterable: true,
    //             multipleLimit: 2,
    //             multiple: true
    //         }
    //     })
    // }

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

    if (['folderCabinet'].includes(props.mode)) {
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

    if (['ai', 'upload'].includes(props.mode)) {
      state.variables.unshift({
        name: 'docName',
        label: t('tableHeader_name'),
        type: 'input',
        required: true,
        options: {
          clearable: false
        }
      })
    }

    nextTick(async () => {
      const formJson = await FormVariablesRendererRef.value.createJson(state.variables)
      if (props.mode === 'fileRequest') {
        const newFormJson = getApplyFormJson(formJson)
        FormVariablesRendererRef.value.setFormJson(newFormJson)
      } else if (props.mode === 'ai' || props.mode === 'ai-edit') {
        const newFormJson = getAIFormJson(formJson)
        FormVariablesRendererRef.value.setFormJson(newFormJson)
      }
    })
  } catch (error) {}
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

function getValidate(rule = '^[a-zA-Z_][a-zA-Z0-9_]*$') {
  return `if(!/${rule}/.test(value)) callback(new Error("${rule}")) \nelse callback()`
}

function clear() {
  state.variables = []
  FormVariablesRendererRef.value.createJson(state.variables)
}

async function init(documentType: any, initOptions: initMetaFormOptions = {}) {
  state.initOptions = { ...initOptions, documentType }
  if (!documentType) {
    clear()
    return
  }
  try {
    state.loading = true
    state.data = []
    state.variables = []

    state.data = await clientApi.api.postTypesMetadatas({ name: documentType }).then((res) => res.data)

    await getVariables(initOptions?.isFolder)
    if (props.mode === 'ai' || props.mode === 'ai-edit') {
      if (initOptions.aiAnalysis) state.aiAnalysis = initOptions.aiAnalysis
      if (initOptions.aiDocId) state.aiDocId = initOptions.aiDocId
    }
  } catch (error) {}
  state.loading = false
}

// #endregion
async function setData(properties: any) {
  const data = deepCopy(properties)
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
  setTimeout(() => {
    FormVariablesRendererRef.value.setData(data)
  })
  // return await FormVariablesRendererRef.value.setData(properties)
}

async function getData() {
  const data = await FormVariablesRendererRef.value.getData()
  if (!data) return
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
  return Object.keys(data).reduce((prev: any, key) => {
    prev[key] = data[key] ? data[key] : ''
    return prev
  }, {})
}

async function formChange(formData: any) {
  emits('formChange', formData)
  if (!['changeDocType'].includes(props.mode)) return
  const { fieldName, formModel, newValue, oldValue } = formData
  if (fieldName === 'documentType' && newValue !== oldValue && !!oldValue) {
    await init(newValue, state.initOptions)
    setTimeout(() => {
      setData({ ...state.initData, documentType: newValue })
    })
  }
}

async function aiFormChange(key: any, analysis: any) {
  FormVariablesRendererRef.value.setData({
    [key]: analysis.value
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
    const res = await clientApi.api.patchDmsDocumentUpdateaidocument(params).then(r => r.data)
    delete state.aiAnalysis[deleteName]
  } catch (error) {}
}

function handleApply(formModel: any) {
  emits('handleApply', formModel)
}

// #region module: Validate
async function getValidateMsg(documentType: string, properties?: any) {
  let msg = ''
  const metaList = await clientApi.api.postTypesMetadatas({ name: documentType }).then((res) => res.data)
  if (!metaList) return msg
  metaList.forEach((metaItem: any) => {
    if (!metaItem.display || ignoreList.includes(metaItem.metaData)) return
    if (metaItem.isRequire) {
      if (!properties || !properties[metaItem.metaData] || (properties[metaItem.metaData] instanceof Array && properties[metaItem.metaData].length === 0)) {
        msg += `[${t(metaItem.metaData)}]: ${t('common_canNotEmpty')}<br/>`
      }
    }
  })
  return msg
}

async function getErrorMessage(doc, docKey) {
  const _msg = await getValidateMsg(doc.documentType, deepCopy(doc.properties))
  if (_msg) return `<h4 class="msg-h4">${doc[docKey]}:</h4>${_msg}`
  return ''
}

// docListItem: name,properties, documentType
async function checkMetaValidate(docList: any[], docKey: string = 'name') {
  const pList: any = []
  docList.forEach((item) => {
    if (!item.properties) item.properties = {}
    const pItem = getErrorMessage(item, docKey)
    pList.push(pItem)
  })
  let errorMessage = await Promise.all(pList)
  errorMessage = errorMessage.filter((item) => !!item)
  if (errorMessage.length > 0) {
    ElMessageBox.confirm(errorMessage.join('<br>'), t('dpTip_warning'), {
      dangerouslyUseHTMLString: true,
      confirmButtonText: t('dpButtom_confirm')
    })
    // throw new Error("error");
  }
  return errorMessage.length === 0
}

// #endregion
function GetActiveDocpalTypeWithIsFolderApi(isFolder: boolean) {
  try {
    const docList: any = clientApi.api.getDmsDocpalTypeActive().then((res: any) => res.data)
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

defineExpose({ getData, setData, init, getValidateMsg, checkMetaValidate })
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
}

.meta-render-form {
  // padding: var(--app-space-xs);
  width: 99%;
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
