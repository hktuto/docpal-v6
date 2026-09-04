<script lang="ts" setup>
import { newAdminApi } from 'api'
import { Plus } from '@element-plus/icons-vue'

const DEFAULT_ID_DIGIT = 6
const DEFAULT_START_NUMBER = 1

interface ItemRule {
  index: number
  expression: string
  type: string
  value: string
}

const formRef = ref()
const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const { id } = defineProps<{
  id: string
}>()
const emits = defineEmits(['refresh', 'success'])
const variableDialogRef = ref()

const affixConfigs = [
  {
    key: 'prefix' as const,
    labelKey: 'uniQueIdGenerator_prefix',
    required: true,
    dateBtnId: 'UniqueId_Detail__Prefix__Date',
    variableBtnId: 'UniqueId_Detail__Prefix__Variable'
  },
  {
    key: 'suffix' as const,
    labelKey: 'uniQueIdGenerator_suffix',
    required: false,
    dateBtnId: 'UniqueId_Detail__Suffix__Date',
    variableBtnId: 'UniqueId_Detail__Suffix__Variable'
  }
]

const state = reactive({
  loading: false,
  generateLoading: false,
  uniqueId: '',
  form: {
    id: '',
    name: '',
    prefix: [] as ItemRule[],
    suffix: [] as ItemRule[],
    idDigit: DEFAULT_ID_DIGIT,
    startNumber: DEFAULT_START_NUMBER
  },
  example: {
    prefix: [] as ItemRule[],
    suffix: [] as ItemRule[]
  }
})

const affixExpressions = computed(() => ({
  prefix: state.form.prefix.map((item) => item.expression),
  suffix: state.form.suffix.map((item) => item.expression)
}))

const exampleAffixSections = computed(() =>
  affixConfigs
    .map((affix) => ({
      ...affix,
      items: state.example[affix.key].filter((item) => item.type === 'variable')
    }))
    .filter((section) => section.items.length > 0)
)

const hasExampleVariables = computed(() => exampleAffixSections.value.length > 0)

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
  const match = value.match(/\(([^)]+)\)/)
  return match ? match[1] : value
}

function handleExampleData(type: string, value: string) {
  try {
    if (type === 'date') {
      return formatDate(new Date(), value)
    }
    return value
  } catch (e) {
    console.log(e)
  }
}

async function handleGenerateId() {
  if (state.generateLoading) return

  state.generateLoading = true
  try {
    state.uniqueId = await newAdminApi
      .postDocpalIdTemplatesValidate({
        ...state.form,
        prefix: state.example.prefix,
        suffix: state.example.suffix
      })
      .then((res) => res.data)
  } catch (e) {
    console.log(e)
  } finally {
    state.generateLoading = false
  }
}

function handleOpenTag(key: 'prefix' | 'suffix', type: 'date' | 'variable') {
  variableDialogRef.value?.handleOpen(key, type)
}

function handleAffixTagsChange(key: 'prefix' | 'suffix', list: string[] | null) {
  state.form[key] = syncAffixList(list ?? [], state.form[key])
  state.example[key] = deepCopy(state.form[key])
  handleGenerateId()
}

function handleVariableConfirm({
  item,
  key,
  isEdit
}: {
  item: ItemRule
  key: 'prefix' | 'suffix'
  isEdit: boolean
}) {
  if (isEdit) {
    state.form[key][item.index] = deepCopy(item)
    state.example[key][item.index] = deepCopy(item)
  } else {
    item.index = state.form[key].length
    state.form[key].push(deepCopy(item))
    state.example[key].push(deepCopy(item))
  }

  formRef.value?.clearValidate('prefix')
  handleGenerateId()
}

function handleEditVariable(key: 'prefix' | 'suffix', index: number) {
  const item = state.form[key][index]
  if (!item) return

  const data: Record<string, unknown> = {
    index,
    type: item.type,
    affixKey: key
  }
  switch (item.type) {
    case 'date':
      data.dateFormat = item.value
      break
    case 'variable':
      data.variableName = handleDataFormat(item.expression)
      data.variableValue = item.value
      break
    default:
      data.stringValue = item.value
  }

  variableDialogRef.value?.handleOpenEdit(data)
}

function syncAffixList(formList: string[], oldList: ItemRule[]) {
  return formList.map((col, index) => {
    const oldItem = oldList.find((item) => item.expression === col)
    if (oldItem) {
      return { ...deepCopy(oldItem), index }
    }
    return {
      index,
      expression: col,
      type: 'string',
      value: col
    }
  })
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
  } catch (e) {
    console.error(e)
    return
  }

  if (!id) return

  state.loading = true
  try {
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
  } finally {
    state.loading = false
  }
}

async function init() {
  state.uniqueId = ''
  const data = await newAdminApi.getDocpalIdTemplatesId(id).then((res) => res.data)
  state.form = {
    ...data,
    idDigit: data?.idDigit ?? DEFAULT_ID_DIGIT,
    startNumber: data?.startNumber ?? DEFAULT_START_NUMBER,
    prefix: data?.prefix ?? [],
    suffix: data?.suffix ?? []
  }
  state.example.prefix = deepCopy(state.form.prefix)
  state.example.suffix = deepCopy(state.form.suffix)
  await formRef.value?.clearValidate()
}

onMounted(async () => {
  await init()
})
</script>

<template>
  <div class="pageContainer--padding unique-id-detail">
    <el-row>
      <el-col :span="12">
        <el-form ref="formRef" :model="state.form" label-width="auto" @submit.prevent>
          <el-form-item
            :label="t('uniQueIdGenerator_idGeneratorName')"
            label-position="top"
            prop="name"
            :rules="[{ required: true, message: t('uniQueIdGenerator_idGeneratorName') + t('render.hint.fieldRequired') }]"
          >
            <el-input v-model="state.form.name" clearable />
          </el-form-item>

          <template v-for="affix in affixConfigs" :key="affix.key">
            <el-form-item
              :label="t(affix.labelKey)"
              label-position="top"
              :prop="affix.required ? affix.key : undefined"
              :rules="
                affix.required
                  ? [{ required: true, message: t(affix.labelKey) + t('render.hint.fieldRequired') }]
                  : undefined
              "
            >
              <el-input-tag
                :model-value="affixExpressions[affix.key]"
                draggable
                clearable
                :placeholder="t(affix.labelKey)"
                tag-effect="dark"
                tag-type="primary"
                @update:model-value="handleAffixTagsChange(affix.key, $event)"
              >
                <template #tag="{ value, index }">
                  <span @dblclick="handleEditVariable(affix.key, index)">{{ value }}</span>
                </template>
              </el-input-tag>
            </el-form-item>
            <div class="affix-actions">
              <el-button :id="affix.dateBtnId" :icon="Plus" @click="handleOpenTag(affix.key, 'date')">
                {{ t('uniQueIdGenerator_date') }}
              </el-button>
              <el-button :id="affix.variableBtnId" :icon="Plus" @click="handleOpenTag(affix.key, 'variable')">
                {{ t('uniQueIdGenerator_variable') }}
              </el-button>
            </div>
          </template>

          <el-form-item
            :label="t('uniQueIdGenerator_idDigit')"
            label-position="top"
            prop="idDigit"
            :rules="[{ required: true, message: t('uniQueIdGenerator_idDigit') + t('render.hint.fieldRequired') }]"
          >
            <el-input
              v-model.number="state.form.idDigit"
              type="number"
              min="1"
              clearable
              @change="handleGenerateId"
            />
          </el-form-item>
          <el-form-item
            :label="t('uniQueIdGenerator_startingNumber')"
            label-position="top"
            prop="startNumber"
            :rules="[{ required: true, message: t('uniQueIdGenerator_startingNumber') + t('render.hint.fieldRequired') }]"
          >
            <el-input
              v-model.number="state.form.startNumber"
              type="number"
              min="1"
              clearable
              @change="handleGenerateId"
            />
          </el-form-item>
        </el-form>
        <el-button id="UniqueId_Detail__Save" type="primary" @click="handleSubmit()">
          {{ t('common_save') }}
        </el-button>
      </el-col>
    </el-row>

    <el-col :span="12" class="example-panel">
      <el-divider content-position="left">{{ t('uniQueIdGenerator_example') }}</el-divider>
      <template v-if="hasExampleVariables">
        <h4>{{ t('uniQueIdGenerator_setting') }}</h4>
        <template v-for="section in exampleAffixSections" :key="section.key">
          <h5>{{ t(section.labelKey) }}</h5>
          <div v-for="item in section.items" :key="`${section.key}-${item.index}-${item.expression}`">
            <el-form-item :label="handleLabel(item.type, item.expression)" label-position="top">
              <el-input
                v-model="item.value"
                :formatter="(value: string) => handleExampleData(item.type, value)"
                @change="handleGenerateId"
              />
            </el-form-item>
          </div>
        </template>
        <el-divider />
      </template>
      <el-form-item :label="t('Id')" label-position="top">
        <el-input v-model="state.uniqueId" disabled />
      </el-form-item>
      <el-button
        id="UniqueId_Detail__Generate"
        :loading="state.generateLoading"
        :disabled="state.generateLoading"
        @click="handleGenerateId"
      >
        {{ t('uniQueIdGenerator_generate') }}
      </el-button>
    </el-col>
  </div>

  <UniqueIdGeneratorVariableDialog
    ref="variableDialogRef"
    :prefix-expressions="affixExpressions.prefix"
    :suffix-expressions="affixExpressions.suffix"
    @confirm="handleVariableConfirm"
  />
</template>

<style lang="scss" scoped>
.unique-id-detail {
  height: 100%;
  overflow: auto;
}

.affix-actions {
  margin-bottom: 18px;
}

.example-panel {
  margin-top: 2rem;
}
</style>
