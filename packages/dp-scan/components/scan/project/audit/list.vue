<script lang="ts" setup>
import { clientApi } from 'api'
const props = defineProps<{
  projectId:string
}>()
const { projectId } = toRefs(props)
const params = ref({
  page_size: 100,
  page_num: 0,

})
const list = ref([])
async function getAudit() {
  const p = {
    ...params.value,
    source_id: projectId.value,
  }
  const res = await clientApi.api.postAuditLogPage(p)
  list.value = res?.data?.entryList || []
  console.log("getAudit", res)
}

watch(projectId, () => {
  getAudit()
}, {
  immediate: true
})
</script>

<template>
  <div class="auditListContainer">padding implementation

  </div>
</template>

<style lang="scss" scoped>
.auditListContainer {
  width: 100%;
  height: 100%;
  padding: var(--app-space-s);
}
</style>
