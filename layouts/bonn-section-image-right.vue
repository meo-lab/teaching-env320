<script setup lang="ts">
import { computed } from 'vue'
import logoUrl from '../assets/uni-bonn-logo.svg'
import BonnSectionNav from './BonnSectionNav.vue'

const props = withDefaults(defineProps<{
  sectionColor?: string
  sectionTextColor?: string
  image?: string
  backgroundSize?: string
}>(), {
  backgroundSize: 'cover',
})

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

const imageStyle = computed(() => props.image
  ? {
      backgroundImage: `url(${props.image})`,
      backgroundSize: props.backgroundSize,
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }
  : {})
</script>

<template>
  <div class="slidev-layout bonn-layout bonn-section-layout bonn-section-image-right-layout" :style="style">
    <div class="bonn-section-color-panel" />
    <div class="bonn-section-image-right-picture" :style="imageStyle" />
    <main class="bonn-section-content">
      <slot />
    </main>
    <BonnSectionNav />
    <img class="bonn-logo" :src="logoUrl" alt="University of Bonn" />
  </div>
</template>

<style>
.bonn-section-image-right-picture {
  position: absolute;
  inset: 0 0 0 50%;
  z-index: 1;
  background-color: #eef0ef;
}

.bonn-section-image-right-layout .bonn-section-content > .bonn-section-citation {
  color: rgba(255, 255, 255, .92);
  text-shadow: 0 1px 4px rgba(0, 0, 0, .55);
}

.bonn-section-image-right-layout .bonn-section-content > .bonn-section-citation a {
  color: #ffffff;
}
</style>
