// ─── Wellness Metrics ───────────────────────────────────────────────
export interface WellnessData {
  ctl: number | null;
  atl: number | null;
  tsb: number | null;
  hrv: number | null;
  sleepScore: number | null;
  restingHR: number | null;
  readiness: number | null;
}

export interface ChartDataEntry {
  date: string;
  ctl: number | null;
  atl: number | null;
  tsb: number | null;
  runDistance: number;
  swimDistance: number;
}

// ─── Activity Types ─────────────────────────────────────────────────
export type SportType = "Run" | "Swim" | "Ride" | "Core" | "Strength" | "Other";

export interface Activity {
  id: string;
  name: string;
  type: SportType;
  date: string;
  distance: number; // meters
  duration: number; // seconds
  pace?: string; // min/km for run, min/100m for swim
  avgHR?: number;
  calories?: number;
  trainingLoad?: number;
  // Running-specific
  efficiencyFactor?: number;
  aerobicDecoupling?: number;
  gap?: string;
  avgCadence?: number;
  strideLength?: number;

  // Swim-specific
  swolf?: number;
  strokeCount?: number;
  laps?: number;
  swimPace?: string;
}

// ─── API Response ───────────────────────────────────────────────────
export interface DashboardData {
  wellness: WellnessData;
  activities: Activity[];
  weekRange: {
    start: string;
    end: string;
  };
  summary?: {
    totalDistanceRun: number;
    totalDistanceSwim: number;
    totalDistanceRide: number;
    totalDistance: number;
    avgTSB: number | null;
    maxHRV: number | null;
    minHRV: number | null;
    totalCalories: number;
    totalTrainingLoad: number;
  };
  chartData: ChartDataEntry[];
  syncedAt: string;
}

// ─── Coach Analysis ─────────────────────────────────────────────────
export type FormStatus = "peak" | "optimal" | "neutral" | "fatigued" | "critical";

export interface CoachAnalysis {
  status: FormStatus;
  title: string;
  message: string;
  emoji: string;
}

// ─── Calendar Events ────────────────────────────────────────────────
export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO String
  end: string; // ISO String
  type: "Training" | "Personal" | "Other";
  sportType?: SportType;
  description?: string;
  isAllDay?: boolean;
  distance?: number;
  duration?: number;
}
