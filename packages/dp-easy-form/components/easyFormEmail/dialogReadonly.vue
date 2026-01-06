<template>
  <el-dialog :title="$t('actions.viewDetails')" v-model="state.visible" :close-on-click-modal="false" append-to-body>
    <el-form
      label-position="top"
      ref="formRef"
      :status-icon="true"
      :model="form"
      @submit.native.prevent
    >
      <el-form-item :label="$t('user_email')" prop="emails">
        <el-select
          ref="selectRef"
          v-model="form.emails"
          multiple
          allow-create
          clearable
          filterable
          default-first-option
          disabled
        >
          <el-option
            v-for="item in state.userList"
            :key="item.userId"
            :label="`${item.firstName} ${item.lastName} <${item.email}>`"
            :value="item.userId"
          />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('tableHeader_subject')" prop="subject">
        <el-input ref="subjectRef" v-model="form.subject" disabled />
      </el-form-item>
      <el-form-item :label="$t('dpEmail.content')" prop="body">
        <div class="email-body" v-html="form.body"></div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button id="EasyForm__Detail__EmailLogs__ViewDetails__Close" :loading="state.loading"
                 @click="state.visible = false">
        {{ $t('button.close') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { clientApi } from 'api'

const emits = defineEmits(['email-update'])
const props = defineProps(['detail'])
const { t } = useI18n()
const {
  public: { endPoint }
} = useRuntimeConfig()
const state = reactive<any>({
  visible: false
})
const form = ref({
  emails: [],
  subject: 'subject',
  body: 'Dear '
})

async function handleOpen(row) {
  state.visible = true
  const email = await clientApi.api.getDmsEasyFormEmailLogId(row.id).then((res) => res.data)
  if (!email.body) email.body = ''
  if (!email.subject) email.subject = ''
  if (!email.userEmails) email.userEmails = []
  form.value.body = email.body
  form.value.subject = email.subject
  form.value.emails = email.userEmails.map(item => item.email)
}

// #endregion
defineExpose({ handleOpen })
</script>
<style lang="scss" scoped>
.email-body {
  padding: var(--app-space-xs);
  width: 100%;
  border: 1px solid var(--app-grey-400);
  border-radius: var(--app-border-radius-s);
}
</style>
