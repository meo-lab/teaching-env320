<script>
// Module scope: shared by every instance Slidev renders (slide, presenter, previews, overview),
// so each chart is requested at most once per page load.
const chartPromises = new Map()
let basePromise = null
</script>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const API = 'https://charts.ecmwf.int/opencharts-api/v1/products/medium-z500-t850/'
const HOUR = 3600 * 1000
// Charts are also stored across page reloads; a new run is published every 12 h.
const STORAGE_KEY = 'ecmwf-forecast-z500-t850-v2'
const MAX_AGE = 6 * HOUR

const baseTime = ref(null)
const leadHours = ref(48)
const chart = ref(null)
const loading = ref(false)
const error = ref('')

class RateLimitError extends Error {}

// API expects e.g. 2026-10-21T12:00:00Z
function isoHour(date) {
  return `${date.toISOString().slice(0, 13)}:00:00Z`
}

// Most recent 00 or 12 UTC run at or before `date`
function floorToRun(date) {
  const d = new Date(date)
  d.setUTCMinutes(0, 0, 0)
  d.setUTCHours(d.getUTCHours() < 12 ? 0 : 12)
  return d
}

const validTime = computed(() =>
  baseTime.value ? new Date(baseTime.value.getTime() + leadHours.value * HOUR) : null,
)

function readStore() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (stored?.charts && Date.now() - stored.fetchedAt < MAX_AGE)
      return stored
  }
  catch {}
  return null
}

function writeStore(value) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  }
  catch {}
}

async function requestChart(base, lead) {
  const valid = new Date(base.getTime() + lead * HOUR)
  const params = new URLSearchParams({ base_time: isoHour(base), valid_time: isoHour(valid) })
  const response = await fetch(`${API}?${params}`)
  if (response.status === 429)
    throw new RateLimitError('too many requests')
  const json = await response.json()
  if (!response.ok || json.error)
    throw new Error('not available')
  return { imageUrl: json.data.link.href, description: json.data.attributes.description }
}

// Each (run, lead time) is requested once: first from memory, then from storage, then from ECMWF.
function getChart(base, lead) {
  const key = `${base.toISOString()}+${lead}`
  if (!chartPromises.has(key)) {
    const stored = readStore()
    const cached = stored?.baseTime === base.toISOString() ? stored.charts[lead] : null
    const promise = cached
      ? Promise.resolve(cached)
      : requestChart(base, lead).then((result) => {
        const current = readStore()
        const next = current?.baseTime === base.toISOString()
          ? current
          : { baseTime: base.toISOString(), fetchedAt: Date.now(), charts: {} }
        next.charts[lead] = result
        writeStore(next)
        return result
      })
    // Failed requests are not cached, so a later attempt can retry.
    promise.catch(() => chartPromises.delete(key))
    chartPromises.set(key, promise)
  }
  return chartPromises.get(key)
}

// The newest run appears a few hours after its base time, so step back until one is available.
async function findLatestRun() {
  const stored = readStore()
  if (stored)
    return new Date(stored.baseTime)
  let candidate = floorToRun(new Date())
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      await getChart(candidate, leadHours.value)
      return candidate
    }
    catch (err) {
      if (err instanceof RateLimitError)
        throw err
      candidate = new Date(candidate.getTime() - 12 * HOUR)
    }
  }
  throw new Error('no run found')
}

function showError(err) {
  error.value = err instanceof RateLimitError
    ? 'ECMWF is limiting requests right now. Please wait a minute and move the slider again.'
    : 'The forecast chart could not be loaded.'
}

async function load() {
  if (!baseTime.value)
    return
  loading.value = true
  try {
    chart.value = await getChart(baseTime.value, leadHours.value)
    error.value = ''
  }
  catch (err) {
    showError(err)
  }
  finally {
    loading.value = false
  }
}

// Wait until the slider stops moving before requesting a chart.
let debounceTimer
function scheduleLoad() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(load, 400)
}

function formatUtc(date) {
  return date
    ? date.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC'
    : '…'
}

watch(baseTime, load)
watch(leadHours, scheduleLoad)
onBeforeUnmount(() => clearTimeout(debounceTimer))

onMounted(async () => {
  loading.value = true
  basePromise ??= findLatestRun().catch((err) => {
    basePromise = null
    throw err
  })
  try {
    baseTime.value = await basePromise
  }
  catch (err) {
    loading.value = false
    if (err instanceof RateLimitError)
      showError(err)
    else
      error.value = 'No recent ECMWF run could be found.'
  }
})
</script>

<template>
  <div class="mt-1 grid grid-cols-[2fr_3fr] gap-6 items-center">
    <div class="text-[0.92rem] leading-snug text-gray-700">
      <div class="rounded-lg border border-blue-200 bg-blue-50 p-2.5">
        <div class="font-semibold text-blue-900">Model run (base time)</div>
        <div>{{ formatUtc(baseTime) }}</div>
      </div>

      <label class="mt-3 block">
        <span class="font-semibold text-teal-900">Lead time: +{{ leadHours }} h</span>
        <input v-model.number="leadHours" type="range" min="0" max="240" step="12" class="mt-1 w-full accent-teal-600">
        <span class="flex justify-between text-[0.7rem] text-gray-500"><span>0 h</span><span>+10 days</span></span>
      </label>

      <div class="mt-3 rounded-lg border border-teal-200 bg-teal-50 p-2.5">
        <div class="font-semibold text-teal-900">Valid time</div>
        <div>{{ formatUtc(validTime) }}</div>
      </div>

      <div class="mt-3 text-[0.82rem] text-gray-600">
        Lines: 500 hPa height · Colours: 850 hPa temperature
      </div>
    </div>

    <div>
      <div class="relative flex h-[270px] items-center justify-center overflow-hidden rounded-xl border border-gray-300 bg-gray-100">
        <img
          v-if="chart"
          :src="chart.imageUrl"
          class="h-full w-full object-contain"
          :class="{ 'opacity-50': loading }"
          :alt="chart.description"
        >
        <div v-if="error" class="absolute rounded-lg bg-white/90 px-4 py-2 text-[0.9rem] text-red-700 shadow">
          {{ error }}
        </div>
        <div v-else-if="!chart" class="absolute text-[0.9rem] text-gray-500">
          Loading the latest ECMWF forecast…
        </div>
      </div>
      <div class="mt-1 text-[0.62rem] leading-snug text-gray-500">
        <a href="https://charts.ecmwf.int/products/medium-z500-t850" target="_blank" rel="noopener noreferrer">ECMWF Open Charts</a> · © ECMWF · CC BY 4.0
      </div>
    </div>
  </div>
</template>
