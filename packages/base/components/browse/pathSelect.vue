<script setup lang="ts">
import { globalApi, newAdminApi } from 'api'

const props = defineProps<{
  modelValue: string[]
  path?: string
  size?: 'large' | 'default' | 'small'
  disabled?: boolean
  showAllLevels?: boolean
  clearable?: boolean
}>()
const emits = defineEmits(['update:modelValue', 'id'])

const selectedPath = computed({
  get() {
    return props.modelValue
  },
  set(newValue) {
    emits('update:modelValue', newValue)
  }
})

const options = ref([])
const setting = computed(() => ({
  showPrefix: true,
  checkStrictly: true,
  checkOnClickNode: true
}))

async function getBrowseList(idOrPath: string) {
  const data: any = await globalApi
    .postDmsDocumentChildrenThumbnail({
      idOrPath: idOrPath,
      pageSize: 10000
    })
    .then((res) => res.data)

  return data.entryList.reduce((prev: any[], item: any) => {
    if (item.isFolder)
      prev.push({
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
    emits('id', targetId)
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

watch(
  () => props.path,
  async () => {
    let path = '/'
    if (!!props.path && props.path !== '') {
      path = props.path
    }
    options.value = await getBrowseList(path)
  },
  {
    immediate: true,
    deep: true
  }
)
</script>

<template>
  <el-cascader
    v-model="selectedPath"
    style="width: 100%"
    :size="size"
    :disabled="disabled"
    :options="options"
    :props="setting"
    @change="getNodes"
    :show-all-levels="showAllLevels"
    :clearable="clearable"
  />
</template>

<style scoped lang="scss"></style>
