import React, { useState } from 'react';
import { Calendar, Plus, Sparkles, CheckSquare, Square, Trash2, Clock } from 'lucide-react';
import type { CalendarTask, FrostDates, Plant } from '../types/garden';
import { generatePlantingCalendar } from '../services/claude';

interface CalendarPanelProps {
  tasks: CalendarTask[];
  setTasks: (tasks: CalendarTask[]) => void;
  frostDates: FrostDates;
  plants: Plant[];
  demoMode: boolean;
  anthropicApiKey: string;
  proxyUrl?: string;
  onAlertCreated: (message: string, type: 'frost' | 'sow' | 'transplant' | 'general', date: string) => void;
}

export const CalendarPanel: React.FC<CalendarPanelProps> = ({
  tasks,
  setTasks,
  frostDates,
  plants,
  demoMode,
  anthropicApiKey,
  proxyUrl,
  onAlertCreated,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth()); // 0-indexed (0=Jan)
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Custom task form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customType, setCustomType] = useState<'sow_indoor' | 'transplant' | 'harvest' | 'water' | 'fertilize' | 'prune' | 'general'>('general');
  const [customDate, setCustomDate] = useState('');
  const [customPlantId, setCustomPlantId] = useState('general');
  const [customNotes, setCustomNotes] = useState('');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const taskTypes: Record<string, { label: string; color: string; border: string }> = {
    sow_indoor: { label: 'Sow Indoor', color: 'bg-indigo-500/10 text-indigo-300', border: 'border-indigo-500/20' },
    transplant: { label: 'Transplant', color: 'bg-emerald-500/10 text-emerald-300', border: 'border-emerald-500/20' },
    harvest: { label: 'Harvest', color: 'bg-amber-500/10 text-amber-300', border: 'border-amber-500/20' },
    water: { label: 'Water', color: 'bg-sky-500/10 text-sky-300', border: 'border-sky-500/20' },
    fertilize: { label: 'Fertilize', color: 'bg-purple-500/10 text-purple-300', border: 'border-purple-500/20' },
    prune: { label: 'Prune', color: 'bg-rose-500/10 text-rose-300', border: 'border-rose-500/20' },
    general: { label: 'General', color: 'bg-slate-500/10 text-slate-300', border: 'border-slate-800' },
  };

  const toggleTaskCompletion = (taskId: string) => {
    setTasks(
      tasks.map((t) => {
        if (t.taskId === taskId) {
          const updated = !t.completed;
          if (updated && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Task Completed!', {
              body: `Great job! You marked "${t.taskName}" as completed.`,
              icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌿</text></svg>'
            });
          }
          return { ...t, completed: updated };
        }
        return t;
      })
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter((t) => t.taskId !== taskId));
  };

  const handleCreateCustomTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customDate) return;

    const plant = plants.find(p => p.id === customPlantId);
    const newTask: CalendarTask = {
      taskId: `task-custom-${Date.now()}`,
      plantId: customPlantId,
      plantName: plant ? plant.commonName : 'Garden',
      taskType: customType,
      taskName: customName,
      dueDate: customDate,
      completed: false,
      notes: customNotes
    };

    setTasks([...tasks, newTask]);

    onAlertCreated(
      `Upcoming: ${customName} (${plant ? plant.commonName : 'General'})`,
      customType === 'sow_indoor' ? 'sow' : customType === 'transplant' ? 'transplant' : 'general',
      customDate
    );

    setCustomName('');
    setCustomDate('');
    setCustomNotes('');
    setCustomType('general');
    setCustomPlantId('general');
    setShowAddForm(false);
  };

  const handleAIGenerateCalendar = async () => {
    if (plants.length === 0) {
      alert("Please add some plants to your garden first so we can plan tasks!");
      return;
    }
    
    setIsGenerating(true);
    try {
      const plantNames = Array.from(new Set(plants.map(p => p.commonName)));
      const newTasks = await generatePlantingCalendar(
        plantNames,
        frostDates,
        { anthropicApiKey, demoMode, proxyUrl }
      );
      
      setTasks(newTasks);

      newTasks.slice(0, 5).forEach((t) => {
        onAlertCreated(
          `Time to ${t.taskType === 'sow_indoor' ? 'sow' : t.taskType === 'transplant' ? 'transplant' : 'inspect'} ${t.plantName}`,
          t.taskType === 'sow_indoor' ? 'sow' : t.taskType === 'transplant' ? 'transplant' : 'general',
          t.dueDate
        );
      });
      
      alert("Planting calendar generated successfully! Check out the monthly lanes.");
    } catch (e: any) {
      console.error(e);
      alert(`Failed to generate calendar: ${e.message || 'Claude API Error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (!t.dueDate) return false;
    const date = new Date(t.dueDate);
    return date.getMonth() === selectedMonth;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold flex items-center space-x-2 text-slate-100">
            <Calendar className="w-5.5 h-5.5 text-forest-400" />
            <span>Personalised Planting Calendar</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Last spring frost: <strong className="text-emerald-400">{frostDates.lastSpring}</strong> • First fall frost: <strong className="text-amber-500">{frostDates.firstFall}</strong>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            id="open-add-task-form-btn"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-bold transition-all duration-200 hover:bg-slate-900/60 flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4 text-forest-400" />
            <span>Add Task</span>
          </button>
          
          <button
            id="ai-generate-calendar-btn"
            disabled={isGenerating || plants.length === 0}
            onClick={handleAIGenerateCalendar}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center space-x-1.5 border glow-green-hover ${
              isGenerating
                ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-600 to-forest-600 border-emerald-500/30 text-white shadow-lg'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span>{isGenerating ? 'Planning...' : 'Generate Calendar'}</span>
          </button>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreateCustomTask} className="glass-panel p-6 rounded-2xl space-y-4 max-w-xl animate-fade-in-up border border-forest-500/20">
          <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
            <Plus className="w-4.5 h-4.5 text-forest-400" />
            <span>Create Custom Garden Task</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="task-name" className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block">
                Task Title
              </label>
              <input
                id="task-name"
                type="text"
                required
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Sow Tomatoes Indoors"
                className="w-full px-3 py-2 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-700 focus:outline-none focus:border-forest-500"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="task-due-date" className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block">
                Due Date
              </label>
              <input
                id="task-due-date"
                type="date"
                required
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-forest-500"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="task-type" className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block">
                Task Category
              </label>
              <select
                id="task-type"
                value={customType}
                onChange={(e) => setCustomType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-forest-500"
              >
                {Object.keys(taskTypes).map((k) => (
                  <option key={k} value={k}>{taskTypes[k].label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="task-plant" className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block">
                Linked Plant
              </label>
              <select
                id="task-plant"
                value={customPlantId}
                onChange={(e) => setCustomPlantId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-forest-500"
              >
                <option value="general">Garden (General)</option>
                {plants.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.commonName})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="task-notes" className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block">
              Instructions / Notes (Optional)
            </label>
            <textarea
              id="task-notes"
              rows={2}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="e.g. Keep seeds at 22°C on heat mat under lights."
              className="w-full px-3 py-2 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-700 focus:outline-none focus:border-forest-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              id="submit-custom-task-btn"
              type="submit"
              className="px-4 py-2 bg-forest-600 hover:bg-forest-500 text-white text-xs font-bold rounded-xl"
            >
              Add to Calendar
            </button>
          </div>
        </form>
      )}

      <div className="flex space-x-2 overflow-x-auto custom-scrollbar pb-3.5 scroll-smooth border-b border-slate-900">
        {months.map((m, idx) => (
          <button
            key={m}
            id={`month-tab-${idx}`}
            onClick={() => setSelectedMonth(idx)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex-shrink-0 transition-all duration-300 ${
              selectedMonth === idx
                ? 'bg-forest-800/40 border border-forest-500 text-emerald-300'
                : 'bg-slate-900/40 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2 mb-4">
          <Clock className="w-4.5 h-4.5 text-forest-400" />
          <span>{months[selectedMonth]} Checklists</span>
        </h3>

        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-2.5 opacity-60">
            <Calendar className="w-8 h-8 text-slate-600" />
            <div>
              <span>No planting tasks listed for {months[selectedMonth]}.</span>
              {plants.length > 0 && (
                <span className="block mt-1 text-[10px] text-forest-400">
                  Hit "Generate Calendar" to generate AI schedules for your crops!
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTasks.map((task) => {
              const cfg = taskTypes[task.taskType] || taskTypes.general;
              return (
                <div
                  key={task.taskId}
                  id={`task-item-${task.taskId}`}
                  className={`p-4 bg-slate-950/60 border rounded-2xl flex items-start justify-between space-x-3 transition-all duration-300 ${
                    task.completed
                      ? 'border-slate-900 opacity-60'
                      : 'border-slate-800/80 hover:border-forest-500/20'
                  }`}
                >
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <button
                      onClick={() => toggleTaskCompletion(task.taskId)}
                      className="mt-0.5 text-forest-400 hover:text-emerald-300 transition-colors"
                      title={task.completed ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {task.completed ? (
                        <CheckSquare className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-600" />
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-extrabold text-slate-100 truncate block">
                          {task.taskName}
                        </span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${cfg.color} ${cfg.border} border`}>
                          {cfg.label}
                        </span>
                      </div>
                      
                      {task.notes && (
                        <p className="text-[10px] text-slate-400 leading-relaxed max-w-full block">
                          {task.notes}
                        </p>
                      )}

                      <div className="flex items-center space-x-3 text-[9px] text-slate-500 font-semibold pt-1">
                        <span>Plant: {task.plantName}</span>
                        <span>•</span>
                        <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteTask(task.taskId)}
                    className="text-slate-600 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-900 transition-colors flex-shrink-0"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
