<script lang="ts" setup>
import { routeRetentionPage } from '~/utils/routerHelper'

const props = defineProps<{
  idOrPath: string
  filter: any
  title: string
  homeId: string
}>()
</script>
<template>
  <div class="pageContainer--padding">
    <BrowseTablePage
      :idOrPath="idOrPath"
      :home="{
        secondId: homeId,
        homeRouteItem: routeRetentionPage({})
      }"
    >
    </BrowseTablePage>
  </div>
</template>
<style lang="scss" scoped></style>
