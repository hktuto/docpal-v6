<script setup lang="ts">
import { newClientApi, gatewayApi } from 'api'

const platform = useAppPlatform()
const router = useRouter()
const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const userPreference = useUserPreference()
const userId = useUserId()

const state = reactive<any>({
  form: {},
  list: [],
  notificationPreferenceList: []
})

async function init() {
  try {
    const { properties } = await newClientApi.getDmsUserProfileSetting().then((res: any) => res.data)
    if (!properties || properties.length === 0) {
      return
    }

    state.list = Object.entries(properties)
      .sort(([, v1]: any, [, v2]: any) => (v1.sort ?? 0) - (v2.sort ?? 0))
      .map(([key, value]: any) => ({
        key,
        type: value.type,
        label: value.label,
        allowUserEdit: value.allowUserEdit,
        disabled: value.display,
        readyOnly: value.readyOnly
      }))

    if (state.list.length > 0) {
      const data = await gatewayApi.users.getUsersApplication().then((res: any) => res.data)

      state.form.id = data.id
      state.list.forEach((item: any) => {
        state.form[item.key] = data[item.key]
      })
    }

    if ('groups' in state.form || 'role' in state.form) {
      const { roleName, groups } = await newClientApi.getDocpalAclUserUserid(userId.value).then((res: any) => res.data)
      state.form.role = roleName
      state.form.groups = groups.map((item: any) => item.groupName)
    }

    if ('status' in state.form) {
      const statusItem = state.list.find((item: any) => item.key === 'status')
      if (statusItem) {
        statusItem.type = 'boolean'
        state.form.status = state.form.status === 'A'
      }
    }

    state.notificationPreferenceList = await newClientApi.getNotificationSettingUserUseridPreferences(userId.value).then(res => res.data)
  } catch (e: any) {
    throw createError(e)
  }
}

const fontSize = computed({
  get() {
    if (!userPreference.value || !userPreference.value.size) {
      return 16
    } else {
      const fontSize = userPreference.value.size
      return Number(fontSize.replaceAll('px', ''))
    }
  },
  set(value) {
    if (!userPreference.value) return
    userPreference.value.size = value + 'px'
    updateStyle()
  }
})

const colorMode = computed({
  get() {
    if (!userPreference.value || !userPreference.value.color) {
      return true
    } else {
      return userPreference.value.color === 'light'
    }
  },
  set(value) {
    userPreference.value.color = value ? 'light' : 'dark'
    updateStyle()
  }
})

function updateStyle() {
  // step 1 : get HTML element
  const htmlElement = document.querySelector('html')
  if (!htmlElement) return
  // step 2 : set style
  htmlElement.style.fontSize = fontSize.value + 'px'
  // set html light or dark mode class
  if (!userPreference.value || userPreference.value.color === 'light') {
    htmlElement.classList.remove('dark')
    // set data-vxe-ui-theme attr
    htmlElement.setAttribute('data-vxe-ui-theme', 'light')
  } else {
    htmlElement.classList.add('dark')
    htmlElement.setAttribute('data-vxe-ui-theme', 'dark')
  }
}

function handleChangePassword() {
  router.push('/resetPassword')
}

const userSignatureRef = ref()

function handleChangeMangeSignatureOpen() {
  userSignatureRef.value.handleOpen()
}

async function save() {
  try {
    let newUserInfo: any = {
      id: state.form.id,
      userId: userId.value
    }
    state.list.forEach((item: any) => {
      if (!item.readyOnly) {
        newUserInfo[item.key] = state.form[item.key]
      }
    })
    await gatewayApi.users.putUsersUpdate(newUserInfo).then(r => r.data)

    await newClientApi.putDmsUserSetting(userPreference.value as any).then(r => r.data)

    await newClientApi.postNotificationSettingUserUseridSavePreferences(userId.value, state.notificationPreferenceList).then(r => r.data)

    routerProvider?.message.success(t('tip_updateSuccessMsg', { modelName: t('user_info'), name: null }))

    await init()
  } catch (e: any) {
    throw createError(e)
  }
}

onMounted(() => {
  init()
})
</script>

<template>
  <div>
    <div class="card">
      <el-row :gutter="30" class="setting-row">
        <el-col :span="11">
          <h3>{{ $t('user.setting.userProfile') }}</h3>
          <div class="form-scroll-wrapper">
            <el-form :model="state.form" label-position="top">
              <el-form-item v-for="item in state.list" :label="t(`user.setting.${item.key}`)" :key="item.key">
                <el-input v-if="item.type === 'string'" v-model="state.form[item.key]"
                          :disabled="item.readyOnly" />
                <el-input-tag
                  v-if="item.type === 'array'"
                  v-model="state.form[item.key]"
                  :disabled="item.readyOnly"
                />
                <el-switch v-if="item.type === 'boolean'" v-model="state.form[item.key]" :disabled="item.readyOnly"
                           :inactive-text="t('actions.inactive')"
                           :active-text="t('user_active')" />
              </el-form-item>
            </el-form>
          </div>

          <el-divider />
          <h3>{{ t('login_password') }}</h3>
          <el-button type="primary" @click="handleChangePassword">
            {{ t('user_editPassword') }}
          </el-button>

          <!-- <el-divider />
          <h3>{{ t('user.setting.userSignature') }}</h3>
          <el-button type="primary" @click="handleChangeMangeSignatureOpen">
            {{ t('user.setting.mangeSignature') }}
          </el-button> -->

          <el-divider />
        </el-col>

        <div class="vertical-divider"></div>

        <el-col :span="12">
          <div>
            <h3>{{ $t('user.setting.preference') }}</h3>

            <!-- <div class="colorSetting">
              <div class="label">{{ $t('userSetting_colorMode') }}</div>
              <ElSwitch v-model="colorMode" active-text="Light" inactive-text="Dark" />
            </div> -->
            <div>
              <div class="label">{{ $t('dpTool_fontSize') }}</div>
              <el-slider v-model="fontSize" style="width: 50%" :min="10" :max="24" />
            </div>
          </div>

          <el-divider />

          <!-- <div v-if="platform !== 'admin'">
            <h3 style="margin-bottom: 0">{{ t('user.setting.notificationPreference') }}</h3>
            <div class="notification-scroll-wrapper">
              <div v-for="(item, index) in state.notificationPreferenceList" :key="index">
                <h4>{{ item.name }}</h4>
                <el-checkbox v-for="ite in item.value" :label="ite.label" size="large" v-model="ite.value"
                             :key="ite.key" />
              </div>
            </div>
          </div> -->
        </el-col>
      </el-row>
    </div>
    <div class="footer-bar">
      <el-button class="fixed-save-btn" type="primary" @click="save">{{ $t('common_save') }}</el-button>
    </div>
  </div>

  <SettingUserSignature ref="userSignatureRef" :userId="userId" />

</template>

<style scoped lang="scss">
.card {
  height: calc(100vh - 70px);;
  overflow-y: auto;
  min-height: 100%;
  box-sizing: border-box;
  min-width: 0;
  position: relative;

  .el-row {
    height: 100%;
    margin: 0;
  }
}

.setting-row {
  box-sizing: border-box;
  padding-top: 16px;
  padding-left: 16px;
  display: flex;
  align-items: stretch;
  flex-wrap: wrap;
}

.form-scroll-wrapper {
  max-height: 50vh;
  overflow-y: auto;
  padding-right: 6px;

  .el-form-item {
    margin-bottom: 6px;
  }
}

.notification-scroll-wrapper {
  height: 100%;
  max-height: 65vh;
  overflow-y: auto;
  padding-right: 4px;
  padding-bottom: 22px;

  .el-checkbox.el-checkbox--large {
    height: 16px;
  }
}

.footer-bar {
  position: absolute;
  bottom: 0;
  width: 100%;
  background: var(--app-grey-950);
  z-index: 10;
  padding-bottom: 12px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
}

.fixed-save-btn {
  margin-top: 10px;
  margin-left: 16px;
}

.vertical-divider {
  width: 1px;
  background: #e0e0e0;
  margin: 0 6px;
  min-height: 300px;
  align-self: stretch;
}
</style>
