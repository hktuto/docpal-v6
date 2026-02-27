<template>
    <div class="activities">
    <div class="activitiesTitle">
      <span class="title">{{ $t('rightDetail_activities') }}</span>
      <!-- <img class="cursorPointer" src="/icons/sort.svg" /> -->
    </div>
    <div class="activitiesDetail">
      <el-timeline >
        <el-timeline-item
          v-for="(activity, index) in activities"
          :key="index"
          :timestamp="formatDate(activity.envetDateStr)"
        >
          <div class="timeline">
            <div class="userOrAction user">{{ activity.principalName }}</div>
            <div class="userOrAction action" v-if="activity.label">{{ $t(activity.label) }}</div>
          </div>
        </el-timeline-item>
        <template v-if="activities.length < totalSize">
          <el-button type="text" @click="loadMore">{{$t('loadMore')}}</el-button>
        </template>
      </el-timeline>
    </div>
  </div>
</template>


<script lang="ts" setup>
import {newClientApi } from 'api'
const props = defineProps<{doc: any}>();
const { doc } = toRefs(props);
const activities = ref<any[]>([])
const params = reactive<any>({
    pageNum: 0,
    pageSize: 20,
    documentId: doc.value.id,
})
const totalSize = ref(0);
const pageNum = ref(0);
const pageSize = ref(50);
const canLoadMore = ref(false);
const loadMore = async() => {
    pageNum.value += 1;
    params.pageNum = pageNum.value;
    await getActivities()
}
const getActivities = async () => {
    try {
    const data = await newClientApi.postDmsDocumentQueryauditevent(params).then(res => res.data)
    console.log('data', data)
    totalSize.value = data.totalSize;
    activities.value.push(...data.entryList);
    // return data.sort( (a:any,b:any) => {
    //         const dateA = dayjs(a.logDate).unix();
    //         const dateB = dayjs(b.logDate).unix();
    //         return dateB - dateA;
    //     })
    } catch(error) {
        console.log(error)
        return null
    }
}

watch(
    doc,
    async (val:any) => {
        if (val && val.id) {
          activities.value = [];
          pageNum.value = 0;
          canLoadMore.value = false;
          await getActivities()
        }
    },
    {
        immediate: true,
    }
)
</script>


<style lang="scss" scoped>
.activities {
  display: flex;
  flex-direction: column;
  height: 100%;

  .activitiesTitle {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    margin-bottom: 0.625rem;
    .title {
      font-style: normal;
      font-weight: normal;
      font-size: 1.125rem;
      line-height: 1.375rem;
      color: var(--app-grey-950);
    }
  }
  .activitiesDetail {
    overflow: auto;
    padding: var(--app-space-xs);
    :deep(ul){
      margin: 0;
      padding: 0;
    }
    // max-height: 400px;
    // overflow: auto;
    .timeline {
      display: flex;
      flex-direction: column;
      gap: calc(var(--app-space-xs) / 2);
      justify-content: flex-start;
      align-items: flex-start;
      font-style: normal;
      font-weight: bold;
      color: #ffffff;
      .timestamp {
        background: #17b2c0;
        
        padding: 0.25rem;
        font-size: 0.5rem;
        line-height: 0.5625rem;
      }
      .userOrAction {
        background: var(--app-grey-900);
        border-radius: var(--el-border-radius-base);
        padding: var(--app-space-xs) var(--app-space-s);
        font-size: .8rem;
        font-weight: 500;
        color: var(--app-grey-100);
        &.user{
          background: var(--el-color-primary-light-8);
        }
      }
    }
  }
}
</style>
