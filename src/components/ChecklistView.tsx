import React, { useState } from 'react';
import { Trip, ChecklistItem, HotelInfo } from '../types';
import { CheckSquare, Square, Plus, Trash2, Home, MapPin, Phone, FileText, ChevronDown, Link2, Sparkles, Loader2 } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { AutocompleteInput } from './AutocompleteInput';
import { resolveAndEnrichGoogleMapsInput } from '../services/googleMapsParser';

interface Props {
  trip: Trip;
  onUpdateTrip: (updated: Trip) => void;
}

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: '1', category: '重要文件 (必備)', label: '護照 (確認效期至少六個月)', checked: false },
  { id: '2', category: '重要文件 (必備)', label: '列印 Visit Japan Web QR Code 或 K-ETA', checked: false },
  { id: '3', category: '重要文件 (必備)', label: '列印飯店住宿憑證', checked: false },
  { id: '4', category: '電子產品', label: '萬國轉接頭', checked: false },
  { id: '5', category: '電子產品', label: '行動電源', checked: false },
  { id: '6', category: '電子產品', label: '充電線 (手機、手錶)', checked: false },
  { id: '7', category: '衣物與盥洗', label: '內衣褲與襪子', checked: false },
  { id: '8', category: '衣物與盥洗', label: '牙刷牙膏與洗面乳', checked: false },
];

export const ChecklistView: React.FC<Props> = ({ trip, onUpdateTrip }) => {
  const [newItemText, setNewItemText] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [newItemCategory, setNewItemCategory] = useState('其他物品');
  const [customCategory, setCustomCategory] = useState("");

  // Google Maps Hotel Import State
  const [hotelGmapInput, setHotelGmapInput] = useState('');
  const [isParsingHotelGmap, setIsParsingHotelGmap] = useState(false);
  const [hotelGmapFeedback, setHotelGmapFeedback] = useState<string | null>(null);
    
  const checklist = trip.checklist || DEFAULT_CHECKLIST;
  const hotel = trip.firstNightHotel || { name: '', address: '', phone: '', bookingRef: '' };

  const handleImportHotelFromGmap = async () => {
    if (!hotelGmapInput.trim()) return;
    setIsParsingHotelGmap(true);
    setHotelGmapFeedback(null);
    const defaultCity = trip.destination.split(' ')[0] || '東京';
    try {
      const enriched = await resolveAndEnrichGoogleMapsInput(hotelGmapInput.trim(), defaultCity);
      const updatedHotel: HotelInfo = {
        name: enriched.title || hotel.name,
        address: enriched.address || hotel.address,
        phone: enriched.phone || hotel.phone,
        bookingRef: hotel.bookingRef,
      };
      onUpdateTrip({
        ...trip,
        firstNightHotel: updatedHotel,
      });
      setHotelGmapFeedback(`✓ 已帶入「${updatedHotel.name}」`);
      setHotelGmapInput('');
      setTimeout(() => setHotelGmapFeedback(null), 4000);
    } catch {
      setHotelGmapFeedback('⚠️ 無法解析此網址');
      setTimeout(() => setHotelGmapFeedback(null), 4000);
    } finally {
      setIsParsingHotelGmap(false);
    }
  };

  const handleToggleItem = (id: string) => {
    const updated = checklist.map(item => item.id === id ? { ...item, checked: !item.checked } : item);
    onUpdateTrip({ ...trip, checklist: updated });
  };

  const handleDeleteItem = (id: string) => {
    const updated = checklist.filter(item => item.id !== id);
    onUpdateTrip({ ...trip, checklist: updated });
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    
    const categoryToUse = newItemCategory === 'NEW' ? customCategory.trim() : newItemCategory;
    if (!categoryToUse) return;

    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      category: categoryToUse,
      label: newItemText.trim(),
      checked: false
    };
    onUpdateTrip({ ...trip, checklist: [...checklist, newItem] });
    setNewItemText('');
    
    if (newItemCategory === 'NEW') {
      setNewItemCategory(customCategory.trim());
      setCustomCategory('');
    }
  };

  const handleUpdateHotel = (field: keyof HotelInfo, value: string) => {
    onUpdateTrip({
      ...trip,
      firstNightHotel: { ...hotel, [field]: value }
    });
  };

  

  const renderSection = (title: string, items: ChecklistItem[]) => {
    if (items.length === 0) return null;
    return (
      <div key={title} className="mb-6">
        <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-500 uppercase tracking-wider mb-3">{title}</h4>
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between group">
              <label className="flex items-center gap-3 cursor-pointer flex-1">
                <div onClick={() => handleToggleItem(item.id)}>
                  {item.checked ? (
                    <CheckSquare className="w-5 h-5 text-primary-500" />
                  ) : (
                    <Square className="w-5 h-5 text-neutral-300 dark:text-neutral-600" />
                  )}
                </div>
                <span className={`text-sm ${item.checked ? 'text-neutral-400 dark:text-neutral-600 line-through' : 'text-neutral-700 dark:text-neutral-300'}`}>
                  {item.label}
                </span>
              </label>
              <button
                onClick={() => setDeleteConfirmId(item.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-neutral-400 hover:text-rose-500 transition-all rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-black text-neutral-900 dark:text-white">出國準備清單</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">Visit Japan Web / 入境審查必備資訊與行李清單</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: First Night Hotel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 bg-emerald-50 dark:bg-emerald-950/20 flex items-center gap-2">
              <Home className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-emerald-800 dark:text-emerald-400">第一晚住宿資訊 (入境必填)</h3>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-2">
                填寫入境卡或電子通關 (如 Visit Japan Web 或 K-ETA) 時需要填寫第一晚的聯絡資訊。
              </p>

              {/* Google Maps quick auto-import box */}
              <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <Link2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>貼上 Google 地圖飯店網址自動帶入</span>
                  </div>
                  {hotelGmapFeedback && (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      {hotelGmapFeedback}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="貼上飯店的 Google Maps 網址或手機分享文字..."
                    value={hotelGmapInput}
                    onChange={(e) => setHotelGmapInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleImportHotelFromGmap();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-neutral-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    disabled={!hotelGmapInput.trim() || isParsingHotelGmap}
                    onClick={handleImportHotelFromGmap}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold whitespace-nowrap transition-all cursor-pointer"
                  >
                    {isParsingHotelGmap ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>{isParsingHotelGmap ? '解析中...' : '自動帶入'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">飯店名稱</label>
                <div className="relative">
                  <Home className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="例如：新宿王子大飯店"
                    value={hotel.name}
                    onChange={(e) => handleUpdateHotel('name', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-neutral-50 dark:bg-neutral-950"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">飯店地址</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="包含郵遞區號更佳"
                    value={hotel.address}
                    onChange={(e) => handleUpdateHotel('address', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-neutral-50 dark:bg-neutral-950"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">聯絡電話</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="例如：+81 3-1234-5678"
                    value={hotel.phone}
                    onChange={(e) => handleUpdateHotel('phone', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-neutral-50 dark:bg-neutral-950"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">訂房代號 (選填)</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="例如：123456789"
                    value={hotel.bookingRef}
                    onChange={(e) => handleUpdateHotel('bookingRef', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-neutral-50 dark:bg-neutral-950"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Packing Checklist */}
        <div className="lg:col-span-7 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              行李清單
              <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-500">
                {checklist.filter(i => i.checked).length} / {checklist.length}
              </span>
            </h3>
          </div>


          <form onSubmit={handleAddItem} className="mb-4 pb-4 border-b border-neutral-100 dark:border-neutral-800 space-y-3">
            <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-500 uppercase tracking-wider">快速新增物品</h4>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="物品名稱..."
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                className="flex-1 px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-neutral-50 dark:bg-neutral-950"
              />
              <div className="w-full sm:w-1/3">
                <AutocompleteInput
                  value={newItemCategory}
                  onChange={(val) => setNewItemCategory(val)}
                  options={Array.from(new Set(checklist.map(i => i.category)))}
                  placeholder="輸入或選擇分類"
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-300 dark:border-neutral-600 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-700 dark:text-neutral-300"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!newItemText.trim() || !newItemCategory.trim()}
              className="w-full px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-1 transition-all"
            >
              <Plus className="w-4 h-4" />
              新增至清單
            </button>
          </form>

          <div className="overflow-y-auto pr-2" style={{ maxHeight: '60vh' }}>
            {/* Dynamically render sections based on categories */}
            {Array.from(new Set(checklist.map(i => i.category))).map(cat => 
              renderSection(cat as string, checklist.filter(i => i.category === cat))
            )}
          </div>
        </div>
      </div>
    
      <ConfirmModal
        isOpen={!!deleteConfirmId}
        title="確認刪除"
        message="您確定要刪除此項目嗎？此操作無法復原。"
        onConfirm={() => {
          if (deleteConfirmId) {
            handleDeleteItem(deleteConfirmId);
            setDeleteConfirmId(null);
          }
        }}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
};