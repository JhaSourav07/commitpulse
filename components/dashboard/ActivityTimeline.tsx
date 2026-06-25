'use client';

// components/dashboard/ActivityTimeline.tsx
// Activity Timeline for Productivity Dashboard

import { useTranslation } from '@/context/TranslationContext';
import type { ActivityEvent } from '@/types/productivity';

interface ActivityTimelineProps {
  events: ActivityEvent[];
}

export default function ActivityTimeline({ events }: ActivityTimelineProps) {
  const { t } = useTranslation();

  const getEventIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'commit':
        return '📝';
      case 'pr':
        return '🔀';
      case 'review':
        return '👀';
      case 'discussion':
        return '💬';
    }
  };

  const getEventColor = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'commit':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'pr':
        return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      case 'review':
        return 'border-purple-500 bg-purple-50 dark:bg-purple-900/20';
      case 'discussion':
        return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return (
      date.toLocaleDateString() +
      ' ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  };

  if (!events || events.length === 0) {
    return (
      <div className="bg-default-50 dark:bg-default-900 rounded-lg p-8 text-center">
        <p className="text-default-500">{t('dashboard.productivity.no_activity')}</p>
      </div>
    );
  }

  return (
    <section aria-labelledby="activity-timeline-title">
      <h3 id="activity-timeline-title" className="text-lg font-semibold mb-4">
        {t('dashboard.productivity.activity_timeline')}
      </h3>
      <div className="relative">
        {/* Timeline line */}
        <div
          className="absolute left-6 top-0 bottom-0 w-0.5 bg-default-200 dark:bg-default-800"
          aria-hidden="true"
        />

        <div className="space-y-4">
          {events.map((event) => (
            <article
              key={event.id}
              className={`relative pl-14 p-4 rounded-lg border-l-4 ${getEventColor(event.type)}`}
            >
              {/* Icon */}
              <div
                className="absolute left-2 top-4 w-8 h-8 rounded-full bg-white dark:bg-default-900 flex items-center justify-center border-2 border-current"
                aria-hidden="true"
              >
                <span className="text-sm">{getEventIcon(event.type)}</span>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium capitalize">{event.type}</p>
                  <p className="text-sm text-default-600 dark:text-default-400">
                    {event.description}
                  </p>
                  <time className="text-xs text-default-500 mt-1 block" dateTime={event.timestamp}>
                    {formatTimestamp(event.timestamp)}
                  </time>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    event.impact === 'high'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      : event.impact === 'medium'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {event.impact}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
