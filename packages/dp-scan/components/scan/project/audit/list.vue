<script lang="ts" setup>
import { clientApi } from 'api'
const props = defineProps<{
  projectId:string
}>()
const { projectId } = toRefs(props)
const params = ref({
  page_size: 100,
  page_num: 1,

})
async function getAudit() {
  const p = {
    ...params.value
  }
  const res = await clientApi.api.postAuditLogPage(p)
  console.log(res)
}

watch(projectId, () => {
  getAudit()
})
</script>

<template>
  <div class="auditListContainer">padding implementation</div>
</template>

<style lang="scss" scoped>
.auditListContainer {
  width: 100%;
  height: 100%;
  padding: var(--app-space-s);
}
</style>
