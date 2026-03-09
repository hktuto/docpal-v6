<script lang="ts" setup>
import { clientApi } from 'api'
const props = defineProps<{
  formId:string
}>()

</script>

<template>
    <div class="pageContainer">
        <ScanProjectFormDetail :formId="formId" />
    </div>
</template>

<style scoped>
.pageContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  margin: 0 auto;
}
</style>
