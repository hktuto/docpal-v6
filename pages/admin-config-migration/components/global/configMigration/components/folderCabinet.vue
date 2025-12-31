<script setup lang="ts">
import { clientApi } from 'api'

const { t } = useI18n()
const props = defineProps<{
  folderCabinetList: any[]
}>()

function handleEditFolderCabinet(item: any) {
  console.log('item', item)
}

const defaultProps = {
  children: 'children',
  label: 'label'
}

async function handleCreateFolderCabinet() {
  console.log('handleCreateFolderCabinet', props.folderCabinetList)

  let statue = true
  const list = []

  for (const item of Object.values(props.folderCabinetList)) {
    const data = await clientApi.api.postDmsCabinetTemplate({
      documentType: 'Folder',
      label: item.label,
      userGroups: item.userGroups,
      binds: item.binds,
      rootId: item.newRootId[0],
      status: 'A'
    }).then(r => r.data)
  }
}

defineExpose({
  handleCreateFolderCabinet
})
</script>

<template>
  <el-row :gutter="10">
    <template v-for="item in props.folderCabinetList" :key="item.key">
      <el-col :span="4">
        <el-card style="min-height: 250px; max-height: 300px;">
          <template #header>
            <div class="card-header" @dblclick="handleEditFolderCabinet(item)">
              <h4>{{ item.label }}</h4>
            </div>
          </template>
          <el-form-item label="Path" label-position="top" required>
            <browsePathSelect v-model="item.newRootId" />
          </el-form-item>
          <div style="overflow-y: auto;min-height: 60px; max-height: 100px;">
            <el-tree style="max-width: 600px" :data="item.children" :props="defaultProps" />
          </div>
        </el-card>
      </el-col>
    </template>
  </el-row>
</template>

<style scoped lang="scss">
.el-col {
  padding-block: 2px;
  padding-right: 5px;
  padding-left: 5px;
}
</style>
