<script setup>
import { computed, inject, provide } from 'vue'
import { slides } from '@slidev/client/logic/slides.ts'
import BonnContent from './bonn-content.vue'

const props = defineProps({ mode: { type: String, default: 'before' }, meeting: { type: String, required: true } })
const inherited = inject('grl-learning-outcomes', null)
// Re-render the compiled opening slide's content with the closing slide's context.
// The nested layout renders only its slot, avoiding a second slide frame.
const context = inherited || { mode: props.mode, meeting: props.meeting }
provide('grl-learning-outcomes', context)
const sources = computed(() => slides.value.filter(route => {
  const fm = route.meta?.slide?.frontmatter
  return fm?.layout === 'learning-outcomes' && fm.mode === 'before' && fm.meeting === props.meeting
}))
</script>

<template>
  <div v-if="inherited" class="learning-outcomes-grid learning-outcomes-reused"><slot /></div>
  <BonnContent v-else>
    <template v-if="mode === 'after'">
      <slot />
      <p class="learning-outcomes-legend">Light gray fill: your group's before responses today · Click to respond again.</p>
      <component v-if="sources.length === 1" :is="sources[0].component" />
      <p v-else>Expected exactly one before slide for {{ meeting }}.</p>
    </template>
    <div v-else class="learning-outcomes-grid"><slot /></div>
  </BonnContent>
</template>

<style>
.learning-outcomes-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 28px;
  align-items: start;
}
.learning-outcomes-grid > h1, .learning-outcomes-grid > p { grid-column: 1 / -1; }
.learning-outcomes-grid > h1 { margin-bottom: 8px; }
/* The SVG has generous whitespace above and below its interactive line.
   Tighten that whitespace for three rows while retaining proportional sizing. */
.learning-outcomes-grid:has(> .learning-outcome:nth-of-type(5)) .understanding-pulse {
  margin-bottom: -40px;
}
.learning-outcomes-grid:has(> .learning-outcome:nth-of-type(5)) { row-gap: 20px; }
.learning-outcomes-reused > h1 { display: none; }
.bonn-content .learning-outcomes-legend { margin: -10px 0 12px; font-size: .65rem; color: #666; }
</style>
