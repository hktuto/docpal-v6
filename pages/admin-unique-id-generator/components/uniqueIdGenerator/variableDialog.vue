<script setup lang="ts">
import tagForm from './tagForm.vform.json'

type AffixKey = 'prefix' | 'suffix'

interface VariableItem {
  index: number
  expression: string
  type: string
  value: string
}

const props = defineProps<{
  prefixExpressions: string[]
  suffixExpressions: string[]
}>()

const emit = defineEmits<{
  confirm: [payload: { item: VariableItem; key: AffixKey; isEdit: boolean }]
}>()

const { t } = useI18n()
const routerProvider = inject(MenuRouterKey)
const formRendererRef = ref()

const state = reactive({
  visible: false,
  isEdit: false,
  type: 'date'
})

const dialogTitle = computed(() => {
  if (state.isEdit) {
    return t('uniQueIdGenerator_editTextVariable')
  }
  return state.type === 'date'
    ? t('uniQueIdGenerator_creatDateVariable')
    : t('uniQueIdGenerator_creatTextVariable')
})

async function openForm(data: Record<string, unknown>) {
  state.visible = true
  await nextTick()
  if (!formRendererRef.value?.vFormRenderRef) {
    await nextTick()
  }
  formRendererRef.value?.vFormRenderRef?.resetForm()
  formRendererRef.value?.vFormRenderRef?.setFormData(data)
}

function handleOpen(key: AffixKey, type: 'date' | 'variable') {
  state.isEdit = false
  state.type = type
  openForm({
    type,
    affixKey: key
  })
}

function handleOpenEdit(data: Record<string, unknown>) {
  state.isEdit = true
  state.type = String(data.type ?? 'variable')
  openForm(data)
}

function isExpressionDuplicated(expression: string, key: AffixKey, excludeIndex?: number) {
  const inList = (list: string[], skipIndex?: number) =>
    list.some((item, i) => item === expression && i !== skipIndex)

  return key === 'prefix'
    ? inList(props.prefixExpressions, excludeIndex) || inList(props.suffixExpressions)
    : inList(props.prefixExpressions) || inList(props.suffixExpressions, excludeIndex)
}

function buildItem(formData: Record<string, any>): VariableItem {
  const index = formData.index !== undefined && formData.index !== '' ? Number(formData.index) : 0

  switch (formData.type) {
    case 'date':
      return {
        index,
        type: 'date',
        expression: `{date(${formData.dateFormat})}`,
        value: formData.dateFormat
      }
    case 'variable':
      return {
        index,
        type: 'variable',
        expression: `{var(${formData.variableName})}`,
        value: formData.variableValue
      }
    default:
      return {
        index,
        type: 'string',
        expression: formData.stringValue,
        value: formData.stringValue
      }
  }
}

async function handleConfirm() {
  try {
    const formData = await formRendererRef.value.getFormData()
    const item = buildItem(formData)
    const key = formData.affixKey as AffixKey

    if (formData.type === 'variable') {
      const excludeIndex = state.isEdit ? item.index : undefined
      if (isExpressionDuplicated(item.expression, key, excludeIndex)) {
        routerProvider?.message.error(t('dpTip.exit', { name: t('uniQueIdGenerator_variableName') }))
        return
      }
    }

    emit('confirm', {
      item,
      key,
      isEdit: state.isEdit
    })
    state.visible = false
  } catch (error: any) {
    throw new Error(error)
  }
}

defineExpose({ handleOpen, handleOpenEdit, handleConfirm, state, formRendererRef })
</script>

<template>
  <el-dialog v-model="state.visible" width="500" :title="dialogTitle">
    <FormRenderer ref="formRendererRef" :form-json="tagForm" />
    <template #footer>
      <el-button
        :id="state.isEdit ? 'UniqueId_Detail__EditVariable__Confirm' : 'UniqueId_Detail__NewVariable__Confirm'"
        type="primary"
        @click="handleConfirm"
      >
        {{ t('dpButtom_confirm') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss"></style>
