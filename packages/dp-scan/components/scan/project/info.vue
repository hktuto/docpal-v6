<script lang="ts" setup>
import { clientApi } from 'api'
const props = defineProps<{
  info: any
}>()
const loading = ref(false)
const { info } = toRefs(props)
const routerProvider = inject(MenuRouterKey)
const emits = defineEmits(['updated'])
if (!routerProvider) {
  throw new Error('MenuRouterKey not found')
}
async function save() {
  loading.value = true
  const form: any = { ...info.value }
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
  loading.value = true
  const form: any = { ...info.value }
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

function addProjectField() {}
</script>

<template>
  <ElForm class="infoContainer" label-position="top">
    <div v-if="info" class="formFields">
      <div class="section">info</div>
      <ElFormItem label="Name">
        <ElInput v-model="info.name" />
      </ElFormItem>
      <ElFormItem label="Description">
        <ElInput type="textarea" v-model="info.description" />
      </ElFormItem>
      <div class="section">Project Fields <Icon class="cursor-pointer" name="lucide:plus" @click="addProjectField" /></div>

      <div class="section">Batch Naming Rules</div>
      <ElFormItem label="Prefix">
        <ElInput v-model="info.prefix" />
      </ElFormItem>
      <ElRow :gutter="6">
        <ElCol :span="12">
          <ElFormItem label="Suffix">
            <ElInput v-model="info.minDigit" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="startingNumber">
            <ElInput type="number" v-model="info.startingNumber" />
          </ElFormItem>
        </ElCol>
      </ElRow>
      <div class="section">Result Setting</div>
      <ElInput v-model="info.zipPassword" type="password" shwo-password />
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
