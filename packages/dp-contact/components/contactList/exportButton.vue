<template>
  <el-dropdown @command="handleExport">
    <el-button :loading="loading" type="primary"> {{ $t('button.export', { name: $t('data') }) }} </el-button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="excel">{{ $t('button.export', { name: 'Excel' }) }}</el-dropdown-item>
        <el-dropdown-item command="csv">{{ $t('button.export', { name: 'CSV' }) }}</el-dropdown-item>
        <el-dropdown-item command="vcf">{{ $t('button.export', { name: 'vCard(VCF)' }) }}</el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>
<script lang="ts" setup>
import { newClientApi } from 'api'

const props = defineProps<{
  id: string
  name: string
  detail: any
}>()
const { t } = useI18n()
const loading = ref(false)
async function handleExport(command: string) {
  try {
    loading.value = true
    const res = await newClientApi.postDmsContactGroupIdContactdetailExport(
      props.id,
      {
        fileType: command
      },
      { format: 'blob', timeout: 0 }
    )

    downloadBlob(res, props.name)
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>
<style lang="scss" scoped></style>
