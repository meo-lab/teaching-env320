<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const initialUrl = 'https://www.wfs.nrw.de/geobasis/wfs_nw_alkis_vereinfacht?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=ave:GebaeudeBauwerk&COUNT=1000&SRSNAME=urn:ogc:def:crs:EPSG::4326&BBOX=50.719330278357,7.064421982400,50.730951027518,7.115835758151,urn:ogc:def:crs:EPSG::4326'
const urlInput = ref(initialUrl)
const rawGmlGeometry = ref('')
const geoJsonGeometry = ref(null)
const responseWkt = ref('')
const activeFormat = ref('GML')
const mapElement = ref(null)
const copied = ref(false)
const statusMessage = ref('Edit the request, then run the WFS query')
const error = ref('')
const loading = ref(false)
const activeUrl = ref('')
let controller = null
let requestNumber = 0
let copyTimer = null
let map = null
let geometryLayer = null

const codeContent = computed(() => {
  if (activeFormat.value === 'GeoJSON')
    return geoJsonGeometry.value ? JSON.stringify(geoJsonGeometry.value, null, 2) : ''
  if (activeFormat.value === 'WKT')
    return responseWkt.value
  return rawGmlGeometry.value
})

function childElementsByLocalName(parent, localName) {
  return Array.from(parent.children).filter(child => child.localName === localName)
}

function parseCoordinateList(element) {
  const values = element.textContent.trim().split(/\s+/).map(Number)
  const dimension = Number(element.getAttribute('srsDimension') || element.closest('[srsDimension]')?.getAttribute('srsDimension') || 2)
  const srsName = element.closest('[srsName]')?.getAttribute('srsName') || ''
  if (!values.length || values.some(value => !Number.isFinite(value)) || values.length % dimension !== 0)
    throw new Error('Invalid GML coordinate list')

  const coordinates = []
  for (let index = 0; index < values.length; index += dimension) {
    const position = values.slice(index, index + dimension)
    coordinates.push(srsName.endsWith('::4326') ? [position[1], position[0], ...position.slice(2)] : position)
  }
  return coordinates
}

function parseRing(boundary) {
  const posList = Array.from(boundary.getElementsByTagNameNS('http://www.opengis.net/gml/3.2', 'posList'))[0]
  if (!posList)
    throw new Error('GML polygon ring has no posList')
  return parseCoordinateList(posList)
}

function parsePolygon(polygon) {
  const exterior = Array.from(polygon.getElementsByTagNameNS('http://www.opengis.net/gml/3.2', 'exterior'))[0]
  if (!exterior)
    throw new Error('GML polygon has no exterior ring')
  const rings = [parseRing(exterior)]
  for (const interior of polygon.getElementsByTagNameNS('http://www.opengis.net/gml/3.2', 'interior'))
    rings.push(parseRing(interior))
  return rings
}

function parseGeometry(feature) {
  const geometryProperty = childElementsByLocalName(feature, 'geometrie')[0]
  if (!geometryProperty)
    return null

  const polygons = Array.from(geometryProperty.getElementsByTagNameNS('http://www.opengis.net/gml/3.2', 'Polygon'))
  if (!polygons.length)
    throw new Error('Unsupported GML geometry')

  return {
    type: 'MultiPolygon',
    coordinates: polygons.map(parsePolygon),
  }
}

function extractGeometryFromGml(text) {
  const xml = new DOMParser().parseFromString(text, 'application/xml')
  if (xml.querySelector('parsererror'))
    throw new Error('The server returned invalid XML')

  const exception = Array.from(xml.getElementsByTagNameNS('*', 'ExceptionText'))[0]
  if (exception)
    throw new Error(`WFS exception: ${exception.textContent.trim()}`)

  if (xml.documentElement.localName === 'ExceptionReport')
    throw new Error('The WFS rejected the request')
  if (xml.documentElement.localName !== 'FeatureCollection')
    throw new Error('The response is not a WFS FeatureCollection')

  const members = Array.from(xml.getElementsByTagNameNS('http://www.opengis.net/wfs/2.0', 'member'))
  const geometries = []
  const gmlGeometries = []
  for (const member of members) {
    const feature = Array.from(member.children)[0]
    if (!feature)
      throw new Error('Empty WFS member')
    const geometryProperty = childElementsByLocalName(feature, 'geometrie')[0]
    const geometry = parseGeometry(feature)
    if (geometry)
      geometries.push(geometry)
    if (geometryProperty)
      gmlGeometries.push(new XMLSerializer().serializeToString(geometryProperty))
  }

  return {
    geometry: geometries.length
      ? { type: 'MultiPolygon', coordinates: geometries.flatMap(geometry => geometry.coordinates) }
      : null,
    gml: gmlGeometries.join('\n\n'),
  }
}

function geometryToWkt(geometry) {
  if (!geometry)
    return ''
  if (geometry.type !== 'MultiPolygon')
    throw new Error(`Unsupported geometry type: ${geometry.type}`)

  const ringToWkt = ring => `(${ring.map(position => position.join(' ')).join(', ')})`
  const polygonToWkt = polygon => `(${polygon.map(ringToWkt).join(', ')})`
  return `MULTIPOLYGON (${geometry.coordinates.map(polygonToWkt).join(', ')})`
}

function updateMapGeometry() {
  if (!map || !geoJsonGeometry.value)
    return

  geometryLayer?.remove()
  geometryLayer = L.geoJSON(geoJsonGeometry.value, {
    style: {
      color: '#00457c',
      weight: 2,
      fillColor: '#f2c300',
      fillOpacity: 0.5,
    },
  }).addTo(map)

  const bounds = geometryLayer.getBounds()
  if (bounds.isValid())
    map.fitBounds(bounds, { padding: [18, 18], maxZoom: 19 })
}

async function showMap() {
  await nextTick()
  if (!mapElement.value || !geoJsonGeometry.value)
    return

  if (!map) {
    map = L.map(mapElement.value, { zoomControl: true })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map)
  }

  map.invalidateSize()
  updateMapGeometry()
}

function clearResponse() {
  rawGmlGeometry.value = ''
  geoJsonGeometry.value = null
  responseWkt.value = ''
  copied.value = false
}

async function copyResponse() {
  if (!codeContent.value)
    return
  try {
    await navigator.clipboard.writeText(codeContent.value)
    copied.value = true
    clearTimeout(copyTimer)
    copyTimer = setTimeout(() => { copied.value = false }, 1400)
  }
  catch (details) {
    console.error('Could not copy WFS geometry', details)
  }
}

async function runQuery() {
  const exactUrl = urlInput.value.trim()
  if (loading.value && exactUrl === activeUrl.value)
    return

  let url
  try {
    url = new URL(exactUrl)
    if (!['http:', 'https:'].includes(url.protocol))
      throw new Error('unsupported protocol')
  }
  catch (details) {
    console.error('Invalid WFS URL', details)
    error.value = 'Please enter a valid http or https WFS URL.'
    clearResponse()
    return
  }

  controller?.abort()
  controller = new AbortController()
  const currentRequest = ++requestNumber
  activeUrl.value = exactUrl
  loading.value = true
  error.value = ''
  statusMessage.value = 'Loading WFS features…'

  try {
    const result = await fetch(exactUrl, { signal: controller.signal })
    if (!result.ok)
      throw new Error(`HTTP ${result.status} ${result.statusText}`)

    const contentType = result.headers.get('content-type') || ''
    const text = await result.text()
    if (currentRequest !== requestNumber)
      return

    if (contentType.includes('json') || text.trimStart().startsWith('{')) {
      const geoJson = JSON.parse(text)
      if (!geoJson || geoJson.type !== 'FeatureCollection' || !Array.isArray(geoJson.features))
        throw new Error('The response is not a GeoJSON FeatureCollection')
      geoJsonGeometry.value = geoJson.features[0]?.geometry || null
      rawGmlGeometry.value = ''
      responseWkt.value = geometryToWkt(geoJsonGeometry.value)
      activeFormat.value = 'GeoJSON'
    }
    else if (contentType.includes('xml') || contentType.includes('gml') || text.trimStart().startsWith('<')) {
      const converted = extractGeometryFromGml(text)
      rawGmlGeometry.value = converted?.gml || ''
      geoJsonGeometry.value = converted?.geometry || null
      responseWkt.value = geometryToWkt(geoJsonGeometry.value)
      activeFormat.value = 'GML'
    }
    else {
      throw new Error(`Unsupported response format: ${contentType || 'unknown'}`)
    }

    statusMessage.value = responseWkt.value ? '' : 'No features returned for this request.'
  }
  catch (details) {
    if (details.name === 'AbortError')
      return
    console.error('WFS query failed', details)
    clearResponse()
    error.value = details.message.startsWith('WFS exception')
      ? 'The WFS rejected this request. Check its parameters.'
      : 'The WFS query failed. Check the URL, service availability, and CORS access.'
  }
  finally {
    if (currentRequest === requestNumber) {
      loading.value = false
      activeUrl.value = ''
    }
  }
}

onBeforeUnmount(() => {
  controller?.abort()
  clearTimeout(copyTimer)
  map?.remove()
  map = null
})

watch(activeFormat, (format) => {
  if (format === 'Map')
    showMap()
})

watch(geoJsonGeometry, () => {
  if (activeFormat.value === 'Map')
    showMap()
})
</script>

<template>
  <form class="mt-2" @submit.prevent="runQuery">
    <div class="flex items-stretch gap-3">
      <textarea
        v-model="urlInput"
        rows="5"
        spellcheck="false"
        aria-label="WFS GetFeature URL"
        class="min-w-0 flex-1 resize-none rounded-lg border-2 border-blue-700 bg-white px-3 py-2 font-mono text-[0.68rem] leading-snug text-gray-800 shadow-sm outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
        @keydown.enter.prevent="runQuery"
      />
      <button
        type="submit"
        :disabled="loading"
        class="w-[128px] shrink-0 rounded-lg bg-blue-800 px-3 text-[0.88rem] font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:cursor-wait disabled:opacity-60"
      >
        {{ loading ? 'Loading…' : 'Run WFS query' }}
      </button>
    </div>

    <div class="mt-1.5 flex items-center justify-between gap-4 text-[0.68rem] leading-tight">
      <div class="font-mono font-bold text-blue-900">
        <span class="rounded bg-yellow-100 px-2 py-0.5 ring-1 ring-yellow-400">BBOX</span>
        = WEST, SOUTH, EAST, NORTH
      </div>
      <div class="shrink-0 font-semibold text-gray-600">WMS: pixels · WFS: feature geometry</div>
    </div>
  </form>

  <div class="relative mt-2 h-[220px] overflow-hidden rounded-xl border border-gray-300 bg-gray-100 text-gray-800 shadow-sm">
    <div v-if="responseWkt" class="flex h-full flex-col">
      <div class="flex items-stretch justify-between border-b border-gray-300 bg-gray-200 px-2 pt-1.5 text-[0.68rem]">
        <div class="flex gap-1">
          <button
            v-for="format in ['GML', 'GeoJSON', 'WKT', 'Map']"
            :key="format"
            type="button"
            class="rounded-t-md px-3 py-1 font-semibold"
            :class="activeFormat === format ? 'bg-gray-100 text-blue-900' : 'text-gray-500 hover:text-blue-800'"
            @click="activeFormat = format"
          >
            {{ format }}
          </button>
        </div>
        <button
          v-if="activeFormat !== 'Map'"
          type="button"
          class="mb-1 rounded-md border border-gray-300 bg-white px-2.5 py-0.5 font-semibold text-gray-600 hover:border-blue-500 hover:text-blue-800"
          @click="copyResponse"
        >
          {{ copied ? 'Copied' : 'Copy' }}
        </button>
      </div>
      <pre v-if="activeFormat !== 'Map'" class="m-0 min-h-0 flex-1 overflow-auto whitespace-pre-wrap break-all px-3 py-3 font-mono text-[0.68rem] leading-[1.4] text-gray-800">{{ codeContent }}</pre>
      <div v-show="activeFormat === 'Map'" ref="mapElement" class="min-h-0 flex-1" aria-label="Map of WFS building geometries" />
    </div>
    <div v-else class="flex h-full items-center justify-center px-8 text-center text-[0.9rem] font-semibold text-gray-400">
      <span v-if="error" role="alert" class="text-red-700">{{ error }}</span>
      <span v-else>{{ statusMessage }}</span>
    </div>
  </div>

  <div class="mt-1 text-center text-[0.66rem] leading-tight text-gray-500">
    WFS data © Geobasis NRW
  </div>
</template>
