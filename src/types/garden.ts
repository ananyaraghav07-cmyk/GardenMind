export interface Location {
  city: string;
  lat: number;
  lng: number;
  timezone: string;
}

export interface FrostDates {
  lastSpring: string; // e.g. "Apr 10"
  firstFall: string;  // e.g. "Oct 15"
}

export interface HealthLogEntry {
  id: string;
  date: string;
  healthScore: number; // 1-10
  note: string;
  pests: string[];
  diseases: string[];
}

export interface Plant {
  id: string;
  name: string; // User-assigned name, e.g. "Jerry the Tomato"
  species: string; // Botanically identified species, e.g. "Solanum lycopersicum"
  commonName: string; // e.g. "Tomato"
  addedDate: string; // ISO string
  photo: string; // base64 URL or standard URL
  healthScore: number; // current score 1-10
  pests: string[];
  diseases: string[];
  healthLog: HealthLogEntry[];
}

export interface CalendarTask {
  taskId: string;
  plantId: string; // can be "general" for garden-wide tasks
  plantName: string; // convenience copy
  taskType: 'sow_indoor' | 'transplant' | 'harvest' | 'water' | 'fertilize' | 'prune' | 'general';
  taskName: string;
  dueDate: string; // YYYY-MM-DD
  completed: boolean;
  notes?: string;
}

export interface AlertItem {
  alertId: string;
  message: string;
  type: 'frost' | 'sow' | 'transplant' | 'weather' | 'general';
  triggerDate: string; // YYYY-MM-DD
  dismissed: boolean;
}

export interface AppSettings {
  anthropicApiKey: string;
  demoMode: boolean;
}

export interface WeatherData {
  temp: number;
  humidity: number;
  conditionCode: number;
  conditionText: string;
  windSpeed: number;
  precipitationProbability: number;
}
