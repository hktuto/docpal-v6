<script setup lang="ts">
import { newAdminApi } from 'api'

const props = defineProps<{
  homePageList: any[]
}>()

function handelJson(json: string) {
  return JSON.parse(json)
}

function handleEditStyle(styleItem: any) {
  console.log('styleItem', styleItem)
}

async function handleCreateHomePage() {
  const list = []

  for (const item of Object.values(props.homePageList)) {
    try {
      const data = await newAdminApi.postDocpalPersonalDashboardSave({
        name: item.name,
        groupId: item.groupId,
        styleJson: item.styleJson
      }).then(res => res.data)
    } catch (e) {
      list.push(item.name)
    }
  }
}

defineExpose({
  handleCreateHomePage
})

</script>

<template>
  <el-row :gutter="10">
    <template v-for="item in props.homePageList" :key="item.key">
      <el-col :span="5">
        <el-card style="min-height: 200px; max-height: 200px;">
          <template #header>
            <div class="card-header">
              <h4>{{ item.name }}</h4>
            </div>
          </template>
          <div class="tag-container">
            <el-tag v-for="styleItem in handelJson(item.styleJson)" :key="styleItem.label" size="small"
                    @dblclick="handleEditStyle(styleItem)">
              {{ styleItem.label }}
            </el-tag>
          </div>
        </el-card>
      </el-col>
    </template>
  </el-row>
</template>

<style scoped lang="scss">
.tag-container {
  display: flex;
  flex-wrap: wrap;
  max-height: 130px;
  overflow-y: auto;
  gap: 2px;
}

.el-col {
  padding-block: 2px;
  padding-right: 5px;
  padding-left: 5px;
}
</style>
