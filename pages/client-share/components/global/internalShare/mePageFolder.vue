<script lang="ts" setup>
import { routeShareMePage } from "~/utils/routerHelper";

const props = defineProps<{ 
    idOrPath: string ,
    filter: any,
    title: string,
    homeId: string,
}>();

</script>
<template>
  <div class="pageContainer--padding">
    <BrowseTablePage :idOrPath="idOrPath" :home="{
      secondId: homeId,
      homeRouteItem: routeShareMePage({})
    }">
    </BrowseTablePage>
  </div>
</template>
<style lang="scss" scoped>
</style>
