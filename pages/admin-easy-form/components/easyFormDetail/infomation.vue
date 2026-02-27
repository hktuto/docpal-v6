<template>
  <el-card>
    <h3 class="title">{{ $t('easyForm.formInfomation') }}</h3>
    <EasyFormDraggable
      v-if="detail.information"
      :list="detail.information"
      :dragHeader="dragHeader"
      :showDrag="false"
      formJsonUrl="admin/easyFormInfomation.json"
      @change="handleSave()"
    />
  </el-card>
</template>
<script lang="ts" setup>
import { newAdminApi } from 'api'

const props = defineProps(['detail'])
const { t } = useI18n()
const dragHeader = [
  { name: 'name', label: t('docType_label') },
  { name: 'type', label: t('docType_type'), i18n: 'marsterTable.type.' }
]

async function handleSave() {
  const information = props.detail.information.map((item) => ({
    name: item.name,
    type: item.type
  }))
  await newAdminApi.postDmsEasyFormSaveInformation({
    information,
    id: props.detail.id
  })
}
</script>
<style lang="scss" scoped></style>
