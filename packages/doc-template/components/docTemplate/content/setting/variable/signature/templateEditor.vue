<script lang="ts" setup>
import type { SignatureSetting } from './type'
import { newAdminApi } from 'api'

const props = defineProps<{
  companyListOptions?: any[]
}>()

const form = defineModel<SignatureSetting>('modelValue', {
  required: true
})

const templateVariableOption = [
  'username',
  'firstName',
  'lastName',
  'signDate(yyyy-mm-dd)'
] as const

const companyChopList = ref<any[]>([])

async function getCompanyChopList(companyId: string) {
  companyChopList.value = await newAdminApi.getDmsCompanyprofilesCompanyidChops(companyId, {
    requestDTO: {
      pageNum: 1,
      pageSize: 1000,
      status: 'A'
    }
  }).then(r => r.data) || []
}

function handleCompanyChange(newCompany: string) {
  if (newCompany) {
    getCompanyChopList(newCompany)
  }
}

function addVariable(variable: typeof templateVariableOption[number], type: 'prefix' | 'suffix') {
  if (form.value) {
    form.value[type] = (form.value[type] || '') + '${' + variable + '}'
  }
}

watch(() => form.value?.company, (newCompany) => {
  if (newCompany) {
    getCompanyChopList(newCompany)
  }
})

onMounted(() => {
  if (form.value?.company) {
    getCompanyChopList(form.value.company)
  }
})

</script>

<template>
  <div class="templateEditorContainer">
    <div class="header">
      <div class="label">Signature Setting</div>
    </div>

    <ElForm label-position="top">
      <ElRow :gutter="20">
        <ElCol :span="24">
          <ElFormItem label="Prefix Text">
            <ElInput
              v-model="form.prefix"
              type="textarea"
              :rows="3"
              :autosize="{ minRows: 3, maxRows: 6 }"
            />
            <div class="variableTextContainer">
              <ElButton
                v-for="variable in templateVariableOption"
                :key="variable"
                type="link"
                @click="addVariable(variable, 'prefix')"
              >
                {{ variable }}
              </ElButton>
            </div>
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElRow :gutter="20">
        <ElCol :span="24">
          <ElFormItem label="Type">
            <ElSelect v-model="form.type">
              <ElOption label="Personal" value="personal" />
              <ElOption label="Company" value="company" />
              <ElOption label="Both" value="both" />
            </ElSelect>
          </ElFormItem>
        </ElCol>
      </ElRow>
      <template v-if="form?.type === 'company' || form?.type === 'both'">
        <ElRow :gutter="20">
          <ElCol :span="12">
            <ElFormItem label="Company">
              <ElSelect v-model="form.company" @change="handleCompanyChange">
                <ElOption
                  v-for="company in companyListOptions"
                  :key="company.id"
                  :label="company.name"
                  :value="company.id"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="Company Chop">
              <ElSelect v-model="form.signatureId">
                <ElOption
                  v-for="chop in companyChopList"
                  :key="chop.id"
                  :label="chop.name"
                  :value="chop.id"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
        </ElRow>
      </template>

      <ElRow :gutter="20">
        <ElCol :span="24">
          <ElFormItem label="Suffix Text">
            <ElInput
              v-model="form.suffix"
              type="textarea"
              :rows="3"
              :autosize="{ minRows: 3, maxRows: 6 }"
            />
            <div class="variableTextContainer">
              <ElButton
                v-for="variable in templateVariableOption"
                :key="variable"
                type="link"
                @click="addVariable(variable, 'suffix')"
              >
                {{ variable }}
              </ElButton>
            </div>
          </ElFormItem>
        </ElCol>
      </ElRow>
    </ElForm>
  </div>
</template>

<style lang="css" scoped>
.templateEditorContainer {
  width: 100%;
  padding: var(--app-space-s);
  position: relative;
  border-radius: var(--app-border-radius-m);
  border: 1px solid var(--app-grey-900);
}

.header {
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
}
</style>
