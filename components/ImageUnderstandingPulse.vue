<template>
  <div class="image-understanding-pulse">
    <img :src="leftImage" :alt="leftAlt" />
    <UnderstandingPulse
      v-bind="$attrs"
      full-width
      left-label=""
      right-label=""
    />
    <img :src="rightImage" :alt="rightAlt" />
  </div>
</template>

<script setup>
import UnderstandingPulse from './UnderstandingPulse.vue';

defineOptions({ inheritAttrs: false });
defineProps({
  leftImage: { type: String, required: true },
  rightImage: { type: String, required: true },
  leftAlt: { type: String, required: true },
  rightAlt: { type: String, required: true },
});
</script>

<style scoped>
.image-understanding-pulse {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr) 180px;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.image-understanding-pulse img {
  width: 180px;
  height: 240px;
  object-fit: contain;
}
</style>
