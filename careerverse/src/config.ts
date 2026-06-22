/**
 * ────────────────────────────────────────────────────────────────────────────
 *  CareerVerse — FEEL CONFIG
 *  Every tunable that affects how movement and the galaxy *feel* lives here, so
 *  the experience can be tuned without hunting through engine code.
 *  Numbers are annotated with units and the direction they push the feel.
 * ────────────────────────────────────────────────────────────────────────────
 */

export const CAMERA = {
  /** Zoom = world→screen scale. 1 = a world unit is 1 screen px. */
  MIN_ZOOM: 0.12,           // furthest out — frame the whole galaxy
  MAX_ZOOM: 4.0,            // closest in — arrive at a single star
  DEFAULT_ZOOM: 0.42,       // zoom used on first load / Home

  /** Wheel zoom. Higher = each notch zooms more. */
  WHEEL_ZOOM_SENSITIVITY: 0.0014,  // multiplied by wheel deltaY
  WHEEL_ZOOM_MAX_STEP: 0.25,       // clamp a single wheel event's zoom fraction
  /** +/- buttons & keyboard multiply zoom by this per press. */
  BUTTON_ZOOM_FACTOR: 1.35,
  /** Double-click / double-tap zoom-in multiplier (toward the cursor). */
  DOUBLECLICK_ZOOM_FACTOR: 1.9,

  /**
   * Zoom easing time-constant (ms). The scale glides toward its target with
   * exponential smoothing; the cursor/finger stays pinned to the same world
   * point throughout. Smaller = snappier, larger = floatier.
   */
  ZOOM_SMOOTH_TAU: 90,

  /**
   * Pan inertia. After releasing a drag the camera keeps gliding and decays.
   * FRICTION is the fraction of velocity *kept* per 16.7ms frame (0–1).
   */
  PAN_INERTIA_FRICTION: 0.94,
  PAN_INERTIA_MIN_SPEED: 0.004, // px/ms — below this, inertia stops
  PAN_VELOCITY_SAMPLE_MS: 90,   // window used to estimate fling velocity

  /** Pixels the pointer must move before a press becomes a pan (vs a click). */
  DRAG_THRESHOLD_PX: 5,

  /** Programmatic camera moves (select / breadcrumb / Home). */
  EASE_TO_DURATION_MS: 720,     // duration of a glide to a selected star
  HOME_DURATION_MS: 820,        // duration of a glide to the whole-galaxy view

  /** Keyboard arrow-key panning. */
  KEYBOARD_PAN_SPEED: 0.9,      // px per ms while an arrow is held

  /**
   * Zoom level the camera settles at when you select a star, and how far the
   * star sits above the exact centre (0 = centred; positive = nudged up, to
   * leave room for the detail panel below on tall screens).
   */
  SELECT_ZOOM: 1.25,
  SELECT_VERTICAL_BIAS: 0.06,   // fraction of viewport height

  /** Soft bound: keep at least this fraction of the viewport over the galaxy. */
  PAN_BOUND_KEEP_VISIBLE: 0.18,
} as const;

export const STARS = {
  /** Core dot radius in world units at the smallest importance. */
  CORE_MIN_RADIUS: 7,
  CORE_MAX_RADIUS: 13,         // most "important" occupations are a touch bigger
  /** Glow sprite radius as a multiple of the core radius. */
  GLOW_SCALE: 5.5,
  GLOW_ALPHA: 0.55,

  HOVER_SCALE: 1.35,           // sprite scale-up on hover
  HOVER_TRANSITION_TAU: 70,    // ms smoothing for hover grow/shrink

  /** The selected "sun". */
  SUN_CORE_SCALE: 2.4,
  SUN_GLOW_SCALE: 2.2,
  SUN_RING_COUNT: 3,
  SUN_PULSE_PERIOD_MS: 2600,   // breathing period of the selected star
  SUN_PULSE_AMPLITUDE: 0.08,   // ±8% scale

  /** Dim non-related stars when "focus" is on. */
  DIMMED_ALPHA: 0.22,
  RELATED_HIGHLIGHT_ALPHA: 1.0,

  LABEL_VISIBLE_ZOOM: 0.7,     // zoom above which star name labels fade in
} as const;

export const CONSTELLATION = {
  LINE_WIDTH: 1.4,             // world units (kept crisp via screen-space draw)
  LINE_ALPHA: 0.5,
  LINE_CURVE: 0.16,            // 0 = straight, higher = more bowed
  PARTICLES_PER_LINE: 3,
  PARTICLE_SPEED: 0.00022,     // progress per ms along the line
  PARTICLE_SIZE: 1.8,
  DRAW_DURATION_MS: 520,       // lines "grow" out to neighbours on select
} as const;

export const GALAXY = {
  /** Layout: each RIASEC family gets a region placed around a ring. */
  REGION_RING_RADIUS: 1500,    // distance of region centres from galaxy centre
  REGION_SPREAD: 620,          // how far stars scatter within their region
  CORE_BIAS: 0.55,             // pulls stars toward region centre (0–1)
  MIN_STAR_SEPARATION: 46,     // relax pass keeps stars from overlapping
  NEIGHBOUR_COUNT: 6,          // "nearby careers" drawn per occupation

  /** Decorative deep-field background stars (non-interactive ambiance). */
  FIELD_STAR_COUNT: 1400,
  FIELD_AREA: 5200,            // half-extent of the field around centre
} as const;

export const PARALLAX = {
  /** Background layers move at a fraction of the foreground while panning. */
  NEBULA_FACTOR: 0.18,
  FAR_STARS_FACTOR: 0.35,
  NEAR_STARS_FACTOR: 0.6,
} as const;

export const VISUAL = {
  BG_TOP: 0x05060f,            // near-black navy, top of the backdrop
  BG_BOTTOM: 0x0a0a1f,
  NEBULA_ALPHA: 0.5,
} as const;

/** Single knob the rest of the app reads; flipped on by prefers-reduced-motion. */
export const MOTION = {
  reduced: false,
};
