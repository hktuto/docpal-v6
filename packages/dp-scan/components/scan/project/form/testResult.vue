<script lang="ts" setup>
import { clientApi } from 'api'
import TestDialog from './testDialog.vue'
const testFormRef = ref()
const props = defineProps<{
  formId: string
  projectId: string,
  splitInfo: any,
  ocrResult: string,
  formConfig:any,
}>()

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey not found')
}
const selectedDocDetail = ref();

function init(){

}

function testAgain(){
  testFormRef.value.open(props.formId, props.projectId, deepCopy(props.formConfig))

}

</script>

<template>
  <div class="pageContainer">
      <div class="header">
          <div>
              Test Form: ({{ formConfig.form_name }})
          </div>
          <div class="actions">
              <ElButton type="primary" @click="testAgain">Test Again</ElButton>
          </div>
      </div>
      <ElSplitter v-if="selectedDocDetail">
          <ElSplitterPanel>
            preview
          </ElSplitterPanel>

          <ElSplitterPanel size="300px" min="200">
            form
          </ElSplitterPanel>
      </ElSplitter>
      <template v-else>
        <el-loading />
      </template>
      <TestDialog ref="testFormRef" />
  </div>
</template>
