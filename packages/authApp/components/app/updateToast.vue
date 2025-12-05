<script setup lang="ts">
import { ElNotification } from 'element-plus'
const nuxtApp = useNuxtApp()
const { t } = useI18n()
const config = useRuntimeConfig()
const toastShow = ref(false);
const appNeedUpdate = useAppNeedUpdate()
// app:manifest:update'
nuxtApp.hooks.hookOnce('app:manifest:update', () => {
  setTimeout(() => {
    showUpdateToast()
  }, (config?.public?.updateInterval as number) || 1000)
})


function showUpdateToast() {
  if (toastShow.value) return;
  toastShow.value = true;
  appNeedUpdate.value = true;
  ElNotification({
    title: 'New Version Available',
    dangerouslyUseHTMLString: true,
    message: `<strong>${t('appVersionUpdate.title')}</strong><br/><button class="el-button el-button--primary" onclick="window.location.reload()">${t('appVersionUpdate.button')}</button>`,
    duration: 0,
  })
}


onMounted(() => {
  appNeedUpdate.value = false;
})



</script>

<template>
</template>
