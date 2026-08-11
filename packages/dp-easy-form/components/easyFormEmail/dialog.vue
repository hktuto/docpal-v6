<template>
  <el-dialog
    :title="$t('easyForm.sendEmail')"
    v-model="state.visible"
    :close-on-click-modal="false"
    append-to-body
  >
    <el-form
      label-position="top"
      ref="formRef"
      :status-icon="true"
      :model="form"
      @submit.native.prevent
    >
      <el-form-item
        :label="$t('user_email')"
        prop="emails"
        :rules="[
          {
            required: true,
            message: $t('user_email') + $t('render.hint.fieldRequired'),
          },
          // {
          //   validator: emailValidate,
          //   trigger: 'change'
          // }
        ]"
      >
        <el-select
          ref="selectRef"
          v-model="form.emails"
          multiple
          allow-create
          clearable
          filterable
          :placeholder="$t('vxe.base.pleaseInput')"
          :aria-label="$t('tip_enterAfterInput')"
          default-first-option
          @change="handleSelectChange"
        >
          <el-option
            v-for="item in state.userList"
            :key="item.value"
            :type="emailCheck ? 'danger' : 'info'"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        :label="$t('tableHeader_subject')"
        prop="subject"
        :rules="[
          {
            required: true,
            message: $t('tableHeader_subject') + $t('render.hint.fieldRequired'),
          },
        ]"
      >
        <el-input clearable ref="subjectRef" v-model="form.subject" />
      </el-form-item>
      <InsertVariables
        :inputRef="subjectRef?.input"
        :variables="subjectFieldList"
        @change="(value) => (form.subject = value)"
      />
      <el-form-item :label="$t('dpEmail.content')" prop="body">
        <el-input
          type="textarea"
          ref="bodyRef"
          v-model="form.body"
          show-word-limit
          maxlength="1024"
          :autosize="{ minRows: 18, maxRows: 20 }"
        />
      </el-form-item>
      <InsertVariables
        :inputRef="bodyRef?.textarea"
        :variables="bodyFieldList"
        @change="(value) => (form.body = value)"
      />
    </el-form>
    <template #footer>
      <el-button
        id="EasyForm__Detail__FormPreview__SendEmail__Submit"
        type="primary"
        :loading="state.loading"
        @click="handleSubmit()"
      >
        {{ $t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { newClientApi } from 'api'
import { fetchUsersSelectSorted } from '@packages/base/composables/usePermissionOption'
import type { FormInstance } from 'element-plus'
import { ElMessage } from 'element-plus'

const emits = defineEmits(['email-update'])
const { t } = useI18n()
const {
  public: { endPoint }
} = useRuntimeConfig()
const state = reactive<any>({
  visible: false,
  userList: [],
  easyFormId: ''
})
const subjectRef = ref()
const bodyRef = ref()

const subjectFieldList = [
  { label: 'Email', value: '${email}' },
  { label: 'Name', value: '${name}' }
]
const bodyFieldList = ref([
  {
    label: 'Email',
    value: '${email}',
    templateValue: '<span th:text="${email}"></span>'
  },
  { label: 'Name', value: '${name}', templateValue: '<span th:text="${name}"></span>' },
  {
    label: 'Form Link',
    value: '${formLink}',
    templateValue: '<a th:href="${formLink}">Form Link</a>'
  }
])
const bodyFieldExtraList = [{ value: '\n', templateValue: '<br />' }]

const form = ref({
  emails: [],
  subject: 'subject',
  body: 'Dear '
})

const emailPattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

let emailCheck = false
const emailValidate = (rule: any, value: any, callback: any) => {
  value.forEach((item) => {
    if (!emailPattern.test(item)) {
      emailCheck = true
      callback(new Error($t('tip.enterValidEmail')))
    }
  })
  callback()
}

async function handleOpen(easyFormId: string = '', userEmail: string = '') {
  state.visible = true
  state.easyFormId = easyFormId
  const email: any = await globalApi.api.getFormDesignEmailId(easyFormId).then((res) => res.data)
  if (!email.body) email.body = ''
  if (!email.subject) email.subject = ''
  if (!email.userEmails) email.userEmails = []
  form.value.body = getBody(email.body)
  form.value.subject = email.subject
  form.value.emails = []
  if (userEmail) form.value.emails.push(userEmail)
  setTimeout(() => {
    formRef.value.clearValidate()
  })

  // form.value.emails = email.userEmails.map(item => (item.email))
  function getBody(str) {
    const list = [...bodyFieldList.value, ...bodyFieldExtraList]
    const body = list.reduce((prev: string, item: any) => {
      const regex = new RegExp(item.templateValue.replace(/[${}/?\\<>]/g, '\\$&'), 'g')
      prev = prev.replace(regex, item.value)
      return prev
    }, str)
    const regex = /<p>(.*?)<\/p>/
    const match = body.match(regex)
    return body.replace('<html><body><p>', '').replace('</p></body></html>', '')
  }
}

const formRef = ref<FormInstance>()

async function handleSubmit() {
  try {
    await formRef.value?.validate()
  } catch (e) {
    console.error(e)
    return
  }
  const params = {
    easyFormId: state.easyFormId,
    formLink: getFormLink(false),
    subject: form.value.subject,
    userEmails: getEmail(),
    body: getBody(form.value.body)
  }
  await newClientApi.postDmsEasyFormEmailSend(params)
  emits('email-update')
  ElMessage.success(t('dpMsg_success'))
  state.visible = false

  function getBody(str) {
    const list = [...bodyFieldList.value, ...bodyFieldExtraList]
    const body = list.reduce((prev: string, item: any) => {
      const regexStr = item.value.replace(/[${}/?\\<>]/g, '\\$&')

      const regex = new RegExp(item.value.replace(/[${}/?\\<>]/g, '\\$&'), 'g')
      prev = prev.replace(regex, item.templateValue)
      return prev
    }, str)
    return `<html><body><p>${body}</p></body></html>`
  }

  function getEmail() {
    return form.value.emails.reduce((prev, email: string) => {
      const user = state.userList.find((item) => item.value === email || item.label === email)
      prev.push({
        username: user ? user.label : '',
        email: email.includes('@') ? email : (user?.label || email)
      })
      return prev
    }, [])
  }

  function getFormLink(initBodyField = true) {
    const fItem = bodyFieldList.value.find((item) => item.label === 'Form Link')
    const origin = endPoint?.upload
    const href = `https://${origin}/public-form?id=${state.easyFormId}`
    // if(initBodyField) {
    //   fItem.value = href
    //   fItem.templateValue = `<a href="${href}">${href}</a>`;
    // }
    return href
  }
}

// #region module: selectRef
const selectRef = ref()

function handleSelectChange() {
  selectRef.value.blur()
  setTimeout(() => {
    selectRef.value.focus()
  })
}

// #endregion
// #endregion
onMounted(async () => {
  state.userList = await fetchUsersSelectSorted()
})

defineExpose({ handleOpen })
</script>
<style lang="scss" scoped></style>
