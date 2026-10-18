<script setup lang="ts">
import { computed } from 'vue'
import logoUrl from '../assets/uni-bonn-logo.svg'
import BonnSectionNav from './BonnSectionNav.vue'

const props = defineProps<{
  sectionColor?: string
  sectionTextColor?: string
}>()

function readableTextColor(background: string) {
  const hex = background.trim().replace(/^#/, '')
  const normalized = hex.length === 3
    ? hex.split('').map(char => char + char).join('')
    : hex

  if (!/^[0-9a-f]{6}$/i.test(normalized))
    return '#ffffff'

  const red = Number.parseInt(normalized.slice(0, 2), 16) / 255
  const green = Number.parseInt(normalized.slice(2, 4), 16) / 255
  const blue = Number.parseInt(normalized.slice(4, 6), 16) / 255
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue

  return luminance > 0.58 ? '#222222' : '#ffffff'
}

const style = computed(() => ({
  '--bonn-section-color': props.sectionColor || 'var(--bonn-blue)',
  '--bonn-section-text-color': props.sectionTextColor || readableTextColor(props.sectionColor || '#00457c'),
}))
</script>

<template>
  <div class="slidev-layout bonn-layout bonn-section-layout" :style="style">
    <div class="bonn-section-color-panel" />
    <main class="bonn-section-content">
      <slot />
    </main>
    <BonnSectionNav />
    <img class="bonn-logo" :src="logoUrl" alt="University of Bonn" />
  </div>
</template>

<style>
.bonn-section-layout {
  overflow: hidden;
  background: #ffffff;
}

.bonn-section-layout::before {
  display: none;
}

.bonn-section-color-panel {
  position: absolute;
  inset: 0 50% 0 0;
  z-index: 1;
  background: var(--bonn-section-color);
}

.bonn-section-content {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: minmax(0, 1fr) auto;
}

.bonn-section-content > * {
  grid-column: 2;
}

.bonn-section-content > h1:first-child {
  grid-column: 1;
  grid-row: 1 / 3;
  align-self: center;
  margin: 0;
  padding: 72px;
  color: var(--bonn-section-text-color);
  font-size: 2.45rem;
  font-weight: 700;
  line-height: 1.08;
}

.bonn-section-content > img,
.bonn-section-content > .bonn-section-image {
  grid-row: 1;
  align-self: center;
  justify-self: center;
  width: calc(100% - 124px);
  max-height: 520px;
  object-fit: contain;
}

.bonn-section-content > .bonn-section-image-sm {
  width: calc(100% - 190px);
  max-height: 440px;
}

.bonn-section-content > .bonn-section-citation {
  grid-row: 2;
  align-self: end;
  justify-self: end;
  max-width: calc(100% - 202px);
  margin: 0 150px 44px 52px;
  color: var(--bonn-muted);
  font-size: .46rem;
  font-weight: 500;
  line-height: 1.25;
  text-align: right;
}

.bonn-section-content > .bonn-section-citation a {
  color: var(--bonn-blue);
  font-weight: 700;
  text-decoration: none;
}

.bonn-section-content > .bonn-section-citation a:hover,
.bonn-section-content > .bonn-section-citation a:focus-visible {
  text-decoration: underline;
  text-decoration-color: var(--bonn-yellow);
  text-decoration-thickness: 2px;
  text-underline-offset: 2px;
  outline: none;
}
</style>
