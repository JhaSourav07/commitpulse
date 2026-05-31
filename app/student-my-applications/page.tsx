import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import StudentMyApplicationsClient from './StudentMyApplicationsClient';

export default function StudentMyApplicationsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center pt-28 pb-16">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        </div>
      }
    >
      <StudentMyApplicationsClient />
    </Suspense>
  );
}
