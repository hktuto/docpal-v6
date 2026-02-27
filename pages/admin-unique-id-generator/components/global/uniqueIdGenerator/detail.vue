<template>
  <div class="pageContainer--padding" style="height: 100%; overflow: auto">
    <el-row>
      <el-col :span="12">
        <el-form ref="formRef" :model="state.form" label-width="auto" @submit.native.prevent>
          <el-form-item
            :label="t('uniQueIdGenerator_idGeneratorName')"
            label-position="top"
            prop="name"
            :rules="[{ required: true, message: t('uniQueIdGenerator_idGeneratorName') + t('render.hint.fieldRequired') }]"
          >
            <el-input clearable v-model="state.form.name" />
          </el-form-item>
          <el-form-item
            :label="t('uniQueIdGenerator_prefix')"
            label-position="top"
            prop="prefix"
            :rules="[{ required: true, message: t('uniQueIdGenerator_prefix') + t('render.hint.fieldRequired') }]"
          >
            <el-input-tag
              v-model="state.prefix"
              draggable
              clearable
              :placeholder="t('uniQueIdGenerator_prefix')"
              tag-effect="dark"
              tag-type="primary"
              @change="handleChangeTag(true)"
            >
              <template #tag="{ value, index }">
                <span @dblclick="handleEditVariable(true, value, index)">{{ value }}</span>
              </template>
            </el-input-tag>
          </el-form-item>
          <div class="mb-4" style="margin-bottom: 18px">
            <el-button id="UniqueId_Detail__Prefix__Date" :icon="Plus" @click="handleDate(true, true)">
              {{ t('uniQueIdGenerator_date') }}
            </el-button>
            <el-button id="UniqueId_Detail__Prefix__Variable" :icon="Plus" @click="handleVariable(true, false)">
              {{ t('uniQueIdGenerator_variable') }}
            </el-button>
          </div>
          <el-form-item :label="t('uniQueIdGenerator_suffix')" label-position="top">
            <el-input-tag
              v-model="state.suffix"
              draggable
              clearable
              :placeholder="t('uniQueIdGenerator_suffix')"
              tag-effect="dark"
              tag-type="primary"
              @change="handleChangeTag(false)"
            >
              <template #tag="{ value, index }">
                <span @dblclick="handleEditVariable(false, value, index)">{{ value }}</span>
              </template>
            </el-input-tag>
          </el-form-item>
          <div class="mb-4" style="margin-bottom: 18px">
            <el-button id="UniqueId_Detail__Suffix__Date" :icon="Plus" @click="handleDate(false, true)">
              {{ t('uniQueIdGenerator_date') }}
            </el-button>
            <el-button id="UniqueId_Detail__Suffix__Variable" :icon="Plus" @click="handleVariable(false, false)">
              {{ t('uniQueIdGenerator_variable') }}
            </el-button>
          </div>
          <el-form-item
            :label="t('uniQueIdGenerator_idDigit')"
            label-position="top"
            prop="idDigit"
            :placeholder="t('uniQueIdGenerator_idDigit')"
            :rules="[{ required: true, message: t('uniQueIdGenerator_idDigit') + t('render.hint.fieldRequired') }]"
          >
            <el-input type="number" min="1" clearable v-model.number="state.form.idDigit" />
          </el-form-item>
          <el-form-item
            :label="t('uniQueIdGenerator_startingNumber')"
            label-position="top"
            prop="startNumber"
            :rules="[{ required: true, message: t('uniQueIdGenerator_startingNumber') + t('render.hint.fieldRequired') }]"
          >
            <el-input type="number" min="1" clearable v-model.number="state.form.startNumber" />
          </el-form-item>
        </el-form>
        <el-button id="UniqueId_Detail__Save" type="primary" @click="handleSubmit()">
          {{ t('common_save') }}
        </el-button>
        <el-divider />
      </el-col>
    </el-row>

    <el-col :span="12">
      <h3>{{ t('uniQueIdGenerator_example') }}</h3>
      <h4>{{ t('uniQueIdGenerator_setting') }}</h4>
      <h5 v-if="state.example.prefix.length > 0">{{ t('uniQueIdGenerator_prefix') }}</h5>
      <div v-for="(item, index) in state.example.prefix">
        <el-form-item v-if="item.type == 'variable'" :label="handleLabel(item.type, item.expression)"
                      label-position="top">
          <el-input v-model="item.value" :formatter="(value: string) => handleExampleData(item.type, value)" />
        </el-form-item>
      </div>
      <h5 v-if="state.example.suffix.length > 0">{{ t('uniQueIdGenerator_suffix') }}</h5>
      <div v-for="(item, index) in state.example.suffix">
        <el-form-item v-if="item.type == 'variable'" :label="handleLabel(item.type, item.expression)"
                      label-position="top">
          <el-input v-model="item.value" :formatter="(value: string) => handleExampleData(item.type, value)"></el-input>
        </el-form-item>
      </div>
      <el-divider />
      <el-form-item :label="t('Id')" label-position="top">
        <el-input disabled v-model="state.uniqueId" />
      </el-form-item>
      <el-button id="UniqueId_Detail__Generate" @click="handleGenerateId">
        {{ t('uniQueIdGenerator_generate') }}
      </el-button>
    </el-col>
  </div>

  <el-dialog
    v-model="state.dialogFormVisible"
    width="500"
    :title="state.isAddVariable ? t('uniQueIdGenerator_creatDateVariable') : t('uniQueIdGenerator_creatTextVariable')"
  >
    <FormRenderer ref="FormRendererRef" :form-json="formJson" />
    <template #footer>
      <el-button id="UniqueId_Detail__NewVariable__Confirm" type="primary" @click="handleAddItemTag">
        {{ t('dpButtom_confirm') }}
      </el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="state.editVisible" width="500" :title="t('uniQueIdGenerator_editTextVariable')">
    <FormRenderer ref="editFormRendererRef" :form-json="state.editFormJson" />
    <template #footer>
      <el-button id="UniqueId_Detail__EditVariable__Confirm" type="primary" @click="handleEditItemTag">
        {{ t('dpButtom_confirm') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { newAdminApi } from 'api'
import formJson from '../../uniqueIdGenerator/addTagForm.vform.json'
import editDateTagForm from '../../uniqueIdGenerator/editDateTagForm.vform.json'
import editStringTagForm from '../../uniqueIdGenerator/editStringTagForm.vform.json'
import editVariableTagForm from '../../uniqueIdGenerator/editVariableTagForm.vform.json'
import { Plus } from '@element-plus/icons-vue'

const formRef = ref()
const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const { id } = defineProps<{
  id: string
}>()
const FormRendererRef = ref()
const editFormRendererRef = ref()
const state = reactive({
  loading: false,
  isAddVariable: true,
  dialogFormVisible: false,
  editVisible: false,
  editFormJson: {},
  prefix: [],
  suffix: [],
  uniqueId: '',
  form: {
    id: '',
    name: '',
    prefix: [],
    suffix: [],
    idDigit: 4,
    startNumber: 1
  },
  example: {
    prefix: [],
    suffix: [],
    idDigit: 4,
    startNumber: 1
  }
})

interface ItemRule {
  index: number
  expression: string
  type: string
  value: string
}

let itemData = reactive<ItemRule>({
  index: 0,
  expression: '',
  type: '',
  value: ''
})

function handleLabel(type: string, value: string) {
  if (type === 'string') {
    return 'string'
  }

  const label = handleDataFormat(value)
  if (type === 'date') {
    return `Date(${label})`
  }

  return label
}

function handleDataFormat(value: string) {
  const regex = /\(([^)]+)\)/
  const match = value.match(regex)
  return match ? match[1] : value
}

function handleExampleData(type: string, value: string) {
  try {
    if (type === 'date') {
      return formatDate(new Date(), value)
    }
    if (type === 'string') {
      return value
    }
    return value
  } catch (e) {
    console.log(e)
  }
}

async function handleGenerateId() {
  try {
    state.example.idDigit = state.form.idDigit
    state.example.startNumber = state.form.startNumber
    state.uniqueId = await newAdminApi.postDocpalIdTemplatesValidate(state.example).then((res) => res.data)
  } catch (e) {
    console.log(e)
  }
}

/**
 * @param status (true: prefix,false: suffix)
 * @param setting (true: date setting, false: var setting)
 */
async function handleDate(status: boolean, setting: boolean) {
  state.isAddVariable = setting
  itemData.type = 'date'
  setTimeout(() => {
    FormRendererRef.value.vFormRenderRef.resetForm()
    FormRendererRef.value.vFormRenderRef.setFormData({ isShow: true, isPrefix: status, isDateType: setting })
  }, 100)
  state.dialogFormVisible = true
}

/**
 * @param status (true: prefix,false: suffix)
 * @param setting (true: date setting, false: variable setting)
 */
function handleVariable(status: boolean, setting: boolean) {
  state.isAddVariable = setting
  itemData.type = 'variable'
  setTimeout(() => {
    FormRendererRef.value.vFormRenderRef.resetForm()
    FormRendererRef.value.vFormRenderRef.setFormData({ isShow: false, isPrefix: status, isDateType: setting })
  }, 100)
  state.dialogFormVisible = true
}

/**
 * @param status (true: prefix,false: suffix)
 * @param value value
 * @param index index
 */
async function handleEditVariable(status: boolean, value: string, index: number) {
  state.loading = false
  let item: any
  if (status) {
    item = state.form.prefix[index]
  } else {
    item = state.form.suffix[index]
  }
  if (!item) return

  // set Data
  let json
  let data
  switch (item.type) {
    case 'date':
      json = editDateTagForm
      data = {
        index: index,
        type: item.type,
        isPrefix: status,
        dateFormat: item.value
      }
      break
    case 'variable':
      json = editVariableTagForm
      data = {
        index: index,
        type: item.type,
        isPrefix: status,
        variableName: handleDataFormat(item.expression),
        variableValue: item.value
      }
      break
    default:
      json = editStringTagForm
      data = {
        index: index,
        type: item.type,
        isPrefix: status,
        stringValue: item.value
      }
  }
  if (!json || !data) {
    console.error('no json or data')
  }
  setTimeout(() => {
    editFormRendererRef.value.setFormJson(json)
    editFormRendererRef.value.vFormRenderRef.resetForm()
    editFormRendererRef.value.setFormData(data)
  }, 100)
  state.editVisible = true
}

async function handleEditItemTag() {
  try {
    const formData = await editFormRendererRef.value.getFormData()
    const index = formData.index
    let checkNameIsEx = false

    let item = {}
    switch (formData.type) {
      case 'date':
        item.expression = `{date(${formData.dateFormat})}`
        item.value = formData.dateFormat
        break
      case 'variable':
        item.expression = `{var(${formData.variableName})}`
        item.value = formData.variableValue
        const expression = item.expression
        if (
          (state.prefix[index] != expression && state.prefix.includes(expression)) ||
          (state.suffix[index] != expression && state.suffix.includes(expression))
        ) {
          checkNameIsEx = true
        }
        break
      default:
        item.expression = formData.stringValue
        item.value = formData.stringValue
    }

    // Check if the name exists
    if (checkNameIsEx) {
      routerProvider?.message.error(t('dpTip.exit', { name: t('uniQueIdGenerator_variableName') }))
      return
    }

    if (formData.isPrefix) {
      state.prefix[index] = item.expression
      const element = state.form.prefix[index]
      item.type = element.type
      item.index = element.index
      state.form.prefix[index] = deepCopy(item)
      state.example.prefix[index] = deepCopy(item)
    } else {
      state.suffix[index] = item.expression
      const element = state.form.suffix[index]
      item.type = element.type
      item.index = element.index
      state.form.suffix[index] = deepCopy(item)
      state.example.suffix[index] = deepCopy(item)
    }
    state.editVisible = false
  } catch (error: any) {
    throw new Error(error)
  }
}

async function handleAddItemTag() {
  try {
    let formData = await FormRendererRef.value.getFormData()
    if (formData.isDateType) {
      itemData.expression = `{date(${formData.dateFormat})}`
      itemData.value = formData.dateFormat
    } else {
      itemData.expression = `{var(${formData.variableName})}`
      itemData.value = formData.variableValue
      // Check if the name exists
      if (state.prefix.includes(itemData.expression) || state.suffix.includes(itemData.expression)) {
        routerProvider?.message.error(t('dpTip.exit', { name: t('uniQueIdGenerator_variableName') }))
        return
      }
    }

    if (formData.isPrefix) {
      itemData.index = state.form.prefix.length
      state.prefix.push(itemData.expression)
      state.form.prefix.push(deepCopy(itemData))
      state.example.prefix.push(deepCopy(itemData))
    } else {
      itemData.index = state.form.suffix.length
      state.suffix.push(itemData.expression)
      state.form.suffix.push(deepCopy(itemData))
      state.example.suffix.push(deepCopy(itemData))
    }
    itemData = {}
    formRef.value.clearValidate('prefix')
    state.dialogFormVisible = false
  } catch (error: any) {
    throw new Error(error)
  }
}

/**
 * @param status (true: prefix,false: suffix)
 */
function handleChangeTag(status: boolean) {
  if (status) {
    if (!state.prefix) {
      state.prefix = []
      return
    }
    state.form.prefix = handleList(state.prefix, state.form.prefix)
    state.example.prefix = handleList(state.prefix, state.form.prefix)
    return
  }

  if (!state.suffix) {
    state.suffix = []
    return
  }
  state.form.suffix = handleList(state.suffix, state.form.suffix)
  state.example.suffix = handleList(state.suffix, state.form.suffix)
}

function handleList(formList: any, oldList: any) {
  const list = []
  let index = 0
  formList.forEach((col: string) => {
    const oldItem = oldList.find((item: any) => item.expression === col)
    if (oldItem) {
      oldItem.index = index
      list.push(deepCopy(oldItem))
    } else {
      const newItem = {
        index: index,
        expression: col,
        type: 'string',
        value: col
      }
      list.push(newItem)
    }
    index += 1
  })
  return list
}

const emits = defineEmits(['refresh', 'success'])

async function handleSubmit() {
  try {
    try {
      await formRef.value.validate()
    } catch (e) {
      console.error(e)
      return
    }
    state.loading = true

    if (id == '') {
      return
    }

    await newAdminApi.putDocpalIdTemplatesId(id, state.form)
    routerProvider?.message.success(
      t('tip_updateSuccessMsg', {
        modelName: t('adminMenu.uniqueIdGenerator'),
        name: state.form.name
      })
    )
    emits('success', state.form)
  } catch (error) {
    console.log(error)
    emits('refresh')
  }
  state.loading = false
}

async function init() {
  state.uniqueId = ''
  state.form = await newAdminApi.getDocpalIdTemplatesId(id).then((res) => res.data)
  state.example = deepCopy(state.form)
  setTag(true, state.form.prefix)
  setTag(false, state.form.suffix)
  await formRef.value.resetFields()
}

function setTag(status: boolean, list: any) {
  if (list.length < 1) {
    if (status) {
      state.prefix = []
    } else {
      state.suffix = []
    }
    return
  }
  if (status) {
    state.prefix = list.map((item: any) => item.expression)
  } else {
    state.suffix = list.map((item: any) => item.expression)
  }
}

onMounted(async () => {
  await init()
})
</script>
<style lang="scss" scoped>
.button-container {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
</style>
