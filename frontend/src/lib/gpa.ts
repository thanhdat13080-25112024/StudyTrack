/**
 * Client-side mirror of backend `services/gpa_engine` — the VN 10→letter→4.0
 * conversion + classification tiers. Used for instant preview (live letter /
 * grade_4 as the user types, instant what-if). The backend stays the source of
 * truth; `gpa.test.ts` asserts this mirror matches the engine on every boundary.
 */

export interface GradeBand {
  letter: string;
  min10: number; // inclusive lower bound on the 0–10 scale
  grade4: number;
}

export const BANDS: GradeBand[] = [
  { letter: 'A', min10: 8.5, grade4: 4.0 },
  { letter: 'B+', min10: 8.0, grade4: 3.5 },
  { letter: 'B', min10: 7.0, grade4: 3.0 },
  { letter: 'C+', min10: 6.5, grade4: 2.5 },
  { letter: 'C', min10: 5.5, grade4: 2.0 },
  { letter: 'D+', min10: 5.0, grade4: 1.5 },
  { letter: 'D', min10: 4.0, grade4: 1.0 },
  { letter: 'F', min10: 0.0, grade4: 0.0 },
];

export const TIERS: { key: string; min: number }[] = [
  { key: 'xuat_sac', min: 3.6 },
  { key: 'gioi', min: 3.2 },
  { key: 'kha', min: 2.5 },
  { key: 'trung_binh', min: 2.0 },
  { key: 'yeu', min: 0.0 },
];

export function gradeToLetter(grade10: number): string {
  return (BANDS.find((b) => grade10 >= b.min10) ?? BANDS[BANDS.length - 1]).letter;
}

export function gradeToGrade4(grade10: number): number {
  return (BANDS.find((b) => grade10 >= b.min10) ?? BANDS[BANDS.length - 1]).grade4;
}

export function classify(cpa: number): string {
  return (TIERS.find((t) => cpa >= t.min) ?? TIERS[TIERS.length - 1]).key;
}
