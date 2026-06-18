import { activityToTowers, generateMonolithSTL } from '../lib/export3d';

self.onmessage = (event: MessageEvent) => {
  try {
    const { activity } = event.data;
    const towers = activityToTowers(activity);
    const stl = generateMonolithSTL(towers);
    self.postMessage({ success: true, stl });
  } catch (error) {
    self.postMessage({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during STL generation',
    });
  }
};
