<script lang="ts" setup>

const dialogEl = useTemplateRef('dialogEl');


function open(setting: any) {
  dialogEl.value.open()
}

function close() {
  dialogEl.value.close()
}
</script>


<template>
    <UiPopoverDialog ref="dialogEl">

    </UiPopoverDialog>
</template>
