<script setup>
</script>

<template>
  <div class="aol">
    <div class="aol-grid">
      <!-- Experiences / Data (left) -->
      <div class="aol-node aol-node-experiences" v-click="3">
        <svg class="aol-icon" viewBox="0 0 64 64" fill="none">
          <rect x="4" y="8" width="20" height="16" rx="3" stroke="currentColor" stroke-width="2.5"/>
          <path d="M8 20l4-5 3 3 5-6 4 8" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
          <rect x="4" y="30" width="20" height="16" rx="3" stroke="currentColor" stroke-width="2.5"/>
          <line x1="8" y1="35" x2="20" y2="35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <line x1="8" y1="40" x2="16" y2="40" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <rect x="26" y="19" width="20" height="16" rx="3" stroke="currentColor" stroke-width="2.5"/>
          <polyline points="29,27 33,23 37,30 41,25 43,27" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <h3>Experiences</h3>
        <p>Examples from the environment</p>
        <span class="aol-chip aol-chip-l5">Lecture 5 &middot; Data</span>
      </div>

      <!-- connector: experiences -> model -->
      <svg class="aol-connector aol-connector-muted" v-click="3" viewBox="0 0 64 24" preserveAspectRatio="none">
        <line x1="2" y1="12" x2="52" y2="12" stroke="currentColor" stroke-width="2.5"/>
        <polygon points="52,5 62,12 52,19" fill="currentColor"/>
      </svg>

      <!-- Learnable model (center) -->
      <div class="aol-node aol-node-model" v-click="1">
        <svg class="aol-icon aol-icon-model" viewBox="0 0 64 64" fill="none">
          <path d="M16 40C7 40 4 27 12 19 10 9 25 4 32 11 39 4 54 9 52 19 60 27 57 40 48 40 48 49 39 53 32 48 25 53 16 49 16 40Z"
                stroke="white" stroke-width="2.2" stroke-linejoin="round"/>
          <circle cx="24" cy="24" r="2.6" fill="white"/>
          <circle cx="40" cy="22" r="2.6" fill="white"/>
          <circle cx="32" cy="32" r="2.6" fill="white"/>
          <circle cx="22" cy="38" r="2.6" fill="white"/>
          <circle cx="42" cy="37" r="2.6" fill="white"/>
          <g stroke="white" stroke-width="1.4" stroke-opacity=".85">
            <line x1="24" y1="24" x2="32" y2="32"/>
            <line x1="40" y1="22" x2="32" y2="32"/>
            <line x1="32" y1="32" x2="22" y2="38"/>
            <line x1="32" y1="32" x2="42" y2="37"/>
            <line x1="24" y1="24" x2="22" y2="38"/>
            <line x1="40" y1="22" x2="42" y2="37"/>
          </g>
        </svg>
        <h3>Learnable model</h3>
        <p>Can adapt its internal parameters</p>
        <span class="aol-chip aol-chip-strong">Lecture 4 &middot; Deep Representation Learning I</span>
      </div>

      <!-- connector: model -> generalization -->
      <svg class="aol-connector aol-connector-light" v-click="4" viewBox="0 0 64 24" preserveAspectRatio="none">
        <line x1="2" y1="12" x2="52" y2="12" stroke="currentColor" stroke-width="2.5" stroke-dasharray="5 5"/>
        <polygon points="52,5 62,12 52,19" fill="currentColor"/>
      </svg>

      <!-- Generalization (right) -->
      <div class="aol-node aol-node-generalization" v-click="4">
        <svg class="aol-icon" viewBox="0 0 64 64" fill="none">
          <polygon points="32,6 50,18 50,42 32,54 14,42 14,18" stroke="currentColor" stroke-width="2.2" stroke-dasharray="4 4"/>
          <circle cx="32" cy="30" r="4" stroke="currentColor" stroke-width="2.2"/>
        </svg>
        <h3>Generalization</h3>
        <p>Performs well in new, unseen situations</p>
        <span class="aol-chip aol-chip-l5-outline">Lecture 5 &middot; Deep Representation Learning II</span>
      </div>

      <!-- Learning algorithm loop (beneath model) -->
      <svg class="aol-loop" v-click="2" viewBox="0 0 80 56" fill="none">
        <path d="M14 8C14 8 14 30 40 30C66 30 66 8 66 8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
        <polygon points="8,10 18,4 18,16" fill="currentColor"/>
        <polygon points="72,10 62,4 62,16" fill="currentColor"/>
      </svg>

      <div class="aol-node aol-node-algorithm" v-click="2">
        <svg class="aol-icon" viewBox="0 0 64 64" fill="none">
          <path d="M32 12a20 20 0 1 1-14.1 5.9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
          <polygon points="10,10 18,10 14,20" fill="currentColor"/>
        </svg>
        <h3>Learning algorithm</h3>
        <p>Uses experience to adjust the model</p>
        <span class="aol-chip aol-chip-strong">Lecture 4 &middot; Deep Representation Learning I</span>
      </div>

      <!-- Ingredients vs. success criterion -->
      <div class="aol-legend aol-legend-ingredients" v-click="4">Ingredients for learning</div>
      <div class="aol-legend aol-legend-criterion" v-click="4">Success criterion</div>
    </div>
  </div>
</template>

<style scoped>
.aol {
  display: flex;
  flex-direction: column;
  height: 100%;
  /* Lecture 4 uses the standard Bonn blue; Lecture 5 gets its own green accent
     so the two lecture groups are distinguishable at a glance, not just by label. */
  --aol-l5: #0f7d5c;
  --aol-l5-tint: #eaf5f1;
  --aol-l5-dark: #0b5c44;
}

.aol-grid {
  display: grid;
  flex: 1;
  grid-template-columns: minmax(140px, 1fr) 52px minmax(190px, 1.3fr) 52px minmax(140px, 1fr);
  grid-template-rows: auto 30px auto 18px;
  align-items: center;
  column-gap: 8px;
  row-gap: 3px;
  min-height: 0;
}

.aol-node {
  padding: .4rem .55rem;
  border-radius: 10px;
  text-align: center;
  transition: opacity .3s ease, transform .3s ease;
}

.aol-node h3 {
  margin: .2rem 0 .1rem;
  font-size: .74rem;
  font-weight: 700;
}

.aol-node p {
  margin: 0 0 .3rem;
  font-size: .6rem;
  line-height: 1.22;
}

.aol-icon {
  width: 28px;
  height: 28px;
}

.aol-node-model {
  grid-column: 3;
  grid-row: 1;
  padding: .6rem .8rem;
  background: var(--bonn-blue);
  color: #ffffff;
  box-shadow: 0 10px 26px rgba(0, 69, 124, .28);
}

.aol-node-model .aol-icon-model {
  width: 40px;
  height: 40px;
}

.aol-node-model h3 {
  color: #ffffff;
  font-size: .98rem;
}

.aol-node-model p {
  color: rgba(255, 255, 255, .85);
}

.aol-node-experiences {
  grid-column: 1;
  grid-row: 1;
  background: var(--aol-l5-tint);
  border: 1px solid var(--aol-l5);
  color: var(--aol-l5-dark);
}

.aol-node-experiences h3 {
  color: var(--aol-l5-dark);
}

.aol-node-generalization {
  grid-column: 5;
  grid-row: 1;
  padding: .5rem .65rem;
  border: 1.5px dashed var(--aol-l5);
  color: var(--aol-l5-dark);
}

.aol-node-generalization h3 {
  color: var(--aol-l5-dark);
}

.aol-node-algorithm {
  grid-column: 3;
  grid-row: 3;
  border: 1.5px solid var(--bonn-blue);
  background: rgba(0, 69, 124, .05);
  color: var(--bonn-blue);
}

.aol-node-algorithm h3 {
  color: var(--bonn-blue);
}

.aol-node-algorithm p {
  color: #3b6f96;
}

.aol-connector {
  grid-row: 1;
  width: 100%;
  height: 16px;
  align-self: center;
}

.aol-connector-muted {
  grid-column: 2;
  color: #9a9d9c;
}

.aol-connector-light {
  grid-column: 4;
  color: #5b9bd5;
}

.aol-loop {
  grid-column: 3;
  grid-row: 2;
  width: 46px;
  height: auto;
  margin: 0 auto;
  color: var(--bonn-blue);
}

.aol-chip {
  display: inline-block;
  padding: .12rem .45rem;
  border-radius: 999px;
  font-size: .5rem;
  font-weight: 700;
  letter-spacing: .01em;
}

.aol-chip-strong {
  background: rgba(255, 255, 255, .18);
  color: #ffffff;
}

.aol-node-algorithm .aol-chip-strong {
  background: var(--bonn-blue);
  color: #ffffff;
}

.aol-chip-l5 {
  background: var(--aol-l5);
  color: #ffffff;
}

.aol-chip-l5-outline {
  border: 1px solid var(--aol-l5);
  color: var(--aol-l5-dark);
  background: transparent;
}

.aol-legend {
  grid-row: 4;
  align-self: start;
  padding-top: .2rem;
  border-top: 1px solid var(--bonn-rule);
  color: var(--bonn-muted);
  font-size: .5rem;
  font-weight: 700;
  letter-spacing: .04em;
  text-align: center;
  text-transform: uppercase;
}

.aol-legend-ingredients {
  grid-column: 1 / span 4;
}

.aol-legend-criterion {
  grid-column: 5;
  border-top-color: var(--aol-l5);
  color: var(--aol-l5-dark);
}
</style>
