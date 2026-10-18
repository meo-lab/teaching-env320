<script setup>
import { ref } from 'vue'

const initialUrl = 'https://ows.terrestris.de/osm/service?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=OSM-WMS&STYLES=&SRS=EPSG:25832&BBOX=363400,5620400,367000,5621600&WIDTH=900&HEIGHT=300&FORMAT=image/png'
const urlInput = ref(initialUrl)
const submittedUrl = ref('')
const error = ref('')

function loadMap() {
  try {
    const url = new URL(urlInput.value.trim())
    if (!['http:', 'https:'].includes(url.protocol))
      throw new Error('unsupported protocol')

    error.value = ''
    submittedUrl.value = url.toString()
  }
  catch {
    submittedUrl.value = ''
    error.value = 'Please enter a valid http or https image URL.'
  }
}

function handleImageError() {
  error.value = 'The map image could not be loaded. Check the URL and BBOX values.'
}

function handleImageLoad() {
  error.value = ''
}
</script>

<template>
  <form class="mt-2" @submit.prevent="loadMap">
    <div class="flex items-stretch gap-3">
      <textarea
        v-model="urlInput"
        rows="4"
        spellcheck="false"
        aria-label="WMS GetMap URL"
        class="min-w-0 flex-1 resize-none rounded-lg border-2 border-blue-700 bg-white px-3 py-2 font-mono text-[0.82rem] leading-snug text-gray-800 shadow-sm outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
        @keydown.enter.prevent="loadMap"
      />
      <button
        type="submit"
        class="shrink-0 rounded-lg bg-blue-800 px-5 text-[0.92rem] font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
      >
        Load map
      </button>
    </div>

    <div class="mt-1.5 font-mono text-[0.78rem] font-bold text-blue-900">
      <span class="rounded bg-yellow-100 px-2 py-0.5 ring-1 ring-yellow-400">BBOX</span>
      = WEST, SOUTH, EAST, NORTH
    </div>
  </form>

  <div class="relative mt-2 flex h-[245px] items-center justify-center overflow-hidden rounded-xl border border-gray-300 bg-gray-100">
    <img
      v-if="submittedUrl"
      :src="submittedUrl"
      class="h-full w-full object-contain"
      alt="Raster map returned by the submitted WMS GetMap URL"
      @load="handleImageLoad"
      @error="handleImageError"
    />
    <div v-else-if="!error" class="text-[0.92rem] font-semibold text-gray-400">
      Edit the request, then load the map
    </div>
    <div
      v-if="error"
      class="absolute inset-x-6 top-1/2 -translate-y-1/2 rounded-lg border border-red-300 bg-white/95 px-4 py-3 text-center text-[0.88rem] font-semibold text-red-700 shadow"
      role="alert"
    >
      {{ error }}
    </div>
  </div>

  <div class="mt-1 text-center text-[0.66rem] leading-tight text-gray-500">
    © OpenStreetMap contributors · WMS provided by terrestris
  </div>
</template>
