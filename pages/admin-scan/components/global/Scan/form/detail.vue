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
