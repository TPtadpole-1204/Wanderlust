import React, { useState } from 'react';
import { Trip, AttractionBookmark, PlaceCategory, ItineraryItem } from '../types';
import {  
  Bookmark, 
  Plus, 
  Search, 
  Star, 
  Clock, 
  MapPin, 
  DollarSign, 
  Heart, 
  CalendarPlus, 
  Tag, 
  ExternalLink,
  Trash2,
  Edit2,
  Check,
  ChevronDown,
  Link2,
  Sparkles,
  Loader2
} from 'lucide-react';
import { formatMoney } from '../services/currency';
import { ConfirmModal } from './ConfirmModal';
import { CustomTimePicker } from './CustomDateTimePicker';
import { addMinsToTime } from '../services/itineraryUtils';
import { parseGoogleMapsInput, resolveAndEnrichGoogleMapsInput } from '../services/googleMapsParser';

interface AttractionsViewProps {
  trip: Trip;
  onUpdateTrip: (updated: Trip) => void;
  onSelectDay: (dayNumber: number) => void;
}

export const AttractionsView: React.FC<AttractionsViewProps> = ({
  trip,
  onUpdateTrip,
  onSelectDay,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddingAttraction, setIsAddingAttraction] = useState(false);
  const [editingAttractionId, setEditingAttractionId] = useState<string | null>(null);
  const [addingToDayModal, setAddingToDayModal] = useState<AttractionBookmark | null>(null);
  const [targetDayNumber, setTargetDayNumber] = useState<number>(1);
  const [targetTime, setTargetTime] = useState('14:00');
  const [toastMessage, setToastMessage] = useState('');

  // New Attraction Form
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<PlaceCategory>('sightseeing');
  const [newCity, setNewCity] = useState(trip.destination.split(' ')[0] || '東京');
  const [newAddress, setNewAddress] = useState('');
  const [newCoords, setNewCoords] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [newGoogleMapsUrl, setNewGoogleMapsUrl] = useState('');
  const [newRating, setNewRating] = useState(4.8);
  const [newHours, setNewHours] = useState('');
  const [newCost, setNewCost] = useState<number | undefined>(undefined);
  const [newNotes, setNewNotes] = useState('');
  const [newImage, setNewImage] = useState('');
  const [newTags, setNewTags] = useState('');

  // Google Maps URL Quick Import state
  const [gmapQuickInput, setGmapQuickInput] = useState('');
  const [isParsingGmap, setIsParsingGmap] = useState(false);
  const [showGmapImportBox, setShowGmapImportBox] = useState(false);
  const [modalGmapInput, setModalGmapInput] = useState('');
  const [isParsingModalGmap, setIsParsingModalGmap] = useState(false);
  const [modalParseFeedback, setModalParseFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filteredAttractions = trip.attractions.filter((att) => {
    const matchesSearch =
      att.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      att.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      att.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'all'
        ? true
        : selectedCategory === 'wishlist'
        ? att.isWishlist
        : selectedCategory.startsWith('tag:')
        ? att.tags.includes(selectedCategory.replace('tag:', ''))
        : att.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleToggleWishlist = (id: string) => {
    const updated = trip.attractions.map((a) => (a.id === id ? { ...a, isWishlist: !a.isWishlist } : a));
    onUpdateTrip({ ...trip, attractions: updated });
  };

  const handleDeleteAttraction = (id: string) => {
    const updated = trip.attractions.filter((a) => a.id !== id);
    onUpdateTrip({ ...trip, attractions: updated });
  };

  const handleQuickImportGoogleMaps = async (directSave: boolean) => {
    if (!gmapQuickInput.trim()) return;
    setIsParsingGmap(true);
    const defaultCity = trip.destination.split(' ')[0] || '東京';
    try {
      const parsed = await resolveAndEnrichGoogleMapsInput(gmapQuickInput, defaultCity);
      if (directSave && parsed.title && !parsed.title.startsWith('Google 地圖標記')) {
        const newAtt: AttractionBookmark = {
          id: `att-${Date.now()}`,
          title: parsed.title,
          category: parsed.category,
          city: parsed.city || defaultCity,
          address: parsed.address || parsed.title,
          coords: parsed.coords || {
            lat: 35.6895 + (Math.random() - 0.5) * 0.04,
            lng: 139.6917 + (Math.random() - 0.5) * 0.04,
          },
          rating: parsed.rating ?? 4.5,
          openingHours: parsed.openingHours,
          notes: parsed.coords
            ? `由 Google 地圖匯入 (座標: ${parsed.coords.lat.toFixed(5)}, ${parsed.coords.lng.toFixed(5)}${parsed.reviewCount ? ` · ${parsed.reviewCount} 則評論` : ''})`
            : '由 Google 地圖連結匯入',
          imageUrl: parsed.imageUrl || '',
          tags: parsed.tags.length > 0 ? parsed.tags : ['Google地圖匯入'],
          isWishlist: true,
          googleMapsUrl: parsed.resolvedUrl || parsed.originalUrl,
        };
        onUpdateTrip({ ...trip, attractions: [newAtt, ...trip.attractions] });
        setToastMessage(`已從 Google 地圖直接匯入「${newAtt.title}」（★ ${newAtt.rating.toFixed(1)}）！`);
        setTimeout(() => setToastMessage(''), 3500);
        setGmapQuickInput('');
        setShowGmapImportBox(false);
      } else {
        // Open pre-filled modal for user review/customizing
        setEditingAttractionId(null);
        setNewTitle(parsed.title);
        setNewCategory(parsed.category);
        setNewCity(parsed.city || defaultCity);
        setNewAddress(parsed.address || parsed.title);
        setNewCoords(parsed.coords);
        setNewGoogleMapsUrl(parsed.resolvedUrl || parsed.originalUrl);
        setNewRating(parsed.rating ?? 4.5);
        setNewHours(parsed.openingHours || '');
        setNewCost(undefined);
        setNewNotes(
          parsed.coords
            ? `由 Google 地圖匯入 (座標: ${parsed.coords.lat.toFixed(5)}, ${parsed.coords.lng.toFixed(5)}${parsed.reviewCount ? ` · ${parsed.reviewCount} 則評論` : ''})`
            : '由 Google 地圖連結匯入'
        );
        setNewImage(parsed.imageUrl || '');
        setNewTags(parsed.tags.join(', '));
        setModalGmapInput(gmapQuickInput);
        setModalParseFeedback(
          parsed.title
            ? {
                type: 'success',
                text: `已成功解析「${parsed.title}」${parsed.rating ? `（★ ${parsed.rating.toFixed(1)}）` : ''}的地點與座標資訊`,
              }
            : { type: 'error', text: '未能從短網址直接讀取名稱，請手動補充名稱或貼上手機分享完整文字' }
        );
        setIsAddingAttraction(true);
        setGmapQuickInput('');
        setShowGmapImportBox(false);
      }
    } catch (err: any) {
      setToastMessage(err?.message || '無法解析此 Google 地圖網址，請確認連結格式或改用分享文字貼上');
      setTimeout(() => setToastMessage(''), 3500);
    } finally {
      setIsParsingGmap(false);
    }
  };

  const handleModalParseGoogleMaps = async (inputStr?: string) => {
    const raw = (inputStr ?? modalGmapInput).trim();
    if (!raw) return;
    setIsParsingModalGmap(true);
    setModalParseFeedback(null);
    const defaultCity = trip.destination.split(' ')[0] || '東京';
    try {
      // First apply synchronous parse immediately for snappy UX
      const syncParsed = parseGoogleMapsInput(raw, defaultCity);
      if (syncParsed) {
        if (syncParsed.title) setNewTitle(syncParsed.title);
        if (syncParsed.address) setNewAddress(syncParsed.address);
        if (syncParsed.coords) setNewCoords(syncParsed.coords);
        if (syncParsed.rating !== undefined) setNewRating(syncParsed.rating);
        setNewCategory(syncParsed.category);
        if (syncParsed.tags.length > 0 && !newTags) setNewTags(syncParsed.tags.join(', '));
        setNewGoogleMapsUrl(syncParsed.resolvedUrl || syncParsed.originalUrl);
      }
      // Then enrich with reverse/forward geocoding or short-URL resolution
      const enriched = await resolveAndEnrichGoogleMapsInput(raw, defaultCity);
      if (enriched.title) setNewTitle(enriched.title);
      if (enriched.address) setNewAddress(enriched.address);
      if (enriched.city) setNewCity(enriched.city);
      if (enriched.coords) setNewCoords(enriched.coords);
      if (enriched.rating !== undefined) setNewRating(enriched.rating);
      if (enriched.openingHours && !newHours) setNewHours(enriched.openingHours);
      if (enriched.imageUrl && !newImage) setNewImage(enriched.imageUrl);
      setNewCategory(enriched.category);
      if (enriched.tags.length > 0) setNewTags(enriched.tags.join(', '));
      setNewGoogleMapsUrl(enriched.resolvedUrl || enriched.originalUrl);
      if (enriched.coords && !newNotes) {
        setNewNotes(
          `由 Google 地圖匯入 (座標: ${enriched.coords.lat.toFixed(5)}, ${enriched.coords.lng.toFixed(5)}${enriched.reviewCount ? ` · ${enriched.reviewCount} 則評論` : ''})`
        );
      }

      if (enriched.title) {
        const ratingBadge = enriched.rating !== undefined ? `（★ ${enriched.rating.toFixed(1)}）` : '';
        const msg = `已自動帶入「${enriched.title}」${ratingBadge}的地點與評分資訊！`;
        setModalParseFeedback({ type: 'success', text: msg });
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 3000);
      } else {
        const errMsg = '此短網址無法自動展開名稱，建議使用手機 Google Maps「分享 → 複製」連同店名一起貼上';
        setModalParseFeedback({ type: 'error', text: errMsg });
      }
    } catch (err: any) {
      const errMsg = err?.message || '無法解析此 Google 地圖連結';
      setModalParseFeedback({ type: 'error', text: errMsg });
      setToastMessage(errMsg);
      setTimeout(() => setToastMessage(''), 3500);
    } finally {
      setIsParsingModalGmap(false);
    }
  };

  const handleSaveAttraction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const attData: AttractionBookmark = {
      id: editingAttractionId || `att-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      city: newCity,
      address: newAddress.trim() || newTitle.trim(),
      coords: newCoords || {
        lat: 35.6895 + (Math.random() - 0.5) * 0.06,
        lng: 139.6917 + (Math.random() - 0.5) * 0.06,
      },
      rating: newRating,
      openingHours: newHours.trim() || undefined,
      estimatedCost: newCost,
      currency: trip.targetCurrency,
      notes: newNotes.trim(),
      imageUrl: newImage.trim() || '',
      tags: newTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      isWishlist: true,
      googleMapsUrl: newGoogleMapsUrl.trim() || undefined,
    };

    if (editingAttractionId) {
      const original = trip.attractions.find(a => a.id === editingAttractionId);
      const updatedAttraction = {
        ...original,
        ...attData,
        coords: newCoords || original?.coords || attData.coords,
        isWishlist: original?.isWishlist ?? true,
      };
      const updatedList = trip.attractions.map(a => a.id === editingAttractionId ? updatedAttraction : a);
      onUpdateTrip({ ...trip, attractions: updatedList });
    } else {
      onUpdateTrip({ ...trip, attractions: [attData, ...trip.attractions] });
    }

    setNewTitle('');
    setNewAddress('');
    setNewCoords(undefined);
    setNewGoogleMapsUrl('');
    setModalGmapInput('');
    setNewHours('');
    setNewCost(undefined);
    setNewNotes('');
    setNewImage('');
    setNewTags('');
    setEditingAttractionId(null);
    setIsAddingAttraction(false);
  };

  const handleEditAttraction = (att: AttractionBookmark) => {
    setEditingAttractionId(att.id);
    setNewTitle(att.title);
    setNewCategory(att.category);
    setNewCity(att.city);
    setNewAddress(att.address);
    setNewCoords(att.coords);
    setNewGoogleMapsUrl(att.googleMapsUrl || '');
    setModalGmapInput(att.googleMapsUrl || '');
    setModalParseFeedback(null);
    setNewRating(att.rating || 0);
    setNewHours(att.openingHours || '');
    setNewCost(att.estimatedCost);
    setNewNotes(att.notes || '');
    setNewImage(att.imageUrl || '');
    setNewTags(att.tags.join(', '));
    setIsAddingAttraction(true);
  };

  const handleAddNewAttraction = () => {
    setEditingAttractionId(null);
    setNewTitle('');
    setNewCategory('sightseeing');
    setNewCity(trip.destination.split(' ')[0] || '東京');
    setNewAddress('');
    setNewCoords(undefined);
    setNewGoogleMapsUrl('');
    setModalGmapInput('');
    setModalParseFeedback(null);
    setNewRating(4.5);
    setNewHours('');
    setNewCost(undefined);
    setNewNotes('');
    setNewImage('');
    setNewTags('');
    setIsAddingAttraction(true);
  };


  const handleConfirmAddToItinerary = () => {
    if (!addingToDayModal) return;

    const newItem: ItineraryItem = {
      id: `item-${Date.now()}`,
      title: addingToDayModal.title,
      time: targetTime,
      endTime: addMinsToTime(targetTime, 90),
      category: addingToDayModal.category,
      locationName: addingToDayModal.address || addingToDayModal.title,
      coords: addingToDayModal.coords,
      cost: addingToDayModal.estimatedCost,
      currency: addingToDayModal.currency || trip.targetCurrency,
      notes: addingToDayModal.notes,
      transportToNext: {
        mode: 'subway',
        durationMinutes: 15,
      },
    };

    const updatedDays = trip.days.map((day) => {
      if (day.dayNumber === targetDayNumber) {
        const sortedItems = [...day.items, newItem].sort((a, b) => a.time.localeCompare(b.time));
        return { ...day, items: sortedItems };
      }
      return day;
    });

    onUpdateTrip({ ...trip, days: updatedDays });
    setToastMessage(`已成功將「${addingToDayModal.title}」加入至第 ${targetDayNumber} 天行程！`);
    setAddingToDayModal(null);
    setTimeout(() => setToastMessage(''), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-[70] bg-neutral-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-neutral-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 text-xs font-bold">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Search Bar */}
      <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-primary-600" />
              <span>景點與口袋清單 (Attraction Wishlist)</span>
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-0.5">
              收錄想去的私房景點、美食名店，支援貼上 Google 地圖網址直接匯入並一鍵排入行程。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 md:w-56">
              <Search className="w-4 h-4 text-neutral-400 dark:text-neutral-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜尋景點、標籤或餐廳..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-300 dark:border-neutral-600 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowGmapImportBox(!showGmapImportBox)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
                showGmapImportBox
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <Link2 className="w-4 h-4" />
              <span>Google 地圖網址匯入</span>
            </button>

            <button
              onClick={handleAddNewAttraction}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>新增景點筆記</span>
            </button>
          </div>
        </div>

        {/* Google Maps Direct URL Import Bar */}
        {showGmapImportBox && (
          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 space-y-2.5 animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>貼上 Google 地圖網址或手機分享文字，自動擷取店名、座標、地址與分類標籤</span>
              </div>
              <button
                type="button"
                onClick={() => setShowGmapImportBox(false)}
                className="text-xs text-neutral-400 hover:text-neutral-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="貼上 https://www.google.com/maps/place/... 或手機 Google Maps「分享」複製的文字與短網址"
                value={gmapQuickInput}
                onChange={(e) => setGmapQuickInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && gmapQuickInput.trim()) {
                    e.preventDefault();
                    handleQuickImportGoogleMaps(true);
                  }
                }}
                className="flex-1 px-3.5 py-2 bg-white dark:bg-neutral-900 rounded-xl border border-emerald-300 dark:border-emerald-700 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!gmapQuickInput.trim() || isParsingGmap}
                  onClick={() => handleQuickImportGoogleMaps(true)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all whitespace-nowrap"
                >
                  {isParsingGmap ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>一鍵直接收入口袋</span>
                </button>
                <button
                  type="button"
                  disabled={!gmapQuickInput.trim() || isParsingGmap}
                  onClick={() => handleQuickImportGoogleMaps(false)}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white dark:bg-neutral-800 hover:bg-neutral-50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 disabled:opacity-50 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
                >
                  <span>解析並編輯細節</span>
                </button>
              </div>
            </div>
            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
              💡 支援格式：電腦版 Google Maps 完整網址 (`/maps/place/...`)、搜尋連結 (`?query=...`)、座標連結 (`@lat,lng`)，或手機 App 點擊「分享 → 複製」的完整文字。
            </p>
          </div>
        )}
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(() => {
          const allTags = Array.from(new Set(trip.attractions.flatMap(a => a.tags)));
          const tabs = [
            { id: 'all', label: '全部景點', count: trip.attractions.length },
            { id: 'wishlist', label: '❤️ 待排口袋清單', count: trip.attractions.filter((a) => a.isWishlist).length },
            { id: 'sightseeing', label: '🏛️ 觀光名勝', count: trip.attractions.filter((a) => a.category === 'sightseeing').length },
            { id: 'food', label: '🍜 美食甜點', count: trip.attractions.filter((a) => a.category === 'food').length },
            { id: 'shopping', label: '🛍️ 購物探店', count: trip.attractions.filter((a) => a.category === 'shopping').length },
            { id: 'entertainment', label: '🎡 展覽娛樂', count: trip.attractions.filter((a) => a.category === 'entertainment').length },
            { id: 'stay', label: '🏨 住宿推薦', count: trip.attractions.filter((a) => a.category === 'stay').length },
            ...allTags.map(tag => ({ id: `tag:${tag}`, label: `# ${tag}`, count: trip.attractions.filter(a => a.tags.includes(tag)).length }))
          ];
          return tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedCategory === tab.id
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 dark:bg-neutral-950'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
              selectedCategory === tab.id ? 'bg-white/20 dark:bg-neutral-900/20 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-500'
            }`}>
              {tab.count}
            </span>
          </button>
        ))})()}
      </div>

      {/* Attractions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAttractions.map((att) => (
          <div
            key={att.id}
            className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden flex flex-col hover:border-neutral-300 dark:border-neutral-600 hover:shadow-md transition-all group"
          >
            {/* Cover Image with badges */}
            <div className="relative h-44 w-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
              {att.imageUrl ? (
                <img
                  src={att.imageUrl}
                  alt={att.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 bg-neutral-100 dark:bg-neutral-800 group-hover:scale-105 transition-transform duration-300">
                  <MapPin className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-xs font-medium opacity-50">無提供圖片</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/70 via-transparent to-black/20" />

              {/* Wishlist toggle heart */}
              <button
                onClick={() => handleToggleWishlist(att.id)}
                className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all ${
                  att.isWishlist
                    ? 'bg-rose-500 text-white shadow-lg'
                    : 'bg-black/40 text-white/80 hover:bg-black/60'
                }`}
              >
                <Heart className={`w-4 h-4 ${att.isWishlist ? 'fill-current' : ''}`} />
              </button>

              {/* Rating badge with 5 stars */}
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/65 backdrop-blur-md rounded-lg text-amber-300 text-xs font-bold">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((starIdx) => {
                    const fillRatio = Math.max(0, Math.min(1, att.rating - (starIdx - 1)));
                    return (
                      <span key={starIdx} className="relative inline-block w-3.5 h-3.5">
                        <Star className="w-3.5 h-3.5 text-white/30" />
                        {fillRatio > 0 && (
                          <span
                            className="absolute inset-y-0 left-0 overflow-hidden"
                            style={{ width: `${Math.round(fillRatio * 100)}%` }}
                          >
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
                <span>{att.rating.toFixed(1)}</span>
              </div>
            </div>

            {/* Body Info */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white line-clamp-1">{att.title}</h3>
                  {att.estimatedCost && (
                    <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md whitespace-nowrap">
                      {formatMoney(att.estimatedCost, att.currency || trip.targetCurrency)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-600 flex-shrink-0" />
                  <span className="truncate">{att.address}</span>
                </div>

                {att.openingHours && (
                  <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                    <Clock className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-600 flex-shrink-0" />
                    <span>{att.openingHours}</span>
                  </div>
                )}

                {att.notes && (
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-950 p-2.5 rounded-xl mt-2.5 border border-neutral-100 dark:border-neutral-800 line-clamp-2 leading-relaxed">
                    {att.notes}
                  </p>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {att.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[11px] font-medium rounded-md"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => setAddingToDayModal(att)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-xl text-xs font-bold transition-all"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  <span>排入行程</span>
                </button>

                <a
                  href={
                    att.googleMapsUrl ||
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      att.title + ' ' + att.address
                    )}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 text-neutral-400 dark:text-neutral-600 hover:text-primary-600 hover:bg-neutral-50 dark:hover:bg-neutral-800 dark:bg-neutral-950 rounded-xl transition-all"
                  title="在 Google 地圖查看"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>

                <button
                    onClick={() => handleEditAttraction(att)}
                    className="p-2 text-neutral-300 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                    title="編輯"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(att.id)}
                    className="p-2 text-neutral-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    title="刪除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Attraction to Itinerary Modal */}
      {addingToDayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <h4 className="font-bold text-neutral-900 dark:text-white text-base">排入指定天數行程</h4>
              <button
                onClick={() => setAddingToDayModal(null)}
                className="text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:text-neutral-400 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <span className="text-xs text-neutral-500 dark:text-neutral-500">選定景點：</span>
              <div className="font-bold text-neutral-900 dark:text-white text-sm mt-0.5">{addingToDayModal.title}</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">選擇天數</label>
                <div className="relative">
                      <select
                  value={targetDayNumber}
                  onChange={(e) => setTargetDayNumber(Number(e.target.value))}
                  className="appearance-none w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 text-xs bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 pr-8"
                >
                  {trip.days.map((d) => (
                    <option key={d.id} value={d.dayNumber}>
                      Day {d.dayNumber} ({d.date.substring(5)})
                    </option>
                  ))}
                </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                    </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">預計抵達時間</label>
                <CustomTimePicker
                  value={targetTime}
                  onChange={(newTime) => setTargetTime(newTime || '14:00')}
                  placeholder="選擇時間"
                  fineTuneOnly
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <button
                onClick={() => setAddingToDayModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 dark:bg-neutral-800"
              >
                取消
              </button>
              <button
                onClick={handleConfirmAddToItinerary}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
              >
                確認排入
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Attraction Bookmark Modal */}
      {isAddingAttraction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="p-5 bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
              <h4 className="font-bold text-neutral-900 dark:text-white text-base">{editingAttractionId ? "編輯景點" : "收藏新景點與美食"}</h4>
              <button
                onClick={() => { setIsAddingAttraction(false); setEditingAttractionId(null); }}
                className="text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:text-neutral-400 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAttraction} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Google Maps URL Smart Auto-fill inside Modal */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <Link2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>從 Google 地圖網址或分享文字自動帶入資訊</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="貼上 Google Maps 網址或手機分享文字..."
                    value={modalGmapInput}
                    onChange={(e) => setModalGmapInput(e.target.value)}
                    onPaste={(e) => {
                      const pasted = e.clipboardData.getData('text');
                      if (pasted && (pasted.includes('http') || pasted.includes('maps'))) {
                        setTimeout(() => handleModalParseGoogleMaps(pasted), 50);
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-neutral-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    disabled={!modalGmapInput.trim() || isParsingModalGmap}
                    onClick={() => handleModalParseGoogleMaps()}
                    className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold whitespace-nowrap transition-all"
                  >
                    {isParsingModalGmap ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>{isParsingModalGmap ? '解析中...' : '智慧解析'}</span>
                  </button>
                </div>
                {modalParseFeedback && (
                  <div
                    className={`flex items-center gap-1.5 text-[11px] font-bold ${
                      modalParseFeedback.type === 'success'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {modalParseFeedback.type === 'success' && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                    <span>{modalParseFeedback.text}</span>
                  </div>
                )}
                {newCoords && (
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                    <Check className="w-3 h-3" />
                    <span>已鎖定精確座標：{newCoords.lat.toFixed(5)}, {newCoords.lng.toFixed(5)}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">景點或名店名稱 *</label>
                <input
                  type="text"
                  
                  placeholder="例如：六本木之丘展望台、AFURI 柚子鹽拉麵"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">分類</label>
                  <div className="relative">
                      <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="appearance-none w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 text-xs bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 pr-8"
                  >
                    <option value="sightseeing">🏛️ 觀光名勝</option>
                    <option value="food">🍜 美食餐廳</option>
                    <option value="shopping">🛍️ 購物商圈</option>
                    <option value="entertainment">🎡 娛樂展覽</option>
                    <option value="stay">🏨 推薦住宿</option>
                  </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                    </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">評分 (1 ~ 5)</label>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={newRating}
                      onChange={(e) => setNewRating(Number(e.target.value))}
                      className="w-20 px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((starIdx) => {
                        const fillRatio = Math.max(0, Math.min(1, newRating - (starIdx - 1)));
                        return (
                          <button
                            key={starIdx}
                            type="button"
                            onClick={() => setNewRating(starIdx)}
                            className="relative inline-block w-4 h-4 focus:outline-none"
                            title={`設為 ${starIdx} 顆星`}
                          >
                            <Star className="w-4 h-4 text-neutral-300 dark:text-neutral-600" />
                            {fillRatio > 0 && (
                              <span
                                className="absolute inset-y-0 left-0 overflow-hidden pointer-events-none"
                                style={{ width: `${Math.round(fillRatio * 100)}%` }}
                              >
                                <Star className="w-4 h-4 text-amber-400 fill-current" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">地址 / 地點</label>
                <input
                  type="text"
                  placeholder="例如：東京都港区六本木6-10-1"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">營業時間</label>
                  <input
                    type="text"
                    placeholder="例如：10:00 - 22:00"
                    value={newHours}
                    onChange={(e) => setNewHours(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">預估花費 ({trip.targetCurrency})</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newCost || ''}
                    onChange={(e) => setNewCost(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">標籤 (用逗號隔開)</label>
                <input
                  type="text"
                  placeholder="夜景, 拍照打卡, 東京鐵塔"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">封面圖片網址 (URL)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">特色筆記與心得</label>
                <textarea
                  rows={2}
                  placeholder="記錄必點餐點、預約技巧、交通注意事項等..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddingAttraction(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 dark:bg-neutral-800"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
                >
                  儲存收藏
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    
      <ConfirmModal
        isOpen={!!deleteConfirmId}
        title="確認刪除"
        message="您確定要刪除此項目嗎？此操作無法復原。"
        onConfirm={() => {
          if (deleteConfirmId) {
            handleDeleteAttraction(deleteConfirmId);
            setDeleteConfirmId(null);
          }
        }}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
};