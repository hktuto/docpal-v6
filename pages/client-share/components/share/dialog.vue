<template>
  <el-dialog v-model="dialogVisible" :title="$t('externalSharing_edit')" append-to-body>
    <el-form ref="formRef" :model="form" label-width="120px" label-position="top" @submit.native.prevent>
      <el-form-item
        :label="$t('tableHeader_emailList')"
        prop="emailList"
        :rules="[
          {
            required: true,
            message: $t('tableHeader_emailList') + $t('render.hint.fieldRequired'),
            trigger: 'change'
          }
          // {
          //     validator: emailValidate,
          //     trigger: 'change'
          // }
        ]"
      >
        <el-select
          v-model="form.emailList"
          ref="selectRef"
          multiple
          allow-create
          clearable
          filterable
          default-first-option
          :placeholder="$t('vxe.base.pleaseInput')"
          :aria-label="$t('tip_enterAfterInput')"
          @change="handleSelectChange"
        >
          <el-option v-for="item in state.contactList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
        <!-- <el-input-tag v-model="form.emailList" clearable draggable :placeholder="$t('vxe.base.pleaseInput')" :aria-label="$t('tip_enterAfterInput')">
        </el-input-tag> -->
      </el-form-item>
      <el-form-item :label="$t('share_shareLink')">
        <el-input v-model="shareLink" readonly type="text" class="cursorPointer" @click="handleCopy(shareLink)">
          <template #suffix>
            <el-icon @click="handleCopy(shareLink)">
              <CopyDocument />
            </el-icon>
          </template>
        </el-input>
      </el-form-item>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item
            :label="$t('share_password')"
            prop="password"
            :rules="[{ required: true, message: $t('share_password') + $t('render.hint.fieldRequired') }]"
          >
            <el-input v-model="form.password" clearable type="text" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item
            :label="$t('tableHeader_dueDate')"
            prop="dueDate"
            :rules="[{ required: true, message: $t('tableHeader_dueDate') + $t('render.hint.fieldRequired') }]"
          >
            <el-date-picker v-model="form.dueDate" type="datetime" :default-time="defaultTime" :shortcuts="shortcuts" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button id="ExternalSharing__EditSharingRequest__Cancel" @click="dialogVisible = false">
        {{ $t('dpButtom_cancel') }}
      </el-button>
      <el-button id="ExternalSharing__EditSharingRequest__Submit" type="primary" @click="handleSubmit">
        {{ $t('submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ElMessage } from 'element-plus'
import { CopyDocument } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'
import { Base64 } from 'js-base64'
import { clientApi } from 'api'
const routerProvider = inject(MenuRouterKey)
const { diffMinute } = useTime()
const {
  public: { endPoint }
} = useRuntimeConfig()
const { t } = useI18n()
const route = useRoute()
const state = reactive<any>({
  userList: [],
  shareLink: '',
  defaultTime: new Date(2000, 1, 1, 23, 59, 59),
  shortcuts: [
    {
      text: `1 ${t('common_day')}`,
      value: () => {
        const date = new Date()
        date.setTime(date.getTime() + 3600 * 1000 * 24)
        return date
      }
    },
    {
      text: `7 ${t('common_days')}`,
      value: () => {
        const date = new Date()
        date.setTime(date.getTime() + 3600 * 1000 * 24 * 7)
        return date
      }
    },
    {
      text: `30 ${t('common_days')}`,
      value: () => {
        const date = new Date()
        date.setTime(date.getTime() + 3600 * 1000 * 24 * 30)
        return date
      }
    }
  ],
  shareId: '',
  contactList: []
})
const value1 = ref()
const emit = defineEmits(['submit'])
// #region module: dialog
const dialogVisible = ref(false)

const emailPattern =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

const emailValidate = (rule: any, value: any, callback: any) => {
  value.forEach((item) => {
    if (!emailPattern.test(item)) {
      // if (form.emailList.length > 0) {

      // }
      callback(new Error($t('tip.enterValidEmail')))
    }
  })
  callback()
}

function handleOpen(shareInfo: any) {
  let decodePwd = Base64.decode(shareInfo.password) //解密
  state.shareId = shareInfo.shareID
  initFormatItem({ ...shareInfo, password: decodePwd })
  dialogVisible.value = true
}

// #endregion
// #region module: form
const formRef = ref<FormInstance>()
const form = reactive<any>({
  emailList: [],
  password: '',
  dueDate: ''
})

function isValidateEmail(emailList) {
  let isValidate = true
  const contactList = state.contactList
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

  emailList.forEach((item: any) => {
    if (!emailRegex.test(item) && !isInContactList(item)) {
      ElMessage.error(t('tip.enterValidEmail') + ' 【' + item + '】')
      isValidate = false
    }
  })
  return isValidate
  function isInContactList(email: string) {
    return contactList.some((item: any) => item.value === email)
  }
}
async function handleSubmit() {
  const valid = await formRef.value.validate((valid, fields) => valid)
  if (!valid) return
  if (!isValidateEmail(form.emailList)) return
  const param = {
    emailList: form.emailList,
    password: form.password,
    tokenLiveInMinutes: diffMinute(form.dueDate),
    shareId: state.shareId
  }

  routerProvider?.message.success(t('tip_updateMsg', { modelName: t('externalSharing_sharingRequest'),name: null }))
  emit('submit', param)
  dialogVisible.value = false
}

// #endregion
function initFormatItem(shareInfo: any) {
  form.emailList = shareInfo.emailList
  form.password = shareInfo.password || ''
  form.dueDate = shareInfo.expiredDate
  const origin = endPoint?.upload
  state.shareLink = `${origin}/share?token=${shareInfo.accessToken}`
  setTimeout(() => {
    formRef.value.clearValidate()
  })
}

function handleCopy(copyContent: string) {
  copy(copyContent, t('common_copySuccess'))
}
async function getContactList() {
  state.contactList = await clientApi.api.getDmsContactGroupList().then((res) => res.data)
}
const selectRef = ref()
function handleSelectChange() {
  selectRef.value.blur()
  setTimeout(() => {
    selectRef.value.focus()
  })
}
onMounted(async () => {
  getContactList()
})
const { defaultTime, shortcuts, shareLink, userList } = toRefs(state)
defineExpose({ handleOpen })
</script>

<style scoped lang="scss"></style>
