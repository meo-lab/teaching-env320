<script setup lang="ts">
import bonnLogo from '../assets/uni-bonn-logo.svg'
import ilrLogo from '../assets/course-cover/ilr.png'
import landEconomicsLogo from '../assets/course-cover/land-economics-group.png'
import meoLabLogo from '../assets/course-cover/meo-lab.png'
</script>

<template>
  <div class="slidev-layout bonn-layout bonn-course-cover-layout">
    <img class="bonn-course-cover-ilr" :src="ilrLogo" alt="Institute for Food and Resource Economics" />
    <img class="bonn-course-cover-bonn" :src="bonnLogo" alt="University of Bonn" />

    <div class="bonn-course-cover-band">
      <slot />
    </div>

    <p class="bonn-course-cover-term">Winter semester 2026</p>

    <div class="bonn-course-cover-groups">
      <img :src="landEconomicsLogo" alt="Land Economics Group" />
      <img :src="meoLabLogo" alt="MEO Lab" />
    </div>

    <div class="bonn-course-cover-footer" aria-hidden="true">
      <img :src="bonnLogo" alt="" />
      <img :src="ilrLogo" alt="" />
      <img :src="landEconomicsLogo" alt="" />
      <img :src="meoLabLogo" alt="" />
    </div>
  </div>
</template>
