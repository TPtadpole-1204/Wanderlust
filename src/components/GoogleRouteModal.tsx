import React from 'react';
import {
  X,
  ExternalLink,
  Navigation,
  Check,
  Sparkles,
  MapPin,
  Clock,
  Compass,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import type { TransportOption } from '../types.ts';
import {
  getGoogleRouteRecommendations,
  GoogleRouteOption,
  RoutePlace,
} from '../services/googleRouteService.ts';

interface GoogleRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromItem: RoutePlace;
  toItem: RoutePlace;
  destinationCity?: string;
  onApplyRoute?: (selectedOption: {
    mode: TransportOption['mode'];
    durationMinutes: number;
    distanceText?: string;
    routeUrl: string;
    label: string;
  }) => void;
}

export const GoogleRouteModal: React.FC<GoogleRouteModalProps> = ({
  isOpen,
  onClose,
  fromItem,
  toItem,
  destinationCity,
  onApplyRoute,
}) => {
  if (!isOpen) return null;

  const plan = getGoogleRouteRecommendations(fromItem, toItem, destinationCity);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-primary-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center shadow-xs">
              <Navigation className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm sm:text-base leading-tight">Google 推薦路線</h3>
                <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold tracking-wide uppercase">
                  Live Routes
                </span>
              </div>
              <p className="text-white/80 text-xs mt-0.5">即時路線推薦、班次轉乘與耗時預估</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="關閉"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Origin & Destination Route Bar */}
        <div className="p-4 bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-950/50" />
              <div className="w-0.5 h-6 bg-neutral-300 dark:bg-neutral-700 my-0.5" />
              <div className="w-3 h-3 rounded-full bg-rose-500 ring-4 ring-rose-100 dark:ring-rose-950/50" />
            </div>

            <div className="flex-1 min-w-0 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-800 dark:text-neutral-200 truncate" title={plan.originName}>
                  {plan.originName}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-md">
                  起點
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-800 dark:text-neutral-200 truncate" title={plan.destinationName}>
                  {plan.destinationName}
                </span>
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded-md">
                  目的地
                </span>
              </div>
            </div>

            <div className="border-l border-neutral-200 dark:border-neutral-800 pl-3 flex flex-col items-center justify-center flex-shrink-0">
              <span className="text-[10px] text-neutral-400">距離約</span>
              <span className="font-mono text-sm font-bold text-primary-600 dark:text-primary-400">
                {plan.options[0]?.distanceText || `${plan.straightDistanceKm} km`}
              </span>
            </div>
          </div>
        </div>

        {/* Route options list */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Google 推薦交通方案
            </span>
            <span className="text-[11px] text-neutral-400">點擊可直接在 Google Maps 導航</span>
          </div>

          {plan.options.map((option, idx) => {
            return (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border transition-all ${
                  option.recommended
                    ? 'border-primary-300 dark:border-primary-700 bg-primary-50/40 dark:bg-primary-950/20 shadow-xs'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="text-2xl flex-shrink-0">{option.icon}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                          {option.modeLabel}
                        </span>
                        {option.recommended && (
                          <span className="px-2 py-0.5 rounded-full bg-primary-600 text-white text-[10px] font-bold flex items-center gap-0.5 shadow-2xs">
                            <Sparkles className="w-2.5 h-2.5" />
                            推薦首選
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                        <span className="flex items-center gap-1 font-mono font-bold text-neutral-800 dark:text-neutral-200">
                          <Clock className="w-3.5 h-3.5 text-primary-500" />
                          {option.durationText}
                        </span>
                        <span>•</span>
                        <span>約 {option.distanceText}</span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 leading-relaxed">
                        {option.notes}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between gap-2 flex-wrap">
                  <a
                    href={option.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <span>開啟 Google Maps 路線</span>
                    <ExternalLink className="w-3 h-3 text-neutral-400" />
                  </a>

                  {onApplyRoute && (
                    <button
                      type="button"
                      onClick={() => {
                        onApplyRoute({
                          mode: option.mode,
                          durationMinutes: option.durationMinutes,
                          distanceText: option.distanceText,
                          routeUrl: option.googleMapsUrl,
                          label: `Google 推薦 ${option.modeLabel.split(' ')[1] || '路線'}`,
                        });
                        onClose();
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>套用至行程</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2">
          <a
            href={plan.googleMapsUniversalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 font-bold"
          >
            <span>在 Google Maps 查看所有推薦與即時路況</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
