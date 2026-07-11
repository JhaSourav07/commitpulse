import React from 'react';

export function CollaborationIntelligenceHub() {
  return (
    <div className="p-8 mt-8 border rounded-xl shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900">
      <h2 className="text-3xl font-extrabold mb-6 text-gray-900 dark:text-white">
        Developer Collaboration Intelligence Hub
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow border border-gray-100 dark:border-slate-700"
          >
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Metric {i}
            </h3>
            <div className="h-2 w-full bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: '75%' }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
