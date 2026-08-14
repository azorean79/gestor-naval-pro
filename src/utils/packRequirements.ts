export const packRequirements: Record<string, { mandatoryItems: string[] }> = {
  // Define pack types and their mandatory items (lower‑case for easy matching)
  SOLAS_A: { mandatoryItems: ['racao', 'agua'] },
  SOLAS_B: { mandatoryItems: ['racao'] },
  // Any other pack type should also include ração as mandatory
  DEFAULT: { mandatoryItems: ['racao'] },
};
