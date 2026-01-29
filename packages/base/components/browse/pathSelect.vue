<script setup lang="ts">
import { clientApi } from 'api'

const appPlatform = useAppPlatform()
const props = defineProps<{
  path?: string,
  size?: 'large' | 'default' | 'small',
  disabled?: boolean,
  showAllLevels?: boolean,
  clearable?: boolean
}>()
const idOrPath = ref('')
const options = ref([])
const setting = computed(() => ({
  showPrefix: true,
  checkStrictly: true,
  checkOnClickNode: true
}))
const emit = defineEmits(['id'])

async function getBrowseList(idOrPath: string) {
  let data: any
  if (appPlatform.value === 'admin') {
    data = await clientApi.admin.postAdmindmsDocumentChildrenThumbnail({
      idOrPath: idOrPath,
      pageSize: 10000
    }).then(res => res.data)
  } else {
    data = await clientApi.api.postDmsDocumentChildrenThumbnail({
      idOrPath: idOrPath,
      pageSize: 10000
    })
  }

  return data.entryList.reduce((prev: any[], item: any) => {
    if (item.isFolder) prev.push({
      value: item.id,
      label: item.name,
      children: [{}]
    })
    return prev
  }, [])
}

async function getNodes(id: any) {
  if (!id || id.length === 0) {
    return
  }
  try {
    const targetId = id[id.length - 1]
    const targetNode = findNodeById(options.value, targetId)
    if (targetNode.children.length > 1) {
      return
    }

    const list = await getBrowseList(targetId)

    if (targetNode) {
      targetNode.children = list
    }
  } catch (e) {
    console.log(e)
  }
}

function findNodeById(nodes: any[], targetId: string): any | null {
  for (const node of nodes) {
    if (node.value === targetId) {
      return node
    }
    if (node.children && node.children.length > 0) {
      const found = findNodeById(node.children, targetId)
      if (found) {
        return found
      }
    }
  }
  return null
}

onMounted(async () => {
  let path = '/'
  if (props.path && props.path !== '') {
    path = props.path
  }
  options.value = await getBrowseList(path)
})

watch(() => idOrPath.value, async (newVal) => {
  if (!!newVal && newVal != '' && newVal.length > 0) {
    emit('id', newVal[newVal.length - 1])
  }
})
</script>

<template>
  <el-cascader
    v-model="idOrPath"
    style="width: 100%"
    :size="size"
    :disabled="disabled"
    :options="options"
    :props="setting"
    @change="getNodes"
    :show-all-levels="showAllLevels"
    :clearable="clearable" />
</template>

<style scoped lang="scss">

</style>
