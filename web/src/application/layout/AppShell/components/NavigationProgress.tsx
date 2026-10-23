import { useNavigation } from 'react-router';

// A thin teal bar along the top while the next page (or a list's new results) loads. It waits 150 ms before it
// shows, so quick loads never flash it, then creeps towards the end until the page arrives and it goes.
function NavigationProgress() {
  const navigation = useNavigation();

  if (navigation.state !== 'loading') return null;

  return (
    <div role="progressbar" aria-label="Loading" className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden">
      <div className="h-full origin-left bg-primary motion-safe:animate-progress motion-reduce:opacity-60" />
    </div>
  );
}

export default NavigationProgress;
