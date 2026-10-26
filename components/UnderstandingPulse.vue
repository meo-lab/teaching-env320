<template>
  <div class="understanding-pulse" :class="{ 'understanding-pulse--categorical': categories.length, 'understanding-pulse--full-width': fullWidth }" :style="{ width: categories.length || fullWidth ? '100%' : `${WIDTH}px`, height: categories.length || fullWidth ? 'auto' : `${HEIGHT}px` }">
    <svg
      ref="svgElement"
      :style="{ '--pulse-text-scale': textScale }"
      :width="WIDTH"
      :height="HEIGHT"
      :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
      role="img"
      :aria-label="categories.length ? 'Live categorical poll' : 'Live understanding pulse'"
      @pointerdown="handlePointerDown"
    >
      <rect :width="WIDTH" :height="HEIGHT" fill="white" />

      <text
        v-if="!categories.length"
        :x="LEFT_MARGIN"
        :y="LINE_Y - 18"
        text-anchor="start"
        class="understanding-pulse__label"
      >
        {{ leftLabel }}
      </text>
      <text
        v-if="!categories.length"
        :x="WIDTH - RIGHT_MARGIN"
        :y="LINE_Y - 18"
        text-anchor="end"
        class="understanding-pulse__label"
      >
        {{ rightLabel }}
      </text>

      <g
        v-for="(category, index) in categories"
        :key="category"
        role="button"
        tabindex="0"
        :aria-label="category"
        class="understanding-pulse__category"
        @pointerdown.stop="insertPoint((index + 0.5) / categories.length)"
        @keydown.enter.prevent="insertPoint((index + 0.5) / categories.length)"
        @keydown.space.prevent="insertPoint((index + 0.5) / categories.length)"
      >
        <rect :x="valueToX((index + 0.5) / categories.length) - lineWidth / categories.length / 2" y="20" :width="lineWidth / categories.length" height="82" fill="transparent" />
        <text :x="valueToX((index + 0.5) / categories.length)" y="40" text-anchor="middle" class="understanding-pulse__category-label">
          <tspan v-for="(line, row) in category.split(' &amp; ')" :key="row" :x="valueToX((index + 0.5) / categories.length)" :dy="row ? 13 : 0">{{ row ? '&amp; ' : '' }}{{ line }}</tspan>
        </text>
        <line :x1="valueToX((index + 0.5) / categories.length)" :x2="valueToX((index + 0.5) / categories.length)" :y1="LINE_Y - 5" :y2="LINE_Y + 5" stroke="black" />
      </g>

      <path v-if="comparisonPath" :d="comparisonPath" class="understanding-pulse__comparison" />

      <path
        v-if="densityPath"
        :d="densityPath"
        class="understanding-pulse__density"
      />
      <line
        :x1="LEFT_MARGIN"
        :x2="WIDTH - RIGHT_MARGIN"
        :y1="LINE_Y"
        :y2="LINE_Y"
        class="understanding-pulse__line"
      />

      <g v-for="point in visiblePoints" :key="point.id">
        <circle
          :cx="valueToX(point.value)"
          :cy="LINE_Y"
          r="4"
          fill="black"
          :opacity="point.opacity"
        />
        <circle
          :cx="valueToX(point.value)"
          :cy="LINE_Y"
          r="1.35"
          fill="white"
          :opacity="point.opacity"
        />
      </g>

      <text
        :x="WIDTH / 2"
        :y="LINE_Y + 25"
        text-anchor="middle"
        class="understanding-pulse__instruction"
      >
        {{ instruction }}
      </text>

      <rect
        :x="LEFT_MARGIN - 10"
        :y="LINE_Y - 24"
        :width="WIDTH - LEFT_MARGIN - RIGHT_MARGIN + 20"
        height="48"
        fill="transparent"
        class="understanding-pulse__hit-area"
      />
    </svg>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

// Public web config for the grl-understandingpulse Firebase project.
// Like the old Supabase anon key, this is meant to be public: it only
// identifies the project to the client SDK. Access control lives in
// Firestore security rules (see firestore.rules), not in this key.
const firebaseConfig = {
  apiKey: "AIzaSyCuXvAVanclrCfUNjUQChKQ6GRgNZpTvcY",
  authDomain: "grl-understandingpulse.firebaseapp.com",
  projectId: "grl-understandingpulse",
  storageBucket: "grl-understandingpulse.firebasestorage.app",
  messagingSenderId: "550821538031",
  appId: "1:550821538031:web:961522579cbeed9554131a",
};

const CLIENT_ID_STORAGE_KEY = "understanding-pulse-client-id";
const RESPONSES_COLLECTION = "understanding_responses";
const POINTS_SUBCOLLECTION = "points";

const WIDTH = 500;
const HEIGHT = 150;
const LEFT_MARGIN = 45;
const RIGHT_MARGIN = 45;
const LINE_Y = 78;
const SAMPLE_COUNT = 120;

const props = defineProps({
  fullWidth: { type: Boolean, default: false },
  categories: { type: Array, default: () => [] },
  comparisonPollId: {
    type: String,
    default: "",
  },
  comparisonStart: { type: Number, default: 0 },
  comparisonEnd: { type: Number, default: 0 },
  // Optional recorded responses (values in [0, 1]) shown as the comparison density
  // instead of querying comparisonPollId, e.g. a snapshot from an earlier session.
  comparisonValues: { type: Array, default: () => [] },
  sessionId: {
    type: String,
    required: true,
  },
  pollId: {
    type: String,
    required: true,
  },
  leftLabel: {
    type: String,
    default: "Not comfortable",
  },
  rightLabel: {
    type: String,
    default: "Very comfortable",
  },
  instruction: {
    type: String,
    default: "Click to respond",
  },
  fadeMs: {
    type: Number,
    default: 5000,
  },
  bandwidth: {
    type: Number,
    default: 10,
  },
  kernelAmplitude: {
    type: Number,
    default: 20,
  },
  densityReferenceCount: {
    type: Number,
    default: 6,
  },
});

const svgElement = ref(null);
const renderedWidth = ref(WIDTH);
const textScale = computed(() => props.fullWidth ? WIDTH / renderedWidth.value : 1);
let sizeObserver;

// Reuse a single Firebase app instance across mounts (Slidev can mount this
// component more than once in the same page session).
const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const points = ref([]);
const comparisonPoints = ref([]);
const now = ref(Date.now());

let clientId = "";
let fadeInterval = null;
let unsubscribe = null;
let unsubscribeComparison = null;

const lineWidth = computed(() => WIDTH - LEFT_MARGIN - RIGHT_MARGIN);

const visiblePoints = computed(() => {
  return points.value
    .map((point) => {
      const age = now.value - point.created_at;
      const opacity = clamp(1 - age / props.fadeMs, 0, 1);
      return { ...point, opacity };
    })
    .filter((point) => point.opacity > 0);
});

const densityPath = computed(() => buildDensityPath(visiblePoints.value));
const comparisonPath = computed(() => {
  // Average the historical distribution so class size cannot inflate it.
  const samples = comparisonPoints.value;
  const weight = Math.max(props.densityReferenceCount, 1) / Math.max(samples.length, 1);
  return buildDensityPath(samples.map(point => ({ ...point, opacity: weight })), 24);
});

function buildDensityPath(samples, heightLimit = Infinity) {
  if (!samples.length) return "";

  const upper = [];
  const lower = [];
  const maxDensityHeight = props.kernelAmplitude * props.densityReferenceCount;
  const referenceCount = Math.max(props.densityReferenceCount, 1);
  const bandwidth = Math.max(props.bandwidth, 0.1);

  for (let i = 0; i <= SAMPLE_COUNT; i += 1) {
    const t = i / SAMPLE_COUNT;
    const x = LEFT_MARGIN + t * lineWidth.value;
    let density = 0;

    for (const point of samples) {
      const distance = x - valueToX(point.value);
      const scaledDistance = distance / bandwidth;
      density += Math.exp(-0.5 * scaledDistance * scaledDistance) * point.opacity;
    }

    const normalizedDensity = Math.min(density / referenceCount, 1);
    const height = Math.min(normalizedDensity * maxDensityHeight, heightLimit);
    upper.push([x, LINE_Y - height]);
    lower.push([x, LINE_Y + height]);
  }

  const top = upper.map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`);
  const bottom = lower
    .reverse()
    .map(([x, y]) => `L ${x.toFixed(2)} ${y.toFixed(2)}`);

  return `${top.join(" ")} ${bottom.join(" ")} Z`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function valueToX(value) {
  return LEFT_MARGIN + clamp(Number(value), 0, 1) * lineWidth.value;
}

function xToValue(x) {
  return clamp((x - LEFT_MARGIN) / lineWidth.value, 0, 1);
}

function getClientId() {
  if (typeof localStorage === "undefined") {
    return `client-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  try {
    const existing = localStorage.getItem(CLIENT_ID_STORAGE_KEY);
    if (existing) return existing;

    const generated = `client-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(CLIENT_ID_STORAGE_KEY, generated);
    return generated;
  } catch (error) {
    console.error("UnderstandingPulse client ID storage failed", error);
    return `client-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

function pointsCollectionRef(pollId = props.pollId) {
  // One Firestore doc per (sessionId, pollId) pair, with the individual
  // votes as a subcollection underneath it. This mirrors the old
  // `session_id`/`poll_id` filter on the Supabase table without needing a
  // composite index: the path itself does the filtering, and the
  // remaining `created_at` range + order is a single-field query.
  const docId = `${props.sessionId}__${pollId}`;
  return collection(db, RESPONSES_COLLECTION, docId, POINTS_SUBCOLLECTION);
}

async function insertPoint(value) {
  try {
    await addDoc(pointsCollectionRef(), {
      client_id: clientId,
      value,
      created_at: serverTimestamp(),
    });
  } catch (error) {
    console.error("UnderstandingPulse insert failed", error);
  }
}

function handlePointerDown(event) {
  const svg = event.currentTarget;
  const rect = svg.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * WIDTH;
  const y = ((event.clientY - rect.top) / rect.height) * HEIGHT;

  if (y < LINE_Y - 24 || y > LINE_Y + 24) return;

  const value = xToValue(x);
  const count = props.categories.length;
  insertPoint(count ? (Math.min(Math.floor(value * count), count - 1) + 0.5) / count : value);
}

function startListening() {
  const since = Timestamp.fromMillis(Date.now() - props.fadeMs);
  const pointsQuery = query(
    pointsCollectionRef(),
    where("created_at", ">=", since),
    orderBy("created_at", "asc"),
  );

  unsubscribe = onSnapshot(
    pointsQuery,
    (snapshot) => {
      points.value = snapshot.docs.map((docSnap) => {
        // "estimate" fills in a local timestamp for a write that hasn't
        // been confirmed by the server yet, so a point you just placed
        // shows up immediately instead of waiting for a round trip.
        const data = docSnap.data({ serverTimestamps: "estimate" });
        const createdAt = data.created_at ? data.created_at.toMillis() : Date.now();
        return {
          id: docSnap.id,
          value: data.value,
          client_id: data.client_id,
          created_at: createdAt,
        };
      });
    },
    (error) => {
      console.error("UnderstandingPulse realtime failed", error);
    },
  );
}

function startComparisonListening() {
  if (props.comparisonValues.length) {
    comparisonPoints.value = props.comparisonValues.map((value) => ({ value, opacity: 1 }));
    return;
  }
  if (!props.comparisonPollId) return;
  const comparisonQuery = query(
    pointsCollectionRef(props.comparisonPollId),
    where("created_at", ">=", Timestamp.fromMillis(props.comparisonStart)),
    where("created_at", "<", Timestamp.fromMillis(props.comparisonEnd)),
    orderBy("created_at", "asc"),
  );
  unsubscribeComparison = onSnapshot(comparisonQuery, (snapshot) => {
    const latest = new Map();
    for (const doc of snapshot.docs) {
      const data = doc.data();
      // Ascending timestamps mean the last click from each browser wins.
      latest.set(data.client_id, { value: data.value, opacity: 1 });
    }
    comparisonPoints.value = [...latest.values()];
  }, (error) => console.error("UnderstandingPulse comparison failed", error));
}

onMounted(() => {
  sizeObserver = new ResizeObserver(([entry]) => {
    if (entry.contentRect.width > 0) renderedWidth.value = entry.contentRect.width;
  });
  sizeObserver.observe(svgElement.value);
  clientId = getClientId();
  startListening();
  startComparisonListening();

  fadeInterval = window.setInterval(() => {
    now.value = Date.now();
    points.value = points.value.filter((point) => now.value - point.created_at < props.fadeMs);
  }, 100);
});

onUnmounted(() => {
  sizeObserver?.disconnect();
  if (fadeInterval) window.clearInterval(fadeInterval);
  if (unsubscribe) unsubscribe();
  if (unsubscribeComparison) unsubscribeComparison();
});
</script>

<style scoped>
.understanding-pulse {
  display: inline-block;
  background: white;
  color: black;
  user-select: none;
  touch-action: manipulation;
}

.understanding-pulse svg {
  display: block;
  cursor: crosshair;
}

.understanding-pulse--categorical,
.understanding-pulse--full-width { display: block; }
.understanding-pulse--categorical svg,
.understanding-pulse--full-width svg {
  width: 100%;
  max-width: none;
  height: auto;
}

.understanding-pulse__category { cursor: pointer; }
.understanding-pulse__category:focus { outline: 1px solid var(--bonn-blue); }
.understanding-pulse__category-label { font-size: 9px; fill: #111; }

.understanding-pulse__label {
  fill: #111;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: calc(13px * var(--pulse-text-scale, 1));
}

.understanding-pulse__instruction {
  fill: #888;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: calc(10px * var(--pulse-text-scale, 1));
}

.understanding-pulse__line {
  stroke: #111;
  stroke-width: 1.5;
}

.understanding-pulse__density {
  fill: rgba(0, 0, 0, 0.086);
  stroke: rgba(0, 0, 0, 0.24);
  stroke-width: 1;
}

.understanding-pulse__comparison {
  fill: rgba(0, 0, 0, 0.06);
  stroke: none;
  pointer-events: none;
}

.understanding-pulse__hit-area {
  pointer-events: all;
}
</style>
