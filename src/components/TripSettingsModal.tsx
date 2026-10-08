import React, { useState, useEffect } from 'react';
import { Trip } from '../types';
import { 
  Settings, 
  Plus, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Image as ImageIcon, 
  Compass,
  Check,
  Sparkles,
  Trash2, ChevronDown
} from 'lucide-react';
import { POPULAR_CURRENCIES } from '../services/storage';
import { AutocompleteInput } from './AutocompleteInput';
import { CurrencyDropdown } from './CurrencyDropdown';
import { CustomDatePicker } from './CustomDateTimePicker';
import { syncTripDatesAndDays, addDaysToDateStr } from '../services/itineraryUtils';

interface TripSettingsModalProps {
  initialTab?: 'edit' | 'switch' | 'create' | 'aiImport';
  trip: Trip;
  savedTrips: Trip[];
  isOpen: boolean;
  onClose: () => void;
  onSelectTrip: (trip: Trip) => void;
  onUpdateTrip: (updated: Trip) => void;
  onCreateNewTrip: (newTrip: Trip) => void;
  onDeleteTrip: (tripId: string) => void;
}

const TEMPLATE_PRESETS: Partial<Trip>[] = [
  {
    title: '京都與奈良古都漫遊 4 天 3 夜',
    days: [
        { id: `day-${Date.now()}-1`, dayNumber: 1, date: '2025-11-10', themeTitle: '抵達目的地與市區初訪', items: [] },
        { id: `day-${Date.now()}-2`, dayNumber: 2, date: '2025-11-11', themeTitle: '經典名勝與代表美食巡禮', items: [] },
        { id: `day-${Date.now()}-3`, dayNumber: 3, date: '2025-11-12', themeTitle: '深入在地生活與隱藏景點', items: [] },
        { id: `day-${Date.now()}-4`, dayNumber: 4, date: '2025-11-13', themeTitle: '最後採買與準備返程', items: [] }
    ],
    destination: '日本 京都 (Kyoto, Japan)',
    countryCode: 'JP',
    baseCurrency: 'TWD',
    targetCurrency: 'JPY',
    totalBudget: 60000,
    coverImage: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: '曼谷米其林美食與水療放鬆 5 天 4 夜',
    days: [
        { id: `day-${Date.now()}-1`, dayNumber: 1, date: '2025-11-10', themeTitle: '抵達目的地與市區初訪', items: [] },
        { id: `day-${Date.now()}-2`, dayNumber: 2, date: '2025-11-11', themeTitle: '經典名勝與代表美食巡禮', items: [] },
        { id: `day-${Date.now()}-3`, dayNumber: 3, date: '2025-11-12', themeTitle: '深入在地生活與隱藏景點', items: [] },
        { id: `day-${Date.now()}-4`, dayNumber: 4, date: '2025-11-13', themeTitle: '自由購物與文青街區散步', items: [] },
        { id: `day-${Date.now()}-5`, dayNumber: 5, date: '2025-11-14', themeTitle: '最後採買與準備返程', items: [] }
    ],
    destination: '泰國 曼谷 (Bangkok, Thailand)',
    countryCode: 'TH',
    baseCurrency: 'TWD',
    targetCurrency: 'THB',
    totalBudget: 45000,
    coverImage: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: '首爾弘大聖水洞時尚探索 5 天 4 夜',
    days: [
        { id: `day-${Date.now()}-1`, dayNumber: 1, date: '2025-11-10', themeTitle: '抵達目的地與市區初訪', items: [] },
        { id: `day-${Date.now()}-2`, dayNumber: 2, date: '2025-11-11', themeTitle: '經典名勝與代表美食巡禮', items: [] },
        { id: `day-${Date.now()}-3`, dayNumber: 3, date: '2025-11-12', themeTitle: '深入在地生活與隱藏景點', items: [] },
        { id: `day-${Date.now()}-4`, dayNumber: 4, date: '2025-11-13', themeTitle: '自由購物與文青街區散步', items: [] },
        { id: `day-${Date.now()}-5`, dayNumber: 5, date: '2025-11-14', themeTitle: '最後採買與準備返程', items: [] }
    ],
    destination: '韓國 首爾 (Seoul, Korea)',
    countryCode: 'KR',
    baseCurrency: 'TWD',
    targetCurrency: 'KRW',
    totalBudget: 55000,
    coverImage: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=1200&q=80',
  },
];

export const TripSettingsModal: React.FC<TripSettingsModalProps> = ({
  initialTab,
  trip,
  savedTrips,
  isOpen,
  onClose,
  onSelectTrip,
  onUpdateTrip,
  onCreateNewTrip,
  onDeleteTrip,
}) => {
  const [activeTab, setActiveTab] = useState<'edit' | 'switch' | 'create' | 'aiImport'>(initialTab || 'edit');
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || 'edit');
    }
  }, [isOpen, initialTab]);

  // Edit current trip state
  const [title, setTitle] = useState(trip.title);
  const [destination, setDestination] = useState(trip.destination);
  const [countryCode, setCountryCode] = useState(trip.countryCode || 'JP');
  const [startDate, setStartDate] = useState(trip.startDate);
  const [endDate, setEndDate] = useState(trip.endDate);
  const [totalBudget, setTotalBudget] = useState(trip.totalBudget);
  const [baseCurrency, setBaseCurrency] = useState(trip.baseCurrency);
  const [targetCurrency, setTargetCurrency] = useState(trip.targetCurrency);
  const [coverImage, setCoverImage] = useState(trip.coverImage);

  // AI Import state
  const [aiJsonStr, setAiJsonStr] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setTitle(trip.title);
    setDestination(trip.destination);
    setCountryCode(trip.countryCode || 'JP');
    setStartDate(trip.startDate);
    setEndDate(trip.endDate);
    setTotalBudget(trip.totalBudget);
    setBaseCurrency(trip.baseCurrency);
    setTargetCurrency(trip.targetCurrency);
    setCoverImage(trip.coverImage);
  }, [trip]);

  if (!isOpen) return null;

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const syncedTrip = syncTripDatesAndDays(
      {
        ...trip,
        title,
        destination,
        countryCode,
        totalBudget: Number(totalBudget),
        baseCurrency,
        targetCurrency,
        coverImage,
      },
      startDate,
      endDate,
      false
    );
    onUpdateTrip(syncedTrip);
    onClose();
  };

  const handleApplyPreset = (preset: Partial<Trip>) => {
    const presetDays = preset.days || [
      {
        id: `day-${Date.now()}-1`,
        dayNumber: 1,
        date: '2025-11-10',
        themeTitle: '抵達目的地與市區初訪',
        items: [],
      },
      {
        id: `day-${Date.now()}-2`,
        dayNumber: 2,
        date: '2025-11-11',
        themeTitle: '經典名勝與代表美食巡禮',
        items: [],
      },
      {
        id: `day-${Date.now()}-3`,
        dayNumber: 3,
        date: '2025-11-12',
        themeTitle: '私房巷弄探店與購物商圈',
        items: [],
      },
    ];
    const startStr = '2025-11-10';
    const endStr = addDaysToDateStr(startStr, presetDays.length - 1);

    const newTrip: Trip = syncTripDatesAndDays(
      {
        id: `trip-${Date.now()}`,
        title: preset.title !== undefined ? preset.title : '新旅程',
        destination: preset.destination !== undefined ? preset.destination : '',
        countryCode: preset.countryCode || 'JP',
        startDate: startStr,
        endDate: endStr,
        coverImage: preset.coverImage || 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
        baseCurrency: preset.baseCurrency || 'TWD',
        targetCurrency: preset.targetCurrency || 'JPY',
        totalBudget: preset.totalBudget || 50000,
        shareCode: `TRIP-${Math.floor(1000 + Math.random() * 9000)}`,
        offlineReady: false,
        collaborators: trip.collaborators,
        flights: [],
        attractions: [],
        expenses: [],
        days: presetDays.map((d, idx) => ({
          ...d,
          id: `day-${Date.now()}-${idx + 1}`,
          dayNumber: idx + 1,
        })),
      },
      startStr,
      endStr,
      true
    );

    onCreateNewTrip(newTrip);
    onClose();
  };

  const handleCreateBlankTrip = () => {
    handleApplyPreset({
      title: '',
      destination: '',
    });
  };

  const handleImportAIJson = () => {
    try {
      const parsed = JSON.parse(aiJsonStr);
      if (!parsed.title || !Array.isArray(parsed.days)) {
        alert('無效的行程格式，請確認包含 title 與 days 陣列。');
        return;
      }
      
      const newTrip: Trip = {
        id: `trip-${Date.now()}`,
        title: parsed.title,
        destination: parsed.destination || '未指定',
        countryCode: parsed.countryCode || 'JP',
        startDate: parsed.startDate || '2025-01-01',
        endDate: parsed.endDate || '2025-01-05',
        coverImage: parsed.coverImage || 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
        baseCurrency: parsed.baseCurrency || 'TWD',
        targetCurrency: parsed.targetCurrency || 'JPY',
        totalBudget: parsed.totalBudget || 50000,
        shareCode: `TRIP-${Math.floor(1000 + Math.random() * 9000)}`,
        offlineReady: false,
        collaborators: trip.collaborators, // keep current user
        flights: parsed.flights || [],
        attractions: parsed.attractions || [],
        expenses: parsed.expenses || [],
        days: parsed.days.map((d: any, i: number) => ({
          id: `day-${Date.now()}-${i}`,
          dayNumber: d.dayNumber || i + 1,
          date: d.date || `2025-01-0${i + 1}`,
          themeTitle: d.themeTitle || `第 ${i + 1} 天`,
          items: d.items?.map((item: any, j: number) => ({
            ...item,
            id: `item-${Date.now()}-${i}-${j}`
          })) || []
        })),
      };

      onCreateNewTrip(newTrip);
      setAiJsonStr('');
      onClose();
    } catch (err) {
      alert('JSON 解析失敗，請確認格式是否為正確的 JSON 格式。');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary-600" />
            <h3 className="font-bold text-neutral-900 dark:text-white text-base">行程設定與旅行庫管理</h3>
          </div>
          <button onClick={onClose} className="text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:text-neutral-400 font-bold">
            ✕
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-950/50 p-1 overflow-x-auto scrollbar-none whitespace-nowrap">
          <button
            onClick={() => setActiveTab('edit')}
            className={`px-3 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'edit' ? 'bg-white dark:bg-neutral-900 text-primary-600 shadow-sm' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white dark:text-white'
            }`}
          >
            目前行程
          </button>
          <button
            onClick={() => setActiveTab('switch')}
            className={`px-3 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'switch' ? 'bg-white dark:bg-neutral-900 text-primary-600 shadow-sm' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white dark:text-white'
            }`}
          >
            我的旅程 ({savedTrips.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-3 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'create' ? 'bg-white dark:bg-neutral-900 text-primary-600 shadow-sm' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white dark:text-white'
            }`}
          >
            探索預設範本
          </button>
          <button
            onClick={() => setActiveTab('aiImport')}
            className={`px-3 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'aiImport' ? 'bg-white dark:bg-neutral-900 text-primary-600 shadow-sm' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white dark:text-white'
            }`}
          >
            ✨ AI 匯入
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {activeTab === 'edit' && (
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">行程標題 *</label>
                <input
                  type="text"
                  
                  value={title}
                  placeholder="請輸入行程名稱"
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">目標國家 *</label>
                  <AutocompleteInput
                    value={countryCode}
                    onChange={(val) => setCountryCode(val)}
                    options={['日本 (Japan)', '韓國 (South Korea)', '泰國 (Thailand)', '台灣 (Taiwan)', '美國 (USA)', '英國 (UK)', '法國 (France)', '義大利 (Italy)', '澳洲 (Australia)']}
                    placeholder="輸入或選擇國家"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">目的地城市 *</label>
                  <AutocompleteInput
                    value={destination}
                    onChange={(val) => setDestination(val)}
                    options={
                      (countryCode.includes('JP') || countryCode.includes('日本') || countryCode.includes('Japan')) ? ['東京 (Tokyo)', '大阪 (Osaka)', '京都 (Kyoto)', '北海道 (Hokkaido)', '沖繩 (Okinawa)', '福岡 (Fukuoka)', '名古屋 (Nagoya)', '奈良 (Nara)', '橫濱 (Yokohama)', '神戶 (Kobe)', '仙台 (Sendai)'] :
                      (countryCode.includes('KR') || countryCode.includes('韓國') || countryCode.includes('Korea')) ? ['首爾 (Seoul)', '釜山 (Busan)', '濟州島 (Jeju)', '仁川 (Incheon)'] :
                      (countryCode.includes('TW') || countryCode.includes('台灣') || countryCode.includes('Taiwan')) ? ['台北 (Taipei)', '台中 (Taichung)', '高雄 (Kaohsiung)', '台南 (Tainan)', '花蓮 (Hualien)'] :
                      (countryCode.includes('TH') || countryCode.includes('泰國') || countryCode.includes('Thailand')) ? ['曼谷 (Bangkok)', '清邁 (Chiang Mai)', '普吉島 (Phuket)'] :
                      ['巴黎 (Paris)', '倫敦 (London)', '紐約 (New York)', '洛杉磯 (Los Angeles)', '雪梨 (Sydney)']
                    }
                    placeholder="請輸入或選擇城市"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-neutral-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">出發日期</label>
                  <CustomDatePicker
                    value={startDate}
                    onChange={(newStart) => {
                      setStartDate(newStart);
                      if (endDate < newStart) {
                        setEndDate(newStart);
                      }
                    }}
                    placeholder="選擇出發日期"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">結束日期</label>
                  <CustomDatePicker
                    value={endDate}
                    minDate={startDate}
                    onChange={(newEnd) => setEndDate(newEnd)}
                    placeholder="選擇結束日期"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">總預算</label>
                  <input
                    type="number"
                    value={totalBudget}
                    onChange={(e) => setTotalBudget(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">本國幣別 (Base)</label>
                  <CurrencyDropdown
                    value={baseCurrency}
                    onChange={setBaseCurrency}
                    variant="form"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">當地幣別 (Local)</label>
                  <CurrencyDropdown
                    value={targetCurrency}
                    onChange={setTargetCurrency}
                    variant="form"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">封面圖片網址</label>
                <input
                  type="url"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 dark:bg-neutral-800"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
                >
                  儲存修改
                </button>
              </div>
            </form>
          )}

          {activeTab === 'switch' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-neutral-700 dark:text-neutral-300">已儲存的旅行專案</h4>
                <button
                  onClick={handleCreateBlankTrip}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>建立全新空白行程</span>
                </button>
              </div>
              <div className="space-y-3">
                {savedTrips.map((st) => (
                <div
                  key={st.id}
                  onClick={() => {
                    onSelectTrip(st);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                    st.id === trip.id
                      ? 'bg-primary-50 border-primary-300 shadow-sm'
                      : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800 dark:bg-neutral-950'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img src={st.coverImage} alt={st.title} className="w-12 h-12 rounded-lg object-cover" />
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-white">{st.title}</h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-500">{st.destination} • {st.days.length} 天</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {st.id === trip.id && (
                      <span className="p-1 bg-primary-600 text-white rounded-full">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {confirmDeleteId === st.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTrip(st.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2 py-1 text-[10px] font-bold bg-red-500 text-white rounded shadow-sm hover:bg-red-600"
                        >
                          確定刪除
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(null);
                          }}
                          className="px-2 py-1 text-[10px] font-bold bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded hover:bg-neutral-300 dark:hover:bg-neutral-700"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(st.id);
                        }}
                        className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                        title="刪除旅程"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            </div>
          )}

          {activeTab === 'create' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-neutral-700 dark:text-neutral-300">選擇人氣海外行程範本建立</h4>
              {TEMPLATE_PRESETS.map((preset, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-primary-300 hover:shadow-md transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <img src={preset.coverImage} alt={preset.title} className="w-12 h-12 rounded-lg object-cover" />
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-white">{preset.title}</h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-500">{preset.destination}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleApplyPreset(preset)}
                    className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all whitespace-nowrap shadow-sm"
                  >
                    套用範本
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'aiImport' && (
            <div className="space-y-4">
              <div className="bg-primary-50/50 p-4 rounded-xl border border-primary-100 text-xs text-primary-900 space-y-2 leading-relaxed">
                <p className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-primary-600" />
                  <span>透過第三方 AI (如 ChatGPT, Claude) 匯入</span>
                </p>
                <p>您可以先與其他 AI 助手規劃行程，並要求對方嚴格輸出以下 JSON 結構，複製貼上即可一鍵匯入為新旅程：</p>
                <div className="relative group mt-2">
                  <pre className="p-3 bg-neutral-900 text-primary-300 rounded-lg overflow-x-auto text-[10px] font-mono leading-normal">
{`{
  "title": "我的 AI 規劃行程",
  "destination": "東京",
  "baseCurrency": "TWD",
  "targetCurrency": "JPY",
  "totalBudget": 50000,
  "flights": [
    {
      "id": "flight-1",
      "flightNumber": "BR192",
      "airline": "EVA Air",
      "departureCity": "台北 (Taipei)",
      "departureAirport": "TSA",
      "arrivalCity": "東京 (Tokyo)",
      "arrivalAirport": "HND",
      "departureTime": "07:30",
      "arrivalTime": "11:45"
    }
  ],
  "attractions": [
    {
      "id": "att-1",
      "title": "東京鐵塔",
      "address": "東京都港區芝公園4丁目2-8",
      "category": "sightseeing",
      "tags": ["夜景", "必去", "打卡"],
      "imageUrl": "https://images.unsplash.com/photo-1542931287-023b922fa89b",
      "isWishlist": true,
      "hours": "09:00 - 23:00",
      "notes": "記得提前買票"
    }
  ],
  "days": [
    {
      "dayNumber": 1,
      "themeTitle": "淺草文化之旅",
      "items": [
        {
          "title": "雷門",
          "time": "10:00",
          "category": "sightseeing"
        }
      ]
    }
  ]
}`}
                  </pre>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-2">貼上 AI 產生的 JSON</label>
                <textarea
                  rows={8}
                  placeholder="請在此貼上 JSON 程式碼..."
                  value={aiJsonStr}
                  onChange={(e) => setAiJsonStr(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl border border-neutral-300 dark:border-neutral-600 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 bg-neutral-50 dark:bg-neutral-950"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 dark:bg-neutral-800"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleImportAIJson}
                  disabled={!aiJsonStr.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white shadow-sm"
                >
                  確認匯入並建立
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
