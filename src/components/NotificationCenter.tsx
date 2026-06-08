import React, { useState } from 'react';
import { Bell, BellOff, Check, X, AlertTriangle, Calendar, Info } from 'lucide-react';
import type { AlertItem } from '../types/garden';

interface NotificationCenterProps {
  alerts: AlertItem[];
  onDismissAlert: (id: string) => void;
  onClearAll: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  alerts,
  onDismissAlert,
  onClearAll,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const activeAlerts = alerts.filter((a) => !a.dismissed);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
    typeof window !== 'undefined' ? Notification.permission : 'default'
  );

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      if (permission === 'granted') {
        new Notification('GardenMind Alerts Enabled!', {
          body: 'You will now receive notifications for planting times and frost warnings.',
          icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌿</text></svg>'
        });
      }
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'frost':
        return <AlertTriangle className="w-4 h-4 text-sky-400" />;
      case 'sow':
      case 'transplant':
        return <Calendar className="w-4 h-4 text-emerald-400" />;
      default:
        return <Info className="w-4 h-4 text-slate-400" />;
    }
  };

  const getAlertBg = (type: string) => {
    switch (type) {
      case 'frost':
        return 'border-sky-500/20 bg-sky-950/20 text-sky-200';
      case 'sow':
      case 'transplant':
        return 'border-emerald-500/20 bg-emerald-950/20 text-emerald-200';
      default:
        return 'border-slate-800 bg-slate-900/40 text-slate-300';
    }
  };

  return (
    <div className="relative">
      <button
        id="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-900 transition-all duration-300 flex items-center justify-center"
      >
        <Bell className="w-5 h-5" />
        {activeAlerts.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white border-2 border-slate-950 animate-pulse">
            {activeAlerts.length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-3 w-80 sm:w-96 glass-panel rounded-2xl p-4 shadow-2xl z-40 border border-slate-800 animate-fade-in-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Bell className="w-4.5 h-4.5 text-forest-400" />
                <h3 className="font-semibold text-sm">Alerts & Notifications</h3>
              </div>
              {activeAlerts.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center space-x-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Dismiss All</span>
                </button>
              )}
            </div>

            {/* Native Notification Request */}
            {permissionStatus !== 'granted' && (
              <div className="mt-3 p-3 bg-gradient-to-r from-slate-900 to-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <div className="flex flex-col pr-2">
                  <span className="text-[11px] font-semibold text-slate-200">Push Notifications</span>
                  <span className="text-[10px] text-slate-400">Get alerted for frost dates and task updates</span>
                </div>
                <button
                  onClick={requestNotificationPermission}
                  className="bg-forest-600 hover:bg-forest-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors duration-200 flex items-center space-x-1"
                >
                  <span>Enable</span>
                </button>
              </div>
            )}

            <div className="mt-3 max-h-64 overflow-y-auto custom-scrollbar space-y-2">
              {activeAlerts.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-2">
                  <BellOff className="w-8 h-8 opacity-40 text-slate-600" />
                  <span>Your garden is peaceful. No active alerts.</span>
                </div>
              ) : (
                activeAlerts.map((alert) => (
                  <div
                    key={alert.alertId}
                    className={`flex items-start justify-between p-3 rounded-xl border ${getAlertBg(
                      alert.type
                    )} text-xs transition-all duration-300`}
                  >
                    <div className="flex items-start space-x-2.5">
                      <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
                      <div className="flex-1">
                        <p className="leading-relaxed font-medium">{alert.message}</p>
                        <span className="text-[9px] text-slate-500 block mt-1">
                          Due: {new Date(alert.triggerDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => onDismissAlert(alert.alertId)}
                      className="text-slate-500 hover:text-slate-200 p-0.5 rounded-md hover:bg-slate-800/40 transition-colors ml-2"
                      title="Dismiss alert"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
