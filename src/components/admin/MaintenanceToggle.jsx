"use client";

import { useState, useEffect } from "react";
import { getMaintenanceState, toggleMaintenance } from "@/app/actions/maintenance";
import { Loader2, Power, AlertTriangle } from "lucide-react";

export default function MaintenanceToggle() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    getMaintenanceState().then((res) => {
      if (res.success) {
        setEnabled(res.enabled);
      }
      setLoading(false);
    });
  }, []);

  const handleToggle = async () => {
    setToggling(true);
    const newState = !enabled;
    const res = await toggleMaintenance(newState);
    
    if (res.success) {
      setEnabled(newState);
    } else {
      alert("Failed to update maintenance mode. Check console for details.");
    }
    setToggling(false);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl border transition-all ${
      enabled 
        ? "border-rose-500/50 bg-rose-500/10" 
        : "border-emerald-500/20 bg-emerald-500/5"
    } p-6`}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="flex items-center gap-2 text-lg font-bold text-white">
            <Power className={`h-5 w-5 ${enabled ? "text-rose-500" : "text-emerald-500"}`} />
            Maintenance Mode
          </h3>
          <p className="text-sm text-slate-400">
            {enabled 
              ? "Website is currently offline for non-admins." 
              : "Website is live and accessible to everyone."}
          </p>
        </div>
        
        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 ${
            enabled ? "bg-rose-600" : "bg-slate-700"
          }`}
        >
          <span className="sr-only">Use setting</span>
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
              enabled ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </button>
      </div>
      
      {enabled && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-500/10 p-3 text-xs text-rose-200">
           <AlertTriangle className="h-4 w-4 shrink-0" />
           <span>Use <code>?secret=dev_bypass</code> to access the site.</span>
        </div>
      )}
    </div>
  );
}
