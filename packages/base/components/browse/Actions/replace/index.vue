<template>
  <BrowseActionsButton :label="$t('tip.replace')">
    <SvgIcon :src="'/icons/replace.svg'" :content="$t('tip.replace')" round :svg-class="`dp-svg-icon`"
             class="cursorPointer headerIcons"
             @click="handleOpenReplaceDialog(doc)" />
  </BrowseActionsButton>
  <BrowseActionsReplaceDialog ref="BrowseActionsReplaceDialogRef"
                              @update="emits('success')" />
</template>

<script lang="ts" setup>
import { newClientApi } from 'api'

const { t } = useI18n()
const props = defineProps<{ doc: any }>()
const emits = defineEmits(['success'])
const BrowseActionsReplaceDialogRef = ref()

async function handleOpenReplaceDialog(doc: any) {
  // check is the doc OCR status is pending
  // const { data } = await newClientApi.getNuxeoDocumentDocumentidOcrState(doc.id)
  // const status = data;
  // if(status !== "FINISH") {
  //     // Need to update user menu
  //     ElMessage({
  //         message: t('dpTip_ocrStatusError') as string,
  //         type: 'warning'
  //     })
  //     return;
  // }
  BrowseActionsReplaceDialogRef.value.handleOpen(doc)
}
</script>

<style lang="scss" scoped>
</style>
