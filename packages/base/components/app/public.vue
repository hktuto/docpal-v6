<script lang="ts" setup>
import { newClientApi } from 'api'
import zhCN from 'vxe-table/lib/locale/lang/zh-CN'
import enUS from 'vxe-table/lib/locale/lang/en-US'
import zhHK from 'vxe-table/lib/locale/lang/zh-HK'
const langReady = ref(false)
async function getLocale() {
  console.log('getLocale')
  const { locale, availableLocales, setLocaleMessage } = useI18n()
  await Promise.all(
    availableLocales.map(async (code) => {
      const vxeLang = code === 'zh-CN' ? zhCN : code === 'en-US' ? enUS : zhHK
      const { data: clientData } = (await newClientApi.getDmsFormPropertiesLanguageList({
        locale: code,
        languageKey: 'client'
      })) as any
      const clientJson = JSON.parse(clientData[0].languageContent)
      const { data: adminData } = (await newClientApi.getDmsFormPropertiesLanguageList({
        locale: code,
        languageKey: 'admin'
      })) as any
      const adminJson = JSON.parse(adminData[0].languageContent)
      const { data: metaData } = (await newClientApi.getDmsFormPropertiesLanguageList({
        locale: code,
        languageKey: 'meta'
      })) as any
      const metaJson = JSON.parse(metaData[0].languageContent)
      setLocaleMessage(code, {
        ...clientJson,
        ...adminJson,
        ...metaJson,
        ...vxeLang
      })
    })
  )
  langReady.value = true
}

onMounted(async () => {
  await getLocale()
})
</script>

<template>
  <Transition appear>
    <slot v-if="langReady" />
  </Transition>
</template>
