<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import rawGeoJson from '../figures/combined_osm_poppelsdorfer_schloss_bbox_radius_50m.geojson?raw'

const featureCollection = JSON.parse(rawGeoJson)
const features = featureCollection.features ?? []
const codeElement = ref(null)
const mapElement = ref(null)
const selectedIndex = ref(-1)
const featureLayers = []
const featureRows = []
let map = null
let resizeObserver = null

let nextFeatureIndex = 0
const codeLines = rawGeoJson.split('\n').map((text) => {
  const isFeature = text.trimStart().startsWith('{ "type": "Feature"')
  return {
    text,
    featureIndex: isFeature ? nextFeatureIndex++ : -1,
  }
})

const defaultStyle = {
  color: '#8e99a1',
  weight: 2,
  opacity: 0.9,
  fillColor: '#d6dadd',
  fillOpacity: 0.62,
}

const selectedStyle = {
  color: '#00457c',
  weight: 4,
  opacity: 1,
  fillColor: '#f2c300',
  fillOpacity: 0.82,
}

function applyStyle(index, selected) {
  const group = featureLayers[index]
  if (!group)
    return

  group.eachLayer((layer) => {
    layer.setStyle?.(selected ? selectedStyle : defaultStyle)
    layer.setRadius?.(selected ? 8 : 4.5)
    if (selected)
      layer.bringToFront?.()
  })
}

function selectFeature(index, focusCode = false) {
  if (index < 0 || index >= features.length)
    return

  if (selectedIndex.value >= 0)
    applyStyle(selectedIndex.value, false)

  selectedIndex.value = index
  applyStyle(index, true)

  if (focusCode && codeElement.value && featureRows[index]) {
    requestAnimationFrame(() => {
      codeElement.value.scrollTop = Math.max(0, featureRows[index].offsetTop - 10)
      featureRows[index].focus({ preventScroll: true })
    })
  }
}

function setFeatureRow(element, index) {
  if (index >= 0 && element)
    featureRows[index] = element
}

function createMap() {
  if (!mapElement.value || map)
    return

  map = L.map(mapElement.value, {
    zoomControl: true,
    attributionControl: true,
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 20,
    attribution: '© OpenStreetMap contributors',
  }).addTo(map)

  const allFeatures = L.featureGroup().addTo(map)

  features.forEach((feature, index) => {
    const layer = L.geoJSON(feature, {
      style: defaultStyle,
      pointToLayer: (_item, latLng) => L.circleMarker(latLng, {
        ...defaultStyle,
        radius: 4.5,
      }),
      onEachFeature: (_item, featureLayer) => {
        featureLayer.on('click', (event) => {
          L.DomEvent.stopPropagation(event)
          selectFeature(index, true)
        })
      },
    })

    layer.addTo(allFeatures)
    featureLayers.push(layer)
  })

  const bounds = allFeatures.getBounds()
  if (bounds.isValid())
    map.fitBounds(bounds, { padding: [18, 18], maxZoom: 19 })

  resizeObserver = new ResizeObserver(() => map?.invalidateSize())
  resizeObserver.observe(mapElement.value)
  requestAnimationFrame(() => map?.invalidateSize())
}

onMounted(async () => {
  await nextTick()
  createMap()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  map?.remove()
  map = null
  featureLayers.length = 0
  featureRows.length = 0
})
</script>

<template>
  <div class="geojson-feature-explorer">
    <div class="demo-columns">
      <section class="demo-panel">
        <div class="panel-heading">
          <strong>GeoJSON</strong>
          <span>{{ features.length }} features</span>
        </div>
        <div
          ref="codeElement"
          class="geojson-code"
          role="textbox"
          aria-readonly="true"
          aria-label="GeoJSON features"
          @click.stop
          @keydown.stop
        >
          <div
            v-for="(line, lineIndex) in codeLines"
            :key="lineIndex"
            :ref="element => setFeatureRow(element, line.featureIndex)"
            class="code-line"
            :class="{
              'feature-code-line': line.featureIndex >= 0,
              'selected-feature': line.featureIndex === selectedIndex,
            }"
            :tabindex="line.featureIndex >= 0 ? 0 : undefined"
            @click.stop="line.featureIndex >= 0 && selectFeature(line.featureIndex)"
            @keydown.enter.stop="line.featureIndex >= 0 && selectFeature(line.featureIndex)"
            @keydown.space.prevent.stop="line.featureIndex >= 0 && selectFeature(line.featureIndex)"
          >{{ line.text || ' ' }}</div>
        </div>
      </section>

      <section class="demo-panel">
        <div class="panel-heading">
          <strong>Leaflet map</strong>
        </div>
        <div ref="mapElement" class="feature-map" aria-label="Map of the GeoJSON features" />
      </section>
    </div>
  </div>
</template>

<style scoped>
.geojson-feature-explorer {
  height: 340px;
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  color: #263746;
}

.demo-columns {
  min-height: 0;
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 18px;
}

.demo-panel {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #d7dde2;
  border-radius: 12px;
  background: #f4f5f6;
}

.panel-heading {
  min-height: 34px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 11px;
  border-bottom: 1px solid #d7dde2;
  background: #eceff1;
  font-size: 0.73rem;
  color: #687680;
}

.panel-heading strong {
  color: #00457c;
  font-size: 0.82rem;
}

.geojson-code {
  min-height: 0;
  flex: 1;
  overflow: auto;
  padding: 10px 8px;
  background: #f7f8f8;
  color: #33434f;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 8.5px;
  line-height: 1.35;
  position: relative;
}

.code-line {
  min-height: 1.35em;
  padding: 1px 5px;
  border-left: 3px solid transparent;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.feature-code-line {
  cursor: pointer;
}

.feature-code-line:hover {
  background: #e8ecef;
}

.feature-code-line:focus {
  outline: none;
}

.feature-code-line.selected-feature {
  border-left-color: #00457c;
  background: #f2c300;
  color: #17324a;
}

.feature-map {
  min-height: 0;
  flex: 1;
  background: #e9edef;
}

.feature-map :deep(.leaflet-control-attribution) {
  font-size: 8px;
}
</style>
