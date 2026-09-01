<template>
  <div class="popContainer">
    <!-- <div v-if="doc.version || doc.version == '0'" class="noVersionContainer">
      {{ doc.version }}
    </div> -->
    <el-popover ref="PopoverRef" :disabled="!RbacAllowTo('write', doc)" :width="420" trigger="click" placement="bottom" popper-class="popover__version">
      <div style="overflow: auto">
        <el-table ref="TableRef" :data="tableData" height="250px" rowKey="version">
          <el-table-column prop="version" :label="$t('file_versionNumber')"> </el-table-column>
          <el-table-column prop="time" :label="$t('table_lastModified')"> </el-table-column>
          <el-table-column :label="$t('tableHeader_actions')" align="center" width="100">
            <template #default="scope">
              <img v-if="scope.row.version !== doc.version" class="cursorPointer" :src="'/icons/version.svg'" round @click="toVersionComparison(scope.row)" />
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #reference>
        <div id="popover__reference" :class="['cursorPointer', { active: popoverShow }]" >
          {{ doc.version }}
          <i class="el-icon-arrow-down el-icon--right"></i>
        </div>
      </template>
    </el-popover>
  </div>
</template>

<script lang="ts" setup>
import { newClientApi } from 'api'
const props = defineProps<{
  doc: any
}>()
const { doc } = toRefs(props)
const routerProvider = inject(MenuRouterKey)
const PopoverRef = ref()
const popoverShow = ref(false)
const { displayTime } = useTime()

const data = ref()
const TableRef = ref()
const tableData = ref([])
const options = ref({
  showPagination: false
})

function handlerRowClick(_row: any, _column: any, _event: any) {}
function toVersionComparison(row: any) {
  // close detail
  // const ev = new CustomEvent('closeFilePreview', { detail: props.doc });
  // document.dispatchEvent(ev);
  const newItem = createVersionComparisonPageParams({
    id: props.doc.id,
    name: props.doc.name,
    oldVersionNum: row.version
  })
  routerProvider?.navigateTo(newItem)
}
function hidePopover() {
  // let box = document.getElementById("popover__version")
  // if(!box.contains(e.target)){
  popoverShow.value = false
  // }
}

async function getList() {
  const res = await newClientApi.postDmsDocumentVersionList({ idOrPath: props.doc.id }).then((res) => res.data)
  const result = []
  Object.keys(res).forEach((key) => {
    result.push({ version: key, time: displayTime(res[key]) })
  })
  result.sort((a, b) => b.version - a.version)
  tableData.value = result
}

watch(
  doc,
  (newValue) => {
    if (!props.doc.isFolder) getList()
    if (popoverShow.value) {
      PopoverRef.value.doClose()
    }
  },
  { deep: true, immediate: true }
)

onMounted(() => {
  document.addEventListener('click', hidePopover)
})
onUnmounted(() => {
  document.removeEventListener('click', hidePopover)
})
</script>
