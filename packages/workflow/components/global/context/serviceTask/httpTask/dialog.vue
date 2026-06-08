<script setup lang="ts">
import { QuestionFilled } from '@element-plus/icons-vue'
import { Codemirror } from 'vue-codemirror'
import { json, jsonParseLinter } from '@codemirror/lang-json'
import { linter } from '@codemirror/lint'
import { oneDark } from '@codemirror/theme-one-dark'

const { t } = useI18n()
const emits = defineEmits(['submit'])
const bodyVisible = ref(false)

const codeMirror = reactive({
  data: '',
  extensions: [json(), linter(jsonParseLinter()), oneDark],
  errorMessage: ''
})

function open(requestBody: any) {
  bodyVisible.value = true
  codeMirror.data = JSON.stringify(requestBody)
  handleJsonFormat()
}

function handleJsonFormat() {
  if (!checkJsonFormat()) {
    codeMirror.data = JSON.stringify(JSON.parse(codeMirror.data), null, 2)
    codeMirror.errorMessage = ''
  }
}

function checkJsonFormat() {
  try {
    JSON.parse(codeMirror.data)
    codeMirror.errorMessage = ''
    return false
  } catch (e) {
    console.log(e)
    codeMirror.errorMessage = `Unable to format JSON: ${e.message}`
    return true
  }
}

function handleRequestBodySubmit() {
  // Because of the interpolation syntax, json syntax checks throw error, so no detection is done when submitting
  if (checkJsonFormat()) {
    return
  }
  emits('submit', JSON.parse(codeMirror.data))
  bodyVisible.value = false
}

defineExpose({ open })
</script>

<template>
  <el-dialog v-model="bodyVisible" :title="t('Edit Request Body')" append-to-body class="big">
    <div style="display: flex; align-items: center; justify-content: space-between">
      <div style="display: flex; align-items: center">
        <span>Json</span>
        <el-popover
          class="box-item"
          width="300"
          title="Info"
          content='You can set data using "${key}". Using interpolation syntax will fail the JSON syntax check. Please disable syntax checking and check whether the interpolation syntax is correct.'
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
      <el-button style="margin-left: 20px" @click="handleJsonFormat" type="primary" size="small"> JSON Format </el-button>
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

<style scoped lang="scss"></style>
