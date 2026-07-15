<script setup lang="ts">
import { newAdminApi } from 'api'
import { getUserSelectOption } from '@packages/base/composables/usePermissionOption'

const emits = defineEmits(['update'])
const { getVariablesByDisplayTypes } = useVariablesProvide()
const arrayStringVariablesList = computed(() => {
  const list = getVariablesByDisplayTypes(['array'], true)
  return list.filter((item: any) => item.items.type === 'string')
})
const fileVariablesList = computed(() => {
  return getVariablesByDisplayTypes(['file'], true)
})
const allVariablesList = computed(() => {
  return getVariablesByDisplayTypes([], true)
})
const emailRecipient = ref<any[]>([])
const emailTemplateList = ref<any[]>([])
const emailVariablesList = ref<any[]>([])
const { config } = defineProps<{
  config: {
    http_request: {
      body: {
        tos: string[]
        ccs: string[]
        templateId: string
        attachmentsFilePath: string
        variables: any
      }
      headers: {
        'Content-Type': string
        ServerKey: string
        ServerName: string
        'x-api-key': string
      }
      method: string
      url: string
    }
    input_mapping: {}
    output_mapping: {}
  }
}>()
const formData = ref<{
  tos: string[]
  ccs: string[]
  templateId: string
  attachmentsFilePath: string
  variables: any
}>()
const tosIsArray = ref<boolean>(false)
const cssIsArray = ref<boolean>(false)

async function initForm() {
  formData.value = config.http_request.body
  tosIsArray.value = typeof formData.value.tos === 'string'
  cssIsArray.value = typeof formData.value.ccs === 'string'
  await getEmailVariablesList()

  // reset emailVariablesList item value
  const keys = Object.keys(config.http_request.body.variables)
  if (keys.length == 0) return

  emailVariablesList.value = emailVariablesList.value.map((item: any) => {
    if (keys.includes(item.id)) {
      item.value = config.http_request.body.variables[item.id]
    }
    return item
  })
}

function updateData() {
  const map = emailVariablesList.value.reduce(
    (acc: Record<string, string>, { id, value }: any) => {
      acc[id] = value
      return acc
    },
    {} as Record<string, any>
  )

  const data = {
    tos: formData.value.tos,
    ccs: formData.value.ccs,
    templateId: formData.value.templateId,
    attachmentsFilePath: formData.value.attachmentsFilePath,
    variables: map
  }

  emits('update', {
    name: 'update-email-template-data',
    config: {
      ...config,
      http_request: {
        ...config.http_request,
        body: data
      }
    }
  })
}

async function getEmailRecipient() {
  const stringAndArrayVariables = getVariablesByDisplayTypes(['text'], true)

  const userList = await getUserSelectOption()
  const map = userList.map((item: any) => ({
    id: item.email,
    name: item.label
  }))

  emailRecipient.value = [
    { label: 'User', options: Array.from(new Map(map.map((x: any) => [x.id, x])).values()) },
    { label: 'Variables', options: stringAndArrayVariables }
  ]
}

async function getEmailTemplateList() {
  emailTemplateList.value = (await newAdminApi.getDmsTemplateEmailAll().then((res) => res.data)) || []
}

function handleEmailTemplateChange() {
  getEmailVariablesList()
  updateData()
}

async function getEmailVariablesList() {
  if (emailTemplateList.value.length == 0) {
    await getEmailTemplateList()
  }

  const find = emailTemplateList.value.find((item: any) => item.id === formData.value.templateId)
  if (!find || !find.emailTemplateVariable || find.emailTemplateVariable === '') {
    emailVariablesList.value = []
    return
  }
  emailVariablesList.value = JSON.parse(find.emailTemplateVariable).map((key: string) => ({
    id: key,
    name: key,
    value: ''
  }))
}

onMounted(() => {
  getEmailTemplateList()
  getEmailRecipient()
})

watch(
  () => config,
  () => {
    if (JSON.stringify(config.http_request.body) !== JSON.stringify(formData.value)) {
      initForm()
    }
  },
  { immediate: true, deep: true }
)
</script>

<template>
  <el-form label-position="top">
    <el-form-item label="Template ID">
      <el-select v-model="formData.templateId" filterable @change="handleEmailTemplateChange">
        <el-option v-for="item in emailTemplateList" :key="item.id" :label="item.label" :value="item.id" />
      </el-select>
    </el-form-item>
    <el-form-item label="TOS" class="tos-form-item">
      <template #label>
        <div class="tos-form-item__label">
          <span>TOS</span>
          <el-switch v-model="tosIsArray" active-text="Array" inactive-text="Single" />
        </div>
      </template>
      <el-select v-if="!tosIsArray" v-model="formData.tos" multiple filterable @change="updateData">
        <el-option-group v-for="group in emailRecipient" :key="group.label" :label="group.label">
          <el-option v-for="item in group.options" :key="item.id" :label="item.name" :value="item.id" />
        </el-option-group>
      </el-select>
      <el-select v-else v-model="formData.tos" filterable @change="updateData">
        <el-option v-for="item in arrayStringVariablesList" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>
    <el-form-item>
      <div class="tos-form-item__label">
        <span>CSS</span>
        <el-switch v-model="cssIsArray" active-text="Array" inactive-text="Single" />
      </div>
      <el-select v-if="!cssIsArray" v-model="formData.ccs" multiple filterable clearable @change="updateData">
        <el-option-group v-for="group in emailRecipient" :key="group.label" :label="group.label">
          <el-option v-for="item in group.options" :key="item.id" :label="item.name" :value="item.id" />
        </el-option-group>
      </el-select>
      <el-select v-else v-model="formData.ccs" filterable @change="updateData">
        <el-option v-for="item in arrayStringVariablesList" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>
    <el-form-item label="Attachments File Path">
      <el-select v-model="formData.attachmentsFilePath" filterable clearable @change="updateData">
        <el-option v-for="item in fileVariablesList" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>

    <el-divider />
    <span>Variables</span>
    <template v-for="variable in emailVariablesList" :key="variable.id">
      <el-form-item :label="variable.name">
        <el-select v-model="variable.value" filterable clearable @change="updateData">
          <el-option v-for="item in allVariablesList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
    </template>
  </el-form>
</template>

<style scoped lang="scss">
.tos-form-item {
  :deep(.el-form-item__label) {
    width: 100%;
  }

  &__label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
}
</style>
