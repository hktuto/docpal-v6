<script lang="ts" setup>
import { clientApi } from 'api'
import dayjs from 'dayjs'

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
  list.value = (res?.data?.entryList || []).map(item => ({
    ...item,
    timestamp: dayjs(item.timestamp).format('YYYY-MM-DD HH:mm:ss'),
  }))
}
const audit_translate = {
  "form_type_updated":"Update Form",
  "permission_revoked": "Update Premission",
  "permission_assigned":"Add Permission"
}
function translateEventType(eventType: string) {
  return audit_translate[eventType] || eventType
}

watch(projectId, () => {
  getAudit()
}, {
  immediate: true
})
</script>

<template>
  <div class="auditListContainer">
      <el-timeline  >
          <el-timeline-item
            v-for="(item, index) in list"
            :key="index"
            :timestamp="item.timestamp"
          >
              <el-card>
                <h4>{{ translateEventType(item.event_type) }}</h4>
                <pre>{{ item.details }}</pre>
                <small>{{ item.user_id }}</small>
            </el-card>
          </el-timeline-item>
        </el-timeline>
  </div>
</template>

<style lang="scss" scoped>
.auditListContainer {
  width: 100%;
  height: calc(100vh - 109px);
  padding: var(--app-space-s);
  overflow: auto;
}
.el-timeline.is-start{
    padding-left: var(--app-space-s);
}
pre{
    white-space: pre-wrap;
}
</style>
