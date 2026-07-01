<script lang="ts" setup>
import { clientApi } from 'api'
import { ArrowDown, Rank, FullScreen } from '@element-plus/icons-vue'
import draggable from 'vuedraggable'

const routerProvider = inject(MenuRouterKey)

const props = defineProps<{
  formDetail: any
}>()
const splitPageCount = ref(1)
const splitOrder = ref();
const emits = defineEmits(['back', 'next','refresh'])
const pagesList = ref<{path: string,url?: string}[]>([]);
const loading = ref(false)
const zoomSlide = ref(1);
const isInit = ref(false)
const customSplitCountFrom = ref({
  count: undefined
});
const customSplitDialogVisible = ref(false);
const customSplitFormEl= ref();
const rules = reactive({
  count: [
    { required: true, message: 'Please enter number of pages', trigger: 'blur' },
  ],
})
function handleCustomSplit() {
  customSplitFormEl.value.validate( (valid:boolean) => {
    if(valid) {
      const newCount = Number(customSplitCountFrom.value.count)
      if(newCount !== splitPageCount.value){
        splitPageCount.value = Number(customSplitCountFrom.value.count)
        handleSplit()
      }
      customSplitDialogVisible.value = false
      customSplitCountFrom.value.count = undefined
    }
  })
}
const handleCommand = (command: string) => {
  if(!isNaN(Number(command))) {
    splitPageCount.value = Number(command)
  }else{
    customSplitDialogVisible.value = true;
  }
}

async function downloadImage(path:string) {
  const blob = await clientApi.api.postCaptureFileQuerycapturefilebypath(
    { path },
    { format: 'blob', headers: { noThrowError: true }, timeout: 0 }
  )
  return URL.createObjectURL(blob)
}

const handleBack = () => {
  emits('back')
}
async function handleSplit() {
  loading.value = true
  try {
    // clean all old image
    pagesList.value.forEach((item) => {
      if(item.url) URL.revokeObjectURL(item.url)
    })
    pagesList.value = []

    const data = {
      formId: props.formDetail.id,
      pageToSplit: splitPageCount.value,
    }
    const res = await clientApi.api.postCaptureProjformsettingSplitpage(data)
    pagesList.value = res.data.map((item: any) => ({ path: item }))
  }catch(error) {
    routerProvider?.message?.error("Split page failed")
  } finally {
    if(pagesList.value &&pagesList.value.length > 0) {
      for (const path of pagesList.value) {
        const img = await downloadImage(path.path)
        path.url = img
      }
      // sort the pagesList and pagesListImg splitOrder,
      // if splitOrder is defined and the length is matching with the pagesList length
      if (splitOrder.value && Object.keys(splitOrder.value).length === pagesList.value.length) {
        const newPagesList:{path: string, url?: string}[] = []
        for (let key in splitOrder.value) {
          const fileName = splitOrder.value[key]
          const item = pagesList.value.find((p) => {
            let lastPathSegment = p.path.split('/').pop()!
            if(lastPathSegment.includes('page')){
              lastPathSegment = lastPathSegment.split('page').pop()!
            }
            return lastPathSegment === fileName
          })
          if(item) newPagesList.push(item)
        }
        pagesList.value = newPagesList
      }
    }
    splitOrder.value = null;
    loading.value = false
      isInit.value = true
  }
}
function handleDrag(e) {
  console.log("drag", e, pagesList.value)
}
const previewDialogVisible = ref(false)
const previewImageUrl = ref<string | undefined>()
function handleFullScreen(url:string) {
  previewDialogVisible.value = true
  previewImageUrl.value = url
}
function handlePreview(url:string) {
  previewDialogVisible.value = true
  previewImageUrl.value = url
}
function calculateOrginalPageNumber(path:string){
  let lastPathSegment = path.split('/').pop()!
  if(lastPathSegment.includes('page')){
    lastPathSegment = lastPathSegment.split('page').pop()!
  }
  return lastPathSegment?.replace('.jpg', '').replace('.png', '')
}

async function handleNext(){
  // step 1: convert pagesList and splitPageCount = pageSplitConfig
  const pageSplitConfig = {
    split_into_number_of_page: splitPageCount.value,
    order: pagesList.value.reduce((acc, curr, index) => {
      acc[index+1] = calculateOrginalPageNumber(pagesList.value[index].path)+'.jpg'
      return acc
    }, {} as Record<string, string>),  };
  // step 2: create updated formDetail
  const updateData = {
    ...props.formDetail,
    pageSplitConfig,
  }
  delete updateData.updatedBy
  delete updateData.updatedAt
  delete updateData.createdAt
  delete updateData.createdBy
  await clientApi.api.putCaptureProjformsetting(updateData)
  routerProvider?.message.success('Classification configuration saved')
  emits('refresh')
  emits('next')
}

watch(splitPageCount, (newVal, oldVal) => {
  if(!isInit.value || oldVal === newVal) return
  handleSplit()
})
onMounted(() => {

  splitPageCount.value = props.formDetail.pageSplitConfig?.split_into_number_of_page || 1
  // TODO：　check stored order to reorder on first mount
  splitOrder.value = props.formDetail.pageSplitConfig?.order || null;
  handleSplit()

})
</script>

<template>
  <div class="splitPageContainer">
      <Teleport :to="`#detail-${formDetail.id}`" defer>
          <el-dropdown @command="handleCommand" :disabled="loading">
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
    <div v-loading="loading" class="content" :style="`--image-width: ${150 * zoomSlide}px`">
        <draggable
          tag="div"
          :list="pagesList"
          class="reorderGrid"
          handle=".handle"
          item-key="path"
          @end="handleDrag"
        >
            <template #item="{ element, index }">
            <div class="item">

                <img class="img" :src="element.url" alt="" />
                <div class="page-number">
                    <el-icon class="handle">
                        <Rank/>
                    </el-icon>
                {{ calculateOrginalPageNumber(element.path) }}
                <el-icon class="full-screen" @click="handleFullScreen(element.url)">
                    <FullScreen/>
                </el-icon>
                </div>
            </div>
            </template>
        </draggable>

    </div>
    <div class="slider">
        <el-slider v-model="zoomSlide" :min="0.6" :max="2" :step="0.1" />
    </div>
    <div class="footer">

        <ElButton type="info" @click="handleBack">Back</ElButton>
        <ElButton type="primary" @click="handleNext">Next</ElButton>
    </div>
    <ElDialog v-model="previewDialogVisible" title="Preview">
        <img v-if="previewImageUrl" class="previewImg" :src="previewImageUrl" alt="" />
    </ElDialog>
    <ElDialog v-model="customSplitDialogVisible" title="Custom Split">
        <ElForm :model="customSplitCountFrom" ref="customSplitFormEl" :rules="rules" label-position="top">
            <ElFormItem prop="count" label="Custom Split">
                <ElInput v-model="customSplitCountFrom.count" type="number" placeholder="Enter number of pages" />
            </ElFormItem>
        </ElForm>
        <ElButton type="info" @click="customSplitDialogVisible = false">Cancel</ElButton>
        <ElButton type="primary" @click="handleCustomSplit">Confirm</ElButton>
    </ElDialog>
  </div>
</template>

<style lang="scss" scoped>
.splitPageContainer {
    --image-width: 150px;
  width:100%;
  height: 100%;
  position: relative;
  display: grid;
  grid-template-rows: 1fr min-content min-content;
  padding: var(--app-space-s);
}
.page-number{
    background-color: #fff;
    width:100%;
    text-align: left;
    display: flex;
    padding: var(--app-space-xs);
    justify-content: space-between;
    align-items: center;
    gap: var(--app-space-s);
    white-space: wrap;
    .handle{
        color: var(--app-grey-300);
    }
}
.content{
    width: 100%;
    overflow: auto;
    position: relative;
}
.reorderGrid{
    width:100%;
    max-width: 800px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, var(--image-width));
    grid-gap: var(--app-space-s);
    .item{
        position: relative;
        overflow: hidden;
        border: 1px solid #ccc;

        .img{
            width: 100%;
            object-fit: contain;
            height: auto;
        }
    }
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
.previewImg{
width:100%;
object-fit: contain;
}
</style>
