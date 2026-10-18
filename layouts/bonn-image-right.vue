<script setup lang="ts">
import { computed } from 'vue'
import logoUrl from '../assets/uni-bonn-logo.svg'
import BonnSectionNav from './BonnSectionNav.vue'

const props = withDefaults(defineProps<{
  image?: string
  backgroundSize?: string
  columns?: string
}>(), {
  backgroundSize: 'cover',
  columns: '1fr 1fr',
})

const gridStyle = computed(() => ({ '--bonn-image-right-template': props.columns }))
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
  <div class="slidev-layout bonn-layout bonn-content-layout bonn-image-right-layout" :style="gridStyle">
    <div class="bonn-image-right-grid">
      <main class="bonn-content bonn-image-right-content">
        <slot />
      </main>
      <div class="bonn-image-right-image" :style="imageStyle" />
    </div>
    <BonnSectionNav />
    <img class="bonn-logo" :src="logoUrl" alt="University of Bonn" />
  </div>
</template>

<style>
.bonn-image-right-grid {
  display: grid;
  grid-template-columns: var(--bonn-image-right-template);
  width: 100%;
  height: 100%;
}

.bonn-image-right-content {
  min-width: 0;
}

.bonn-image-right-image {
  width: 100%;
  height: 100%;
  background-color: #eef0ef;
}
</style>
