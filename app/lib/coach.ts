import type { CoachAnalysis, FormStatus, WellnessData } from "@/app/types";

export function analyzeForm(wellness: WellnessData): CoachAnalysis {
  const tsb = wellness.tsb;

  if (tsb === null || tsb === undefined) {
    return {
      status: "neutral",
      title: "Sin datos suficientes",
      message:
        "No hay datos de TSB disponibles para esta semana. Sincroniza tu reloj y espera a que Intervals.icu procese los datos.",
      emoji: "📊",
    };
  }

  const status = getFormStatus(tsb);

  const analyses: Record<FormStatus, CoachAnalysis> = {
    peak: {
      status: "peak",
      title: "Forma Pico",
      message: `TSB en ${tsb > 0 ? "+" : ""}${tsb.toFixed(1)}. Estás en tu mejor momento. Es el día ideal para competir o hacer un test de rendimiento. Aprovecha esta ventana de forma.`,
      emoji: "🔥",
    },
    optimal: {
      status: "optimal",
      title: "Forma Óptima",
      message: `TSB en ${tsb > 0 ? "+" : ""}${tsb.toFixed(1)}. Buen equilibrio entre carga y recuperación. Puedes entrenar con intensidad moderada-alta. Tu cuerpo está respondiendo bien.`,
      emoji: "✅",
    },
    neutral: {
      status: "neutral",
      title: "Equilibrio Funcional",
      message: `TSB en ${tsb.toFixed(1)}. Estás en zona neutra. Buen momento para acumular volumen de base o incorporar trabajos de técnica sin riesgo de sobreentrenamiento.`,
      emoji: "⚖️",
    },
    fatigued: {
      status: "fatigued",
      title: "Acumulación de Fatiga",
      message: `TSB en ${tsb.toFixed(1)}. La fatiga se acumula. Considera reducir volumen un 20-30% esta semana. Prioriza sueño y nutrición. Una sesión regenerativa de natación puede ayudar.`,
      emoji: "⚠️",
    },
    critical: {
      status: "critical",
      title: "Fatiga Crítica",
      message: `TSB en ${tsb.toFixed(1)}. Riesgo alto de sobreentrenamiento o lesión. Planifica 2-3 días de descanso activo. Monitoriza tu HRV y frecuencia cardíaca en reposo antes de volver a cargar.`,
      emoji: "🛑",
    },
  };

  return analyses[status];
}

function getFormStatus(tsb: number): FormStatus {
  if (tsb >= 15) return "peak";
  if (tsb >= 5) return "optimal";
  if (tsb >= -5) return "neutral";
  if (tsb >= -15) return "fatigued";
  return "critical";
}
