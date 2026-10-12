import React, { useState } from 'react';
import { useOffline } from '../hooks/useOffline';
import { Trip } from '../types';
import { ThemeColor } from '../hooks/useTheme';
import { 
  Compass, 
  Calendar, 
  Map, 
  Wallet, 
  Bookmark, 
  Plane, 
  Users, 
  FileDown, 
  Wifi, 
  WifiOff, 
  Settings,
  Plus,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Edit3,
  Moon,
  Sun,
  Palette,
  Upload,
  Download,
  ShieldCheck
} from 'lucide-react';

import { exportAllData, importAllData } from '../services/importExport';

export type ActiveTab = 'itinerary' | 'budget' | 'attractions' | 'flights' | 'checklist';

interface SidebarProps {
  onUpdateTrip: (updated: Trip) => void;
  trip: Trip;
  savedTrips?: Trip[];
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenSettings: () => void;
  onOpenAIImport: () => void;
  onOpenVerification?: () => void;
  onExportPDF: () => void;
  isExportingPDF: boolean;
  onSelectTrip?: (trip: Trip) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onUpdateTrip,
  trip,
  savedTrips = [],
  activeTab,
  onTabChange,
  onOpenSettings,
  onOpenAIImport,
  onOpenVerification,
  onExportPDF,
  isExportingPDF,
  onSelectTrip,
  isDarkMode,
  toggleDarkMode,
  themeColor,
  setThemeColor
}) => {
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const isOffline = useOffline();
  const [showTripMenu, setShowTripMenu] = useState(false);
  
  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'itinerary', label: '行程時程', icon: <Calendar className="w-5 h-5" /> },
    { id: 'budget', label: '預算匯率', icon: <Wallet className="w-5 h-5" /> },
    { id: 'attractions', label: '景點口袋', icon: <Bookmark className="w-5 h-5" />, badge: `${trip.attractions.length}` },
    { id: 'flights', label: '機票航班', icon: <Plane className="w-5 h-5" />, badge: `${trip.flights.length}` },
    { id: 'checklist', label: '出國清單', icon: <Map className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-full bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-700">
        {/* Brand & Trip Selector */}
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 space-y-4">
          <div className="flex items-center gap-2 text-primary-600 font-black text-lg">
            <Compass className="w-6 h-6" />
            <span>Wanderlust</span>
            {isOffline && (
              <div className="ml-auto px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center gap-1 shadow-sm">
                <WifiOff className="w-3 h-3" />
                <span>離線模式</span>
              </div>
            )}
          </div>

          <div className="relative z-30">
            <div 
              className="bg-neutral-50 dark:bg-neutral-950 rounded-2xl p-3 border border-neutral-200 dark:border-neutral-700 relative group cursor-pointer hover:border-primary-300 transition-colors"
              onClick={() => setShowTripMenu(!showTripMenu)}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="text-[10px] font-bold text-neutral-400 dark:text-neutral-600 uppercase tracking-wide">目前行程</div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showTripMenu ? 'text-primary-600 rotate-180' : 'text-neutral-400 dark:text-neutral-600 group-hover:text-primary-600'}`} />
              </div>

              <div className="flex items-start justify-between relative">
              <div className="min-w-0 pr-2">
                <h2 className="font-bold text-neutral-900 dark:text-white text-sm leading-tight truncate">
                  {trip.title || <span className="text-neutral-400 font-normal">尚未命名行程</span>}
                </h2>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-500 truncate mt-0.5">
                  {trip.startDate.substring(5)} ~ {trip.endDate.substring(5)}
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSettings();
                }}
                title="編輯此行程"
                className="p-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-lg hover:text-primary-600 hover:border-primary-300 transition-all shadow-sm flex-shrink-0 z-20 relative"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

          {/* Custom Trip Dropdown Menu */}
          {showTripMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowTripMenu(false)} />
              <div className="absolute top-[calc(100%+0.5rem)] left-0 right-0 z-50 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl shadow-neutral-200/50 dark:shadow-neutral-900/50 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-3 pb-2 mb-2 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">選擇其他行程</div>
                </div>
                <div className="max-h-[40vh] overflow-y-auto scrollbar-thin">
                  {savedTrips.map(t => (
                    <button
                      key={t.id}
                      onClick={() => {
                        if (onSelectTrip) onSelectTrip(t);
                        setShowTripMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 flex flex-col gap-0.5 transition-colors ${t.id === trip.id ? 'bg-primary-50 dark:bg-primary-900/30' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}
                    >
                      <div className={`text-sm font-bold truncate ${t.id === trip.id ? 'text-primary-700 dark:text-primary-400' : 'text-neutral-700 dark:text-neutral-300'}`}>
                        {t.title || '尚未命名行程'}
                      </div>
                      <div className="text-[11px] text-neutral-400 dark:text-neutral-500">
                        {t.startDate.substring(5)} ~ {t.endDate.substring(5)}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="px-2 pt-2 mt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <button
                    onClick={() => {
                      setShowTripMenu(false);
                      onOpenSettings();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800/50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg text-xs font-bold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    管理與新增行程
                  </button>
                </div>
              </div>
            </>
          )}
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-neutral-900 text-white shadow-md shadow-neutral-900/10'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 dark:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white dark:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-primary-400' : 'text-neutral-400 dark:text-neutral-600'}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </div>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                      isActive ? 'bg-white/20 dark:bg-neutral-900/20 text-white' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Tools */}
        <div className="p-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
          <div className="text-[10px] font-bold text-neutral-400 dark:text-neutral-600 uppercase tracking-wide px-3 mb-1">工具與設定</div>
          
          <div className="flex items-center gap-1 px-1 mb-2">
            <button
              onClick={toggleDarkMode}
              className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all"
              title="切換深淺色"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="relative flex-1">
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all"
                title="切換主題色"
              >
                <Palette className="w-4 h-4" />
              </button>
              {showThemeMenu && (
                <div className="absolute bottom-full left-0 mb-2 p-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg flex gap-2 z-50">
                  {(['teal', 'rose', 'amber', 'indigo', 'emerald', 'sky', 'violet', 'fuchsia'] as ThemeColor[]).map((color) => (
                    <button
                      key={color}
                      onClick={() => { setThemeColor(color); setShowThemeMenu(false); }}
                      className={`w-5 h-5 rounded-full border-2 transition-all ${themeColor === color ? 'border-neutral-900 dark:border-white scale-110' : 'border-transparent hover:scale-110'}`}
                      style={{ 
                        backgroundColor: color === 'teal' ? '#14b8a6' : 
                                         color === 'rose' ? '#f43f5e' : 
                                         color === 'amber' ? '#f59e0b' : 
                                         color === 'indigo' ? '#6366f1' :
                                         color === 'emerald' ? '#10b981' :
                                         color === 'sky' ? '#0ea5e9' :
                                         color === 'violet' ? '#8b5cf6' : '#d946ef'
                      }}
                      title={color}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>



          <div className="flex items-center gap-1 px-1 mb-2">
            <button
              onClick={onOpenAIImport}
              className="flex-1 flex items-center justify-center gap-2 py-2 text-[11px] font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all"
              title="AI 匯入行程"
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI 匯入
            </button>
            <button
              onClick={() => exportAllData()}
              className="flex-1 flex items-center justify-center gap-2 py-2 text-[11px] font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all"
              title="備份所有資料"
            >
              <Download className="w-3.5 h-3.5" />
              備份
            </button>
            <div className="relative flex-1">
              <input
                type="file"
                accept=".json"
                id="import-backup"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const success = importAllData(event.target?.result as string);
                      if (success) {
                        alert('資料匯入成功，即將重新載入！');
                        window.location.reload();
                      } else {
                        alert('資料匯入失敗，請確認檔案格式是否正確。');
                      }
                    };
                    reader.readAsText(file);
                  }
                  e.target.value = '';
                }}
              />
              <label
                htmlFor="import-backup"
                className="w-full flex items-center justify-center gap-2 py-2 text-[11px] font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all cursor-pointer"
                title="還原備份資料"
              >
                <Upload className="w-3.5 h-3.5" />
                還原
              </label>
            </div>
          </div>

          <button
            onClick={onExportPDF}
            disabled={isExportingPDF}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-primary-700 hover:bg-primary-50 rounded-xl transition-all"
          >
            {isExportingPDF ? (
              <span className="inline-block w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <FileDown className="w-4 h-4 text-primary-600" />
            )}
            <span>{isExportingPDF ? '正在生成 PDF...' : '匯出行程手冊 (PDF)'}</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 dark:bg-neutral-800 rounded-xl transition-all"
          >
            <Settings className="w-4 h-4 text-neutral-400 dark:text-neutral-600" />
            <span>所有旅程管理</span>
          </button>

          {onOpenVerification && (
            <button
              onClick={onOpenVerification}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-xl transition-all border border-emerald-200/60 dark:border-emerald-800/50 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>系統驗證與邏輯檢測</span>
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 w-full flex-shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-2 text-primary-600 font-black text-lg flex-shrink-0">
          <Compass className="w-6 h-6" />
        </div>
        {isOffline && (
          <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center gap-1 shadow-sm z-50">
            <WifiOff className="w-2.5 h-2.5" />
            <span>離線模式</span>
          </div>
        )}
        <div className="flex-1 px-2 min-w-0 flex justify-center relative">
          <button 
            className="flex items-center gap-1 max-w-full justify-center px-2 py-1 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            onClick={() => setShowTripMenu(!showTripMenu)}
          >
            <h1 className="font-bold text-neutral-900 dark:text-white text-sm truncate">{trip.title || '尚未命名行程'}</h1>
            <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${showTripMenu ? 'text-primary-600 rotate-180' : 'text-neutral-400 dark:text-neutral-600'}`} />
          </button>
          
          {/* Mobile Trip Dropdown Menu */}
          {showTripMenu && (
            <>
              <div className="fixed inset-0 z-40 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={() => setShowTripMenu(false)} />
              <div className="absolute top-[calc(100%+0.5rem)] left-1/2 -translate-x-1/2 w-64 max-w-[calc(100vw-2rem)] z-50 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl shadow-neutral-200/50 dark:shadow-neutral-900/50 overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-3 pb-2 mb-2 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide text-left">選擇其他行程</div>
                </div>
                <div className="max-h-[50vh] overflow-y-auto scrollbar-thin text-left">
                  {savedTrips.map(t => (
                    <button
                      key={t.id}
                      onClick={() => {
                        if (onSelectTrip) onSelectTrip(t);
                        setShowTripMenu(false);
                      }}
                      className={`w-full text-left px-4 py-3 flex flex-col gap-0.5 transition-colors ${t.id === trip.id ? 'bg-primary-50 dark:bg-primary-900/30' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}
                    >
                      <div className={`text-sm font-bold truncate ${t.id === trip.id ? 'text-primary-700 dark:text-primary-400' : 'text-neutral-700 dark:text-neutral-300'}`}>
                        {t.title || '尚未命名行程'}
                      </div>
                      <div className="text-[11px] text-neutral-400 dark:text-neutral-500">
                        {t.startDate.substring(5)} ~ {t.endDate.substring(5)}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="px-2 pt-2 mt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-1.5">
                  <button
                    onClick={() => {
                      setShowTripMenu(false);
                      onExportPDF();
                    }}
                    disabled={isExportingPDF}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400 rounded-lg text-[11px] font-bold transition-colors"
                  >
                    {isExportingPDF ? (
                      <span className="inline-block w-3.5 h-3.5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <FileDown className="w-3.5 h-3.5" />
                    )}
                    {isExportingPDF ? '正在生成 PDF...' : '匯出行程手冊 (PDF)'}
                  </button>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setShowTripMenu(false);
                        onOpenAIImport();
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      AI 匯入
                    </button>
                    <button
                      onClick={() => {
                        setShowTripMenu(false);
                        exportAllData();
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      備份
                    </button>
                    <div className="relative flex-1">
                      <input
                        type="file"
                        accept=".json"
                        id="import-backup-mobile"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const success = importAllData(event.target?.result as string);
                              if (success) {
                                alert('資料匯入成功，即將重新載入！');
                                window.location.reload();
                              } else {
                                alert('資料匯入失敗，請確認檔案格式是否正確。');
                              }
                            };
                            reader.readAsText(file);
                          }
                          e.target.value = '';
                          setShowTripMenu(false);
                        }}
                      />
                      <label
                        htmlFor="import-backup-mobile"
                        className="w-full flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        還原
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowTripMenu(false);
                      onOpenSettings();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800/50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm font-bold transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    管理與新增行程
                  </button>

                  {onOpenVerification && (
                    <button
                      onClick={() => {
                        setShowTripMenu(false);
                        onOpenVerification();
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      系統驗證與邏輯檢測
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={toggleDarkMode}
            className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            title="深淺色切換"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={onOpenSettings}
            className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            title="旅程設定與管理"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 z-40 pb-safe">
        <div className="flex items-center justify-around p-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center justify-center p-2 min-w-[64px] transition-all ${
                  isActive ? 'text-primary-600' : 'text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <div className={`p-1.5 rounded-xl ${isActive ? 'bg-primary-50' : ''}`}>
                  {tab.icon}
                </div>
                <span className={`text-[10px] mt-1 font-bold ${isActive ? 'text-primary-700' : ''}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
