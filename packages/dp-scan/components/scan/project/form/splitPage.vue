<script lang="ts" setup>
import { clientApi } from 'api'
import { ArrowDown }  from '@element-plus/icons-vue'
const props = defineProps<{
  formDetail: any
}>()
const splitPageCount = ref(1)
const splited = ref(false)
const emits = defineEmits(['back', 'next'])
const pagesList = ref<any>([]);
const loading = ref(false)
const handleCommand = (command: string) => {
  console.log(command)
}

const handleBack = () => {
  emits('back')
}
async function handleSplit() {
  loading.value = true
  if(!splitPageCount.value) return
  const data = {
    id: props.formDetail.id,
    projectId: props.formDetail.projectId,
    path: props.formDetail.pagePathList[0],
    pages: splitPageCount.value,
  }
  const res = await clientApi.api.postCaptureProjformsettingSplitpage(data)
  if(res.result){
    splited.value = true
    pagesList.value = res.data
  }
  loading.value = false
}
function handleNext() {
  emits('next')
}

</script>

<template>
  <div class="splitPageContainer">
      <Teleport :to="`#detail-${formDetail.id}`" defer>
          <el-dropdown @command="handleCommand">
              <ElButton type="primary" class="el-dropdown-link">
                Split into : {{splitPageCount}} page
                <el-icon class="el-icon--right">
                    <arrow-down />
                </el-icon>
              </ElButton>
              <template #dropdown>
                  <el-dropdown-menu>
                      <el-dropdown-item command="1">1</el-dropdown-item>
                      <el-dropdown-item command="2">2</el-dropdown-item>
                      <el-dropdown-item command="3">3</el-dropdown-item>
                      <el-dropdown-item command="custom">Custom</el-dropdown-item>
                  </el-dropdown-menu>
              </template>
          </el-dropdown>
      </Teleport>
    <div v-loading="loading" class="content">
        <template v-if="splited">
            {{pagesList}}
        </template>
        <template v-else>
            {{formDetail.pagePathList}}
        </template>
    </div>
    <div class="footer">
        <ElButton type="primary" @click="handleBack">Back</ElButton>
        <ElButton v-if="splited" type="primary" @click="handleNext">Next</ElButton>
        <ElButton v-else type="primary" @click="handleSplit">Next</ElButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.splitPageContainer {
  width:100%;
  height: 100%;
  position: relative;
  display: grid;
  grid-template-rows: 1fr min-content;
  padding: var(--app-space-s);
}

.splitHeader {
  margin-bottom: var(--app-space-m);

  h3 {
    margin: 0 0 var(--app-space-xs) 0;
  }

  p {
    color: var(--app-text-color-secondary);
    margin: 0;
  }
}

.splitContent {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder {
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  gap: var(--app-space-m);
  color: var(--app-text-color-secondary);

  .placeholderIcon {
    font-size: 64px;
    opacity: 0.5;
  }
}

</style>
