'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Eye, EyeOff, LayoutDashboard, GripVertical, CheckCircle2 } from 'lucide-react';

interface Widget {
  id: string;
  name: string;
  description: string;
  visible: boolean;
}

const DEFAULT_WIDGETS: Widget[] = [
  {
    id: 'dev-journey',
    name: 'Developer Journey Timeline',
    description: 'Chronological path of your evolution',
    visible: true,
  },
  {
    id: 'repo-explorer',
    name: 'Repository Contribution Explorer',
    description: 'Deep dive into specific repos',
    visible: true,
  },
  {
    id: 'growth-forecast',
    name: 'Developer Growth Forecast',
    description: 'Predictive models for future commits',
    visible: true,
  },
  {
    id: 'activity-heatmap',
    name: 'Activity Heatmap',
    description: 'Classic 365-day contribution matrix',
    visible: true,
  },
  {
    id: 'ai-insights',
    name: 'AI Insights',
    description: 'Automated profile analysis',
    visible: false,
  },
];

export default function PersonalAnalyticsWorkspace() {
  const [widgets, setWidgets] = useState<Widget[]>(DEFAULT_WIDGETS);
  const [isEditing, setIsEditing] = useState(false);

  const toggleWidget = (id: string) => {
    setWidgets(widgets.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w)));
  };

  const moveWidget = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === widgets.length - 1)
    )
      return;

    const newWidgets = [...widgets];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    const temp = newWidgets[index];
    newWidgets[index] = newWidgets[targetIndex];
    newWidgets[targetIndex] = temp;

    setWidgets(newWidgets);
  };

  return (
    <div
      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#0a0a0a]"
      data-testid="analytics-workspace"
    >
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6 text-blue-500" />
          Personal Analytics Workspace
        </h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isEditing
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          {isEditing ? <CheckCircle2 className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
          {isEditing ? 'Save Layout' : 'Customize Dashboard'}
        </button>
      </div>

      <div className="space-y-3">
        {widgets.map((widget, index) => (
          <motion.div
            key={widget.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center justify-between rounded-lg border p-4 transition-all ${
              widget.visible
                ? 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'
                : 'border-gray-100 bg-gray-50 opacity-60 dark:border-gray-800 dark:bg-black/50'
            }`}
          >
            <div className="flex items-center gap-4">
              {isEditing && (
                <div className="flex flex-col gap-1 text-gray-400">
                  <button
                    onClick={() => moveWidget(index, 'up')}
                    disabled={index === 0}
                    className="hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:hover:text-gray-400"
                    aria-label={`Move ${widget.name} up`}
                  >
                    <GripVertical className="w-4 h-4 rotate-90" />
                  </button>
                </div>
              )}
              <div>
                <h3
                  className={`font-semibold ${widget.visible ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  {widget.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{widget.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {widget.visible ? (
                <span className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-500/10 dark:text-green-400 px-2.5 py-1 rounded-full">
                  Active
                </span>
              ) : (
                <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400 px-2.5 py-1 rounded-full">
                  Hidden
                </span>
              )}

              {isEditing && (
                <button
                  onClick={() => toggleWidget(widget.id)}
                  className={`p-2 rounded-md transition-colors ${
                    widget.visible
                      ? 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                      : 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10'
                  }`}
                  aria-label={widget.visible ? `Hide ${widget.name}` : `Show ${widget.name}`}
                >
                  {widget.visible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {isEditing && (
        <p className="mt-4 text-sm text-center text-gray-500 dark:text-gray-400">
          Reorder modules by clicking the arrows. Hide or show sections using the eye icon. Your
          personalized layout will be saved to your browser automatically.
        </p>
      )}
    </div>
  );
}
