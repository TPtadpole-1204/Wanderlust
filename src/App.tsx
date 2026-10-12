import React, { useState, useEffect } from 'react';
import { Trip, ItineraryItem } from './types';
import { 
  loadSavedTrips, 
  saveTrips, 
  getActiveTripId, 
  setActiveTripId,
  INITIAL_TOKYO_TRIP 
} from './services/storage';
import { exportTripToPDF } from './services/pdfExport';
import { ConfirmModal } from './components/ConfirmModal';

import { Sidebar, ActiveTab } from './components/Sidebar';
import { ItineraryView } from './components/ItineraryView';
import { BudgetView } from './components/BudgetView';
import { AttractionsView } from './components/AttractionsView';
import { FlightTrackerView } from './components/FlightTrackerView';

import { ChecklistView } from './components/ChecklistView';
import { TripSettingsModal } from './components/TripSettingsModal';
import { VerificationModal } from './components/VerificationModal';
import { Sparkles, WifiOff } from 'lucide-react';
import { useTheme } from './hooks/useTheme';

export default function App() {
  const { isDarkMode, toggleDarkMode, themeColor, setThemeColor } = useTheme();
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);


  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const [savedTrips, setSavedTrips] = useState<Trip[]>(() => loadSavedTrips());
  const [activeTripId, setActiveTripIdState] = useState<string>(() => getActiveTripId());
  
  const currentTrip = savedTrips.find((t) => t.id === activeTripId) || savedTrips[0] || INITIAL_TOKYO_TRIP;

  const [activeTab, setActiveTab] = useState<ActiveTab>('itinerary');
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'edit' | 'switch' | 'create' | 'aiImport'>('edit');
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Save changes to localStorage & sync
  const handleUpdateTrip = (updatedTrip: Trip) => {
    const updatedList = savedTrips.map((t) => (t.id === updatedTrip.id ? updatedTrip : t));
    setSavedTrips(updatedList);
    saveTrips(updatedList);
  };

  const handleSelectTrip = (trip: Trip) => {
    setActiveTripIdState(trip.id);
    setActiveTripId(trip.id);
    setSelectedDayNumber(1);
  };

  const handleCreateNewTrip = (newTrip: Trip) => {
    const updatedList = [newTrip, ...savedTrips];
    setSavedTrips(updatedList);
    saveTrips(updatedList);
    setActiveTripIdState(newTrip.id);
    setActiveTripId(newTrip.id);
    setSelectedDayNumber(1);
  };

  const handleDeleteTrip = (tripId: string) => {
    // Cannot delete the last trip to avoid empty state issues (or we can create a new one automatically)
    let updatedList = savedTrips.filter(t => t.id !== tripId);
    
    if (updatedList.length === 0) {
      updatedList = [INITIAL_TOKYO_TRIP];
    }
    
    setSavedTrips(updatedList);
    saveTrips(updatedList);
    
    if (activeTripId === tripId) {
      setActiveTripIdState(updatedList[0].id);
      setActiveTripId(updatedList[0].id);
      setSelectedDayNumber(1);
    }
  };

  // PDF Export
  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true);
      await exportTripToPDF(currentTrip);
    } catch (e) {
      console.error('PDF export error:', e);
      alert('PDF 匯出發生錯誤，請稍後再試。');
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-neutral-50 dark:bg-neutral-950 overflow-hidden text-neutral-900 dark:text-white selection:bg-primary-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        trip={currentTrip}
        onUpdateTrip={handleUpdateTrip}
        savedTrips={savedTrips}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSettings={() => { setSettingsInitialTab('edit'); setIsSettingsOpen(true); }}
        onOpenAIImport={() => { setSettingsInitialTab('aiImport'); setIsSettingsOpen(true); }}
        onOpenVerification={() => setIsVerificationOpen(true)}
        onExportPDF={handleExportPDF}
        isExportingPDF={isExportingPDF}
        onSelectTrip={handleSelectTrip}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        themeColor={themeColor}
        setThemeColor={setThemeColor}
      />

      {/* Main Container */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-20 md:pb-0 relative">
        {/* Offline Banner */}
        {!isOnline && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/50 px-4 py-2.5 flex items-center justify-center gap-2 text-amber-700 dark:text-amber-400 text-sm font-medium sticky top-0 z-40">
            <WifiOff className="w-4 h-4 flex-shrink-0" />
            <span className="text-center">您目前處於離線狀態。天氣、匯率等功能無法同步更新，但仍可正常檢視與編輯行程。</span>
          </div>
        )}
        <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'itinerary' && (
            <ItineraryView
              trip={currentTrip}
              selectedDayNumber={selectedDayNumber}
              onSelectDay={setSelectedDayNumber}
              onUpdateTrip={handleUpdateTrip}
            />
          )}

          {activeTab === 'budget' && (
            <BudgetView
              trip={currentTrip}
              onUpdateTrip={handleUpdateTrip}
            />
          )}

          {activeTab === 'attractions' && (
            <AttractionsView
              trip={currentTrip}
              onUpdateTrip={handleUpdateTrip}
              onSelectDay={setSelectedDayNumber}
            />
          )}

          {activeTab === 'flights' && (
            <FlightTrackerView
              trip={currentTrip}
              onUpdateTrip={handleUpdateTrip}
            />
          )}

          {activeTab === 'checklist' && (
            <ChecklistView
              trip={currentTrip}
              onUpdateTrip={handleUpdateTrip}
            />
          )}
        </div>
      </main>

      {/* Floating AI Assistant Trigger (moved slightly up on mobile to avoid bottom nav overlap) */}

      {/* Modals */}

      <TripSettingsModal
        initialTab={settingsInitialTab}
        trip={currentTrip}
        savedTrips={savedTrips}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSelectTrip={handleSelectTrip}
        onUpdateTrip={handleUpdateTrip}
        onCreateNewTrip={handleCreateNewTrip}
        onDeleteTrip={handleDeleteTrip}
      />

      <VerificationModal
        isOpen={isVerificationOpen}
        onClose={() => setIsVerificationOpen(false)}
        trip={currentTrip}
        onUpdateTrip={handleUpdateTrip}
      />

    
      <ConfirmModal
        isOpen={!!deleteConfirmId}
        title="刪除旅程"
        message="確定要刪除這個旅程嗎？此操作無法復原，所有相關的景點、行程與記帳都會被永久刪除。"
        onConfirm={() => {
          if (deleteConfirmId) {
            handleDeleteTrip(deleteConfirmId);
            setDeleteConfirmId(null);
          }
        }}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}