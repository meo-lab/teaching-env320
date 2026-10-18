<script setup lang="ts">
import { computed } from 'vue'
import logoUrl from '../assets/uni-bonn-logo.svg'
import BonnSectionNav from './BonnSectionNav.vue'

const props = defineProps<{
  columns?: string
}>()

const style = computed(() => ({
  '--bonn-two-cols-template': props.columns || 'minmax(0, 1fr) minmax(0, 1fr)',
}))
</script>

<template>
  <div class="slidev-layout bonn-layout bonn-content-layout bonn-two-cols-header-layout" :style="style">
    <main class="bonn-content bonn-two-cols-header-content">
      <header class="bonn-two-cols-header">
        <slot />
      </header>
      <div class="bonn-two-cols">
        <section class="bonn-two-cols-column">
          <slot name="left" />
        </section>
        <section class="bonn-two-cols-column">
          <slot name="right" />
        </section>
      </div>
      <footer v-if="$slots.bottom" class="bonn-two-cols-footer">
        <slot name="bottom" />
      </footer>
    </main>
    <BonnSectionNav />
    <img class="bonn-logo" :src="logoUrl" alt="University of Bonn" />
  </div>
</template>

<style>
.bonn-two-cols-header-content {
  display: flex;
  flex-direction: column;
}

.bonn-two-cols-header {
  flex: 0 0 auto;
}

.bonn-two-cols-header > :last-child {
  margin-bottom: 0;
}

.bonn-two-cols {
  display: grid;
  grid-template-columns: var(--bonn-two-cols-template);
  /* A fixed 1fr row (rather than the default auto-sized row) keeps the row's
     height equal to the space actually available in the slide, so a tall
     column can't inflate the whole grid past the slide's bounds — content
     that needs "fill available height" (e.g. h-full/flex-1 demos) gets a
     genuinely definite height to resolve against instead of an indeterminate one. */
  grid-template-rows: minmax(0, 1fr);
  gap: 1.5rem;
  flex: 1;
  min-height: 0;
  margin-top: 1.1rem;
}

.bonn-two-cols-column {
  min-width: 0;
  min-height: 0;
}

.bonn-two-cols-column > :first-child {
  margin-top: 0;
}

.bonn-two-cols-column > :last-child {
  margin-bottom: 0;
}

.bonn-two-cols-footer {
  flex: 0 0 auto;
  margin-top: .9rem;
}

.bonn-two-cols-footer > :last-child {
  margin-bottom: 0;
}
</style>
