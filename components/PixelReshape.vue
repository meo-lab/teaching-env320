<script setup lang="ts">
import { computed, ref } from 'vue'
import { MNIST_LABEL, MNIST_PIXELS } from '../data/mnist5'

const columns = ref(20)
const minColumns = 14
const maxColumns = 56
const totalPixels = MNIST_PIXELS.length
const pitch = 9
const pixelSize = 8

console.assert(MNIST_LABEL === 5)
console.assert(totalPixels === 784)

const rows = computed(() => Math.ceil(totalPixels / columns.value))
const gridWidth = computed(() => columns.value * pitch)
const gridHeight = computed(() => rows.value * pitch)
const isCanonical = computed(() => columns.value === 28)

function pixelStyle(value: number, index: number) {
  const col = index % columns.value
  const row = Math.floor(index / columns.value)
  const x = col * pitch
  const y = row * pitch

  return {
    transform: `translate3d(${x}px, ${y}px, 0)`,
    width: `${pixelSize}px`,
    height: `${pixelSize}px`,
    background: `rgb(${value}, ${value}, ${value})`,
  }
}
</script>

<template>
  <div class="reshape-demo">
    <div class="controls">
      <label for="columns-range" class="label">Columns: {{ minColumns }}–{{ maxColumns }}</label>
      <input id="columns-range" v-model.number="columns" class="slider" type="range" :min="minColumns" :max="maxColumns" step="1" />
      <div class="status" :class="{ canonical: isCanonical }">
        <strong>{{ columns }} × {{ rows }}</strong>
        <span v-if="isCanonical"> — 28 × 28 — the spatial structure becomes visible.</span>
        <span v-else> — Same 784 values. Different arrangement.</span>
      </div>
    </div>

    <div class="frame" :class="{ canonical: isCanonical }">
      <div class="pixel-grid" :style="{ width: `${gridWidth}px`, height: `${gridHeight}px` }" aria-label="MNIST pixel arrangement">
        <div v-for="(value, i) in MNIST_PIXELS" :key="i" class="pixel" :style="pixelStyle(value, i)" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.reshape-demo {
  display: grid;
  gap: 10px;
}

.controls {
  display: grid;
  gap: 5px;
}

.label {
  font-size: 0.72rem;
  color: #4b5563;
}

.slider {
  width: 100%;
  accent-color: #00457c;
}

.status {
  font-size: 0.74rem;
  color: #374151;
}

.status.canonical {
  color: #0f5132;
  font-weight: 600;
}

.frame {
  border: 1px solid #d1d5db;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  background: #ffffff;
  transition: border-color 450ms cubic-bezier(.4, 0, .2, 1), box-shadow 450ms cubic-bezier(.4, 0, .2, 1);
}

.frame.canonical {
  border-color: #a7f3d0;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.18);
}

.pixel-grid {
  position: relative;
  transition: width 450ms cubic-bezier(.4, 0, .2, 1), height 450ms cubic-bezier(.4, 0, .2, 1);
}

.pixel {
  position: absolute;
  top: 0;
  left: 0;
  transition: transform 450ms cubic-bezier(.4, 0, .2, 1);
  will-change: transform;
}

@media (prefers-reduced-motion: reduce) {
  .frame,
  .pixel-grid,
  .pixel {
    transition: none;
  }
}
</style>
