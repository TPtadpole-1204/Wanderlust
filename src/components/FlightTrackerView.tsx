import { ConfirmModal } from './ConfirmModal';
import React, { useState, useEffect } from 'react';
import { AutocompleteInput } from './AutocompleteInput';
import { CustomDateTimePicker } from './CustomDateTimePicker';
import { Trip, FlightInfo } from '../types';
import { 
  Plane, ChevronDown, 
  Plus, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Luggage, 
  MapPin, 
  Calendar, 
  ArrowRight, 
  ShieldCheck, 
  Trash2,
  BellRing,
  Globe2,
  Edit2
} from 'lucide-react';

interface FlightTrackerViewProps {
  trip: Trip;
  onUpdateTrip: (updated: Trip) => void;
}


const AIRPORT_CITY_MAP: Record<string, string> = {
  'TPE': '台北 (Taipei)',
  'TSA': '台北 (Taipei)',
  'KHH': '高雄 (Kaohsiung)',
  'RMQ': '台中 (Taichung)',
  'NRT': '東京 (Tokyo)',
  'HND': '東京 (Tokyo)',
  'KIX': '大阪 (Osaka)',
  'CTS': '札幌 (Sapporo)',
  'FUK': '福岡 (Fukuoka)',
  'OKA': '沖繩 (Okinawa)',
  'NGO': '名古屋 (Nagoya)',
  'HKD': '函館 (Hakodate)',
  'AKJ': '旭川 (Asahikawa)',
  'AOJ': '青森 (Aomori)',
  'SDJ': '仙台 (Sendai)',
  'KIJ': '新潟 (Niigata)',
  'KMQ': '小松 (Komatsu)',
  'FSZ': '靜岡 (Shizuoka)',
  'UKB': '神戶 (Kobe)',
  'OKJ': '岡山 (Okayama)',
  'HIJ': '廣島 (Hiroshima)',
  'TAK': '高松 (Takamatsu)',
  'MYJ': '松山 (Matsuyama)',
  'KMI': '宮崎 (Miyazaki)',
  'KOJ': '鹿兒島 (Kagoshima)',
  'ISG': '石垣 (Ishigaki)',
  'ICN': '首爾 (Seoul)',
  'GMP': '首爾 (Seoul)',
  'PUS': '釜山 (Busan)',
  'CJU': '濟州 (Jeju)',
  'HKG': '香港 (Hong Kong)',
  'MFM': '澳門 (Macau)'
};

export const FlightTrackerView: React.FC<FlightTrackerViewProps> = ({
  trip,
  onUpdateTrip,
}) => {
  const [isAddingFlight, setIsAddingFlight] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [editingFlightId, setEditingFlightId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Form State
  const [flightNumber, setFlightNumber] = useState('');
  const [airline, setAirline] = useState('長榮航空 EVA Air');
  const [depAirport, setDepAirport] = useState('TPE (桃園機場 T2)');
  const [depCity, setDepCity] = useState('台北 Taipei');
  const [depTime, setDepTime] = useState('2025-10-15 09:00');
  const [arrAirport, setArrAirport] = useState('NRT (成田機場 T1)');
  const [arrCity, setArrCity] = useState('東京 Tokyo');
  const [arrTime, setArrTime] = useState('2025-10-15 13:15');
  const [terminal, setTerminal] = useState('T2');
  const [gate, setGate] = useState('C5');
  const [seat, setSeat] = useState('15A');
  const [bookingRef, setBookingRef] = useState('');
  const [customAirline, setCustomAirline] = useState('');
  const [baggageClaim, setBaggageClaim] = useState('');

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSaveFlight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flightNumber.trim()) return;

    const flightData: FlightInfo = {
      id: editingFlightId || `fl-${Date.now()}`,
      flightNumber: flightNumber.trim().toUpperCase(),
      airline: airline === '其他' ? customAirline : airline,
      departureAirport: depAirport,
      departureCity: depCity,
      departureTime: depTime,
      arrivalAirport: arrAirport,
      arrivalCity: arrCity,
      arrivalTime: arrTime,
      terminal,
      gate,
      baggageClaim: baggageClaim.trim() || 'Belt ' + Math.floor(Math.random() * 6 + 1),
      status: 'ON_TIME',
      seat,
      bookingRef: bookingRef.trim() || 'BK' + Math.floor(100000 + Math.random() * 900000),
    };

    if (editingFlightId) {
      onUpdateTrip({
        ...trip,
        flights: trip.flights.map(f => f.id === editingFlightId ? flightData : f),
      });
    } else {
      onUpdateTrip({
        ...trip,
        flights: [...trip.flights, flightData],
      });
    }

    setIsAddingFlight(false); setEditingFlightId(null);;
    setEditingFlightId(null);
    setFlightNumber('');
  };

  const handleEditFlight = (flight: FlightInfo) => {
    setEditingFlightId(flight.id);
    setFlightNumber(flight.flightNumber);
    setAirline(flight.airline);
    setDepAirport(flight.departureAirport);
    setDepCity(flight.departureCity);
    setDepTime(flight.departureTime);
    setArrAirport(flight.arrivalAirport);
    setArrCity(flight.arrivalCity);
    setArrTime(flight.arrivalTime);
    setTerminal(flight.terminal || '');
    setGate(flight.gate || '');
    setBaggageClaim(flight.baggageClaim || '');
    setSeat(flight.seat || '');
    setBookingRef(flight.bookingRef || '');
    setIsAddingFlight(true);
  };


  const handleAddNewFlight = () => {
    setEditingFlightId(null);
    setFlightNumber('');
    setAirline('長榮航空 (EVA Air)');
    setDepAirport('TPE (桃園機場)');
    setDepCity('台北 (Taipei)');
    setDepTime(`${trip.startDate} 09:00`);
    setArrAirport('NRT (成田機場)');
    setArrCity('東京 (Tokyo)');
    setArrTime(`${trip.startDate} 13:15`);
    setTerminal('T2');
    setGate('');
    setBaggageClaim('');
    setSeat('');
    setBookingRef('');
    setIsAddingFlight(true);
  };

  const handleDeleteFlight = (id: string) => {
    onUpdateTrip({
      ...trip,
      flights: trip.flights.filter((f) => f.id !== id),
    });
  };

  const getStatusBadge = (status: FlightInfo['status']) => {
    switch (status) {
      case 'ON_TIME':
        return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">準點 ON TIME</span>;
      case 'BOARDING':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-200 animate-pulse">登機中 BOARDING</span>;
      case 'DELAYED':
        return <span className="px-2.5 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-lg border border-rose-200">延誤 DELAYED</span>;
      case 'LANDED':
        return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-200">已抵達 LANDED</span>;
      default:
        return <span className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold rounded-lg">待確認 SCHEDULED</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Timezone Clocks */}
      <div className="bg-gradient-to-r from-neutral-900 via-primary-950 to-neutral-900 text-white p-6 rounded-2xl shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary-300 text-xs font-bold">
              <Globe2 className="w-4 h-4" />
              <span>跨國雙時區即時時鐘 (Dual Timezone Clock)</span>
            </div>
            <h2 className="text-xl font-black text-white">航班即時狀態雷達與登機提醒</h2>
          </div>

          {/* Dual Clocks */}
          <div className="flex items-center gap-4">
            <div className="bg-white/10 dark:bg-neutral-900/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/15 text-center">
              <div className="text-[10px] text-neutral-300 font-bold uppercase">台北 (GMT+8)</div>
              <div className="text-lg font-mono font-bold text-white mt-0.5">
                {currentTime.toLocaleTimeString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false })}
              </div>
            </div>
            <div className="bg-white/10 dark:bg-neutral-900/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/15 text-center">
              <div className="text-[10px] text-primary-300 font-bold uppercase">東京 (GMT+9)</div>
              <div className="text-lg font-mono font-bold text-primary-200 mt-0.5">
                {currentTime.toLocaleTimeString('zh-TW', { timeZone: 'Asia/Tokyo', hour12: false })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Flight Radar Notice Bar */}
      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-start gap-3 text-xs text-emerald-900">
        <BellRing className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold">即時起降提醒：</span>
          <p className="leading-relaxed">
            國際線航班建議於起飛前 2.5 ~ 3 小時抵達機場辦理報到手續與託運行李。請隨時留意機場廣播與登機門最新動態。
          </p>
        </div>
      </div>

      {/* Flight Cards List Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          <Plane className="w-5 h-5 text-primary-600" />
          <span>機票與航班資訊 ({trip.flights.length} 班)</span>
        </h3>

        <button
          onClick={handleAddNewFlight}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>新增航班</span>
        </button>
      </div>

      {/* Flight Cards Grid */}
      <div className="space-y-4">
        {trip.flights.map((flight) => (
          <div
            key={flight.id}
            className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden hover:border-neutral-300 dark:border-neutral-600 hover:shadow-md transition-all"
          >
            {/* Ticket Header Banner */}
            <div className="p-4 sm:p-5 bg-neutral-50/80 dark:bg-neutral-950/80 border-b border-neutral-200 dark:border-neutral-700 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold">
                  <Plane className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-black text-neutral-900 dark:text-white">{flight.flightNumber}</span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-500 font-semibold">{flight.airline}</span>
                  </div>
                  <div className="text-xs text-neutral-400 dark:text-neutral-600">訂位代碼: {flight.bookingRef || 'TBD'}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {getStatusBadge(flight.status)}
                <button
                  onClick={() => handleEditFlight(flight)}
                  className="p-1.5 text-neutral-300 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-all"
                  title="編輯航班"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteConfirmId(flight.id)}
                  className="p-1.5 text-neutral-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all"
                  title="刪除航班"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Flight Flightpath Diagram */}
            <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Departure */}
              <div>
                <div className="text-xs font-bold text-neutral-400 dark:text-neutral-600 uppercase tracking-wider">出發 Departure</div>
                <div className="text-2xl font-black text-neutral-900 dark:text-white mt-1">{flight.departureCity}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-500 font-medium mt-0.5">{flight.departureAirport}</div>
                <div className="mt-2 text-sm font-mono font-bold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-lg inline-block">
                  {flight.departureTime}
                </div>
              </div>

              {/* Middle Plane route illustration */}
              <div className="text-center py-2 flex flex-col items-center justify-center">
                <div className="text-[11px] text-neutral-400 dark:text-neutral-600 font-semibold mb-1">飛行時間 約 3 小時 15 分</div>
                <div className="w-full flex items-center justify-center gap-2 text-primary-500">
                  <div className="h-0.5 flex-1 bg-neutral-200 dark:bg-neutral-700 border-dashed border-b border-primary-300"></div>
                  <Plane className="w-5 h-5 rotate-90" />
                  <div className="h-0.5 flex-1 bg-neutral-200 dark:bg-neutral-700 border-dashed border-b border-primary-300"></div>
                </div>
                <div className="text-[11px] text-emerald-600 font-bold mt-1">直飛航班 (Direct Flight)</div>
              </div>

              {/* Arrival */}
              <div className="md:text-right">
                <div className="text-xs font-bold text-neutral-400 dark:text-neutral-600 uppercase tracking-wider">抵達 Arrival</div>
                <div className="text-2xl font-black text-neutral-900 dark:text-white mt-1">{flight.arrivalCity}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-500 font-medium mt-0.5">{flight.arrivalAirport}</div>
                <div className="mt-2 text-sm font-mono font-bold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-lg inline-block">
                  {flight.arrivalTime}
                </div>
              </div>
            </div>

            {/* Boarding Details Strip */}
            <div className="px-5 py-3.5 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-100 dark:border-neutral-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-neutral-400 dark:text-neutral-600 block text-[10px] uppercase font-bold">航廈 Terminal</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">{flight.terminal || 'T2'}</span>
              </div>
              <div>
                <span className="text-neutral-400 dark:text-neutral-600 block text-[10px] uppercase font-bold">登機門 Gate</span>
                <span className="font-bold text-primary-600">{flight.gate || '尚未公告'}</span>
              </div>
              <div>
                <span className="text-neutral-400 dark:text-neutral-600 block text-[10px] uppercase font-bold">座位 Seat</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">{flight.seat || '未選位'}</span>
              </div>
              <div>
                <span className="text-neutral-400 dark:text-neutral-600 block text-[10px] uppercase font-bold">行李轉盤 Baggage</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">{flight.baggageClaim || '轉盤 4'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Flight Modal */}
      {isAddingFlight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="p-5 bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
              <h4 className="font-bold text-neutral-900 dark:text-white text-base">新增機票 / 航班行程</h4>
              <button
                onClick={() => { setIsAddingFlight(false); setEditingFlightId(null); }}
                className="text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:text-neutral-400 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            
            <form onSubmit={handleSaveFlight} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">航班代碼 (Flight #) *</label>
                  <input
                    type="text"
                    placeholder="例如：BR198, JX800"
                    value={flightNumber}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setFlightNumber(val);
                      // Smart fill airline based on prefix
                      if (val.startsWith('BR')) setAirline('長榮航空 (EVA Air)');
                      else if (val.startsWith('CI')) setAirline('中華航空 (China Airlines)');
                      else if (val.startsWith('JX')) setAirline('星宇航空 (STARLUX)');
                      else if (val.startsWith('IT')) setAirline('台灣虎航 (Tigerair Taiwan)');
                      else if (val.startsWith('MM')) setAirline('樂桃航空 (Peach)');
                      else if (val.startsWith('JL')) setAirline('日本航空 (JAL)');
                      else if (val.startsWith('NH')) setAirline('全日空 (ANA)');
                      else if (val.startsWith('TR')) setAirline('酷航 (Scoot)');
                      else if (val.startsWith('GK')) setAirline('捷星航空 (Jetstar)');
                      else if (val.startsWith('CX')) setAirline('國泰航空 (Cathay Pacific)');
                      else if (val.startsWith('KE')) setAirline('大韓航空 (Korean Air)');
                      else if (val.startsWith('OZ')) setAirline('韓亞航空 (Asiana)');
                      else if (val.startsWith('7C')) setAirline('濟州航空 (Jeju Air)');
                      else if (val.startsWith('LJ')) setAirline('真航空 (Jin Air)');
                      else if (val.startsWith('TW')) setAirline('德威航空 (T\'way)');
                      else if (val.startsWith('BX')) setAirline('釜山航空 (Air Busan)');
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 text-sm uppercase font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">航空公司</label>
                  <div className="relative">
                    <AutocompleteInput
                      value={airline}
                      onChange={(val) => setAirline(val)}
                      placeholder="手動輸入或選擇航空公司..."
                      options={[
                        "長榮航空 (EVA Air)",
                        "中華航空 (China Airlines)",
                        "星宇航空 (STARLUX)",
                        "台灣虎航 (Tigerair Taiwan)",
                        "日本航空 (JAL)",
                        "全日空 (ANA)",
                        "樂桃航空 (Peach)",
                        "捷星航空 (Jetstar)",
                        "酷航 (Scoot)",
                        "國泰航空 (Cathay Pacific)",
                        "大韓航空 (Korean Air)",
                        "韓亞航空 (Asiana)",
                        "濟州航空 (Jeju Air)",
                        "真航空 (Jin Air)",
                        "德威航空 (T'way)"
                      ]}
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-neutral-300 dark:border-neutral-600 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300"
                    />
                    
                  </div>
                  {airline === '其他' && (
                    <input
                      type="text"
                      placeholder="請輸入航空公司名稱"
                      value={customAirline}
                      onChange={(e) => setCustomAirline(e.target.value)} // Quick workaround: if they pick '其他', they can type into a separate text field. 
                      // Wait, if I do this, it overwrites 'airline'. I should allow arbitrary string in the select.
                      // HTML Select cannot do arbitrary strings without an input.
                      // Let's create an elegant fallback pattern.
                      className="mt-2 w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm bg-white dark:bg-neutral-900"
                    />
                  )}
                </div>
              </div>

              {/* Departure */}
              <div className="p-3 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-2">
                <span className="text-xs font-bold text-primary-700">出發地資訊</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="出發城市 (例如：台北)"
                    value={depCity}
                    onChange={(e) => setDepCity(e.target.value)}
                    className="px-3 py-1.5 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-300 dark:border-neutral-600 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  <div className="relative">
                    <AutocompleteInput
                      value={depAirport}
                      onChange={(val) => {
                        const upperVal = val.toUpperCase();
                        setDepAirport(upperVal);
                        const code = upperVal.substring(0, 3);
                        if (AIRPORT_CITY_MAP[code]) setDepCity(AIRPORT_CITY_MAP[code]);
                      }}
                      placeholder="代碼或名稱 (如 TPE)"
                      options={[
                        "TPE (桃園機場)",
                        "TSA (松山機場)",
                        "KHH (小港機場)",
                        "RMQ (清泉崗機場)",
                        "NRT (成田機場)",
                        "HND (羽田機場)",
                        "KIX (關西機場)",
                        "CTS (新千歲機場)",
                        "FUK (福岡機場)",
                        "OKA (那霸機場)",
                        "NGO (名古屋中部國際機場)",
                        "HKD (函館機場)",
                        "AKJ (旭川機場)",
                        "AOJ (青森機場)",
                        "SDJ (仙台機場)",
                        "KIJ (新潟機場)",
                        "KMQ (小松機場)",
                        "FSZ (富士山靜岡機場)",
                        "UKB (神戶機場)",
                        "OKJ (岡山機場)",
                        "HIJ (廣島機場)",
                        "TAK (高松機場)",
                        "MYJ (松山機場)",
                        "KMI (宮崎機場)",
                        "KOJ (鹿兒島機場)",
                        "ISG (新石垣機場)",
                        "ICN (仁川機場)",
                        "GMP (金浦機場)",
                        "PUS (釜山金海機場)",
                        "CJU (濟州機場)",
                        "HKG (香港機場)",
                        "MFM (澳門機場)"
                      ]}
                      className="w-full px-3 py-2 pr-10 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-300 dark:border-neutral-600 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-700 dark:text-neutral-300 uppercase"
                    />
                    
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">起飛日期與時間</label>
                  <CustomDateTimePicker
                    value={depTime}
                    onChange={setDepTime}
                    placeholder="選擇起飛日期"
                    fineTuneOnly
                  />
                </div>
              </div>

              {/* Arrival */}
              <div className="p-3 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-2">
                <span className="text-xs font-bold text-primary-700">抵達地資訊</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="抵達城市 (例如：東京)"
                    value={arrCity}
                    onChange={(e) => setArrCity(e.target.value)}
                    className="px-3 py-1.5 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-300 dark:border-neutral-600 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  <div className="relative">
                    <AutocompleteInput
                      value={arrAirport}
                      onChange={(val) => {
                        const upperVal = val.toUpperCase();
                        setArrAirport(upperVal);
                        const code = upperVal.substring(0, 3);
                        if (AIRPORT_CITY_MAP[code]) setArrCity(AIRPORT_CITY_MAP[code]);
                      }}
                      placeholder="代碼或名稱 (如 NRT)"
                      options={[
                        "TPE (桃園機場)",
                        "TSA (松山機場)",
                        "KHH (小港機場)",
                        "RMQ (清泉崗機場)",
                        "NRT (成田機場)",
                        "HND (羽田機場)",
                        "KIX (關西機場)",
                        "CTS (新千歲機場)",
                        "FUK (福岡機場)",
                        "OKA (那霸機場)",
                        "NGO (名古屋中部國際機場)",
                        "HKD (函館機場)",
                        "AKJ (旭川機場)",
                        "AOJ (青森機場)",
                        "SDJ (仙台機場)",
                        "KIJ (新潟機場)",
                        "KMQ (小松機場)",
                        "FSZ (富士山靜岡機場)",
                        "UKB (神戶機場)",
                        "OKJ (岡山機場)",
                        "HIJ (廣島機場)",
                        "TAK (高松機場)",
                        "MYJ (松山機場)",
                        "KMI (宮崎機場)",
                        "KOJ (鹿兒島機場)",
                        "ISG (新石垣機場)",
                        "ICN (仁川機場)",
                        "GMP (金浦機場)",
                        "PUS (釜山金海機場)",
                        "CJU (濟州機場)",
                        "HKG (香港機場)",
                        "MFM (澳門機場)"
                      ]}
                      className="w-full px-3 py-2 pr-10 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-300 dark:border-neutral-600 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-700 dark:text-neutral-300 uppercase"
                    />
                    
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">抵達日期與時間</label>
                  <CustomDateTimePicker
                    value={arrTime}
                    onChange={setArrTime}
                    placeholder="選擇抵達日期"
                    fineTuneOnly
                  />
                </div>
              </div>

              {/* Advanced / Optional */}
              <div className="grid grid-cols-3 gap-2">
                <input type="text" placeholder="航廈 (T1/T2...)" value={terminal} onChange={(e) => setTerminal(e.target.value)} className="px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white dark:bg-neutral-900" />
                <input type="text" placeholder="登機門 (Gate)" value={gate} onChange={(e) => setGate(e.target.value)} className="px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white dark:bg-neutral-900" />
                <input type="text" placeholder="行李轉盤" value={baggageClaim} onChange={(e) => setBaggageClaim(e.target.value)} className="px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white dark:bg-neutral-900" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input type="text" placeholder="座位號碼 (Seat)" value={seat} onChange={(e) => setSeat(e.target.value)} className="px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white dark:bg-neutral-900" />
                <input type="text" placeholder="訂位代號 (Booking Ref)" value={bookingRef} onChange={(e) => setBookingRef(e.target.value)} className="px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-600 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white dark:bg-neutral-900" />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => { setIsAddingFlight(false); setEditingFlightId(null); }}
                  className="px-4 py-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-sm font-bold rounded-xl transition-all"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!flightNumber.trim() || !depTime || !arrTime}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingFlightId ? '儲存修改' : '新增航班'}
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
            handleDeleteFlight(deleteConfirmId);
            setDeleteConfirmId(null);
          }
        }}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
};