<script lang="ts" setup>
import { newClientApi } from 'api';

const { title, parentRef,docId } = defineProps<{
    title: string,
    docId:string,
    parentRef: string,
}>();


const emits = defineEmits(['itemClick'])

async function loadData(entry: any[], path?: string, pageNum: number = 0) {
  const data = await newClientApi.postDmsDocumentChildrenThumbnail({
    idOrPath: path,
    pageSize: 1000,
    pageNum
  }).then(r => r.data)

  const list = data.entryList.filter(item => item.isFolder === false && item.source !== 'tempFile').map(e => ({
    label: e.name,
    value: e.id
  }))

  entry.push(...list)
  if (data.isNextPageAvailable) {
    return loadData(entry, path, pageNum + 1)
  } else {
    return entry
  }
}

const fileList = ref([])


function command(newFileId: any) {
    value.value = newFileId
    emits('itemClick', newFileId)
}
const value = ref(docId)
const inputWidth = ref(200);
onMounted(async () => {
    fileList.value = await loadData([], parentRef )
    inputWidth.value = Math.min( Math.max(title.length * 15, 200) , 500)
})

</script>


<template>
    <div v-if="fileList.length === 0" class="fileNameTitle">
      {{ title }}
    </div>
    <el-select-v2
        v-else
        v-model="value"
        :options="fileList"
        placeholder="Please select"
        size="large"
        :style="`width: ${inputWidth}px`"
        @change="command"
    >
    </el-select-v2>
    <!-- <el-dropdown @command="command">
    <span class="el-dropdown-link">
      {{ title }}
      <el-icon class="el-icon--right">
        <ArrowDown  />
      </el-icon>
    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item v-for="file in fileList" :key="file.id" :command="file.id">{{ file.name}}</el-dropdown-item>
        <el-dropdown-item v-for="file in fileList" :key="file.id" :command="file.id">{{ file.name}}</el-dropdown-item>
        <el-dropdown-item v-for="file in fileList" :key="file.id" :command="file.id">{{ file.name}}</el-dropdown-item>
        <el-dropdown-item v-for="file in fileList" :key="file.id" :command="file.id">{{ file.name}}</el-dropdown-item>
        <el-dropdown-item v-for="file in fileList" :key="file.id" :command="file.id">{{ file.name}}</el-dropdown-item>
        <el-dropdown-item v-for="file in fileList" :key="file.id" :command="file.id">{{ file.name}}</el-dropdown-item>
        <el-dropdown-item v-for="file in fileList" :key="file.id" :command="file.id">{{ file.name}}</el-dropdown-item>
        <el-dropdown-item v-for="file in fileList" :key="file.id" :command="file.id">{{ file.name}}</el-dropdown-item>
        <el-dropdown-item v-for="file in fileList" :key="file.id" :command="file.id">{{ file.name}}</el-dropdown-item>
        <el-dropdown-item v-for="file in fileList" :key="file.id" :command="file.id">{{ file.name}}</el-dropdown-item>
        <el-dropdown-item v-for="file in fileList" :key="file.id" :command="file.id">{{ file.name}}</el-dropdown-item>
        <el-dropdown-item v-for="file in fileList" :key="file.id" :command="file.id">{{ file.name}}</el-dropdown-item>
        <el-dropdown-item v-for="file in fileList" :key="file.id" :command="file.id">{{ file.name}}</el-dropdown-item>
        <el-dropdown-item v-for="file in fileList" :key="file.id" :command="file.id">{{ file.name}}</el-dropdown-item>
        <el-dropdown-item v-for="file in fileList" :key="file.id" :command="file.id">{{ file.name}}</el-dropdown-item>
        <el-dropdown-item v-for="file in fileList" :key="file.id" :command="file.id">{{ file.name}}</el-dropdown-item>
        <el-dropdown-item v-for="file in fileList" :key="file.id" :command="file.id">{{ file.name}}</el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown> -->

</template>

<style scoped>
.el-dropdown-link {
  cursor: pointer;
  font-size: var(--app-font-size-l);
}
</style>