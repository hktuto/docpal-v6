<script setup lang="ts">
import { newAdminApi } from 'api'
import { fetchUsersSelectSorted } from '@packages/base/composables/usePermissionOption'

const { data, tableFields } = defineProps<{
  data: any
  tableFields: any[]
}>()
const emits = defineEmits(['update'])
const emailRecipient = ref<any[]>([])
const emailTemplateList = ref<any[]>([])
const emailVariablesList = ref<any[]>([])
const formData = ref({
  templateId: '',
  tos: '',
  ccs: ''
})

async function getEmailTemplateList() {
  emailTemplateList.value = (await newAdminApi.getDmsTemplateEmailAll().then((res) => res.data)) || []
}

async function getEmailRecipient() {
  const userList = await fetchUsersSelectSorted(undefined, {
    value: 'email',
    label: 'user_name'
  })
  emailRecipient.value = [
    { label: 'User', options: userList.map((item) => ({ id: item.value, name: item.label })) },
    { label: 'Table Fields', options: tableFields }
  ]
}

async function getEmailVariablesList(templateId: string) {
  if (emailTemplateList.value.length == 0) {
    await getEmailTemplateList()
  }

  const find = emailTemplateList.value.find((item: any) => item.id === templateId)
  if (!find || !find.emailTemplateVariable || find.emailTemplateVariable === '') {
    emailVariablesList.value = []
    return
  }

  emailVariablesList.value = JSON.parse(find.emailTemplateVariable).map((key: string) => ({
    id: key,
    name: key,
    value: ''
  }))
  update()
}

function init() {
  formData.value = data
}

function update() {


  data.map_workflow_parameters = {
    [`tos_${Date.now()}`]: formData.value.tos,

  }
}


onMounted(() => {
  getEmailTemplateList()
  getEmailRecipient()
})
watch(() => data, () => {
  if (!!data) {
    init()
  }
}, { deep: true, immediate: true })
</script>

<template>
  <el-form label-position="top" size="small">
    <el-form-item label="Template ID">
      <el-select v-model="formData.templateId" filterable @change="getEmailVariablesList">
        <el-option v-for="item in emailTemplateList" :key="item.id" :label="item.label" :value="item.id" />
      </el-select>
    </el-form-item>
    <el-form-item label="TOS">
      <el-select v-model="formData.tos" multiple filterable @change="update">
        <el-option-group v-for="group in emailRecipient" :key="group.label" :label="group.label">
          <el-option v-for="item in group.options" :key="item.id" :label="item.name" :value="item.id" />
        </el-option-group>
      </el-select>
    </el-form-item>
    <el-form-item label="CSS">
      <el-select v-model="formData.ccs" multiple filterable clearable @change="update">
        <el-option-group v-for="group in emailRecipient" :key="group.label" :label="group.label">
          <el-option v-for="item in group.options" :key="item.id" :label="item.name" :value="item.id" />
        </el-option-group>
      </el-select>
    </el-form-item>
    <!--    <el-form-item label="Attachments File Path">-->
    <!--    </el-form-item>-->

    <el-divider />
    <span>Variables</span>
    <template v-for="variable in emailVariablesList" :key="variable.id">
      <el-form-item :label="variable.name" @change="update">
        <el-select v-model="variable.value" filterable clearable>
          <el-option v-for="field in tableFields" :key="field.key" :label="field.name" :value="field.id" />
        </el-select>
      </el-form-item>
    </template>
  </el-form>
</template>

<style scoped lang="scss">

</style>
