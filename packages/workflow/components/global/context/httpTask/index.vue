<script setup lang="ts">
import type { Node } from '@antv/x6'
import { QuestionFilled } from '@element-plus/icons-vue'

const { t } = useI18n()
const { node } = defineProps<{
  node: Node
}>()
const variablesParamsRef = ref()
const variablesHeaderRef = ref()
const bodyDialogRef = ref()
const outputMappingDialogRef = ref()

const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}

const { getVariablesByType } = useVariablesProvide()
const stringFields = computed(() => {
  return getVariablesByType(['string'])
})

const state = reactive({
  method: ['GET', 'POST', 'PUT', 'PATH', 'DELETE'],
  requestParams: '',
  requestHeader: '',
  requestBody: ''
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
  const config = data.config.http_request

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

  // To Params
  const paramsArray = extractParamsFromUrl(formData.value.url)
  if (paramsArray.length > 0) {
    state.requestParams = paramsArray
      .filter((item) => item.key)
      .map((item) => `${item.key.trim()}=${item.value.trim()}`)
      .join('&')
  }

  state.requestHeader = Object.entries(formData.value.headers)
    .map(([key, value]) => `${key.trim()}: ${String(value).trim()}`)
    .join('\n')
  state.requestBody = Object.entries(formData.value.body)
    .map(([key, value]) => `${key.trim()}: ${String(value).trim()}`)
    .join('\n')
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

function handleUpdateUrl() {
  const paramsArray = extractParamsFromUrl(formData.value.url)
  if (paramsArray.length > 0) {
    state.requestParams = paramsArray
      .filter((item) => item.key)
      .map((item) => `${item.key.trim()}=${item.value.trim()}`)
      .join('&')
  }
  updateData()
}

function handleUpdateParams(visible: any) {
  if (visible.length > 0 && Array.isArray(visible)) {
    state.requestParams = visible
      .filter((item) => item.key)
      .map((item) => `${item.key.trim()}=${item.value.trim()}`)
      .join('&')

    // update url
    const urlArray = formData.value.url.split('?')
    if (!urlArray || urlArray[0] === '') return

    if (urlArray.length > 1) {
      formData.value.url = urlArray[0] + '?' + state.requestParams
    } else {
      formData.value.url = formData.value.url + '?' + state.requestParams
    }
  } else {
    state.requestParams = ''
    const urlArray = formData.value.url.split('?')
    if (!urlArray || urlArray[0] === '') return
    formData.value.url = urlArray[0]
  }
  updateData()
}

function handleUpdateHeader(visible: any) {
  if (visible.length > 0 && Array.isArray(visible)) {
    state.requestHeader = visible
      .filter((item) => item.key)
      .map((item) => `${item.key.trim()}: ${item.value.trim()}`)
      .join('\n')

    formData.value.headers = visible.reduce((acc, { key, value }) => {
      acc[key] = value
      return acc
    }, {})
  } else {
    state.requestHeader = ''
  }
  updateData()
}

function handleUpdateBody(body: any) {
  formData.value.body = body
  state.requestBody = Object.entries(body)
    .map(([key, value]) => `${key.trim()}: ${String(value).trim()}`)
    .join('\n')
  updateData()
}

function handleOpenResponseDialog() {
  // outputMappingRef.value.open()
  outputMappingDialogRef.value.open()
}

function handleOutputMapping(mapping: any) {
  formData.value.output_mapping = mapping
  updateData()
}

const outputMapping = computed(() => {
  return Object.entries(formData.value.output_mapping).map(([key, value]) => ({
    name: key,
    value: String(value ?? '')
  }))
})

function openBodyEdit() {
  bodyDialogRef.value.open(formData.value.body)
}

function updateData() {
  graphProvider?.graph.value?.startBatch('update-http-field-data')

  const nodeData = node.getData()
  const newData = {
    ...nodeData,
    config: {
      ...nodeData.config,
      http_request: formData.value
    },
    version: (nodeData.version || 0) + 1
  }

  node.setData(newData, { overwrite: true, deep: true, silent: false })
  graphProvider?.graph.value?.stopBatch('update-http-field-data')
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
      <el-select v-model="formData.method" placeholder="please select your zone">
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
      <el-input v-model="formData.url" @change="handleUpdateUrl" />
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

    <el-form-item :label="t('Response Mapping')">
      <el-button size="small" type="primary" style="width: 100%" @click="handleOpenResponseDialog">Add Response Mapping</el-button>
    </el-form-item>

    <el-divider />

    <div class="output-mapping-summary">
      <template v-if="outputMapping.length">
        <div v-for="(item, index) in outputMapping" :key="`${item.name}-${index}`" class="output-mapping-row">
          <span class="output-mapping-key" :title="item.name">{{ item.name }}</span>
          <span class="output-mapping-arrow" aria-hidden="true">--</span>
          <span class="output-mapping-val" :title="item.value">{{ item.value }}</span>
        </div>
      </template>
      <p v-else class="output-mapping-empty">{{ t('No response mapping yet') }}</p>
    </div>
  </el-form>

  <LazyContextHttpTaskVariables ref="variablesParamsRef" :title="t('Add Params')" @update="handleUpdateParams" />
  <LazyContextHttpTaskVariables ref="variablesHeaderRef" :title="t('Add Header')" @update="handleUpdateHeader" />
  <LazyContextHttpTaskDialog ref="bodyDialogRef" @submit="handleUpdateBody" />

  <!--  <LazyContextHttpTaskOutputMapping ref="outputMappingRef" @update="handleOutputMapping" />-->
  <LazyContextHttpTaskOutputMappingDialog ref="outputMappingDialogRef" :mapping="formData.output_mapping" @update="handleOutputMapping" />
</template>

<style scoped lang="scss">
.error {
  color: red;
  margin-top: 10px;
}

.output-mapping-summary {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs, 8px);
  width: 100%;
}

.output-mapping-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1.5fr);
  align-items: center;
  gap: var(--app-space-xs, 8px);
  padding: var(--app-space-s, 10px) var(--app-space-m, 12px);
  border: 1px solid var(--app-grey-800, #dcdfe6);
  border-radius: var(--app-border-radius-m, 6px);
  background: var(--app-grey-9000, #fafafa);
  font-size: 13px;
  line-height: 1.45;
}

.output-mapping-key {
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.output-mapping-arrow {
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.output-mapping-val {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: rgb(57, 57, 57);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.output-mapping-empty {
  margin: 0;
  padding: var(--app-space-m, 12px);
  text-align: center;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  border: 1px dashed var(--app-grey-800, #dcdfe6);
  border-radius: var(--app-border-radius-m, 6px);
  background: var(--el-fill-color-lighter);
}
</style>
