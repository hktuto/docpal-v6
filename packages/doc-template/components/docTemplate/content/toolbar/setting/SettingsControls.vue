<script setup lang="ts">
import { type DocTemplateVariable } from '~/utils/docTemplateHelper'
import { useI18n } from 'vue-i18n'

const provider = inject(DocTemplateProveKey)
if (!provider) throw new Error('DocTemplateProvider not found')
const { editor, variables } = provider
const { t } = useI18n()

const state = reactive({
  mangerVisible: false,
  insertVariableVisible: false
})
const variableFormRef = ref()
const variablePickerRef = ref()

function handleOpenManagerCreate() {
  variableFormRef.value.open()
}

function handleFormSubmit(variable: DocTemplateVariable) {
  provider?.addVariable?.({ ...variable })
}

function handleUpdate(variable: DocTemplateVariable) {
  provider?.updateVariable?.({ ...variable })
}

function handleOpenPicker() {
  variablePickerRef.value.open()
}

function handlePickerSelect(variable: DocTemplateVariable) {
  if (!editor) {
    state.insertVariableVisible = false
    return
  }
  let nodeType = ''
  switch (variable.type) {
    case 'text':
      nodeType = 'variableText'
      break
    case 'list':
      nodeType = 'variableList'
      break
    case 'table':
      nodeType = 'variableTable'
      break
    case 'link':
      nodeType = 'variableLink'
      break
    case 'signature':
      nodeType = 'variableSignature'
      break
    default:
      state.insertVariableVisible = false
      return
  }
  const { to } = editor.value.state.selection
  // variable signature need to add value as array
  if (nodeType === 'variableSignature') {
    editor.value.commands.insertContent({
      type: nodeType,
      attrs: { id: Date.now().toString(), name: variable.name, type: 'signature', value: [variable] }
    })
  } else {
    editor.value.commands.insertContent({
      type: nodeType,
      attrs: { ...variable }
    })
  }
  editor.value.commands.focus(to + 1)
  state.insertVariableVisible = false
}
</script>

<template>
  <div>
    <!-- Variable Manager -->
    <el-dropdown class="ordinary-button" style="margin-left: 4px">
      <el-button>
        {{ t('docTemplate.variable.manager') }}
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item @click="handleOpenManagerCreate">
            {{ t('docTemplate.utils.variableManager.add') }}
          </el-dropdown-item>
          <el-dropdown-item @click="state.mangerVisible = true">
            {{ t('docTemplate.variable.editVariable') }}
          </el-dropdown-item>
          <el-dropdown-item @click="handleOpenPicker">
            {{ t('docTemplate.variable.insertVariable') }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    <!-- Page Setting -->
    <LazyDocTemplateContentSettingPage />
    <!-- Import -->
    <LazyDocTemplateContentSettingImport />
    <!-- Export -->
    <LazyDocTemplateContentSettingExport />
  </div>

  <!-- add visible -->
  <DocTemplateContentSettingVariableForm ref="variableFormRef" @submit="handleFormSubmit" @update="handleUpdate" />
  <!-- edit visible-->
  <el-dialog v-model="state.mangerVisible" class="big" title="Visible">
    <DocTemplateContentSettingVariableManager />
  </el-dialog>
  <!-- insert visible -->
  <DocTemplateContentToolbarVariablePicker ref="variablePickerRef" :variables="variables" :visible="state.insertVariableVisible" @select="handlePickerSelect" />
</template>

<style scoped lang="scss">
.el-dropdown {
  :deep(.el-button-group > .el-button:first-child) {
    width: 120px;
    text-align: left;
    position: relative;

    span {
      width: 100%;
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
      display: block;
    }
  }
}
</style>
