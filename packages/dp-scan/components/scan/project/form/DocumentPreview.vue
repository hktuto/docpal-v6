<template>
  <div class="document-preview">
    <!-- Toolbar -->
    <div class="preview-toolbar">
      <div class="toolbar-left">
        <!-- Page Navigation -->
        <div v-if="pageCount > 1" class="page-nav">
          <ElButton
            circle
            size="small"
            :disabled="currentPage <= 1"
            @click="prevPage"
          />
          <span class="page-info">Page {{ currentPage }} / {{ pageCount }}</span>
          <ElButton
            circle
            size="small"
            :disabled="currentPage >= pageCount"
            @click="nextPage"
          />
        </div>
        <slot name="toolbar-left" />
      </div>
      <div class="zoom-controls">
        <ElButton
          circle
          size="small"
          :disabled="zoom <= MIN_ZOOM"
          @click="zoomOut"
        />
        <span class="zoom-text">{{ Math.round(zoom * 100) }}%</span>
        <ElButton
          circle
          size="small"
          :disabled="zoom >= MAX_ZOOM"
          @click="zoomIn"
        />
        <ElButton size="small" @click="resetZoom">Reset</ElButton>
      </div>
    </div>

    <!-- Canvas Container -->
    <div
        ref="canvasContainerRef"
        class="preview-container"
    >
        <div class="canvas"
      <canvas id="canvas" ref="canvasRef"  />
    </div>
  </div>
</template>

<script setup lang="ts">
import {fabric}  from "fabric";
import { clientApi } from 'api'
import { loadPDF, pdfPageToImageUrl, isPDFFile } from '#imports'
import { ElMessage } from 'element-plus'

// ==================== Constants ====================
const MIN_ZOOM = 0.25
const MAX_ZOOM = 4.0
const ZOOM_STEP = 0.25
const DEFAULT_CROP_SIZE = 200

const CROP_COLORS = {
  section: '#FF6B6B',
  field: '#4ECDC4',
  qrcode: '#45B7D1',
  active: '#FFA07A'
}

// ==================== Types ====================
type CropType = 'section' | 'field' | 'qrcode'

export interface CropItem {
  id: string
  type: CropType
  page: number
  zone: string
  label?: string
  color?: string
  [key: string]: any
}

export interface CropInput {
  id?: string
  type: CropType
  page?: number
  zone?: string
  label?: string
  [key: string]: any
}

// ==================== Props & Emits ====================
const emit = defineEmits<{ update: [crop: CropItem]; remove: [cropId: string | number] }>()

// ==================== State ====================
const canvasRef = ref<HTMLCanvasElement>()
const canvasContainerRef = ref()
const canvasScale = ref(1)
// Fabric canvas instance
let canvas: fabric.Canvas | null = null


// Document data
const documentPaths = ref<string[]>([])
const currentPage = ref(1)
const pageCount = ref(0)
const pageImges = new Map()
const loading = ref(false)

// Crops
const crops = ref<CropItem[]>([])
const activeCropId = ref<string | number | null>(null)
const cropObjects = ref<Map<string | number, fabric.Rect>>(new Map())

// Zoom
const zoom = ref(1)

// ==================== Public Methods ====================

async function init(documentUrlList: string[], existingCrops?: CropItem[]) {
  documentPaths.value = documentUrlList
  pageCount.value = documentUrlList.length
  currentPage.value = 1
  crops.value = existingCrops || []
  activeCropId.value = null
  cropObjects.value.clear()
  zoom.value = 1
  loadPage(1)
}

function addCrop(cropInput: CropInput) {

}

async function loadPage(pageNum: number) {
    // check if image is already load in pageImges
    let exitPageImage = pageImges.get(pageNum)
    if(!exitPageImage) {
      //check if the file is a valid imgUrl
      const url = documentPaths.value[pageNum -1]
      if(url.startsWith('data:')){
        pageImges.set(pageNum, url)
        exitPageImage = url
      }else{
        const imgUrl = await loadImageFromPath(documentPaths.value[pageNum -1])
        pageImges.set(pageNum, imgUrl)
        exitPageImage = imgUrl
      }
    }
    // init canvas
    if(canvas){
      canvas.dispose()
    }

    canvas = new fabric.Canvas(canvasRef.value);
    // set background
    fabric.Image.fromURL(exitPageImage, (img:any) => {
      canvas.setWidth(img.width)
      canvas.setHeight(img.height)
      img.set({
          selectable: false,
          width: img.width,
          height: img.height,
      });
      canvas.add(img);
      img.sendToBack();
      console.log("img load", img.width, img.height)
    });

}

async function loadImageFromPath(path: string): Promise<string | null> {
  try {
    const blob = await clientApi.api.postCaptureFileQuerycapturefilebypath(
      { path },
      { format: 'blob', headers: { noThrowError: true } }
    )
    return URL.createObjectURL(blob)

  } catch (error) {
    console.error('Failed to load image:', error)
    return null
  }
}


function prevPage(){

}

function nextPage() {

}

function zoomIn(){}

function zoomOut(){}

// ==================== Expose ====================
defineExpose({ init, addCrop })
</script>

<style scoped>
.document-preview{
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
    display:grid;
    grid-template-rows: min-content 1fr;
    gap: 0;
}
.preview-toolbar{
    padding: var(--app-space-s);
    border-bottom:1px solid var(--app-grey-800);
}
.preview-container{
    background: var(--app-grey-950);
}
#canvas{
    background: #fff;
    margin: 0 auto;
}
</style>
