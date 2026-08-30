/**
 * Hysteresis smoothing utility for Lo-fi Bun Companion.
 *
 * Prevents rapid animation flickering and state flapping when system metrics
 * hover right on boundary thresholds (e.g. CPU bouncing between 19.9% and 20.1%).
 *
 * Uses an asymmetric dual-threshold approach:
 * - Rising edge: triggers transition when value >= risingThreshold
 * - Falling edge: sustains current state until value < (risingThreshold - buffer)
 */

/**
 * Evaluates whether a high-load state remains active or transitions based on hysteresis buffer.
 *
 * @param currentValue - Current metric value (0-100 percentage).
 * @param isCurrentlyActive - Whether the state being tested was active in the previous cycle.
 * @param risingThreshold - Activation threshold when ascending from lower state.
 * @param buffer - Buffer delta applied to the falling edge to prevent flickering (defaults to 3%).
 * @returns boolean indicating if the target state condition is met.
 */
export function evaluateHysteresis(
  currentValue: number,
  isCurrentlyActive: boolean,
  risingThreshold: number,
  buffer: number = 3
): boolean {
  if (isCurrentlyActive) {
    // Falling edge: sustain high state until value drops below buffered threshold
    return currentValue >= risingThreshold - buffer;
  }
  // Rising edge: trigger high state strictly at or above rising threshold
  return currentValue >= risingThreshold;
}
