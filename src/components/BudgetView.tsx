import React, { useState, useEffect } from 'react';
import { Trip, Expense } from '../types';
import {   
  DollarSign, 
  Plus, 
  TrendingUp, 
  PieChart, 
  Users, 
  UserPlus,
  RefreshCw, 
  Trash2, Search, 
  ArrowRightLeft, 
  Wallet, 
  CreditCard, 
  ShoppingBag, 
  Utensils, 
  Hotel, 
  Train, 
  Ticket,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Receipt,
  Copy,
  Check,
  ChevronDown,
  Edit2
} from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { convertCurrency, formatMoney, fetchLiveRates, getCachedRates, updateCustomRate } from '../services/currency';
import { POPULAR_CURRENCIES } from '../services/storage';
import { calculateTripSettlement, generateAllSettlementText } from '../services/settlement';
import { MemberManageModal } from './MemberManageModal';
import { MemberSettlementModal } from './MemberSettlementModal';
import { AnimalAvatar } from './AnimalAvatar';
import { CurrencyDropdown } from './CurrencyDropdown';
import { ConfirmModal } from './ConfirmModal';
import { CustomDatePicker } from './CustomDateTimePicker';

interface BudgetViewProps {
  trip: Trip;
  onUpdateTrip: (updated: Trip) => void;
}

export const BudgetView: React.FC<BudgetViewProps> = ({ trip, onUpdateTrip }) => {
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [isUpdatingRates, setIsUpdatingRates] = useState(false);
  const [rateSyncMessage, setRateSyncMessage] = useState('');
  const [currencyRates, setCurrencyRates] = useState(getCachedRates().rates);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [selectedSettlementMember, setSelectedSettlementMember] = useState<string | null>(null);
  const [copiedAllTransfers, setCopiedAllTransfers] = useState(false);

  const handleSyncRates = async () => {
    setIsUpdatingRates(true);
    const res = await fetchLiveRates();
    setIsUpdatingRates(false);
    setCurrencyRates({ ...res.rates });
    setRateSyncMessage(res.message);
    setTimeout(() => setRateSyncMessage(''), 4000);
  };

  // Quick Currency Converter tool
  const [calcAmount, setCalcAmount] = useState<number>(1000);
  const [calcFrom, setCalcFrom] = useState<string>(trip.targetCurrency || 'JPY');
  const [calcTo, setCalcTo] = useState<string>(trip.baseCurrency || 'TWD');

  const [settlementCurrency, setSettlementCurrency] = useState(trip.targetCurrency || trip.baseCurrency || 'JPY');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  // New Expense Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [currency, setCurrency] = useState(trip.targetCurrency || 'JPY');
  const [category, setCategory] = useState<Expense['category']>('food');
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [editBudgetAmount, setEditBudgetAmount] = useState(trip.totalBudget.toString());
  const [paidBy, setPaidBy] = useState(trip.collaborators[0]?.name || '我 (Alex)');
  const [splitWith, setSplitWith] = useState<string[]>(trip.collaborators.map((c) => c.name));
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Keep paidBy and splitWith synchronized with collaborators
  useEffect(() => {
    if (trip.collaborators.length > 0) {
      if (!trip.collaborators.some((c) => c.name === paidBy)) {
        setPaidBy(trip.collaborators[0].name);
      }
      const validNames = trip.collaborators.map((c) => c.name);
      setSplitWith((prev) => {
        const filtered = prev.filter((name) => validNames.includes(name));
        return filtered.length > 0 ? filtered : validNames;
      });
    }
  }, [trip.collaborators, paidBy]);

  // Total Calculations
  const totalSpent = trip.expenses.reduce((acc, curr) => acc + curr.convertedAmount, 0);
  const remainingBudget = trip.totalBudget - totalSpent;
  const budgetPercentage = Math.min(100, Math.round((totalSpent / trip.totalBudget) * 100));

  // Category breakdown
  const categoryTotals: Record<Expense['category'], number> = {
    food: 0,
    lodging: 0,
    transport: 0,
    shopping: 0,
    ticket: 0,
    other: 0,
  };

  trip.expenses.forEach((exp) => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.convertedAmount;
  });

  const pieChartData = [
    { name: '餐飲美食', value: categoryTotals.food, color: '#f59e0b' },
    { name: '交通通行', value: categoryTotals.transport, color: '#10b981' },
    { name: '飯店住宿', value: categoryTotals.lodging, color: '#a855f7' },
    { name: '購物商場', value: categoryTotals.shopping, color: '#ec4899' },
    { name: '景點門票', value: categoryTotals.ticket, color: '#3b82f6' },
    { name: '其他雜支', value: categoryTotals.other, color: '#9ca3af' },
  ].filter(item => item.value > 0);


  // AA Split / Settlement calculation using debt simplification engine
  const settlement = calculateTripSettlement(trip.collaborators, trip.expenses, settlementCurrency, currencyRates);
  const memberBalances = settlement.balances;

  const handleCopyAllTransfers = () => {
    const text = generateAllSettlementText(trip.title, settlementCurrency, trip.collaborators, settlement);
    navigator.clipboard.writeText(text);
    setCopiedAllTransfers(true);
    setTimeout(() => setCopiedAllTransfers(false), 2500);
  };


  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amount <= 0) return;

    const converted = convertCurrency(amount, currency, trip.baseCurrency, currencyRates);

    const expenseData: Expense = {
      id: editingExpenseId || `exp-${Date.now()}`,
      date,
      title: title.trim(),
      category,
      amount,
      originalCurrency: currency,
      convertedAmount: converted,
      paidBy,
      splitWith: splitWith.length > 0 ? splitWith : [paidBy],
      notes: notes.trim() || undefined,
    };

    onUpdateTrip({
      ...trip,
      expenses: editingExpenseId 
        ? trip.expenses.map(exp => exp.id === editingExpenseId ? expenseData : exp)
        : [expenseData, ...trip.expenses],
    });

    // Reset
    resetForm();
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpenseId(expense.id);
    setTitle(expense.title);
    setAmount(expense.amount);
    setCurrency(expense.originalCurrency);
    setCategory(expense.category);
    setPaidBy(expense.paidBy);
    setSplitWith(expense.splitWith);
    setDate(expense.date);
    setNotes(expense.notes || '');
    setIsAddingExpense(true);
  };

  const resetForm = () => {
    setEditingExpenseId(null);
    setTitle('');
    setAmount(0);
    setNotes('');
    setIsAddingExpense(false);
  };

  const handleDeleteExpense = (id: string) => {
    onUpdateTrip({
      ...trip,
      expenses: trip.expenses.filter((e) => e.id !== id),
    });
  };

  const toggleSplitUser = (name: string) => {
    if (splitWith.includes(name)) {
      if (splitWith.length > 1) {
        setSplitWith(splitWith.filter((n) => n !== name));
      }
    } else {
      setSplitWith([...splitWith, name]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Budget Card */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-500 uppercase tracking-wider">總預算額度</span>
            <div className="p-2 bg-primary-50 text-primary-600 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            
            <div className="flex items-center gap-2">
              {isEditingBudget ? (
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="number"
                    value={editBudgetAmount}
                    onChange={(e) => setEditBudgetAmount(e.target.value)}
                    className="w-full px-2 py-1 text-lg font-black text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      const newBudget = parseFloat(editBudgetAmount) || 0;
                      onUpdateTrip({ ...trip, totalBudget: newBudget });
                      setIsEditingBudget(false);
                    }}
                    className="p-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-black text-neutral-900 dark:text-white">
                    {formatMoney(trip.totalBudget, trip.baseCurrency)}
                  </div>
                  <button 
                    onClick={() => {
                      setEditBudgetAmount(trip.totalBudget.toString());
                      setIsEditingBudget(true);
                    }}
                    className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
              約 {formatMoney(convertCurrency(trip.totalBudget, trip.baseCurrency, trip.targetCurrency, currencyRates), trip.targetCurrency)}
            </div>
          </div>
        </div>

        {/* Total Spent Card */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-500 uppercase tracking-wider">目前已記錄總支出</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-rose-600">
              {formatMoney(totalSpent, trip.baseCurrency)}
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
              已消耗預算的 {budgetPercentage}%
            </div>
          </div>
        </div>

        {/* Remaining Balance Card */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-500 uppercase tracking-wider">剩餘可用預算</span>
            <div className={`p-2 rounded-xl ${remainingBudget >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className={`text-2xl font-black ${remainingBudget >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatMoney(remainingBudget, trip.baseCurrency)}
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
              {remainingBudget >= 0 ? '預算控制良好' : '已超出設定總預算！'}
            </div>
          </div>
        </div>
      </div>

      {/* Budget Progress Bar */}
      <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm space-y-2">
        <div className="flex justify-between items-center text-xs font-bold text-neutral-700 dark:text-neutral-300">
          <span>預算消耗進度</span>
          <span>{totalSpent.toLocaleString()} / {trip.totalBudget.toLocaleString()} {trip.baseCurrency}</span>
        </div>
        <div className="w-full h-3.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              budgetPercentage > 90 ? 'bg-rose-500' : budgetPercentage > 70 ? 'bg-amber-500' : 'bg-primary-600'
            }`}
            style={{ width: `${Math.min(100, budgetPercentage)}%` }}
          />
        </div>
      </div>

      {/* Currency Exchange & Quick Converter Banner */}
      <div className="bg-gradient-to-br from-neutral-900 via-primary-950 to-neutral-900 text-white p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-primary-400" />
            <h3 className="text-base font-bold text-white">即時匯率自動轉換工具 (Currency Converter)</h3>
          </div>

          <div className="flex items-center gap-3">
            {rateSyncMessage && (
              <span className="text-xs text-emerald-300 font-semibold bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800">
                {rateSyncMessage}
              </span>
            )}
            <button
              onClick={handleSyncRates}
              disabled={isUpdatingRates}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 dark:bg-neutral-900/10 hover:bg-white/20 dark:hover:bg-neutral-800/20 dark:bg-neutral-900/20 rounded-xl text-xs font-bold transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingRates ? 'animate-spin' : ''}`} />
              <span>{isUpdatingRates ? '更新匯率中...' : '同步最新匯率'}</span>
            </button>
          </div>
        </div>

        {/* Instant Multi-Currency Quick Converter */}
        <div className="bg-white/10 dark:bg-neutral-900/10 backdrop-blur-md p-4 rounded-xl border border-white/15 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-4">
            <label className="block text-[11px] font-bold text-neutral-300 mb-1">輸入金額</label>
            <input
              type="number"
              value={calcAmount}
              onChange={(e) => setCalcAmount(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-white/20 dark:bg-neutral-900/20 text-white font-mono text-sm font-bold border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[11px] font-bold text-neutral-300 mb-1">來源幣別</label>
            <CurrencyDropdown
              value={calcFrom}
              onChange={setCalcFrom}
              variant="glass"
            />
          </div>

          <div className="sm:col-span-1 flex justify-center pt-4 sm:pt-0">
            <button
              type="button"
              onClick={() => {
                const temp = calcFrom;
                setCalcFrom(calcTo);
                setCalcTo(temp);
              }}
              title="點擊切換來源與換算幣別"
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-primary-200 hover:text-white transition-all cursor-pointer shadow-xs"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="sm:col-span-4">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-neutral-300">換算結果 ({calcTo})</label>
              <span className="text-[10px] text-neutral-300 opacity-80 font-sans">1 {calcFrom} ≈ {(convertCurrency(1, calcFrom, calcTo, currencyRates)).toFixed(3)} {calcTo}</span>
            </div>
            <div className="px-3.5 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono text-sm font-black flex items-center justify-between shadow-xs">
              <span className="text-base">{formatMoney(convertCurrency(calcAmount, calcFrom, calcTo, currencyRates), calcTo)}</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/30 text-emerald-200 font-bold">{calcTo}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Expenses List & Split-Bill Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expenses List (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary-600" />
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">消費支出記帳清單</h3>
              <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                共 {trip.expenses.length} 筆
              </span>
            </div>

            <button
              onClick={() => setIsAddingExpense(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新增消費記錄</span>
            </button>
          </div>

          {/* New Expense Modal */}
          {isAddingExpense && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                <div className="p-5 bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
                  <h4 className="font-bold text-neutral-900 dark:text-white text-base">{editingExpenseId ? '編輯消費支出項目' : '新增消費支出項目'}</h4>
                  <button
                    onClick={resetForm}
                    className="text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:text-neutral-400 text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveExpense} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      支出項目名稱 *
                    </label>
                    <input
                      type="text"
                      
                      placeholder="例如：SHIBUYA SKY 門票、一蘭拉麵晚餐"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        金額 *
                      </label>
                      <input
                        type="number"
                        
                        placeholder="0"
                        value={amount || ''}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        幣別
                      </label>
                      <CurrencyDropdown
                        value={currency}
                        onChange={setCurrency}
                        variant="form"
                      />
                    </div>
                  </div>

                  {/* Category Grid */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                      消費類別
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                      {[
                        { id: 'food', icon: '🍜', label: '餐飲美食' },
                        { id: 'lodging', icon: '🏨', label: '飯店住宿' },
                        { id: 'transport', icon: '🚆', label: '交通通行' },
                        { id: 'shopping', icon: '🛍️', label: '購物商場' },
                        { id: 'ticket', icon: '🎫', label: '景點門票' },
                        { id: 'other', icon: '📌', label: '其他雜支' },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setCategory(cat.id as any);
                          }}
                          className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl border transition-all ${
                            category === cat.id
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 shadow-sm ring-1 ring-primary-500'
                              : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-500 hover:border-neutral-300 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                          }`}
                        >
                          <span className="text-xl mb-1.5">{cat.icon}</span>
                          <span className="text-[10px] font-bold tracking-wider">{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        日期
                      </label>
                      <CustomDatePicker
                        value={date}
                        onChange={(newDate) => setDate(newDate)}
                        placeholder="選擇日期"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                          由誰先代付 (Payer)
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsMemberModalOpen(true)}
                          className="text-[11px] font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>管理成員</span>
                        </button>
                      </div>
                      
                      {/* Chips styled selector for Payer */}
                      <div className="flex flex-wrap gap-2 pb-1">
                        {trip.collaborators.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setPaidBy(c.name);
                            }}
                            className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                              paidBy === c.name
                                ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border-primary-500 shadow-sm ring-1 ring-primary-500'
                                : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                            }`}
                          >
                            <div className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/60 text-primary-700 dark:text-primary-400 flex items-center justify-center text-[10px]">
                              {c.name.charAt(0).toUpperCase()}
                            </div>
                            <span>{c.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Split with users pills */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                        分攤成員 (AA 制分帳)
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSplitWith(trip.collaborators.map((c) => c.name))}
                          className="text-[11px] font-medium text-neutral-500 hover:text-primary-600 dark:text-neutral-400"
                        >
                          全選
                        </button>
                        <span className="text-neutral-300 dark:text-neutral-600">•</span>
                        <button
                          type="button"
                          onClick={() => setIsMemberModalOpen(true)}
                          className="text-[11px] font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-0.5"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>成員管理</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {trip.collaborators.map((c) => {
                        const isChecked = splitWith.includes(c.name);
                        return (
                          <button
                            type="button"
                            key={c.id}
                            onClick={() => toggleSplitUser(c.name)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                              isChecked
                                ? 'bg-primary-50 border-primary-300 text-primary-700 dark:bg-primary-950/60 dark:border-primary-800 dark:text-primary-300'
                                : 'bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-700 text-neutral-400 dark:text-neutral-600'
                            }`}
                          >
                            <AnimalAvatar avatar={c.avatar} name={c.name} color={c.color} size="xs" />
                            <span>{c.name}</span>
                            <span className="text-[10px] opacity-75">{isChecked ? '✓' : '+'}</span>
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setIsMemberModalOpen(true)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold border border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-500 hover:border-primary-400 hover:text-primary-600 transition-all flex items-center gap-1"
                        title="新增成員"
                      >
                        <Plus className="w-3 h-3" />
                        <span>新增</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
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
                      {editingExpenseId ? '儲存變更' : '記錄此筆支出'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Expense Items */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="搜尋消費記錄 (名稱、備註)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              </div>
              <div className="w-full sm:w-[130px] flex-shrink-0">
                <CurrencyDropdown
                  value={settlementCurrency}
                  onChange={(val) => setSettlementCurrency(val)}
                  variant="form"
                />
              </div>
            </div>
            {trip.expenses.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-600 p-6">
                <DollarSign className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                <p className="text-xs text-neutral-500 dark:text-neutral-500">尚無任何支出記錄，點擊上方按鈕記錄第一筆花費。</p>
              </div>
            ) : (() => {
                const filteredExpenses = trip.expenses.filter(exp => 
                  exp.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  (exp.notes && exp.notes.toLowerCase().includes(searchQuery.toLowerCase()))
                );

                if (filteredExpenses.length === 0) {
                  return (
                    <div className="text-center py-8 text-neutral-500 text-sm">
                      找不到符合「{searchQuery}」的消費記錄
                    </div>
                  );
                }

                return filteredExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="bg-white dark:bg-neutral-900 p-3.5 sm:p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm flex items-center justify-between gap-2.5 hover:border-neutral-300 dark:border-neutral-600 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-neutral-700 dark:text-neutral-300 flex-shrink-0">
                      {exp.category === 'food' && <Utensils className="w-4 h-4 text-amber-600" />}
                      {exp.category === 'lodging' && <Hotel className="w-4 h-4 text-purple-600" />}
                      {exp.category === 'transport' && <Train className="w-4 h-4 text-emerald-600" />}
                      {exp.category === 'shopping' && <ShoppingBag className="w-4 h-4 text-pink-600" />}
                      {exp.category === 'ticket' && <Ticket className="w-4 h-4 text-blue-600" />}
                      {exp.category === 'other' && <DollarSign className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-white truncate">{exp.title}</h4>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs text-neutral-400 dark:text-neutral-600 mt-0.5">
                        <span>{exp.date}</span>
                        <span>•</span>
                        <span className="font-semibold text-neutral-600 dark:text-neutral-300">{exp.paidBy} 先付</span>
                        <span>•</span>
                        <span>分攤 ({exp.splitWith.length} 人)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-bold text-neutral-900 dark:text-white">
                        {formatMoney(convertCurrency(exp.amount, exp.originalCurrency, settlementCurrency, currencyRates), settlementCurrency)}
                      </div>
                      {exp.originalCurrency !== settlementCurrency && (
                        <div className="text-[11px] text-neutral-400 dark:text-neutral-600">
                          {formatMoney(exp.amount, exp.originalCurrency)}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center sm:gap-1 gap-2">
                      <button
                        onClick={() => handleEditExpense(exp)}
                        className="p-1.5 text-neutral-300 dark:text-neutral-500 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
                        title="編輯"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(exp.id)}
                        className="p-1.5 text-neutral-300 dark:text-neutral-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                        title="刪除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Split Bill / AA Settlement & Category Stats (1 Col) */}
        <div className="space-y-6">
          {/* AA Settlement Card */}
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-600 flex-shrink-0" />
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">同行夥伴 AA 分帳結算</h3>
              </div>
              <div className="flex flex-1 sm:flex-none items-center gap-2 w-full sm:w-auto">
                <div className="flex-1 sm:flex-none sm:w-[130px] min-w-0">
                  <CurrencyDropdown
                    value={settlementCurrency}
                    onChange={(val) => setSettlementCurrency(val)}
                    variant="form"
                  />
                </div>
                <button
                id="btn-open-member-manage"
                onClick={() => setIsMemberModalOpen(true)}
                className="flex-shrink-0 flex items-center justify-center gap-1 px-3 py-2 sm:px-2.5 sm:py-1 text-xs font-bold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/50 hover:bg-primary-100 dark:hover:bg-primary-900/60 rounded-xl border border-primary-200 dark:border-primary-800 transition-all"
                title="新增或修改成員名單"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>成員管理</span>
              </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-500 px-1 font-medium">
                <span>點擊成員可查看個人收支與分攤細節</span>
                <span>結算淨額</span>
              </div>

              {trip.collaborators.map((c) => {
                const balance = memberBalances[c.name] || 0;
                return (
                  <button
                    key={c.id}
                    id={`btn-member-settlement-${c.id}`}
                    type="button"
                    onClick={() => setSelectedSettlementMember(c.name)}
                    className="w-full p-3 bg-neutral-50 dark:bg-neutral-950 hover:bg-primary-50/50 dark:hover:bg-primary-950/40 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-primary-300 dark:hover:border-primary-700 flex items-center justify-between transition-all group cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <AnimalAvatar avatar={c.avatar} name={c.name} color={c.color} size="md" />

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">
                            {c.name}
                          </span>
                          {c.role === 'owner' && (
                            <span className="text-[9px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold px-1 py-0.2 rounded">
                              主辦
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-neutral-400 dark:text-neutral-500 group-hover:text-primary-600 transition-colors flex items-center gap-1 mt-0.5">
                          <Receipt className="w-3 h-3" />
                          <span>點擊看個人細節</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span
                          className={`text-xs font-black block ${
                            balance > 0.01
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : balance < -0.01
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-neutral-500 dark:text-neutral-500'
                          }`}
                        >
                          {balance > 0.01
                            ? `應收 +${formatMoney(balance, settlementCurrency)}`
                            : balance < -0.01
                            ? `應付 -${formatMoney(Math.abs(balance), settlementCurrency)}`
                            : '結算平衡 $0'}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Debt Transfers Suggestions & Copy Button */}
            {settlement.transfers.length > 0 ? (
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-primary-600" />
                    <span>清算轉帳建議 (最少筆數)</span>
                  </span>
                  <button
                    id="btn-copy-all-transfers"
                    onClick={handleCopyAllTransfers}
                    className="text-[11px] font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
                    title="複製全員平帳結算明細"
                  >
                    {copiedAllTransfers ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600">已複製！</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>複製全員結算單</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-1.5">
                  {settlement.transfers.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-lg border border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
                        <span className="font-bold">{t.from}</span>
                        <span className="text-neutral-400">➜</span>
                        <span className="font-bold">{t.to}</span>
                      </div>
                      <span className="font-mono font-bold text-primary-600 dark:text-primary-400">
                        {formatMoney(t.amount, settlementCurrency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 text-center py-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>全員帳目目前完全平衡，無需轉帳！</span>
              </div>
            )}
          </div>

          {/* Category Breakdown Bar Chart */}
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary-600" />
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">分類消費佔比</h3>
            </div>

                        <div className="h-64 w-full mt-4">
              {pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number) => formatMoney(value, trip.baseCurrency)}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500 space-y-2">
                  <PieChart className="w-8 h-8 opacity-20" />
                  <p className="text-xs">尚無消費記錄</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Member Management Modal (Add/Edit Users) */}
      <MemberManageModal
        trip={trip}
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        onUpdateTrip={onUpdateTrip}
      />

      {/* Itemized Member AA Settlement Breakdown Modal */}
      {selectedSettlementMember && (
        <MemberSettlementModal
          trip={trip}
          isOpen={!!selectedSettlementMember}
          selectedMemberName={selectedSettlementMember}
          onSelectMember={(name) => setSelectedSettlementMember(name)}
          onClose={() => setSelectedSettlementMember(null)}
          settlement={settlement}
          settlementCurrency={settlementCurrency}
          rates={currencyRates}
        />
      )}
    
      <ConfirmModal
        isOpen={!!deleteConfirmId}
        title="確認刪除"
        message="您確定要刪除此項目嗎？此操作無法復原。"
        onConfirm={() => {
          if (deleteConfirmId) {
            handleDeleteExpense(deleteConfirmId);
            setDeleteConfirmId(null);
          }
        }}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
};