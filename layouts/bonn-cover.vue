<script setup lang="ts">
import { computed } from 'vue'
import logoUrl from '../assets/uni-bonn-logo.svg'

const props = defineProps<{
  background?: string
  home?: string
  subhead?: string
}>()

const style = computed(() => {
  if (!props.background)
    return {}

  return {
    backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.18) 100%), url("${props.background}")`,
  }
})
</script>

<template>
  <div class="slidev-layout bonn-layout bonn-cover-layout" :style="style">
    <a v-if="home" class="bonn-cover-home-link" :href="home" aria-label="Course overview">
      <span class="i-carbon:home"></span>
    </a>
    <div class="bonn-cover-panel">
      <p v-if="subhead" class="bonn-cover-subhead">{{ subhead }}</p>
      <slot />
    </div>
    <button class="course-cover-advance-hint" type="button" @click="$slidev.nav.next()">
      <span>Press &#x2192; or SPACE.</span>
      <span class="course-cover-advance-arrow">→</span>
    </button>
    <div class="course-cover-license">
      <strong>© Marc Rußwurm</strong><br>
      Licensed under <strong>Creative Commons Attribution–NonCommercial 4.0 International (CC BY-NC 4.0)</strong>.<br>
      You may share and adapt these slides for teaching, research, and other non-commercial educational purposes with attribution.<br>
      Commercial training, paid workshops, consulting seminars, or incorporation into commercial course products require prior permission.
    </div>
    <img class="bonn-logo" :src="logoUrl" alt="University of Bonn" />
  </div>
</template>
