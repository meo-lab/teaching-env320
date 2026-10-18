<script setup>
import { inject } from 'vue'
import UnderstandingPulse from './UnderstandingPulse.vue'

const props = defineProps({ id: { type: String, required: true } })
const context = inject('grl-learning-outcomes')
if (!context) throw new Error('LearningOutcome requires the learning-outcomes layout')
// Freeze a consistent Berlin calendar day for this slide instance. Intl handles DST.
const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' })
function berlinDate(ms) {
  const parts = Object.fromEntries(formatter.formatToParts(ms).map(p => [p.type, p.value]))
  return `${parts.year}-${parts.month}-${parts.day}`
}
const day = berlinDate(Date.now())
// Locate both midnight boundaries, including 23/25-hour DST days.
const approximate = Date.parse(`${day}T00:00:00Z`)
function boundary(target) {
  let low = approximate - 36 * 3600000
  let high = approximate + 60 * 3600000
  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2)
    if (berlinDate(mid) < target) low = mid
    else high = mid
  }
  return high
}
const next = new Date(approximate + 86400000).toISOString().slice(0, 10)
const start = boundary(day)
const end = boundary(next)
const sessionId = `grl--${context.meeting}--${day}`
</script>

<template>
  <section class="learning-outcome">
    <div class="learning-outcome-text"><slot /></div>
    <UnderstandingPulse
      :session-id="sessionId"
      :poll-id="`outcome--${props.id}--${context.mode}`"
      :comparison-poll-id="context.mode === 'after' ? `outcome--${props.id}--before` : ''"
      :comparison-start="start"
      :comparison-end="end"
    />
  </section>
</template>

<style>
.learning-outcome { min-width: 0; }
.learning-outcome-text { min-height: 3.3em; font-size: .95rem; font-weight: 500; line-height: 1.35; }
.learning-outcome-text p { margin: 0; font-size: inherit; font-weight: inherit; line-height: inherit; }
.learning-outcome-text strong { font-weight: 750; color: var(--bonn-blue); }
.learning-outcome .understanding-pulse { width: 100% !important; height: auto !important; margin-top: -24px; }
.learning-outcome .understanding-pulse { background: transparent; }
.learning-outcome .understanding-pulse svg > rect:first-child { fill: transparent; }
.learning-outcome .understanding-pulse svg { width: 100%; height: auto; }
</style>
