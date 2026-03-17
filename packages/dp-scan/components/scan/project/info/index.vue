<script lang="ts" setup>
import { clientApi } from 'api'
const props = defineProps<{
  info: any
}>()
const loading = ref(false)
const { info } = toRefs(props)
const routerProvider = inject(MenuRouterKey)
const emits = defineEmits(['updated'])
const additionFieldsSettingEl = ref()
if (!routerProvider) {
  throw new Error('MenuRouterKey not found')
}

// Validation function for batch naming rules
function validateBatchNamingRules(): boolean {
  if (!info.value) return false

  const { prefix, minDigit, startingNumber } = info.value
  const missingFields: string[] = []

  if (!prefix || prefix.trim() === '') {
    missingFields.push('Prefix')
  }
  if (!minDigit) {
    missingFields.push('Suffix')
  }

  if (startingNumber === undefined || startingNumber === null || startingNumber === '') {
    missingFields.push('Starting Number')
  }

  if (missingFields.length > 0) {
    routerProvider?.message.error(`Batch Naming Rules are required: ${missingFields.join(', ')}`)
    return false
  }

  return true
}

async function save() {
  // Validate batch naming rules before saving
  if (!validateBatchNamingRules()) {
    return
  }

  loading.value = true
  const form: any = { ...info.value }
  delete form.updatedBy
  delete form.updatedAt
  delete form.createdAt
  delete form.createdBy
  try {
    form.status = 'I'
    await clientApi.api.putCaptureProj(form)
    routerProvider?.message.success(`${form.name} is udpated`)
  } catch (error) {
    routerProvider?.message.error(`${form.name} save failed`)
    console.error(error)
  } finally {
    emits('updated')
    loading.value = false
  }
}

async function publish() {
  // Validate batch naming rules before publishing
  if (!validateBatchNamingRules()) {
    return
  }

  loading.value = true
  const form: any = { ...info.value }
  delete form.updatedBy
  delete form.updatedAt
  delete form.createdAt
  delete form.createdBy
  try {
    form.status = 'A'
    await clientApi.api.putCaptureProj(form)
    routerProvider?.message.success(`${form.name} is published`)
  } catch (error) {
    routerProvider?.message.error(`${form.name} publish failed`)
    console.error(error)
  } finally {
    emits('updated')
    loading.value = false
  }
}

function addAdditionField() {
  additionFieldsSettingEl.value.add()
}

function addProjectField() {}
</script>

<template>
  <ElForm class="infoContainer" label-position="top">
    <div v-if="info" class="formFields">
      <div class="section">info</div>
      <ElFormItem label="Code">
        <ElInput v-model="info.code" />
      </ElFormItem>
      <ElFormItem label="Name">
        <ElInput v-model="info.name" />
      </ElFormItem>
      <ElFormItem label="Description">
        <ElInput type="textarea" v-model="info.description" />
      </ElFormItem>
      <!-- <div class="section">Project Fields <Icon class="cursor-pointer" name="lucide:plus" @click="addProjectField" /></div> -->
      <!-- <ScanProjectInfoProjectField ref="additionFieldsSettingEl" v-model="info.additionFieldsSetting" /> -->
      <div class="section">Batch Naming Rules</div>
      <ElFormItem label="Prefix" required>
        <ElInput v-model="info.prefix" placeholder="Enter prefix" />
      </ElFormItem>
      <ElRow :gutter="6">
        <ElCol :span="12">
          <ElFormItem label="Min Digit" required>
            <ElInput v-model="info.minDigit" placeholder="Enter Min Digit" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="Starting Number" required>
            <ElInput type="number" v-model="info.startingNumber" placeholder="Enter starting number" />
          </ElFormItem>
        </ElCol>
      </ElRow>
      <div class="section">Result Setting</div>
      <ElFormItem label="Zip Password" required>
        <ElInput v-model="info.zipPassword" type="password" show-password />
      </ElFormItem>
    </div>
    <div v-if="info" class="footer">
      <ElButton v-if="info.status === 'I'" type="primary" :disabled="loading" @click="publish">Publish</ElButton>
      <ElButton type="primary" :disabled="loading" @click="save">Save</ElButton>
    </div>
  </ElForm>
</template>

<style lang="scss" scoped>
.infoContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
  padding: var(--app-space-s);
  position: relative;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  gap: var(--app-space-s);
}
.formFields {
  flex: 1 0 auto;
  overflow-y: auto;
}
.footer {
  width: 100%;
  padding: var(--app-space-s);
  border-top: 1px solid var(--app-border-color);
}
.section {
  width: 100%;
  padding: var(--app-space-xs);
  background-color: #8bd9e0;
  color: #fff;
  margin-block: var(--app-space-xs);
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
  line-height: 1;
}
</style>
