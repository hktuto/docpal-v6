<script lang="ts" setup>
import { newClientApi } from 'api'
import {ElMessage} from 'element-plus'
import {logout} from '#imports'
const routerProvider = inject(MenuRouterKey)
const user = useUserState()
const config = useRuntimeConfig()
const { locales, locale, setLocale } = useI18n()
const { uploadState } = useUploadAIStore()
const isDesktop = useDesktopMode()
const tabProvider = inject(TabManagerKey)
const {menuMode} = defineProps<{menuMode?:'collapse' | 'expand'}>()

const appPlatform = useAppPlatform()
const isAdmin = useIsAdmin()
const isSuperAdmin = useIsSuperAdmin()
const appThemeEditorRef = ref<InstanceType<typeof AppThemeEditor>>()

const showSwitchMenu = computed(() => {
  return isAdmin.value || isSuperAdmin.value
})

function switchPlatform() {
  const url = appPlatform.value === 'client' ? '/admin' : '/'
  console.log('switchPlatform', url)
  window.location.href = url
}

async function changeLanguage(langCode:string) {
    const perference = useUserPreference()
    perference.value.language = langCode
    await newClientApi.putDmsUserSetting(perference.value as any)
    setLocale(langCode);
    window.location.reload()
}
function removeBaseUrl(){
   const ev = new CustomEvent('removeBaseUrl')
    window.dispatchEvent(ev)
}


function openHelp(){
    const url = "https://docpal-admin-guide.vercel.app/"
    window.open(url, "_blank");
}

function openSetting(){
// TODO: 根據不同的環境進入不同的頁面
    const newItem: any = {
      id: 'client-user-setting',
      name: 'client-user-setting',
      icon: 'lucide:user',
      label: 'admin.setting.title',
      component: 'Setting',
      props: {}
    }
    tabProvider?.openInCurrentTab(newItem)

}

function getUsernameInitials(username: string) {
    return username.split(' ').map(name => name[0]).join('')
}

function handleOpenUpload(show: boolean = false, action: 'upload' | 'ai' | '' = 'upload') {
    const ev = new CustomEvent('openUploadDrawer', { detail: action })
    document.dispatchEvent(ev)
}

</script>

<template>
    <div :class="{userMenuWidgetContainer:true, [menuMode]:true}">
        <!-- <template v-if="menuMode === 'expand'">
          <div v-if="user" class="username">
              {{ user.username }}
          </div>
          <div class="actions">
              <UploadStructureButton v-if="uploadState.uploadRequestList && uploadState.uploadRequestList.length > 0" @click="handleOpenUpload(true, 'upload')"></UploadStructureButton>
              <Notification  />
          </div>
        </template> -->

          <UploadStructureButton v-if="uploadState.uploadRequestList && uploadState.uploadRequestList.length > 0" @click="handleOpenUpload(true, 'upload')"></UploadStructureButton>
          <Notification v-if="appPlatform !== 'admin'"  />
          <AppThemeEditor ref="appThemeEditorRef" />
          <ElDropdown id="authUserSettingDropdown">
                <ElButton size="small" link >
                  <el-avatar size="small"> {{ getUsernameInitials(user.username) }} </el-avatar>
                </ElButton>
                <template #dropdown>
                    <ElDropdownItem @click="openSetting">{{ $t('adminMenu.setting') }}</ElDropdownItem>
                    <!-- <ElDropdownItem @click="appThemeEditorRef?.open()">{{ $t('adminMenu.theme') }}</ElDropdownItem> -->
                    <!-- TODO: remove this part from prodction, or mark it avalible only for super admin -->
                    <!-- <Language /> -->
                    <!-- <ElDropdownItem @click="openHelp">{{ $t('adminMenu.help') }}</ElDropdownItem> -->
                    <!-- <ElDivider /> -->
                     <ElDropdownItem v-for="lang in locales" :key="lang.code"
                        :disabled="lang.code === locale" @click="changeLanguage(lang.code)">
                        {{$t(lang.code)}}
                    </ElDropdownItem>
                    <ElDivider />
                    <template v-if="showSwitchMenu">
                      <ElDropdownItem @click="switchPlatform()">Switch to {{ appPlatform === 'admin' ? 'Client' : 'Admin' }}</ElDropdownItem>
                      <ElDivider />
                    </template>
                    <ElDropdownItem v-if="isDesktop" @click="removeBaseUrl">Reset Desktop</ElDropdownItem>
                    <ElDropdownItem @click="logout">{{ $t('login_loginOut')}}</ElDropdownItem>
                </template>
            </ElDropdown>

    </div>

</template>

<style scoped lang="scss">
.userMenuWidgetContainer{
    width: 100%;
    display: flex;
    flex-flow: row nowrap;
    justify-content: flex-start;
    align-items: center;
    gap: var(--app-space-s);
    line-height: 1;

    &.collapse{
      flex-flow: column nowrap;
    }
}
.dropdownIcon{
    --icon-size: var(--app-font-size-m);
}
.username{
    flex: 1 0 auto;
}
</style>
