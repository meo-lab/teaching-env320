<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import L from 'leaflet'
import proj4 from 'proj4'
import 'leaflet/dist/leaflet.css'

const EPSG_32632 = '+proj=utm +zone=32 +datum=WGS84 +units=m +no_defs +type=crs'
proj4.defs('EPSG:32632', EPSG_32632)

const initialCoefficients = Object.freeze({
  a: 100,
  b: 0,
  E0: 365200,
  d: 0,
  e: -100,
  N0: 5621100,
})

const coefficientKeys = ['a', 'b', 'E0', 'd', 'e', 'N0']
const values = [1, 2, 3, 4, 5, 6, 7, 8, 9]
const colors = [
  '#d8e9f4', '#b9d7ea', '#95c2dd',
  '#6ca9cc', '#408cb7', '#f8de72',
  '#f2c300', '#d69d00', '#a96b00',
]
const labelColors = ['#15334a', '#15334a', '#15334a', '#ffffff', '#ffffff', '#15334a', '#15334a', '#ffffff', '#ffffff']

const draft = reactive({ ...initialCoefficients })
const applied = ref({ ...initialCoefficients })
const mapElement = ref(null)
const error = ref('')
const status = ref('Initial transform applied')

let map = null
let gridLayer = null
let resizeObserver = null
let appliedBounds = null

const draftChanged = computed(() => coefficientKeys.some(key => Number(draft[key]) !== applied.value[key]))

function pixelToUtm(c, r, coefficients) {
  return [
    coefficients.a * c + coefficients.b * r + coefficients.E0,
    coefficients.d * c + coefficients.e * r + coefficients.N0,
  ]
}

function utmToLonLat(E, N) {
  return proj4('EPSG:32632', 'EPSG:4326', [E, N])
}

function projectedLatLng(c, r, coefficients) {
  const [E, N] = pixelToUtm(c, r, coefficients)
  const [longitude, latitude] = utmToLonLat(E, N)

  if (!Number.isFinite(longitude) || !Number.isFinite(latitude))
    throw new Error('The transform produced invalid geographic coordinates.')
  if (longitude < -180 || longitude > 180 || latitude < -85.05112878 || latitude > 85.05112878)
    throw new Error('The transformed grid cannot be displayed on the Web Mercator map.')

  return [latitude, longitude]
}

function readDraft() {
  const next = {}
  for (const key of coefficientKeys) {
    const value = Number(draft[key])
    if (!Number.isFinite(value))
      throw new Error('All six affine coefficients must be finite numbers.')
    next[key] = value
  }

  const determinant = next.a * next.e - next.b * next.d
  if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-9)
    throw new Error('The affine matrix is singular. Keep two independent cell-edge directions.')

  return next
}

function makeCells(coefficients) {
  return values.map((value, index) => {
    const row = Math.floor(index / 3)
    const column = index % 3
    return {
      value,
      color: colors[index],
      labelColor: labelColors[index],
      corners: [
        projectedLatLng(column, row, coefficients),
        projectedLatLng(column + 1, row, coefficients),
        projectedLatLng(column + 1, row + 1, coefficients),
        projectedLatLng(column, row + 1, coefficients),
      ],
      center: projectedLatLng(column + 0.5, row + 0.5, coefficients),
    }
  })
}

function drawGrid(coefficients, fit = false) {
  if (!map)
    return

  const cells = makeCells(coefficients)
  const nextLayer = L.layerGroup()

  for (const cell of cells) {
    L.polygon(cell.corners, {
      color: '#ffffff',
      weight: 1.5,
      opacity: 1,
      fillColor: cell.color,
      fillOpacity: 0.82,
    }).addTo(nextLayer)

    L.marker(cell.center, {
      interactive: false,
      keyboard: false,
      icon: L.divIcon({
        className: '',
        html: `<div style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;font:700 13px/1 sans-serif;color:${cell.labelColor};text-shadow:0 1px 2px rgba(255,255,255,.45)">${cell.value}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
    }).addTo(nextLayer)
  }

  gridLayer?.remove()
  gridLayer = nextLayer.addTo(map)
  appliedBounds = L.latLngBounds(cells.flatMap(cell => cell.corners))

  if (fit && appliedBounds.isValid()) {
    map.invalidateSize({ pan: false })
    map.fitBounds(appliedBounds, { padding: [18, 18], maxZoom: 18, animate: false })
  }
}

function applyTransform() {
  try {
    const next = readDraft()
    makeCells(next)
    applied.value = next
    drawGrid(next, true)
    error.value = ''
    status.value = 'Transform applied and map recentered'
  }
  catch (details) {
    error.value = details instanceof Error ? details.message : 'Could not apply the transform.'
    status.value = 'Previous valid transform retained'
  }
}

async function initializeMap() {
  await nextTick()
  if (!mapElement.value || map)
    return

  map = L.map(mapElement.value, {
    zoomControl: true,
    attributionControl: true,
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors',
  }).addTo(map)

  drawGrid(applied.value, true)
  resizeObserver = new ResizeObserver(() => map?.invalidateSize({ pan: false }))
  resizeObserver.observe(mapElement.value)
}

onMounted(initializeMap)

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  map?.remove()
  map = null
})
</script>

<template>
  <div class="raster-affine-demo">
    <div class="top-equation">
      <span>[East, North, 1]</span>
      <strong>= A</strong>
      <span>[Col, Row, 1]</span>
    </div>

    <div class="demo-columns">
      <section class="source-panel" aria-label="Three by three raster values">
        <div class="raster-grid">
          <div class="corner-axis">r ↓<br>c →</div>
          <div v-for="column in [0, 1, 2]" :key="`column-${column}`" class="axis-index">{{ column }}</div>
          <template v-for="row in [0, 1, 2]" :key="`row-${row}`">
            <div class="axis-index">{{ row }}</div>
            <div
              v-for="column in [0, 1, 2]"
              :key="`${row}-${column}`"
              class="raster-cell"
              :style="{ backgroundColor: colors[row * 3 + column], color: labelColors[row * 3 + column] }"
            >
              {{ row * 3 + column + 1 }}
            </div>
          </template>
        </div>
      </section>

      <section class="transform-panel">
        <div class="crs-label">EPSG:32632 · WGS 84 / UTM zone 32N · metres</div>

        <form @submit.prevent.stop="applyTransform">
          <div class="matrix-equation" aria-label="Editable affine transformation matrix">
            <div class="matrix-name">A =</div>
            <div class="matrix-bracket">
              <div class="matrix-row">
                <input v-model.number="draft.a" aria-label="Coefficient a" type="number" step="10" @keydown.stop>
                <input v-model.number="draft.b" aria-label="Coefficient b" type="number" step="10" @keydown.stop>
                <input v-model.number="draft.E0" aria-label="Easting origin E zero" type="number" step="100" @keydown.stop>
              </div>
              <div class="matrix-row">
                <input v-model.number="draft.d" aria-label="Coefficient d" type="number" step="10" @keydown.stop>
                <input v-model.number="draft.e" aria-label="Coefficient e" type="number" step="10" @keydown.stop>
                <input v-model.number="draft.N0" aria-label="Northing origin N zero" type="number" step="100" @keydown.stop>
              </div>
              <div class="matrix-row fixed-row"><span>0</span><span>0</span><span>1</span></div>
            </div>
          </div>

          <div class="controls">
            <button class="apply-button" type="submit">Apply transform</button>
          </div>
        </form>

        <div class="state-line" :class="{ draft: draftChanged }">
          {{ draftChanged ? 'Draft differs from the applied map' : status }}
        </div>
        <div class="error-line" role="alert">{{ error }}</div>
      </section>

      <section class="map-panel">
        <div ref="mapElement" class="map" aria-label="Leaflet map showing the projected raster cells"></div>
        <div class="map-note">UTM coordinates are converted for the basemap display.</div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.raster-affine-demo {
  height: 352px;
  color: #243746;
  font-size: 12px;
}

.top-equation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 13px;
  color: #00457c;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 17px;
  text-align: center;
}

.top-equation strong {
  font-size: 19px;
}

.demo-columns {
  display: grid;
  grid-template-columns: 165px 270px 1fr;
  gap: 14px;
  height: 310px;
}

section {
  min-width: 0;
}

.source-panel {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 44px;
}

.raster-grid {
  display: grid;
  grid-template-columns: 24px repeat(3, 40px);
  grid-template-rows: 25px repeat(3, 40px);
  gap: 3px;
  width: 153px;
}

.corner-axis,
.axis-index {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #526575;
  font-size: 10.5px;
  font-weight: 700;
}

.raster-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(0, 69, 124, 0.18);
  border-radius: 4px;
  font-size: 15px;
  font-weight: 800;
}

.transform-panel {
  padding: 10px 12px 0;
  border-right: 1px solid #d9e0e5;
  border-left: 1px solid #d9e0e5;
}

.crs-label {
  margin-bottom: 18px;
  color: #526575;
  font-size: 10px;
  font-weight: 600;
  text-align: center;
}

.matrix-equation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
}

.matrix-name {
  flex: 0 0 auto;
  color: #00457c;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 20px;
  font-weight: 700;
  white-space: nowrap;
}

.matrix-bracket {
  flex: 0 0 auto;
  position: relative;
  padding: 6px 12px;
}

.matrix-bracket::before,
.matrix-bracket::after {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 7px;
  border-top: 2px solid #00457c;
  border-bottom: 2px solid #00457c;
  content: '';
}

.matrix-bracket::before {
  left: 0;
  border-left: 2px solid #00457c;
}

.matrix-bracket::after {
  right: 0;
  border-right: 2px solid #00457c;
}

.matrix-row {
  display: grid;
  grid-template-columns: 45px 45px 78px;
  gap: 5px;
}

.matrix-row + .matrix-row {
  margin-top: 6px;
}

.matrix-row input {
  appearance: textfield;
  box-sizing: border-box;
  width: 100%;
  height: 29px;
  padding: 2px 3px;
  border: 1px solid #aebdca;
  border-radius: 4px;
  background: #ffffff;
  color: #1c3344;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  text-align: center;
}

.matrix-row input::-webkit-inner-spin-button,
.matrix-row input::-webkit-outer-spin-button {
  margin: 0;
  appearance: none;
}

.matrix-row input:focus {
  border-color: #00457c;
  outline: 2px solid rgba(0, 69, 124, 0.15);
}

.fixed-row {
  color: #526575;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  text-align: center;
}

.controls {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.controls button {
  min-width: 150px;
  min-height: 31px;
  padding: 4px 12px;
  border: 1px solid #aebdca;
  border-radius: 5px;
  background: #ffffff;
  color: #24465d;
  font-size: 10.5px;
  font-weight: 700;
  cursor: pointer;
}

.controls .apply-button {
  border-color: #00457c;
  background: #00457c;
  color: #ffffff;
}

.state-line {
  min-height: 13px;
  margin-top: 8px;
  color: #517048;
  font-size: 9px;
  text-align: center;
}

.state-line.draft {
  color: #8a5b00;
  font-weight: 700;
}

.error-line {
  min-height: 23px;
  margin-top: 1px;
  color: #a51c30;
  font-size: 9px;
  line-height: 1.2;
  text-align: center;
}

.map-panel {
  display: flex;
  min-width: 0;
  flex-direction: column;
  padding-top: 28px;
}

.map {
  height: 225px;
  flex: 0 0 225px;
  overflow: hidden;
  border: 1px solid #c8d2da;
  border-radius: 7px;
  background: #eef2f4;
}

.map-note {
  margin-top: 4px;
  color: #697b88;
  font-size: 9px;
  line-height: 1.2;
  text-align: center;
}

:deep(.leaflet-control-attribution) {
  font-size: 7px;
}
</style>
