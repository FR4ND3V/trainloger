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
  rideDistance: number;
  runDuration?: number;
  swimDuration?: number;
  rideDuration?: number;
}

// ─── Activity Types ─────────────────────────────────────────────────
export type SportType = "Run" | "Swim" | "Ride" | "Core" | "Strength" | "Other";

export interface HRZone {
  zone: number;
  name: string;
  min: number;
  max: number;
  seconds: number;
  percentage: number;
}

export interface PowerZone {
  zone: number;
  name: string;
  min: number;
  max: number;
  seconds: number;
  percentage: number;
}

export interface Activity {
  id: string;
  name: string;
  type: SportType;
  date: string;
  distance: number; // meters
  duration: number; // seconds
  pace?: string; // min/km for run, min/100m for swim, km/h for ride
  avgHR?: number;
  maxHR?: number;
  calories?: number;
  trainingLoad?: number;

  // Common
  elevationGain?: number; // meters
  mapPolyline?: string;   // encoded Google polyline

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

  // Cycling-specific
  avgPower?: number;          // watts
  maxPower?: number;          // watts
  normalizedPower?: number;   // NP watts
  intensityFactor?: number;   // IF (0–1.x)
  tss?: number;               // Training Stress Score
  avgCadenceBike?: number;    // rpm
  avgSpeed?: number;          // km/h

  // Zones (lazy-loaded in modal)
  hrZones?: HRZone[];
  powerZones?: PowerZone[];
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
