<script setup lang="ts">
import { newAdminApi } from 'api'
import type { SignatureSetting } from './type'
import TemplateEditor from './templateEditor.vue'

const modelValue = defineModel<SignatureSetting>('modelValue', {
  default: () => ({
    id: '',
    type: 'personal',
    prefix: '',
    suffix: '',
    value: '',
    signBy: '',
    signatureId: ''
  })
})

const companyOptions = ref<any[]>([])

async function getCompanyList() {
  try {
    const data = await newAdminApi
      .postDocpalAclRoleList({
        pageNum: 0,
        pageSize: 100
      })
      .then((r: any) => r.data)
    if (data && data.entryList) {
      companyOptions.value = data.entryList
    }
  } catch (e) {
    console.log(e)
  }
}

onMounted(async () => {
  await getCompanyList()

  // Initialize id if not set
  if (!modelValue.value) {
    modelValue.value = {
      id: Date.now().toString(),
      type: 'personal',
      prefix: '',
      suffix: '',
      value: '',
      signBy: '',
      signatureId: ''
    }
  }
})
</script>

<template>
  <div class="variable_editor">
    <TemplateEditor v-model="modelValue" :companyListOptions="companyOptions" />
  </div>
</template>

<style lang="scss" scoped>
.variable_editor {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: var(--app-space-xs);
}
</style>
