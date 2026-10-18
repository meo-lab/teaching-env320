<script setup lang="ts">
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client'
import { slides } from '@slidev/client/logic/slides.ts'

type Section = {
  id: string
  title: string
  slideNo: number
}

const { $nav, $page } = useSlideContext()

function titleFromId(id: string) {
  return id
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

const sections = computed<Section[]>(() => {
  const seen = new Set<string>()
  const result: Section[] = []

  for (const route of slides.value) {
    const frontmatter = route.meta?.slide?.frontmatter ?? {}
    const id = frontmatter.section

    if (!id || typeof id !== 'string' || seen.has(id))
      continue

    seen.add(id)
    result.push({
      id,
      title: typeof frontmatter.sectionTitle === 'string'
        ? frontmatter.sectionTitle
        : titleFromId(id),
      slideNo: route.no,
    })
  }

  return result
})

const activeSectionId = computed(() => {
  let active: Section | undefined

  for (const section of sections.value) {
    if (section.slideNo <= $page.value)
      active = section
    else
      break
  }

  return active?.id
})
</script>

<template>
  <nav
    v-if="sections.length > 0"
    class="bonn-section-nav"
    aria-label="Lecture sections"
  >
    <button
      v-for="section in sections"
      :key="section.id"
      class="bonn-section-nav-item"
      :class="{ 'is-active': section.id === activeSectionId }"
      type="button"
      @click="$nav.go(section.slideNo)"
    >
      {{ section.title }}
    </button>
  </nav>
</template>
