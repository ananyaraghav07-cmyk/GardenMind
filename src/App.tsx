import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { NotificationCenter } from './components/NotificationCenter';
import { GardenDashboard } from './components/GardenDashboard';
import { WeatherPanel } from './components/WeatherPanel';
import { CalendarPanel } from './components/CalendarPanel';
import { GardenGrid } from './components/GardenGrid';
import { SettingsPanel } from './components/SettingsPanel';
import type { Location, FrostDates, Plant, CalendarTask, AlertItem, AppSettings, HealthLogEntry } from './types/garden';
import { Leaf } from 'lucide-react';

const DEFAULT_LOCATION: Location = {
  city: 'New York, NY, United States',
  lat: 40.7128,
  lng: -74.0060,
  timezone: 'America/New_York'
};

const DEFAULT_FROST_DATES: FrostDates = {
  lastSpring: 'Apr 15',
  firstFall: 'Oct 20'
};

const DEFAULT_SETTINGS: AppSettings = {
  anthropicApiKey: 'free-gardenmind-token',
  demoMode: true // Enabled by default so the app works out-of-the-box
};

// Initial Demo Seed Plants
const DEMO_PLANTS: Plant[] = [
  {
    id: 'demo-tomato-1',
    name: 'Jerry the Tomato',
    species: 'Solanum lycopersicum',
    commonName: 'Tomato (Roma)',
    addedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    photo: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&q=80&w=400',
    healthScore: 9,
    pests: [],
    diseases: [],
    healthLog: [
      {
        id: 'log-1',
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        healthScore: 9,
        note: 'Seedlings transplanted into the main soil bed. Added organic compost. Growth is strong and leaves are deep green.',
        pests: [],
        diseases: []
      }
    ]
  },
  {
    id: 'demo-monstera-1',
    name: 'Lily the Monstera',
    species: 'Monstera deliciosa',
    commonName: 'Swiss Cheese Plant',
    addedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
    photo: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&q=80&w=400',
    healthScore: 5,
    pests: ['Spider Mites'],
    diseases: ['Root Rot (early stage)'],
    healthLog: [
      {
        id: 'log-2',
        date: new Date().toISOString().split('T')[0],
        healthScore: 5,
        note: 'Noticed yellowing leaves and webs underneath. Spider mites detected. Soil feels soggy at the bottom, suggesting poor drainage/root rot.',
        pests: ['Spider Mites'],
        diseases: ['Root Rot (early stage)']
      }
    ]
  }
];

const DEMO_TASKS: CalendarTask[] = [
  {
    taskId: 'task-demo-tomato-sow',
    plantId: 'demo-tomato-1',
    plantName: 'Tomato (Roma)',
    taskType: 'sow_indoor',
    taskName: 'Start Tomato seeds indoors',
    dueDate: '2026-03-01',
    completed: true,
    notes: 'Sow in organic starter trays. Keep under grow lights at 22°C.'
  },
  {
    taskId: 'task-demo-tomato-transplant',
    plantId: 'demo-tomato-1',
    plantName: 'Tomato (Roma)',
    taskType: 'transplant',
    taskName: 'Transplant Tomato outdoors',
    dueDate: '2026-05-10',
    completed: true,
    notes: 'Hardened off seedlings. Place in full sun with tomato cage supports.'
  },
  {
    taskId: 'task-demo-tomato-harvest',
    plantId: 'demo-tomato-1',
    plantName: 'Tomato (Roma)',
    taskType: 'harvest',
    taskName: 'Harvest ripe Romas',
    dueDate: `${new Date().getFullYear()}-08-15`,
    completed: false,
    notes: 'Pick tomatoes when fully red and slightly soft.'
  },
  {
    taskId: 'task-demo-monstera-prune',
    plantId: 'demo-monstera-1',
    plantName: 'Swiss Cheese Plant',
    taskType: 'prune',
    taskName: 'Prune damaged Monstera leaves',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // due in 2 days
    completed: false,
    notes: 'Cut back yellow leaves with clean shears. Dust remaining healthy foliage.'
  }
];

function App() {
  const [activeTab, setActiveTab] = useState('garden');

  // Core Application States (synced with localStorage)
  const [location, setLocation] = useState<Location>(() => {
    const val = localStorage.getItem('garden_location');
    return val ? JSON.parse(val) : DEFAULT_LOCATION;
  });

  const [frostDates, setFrostDates] = useState<FrostDates>(() => {
    const val = localStorage.getItem('garden_frost_dates');
    return val ? JSON.parse(val) : DEFAULT_FROST_DATES;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const val = localStorage.getItem('garden_settings');
    if (val) {
      const parsed = JSON.parse(val);
      if (!parsed.anthropicApiKey) {
        parsed.anthropicApiKey = 'free-gardenmind-token';
      }
      return parsed;
    }
    return DEFAULT_SETTINGS;
  });

  const [proxyUrl, setProxyUrl] = useState<string>(() => {
    return localStorage.getItem('garden_proxy_url') || '';
  });

  const [plants, setPlants] = useState<Plant[]>(() => {
    const val = localStorage.getItem('garden_plants');
    // Pre-populate if empty
    if (!val) {
      localStorage.setItem('garden_plants', JSON.stringify(DEMO_PLANTS));
      return DEMO_PLANTS;
    }
    return JSON.parse(val);
  });

  const [tasks, setTasks] = useState<CalendarTask[]>(() => {
    const val = localStorage.getItem('garden_tasks');
    // Pre-populate if empty
    if (!val) {
      localStorage.setItem('garden_tasks', JSON.stringify(DEMO_TASKS));
      return DEMO_TASKS;
    }
    return JSON.parse(val);
  });

  const [alerts, setAlerts] = useState<AlertItem[]>(() => {
    const val = localStorage.getItem('garden_alerts');
    return val ? JSON.parse(val) : [];
  });

  // Synchronize with localStorage
  useEffect(() => {
    localStorage.setItem('garden_location', JSON.stringify(location));
  }, [location]);

  useEffect(() => {
    localStorage.setItem('garden_frost_dates', JSON.stringify(frostDates));
  }, [frostDates]);

  useEffect(() => {
    localStorage.setItem('garden_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('garden_proxy_url', proxyUrl);
  }, [proxyUrl]);

  useEffect(() => {
    localStorage.setItem('garden_plants', JSON.stringify(plants));
  }, [plants]);

  useEffect(() => {
    localStorage.setItem('garden_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('garden_alerts', JSON.stringify(alerts));
  }, [alerts]);

  // Run alert checks on app load
  useEffect(() => {
    const checkCalendarAlerts = () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const today = new Date(todayStr);
      
      const newAlerts: AlertItem[] = [...alerts];
      let alertAdded = false;

      // Check upcoming tasks within 7 days
      tasks.forEach((t) => {
        if (!t.completed && t.dueDate) {
          const due = new Date(t.dueDate);
          const diffTime = due.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays >= 0 && diffDays <= 7) {
            const alertId = `alert-task-${t.taskId}`;
            // Avoid duplicate alerts
            if (!newAlerts.some(a => a.alertId === alertId)) {
              newAlerts.unshift({
                alertId,
                message: `Upcoming Task: "${t.taskName}" for ${t.plantName} is due in ${diffDays} day(s)!`,
                type: t.taskType === 'sow_indoor' ? 'sow' : t.taskType === 'transplant' ? 'transplant' : 'general',
                triggerDate: todayStr,
                dismissed: false
              });
              alertAdded = true;
              
              // Trigger push notification if permitted
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('GardenMind Task Alert', {
                  body: `"${t.taskName}" is due in ${diffDays} day(s).`,
                  icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌿</text></svg>'
                });
              }
            }
          }
        }
      });

      // Frost Risk Warnings
      const currentMonth = new Date().toLocaleString('en-US', { month: 'short' }); // e.g. "Jun"
      if (frostDates.lastSpring && frostDates.lastSpring.includes(currentMonth)) {
        const frostAlertId = `alert-frost-spring-${currentMonth}`;
        if (!newAlerts.some(a => a.alertId === frostAlertId)) {
          newAlerts.unshift({
            alertId: frostAlertId,
            message: `Frost Warning: We are in the average last spring frost window (${frostDates.lastSpring}). Check night forecasts.`,
            type: 'frost',
            triggerDate: todayStr,
            dismissed: false
          });
          alertAdded = true;
        }
      }

      if (alertAdded) {
        setAlerts(newAlerts);
      }
    };

    checkCalendarAlerts();
  }, [tasks, frostDates]);

  // Handlers for App state updates
  const handleAddPlant = (plantData: { name: string; species: string; commonName: string; photo: string; healthScore: number; pests: string[]; diseases: string[] }) => {
    const newPlant: Plant = {
      id: `plant-${Date.now()}`,
      name: plantData.name,
      species: plantData.species,
      commonName: plantData.commonName,
      addedDate: new Date().toISOString(),
      photo: plantData.photo,
      healthScore: plantData.healthScore,
      pests: plantData.pests,
      diseases: plantData.diseases,
      healthLog: [
        {
          id: `log-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          healthScore: plantData.healthScore,
          note: `Identified and registered. Initial Diagnosis: ${
            [...plantData.pests, ...plantData.diseases].length > 0
              ? 'Issues detected: ' + [...plantData.pests, ...plantData.diseases].join(', ')
              : 'Plant is in good health.'
          }`,
          pests: plantData.pests,
          diseases: plantData.diseases
        }
      ]
    };
    setPlants([newPlant, ...plants]);
  };

  const handleDeletePlant = (id: string) => {
    setPlants(plants.filter(p => p.id !== id));
    // Clean up related tasks
    setTasks(tasks.filter(t => t.plantId !== id));
  };

  const handleUpdatePlantLogs = (plantId: string, logEntry: HealthLogEntry) => {
    setPlants(
      plants.map((p) => {
        if (p.id === plantId) {
          return {
            ...p,
            healthScore: logEntry.healthScore,
            pests: logEntry.pests,
            diseases: logEntry.diseases,
            healthLog: [logEntry, ...p.healthLog]
          };
        }
        return p;
      })
    );
  };

  const handleDismissAlert = (alertId: string) => {
    setAlerts(
      alerts.map((a) => (a.alertId === alertId ? { ...a, dismissed: true } : a))
    );
  };

  const handleDismissAllAlerts = () => {
    setAlerts(alerts.map((a) => ({ ...a, dismissed: true })));
  };

  const handleCreateCustomAlert = (message: string, type: 'frost' | 'sow' | 'transplant' | 'general', date: string) => {
    const newAlert: AlertItem = {
      alertId: `alert-custom-${Date.now()}`,
      message,
      type,
      triggerDate: date,
      dismissed: false
    };
    setAlerts([newAlert, ...alerts]);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'garden':
        return (
          <GardenDashboard
            plants={plants}
            onAddPlant={handleAddPlant}
            onDeletePlant={handleDeletePlant}
            onUpdatePlantLogs={handleUpdatePlantLogs}
            demoMode={settings.demoMode}
            apiKeySet={!!settings.anthropicApiKey}
            anthropicApiKey={settings.anthropicApiKey}
            proxyUrl={proxyUrl}
          />
        );
      case 'weather':
        return (
          <WeatherPanel
            location={location}
            plants={plants}
            demoMode={settings.demoMode}
            anthropicApiKey={settings.anthropicApiKey}
            proxyUrl={proxyUrl}
          />
        );
      case 'calendar':
        return (
          <CalendarPanel
            tasks={tasks}
            setTasks={setTasks}
            frostDates={frostDates}
            plants={plants}
            demoMode={settings.demoMode}
            anthropicApiKey={settings.anthropicApiKey}
            proxyUrl={proxyUrl}
            onAlertCreated={handleCreateCustomAlert}
          />
        );
      case 'companion':
        return (
          <GardenGrid
            myGardenPlants={plants.map((p) => p.commonName)}
            demoMode={settings.demoMode}
            anthropicApiKey={settings.anthropicApiKey}
            proxyUrl={proxyUrl}
          />
        );
      case 'settings':
        return (
          <SettingsPanel
            location={location}
            setLocation={setLocation}
            frostDates={frostDates}
            setFrostDates={setFrostDates}
            settings={settings}
            setSettings={setSettings}
            proxyUrl={proxyUrl}
            setProxyUrl={setProxyUrl}
          />
        );
      default:
        return <div>Tab not found</div>;
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'garden': return 'My Garden';
      case 'weather': return 'Climate & Environment';
      case 'calendar': return 'Sowing Calendar';
      case 'companion': return 'Companion Designer';
      case 'settings': return 'App Configuration';
      default: return 'GardenMind';
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen relative overflow-x-hidden">
      {/* Organic background mesh */}
      <div className="mesh-bg" />

      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        demoMode={settings.demoMode}
        apiKeySet={!!settings.anthropicApiKey}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header bar */}
        <header className="px-6 py-4 border-b border-slate-900/60 flex items-center justify-between z-10 bg-slate-950/20 backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-black tracking-tight text-slate-100 flex items-center space-x-1.5">
              <Leaf className="w-5 h-5 text-forest-500" />
              <span>{getPageTitle()}</span>
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Notification drop center */}
            <NotificationCenter
              alerts={alerts}
              onDismissAlert={handleDismissAlert}
              onClearAll={handleDismissAllAlerts}
            />
          </div>
        </header>

        {/* Dynamic page content container */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
          {renderActiveTab()}
        </div>
      </main>
    </div>
  );
}

export default App;
