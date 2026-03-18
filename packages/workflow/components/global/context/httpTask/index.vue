<script setup lang="ts">
import type { Node } from '@antv/x6'
import { Codemirror } from 'vue-codemirror'
import { linter } from '@codemirror/lint'
import { json, jsonParseLinter } from '@codemirror/lang-json'
import { oneDark } from '@codemirror/theme-one-dark'
import { QuestionFilled } from '@element-plus/icons-vue'


const { t } = useI18n()
const { node } = defineProps<{
  node: Node
}>()
const variablesParamsRef = ref()
const variablesHeaderRef = ref()

const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}

const { getVariablesByType } = useVariablesProvide()
const stringFields = computed(() => {
  return getVariablesByType('string')
})

const state = reactive({
  method: ['GET', 'POST', 'PUT', 'PATH', 'DELETE'],
  requestMethod: '',
  requestUrl: '',
  requestParams: '',
  requestHeader: '',
  requestBody: '',
  responseBodyName: '',
  saveResponseVariableAsJson: false,
  saveResponseParametersTransient: false,
  saveResponseParameters: false,
  disallowRedirects: false,
  ignoreException: true,
  bodyVisible: false
})

const formData = ref({
  method: 'GET',
  url: '',
  headers: {},
  body: {},
  output_mapping: {},
  celCondition: {},
  inputSchema: {},
  outputSchema: {}
})

function initForm() {
  const data = node.getData()
  const config = data.config
  formData.value = {
    method: config.method || 'GET',
    url: config.url || '',
    headers: config.headers || {},
    body: config.body || {},
    output_mapping: config.output_mapping || {},
    celCondition: config.celCondition || {},
    inputSchema: config.inputSchema || {},
    outputSchema: config.outputSchema || {}
  }
}

function fieldMappingUpdate(newVal: string, name: string) {
  graphProvider?.graph.value?.startBatch('update-http-field-data')

  const nodeData = node.getData()
  const newData = {
    ...nodeData,
    config: {
      ...nodeData.config,
      ...formData.value
    },
    version: (nodeData.version || 0) + 1
  }
  node.setData(newData, { overwrite: true, deep: true, silent: false })

  graphProvider?.graph.value?.stopBatch('update-http-field-data')
}

function fieldBooleanMappingUpdate(newVal: boolean, name: string) {
  graphProvider?.graph.value?.startBatch('update-http-field-data')

  const nodeData = node.getData()
  const newData = {
    ...nodeData,
    version: (nodeData.version || 0) + 1
  }
  const index = newData.data.extensionElements['flowable:field'].findIndex((f: any) => f.attr_name === name)
  newData.data.extensionElements['flowable:field'][index]['flowable:expression'].__cdata = newVal || false
  node.setData(newData, { overwrite: true, deep: true, silent: false })

  graphProvider?.graph.value?.stopBatch('update-http-field-data')
}

function extractParamsFromUrl(url: string) {
  try {
    const urlObj = new URL(url)
    const paramsArray = []
    for (const [key, value] of urlObj.searchParams.entries()) {
      paramsArray.push({ key, value })
    }
    return paramsArray
  } catch (e) {
    // 不是标准 URL，返回空数组
    return []
  }
}

function openVisible(status: string) {
  if (status === 'Params') {
    const paramsArray: any = state.requestParams
      ? state.requestParams.split('&').map((item) => {
          const [key, value] = item.split('=')
          return { key, value }
        })
      : []
    variablesParamsRef.value.openDrawer(paramsArray)
  } else {
    const headerArray: any = state.requestHeader
      ? state.requestHeader.split('\n').map((item) => {
          const [key, value] = item.split(': ')
          return { key, value }
        })
      : []
    variablesHeaderRef.value.openDrawer(headerArray)
  }
}

function handleUpdateParams(visible: any) {
  if (visible.length > 0 && Array.isArray(visible)) {
    state.requestParams = visible
      .filter((item) => item.key)
      .map((item) => `${item.key.trim()}=${item.value.trim()}`)
      .join('&')

    // update url
    const urlArray = state.requestUrl.split('?')
    if (!urlArray || urlArray[0] === '') return

    if (urlArray.length > 1) {
      state.requestUrl = urlArray[0] + '?' + state.requestParams
    } else {
      state.requestUrl = state.requestUrl + '?' + state.requestParams
    }
    fieldMappingUpdate(state.requestUrl, 'requestUrl')
  } else {
    state.requestParams = ''
  }
}

function handleUpdateHeader(visible: any) {
  if (visible.length > 0 && Array.isArray(visible)) {
    state.requestHeader = visible
      .filter((item) => item.key)
      .map((item) => `${item.key.trim()}: ${item.value.trim()}`)
      .join('\n')
  } else {
    state.requestHeader = ''
  }
  fieldMappingUpdate(state.requestHeader, 'requestHeaders')
}

const codeMirror = reactive({
  data: '',
  extensions: [json(), linter(jsonParseLinter()), oneDark],
  checkFormat: false,
  errorMessage: ''
})

function openBodyEdit() {
  state.bodyVisible = true
  if (state.requestBody !== '') {
    codeMirror.data = deepCopy(state.requestBody)
  } else {
    codeMirror.data = ''
  }
}

function handleJsonFormat() {
  if (!checkJsonFormat()) {
    codeMirror.data = JSON.stringify(JSON.parse(codeMirror.data), null, 2)
    codeMirror.errorMessage = ''
  }
}

function checkJsonFormat() {
  if (!codeMirror.checkFormat) {
    return false
  }
  try {
    JSON.parse(codeMirror.data)
    codeMirror.errorMessage = ''
    return false
  } catch (e) {
    codeMirror.errorMessage = 'Unable to format JSON: ' + e.message
    return true
  }
}

function handleJsonFormatCheck() {
  if (!codeMirror.checkFormat) {
    codeMirror.errorMessage = ''
  } else {
    checkJsonFormat()
  }
}

function handleRequestBodySubmit() {
  // Because of the interpolation syntax, json syntax checks throw error, so no detection is done when submitting
  if (checkJsonFormat()) {
    return
  }
  state.requestBody = codeMirror.data
  fieldMappingUpdate(state.requestBody, 'requestBody')
  state.bodyVisible = false
}

watch(
  () => node,
  async () => {
    if (node) {
      initForm()
    }
  },
  {
    immediate: true,
    deep: true
  }
)
</script>

<template>
  <SidebarLabel :node="node" />
  <el-form label-width="auto" label-position="top" :disabled="graphProvider.readonly.value">
    <el-form-item :label="t('Request Method')">
      <el-select v-model="formData.method" placeholder="please select your zone" @change="(val: any) => fieldMappingUpdate(val, 'requestMethod')">
        <el-option v-for="item in state.method" :key="item" :label="item" :value="item" />
      </el-select>
    </el-form-item>

    <el-form-item>
      <template #label>
        <div style="display: flex; align-items: center; gap: 4px">
          <span>{{ t('Request Url') }}</span>
          <el-popover width="300" title="Info" content="You can set data through '${key}'" placement="top">
            <template #reference>
              <el-icon style="cursor: pointer; color: #909399">
                <QuestionFilled />
              </el-icon>
            </template>
          </el-popover>
        </div>
      </template>
      <el-input v-model="formData.url" @change="(val: any) => fieldMappingUpdate(val, 'requestUrl')" />
    </el-form-item>

    <el-form-item :label="t('Request Params')">
      <div style="display: flex; gap: 8px; align-items: flex-start; width: 100%">
        <el-input disabled v-model="state.requestParams" style="flex: 1" />
        <div style="display: flex; align-items: center; justify-content: flex-end; min-width: fit-content">
          <el-button type="primary" @click="openVisible('Params')">
            {{ t('Add Params') }}
          </el-button>
        </div>
      </div>
    </el-form-item>

    <el-form-item :label="t('Request Headers')">
      <div style="display: flex; gap: 8px; align-items: flex-start; width: 100%">
        <el-input type="textarea" rows="2" :autosize="{ minRows: 2, maxRows: 6 }" resize="none" disabled v-model="state.requestHeader" style="flex: 1" />
        <div style="display: flex; align-items: center; justify-content: flex-end; min-width: fit-content">
          <el-button type="primary" @click="openVisible('Headers')">
            {{ t('Add Header') }}
          </el-button>
        </div>
      </div>
    </el-form-item>

    <el-form-item :label="t('Request Body')">
      <div style="display: flex; gap: 8px; align-items: flex-start; width: 100%">
        <el-input type="textarea" rows="2" :autosize="{ minRows: 2, maxRows: 6 }" resize="none" disabled v-model="state.requestBody" style="flex: 1" />
        <div style="display: flex; align-items: center; justify-content: flex-end; min-width: fit-content">
          <el-button type="primary" @click="openBodyEdit">
            {{ t('Add Body') }}
          </el-button>
        </div>
      </div>
    </el-form-item>
  </el-form>

  <LazyBpmnContextHttpVariables ref="variablesParamsRef" :title="t('Add Params')" @update="handleUpdateParams" />
  <LazyBpmnContextHttpVariables ref="variablesHeaderRef" :title="t('Add Header')" @update="handleUpdateHeader" />

  <el-dialog v-model="state.bodyVisible" :title="t('Edit Request Body')" append-to-body>
    <div style="display: flex; align-items: center; justify-content: space-between">
      <div style="display: flex; align-items: center">
        <span>Json</span>
        <el-popover
          class="box-item"
          width="300"
          title="Info"
          content="You can set data using {key}. Using interpolation syntax will fail the JSON syntax check. Please disable syntax checking and check whether the interpolation syntax is correct."
          placement="top"
        >
          <template #reference>
            <div style="display: flex; align-items: center; margin-left: 8px; cursor: pointer; color: #909399">
              <el-icon>
                <QuestionFilled />
              </el-icon>
            </div>
          </template>
        </el-popover>
      </div>
    </div>
    <div>
      {{ t('JSON Format Check') }}
      <el-switch v-model="codeMirror.checkFormat" size="small" @change="handleJsonFormatCheck" />
      <el-button v-if="codeMirror.checkFormat" style="margin-left: 20px" @click="handleJsonFormat" type="primary" size="small"> JSON Format </el-button>
    </div>

    <div v-if="codeMirror.errorMessage" class="error">{{ codeMirror.errorMessage }}</div>
    <codemirror
      v-model="codeMirror.data"
      :style="{ height: '400px' }"
      :autofocus="true"
      :indent-with-tab="true"
      :tab-size="2"
      :extensions="codeMirror.extensions"
      @change="checkJsonFormat"
    />
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="handleRequestBodySubmit"> {{ t('common_submit') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.error {
  color: red;
  margin-top: 10px;
}
</style>
