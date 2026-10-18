<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { slides } from '@slidev/client/logic/slides.ts'
import logoUrl from '../assets/uni-bonn-logo.svg'
import BonnSectionNav from './BonnSectionNav.vue'
import UnderstandingPulse from '../components/UnderstandingPulse.vue'

type Outcome = {
  id: string
  text: string
  number: number
}

type LearningPulseConfig = {
  meetingId?: string
  sessionDate?: string
  outcomesPerSlide?: number
  leftLabel?: string
  rightLabel?: string
  beforeInstruction?: string
  afterInstruction?: string
  fadeMs?: number
  bandwidth?: number
  kernelAmplitude?: number
  densityReferenceCount?: number
}

function clampInt(value: number, min: number, max: number) {
  return Math.min(Math.max(Math.round(value), min), max)
}

function toLocalIsoDate(date: Date) {
  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const route = useRoute()

const slideFrontmatter = computed<Record<string, any>>(() => {
  return (route.meta?.slide?.frontmatter ?? {}) as Record<string, any>
})

const deckFrontmatter = computed<Record<string, any>>(() => {
  const firstSlide = slides.value.find(slide => slide.no === 1)
  return (firstSlide?.meta?.slide?.frontmatter ?? {}) as Record<string, any>
})

const pulseConfig = computed<LearningPulseConfig>(() => {
  const raw = deckFrontmatter.value.learningPulse
  if (raw && typeof raw === 'object')
    return raw as LearningPulseConfig
  return {}
})

const mode = computed<'before' | 'after'>(() => {
  return slideFrontmatter.value.mode === 'after' ? 'after' : 'before'
})

const outcomesPerSlide = computed(() => {
  const raw = Number(pulseConfig.value.outcomesPerSlide ?? 2)
  if (!Number.isFinite(raw))
    return 2
  return clampInt(raw, 1, 3)
})

const allOutcomes = computed<Outcome[]>(() => {
  const raw = deckFrontmatter.value.learningOutcomes
  if (!Array.isArray(raw))
    return []

  return raw
    .map((entry, index) => {
      if (typeof entry === 'string') {
        return {
          id: `outcome-${index + 1}`,
          text: entry,
          number: index + 1,
        }
      }

      if (!entry || typeof entry !== 'object')
        return null

      const text = typeof entry.text === 'string' ? entry.text.trim() : ''
      if (!text)
        return null

      const customId = typeof entry.id === 'string' ? entry.id.trim() : ''
      return {
        id: customId || slugify(text) || `outcome-${index + 1}`,
        text,
        number: index + 1,
      }
    })
    .filter((entry): entry is Outcome => entry !== null)
})

const totalPages = computed(() => {
  if (!allOutcomes.value.length)
    return 1
  return Math.ceil(allOutcomes.value.length / outcomesPerSlide.value)
})

const page = computed(() => {
  const raw = Number(slideFrontmatter.value.page ?? 1)
  if (!Number.isFinite(raw))
    return 1
  return clampInt(raw, 1, Math.max(totalPages.value, 1))
})

const pagedOutcomes = computed(() => {
  const start = (page.value - 1) * outcomesPerSlide.value
  return allOutcomes.value.slice(start, start + outcomesPerSlide.value)
})

const meetingId = computed(() => {
  const raw = pulseConfig.value.meetingId
  if (typeof raw === 'string' && raw.trim())
    return raw.trim()

  const subhead = typeof deckFrontmatter.value.subhead === 'string' ? deckFrontmatter.value.subhead : 'meeting'
  return slugify(subhead) || 'meeting'
})

const sessionDate = computed(() => {
  const raw = pulseConfig.value.sessionDate
  if (typeof raw === 'string' && raw.trim())
    return raw.trim()
  return toLocalIsoDate(new Date())
})

const sessionId = computed(() => `grl:${meetingId.value}:${sessionDate.value}`)

function pollId(outcomeId: string, pollMode: 'before' | 'after') {
  return `outcome:${outcomeId}:${pollMode}`
}

const title = computed(() => {
  const raw = slideFrontmatter.value.title
  if (typeof raw === 'string' && raw.trim())
    return raw

  return mode.value === 'before'
    ? 'Learning Outcomes Check-in (Before)'
    : 'Learning Outcomes Check-in (After)'
})

const subtitle = computed(() => {
  const raw = slideFrontmatter.value.subtitle
  if (typeof raw === 'string' && raw.trim())
    return raw

  return mode.value === 'before'
    ? 'Before teaching: where is your understanding right now?'
    : 'After teaching: click again and compare with the gray before-outline.'
})

const instruction = computed(() => {
  if (mode.value === 'after')
    return pulseConfig.value.afterInstruction || 'After teaching: click again to show your current understanding.'

  return pulseConfig.value.beforeInstruction || 'Before teaching: click on the line to indicate your current understanding.'
})

const leftLabel = computed(() => pulseConfig.value.leftLabel || 'I am completely lost')
const rightLabel = computed(() => pulseConfig.value.rightLabel || 'I fully understand')

const fadeMs = computed(() => {
  const raw = Number(pulseConfig.value.fadeMs ?? 21600000)
  return Number.isFinite(raw) ? raw : 21600000
})

const bandwidth = computed(() => {
  const raw = Number(pulseConfig.value.bandwidth ?? 10)
  return Number.isFinite(raw) ? raw : 10
})

const kernelAmplitude = computed(() => {
  const raw = Number(pulseConfig.value.kernelAmplitude ?? 12)
  return Number.isFinite(raw) ? raw : 12
})

const densityReferenceCount = computed(() => {
  const raw = Number(pulseConfig.value.densityReferenceCount ?? 6)
  return Number.isFinite(raw) ? raw : 6
})
</script>

<template>
  <div class="slidev-layout bonn-layout bonn-content-layout bonn-learning-outcomes-layout">
    <main class="bonn-content bonn-learning-outcomes-content">
      <header class="bonn-learning-outcomes-header">
        <h1>{{ title }}</h1>
        <p class="bonn-learning-outcomes-subtitle">{{ subtitle }}</p>
        <div v-if="mode === 'after'" class="bonn-learning-outcomes-legend">
          <span class="legend-outline" aria-hidden="true" />
          <span>Before responses (same day)</span>
          <span class="legend-fill" aria-hidden="true" />
          <span>Current responses</span>
        </div>
        <p v-if="totalPages > 1" class="bonn-learning-outcomes-page">Outcomes {{ (page - 1) * outcomesPerSlide + 1 }}–{{ Math.min(page * outcomesPerSlide, allOutcomes.length) }} of {{ allOutcomes.length }}</p>
      </header>

      <div v-if="pagedOutcomes.length" class="bonn-learning-outcomes-list">
        <article
          v-for="outcome in pagedOutcomes"
          :key="outcome.id"
          class="bonn-learning-outcomes-item"
        >
          <h2>
            <span class="outcome-number">{{ outcome.number }}.</span>
            {{ outcome.text }}
          </h2>

          <div class="bonn-learning-outcomes-pulse-wrap">
            <UnderstandingPulse
              :session-id="sessionId"
              :poll-id="pollId(outcome.id, mode)"
              :left-label="leftLabel"
              :right-label="rightLabel"
              :instruction="instruction"
              :fade-ms="fadeMs"
              :bandwidth="bandwidth"
              :kernel-amplitude="kernelAmplitude"
              :density-reference-count="densityReferenceCount"
              :reference-session-id="mode === 'after' ? sessionId : undefined"
              :reference-poll-id="mode === 'after' ? pollId(outcome.id, 'before') : undefined"
            />
          </div>
        </article>
      </div>

      <div v-else class="bonn-learning-outcomes-empty">
        No learning outcomes are configured in the deck frontmatter.
      </div>
    </main>

    <BonnSectionNav />
    <img class="bonn-logo" :src="logoUrl" alt="University of Bonn" />
  </div>
</template>

<style>
.bonn-learning-outcomes-content {
  display: flex;
  flex-direction: column;
  min-height: 0;
  gap: .7rem;
}

.bonn-learning-outcomes-header {
  flex: 0 0 auto;
}

.bonn-learning-outcomes-subtitle {
  margin: .25rem 0 0;
  color: var(--bonn-muted);
  font-size: .78rem;
  line-height: 1.3;
}

.bonn-learning-outcomes-legend {
  display: inline-grid;
  grid-template-columns: auto auto auto auto;
  align-items: center;
  gap: .42rem;
  margin-top: .48rem;
  color: var(--bonn-muted);
  font-size: .62rem;
}

.bonn-learning-outcomes-page {
  margin-top: .35rem;
  color: var(--bonn-muted);
  font-size: .62rem;
}

.legend-outline {
  width: 1.2rem;
  height: .45rem;
  border: 1.5px solid rgba(130, 136, 147, .92);
  border-radius: .2rem;
}

.legend-fill {
  width: 1.2rem;
  height: .45rem;
  border: 1.5px solid rgba(0, 0, 0, .2);
  border-radius: .2rem;
  background: rgba(0, 0, 0, .12);
}

.bonn-learning-outcomes-list {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: .78rem;
}

.bonn-learning-outcomes-item {
  border: 1px solid var(--bonn-rule);
  border-radius: .75rem;
  padding: .58rem .78rem .5rem;
  background: #fff;
}

.bonn-learning-outcomes-item h2 {
  margin: 0 0 .42rem;
  color: var(--bonn-text);
  font-size: .74rem;
  font-weight: 600;
  line-height: 1.34;
}

.outcome-number {
  color: var(--bonn-blue);
  font-weight: 700;
}

.bonn-learning-outcomes-pulse-wrap {
  display: flex;
  justify-content: center;
}

.bonn-learning-outcomes-empty {
  margin-top: .8rem;
  color: var(--bonn-muted);
  font-size: .75rem;
}
</style>
