<script setup>
import { nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import L from 'leaflet'
import proj4 from 'proj4'
import 'leaflet/dist/leaflet.css'

const rasterUrl = new URL('../figures/Sentinel2_RGB_cloudfree_EPSG32632.png', import.meta.url).href
const EPSG_32632 = '+proj=utm +zone=32 +datum=WGS84 +units=m +no_defs +type=crs'
proj4.defs('EPSG:32632', EPSG_32632)

const rasterWidth = 47
const rasterHeight = 46
const coefficientKeys = ['a', 'b', 'E0', 'd', 'e', 'N0']
const draft = reactive({ a: '', b: '', E0: '', d: '', e: '', N0: '' })
const mapElement = ref(null)
const error = ref('')
const status = ref('Fill all six entries, then transform')

let map = null
let imageLayer = null
let outlineLayer = null
let rasterLayer = null
let rasterVisible = true
let visibilityInput = null
let resizeObserver = null

const gdalInfo = `❯ gdalinfo Sentinel2_RGB_cloudfree_EPSG32632.tif
Driver: GTiff/GeoTIFF
Files: Sentinel2_RGB_cloudfree_EPSG32632.tif
Size is 47, 46
Coordinate System is:
PROJCRS["WGS 84 / UTM zone 32N",
    BASEGEOGCRS["WGS 84",
        DATUM["World Geodetic System 1984",
            ELLIPSOID["WGS 84",6378137,298.257223563,
                LENGTHUNIT["metre",1]]],
        PRIMEM["Greenwich",0,
            ANGLEUNIT["degree",0.0174532925199433]],
        ID["EPSG",4326]],
    CONVERSION["UTM zone 32N",
        METHOD["Transverse Mercator",
            ID["EPSG",9807]],
        PARAMETER["Latitude of natural origin",0,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8801]],
        PARAMETER["Longitude of natural origin",9,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8802]],
        PARAMETER["Scale factor at natural origin",0.9996,
            SCALEUNIT["unity",1],
            ID["EPSG",8805]],
        PARAMETER["False easting",500000,
            LENGTHUNIT["metre",1],
            ID["EPSG",8806]],
        PARAMETER["False northing",0,
            LENGTHUNIT["metre",1],
            ID["EPSG",8807]]],
    CS[Cartesian,2],
        AXIS["(E)",east,
            ORDER[1],
            LENGTHUNIT["metre",1]],
        AXIS["(N)",north,
            ORDER[2],
            LENGTHUNIT["metre",1]],
    USAGE[
        SCOPE["Navigation and medium accuracy spatial referencing."],
        AREA["Between 6°E and 12°E, northern hemisphere between equator and 84°N, onshore and offshore. Algeria. Austria. Cameroon. Denmark. Equatorial Guinea. France. Gabon. Germany. Italy. Libya. Liechtenstein. Monaco. Netherlands. Niger. Nigeria. Norway. Sao Tome and Principe. Svalbard. Sweden. Switzerland. Tunisia. Vatican City State."],
        BBOX[0,6,84,12]],
    ID["EPSG",32632]]
Data axis to CRS axis mapping: 1,2
Origin = (365110.000000000000000,5621210.000000000000000)
Pixel Size = (10.000000000000000,-10.000000000000000)
Metadata:
  AREA_OR_POINT=Area
Image Structure Metadata:
  LAYOUT=COG
  COMPRESSION=LZW
  INTERLEAVE=PIXEL
Corner Coordinates:
Upper Left  (  365110.000, 5621210.000) (  7d 5'19.61"E, 50d43'37.24"N)
Lower Left  (  365110.000, 5620750.000) (  7d 5'20.21"E, 50d43'22.35"N)
Upper Right (  365580.000, 5621210.000) (  7d 5'43.57"E, 50d43'37.63"N)
Lower Right (  365580.000, 5620750.000) (  7d 5'44.17"E, 50d43'22.74"N)
Center      (  365345.000, 5620980.000) (  7d 5'31.89"E, 50d43'29.99"N)
Band 1 Block=256x256 Type=UInt16, ColorInterp=Gray
  Description = red
Band 2 Block=256x256 Type=UInt16, ColorInterp=Undefined
  Description = green
Band 3 Block=256x256 Type=UInt16, ColorInterp=Undefined
  Description = blue`

function pixelToUtm(c, r, coefficients) {
  return [
    coefficients.a * c + coefficients.b * r + coefficients.E0,
    coefficients.d * c + coefficients.e * r + coefficients.N0,
  ]
}

function utmToLatLng(E, N) {
  const [longitude, latitude] = proj4('EPSG:32632', 'EPSG:4326', [E, N])
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude))
    throw new Error('The transform produced invalid geographic coordinates.')
  if (longitude < -180 || longitude > 180 || latitude < -85.05112878 || latitude > 85.05112878)
    throw new Error('The transformed image cannot be displayed on the map.')
  return [latitude, longitude]
}

function readMatrix() {
  const coefficients = {}
  for (const key of coefficientKeys) {
    if (draft[key] === '')
      throw new Error('Fill all six matrix entries.')
    const value = Number(draft[key])
    if (!Number.isFinite(value))
      throw new Error('All matrix entries must be finite numbers.')
    coefficients[key] = value
  }

  const determinant = coefficients.a * coefficients.e - coefficients.b * coefficients.d
  if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-9)
    throw new Error('The affine matrix is singular.')

  return coefficients
}

function imageCorners(coefficients) {
  return [
    utmToLatLng(...pixelToUtm(0, 0, coefficients)),
    utmToLatLng(...pixelToUtm(rasterWidth, 0, coefficients)),
    utmToLatLng(...pixelToUtm(rasterWidth, rasterHeight, coefficients)),
    utmToLatLng(...pixelToUtm(0, rasterHeight, coefficients)),
  ]
}

function transformImage() {
  try {
    const coefficients = readMatrix()
    const corners = imageCorners(coefficients)
    const bounds = L.latLngBounds(corners)
    if (!bounds.isValid())
      throw new Error('The transformed image bounds are invalid.')

    rasterLayer?.remove()
    imageLayer = L.imageOverlay(rasterUrl, bounds, {
      opacity: 0.9,
      interactive: false,
      className: 'nearest-neighbor-raster',
    })
    outlineLayer = L.polygon(corners, {
      color: '#f2c300',
      weight: 2,
      fill: false,
      interactive: false,
    })
    rasterLayer = L.layerGroup([imageLayer, outlineLayer])
    if (rasterVisible)
      rasterLayer.addTo(map)

    if (visibilityInput)
      visibilityInput.disabled = false

    map.invalidateSize({ pan: false })
    map.fitBounds(bounds, { padding: [18, 18], maxZoom: 18, animate: false })
    error.value = ''
    status.value = 'Image transformed and placed on the map'
  }
  catch (details) {
    error.value = details instanceof Error ? details.message : 'Could not transform the image.'
    status.value = imageLayer ? 'Previous valid transform retained' : 'No image placed yet'
  }
}

async function initializeMap() {
  await nextTick()
  if (!mapElement.value || map)
    return

  map = L.map(mapElement.value, {
    zoomControl: true,
    attributionControl: true,
  }).setView([50.724998, 7.092192], 16)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors',
  }).addTo(map)

  const rasterControl = L.control({ position: 'topright' })
  rasterControl.onAdd = () => {
    const container = L.DomUtil.create('div', 'leaflet-control raster-layer-control')
    container.innerHTML = `
      <label class="visibility-option">
        <input class="raster-visibility" type="checkbox" checked disabled>
        <span>Raster</span>
      </label>
    `

    L.DomEvent.disableClickPropagation(container)
    L.DomEvent.disableScrollPropagation(container)
    visibilityInput = container.querySelector('.raster-visibility')

    visibilityInput.addEventListener('change', () => {
      rasterVisible = visibilityInput.checked
      if (!rasterLayer)
        return
      if (rasterVisible)
        rasterLayer.addTo(map)
      else
        rasterLayer.remove()
    })

    return container
  }
  rasterControl.addTo(map)

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
  <div class="raster-georef-task">
    <div class="task-columns">
      <section class="image-panel">
        <img :src="rasterUrl" alt="Sentinel-2 RGB image to georeference">
      </section>

      <section class="transform-panel">
        <div class="crs-label">EPSG:32632 · WGS 84 / UTM zone 32N · metres</div>

        <form novalidate @submit.prevent.stop="transformImage">
          <div class="matrix-equation" aria-label="Editable affine transformation matrix">
            <div class="matrix-name">A =</div>
            <div class="matrix-bracket">
              <div class="matrix-row">
                <input v-model="draft.a" aria-label="Coefficient a" type="number" step="10" @keydown.stop>
                <input v-model="draft.b" aria-label="Coefficient b" type="number" step="10" @keydown.stop>
                <input v-model="draft.E0" aria-label="Easting origin E zero" type="number" step="100" @keydown.stop>
              </div>
              <div class="matrix-row">
                <input v-model="draft.d" aria-label="Coefficient d" type="number" step="10" @keydown.stop>
                <input v-model="draft.e" aria-label="Coefficient e" type="number" step="10" @keydown.stop>
                <input v-model="draft.N0" aria-label="Northing origin N zero" type="number" step="100" @keydown.stop>
              </div>
              <div class="matrix-row fixed-row"><span>0</span><span>0</span><span>1</span></div>
            </div>
          </div>

          <div class="controls">
            <button type="submit">Transform</button>
          </div>
        </form>

        <div class="state-line">{{ status }}</div>
        <div class="error-line" role="alert">{{ error }}</div>
      </section>

      <section class="map-panel">
        <div ref="mapElement" class="map" aria-label="Leaflet map for the georeferenced Sentinel-2 image"></div>
      </section>
    </div>

    <div class="gdal-description">
      The <a href="https://gdal.org/en/stable/programs/gdalinfo.html" target="_blank" rel="noopener noreferrer">gdalinfo</a> output below provides metadata for this georeferenced image.
    </div>

    <textarea
      class="gdal-output"
      :value="gdalInfo"
      readonly
      spellcheck="false"
      aria-label="Scrollable gdalinfo output"
    ></textarea>
  </div>
</template>

<style scoped>
.raster-georef-task {
  height: 382px;
  color: #243746;
  font-size: 12px;
}

.task-columns {
  display: grid;
  grid-template-columns: 190px 270px 1fr;
  gap: 14px;
  height: 188px;
}

section {
  min-width: 0;
}

.image-panel {
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-panel img {
  width: 166px;
  height: 163px;
  border: 1px solid #c8d2da;
  border-radius: 6px;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  object-fit: contain;
}

.transform-panel {
  padding: 2px 12px 0;
  border-right: 1px solid #d9e0e5;
  border-left: 1px solid #d9e0e5;
}

.crs-label {
  margin-bottom: 7px;
  color: #526575;
  font-size: 9.5px;
  font-weight: 600;
  text-align: center;
}

.matrix-equation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.matrix-name {
  flex: 0 0 auto;
  color: #00457c;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 18px;
  font-weight: 700;
  white-space: nowrap;
}

.matrix-bracket {
  position: relative;
  flex: 0 0 auto;
  padding: 4px 12px;
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
  margin-top: 4px;
}

.matrix-row input {
  box-sizing: border-box;
  width: 100%;
  height: 25px;
  padding: 2px 3px;
  border: 1px solid #aebdca;
  border-radius: 4px;
  background: #ffffff;
  color: #1c3344;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10.5px;
  text-align: center;
}

.matrix-row input:focus {
  border-color: #00457c;
  outline: 2px solid rgba(0, 69, 124, 0.15);
}

.fixed-row {
  color: #526575;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  text-align: center;
}

.controls {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}

.controls button {
  min-width: 132px;
  min-height: 27px;
  padding: 3px 10px;
  border: 1px solid #00457c;
  border-radius: 5px;
  background: #00457c;
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
}

.state-line {
  min-height: 12px;
  margin-top: 3px;
  color: #517048;
  font-size: 8.5px;
  text-align: center;
}

.error-line {
  min-height: 12px;
  color: #a51c30;
  font-size: 8.5px;
  line-height: 1.1;
  text-align: center;
}

.map-panel {
  min-width: 0;
}

.map {
  width: 100%;
  height: 180px;
  overflow: hidden;
  border: 1px solid #c8d2da;
  border-radius: 7px;
  background: #eef2f4;
}

.gdal-output {
  box-sizing: border-box;
  width: 100%;
  height: 143px;
  margin-top: 0;
  padding: 8px 10px;
  resize: none;
  border: 1px solid #c8d2da;
  border-radius: 7px;
  background: #f3f5f7;
  color: #263746;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 8.5px;
  line-height: 1.25;
  white-space: pre;
}

.gdal-description {
  margin: 8px 0 4px;
  color: #526575;
  font-size: 10.5px;
  line-height: 1.25;
}

.gdal-description a {
  color: #00457c;
  font-weight: 700;
}

:deep(.raster-layer-control) {
  min-width: 72px;
  padding: 6px 7px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.28);
  color: #263746;
  font: 10px/1.2 sans-serif;
}

:deep(.raster-layer-control label) {
  margin: 0;
}

:deep(.visibility-option) {
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 700;
}

:deep(.raster-visibility) {
  margin: 0;
  accent-color: #00457c;
}

:deep(.nearest-neighbor-raster) {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

:deep(.leaflet-control-attribution) {
  font-size: 7px;
}
</style>
