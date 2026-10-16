import React, { useState } from 'react';
import { Trip, DayPlan, ItineraryItem, PlaceCategory, TransportOption } from '../types';
import { CustomDatePicker, CustomTimePicker } from './CustomDateTimePicker';
import { AutocompleteInput } from './AutocompleteInput';
import {
  syncTripDatesAndDays,
  updateDayDateAndCascade,
  addDayToTrip,
  removeDayFromTrip,
  moveItineraryItemOrder,
  getDurationMins,
  addMinsToTime,
  reorderDaysInTrip,
} from '../services/itineraryUtils';
import {  
  Plus, 
  Trash2, 
  Edit3, 
  MapPin, 
  Clock, 
  DollarSign, 
  ArrowDown, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  Navigation2,
  Calendar,
  Utensils,
  Camera,
  ShoppingBag,
  Hotel,
  Train,
  MoveUp,
  MoveDown,
  Sun,
  CloudSun,
  ChevronRight,
  Umbrella,
  ExternalLink,
  Link2,
  ChevronDown,
  Edit2,
  Search,
  GripVertical,
  ArrowLeftRight,
} from 'lucide-react';
import { formatMoney } from '../services/currency';
import { fetchTripWeather, getCachedTripWeather, TripWeatherData } from '../services/weather';
import { WeatherDetailModal, WeatherIcon } from './WeatherDetailModal';
import { MoveDayModal } from './MoveDayModal';
import { ConfirmModal } from './ConfirmModal';
import { GoogleRouteModal } from './GoogleRouteModal';
import { RoutePlace } from '../services/googleRouteService';
import { ReorderDaysModal } from './ReorderDaysModal';

interface ItineraryViewProps {
  trip: Trip;
  selectedDayNumber: number;
  onSelectDay: (dayNumber: number) => void;
  onUpdateTrip: (updated: Trip) => void;
}

export const ItineraryView: React.FC<ItineraryViewProps> = ({
  trip,
  selectedDayNumber,
  onSelectDay,
  onUpdateTrip,
}) => {
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmDayNumber, setDeleteConfirmDayNumber] = useState<number | null>(null);
  const [confirmDeleteItemId, setConfirmDeleteItemId] = useState<string | null>(null);
  const [confirmDeleteItemInModal, setConfirmDeleteItemInModal] = useState(false);
  const [editingThemeDayId, setEditingThemeDayId] = useState<string | null>(null);
  const [editingThemeTitle, setEditingThemeTitle] = useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [draggedDayIndex, setDraggedDayIndex] = useState<number | null>(null);
  const [dragOverDayIndex, setDragOverDayIndex] = useState<number | null>(null);
  const [isReorderDaysModalOpen, setIsReorderDaysModalOpen] = useState(false);

  // Form State
  const [itemTitle, setItemTitle] = useState('');
  const [itemTime, setItemTime] = useState('10:00');
  const [itemEndTime, setItemEndTime] = useState('12:00');
  const [itemLocation, setItemLocation] = useState('');
  const [itemCategory, setItemCategory] = useState<PlaceCategory>('sightseeing');
  const [itemCost, setItemCost] = useState<number | undefined>(undefined);
  const [itemNotes, setItemNotes] = useState('');
  const [itemNavigateUrl, setItemNavigateUrl] = useState('');
  const [itemReferenceLinks, setItemReferenceLinks] = useState<{label: string, url: string}[]>([]);
  const [transportOptions, setTransportOptions] = useState<TransportOption[]>([{
    mode: 'subway',
    durationMinutes: 15,
    routes: []
  }]);

  const activeDay = trip.days.find((d) => d.dayNumber === selectedDayNumber) || trip.days[0];
  const filteredItems = activeDay?.items.filter(item => 
    !searchQuery || 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (item.locationName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.notes || '').toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Weather state
  const [weatherData, setWeatherData] = useState<TripWeatherData | null>(() => getCachedTripWeather(trip.id, trip.destination));
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [showWeatherModal, setShowWeatherModal] = useState(false);

  // Move Day state
  const [itemToMove, setItemToMove] = useState<ItineraryItem | null>(null);

  // Google Route Modal state
  const [routeModalPair, setRouteModalPair] = useState<{
    from: RoutePlace;
    to: RoutePlace;
    fromItemId?: string;
    isForForm?: boolean;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? '' : prev));
    }, 3500);
  };

  const handleApplyGoogleRoute = (option: {
    mode: TransportOption['mode'];
    durationMinutes: number;
    distanceText?: string;
    routeUrl: string;
    label: string;
  }) => {
    if (!routeModalPair) return;

    if (routeModalPair.isForForm) {
      setTransportOptions([
        {
          mode: option.mode,
          durationMinutes: option.durationMinutes,
          distanceText: option.distanceText,
          routes: [{ label: option.label, url: option.routeUrl }],
        },
      ]);
      triggerToast(`已帶入 Google 推薦交通：${option.label} (約 ${option.durationMinutes} 分鐘)`);
      return;
    }

    if (!routeModalPair.fromItemId || !activeDay) return;

    const updatedDays = trip.days.map((day) => {
      if (day.id === activeDay.id) {
        const updatedItems = day.items.map((it) => {
          if (it.id === routeModalPair.fromItemId) {
            const newTransport: TransportOption = {
              mode: option.mode,
              durationMinutes: option.durationMinutes,
              distanceText: option.distanceText,
              routes: [{ label: option.label, url: option.routeUrl }],
            };
            return {
              ...it,
              transportToNext: newTransport,
              transportOptions: [newTransport],
            };
          }
          return it;
        });
        return { ...day, items: updatedItems };
      }
      return day;
    });

    onUpdateTrip({ ...trip, days: updatedDays });
    triggerToast(`已成功套用 Google 推薦交通方案 (${option.label})！`);
  };

  React.useEffect(() => {
    let isMounted = true;
    const cached = getCachedTripWeather(trip.id, trip.destination);
    if (cached) {
      setWeatherData(cached);
    }

    setIsLoadingWeather(true);
    fetchTripWeather(trip)
      .then((data) => {
        if (isMounted && data) {
          setWeatherData(data);
        }
      })
      .catch((e) => console.warn('Weather load error:', e))
      .finally(() => {
        if (isMounted) setIsLoadingWeather(false);
      });

    return () => {
      isMounted = false;
    };
  }, [trip.id, trip.destination]);

  const handleRefreshWeather = async () => {
    setIsLoadingWeather(true);
    try {
      const data = await fetchTripWeather(trip, true);
      if (data) {
        setWeatherData(data);
      }
    } finally {
      setIsLoadingWeather(false);
    }
  };

  const resetForm = () => {
    setItemTitle('');
    setItemTime('10:00');
    setItemEndTime('12:00');
    setItemLocation('');
    setItemCategory('sightseeing');
    setItemCost(undefined);
    setItemNotes('');
    setItemNavigateUrl('');
    setItemReferenceLinks([]);
    setTransportOptions([{ mode: 'subway', durationMinutes: 15, routes: [] }]);
    setEditingItem(null);
    setIsAddingItem(false);
    setConfirmDeleteItemInModal(false);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim()) return;

    const newItem: ItineraryItem = {
      id: editingItem ? editingItem.id : `item-${Date.now()}`,
      title: itemTitle.trim(),
      time: itemTime,
      endTime: itemEndTime || undefined,
      locationName: itemLocation.trim() || itemTitle.trim(),
      category: itemCategory,
      coords: editingItem?.coords || {
        lat: 35.6895 + (Math.random() - 0.5) * 0.05,
        lng: 139.6917 + (Math.random() - 0.5) * 0.05,
      },
      cost: itemCost,
      currency: trip.targetCurrency,
      notes: itemNotes.trim() || undefined,
      navigateUrl: itemNavigateUrl.trim() || undefined,
      referenceLinks: itemReferenceLinks.filter(u => u.url.trim() !== ''),
      completed: editingItem?.completed || false,
      transportOptions: transportOptions.map(opt => ({
        ...opt,
        routes: opt.routes?.filter(r => r.url.trim() !== '') || []
      })),
      transportToNext: transportOptions.length > 0 ? {
        mode: transportOptions[0].mode,
        durationMinutes: transportOptions[0].durationMinutes,
        routes: transportOptions[0].routes?.filter(r => r.url.trim() !== '') || [],
      } : undefined,
    };

    const updatedDays = trip.days.map((day) => {
      if (day.id === activeDay.id) {
        let updatedItems: ItineraryItem[];
        if (editingItem) {
          updatedItems = day.items.map((it) => (it.id === editingItem.id ? newItem : it));
        } else {
          updatedItems = [...day.items, newItem].sort((a, b) => a.time.localeCompare(b.time));
        }
        return { ...day, items: updatedItems };
      }
      return day;
    });

    onUpdateTrip({ ...trip, days: updatedDays });
    resetForm();
  };

  const handleDeleteItem = (itemId: string) => {
    const updatedDays = trip.days.map((day) => {
      if (day.id === activeDay.id) {
        return { ...day, items: day.items.filter((it) => it.id !== itemId) };
      }
      return day;
    });
    onUpdateTrip({ ...trip, days: updatedDays });
  };

  const handleToggleComplete = (itemId: string) => {
    const updatedDays = trip.days.map((day) => {
      if (day.id === activeDay.id) {
        return {
          ...day,
          items: day.items.map((it) => (it.id === itemId ? { ...it, completed: !it.completed } : it)),
        };
      }
      return day;
    });
    onUpdateTrip({ ...trip, days: updatedDays });
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    if (!activeDay) return;
    const updatedItems = moveItineraryItemOrder(activeDay.items, index, direction);
    const updatedDays = trip.days.map((d) => (d.id === activeDay.id ? { ...d, items: updatedItems } : d));
    onUpdateTrip({ ...trip, days: updatedDays });
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === targetIndex) return;
    if (!activeDay) return;

    const items = [...activeDay.items];
    const [movedItem] = items.splice(draggedItemIndex, 1);
    const duration = getDurationMins(movedItem.time, movedItem.endTime);

    let newStartTime = movedItem.time;
    if (targetIndex > 0) {
      newStartTime = items[targetIndex - 1].endTime || items[targetIndex - 1].time;
    } else if (items.length > 0) {
      newStartTime = "09:00";
    }

    movedItem.time = newStartTime;
    movedItem.endTime = addMinsToTime(newStartTime, duration);

    items.splice(targetIndex, 0, movedItem);
    items.sort((a, b) => a.time.localeCompare(b.time));

    const updatedDays = trip.days.map((d) => (d.id === activeDay.id ? { ...d, items } : d));
    onUpdateTrip({ ...trip, days: updatedDays });
    setDraggedItemIndex(null);
  };

  const handleDayDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', `day:${index}`);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedDayIndex(index);
  };

  const handleDayDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedDayIndex !== null && draggedDayIndex !== index) {
      setDragOverDayIndex(index);
    } else if (draggedItemIndex !== null) {
      setDragOverDayIndex(index);
    }
  };

  const handleDayDragLeave = () => {
    setDragOverDayIndex(null);
  };

  const handleDayDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDragOverDayIndex(null);

    // Scenario A: Dragging an itinerary item onto a Day pill!
    if (draggedItemIndex !== null && activeDay) {
      const targetDay = trip.days[targetIndex];
      if (targetDay && targetDay.dayNumber !== activeDay.dayNumber) {
        const itemToMove = activeDay.items[draggedItemIndex];
        if (itemToMove) {
          handleMoveToDay(itemToMove.id, targetDay.dayNumber);
          triggerToast(`✨ 已將「${itemToMove.title}」成功移至第 ${targetDay.dayNumber} 天！`);
        }
      }
      setDraggedItemIndex(null);
      return;
    }

    // Scenario B: Dragging a Day pill onto another Day pill (Reordering/Swapping days)
    if (draggedDayIndex !== null && draggedDayIndex !== targetIndex) {
      const sourceDay = trip.days[draggedDayIndex];
      const targetDay = trip.days[targetIndex];
      const updatedTrip = reorderDaysInTrip(trip, draggedDayIndex, targetIndex);
      onUpdateTrip(updatedTrip);
      onSelectDay(targetIndex + 1);
      triggerToast(`✨ 已將「第 ${sourceDay.dayNumber} 天」移動至「第 ${targetIndex + 1} 天」！`);
      setDraggedDayIndex(null);
    }
  };

  const handleDayDragEnd = () => {
    setDraggedDayIndex(null);
    setDragOverDayIndex(null);
  };

  const handleMoveToDay = (itemId: string, targetDayNumber: number) => {
    if (targetDayNumber === selectedDayNumber) return;

    let movedItem: ItineraryItem | null = null;
    const updatedDays = trip.days.map((day) => {
      if (day.dayNumber === selectedDayNumber) {
        const itemIdx = day.items.findIndex(i => i.id === itemId);
        if (itemIdx > -1) {
          movedItem = { ...day.items[itemIdx] };
          return { ...day, items: day.items.filter(i => i.id !== itemId) };
        }
      }
      return day;
    });

    if (movedItem) {
      const duration = getDurationMins(movedItem.time, movedItem.endTime);
      const targetDay = updatedDays.find(d => d.dayNumber === targetDayNumber);
      
      let newStartTime = '09:00';
      if (targetDay && targetDay.items.length > 0) {
        const lastItem = targetDay.items[targetDay.items.length - 1];
        newStartTime = lastItem.endTime || lastItem.time;
      }
      
      movedItem!.time = newStartTime;
      movedItem!.endTime = addMinsToTime(newStartTime, duration);

      const finalDays = updatedDays.map(day => {
        if (day.dayNumber === targetDayNumber) {
          return { ...day, items: [...day.items, movedItem!].sort((a, b) => a.time.localeCompare(b.time)) };
        }
        return day;
      });
      onUpdateTrip({ ...trip, days: finalDays });
    }
  };

  const handleAddNewDay = () => {
    const updatedTrip = addDayToTrip(trip);
    onUpdateTrip(updatedTrip);
    onSelectDay(updatedTrip.days.length);
  };

  const handleRemoveDay = (dayNumberToRemove: number) => {
    if (trip.days.length <= 1) return;
    const updatedTrip = removeDayFromTrip(trip, dayNumberToRemove);
    onUpdateTrip(updatedTrip);
    if (selectedDayNumber > updatedTrip.days.length) {
      onSelectDay(updatedTrip.days.length);
    }
  };

  const handleChangeStartDate = (newStartDate: string) => {
    const updatedTrip = syncTripDatesAndDays(trip, newStartDate, undefined, true);
    onUpdateTrip(updatedTrip);
  };

  const handleChangeActiveDayDate = (newDate: string) => {
    if (!activeDay) return;
    const updatedTrip = updateDayDateAndCascade(trip, activeDay.dayNumber, newDate);
    onUpdateTrip(updatedTrip);
  };

  const getCategoryIcon = (category: PlaceCategory) => {
    switch (category) {
      case 'food':
        return <Utensils className="w-3.5 h-3.5" />;
      case 'sightseeing':
        return <Camera className="w-3.5 h-3.5" />;
      case 'shopping':
        return <ShoppingBag className="w-3.5 h-3.5" />;
      case 'stay':
        return <Hotel className="w-3.5 h-3.5" />;
      case 'transport':
        return <Train className="w-3.5 h-3.5" />;
      default:
        return <MapPin className="w-3.5 h-3.5" />;
    }
  };

  const getCategoryBadgeClass = (category: PlaceCategory) => {
    switch (category) {
      case 'food':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'sightseeing':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'shopping':
        return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'stay':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'transport':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Day Selector Header & Tabs */}
      <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex flex-wrap items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">行程時程規劃 (Itinerary Timeline)</h2>
            <span className="px-2 py-0.5 bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 text-xs font-semibold rounded-full">
              共 {trip.days.length} 天 ({trip.startDate} ~ {trip.endDate})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 hidden lg:inline">目的地城市：</span>
              <div className="w-44 sm:w-48">
                <AutocompleteInput
                  value={trip.destination}
                  onChange={(newDest) => onUpdateTrip({ ...trip, destination: newDest })}
                  options={[
                    '東京 (Tokyo)',
                    '大阪 (Osaka)',
                    '京都 (Kyoto)',
                    '北海道 札幌 (Sapporo)',
                    '沖繩 (Okinawa)',
                    '福岡 (Fukuoka)',
                    '名古屋 (Nagoya)',
                    '奈良 (Nara)',
                    '橫濱 (Yokohama)',
                    '神戶 (Kobe)',
                    '仙台 (Sendai)',
                    '首爾 (Seoul)',
                    '釜山 (Busan)',
                    '濟州島 (Jeju)',
                    '曼谷 (Bangkok)',
                    '清邁 (Chiang Mai)',
                    '普吉島 (Phuket)',
                    '台北 (Taipei)',
                    '台中 (Taichung)',
                    '台南 (Tainan)',
                    '高雄 (Kaohsiung)',
                    '香港 (Hong Kong)',
                    '新加坡 (Singapore)',
                    '巴黎 (Paris)',
                    '倫敦 (London)',
                    '羅馬 (Rome)',
                    '紐約 (New York)',
                    '雪梨 (Sydney)'
                  ]}
                  placeholder="輸入或選擇旅遊城市..."
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 hidden lg:inline">出發日期：</span>
              <CustomDatePicker
                value={trip.startDate}
                onChange={handleChangeStartDate}
                placeholder="設定出發日"
              />
            </div>

            {trip.days.length > 1 && (
              <button
                type="button"
                onClick={() => setIsReorderDaysModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                title="開啟天數排序管理，支援拖曳排序與快速對調"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                <span>調整天數順序</span>
              </button>
            )}

            <button
              onClick={handleAddNewDay}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary-50 hover:bg-primary-100 dark:bg-primary-950/50 dark:hover:bg-primary-900/60 text-primary-700 dark:text-primary-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新增天數</span>
            </button>
          </div>
        </div>

        {/* Day Pills Bar */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
          {trip.days.map((day, index) => {
            const isSelected = selectedDayNumber === day.dayNumber;
            const dayForecast = weatherData?.daily.find((d) => d.date === day.date);
            const isDraggingThisDay = draggedDayIndex === index;
            const isTargetDay = dragOverDayIndex === index;
            const isItemDraggingOver = isTargetDay && draggedItemIndex !== null;

            return (
              <div
                key={day.id}
                draggable={trip.days.length > 1}
                onDragStart={(e) => handleDayDragStart(e, index)}
                onDragOver={(e) => handleDayDragOver(e, index)}
                onDragLeave={handleDayDragLeave}
                onDrop={(e) => handleDayDrop(e, index)}
                onDragEnd={handleDayDragEnd}
                className={`relative group/daypill flex-shrink-0 transition-all ${
                  isDraggingThisDay ? 'opacity-30 scale-95' : ''
                } ${isTargetDay ? 'scale-105 z-20' : ''}`}
              >
                <button
                  onClick={() => onSelectDay(day.dayNumber)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl border text-left transition-all ${
                    isItemDraggingOver
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-500 ring-2 ring-emerald-400 shadow-md animate-pulse'
                      : isTargetDay && draggedDayIndex !== null
                      ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-900 dark:text-primary-100 border-primary-500 ring-2 ring-primary-500 shadow-md'
                      : isSelected
                      ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-600/20'
                      : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-neutral-300 dark:border-neutral-600'
                  } ${trip.days.length > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
                >
                  {/* Drag Handle Affordance */}
                  {trip.days.length > 1 && (
                    <div
                      title="按住可拖曳對調天數順序"
                      className={`-ml-1 p-0.5 rounded transition-opacity ${
                        isSelected
                          ? 'text-white/70 hover:text-white'
                          : 'text-neutral-400 dark:text-neutral-500 hover:text-primary-600 dark:hover:text-primary-400'
                      }`}
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div>
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <span>Day {day.dayNumber}</span>
                      {dayForecast && (
                        <WeatherIcon type={dayForecast.iconType} className="w-3.5 h-3.5 flex-shrink-0" />
                      )}
                    </div>
                    <div className={`text-[11px] ${isSelected ? 'text-primary-100' : 'text-neutral-400 dark:text-neutral-500'}`}>
                      {day.date.substring(5)}
                      {dayForecast && ` • ${dayForecast.tempMax}°`}
                    </div>
                  </div>

                  {isItemDraggingOver ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-emerald-600 text-white animate-bounce shadow-xs">
                      放開移入
                    </span>
                  ) : isTargetDay && draggedDayIndex !== null ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-primary-600 text-white animate-bounce shadow-xs">
                      放開調換
                    </span>
                  ) : (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                      isSelected ? 'bg-white/20 dark:bg-neutral-900/20 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}>
                      {day.items.length} 點
                    </span>
                  )}
                </button>

                {trip.days.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmDayNumber(day.dayNumber);
                    }}
                    title={`刪除第 ${day.dayNumber} 天`}
                    className="opacity-0 group-hover/daypill:opacity-100 absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm hover:bg-rose-600 transition-all cursor-pointer z-10"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Drag Hint Bar */}
        {trip.days.length > 1 && (
          <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 mt-2 px-1">
            <span className="flex items-center gap-1.5">
              <GripVertical className="w-3 h-3 text-primary-500" />
              <span>
                💡 <strong>支援拖曳更換 Day：</strong>直接拖曳上方 Day 標籤可快速對調天數順序，或將下方景點卡片拖至 Day 標籤跨天搬移。
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Selected Day Theme & Weather Card */}
      {activeDay && (
        <div className="bg-gradient-to-r from-neutral-900 to-primary-950 text-white p-5 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-primary-300 text-xs font-semibold">
              <span className="font-bold text-white">Day {activeDay.dayNumber}</span>
              <span>•</span>
              <CustomDatePicker
                value={activeDay.date}
                onChange={handleChangeActiveDayDate}
                variant="badge"
              />
              <span>•</span>
              {(() => {
                const dayForecast = weatherData?.daily.find((d) => d.date === activeDay.date);
                if (dayForecast) {
                  return (
                    <button
                      type="button"
                      onClick={() => setShowWeatherModal(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 hover:bg-white/20 active:bg-white/25 rounded-lg text-xs font-semibold text-primary-200 hover:text-white transition-all cursor-pointer shadow-xs group"
                      title="點擊查看詳細 14 天天氣預報"
                    >
                      <WeatherIcon type={dayForecast.iconType} className="w-3.5 h-3.5" />
                      <span>{dayForecast.weatherText} {dayForecast.tempMin}~{dayForecast.tempMax}°C</span>
                      <span className="text-[11px] text-sky-200 flex items-center gap-0.5">
                        <Umbrella className="w-3 h-3" />
                        {dayForecast.precipProbability}%
                      </span>
                      <ChevronRight className="w-3 h-3 text-white/50 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    </button>
                  );
                }

                if (weatherData?.current) {
                  return (
                    <button
                      type="button"
                      onClick={() => setShowWeatherModal(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 hover:bg-white/20 active:bg-white/25 rounded-lg text-xs font-semibold text-primary-200 hover:text-white transition-all cursor-pointer shadow-xs group"
                      title="查看目的地即時氣象與 14 天預報"
                    >
                      <WeatherIcon type={weatherData.current.iconType} className="w-3.5 h-3.5" />
                      <span>{weatherData.cityName.split(' ')[0]}即時 {weatherData.current.temp}°C {weatherData.current.weatherText}</span>
                      <span className="text-[10px] text-primary-200 bg-white/15 px-1.5 py-0.5 rounded">即時</span>
                      <ChevronRight className="w-3 h-3 text-white/50 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    </button>
                  );
                }

                return (
                  <button
                    type="button"
                    onClick={() => setShowWeatherModal(true)}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold text-primary-200 hover:text-white transition-all cursor-pointer"
                  >
                    <Sun className={`w-3.5 h-3.5 text-amber-400 ${isLoadingWeather ? 'animate-spin' : ''}`} />
                    <span>{isLoadingWeather ? '載入氣象中...' : '查看即時氣象'}</span>
                  </button>
                );
              })()}
            </div>
            {editingThemeDayId === activeDay.id ? (
              <input
                ref={inputRef}
                type="text"
                value={editingThemeTitle}
                onChange={(e) => setEditingThemeTitle(e.target.value)}
                onBlur={() => {
                  const updatedDays = trip.days.map(d => d.id === activeDay.id ? { ...d, themeTitle: editingThemeTitle } : d);
                  onUpdateTrip({ ...trip, days: updatedDays });
                  setEditingThemeDayId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const updatedDays = trip.days.map(d => d.id === activeDay.id ? { ...d, themeTitle: editingThemeTitle } : d);
                    onUpdateTrip({ ...trip, days: updatedDays });
                    setEditingThemeDayId(null);
                  }
                  if (e.key === 'Escape') setEditingThemeDayId(null);
                }}
                className="text-lg font-bold text-white tracking-tight bg-white/20 border border-white/40 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-white/50 w-full max-w-sm"
                autoFocus
              />
            ) : (
              <h3 
                className="text-lg font-bold text-white tracking-tight cursor-pointer hover:bg-white/10 px-2 py-0.5 rounded-lg -ml-2 transition-colors flex items-center gap-2 group"
                onClick={() => {
                  setEditingThemeDayId(activeDay.id);
                  setEditingThemeTitle(activeDay.themeTitle);
                }}
              >
                {activeDay.themeTitle}
                <Edit2 className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddingItem(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>新增景點/活動</span>
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Item Modal */}
      {(isAddingItem || editingItem) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="p-5 bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
              <h4 className="font-bold text-neutral-900 dark:text-white text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-600" />
                <span>{editingItem ? '編輯行程項目' : '新增行程活動 / 景點'}</span>
              </h4>
              <button
                onClick={resetForm}
                className="text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:text-neutral-400 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  活動或景點名稱 *
                </label>
                <input
                  type="text"
                  
                  placeholder="例如：SHIBUYA SKY 展望台、築地生鮮午餐"
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-sm font-bold text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all hover:border-primary-400 dark:hover:border-primary-600 shadow-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    開始時間 *
                  </label>
                  <CustomTimePicker
                    value={itemTime}
                    onChange={(newTime) => {
                      setItemTime(newTime);
                      // Auto-adjust endTime if endTime is earlier than startTime
                      if (itemEndTime && newTime >= itemEndTime) {
                        setItemEndTime(addMinsToTime(newTime, 60));
                      }
                    }}
                    placeholder="選擇開始時間"
                    fineTuneOnly
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    結束時間
                  </label>
                  <CustomTimePicker
                    value={itemEndTime}
                    onChange={setItemEndTime}
                    isClearable
                    placeholder="未設定"
                    fineTuneOnly
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    分類類型
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'sightseeing', label: '🏛️ 觀光' },
                      { value: 'food', label: '🍜 美食' },
                      { value: 'shopping', label: '🛍️ 購物' },
                      { value: 'stay', label: '🏨 住宿' },
                      { value: 'transport', label: '🚆 交通' },
                      { value: 'entertainment', label: '🎡 娛樂' },
                      { value: 'other', label: '📌 其他' },
                    ].map(cat => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setItemCategory(cat.value as PlaceCategory)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          itemCategory === cat.value
                            ? 'bg-primary-50 dark:bg-primary-950 border-primary-500 text-primary-700 dark:text-primary-400 shadow-sm ring-1 ring-primary-500/20'
                            : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    預估花費 ({trip.targetCurrency})
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                      <DollarSign className="w-4 h-4 text-neutral-400 group-hover:text-primary-500 transition-colors" />
                    </div>
                    <input
                      type="number"
                      placeholder="0"
                      value={itemCost || ''}
                      onChange={(e) => setItemCost(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-sm font-bold text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all hover:border-primary-400 dark:hover:border-primary-600 shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  地點 / 地址
                </label>
                <input
                  type="text"
                  placeholder="例如：東京都渋谷区渋谷2-24-12"
                  value={itemLocation}
                  onChange={(e) => setItemLocation(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-sm font-bold text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all hover:border-primary-400 dark:hover:border-primary-600 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1">
                  <Navigation2 className="w-3.5 h-3.5" />
                  自訂導航網址 (選填)
                </label>
                <input
                  type="url"
                  placeholder="提供精確的 Google Maps 或其他導航網址"
                  value={itemNavigateUrl}
                  onChange={(e) => setItemNavigateUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-sm font-bold text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all hover:border-primary-400 dark:hover:border-primary-600 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1">
                  <Link2 className="w-3.5 h-3.5" />
                  攻略參考網址 (可加入多筆)
                </label>
                <div className="space-y-2">
                  {itemReferenceLinks.map((link, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="標籤 (例如: 餐廳官網)"
                        value={link.label}
                        onChange={(e) => {
                          const newLinks = [...itemReferenceLinks];
                          newLinks[i] = { ...newLinks[i], label: e.target.value };
                          setItemReferenceLinks(newLinks);
                        }}
                        className="w-1/3 px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-sm font-bold text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all hover:border-primary-400 dark:hover:border-primary-600 shadow-sm"
                      />
                      <input
                        type="url"
                        placeholder="https://..."
                        value={link.url}
                        onChange={(e) => {
                          const newLinks = [...itemReferenceLinks];
                          newLinks[i] = { ...newLinks[i], url: e.target.value };
                          setItemReferenceLinks(newLinks);
                        }}
                        className="w-2/3 px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-sm font-bold text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all hover:border-primary-400 dark:hover:border-primary-600 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newLinks = [...itemReferenceLinks];
                          newLinks.splice(i, 1);
                          setItemReferenceLinks(newLinks);
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setItemReferenceLinks([...itemReferenceLinks, { label: '', url: '' }])}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 dark:bg-primary-950/30 dark:hover:bg-primary-950/50 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    加入網址
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  備註與注意事項
                </label>
                <textarea
                  rows={2}
                  placeholder="例如：已事先訂票、門票憑證在信箱、禁止攜帶自拍棒"
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-sm font-bold text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all hover:border-primary-400 dark:hover:border-primary-600 shadow-sm"
                />
              </div>

              {/* Transport to next option */}
              <div className="p-3 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-4">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    抵達下一個點之交通方式
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        let nextDest: RoutePlace | null = null;
                        if (editingItem) {
                          const currIdx = activeDay.items.findIndex((it) => it.id === editingItem.id);
                          if (currIdx >= 0 && currIdx < activeDay.items.length - 1) {
                            nextDest = activeDay.items[currIdx + 1];
                          }
                        } else if (activeDay.items.length > 0) {
                          const afterItems = activeDay.items.filter((it) => it.time > itemTime);
                          if (afterItems.length > 0) {
                            nextDest = afterItems[0];
                          } else {
                            nextDest = activeDay.items[activeDay.items.length - 1];
                          }
                        }

                        if (nextDest) {
                          setRouteModalPair({
                            from: {
                              title: itemTitle || '目前景點',
                              locationName: itemLocation || itemTitle,
                              coords: editingItem?.coords,
                            },
                            to: nextDest,
                            isForForm: true,
                          });
                        } else if (activeDay.accommodation?.name) {
                          setRouteModalPair({
                            from: {
                              title: itemTitle || '目前景點',
                              locationName: itemLocation || itemTitle,
                              coords: editingItem?.coords,
                            },
                            to: {
                              title: activeDay.accommodation.name,
                              locationName: activeDay.accommodation.address,
                              coords: activeDay.accommodation.coords,
                            },
                            isForForm: true,
                          });
                        } else {
                          setRouteModalPair({
                            from: {
                              title: itemTitle || '目前景點',
                              locationName: itemLocation || itemTitle,
                            },
                            to: {
                              title: '下一站目的地',
                              locationName: trip.destination,
                            },
                            isForForm: true,
                          });
                        }
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 dark:text-blue-300 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 rounded-lg transition-colors border border-blue-200 dark:border-blue-800 cursor-pointer"
                      title="取得 Google 推薦的最佳路線與預估時間"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      Google 推薦路線
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransportOptions([...transportOptions, { mode: 'car', durationMinutes: 15, routes: [] }])}
                      className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 dark:bg-primary-950/30 dark:hover:bg-primary-950/50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      新增備選方案
                    </button>
                  </div>
                </div>

                {transportOptions.map((opt, optIndex) => (
                  <div key={optIndex} className="p-2 border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900 relative">
                    {transportOptions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newOpts = [...transportOptions];
                          newOpts.splice(optIndex, 1);
                          setTransportOptions(newOpts);
                        }}
                        className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg z-10"
                        title="移除此方案"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-8">
                      <select
                        value={opt.mode}
                        onChange={(e) => {
                          const newOpts = [...transportOptions];
                          newOpts[optIndex] = { ...newOpts[optIndex], mode: e.target.value as any };
                          setTransportOptions(newOpts);
                        }}
                        className="appearance-none px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs bg-white dark:bg-neutral-900 pr-8"
                      >
                        <option value="walk">🚶 步行 Walk</option>
                        <option value="subway">🚇 地鐵 Subway</option>
                        <option value="bus">🚌 公車 Bus</option>
                        <option value="taxi">🚕 計程車 Taxi</option>
                        <option value="bullet_train">🚄 新幹線 / 鐵路</option>
                        <option value="car">🚗 自駕 / 租車</option>
                      </select>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={opt.durationMinutes}
                          onChange={(e) => {
                            const newOpts = [...transportOptions];
                            newOpts[optIndex] = { ...newOpts[optIndex], durationMinutes: Number(e.target.value) };
                            setTransportOptions(newOpts);
                          }}
                          className="w-16 px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs bg-white dark:bg-neutral-900 text-center"
                        />
                        <span className="text-xs text-neutral-600 dark:text-neutral-400">分鐘</span>
                      </div>
                    </div>
                    
                    {/* Transport Routes */}
                    <div className="mt-3 space-y-2">
                      <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400">
                        交通方式詳情與導航網址 (可加入多筆)
                      </label>
                      {(opt.routes || []).map((route, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            type="text"
                            placeholder="例如: 停車場A、搭乘銀座線"
                            value={route.label}
                            onChange={(e) => {
                              const newOpts = [...transportOptions];
                              const newRoutes = [...(newOpts[optIndex].routes || [])];
                              newRoutes[i] = { ...newRoutes[i], label: e.target.value };
                              newOpts[optIndex] = { ...newOpts[optIndex], routes: newRoutes };
                              setTransportOptions(newOpts);
                            }}
                            className="w-1/3 px-2 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                          <input
                            type="url"
                            placeholder="Google Maps 路線或地點網址..."
                            value={route.url}
                            onChange={(e) => {
                              const newOpts = [...transportOptions];
                              const newRoutes = [...(newOpts[optIndex].routes || [])];
                              newRoutes[i] = { ...newRoutes[i], url: e.target.value };
                              newOpts[optIndex] = { ...newOpts[optIndex], routes: newRoutes };
                              setTransportOptions(newOpts);
                            }}
                            className="w-2/3 px-2 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newOpts = [...transportOptions];
                              const newRoutes = [...(newOpts[optIndex].routes || [])];
                              newRoutes.splice(i, 1);
                              newOpts[optIndex] = { ...newOpts[optIndex], routes: newRoutes };
                              setTransportOptions(newOpts);
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const newOpts = [...transportOptions];
                          newOpts[optIndex] = { ...newOpts[optIndex], routes: [...(newOpts[optIndex].routes || []), { label: '', url: '' }] };
                          setTransportOptions(newOpts);
                        }}
                        className="flex items-center gap-1 px-3 py-1 text-[11px] font-bold text-neutral-500 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        加入路線或地點網址
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <div>
                  {editingItem && (
                    confirmDeleteItemInModal ? (
                      <div className="flex items-center gap-1.5 animate-in fade-in">
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400">確定刪除此行程？</span>
                        <button
                          type="button"
                          onClick={() => {
                            handleDeleteItem(editingItem.id);
                            resetForm();
                            setToastMessage(`已刪除「${editingItem.title}」`);
                            setTimeout(() => setToastMessage(null), 3000);
                          }}
                          className="px-2.5 py-1 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
                        >
                          確定刪除
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteItemInModal(false)}
                          className="px-2 py-1 text-xs font-bold bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors cursor-pointer"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteItemInModal(true)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>刪除此行程</span>
                      </button>
                    )
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 dark:bg-neutral-800"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
                  >
                    儲存行程
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

            {/* Search Bar */}
      {activeDay && activeDay.items.length > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none z-10" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋行程名稱、地點或備註..."
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all shadow-sm"
          />
        </div>
      )}

      {/* Timeline Activities List */}
      <div className="space-y-4">
        {activeDay && activeDay.items.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-600 p-8">
            <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-neutral-800 dark:text-neutral-200">今天尚無任何排定行程</h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-500 max-w-sm mx-auto mt-1 mb-4">
              點擊「新增景點/活動」或從「景點紀錄清單」中一鍵匯入喜愛的名勝美食。
            </p>
            <button
              onClick={() => setIsAddingItem(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>立即加入第一個景點</span>
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-600 p-8">
            <div className="w-12 h-12 rounded-2xl bg-neutral-50 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">找不到符合搜尋的行程</h4>
            <p className="text-xs text-neutral-500 mt-1">請嘗試其他關鍵字，或清空搜尋欄</p>
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-neutral-200 dark:bg-neutral-700 space-y-6">
            {filteredItems.map((item) => {
              const index = activeDay.items.findIndex(i => i.id === item.id);
              return (
                <div key={item.id} className="relative group">
                  {/* Timeline bullet */}
                  <button
                    onClick={() => handleToggleComplete(item.id)}
                    title={item.completed ? '標記為未完成' : '標記為已完成'}
                    className={`absolute -left-6 sm:-left-8 top-3 w-6 h-6 rounded-full border-2 flex items-center justify-center bg-white dark:bg-neutral-900 transition-all ${
                      item.completed
                        ? 'border-emerald-500 text-emerald-500 bg-emerald-50'
                        : 'border-neutral-300 dark:border-neutral-600 text-neutral-400 dark:text-neutral-600 group-hover:border-primary-500 group-hover:text-primary-500'
                    }`}
                  >
                    {item.completed ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Circle className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Main Activity Card */}
                  <div 
                    draggable={!searchQuery}
                    onDragStart={() => setDraggedItemIndex(index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${!searchQuery ? 'cursor-grab active:cursor-grabbing' : ''} ${
                      draggedItemIndex === index ? 'opacity-50 border-primary-500 bg-primary-50 shadow-md' : ''
                    } ${
                      item.completed
                        ? 'bg-neutral-50/80 dark:bg-neutral-950/80 border-neutral-200 dark:border-neutral-700 opacity-75'
                        : 'bg-white dark:bg-neutral-900 border-neutral-200/90 dark:border-neutral-700/90 hover:border-neutral-300 dark:border-neutral-600 hover:shadow-md'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      {/* Left: Time & Badges */}
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.time} {item.endTime ? `~ ${item.endTime}` : ''}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${getCategoryBadgeClass(item.category)}`}>
                            {getCategoryIcon(item.category)}
                            <span className="capitalize">{item.category}</span>
                          </span>
                          {item.cost && item.cost > 0 && (
                            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md">
                              {formatMoney(item.cost, item.currency || trip.targetCurrency)}
                            </span>
                          )}
                        </div>

                        <h4 className={`text-base font-bold text-neutral-900 dark:text-white mt-1 ${item.completed ? 'line-through text-neutral-500 dark:text-neutral-500' : ''}`}>
                          {item.title}
                        </h4>

                        <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-500">
                          <MapPin className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-600" />
                          <span>{item.locationName}</span>
                        </div>

                        {/* Reference URLs */}
                        {((item.referenceLinks && item.referenceLinks.length > 0) || (item.referenceUrls && item.referenceUrls.length > 0)) && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {(item.referenceLinks || (item.referenceUrls ? item.referenceUrls.map((u, i) => ({ label: `攻略 ${i + 1}`, url: u })) : [])).map((link, i) => (
                              <a
                                key={i}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 bg-primary-50/50 hover:bg-primary-50 dark:bg-primary-950/30 dark:hover:bg-primary-950/50 px-2 py-1 rounded-md transition-colors truncate max-w-[200px]"
                                title={link.url}
                              >
                                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{link.label || `連結 ${i + 1}`}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 flex-wrap justify-end self-start">
                        <a
                          href={item.navigateUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.locationName || item.title)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={item.navigateUrl ? "開啟自訂導航網址" : "在 Google 地圖上查看"}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg text-xs font-bold transition-all"
                        >
                          <Navigation2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">導航</span>
                        </a>
                        
                        <button
                          type="button"
                          onClick={() => setItemToMove(item)}
                          title="移動到其他天"
                          className="flex items-center gap-1 px-2.5 py-1.5 text-neutral-600 dark:text-neutral-300 hover:text-primary-700 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-950/40 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                        >
                          <Calendar className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                          <span className="hidden sm:inline">移至別天</span>
                        </button>

                        <button
                          disabled={index === 0 || !!searchQuery}
                          onClick={() => handleMoveItem(index, 'up')}
                          title="往上移"
                          className="p-1.5 text-neutral-400 dark:text-neutral-600 hover:text-neutral-700 dark:hover:text-neutral-200 dark:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 dark:bg-neutral-800 disabled:opacity-25"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </button>

                        <button
                          disabled={index === activeDay.items.length - 1 || !!searchQuery}
                          onClick={() => handleMoveItem(index, 'down')}
                          title="往下移"
                          className="p-1.5 text-neutral-400 dark:text-neutral-600 hover:text-neutral-700 dark:hover:text-neutral-200 dark:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 dark:bg-neutral-800 disabled:opacity-25"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setItemTitle(item.title);
                            setItemTime(item.time);
                            setItemEndTime(item.endTime || '');
                            setItemLocation(item.locationName);
                            setItemCategory(item.category);
                            setItemCost(item.cost);
                            setItemNotes(item.notes || '');
                            setItemNavigateUrl(item.navigateUrl || '');
                            // Legacy fallback handling for referenceUrls -> referenceLinks
                            const links = item.referenceLinks || (item.referenceUrls ? item.referenceUrls.map((u, i) => ({ label: `攻略 ${i + 1}`, url: u })) : []);
                            setItemReferenceLinks(links);
                            
                            if (item.transportOptions && item.transportOptions.length > 0) {
                              setTransportOptions(item.transportOptions);
                            } else if (item.transportToNext) {
                              setTransportOptions([{
                                mode: item.transportToNext.mode,
                                durationMinutes: item.transportToNext.durationMinutes,
                                routes: item.transportToNext.routes || []
                              }]);
                            } else {
                              setTransportOptions([{ mode: 'subway', durationMinutes: 15, routes: [] }]);
                            }
                          }}
                          title="編輯"
                          className="p-1.5 text-neutral-400 dark:text-neutral-600 hover:text-neutral-700 dark:hover:text-neutral-200 dark:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 dark:bg-neutral-800"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {confirmDeleteItemId === item.id ? (
                          <div className="flex items-center gap-1 animate-in fade-in zoom-in-95">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteItem(item.id);
                                setConfirmDeleteItemId(null);
                                setToastMessage(`已刪除「${item.title}」`);
                                setTimeout(() => setToastMessage(null), 3000);
                              }}
                              className="px-2.5 py-1 text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
                              title="確認刪除此項目"
                            >
                              確定刪除
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteItemId(null);
                              }}
                              className="px-2 py-1 text-[10px] font-bold bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors cursor-pointer"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteItemId(item.id)}
                            title="刪除"
                            className="p-1.5 text-neutral-400 dark:text-neutral-600 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Notes block */}
                    {item.notes && (
                      <p className="mt-3 text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50/90 dark:bg-neutral-950/90 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 leading-relaxed">
                        {item.notes}
                      </p>
                    )}
                  </div>

                  {/* Inter-Item Transport Connector with Google Recommended Route */}
                  {index < activeDay.items.length - 1 && (() => {
                    const nextItem = activeDay.items[index + 1];
                    const currentTransports =
                      (item.transportOptions?.length
                        ? item.transportOptions
                        : item.transportToNext
                        ? [item.transportToNext]
                        : []);

                    return (
                      <div className="my-2.5 ml-4 flex flex-col gap-2">
                        <div className="flex items-center gap-2 flex-wrap text-xs font-medium">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-0.5 flex-shrink-0" />

                          {currentTransports.map((transport, tIdx) => (
                            <React.Fragment key={tIdx}>
                              {transport.routes && transport.routes.length > 0 ? (
                                transport.routes.map((route, i) => (
                                  <a
                                    key={i}
                                    href={route.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 px-2.5 py-1 rounded-full text-[11px] text-primary-700 dark:text-primary-400 flex items-center gap-1.5 border border-neutral-200 dark:border-neutral-700 transition-colors"
                                    title={route.url}
                                  >
                                    {transport.mode === 'subway' && '🚇'}
                                    {transport.mode === 'walk' && '🚶'}
                                    {transport.mode === 'bus' && '🚌'}
                                    {transport.mode === 'taxi' && '🚕'}
                                    {transport.mode === 'bullet_train' && '🚄'}
                                    {transport.mode === 'car' && '🚗'}
                                    <span className="font-bold">{route.label || '路線指引'}</span>
                                    <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-70" />
                                  </a>
                                ))
                              ) : (
                                <span className="bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-full text-[11px] text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5 border border-neutral-200 dark:border-neutral-700">
                                  {transport.mode === 'subway' && '🚇 地鐵轉乘'}
                                  {transport.mode === 'walk' && '🚶 步行'}
                                  {transport.mode === 'bus' && '🚌 公車'}
                                  {transport.mode === 'taxi' && '🚕 計程車'}
                                  {transport.mode === 'bullet_train' && '🚄 特急鐵路'}
                                  {transport.mode === 'car' && '🚗 自駕 / 租車'}
                                  <span>約 {transport.durationMinutes} 分鐘</span>
                                  {transport.distanceText && (
                                    <span className="text-neutral-400 dark:text-neutral-600">({transport.distanceText})</span>
                                  )}
                                </span>
                              )}
                            </React.Fragment>
                          ))}

                          {/* Google 推薦路線 Action Button */}
                          <button
                            type="button"
                            onClick={() =>
                              setRouteModalPair({
                                from: item,
                                to: nextItem,
                                fromItemId: item.id,
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-all shadow-2xs cursor-pointer group"
                            title={`查看從「${item.locationName || item.title}」前往「${nextItem.locationName || nextItem.title}」的 Google 推薦路線與即時班次`}
                          >
                            <Sparkles className="w-3 h-3 text-amber-500 group-hover:rotate-12 transition-transform" />
                            <span>Google 推薦路線</span>
                            <ChevronRight className="w-3 h-3 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Weather Detail Modal */}
      <WeatherDetailModal
        isOpen={showWeatherModal}
        onClose={() => setShowWeatherModal(false)}
        weatherData={weatherData}
        isLoading={isLoadingWeather}
        onRefresh={handleRefreshWeather}
        selectedDate={activeDay?.date}
      />

      {/* Move Day Modal */}
      <MoveDayModal
        isOpen={Boolean(itemToMove)}
        onClose={() => setItemToMove(null)}
        item={itemToMove}
        currentDayNumber={selectedDayNumber}
        days={trip.days}
        onSelectDay={(targetDayNumber) => {
          if (itemToMove) {
            handleMoveToDay(itemToMove.id, targetDayNumber);
            setItemToMove(null);
          }
        }}
      />
    
      {/* Confirm Delete Day Modal */}
      <ConfirmModal
        isOpen={deleteConfirmDayNumber !== null}
        title="確認刪除天數"
        message={
          deleteConfirmDayNumber !== null
            ? `確定要刪除「第 ${deleteConfirmDayNumber} 天 (${trip.days.find(d => d.dayNumber === deleteConfirmDayNumber)?.date || ''})」嗎？當天包含的 ${trip.days.find(d => d.dayNumber === deleteConfirmDayNumber)?.items.length || 0} 個行程項目與交通設定都將被刪除，此操作無法復原。`
            : ''
        }
        onConfirm={() => {
          if (deleteConfirmDayNumber !== null) {
            handleRemoveDay(deleteConfirmDayNumber);
            setDeleteConfirmDayNumber(null);
            triggerToast(`已刪除第 ${deleteConfirmDayNumber} 天`);
          }
        }}
        onCancel={() => setDeleteConfirmDayNumber(null)}
      />

      {/* Confirm Delete Item Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmId}
        title="確認刪除行程項目"
        message={(() => {
          const targetItem = activeDay?.items.find(it => it.id === deleteConfirmId);
          return targetItem
            ? `確定要刪除「${targetItem.title}」(${targetItem.time}) 嗎？此操作無法復原。`
            : '您確定要刪除此項目嗎？此操作無法復原。';
        })()}
        onConfirm={() => {
          if (deleteConfirmId) {
            handleDeleteItem(deleteConfirmId);
            setDeleteConfirmId(null);
            triggerToast('已刪除行程項目');
          }
        }}
        onCancel={() => setDeleteConfirmId(null)}
      />

      {/* Google Route Modal */}
      {routeModalPair && (
        <GoogleRouteModal
          isOpen={Boolean(routeModalPair)}
          onClose={() => setRouteModalPair(null)}
          fromItem={routeModalPair.from}
          toItem={routeModalPair.to}
          destinationCity={trip.destination}
          onApplyRoute={handleApplyGoogleRoute}
        />
      )}

      {/* Reorder Days Modal */}
      <ReorderDaysModal
        isOpen={isReorderDaysModalOpen}
        onClose={() => setIsReorderDaysModalOpen(false)}
        trip={trip}
        onSaveTrip={(updated) => {
          onUpdateTrip(updated);
          triggerToast('✨ 行程天數順序已成功更新！');
        }}
        onSelectDay={onSelectDay}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900/95 dark:bg-neutral-800 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 border border-neutral-700/50 backdrop-blur-xs animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};