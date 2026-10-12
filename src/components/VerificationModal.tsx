import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Wrench,
  X,
  Clock,
  Activity,
  Sparkles,
} from 'lucide-react';
import { Trip } from '../types';
import {
  runAllVerificationTests,
  VerificationSuiteReport,
} from '../services/verificationSuite';
import { syncTripDatesAndDays, addMinsToTime } from '../services/itineraryUtils';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  onUpdateTrip: (updated: Trip) => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  trip,
  onUpdateTrip,
}) => {
  const [report, setReport] = useState<VerificationSuiteReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [autoFixedMessage, setAutoFixedMessage] = useState('');

  const executeTests = (targetTrip: Trip = trip) => {
    setIsRunning(true);
    setTimeout(() => {
      const res = runAllVerificationTests(targetTrip);
      setReport(res);
      setIsRunning(false);
    }, 180);
  };

  useEffect(() => {
    if (isOpen) {
      setAutoFixedMessage('');
      executeTests(trip);
    }
  }, [isOpen, trip]);

  if (!isOpen) return null;

  const handleAutoRepairCurrentTrip = () => {
    // Sync start/end dates and sequential day dates, plus fix any inverted item times
    const repaired = syncTripDatesAndDays(trip, trip.startDate, undefined, true);
    repaired.days = repaired.days.map((d) => ({
      ...d,
      items: d.items
        .map((it) => {
          if (it.endTime && it.endTime < it.time) {
            return { ...it, endTime: addMinsToTime(it.time, 60) };
          }
          return it;
        })
        .sort((a, b) => a.time.localeCompare(b.time)),
    }));
    onUpdateTrip(repaired);
    setAutoFixedMessage('已自動校準目前行程的所有日期連續性與活動時段！');
    executeTests(repaired);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-neutral-900 via-primary-950 to-neutral-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white tracking-tight flex items-center gap-2">
                <span>系統操作與常理邏輯自動化驗證中心</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Self-Diagnostics
                </span>
              </h3>
              <p className="text-xs text-neutral-300 mt-0.5">
                即時驗證行程日期連動、時段合理性、匯率轉換與 AA 分帳演算法
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Bar */}
        {report && (
          <div className="p-4 bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    report.failedChecks === 0 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                  }`}
                />
                <span className="text-sm font-black text-neutral-900 dark:text-white">
                  {report.failedChecks === 0
                    ? `全數通過 (${report.passedChecks}/${report.totalChecks})`
                    : `發現 ${report.failedChecks} 項異常 (${report.passedChecks}/${report.totalChecks} 通過)`}
                </span>
              </div>
              <span className="text-xs text-neutral-400 dark:text-neutral-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                最後檢測：{report.timestamp}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {report.failedChecks > 0 && (
                <button
                  type="button"
                  onClick={handleAutoRepairCurrentTrip}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>一鍵自動修復行程日期與時段</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => executeTests(trip)}
                disabled={isRunning}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                <span>{isRunning ? '驗證執行中...' : '重新執行全套測試'}</span>
              </button>
            </div>
          </div>
        )}

        {autoFixedMessage && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span>{autoFixedMessage}</span>
          </div>
        )}

        {/* Test Results List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {report?.results.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all ${
                item.passed
                  ? 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
                  : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {item.passed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                        {item.category}
                      </span>
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                        {item.name}
                      </h4>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {item.description}
                    </p>
                    <div
                      className={`mt-2 p-2.5 rounded-xl text-xs font-mono ${
                        item.passed
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/50'
                          : 'bg-rose-100/70 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      }`}
                    >
                      {item.passed ? `✓ 驗證通過：${item.details}` : `✕ 異常原因：${item.details}`}
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-neutral-400 flex-shrink-0">
                  {item.durationMs} ms
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-primary-600" />
            <span>可於 CLI 執行 <code className="font-mono bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 rounded">npm test</code> 進行自動化驗證</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 transition-all cursor-pointer"
          >
            完成並關閉
          </button>
        </div>
      </div>
    </div>
  );
};
