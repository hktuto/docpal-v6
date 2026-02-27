<template>
  <div class="list" v-loading="searchOptionsLoading">
    <div
      v-infinite-scroll="getList"
      :infinite-scroll-disabled="state.scrollNoMore || state.loading"
      infinite-scroll-distance="3"
      :infinite-scroll-immediate="false"
      class="list-scroll"
      v-if="!searchOptionsLoading"
    >
      <el-card v-for="(item, index) in state.list" :key="index" @dblclick="handleSearch(item)">
        <template v-for="(q, qIndex) in item.searchRequest.query" :key="'q' + qIndex">
          <div class="search-child">
            <template v-for="(c, cIndex) in q.matchs" :key="'qc' + qIndex">
              <div class="search-child-child">
                <el-tag class="el-icon--left el-tag--ellipsis search-recent-tag" type="info" size="small" effect="dark">
                  {{ $t(`searchGroup.${c.queryType}`) }}：
                  <b>{{ displayValueMap(c.queryType, c.value) }}</b>
                </el-tag>
              </div>
              <span v-if="cIndex !== q.matchs.length - 1">{{ $t(`logic.${q.condition}`) }}</span>
            </template>
          </div>
          <span v-if="qIndex !== item.searchRequest.query.length - 1">{{ $t(`logic.${item.searchRequest.condition}`) }}</span>
        </template>
        <div>{{ $t('search.result') }}: {{ item.totalSize }}</div>
      </el-card>
      <div v-if="state.loading" class="flex-x-center">{{ $t('dpTip.loading') }}</div>
      <div v-if="state.scrollNoMore" class="flex-x-center">{{ $t('dpTip.noMore') }}</div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { newClientApi } from 'api'
import { conditionDecorators } from '~/utils/searchFormHelper'
import * as mime from 'mime-types'

const state = reactive<any>({
  list: [],
  scrollNoMore: false,
  loading: false
})
const emits = defineEmits(['search'])

const searchOptions = inject('searchOptions')
const searchOptionsLoading = inject('searchOptionsLoading')
const pageParams = reactive({
  pageNum: -1,
  pageSize: 10
})
function handleSearch(item: any) {
  const data = { ...item.searchRequest }
  conditionDecorators(data)
  emits('search', data)
}

function displayValueMap(type: string, value: any) {
  switch (type) {
    case 'mimeTypes':
      const v = Array.isArray(value) ? value : [value]
      return v
        .map((v: string) => {
          if (v && v.includes('*')) {
            return v.split('*')[0]
          }
          return mime.extension(v)
        })
        .join(', ')
    case 'collections':
      if (!searchOptions.value.collections) return value
      return value
        .map((v: string) => {
          return searchOptions.value.collections.find((item: any) => item.value === v)?.label
        })
        .join(', ')
    default:
      if (Array.isArray(value)) {
        return value.join(', ')
      } else if (typeof value === 'object') {
        if (!value) return value
        return value.key && value.value ? `[${value.key}: ${value.value}]` : value
      }
      return value
  }
}
async function getList() {
  if (state.loading) return
  try {
    pageParams.pageNum++
    state.loading = true
    const res: any = await newClientApi.postDmsSearchHistory(pageParams).then(r => r.data)
    state.list.push(...res.entryList)
    state.scrollNoMore = state.list.length >= res.totalSize
  } catch (error) {
    console.log('get recent error', error)
  } finally {
    state.loading = false
  }
}
async function initList() {
  state.list = []
  pageParams.pageNum = -1
  await getList()
}

onMounted(() => {
  initList()
})
defineExpose({
  initList
})
</script>
<style lang="scss" scoped>
.list {
  height: calc(100% - 1rem);
  overflow: hidden;
}
.list-scroll {
  height: calc(100% - 1rem);
  overflow: auto;
}
.el-card {
  margin-bottom: var(--app-space-xs);
  height: fit-content !important;
}
.search-child {
  // background-color: var(--app-primary-color);

  margin-bottom: var(--app-space-xs);
}
.search-child-child {
  // background-color: var(--app-primary-color);
  background: var(--app-grey-900);
  margin-bottom: var(--app-space-xs);
  padding: var(--app-space-xs);
  border-radius: 4px;
  overflow: hidden;
  .el-tag {
    overflow: hidden;
  }
}
.search-recent-tag {
  display: block;
  text-wrap: auto;
  height: auto;
  min-height: 1.2rem;
  padding: var(--app-space-xs) !important;
}
</style>
