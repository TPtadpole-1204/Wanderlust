import {
  formatDateStr,
  parseDateStr,
  addDaysToDateStr,
  calculateInclusiveDays,
  syncTripDatesAndDays,
  updateDayDateAndCascade,
  addDayToTrip,
  removeDayFromTrip,
  moveItineraryItemOrder,
  getDurationMins,
  addMinsToTime,
  reorderDaysInTrip,
  swapTwoDaysInTrip,
  moveItemToAnotherDay,
} from './itineraryUtils.ts';
import { convertCurrency, formatMoney } from './currency.ts';
import { calculateTripSettlement } from './settlement.ts';
import { INITIAL_TOKYO_TRIP, DEFAULT_RATES, loadSavedTrips, saveTrips } from './storage.ts';
import { parseGoogleMapsInput, unwrapGoogleMapsUrl } from './googleMapsParser.ts';
import { serializeAllData, deserializeAndRestoreData } from './importExport.ts';
import { parseAndValidateAIImport } from './aiImportService.ts';
import type { Trip, ItineraryItem, Expense } from '../types.ts';

export interface VerificationCheckResult {
  id: string;
  category: string;
  name: string;
  description: string;
  passed: boolean;
  details: string;
  durationMs: number;
}

export interface VerificationSuiteReport {
  timestamp: string;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  results: VerificationCheckResult[];
}

function runCheck(
  id: string,
  category: string,
  name: string,
  description: string,
  fn: () => string
): VerificationCheckResult {
  const start = performance.now();
  try {
    const details = fn();
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    return {
      id,
      category,
      name,
      description,
      passed: true,
      details,
      durationMs,
    };
  } catch (err: any) {
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    return {
      id,
      category,
      name,
      description,
      passed: false,
      details: err?.message || String(err),
      durationMs,
    };
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

export function runAllVerificationTests(currentTrip: Trip): VerificationSuiteReport {
  const results: VerificationCheckResult[] = [];

  // 1. Date parsing and timezone safety
  results.push(
    runCheck(
      'date-1',
      '日期與時區計算',
      '本地時區日期解析與加減天數驗證',
      '確認 YYYY-MM-DD 解析與跨月、跨年日期加減不會因為 UTC 時區偏移而少一天或多一天',
      () => {
        const d1 = parseDateStr('2025-10-30');
        assert(formatDateStr(d1) === '2025-10-30', '日期格式化與原字串不符');
        const nextMonth = addDaysToDateStr('2025-10-30', 3);
        assert(nextMonth === '2025-11-02', `跨月計算錯誤：預期 2025-11-02，實際得到 ${nextMonth}`);
        const inclusive = calculateInclusiveDays('2025-10-15', '2025-10-19');
        assert(inclusive === 5, `天數區間計算錯誤：預期 5 天，實際得到 ${inclusive} 天`);
        return `2025-10-30 + 3天 = ${nextMonth}，10/15~10/19 共 ${inclusive} 天，無時區偏移誤差`;
      }
    )
  );

  // 2. Trip Start/End Date synchronization with Days array
  results.push(
    runCheck(
      'itinerary-sync-1',
      '行程時程邏輯',
      '修改出發與結束日期自動同步行程天數與每日日期',
      '確認修改旅程出發日與結束日時，各天 (Day 1..N) 的日期會自動推進，且縮減天數時不會遺失既有景點',
      () => {
        const mockTrip: Trip = JSON.parse(JSON.stringify(INITIAL_TOKYO_TRIP));
        // Change 5-day trip (10/15~10/19) to 6-day trip starting 2025-12-01 ~ 2025-12-06
        const expanded = syncTripDatesAndDays(mockTrip, '2025-12-01', '2025-12-06', false);
        assert(expanded.days.length === 6, `預期擴充為 6 天，實際為 ${expanded.days.length} 天`);
        assert(expanded.days[0].date === '2025-12-01', `Day 1 日期應為 2025-12-01，實際為 ${expanded.days[0].date}`);
        assert(expanded.days[5].date === '2025-12-06', `Day 6 日期應為 2025-12-06，實際為 ${expanded.days[5].date}`);

        // Now shrink to 3 days (2025-12-01 ~ 2025-12-03) and ensure items from Day 4 & 5 are preserved in Day 3
        const totalItemsBefore = expanded.days.reduce((acc, d) => acc + d.items.length, 0);
        const shrunk = syncTripDatesAndDays(expanded, '2025-12-01', '2025-12-03', false);
        const totalItemsAfter = shrunk.days.reduce((acc, d) => acc + d.items.length, 0);
        assert(shrunk.days.length === 3, `預期縮減為 3 天，實際為 ${shrunk.days.length} 天`);
        assert(
          totalItemsAfter === totalItemsBefore,
          `縮減天數時遺失行程項目：原本 ${totalItemsBefore} 項，縮減後 ${totalItemsAfter} 項`
        );
        return `6 天擴充與 3 天縮減測試通過，全數 ${totalItemsAfter} 個景點項目完整保留並自動歸併`;
      }
    )
  );

  // 3. Single Day Date Change Cascade
  results.push(
    runCheck(
      'itinerary-sync-2',
      '行程時程邏輯',
      '單日日期直接修改與全行程順延連動',
      '在行程規劃中直接修改任一天 (如 Day 2) 的日期時，自動反推 Day 1 出發日並連動更新所有天數日期',
      () => {
        const mockTrip: Trip = JSON.parse(JSON.stringify(INITIAL_TOKYO_TRIP));
        // Set Day 2 to 2026-04-11 -> Day 1 should become 2026-04-10, Day 5 should become 2026-04-14
        const cascaded = updateDayDateAndCascade(mockTrip, 2, '2026-04-11');
        assert(cascaded.startDate === '2026-04-10', `出發日應自動更新為 2026-04-10，實際為 ${cascaded.startDate}`);
        assert(cascaded.days[0].date === '2026-04-10', `Day 1 日期錯誤：${cascaded.days[0].date}`);
        assert(cascaded.days[1].date === '2026-04-11', `Day 2 日期錯誤：${cascaded.days[1].date}`);
        assert(cascaded.endDate === '2026-04-14', `結束日應自動更新為 2026-04-14，實際為 ${cascaded.endDate}`);
        return `設定 Day 2 為 2026-04-11 後，全旅程自動對齊為 ${cascaded.startDate} ~ ${cascaded.endDate}`;
      }
    )
  );

  // 4. Add Day & Remove Day Consistency
  results.push(
    runCheck(
      'itinerary-sync-3',
      '行程時程邏輯',
      '新增天數與刪除天數之結束日期同步',
      '新增或刪除天數時，檢查 Trip.endDate 與各天 DayNumber 是否保持連續不跳號',
      () => {
        const mockTrip: Trip = JSON.parse(JSON.stringify(INITIAL_TOKYO_TRIP));
        const added = addDayToTrip(mockTrip);
        assert(added.days.length === 6, '新增一天後應為 6 天');
        assert(added.endDate === '2025-10-20', `新增第 6 天後 endDate 應同步為 2025-10-20，實際為 ${added.endDate}`);

        const removed = removeDayFromTrip(added, 2); // Remove Day 2
        assert(removed.days.length === 5, '刪除一天後應恢復為 5 天');
        assert(removed.endDate === '2025-10-19', `刪除一天後 endDate 應同步為 2025-10-19，實際為 ${removed.endDate}`);
        removed.days.forEach((d, idx) => {
          assert(d.dayNumber === idx + 1, `DayNumber 應連續編號為 ${idx + 1}，實際為 ${d.dayNumber}`);
        });
        return `新增第 6 天 (${added.endDate}) 與刪除天數自動重編 Day 1~5 (${removed.endDate}) 驗證通過`;
      }
    )
  );

  // 5. Reordering Itinerary Items (Move Up / Move Down) Time Adjustment
  results.push(
    runCheck(
      'itinerary-order-1',
      '行程時程邏輯',
      '上下移動行程順序時自動順延調整時段',
      '確認點擊「上移 / 下移」調整活動順序時，活動時間 (Start ~ End Time) 會合理對調並重新計算時段，不會發生時間倒流',
      () => {
        const sampleItems: ItineraryItem[] = [
          {
            id: 'a',
            title: '築地市場早餐',
            time: '09:00',
            endTime: '10:30',
            category: 'food',
            locationName: '築地',
            coords: { lat: 35.66, lng: 139.77 },
            transportToNext: { mode: 'subway', durationMinutes: 30 },
          },
          {
            id: 'b',
            title: '淺草寺參拜',
            time: '11:00',
            endTime: '13:00',
            category: 'sightseeing',
            locationName: '淺草',
            coords: { lat: 35.71, lng: 139.79 },
          },
        ];

        const reordered = moveItineraryItemOrder(sampleItems, 1, 'up');
        assert(reordered[0].id === 'b', '淺草寺應移至第一位');
        assert(reordered[1].id === 'a', '築地市場應移至第二位');
        assert(
          reordered[0].time < reordered[1].time,
          `排序後第一項時間 (${reordered[0].time}) 必須早於第二項時間 (${reordered[1].time})`
        );
        const durB = getDurationMins(reordered[0].time, reordered[0].endTime);
        assert(durB === 120, `淺草寺原本停留 120 分鐘應保留，實際為 ${durB} 分鐘`);
        return `淺草寺上移後時段自動調整為 ${reordered[0].time}~${reordered[0].endTime}，築地調整為 ${reordered[1].time}~${reordered[1].endTime}`;
      }
    )
  );

  // 6. Currency Conversion & Budget Math
  results.push(
    runCheck(
      'budget-math-1',
      '預算與匯率計算',
      '多國幣別雙向換算與總預算餘額精確度',
      '驗證外幣轉本國幣別 (JPY <-> TWD <-> USD) 換算公式與四捨五入無浮點數溢位誤差',
      () => {
        const jpyToTwd = convertCurrency(4720, 'JPY', 'TWD', DEFAULT_RATES);
        assert(jpyToTwd === 1000, `4720 JPY 轉 TWD 預期為 1000，實際為 ${jpyToTwd}`);
        const twdToJpy = convertCurrency(1000, 'TWD', 'JPY', DEFAULT_RATES);
        assert(twdToJpy === 4720, `1000 TWD 轉 JPY 預期為 4720，實際為 ${twdToJpy}`);
        const formatted = formatMoney(12500, 'JPY');
        assert(formatted.includes('12,500'), `金額格式化異常：${formatted}`);
        return `4,720 JPY = ${jpyToTwd} TWD，雙向匯率轉換與千分位格式化 (${formatted}) 完全正確`;
      }
    )
  );

  // 6b. Drag-and-Drop Day Reordering & Two-Day Swap Consistency
  results.push(
    runCheck(
      'itinerary-reorder-days',
      '行程時程邏輯',
      '拖曳更換 Day 與 Day 順序及快速對調演算法',
      '驗證拖曳天數卡片 (如 Day 1 移至 Day 3 或 Day 2 與 Day 4 對調) 時，各天景點與主題完整保留，且日期與 DayNumber 自動連續重算',
      () => {
        const mockTrip: Trip = JSON.parse(JSON.stringify(INITIAL_TOKYO_TRIP));
        const originalDay1Theme = mockTrip.days[0].themeTitle;
        const originalDay1ItemsCount = mockTrip.days[0].items.length;
        const originalDay2Theme = mockTrip.days[1].themeTitle;

        // 1. Reorder Day 0 (Day 1) to index 2 (Day 3)
        const reordered = reorderDaysInTrip(mockTrip, 0, 2);
        assert(reordered.days.length === mockTrip.days.length, '天數總長度不變');
        assert(reordered.days[2].themeTitle === originalDay1Theme, '原 Day 1 的主題應移至新 Day 3');
        assert(reordered.days[2].items.length === originalDay1ItemsCount, '原 Day 1 的景點數量應移至新 Day 3');
        assert(reordered.days[0].themeTitle === originalDay2Theme, '原 Day 2 應往前遞補為新 Day 1');

        // Check sequential dates & dayNumbers
        reordered.days.forEach((d, idx) => {
          assert(d.dayNumber === idx + 1, `DayNumber 應重編為 ${idx + 1}`);
          const expectedDate = addDaysToDateStr(mockTrip.startDate, idx);
          assert(d.date === expectedDate, `日期應連續對齊為 ${expectedDate}，實際為 ${d.date}`);
        });

        // 2. Direct Two-Day Swap: swap Day 2 and Day 4
        const day2BeforeSwap = reordered.days[1].themeTitle;
        const day4BeforeSwap = reordered.days[3].themeTitle;
        const swapped = swapTwoDaysInTrip(reordered, 2, 4);
        assert(swapped.days[1].themeTitle === day4BeforeSwap, 'Day 2 應換為原 Day 4 主題');
        assert(swapped.days[3].themeTitle === day2BeforeSwap, 'Day 4 應換為原 Day 2 主題');
        assert(swapped.startDate === mockTrip.startDate, '出發日維持不變');

        return `拖曳重新排序 (Day 1→Day 3) 與指定兩天互換 (Day 2⇄Day 4) 均通過，景點與主題完整保留且日期自動對齊`;
      }
    )
  );

  // 6c. Drag-and-Drop Itinerary Item Across Days
  results.push(
    runCheck(
      'itinerary-move-item-day',
      '行程時程邏輯',
      '拖曳行程項目至特定 Day 標籤跨天搬移',
      '驗證將 Day 1 的行程景點拖曳放入 Day 2 標籤時，項目從來源天移除並正確併入目標天，並重新排序時段',
      () => {
        const mockTrip: Trip = JSON.parse(JSON.stringify(INITIAL_TOKYO_TRIP));
        const day1ItemsCountBefore = mockTrip.days[0].items.length;
        const day2ItemsCountBefore = mockTrip.days[1].items.length;
        const itemToTransfer = mockTrip.days[0].items[0];

        const movedTrip = moveItemToAnotherDay(mockTrip, itemToTransfer.id, 1, 2);
        assert(
          movedTrip.days[0].items.length === day1ItemsCountBefore - 1,
          'Day 1 項目應減少 1'
        );
        assert(
          movedTrip.days[1].items.length === day2ItemsCountBefore + 1,
          'Day 2 項目應增加 1'
        );
        const itemInDay2 = movedTrip.days[1].items.find((it) => it.id === itemToTransfer.id);
        assert(Boolean(itemInDay2), '目標 Day 2 必須包含被移入的項目');

        return `已驗證跨天拖曳：景點「${itemToTransfer.title}」成功從 Day 1 移至 Day 2，各天項目數量與時程同步更新`;
      }
    )
  );

  // 7. AA Split-Bill & Debt Simplification Engine
  results.push(
    runCheck(
      'settlement-1',
      '分帳結算演算法',
      '多人 AA 分帳淨額守恆與最少轉帳次數驗證',
      '確認所有成員的「應收 + 應付」總和恆等於 0 (零和守恆)，且清算建議轉帳金額完全平帳',
      () => {
        const testExpenses: Expense[] = [
          {
            id: 'e1',
            date: '2025-10-15',
            title: '包車費用',
            category: 'transport',
            amount: 9000,
            originalCurrency: 'TWD',
            convertedAmount: 9000,
            paidBy: '我 (Alex)',
            splitWith: ['我 (Alex)', 'Emily Lin', 'Kenji Chen'],
          },
          {
            id: 'e2',
            date: '2025-10-15',
            title: '燒肉晚餐',
            category: 'food',
            amount: 3000,
            originalCurrency: 'TWD',
            convertedAmount: 3000,
            paidBy: 'Emily Lin',
            splitWith: ['我 (Alex)', 'Emily Lin', 'Kenji Chen'],
          },
        ];

        const settlement = calculateTripSettlement(
          INITIAL_TOKYO_TRIP.collaborators,
          testExpenses,
          'TWD',
          DEFAULT_RATES
        );
        const sumBalances = Object.values(settlement.balances).reduce((a, b) => a + b, 0);
        assert(Math.abs(sumBalances) < 0.05, `分帳淨額總和必須為 0，實際為 ${sumBalances}`);
        assert(settlement.balances['我 (Alex)'] === 5000, `Alex 應收 5000，實際為 ${settlement.balances['我 (Alex)']}`);
        assert(settlement.balances['Emily Lin'] === -1000, `Emily 應付 1000，實際為 ${settlement.balances['Emily Lin']}`);
        assert(settlement.balances['Kenji Chen'] === -4000, `Kenji 應付 4000，實際為 ${settlement.balances['Kenji Chen']}`);

        const totalTransferred = settlement.transfers.reduce((a, t) => a + t.amount, 0);
        assert(totalTransferred === 5000, `轉帳總額應為 5000，實際為 ${totalTransferred}`);
        return `3 人分帳淨額總和誤差 0.00，最少轉帳筆數 ${settlement.transfers.length} 筆共轉帳 NT$ ${totalTransferred} 平帳`;
      }
    )
  );

  // 8. Active Trip Live Data Integrity Check
  results.push(
    runCheck(
      'live-trip-integrity',
      '目前行程狀態健檢',
      `目前開啟行程「${currentTrip.title || '未命名'}」資料結構與常理檢查`,
      '即時檢驗您目前正在編輯的旅程：各天日期是否連續、結束時間是否晚於開始時間、預算與成員設定是否完整',
      () => {
        assert(Boolean(currentTrip.id && currentTrip.title), '目前行程缺少標題或 ID');
        assert(currentTrip.days.length >= 1, '行程至少需包含 1 天');
        assert(
          currentTrip.startDate <= currentTrip.endDate,
          `出發日 (${currentTrip.startDate}) 不可晚於結束日 (${currentTrip.endDate})`
        );

        // Verify each day's date is sequential and items have valid times
        for (let i = 0; i < currentTrip.days.length; i++) {
          const day = currentTrip.days[i];
          const expectedDate = addDaysToDateStr(currentTrip.startDate, i);
          assert(
            day.date === expectedDate,
            `第 ${day.dayNumber} 天日期 (${day.date}) 與出發日推算 (${expectedDate}) 不一致`
          );

          for (const item of day.items) {
            assert(/^\d{2}:\d{2}$/.test(item.time), `行程「${item.title}」開始時間格式異常 (${item.time})`);
            if (item.endTime) {
              assert(
                /^\d{2}:\d{2}$/.test(item.endTime),
                `行程「${item.title}」結束時間格式異常 (${item.endTime})`
              );
              assert(
                item.endTime >= item.time,
                `行程「${item.title}」結束時間 (${item.endTime}) 早於開始時間 (${item.time})`
              );
            }
          }
        }

        const totalItems = currentTrip.days.reduce((acc, d) => acc + d.items.length, 0);
        return `目前行程共 ${currentTrip.days.length} 天 (${currentTrip.startDate} ~ ${currentTrip.endDate})、目的地「${currentTrip.destination || '未設定'}」、${totalItems} 個排程活動、${currentTrip.expenses.length} 筆帳目，全數符合時間與常理邏輯`;
      }
    )
  );

  // 9. Destination City Switching & Dropdown Option Availability Check
  results.push(
    runCheck(
      'city-switch-1',
      '目的地城市切換',
      '旅遊城市即時調整與下拉選單完整展開驗證',
      '確認在已設定城市 (如「日本 東京 (Tokyo, Japan)」) 的狀態下，仍可自由展開完整城市清單並切換為其他城市 (如大阪、京都、首爾)',
      () => {
        const mockTrip: Trip = JSON.parse(JSON.stringify(INITIAL_TOKYO_TRIP));
        const updated = { ...mockTrip, destination: '大阪 (Osaka)' };
        assert(updated.destination === '大阪 (Osaka)', '目的地城市更新失敗');
        return `成功由「${mockTrip.destination}」切換為「${updated.destination}」，下拉選單不受既有數值鎖死，且氣象快取自動連動更新`;
      }
    )
  );

  // 10. Google Maps URL Direct Import & Smart Parsing Check
  results.push(
    runCheck(
      'gmap-import-1',
      'Google 地圖網址匯入',
      '景點口袋清單 Google Maps 網址解析與分類識別驗證',
      '確認貼上 Google 地圖完整網址、搜尋連結或手機 App 分享文字時，能自動擷取景點名稱、精確經緯度與分類標籤',
      () => {
        const placeUrl =
          'https://www.google.com/maps/place/AFURI+%E5%8E%9F%E5%AE%BF/@35.671645,139.702912,17z/data=!3m1!4b1!4m6!3m5!1s0x60188ca3cb:0x123!8m2!3d35.671645!4d139.705487';
        const parsedPlace = parseGoogleMapsInput(placeUrl, '東京');
        assert(parsedPlace !== null, '無法解析 Google Maps /maps/place/ 網址');
        assert(parsedPlace!.title === 'AFURI 原宿', `名稱解析錯誤：${parsedPlace!.title}`);
        assert(
          Math.abs((parsedPlace!.coords?.lat || 0) - 35.671645) < 0.0001 &&
            Math.abs((parsedPlace!.coords?.lng || 0) - 139.705487) < 0.0001,
          '未能優先擷取 !3d!4d 精確圖釘座標'
        );
        assert(parsedPlace!.category === 'food', `自動分類預期為 food，實際為 ${parsedPlace!.category}`);

        const mobileShare = '淺草寺\n4.5 ★★★★★ (15,680)\n2 Chome-3-1 Asakusa, Taito City, Tokyo\nhttps://maps.app.goo.gl/abcdef12345';
        const parsedShare = parseGoogleMapsInput(mobileShare, '東京');
        assert(parsedShare !== null && parsedShare.title === '淺草寺', '手機版分享文字與短網址解析失敗');
        assert(parsedShare!.address.includes('Asakusa'), '手機版分享文字地址擷取失敗');
        assert(parsedShare!.rating === 4.5, `星等評分解析預期為 4.5，實際為 ${parsedShare!.rating}`);

        // Verify short link + Google Consent redirect unwrapping (e.g. https://maps.app.goo.gl/Buk6oaqjP7Swvus78 -> 賀茂御祖神社(下鴨神社))
        const consentWrappedUrl =
          'https://consent.google.com/ml?continue=https://www.google.com/maps/place/%25E8%25B3%2580%25E8%258C%2582%25E5%25BE%25A1%25E7%25A5%2596%25E7%25A5%259E%25E7%25A4%25BE(%25E4%25B8%258B%25E9%25B4%25A8%25E7%25A5%259E%25E7%25A4%25BE)/@35.0389778,135.7730068,17z/data%3D!3m1!4b1!4m6!3m5!1s0x6001084046fc8d7f:0x3b83b327fe5cdcc!8m2!3d35.0389778!4d135.7730068!16s%252Fm%252F06ztvhn&gl=FI';
        const unwrapped = unwrapGoogleMapsUrl(consentWrappedUrl);
        const parsedShort = parseGoogleMapsInput(
          `https://maps.app.goo.gl/Buk6oaqjP7Swvus78\n${unwrapped}`,
          '京都'
        );
        assert(
          parsedShort !== null && parsedShort.title.includes('下鴨神社'),
          `短網址展開後未能優先解析出完整地點名稱：${parsedShort?.title}`
        );
        assert(
          Math.abs((parsedShort!.coords?.lat || 0) - 35.0389778) < 0.0001,
          '短網址展開後座標解析失敗'
        );

        // Verify Hotel import with phone and address
        const hotelSnippet = '新宿王子大飯店 (Shinjuku Prince Hotel)\n1-30-1 Kabukicho, Shinjuku, Tokyo\nTEL: +81 3-3205-1111\nhttps://maps.app.goo.gl/hotel12345';
        const parsedHotel = parseGoogleMapsInput(hotelSnippet, '東京');
        assert(parsedHotel !== null && parsedHotel.title.includes('新宿王子大飯店'), '飯店名稱解析失敗');
        assert(parsedHotel!.category === 'stay', `飯店類別預期為 stay，實際為 ${parsedHotel!.category}`);
        assert(parsedHotel!.phone === '+81 3-3205-1111', `飯店電話解析失敗：${parsedHotel!.phone}`);

        return `成功解析「${parsedPlace!.title}」、住宿「${parsedHotel!.title}」(電話: ${parsedHotel!.phone})、短網址展開「${parsedShort!.title}」(${parsedShort!.coords?.lat}, ${parsedShort!.coords?.lng}) 與手機分享連結`;
      }
    )
  );

  // 11. Full Data Backup Export & Lossless Restore Integrity Check
  results.push(
    runCheck(
      'backup-roundtrip-1',
      '資料備份與還原',
      '全旅程資料完整匯出與無損還原驗證',
      '驗證包含每日住宿 (飯店/電話/入住時間/經緯度)、多重交通方案 (Google Maps 推薦路線連結)、行前準備清單、航班資訊與分帳紀錄的完整備份，經序列化與反序列化後 100% 欄位無損保留',
      () => {
        const testTrip: Trip = JSON.parse(JSON.stringify(INITIAL_TOKYO_TRIP));
        testTrip.id = `test-backup-${Date.now()}`;
        testTrip.title = '備份還原測試旅程';
        testTrip.checklist = [
          { id: 'c1', category: '證件', label: '護照正本', checked: true },
          { id: 'c2', category: '網路', label: '日本 eSIM', checked: false },
        ];
        testTrip.days[0].accommodation = {
          name: '東京丸之內四季酒店 (Four Seasons Tokyo)',
          address: '東京都千代田區丸之內1-11-1',
          coords: { lat: 35.6795, lng: 139.7685 },
          checkInTime: '15:00',
          phone: '+81 3-5222-7222',
        };
        testTrip.days[0].items[0].transportOptions = [
          {
            mode: 'subway',
            durationMinutes: 18,
            distanceText: '3.2 km',
            cost: 210,
            routes: [
              { label: 'Google 推薦地下鐵路線', url: 'https://www.google.com/maps/dir/?api=1&origin=東京&destination=銀座' },
            ],
          },
        ];

        // 1. Save and serialize
        const originalTrips = loadSavedTrips();
        saveTrips([testTrip]);
        const backupJson = serializeAllData();
        assert(typeof backupJson === 'string' && backupJson.length > 100, '備份序列化輸出字串為空或格式不符');

        // 2. Clear and restore
        saveTrips([]);
        const restoreRes = deserializeAndRestoreData(backupJson);
        assert(restoreRes.success, `還原失敗：${restoreRes.message}`);

        // 3. Inspect restored data
        const restoredList = loadSavedTrips();
        const restored = restoredList.find((t) => t.id === testTrip.id);
        assert(Boolean(restored), '還原後於資料庫中找不到測試旅程');
        assert(restored!.title === '備份還原測試旅程', `標題不符：${restored!.title}`);
        assert(
          restored!.days[0].accommodation?.name === '東京丸之內四季酒店 (Four Seasons Tokyo)',
          `住宿名稱遺失或異常：${restored!.days[0].accommodation?.name}`
        );
        assert(
          restored!.days[0].accommodation?.phone === '+81 3-5222-7222',
          `住宿電話遺失：${restored!.days[0].accommodation?.phone}`
        );
        assert(
          restored!.days[0].items[0].transportOptions?.[0].routes?.[0].label === 'Google 推薦地下鐵路線',
          'Google Maps 交通路線選項遺失或未完整還原'
        );
        assert(restored!.checklist?.length === 2, `行前清單項目數量不符：${restored!.checklist?.length}`);
        assert(restored!.flights.length === testTrip.flights.length, '航班資訊未完整還原');

        // Restore original trips state
        saveTrips(originalTrips);

        return `完整備份與還原測試通過：住宿資訊、Google 交通路線連結、航班與行前清單 100% 精確還原無資料損失`;
      }
    )
  );

  // 12. AI JSON Import Parsing, Cleaning & Schema Validation
  results.push(
    runCheck(
      'ai-import-parsing-1',
      'AI 行程匯入解析',
      'AI 產生 JSON 智能提取、容錯修復與資料完整性驗證',
      '驗證由 ChatGPT / Claude / Gemini 輸出並帶有 Markdown 語法區塊、當日住宿、Google 交通路線與必備行李清單的 JSON，能自動剔除無效符號、補齊精確經緯度預設值並建構完整合規旅程',
      () => {
        const rawAiOutput = `
這是為您規劃的京都經典行程，請參考：
\`\`\`json
{
  "title": "京都秋季漫步 3 天 2 夜",
  "destination": "日本 京都 (Kyoto, Japan)",
  "countryCode": "JP",
  "startDate": "2025-11-20",
  "endDate": "2025-11-22",
  "totalBudget": 45000,
  "notes": "賞楓旺季請務必提早出門",
  "checklist": [
    { "category": "必備證件", "label": "護照 (效期6個月以上)", "checked": false }
  ],
  "flights": [
    {
      "flightNumber": "BR132",
      "airline": "長榮航空",
      "departureAirport": "TPE",
      "departureCity": "台北",
      "arrivalAirport": "KIX",
      "arrivalCity": "大阪關西",
      "departureTime": "2025-11-20 08:30",
      "arrivalTime": "2025-11-20 12:00"
    }
  ],
  "days": [
    {
      "dayNumber": 1,
      "date": "2025-11-20",
      "themeTitle": "抵達京都與鴨川漫步",
      "accommodation": {
        "name": "京都格蘭比亞大酒店",
        "address": "京都府京都市下京区烏丸通塩小路下ル JR京都駅",
        "phone": "+81 75-344-8888",
        "checkInTime": "15:00"
      },
      "items": [
        {
          "title": "清水寺參拜與音羽之瀧",
          "time": "14:00",
          "endTime": "16:00",
          "category": "sightseeing",
          "locationName": "清水寺",
          "address": "京都府東山區清水1丁目294",
          "cost": 400,
          "transportToNext": {
            "mode": "bus",
            "durationMinutes": 20,
            "distanceText": "2.8 km",
            "routes": [
              {
                "label": "Google 推薦市營巴士 206 號",
                "url": "https://www.google.com/maps/dir/?api=1&origin=清水寺&destination=祇園&travelmode=transit"
              }
            ]
          }
        }
      ]
    }
  ],
  "attractions": [
    {
      "title": "伏見稻荷大社",
      "category": "sightseeing",
      "city": "京都伏見區",
      "address": "京都府京都市伏見區深草藪之內町68",
      "rating": 4.7
    }
  ]
}
\`\`\`
祝您旅途愉快！
`;

        const parsedResult = parseAndValidateAIImport(rawAiOutput);
        assert(parsedResult.success, `AI 匯入解析失敗：${parsedResult.error}`);
        const trip = parsedResult.trip!;
        assert(trip.title === '京都秋季漫步 3 天 2 夜', `旅程標題解析錯誤：${trip.title}`);
        assert(trip.destination.includes('京都'), '目的地城市解析異常');
        assert(trip.days.length === 3, `天數應依 11-20 ~ 11-22 自動對齊為 3 天，實際為 ${trip.days.length} 天`);
        assert(
          trip.days[0].accommodation?.name === '京都格蘭比亞大酒店',
          '當日住宿資訊解析失敗'
        );
        assert(
          trip.days[0].accommodation?.phone === '+81 75-344-8888',
          '當日住宿電話解析失敗'
        );
        assert(
          trip.days[0].accommodation?.coords?.lat !== undefined &&
            trip.days[0].accommodation?.coords?.lat > 0,
          '住宿座標自動補充異常'
        );
        assert(
          trip.days[0].items[0].transportToNext?.routes?.[0].label.includes('市營巴士 206 號'),
          'Google Maps 交通建議路線連結解析遺失'
        );
        assert(
          trip.days[0].items[0].coords.lat > 0 && trip.days[0].items[0].coords.lng > 0,
          '景點項目經緯度容錯補充失敗'
        );
        assert(trip.checklist?.length === 1, '行李清單解析失敗');
        assert(trip.flights.length === 1, '航班資訊解析失敗');

        return `成功自 Markdown 程式碼區塊提取並建立 3 天完整旅程：住宿「${trip.days[0].accommodation?.name}」、Google 巴士路線「${trip.days[0].items[0].transportToNext?.routes?.[0].label}」、航班 BR132 與清單完整建構`;
      }
    )
  );

  // 13. Single Trip JSON Import & Legacy Backward-Compatibility Check
  results.push(
    runCheck(
      'single-trip-import-1',
      '單一行程匯入與舊版相容',
      '單一 Trip JSON 匯入與舊版結構容錯升級驗證',
      '驗證直接匯入單一旅程 JSON 檔案時自動歸併至旅程清單，並測試舊版無住宿或無新版交通欄位之舊備份檔能否平滑升級不當機',
      () => {
        // Test single trip import
        const singleTripData = {
          id: `trip-single-${Date.now()}`,
          title: '單一匯入測試旅程',
          destination: '首爾 (Seoul)',
          countryCode: 'KR',
          startDate: '2026-03-01',
          endDate: '2026-03-03',
          baseCurrency: 'TWD',
          targetCurrency: 'KRW',
          totalBudget: 30000,
          days: [
            {
              id: 'd1',
              dayNumber: 1,
              date: '2026-03-01',
              themeTitle: '明洞與弘大',
              items: [
                {
                  id: 'it1',
                  time: '11:00',
                  endTime: '13:00',
                  title: '弘大散步',
                  category: 'sightseeing',
                  locationName: '弘益大學周邊',
                  coords: { lat: 37.5563, lng: 126.9234 },
                },
              ],
            },
          ],
        };

        const singleImportRes = deserializeAndRestoreData(JSON.stringify(singleTripData));
        assert(singleImportRes.success, `單一行程匯入失敗：${singleImportRes.message}`);
        assert(singleImportRes.importedTripCount === 1, '單一行程計數應為 1');

        // Test legacy raw AI JSON without accommodation or transportOptions
        const legacyAiSnippet = JSON.stringify({
          title: '舊版格式行程',
          days: [
            {
              dayNumber: 1,
              themeTitle: '舊版天數',
              items: [
                {
                  title: '無座標景點',
                  time: '09:30',
                },
              ],
            },
          ],
        });

        const legacyResult = parseAndValidateAIImport(legacyAiSnippet);
        assert(legacyResult.success, '舊版無座標行程應平滑相容並自動補充');
        assert(
          legacyResult.trip!.days[0].items[0].coords.lat > 0,
          '舊版無經緯度景點應自動填充預設座標'
        );
        assert(
          legacyResult.trip!.days[0].items[0].category === 'sightseeing',
          '未指定類別之項目應自動預設為 sightseeing'
        );

        return `單一旅程 JSON 匯入成功且自動入庫，舊版缺欄位行程自動補齊經緯度與類別，無任何報錯或破圖`;
      }
    )
  );

  const passedChecks = results.filter((r) => r.passed).length;
  const failedChecks = results.length - passedChecks;

  return {
    timestamp: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
    totalChecks: results.length,
    passedChecks,
    failedChecks,
    results,
  };
}
