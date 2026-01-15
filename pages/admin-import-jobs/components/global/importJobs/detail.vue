<template>
  <div class="import-detail-container">
    <el-form :model="job" label-position="top" label-width="100px">
      <el-form-item label="Profile Name" required>
        <el-input v-model="job.profileName" disabled />
      </el-form-item>
      <el-form-item label="Profile Id">
        <el-input v-model="job.profileId" disabled />
      </el-form-item>
      <el-form-item label="BatchId">
        <el-input v-model="job.batchId" disabled />
      </el-form-item>
      <el-divider />
      <el-form-item label="File Name" required>
        <el-input v-model="job.fileName" disabled />
      </el-form-item>
<!--      <el-form-item label="Source Folder">-->
<!--        <el-input v-model="job.source" disabled />-->
<!--      </el-form-item>-->
      <!--      <el-form-item label="Destination Folder">-->
      <!--        <el-input v-model="job.fileName" disabled />-->
      <!--      </el-form-item>-->
      <el-form-item label="Queue Order">
        <el-input-number min="0" max="5" :step="1" step-strictly v-model="job.queueOrder"
                         @change="handleChangeQueueOrder" />
      </el-form-item>
      <el-form-item label="Activity">
        <div class="activity-log">
          <div v-for="(item, idx) in job.activityLog" :key="idx">
            <span>{{ handelActivityLogFormat(item.datetime, item.type) }}</span>
            <span v-if="item.status === 'error'" style="color: red">{{ item.errorTip }}</span>
          </div>
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { adminApi } from 'api'

const { t } = useI18n()
const routerProvider = inject(MenuRouterKey)
const props = defineProps<{
  id: string
}>()
const job = ref<any>({
  id: '',
  profileName: '',
  profileId: '',
  batchId: '',
  fileName: '',
  source: '',
  queueOrder: '',
  activityLog: []
})

async function init(id: string) {
  if (!id) {
    return
  }

  try {
    job.value = await adminApi.api.getImportjobsId(id).then((res: any) => res.data)
  } catch (error) {
    job.value = {
      activityLog: []
    }
  }
}

async function handleChangeQueueOrder() {
  if (!job.value.id) {
    return
  }
  await adminApi.api.putImportjobsId(job.value.id, job.value).then(r => r.data)
  routerProvider?.message.success(t('tip_updateSuccessMsg', { modelName: null, name: null }))
}

function handelActivityLogFormat(date: string, type: string) {
  const typeString = t(`importJobs.type_${type}`)
  return `${formatDate(date)} ${typeString}`
}

onMounted(() => {
  init(props.id)
})
</script>

<style scoped>
.import-detail-container {
  padding: var(--app-space-s);
}

.activity-log {
  font-size: 14px;
  line-height: 1.8;
}
</style>
