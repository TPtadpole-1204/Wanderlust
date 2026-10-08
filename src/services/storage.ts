import type { Trip, CurrencyRate } from '../types.ts';

export const DEFAULT_RATES: Record<string, number> = {
  // Base is TWD (New Taiwan Dollar)
  TWD: 1,
  JPY: 4.72,     // 1 TWD ~ 4.72 JPY (or 1 JPY ~ 0.212 TWD)
  USD: 0.031,    // 1 TWD ~ 0.031 USD (or 1 USD ~ 32.2 TWD)
  EUR: 0.029,    // 1 TWD ~ 0.029 EUR (or 1 EUR ~ 34.5 TWD)
  KRW: 42.5,     // 1 TWD ~ 42.5 KRW
  THB: 1.08,     // 1 TWD ~ 1.08 THB
  GBP: 0.024,    // 1 TWD ~ 0.024 GBP
  SGD: 0.042,    // 1 TWD ~ 0.042 SGD
  HKD: 0.24,     // 1 TWD ~ 0.24 HKD
};

export const POPULAR_CURRENCIES: CurrencyRate[] = [
  { code: 'TWD', name: '新台幣', symbol: 'NT$', rateToBaseTWD: 1 },
  { code: 'JPY', name: '日圓', symbol: '¥', rateToBaseTWD: 4.72 },
  { code: 'USD', name: '美元', symbol: '$', rateToBaseTWD: 0.031 },
  { code: 'EUR', name: '歐元', symbol: '€', rateToBaseTWD: 0.029 },
  { code: 'KRW', name: '韓元', symbol: '₩', rateToBaseTWD: 42.5 },
  { code: 'THB', name: '泰銖', symbol: '฿', rateToBaseTWD: 1.08 },
  { code: 'GBP', name: '英鎊', symbol: '£', rateToBaseTWD: 0.024 },
  { code: 'SGD', name: '新加坡幣', symbol: 'S$', rateToBaseTWD: 0.042 },
  { code: 'HKD', name: '港幣', symbol: 'HK$', rateToBaseTWD: 0.24 },
];

export const INITIAL_TOKYO_TRIP: Trip = {
  id: 'trip-tokyo-2025',
  title: '東京楓葉與城市漫遊 5 天 4 夜',
  destination: '日本 東京 (Tokyo, Japan)',
  countryCode: 'JP',
  startDate: '2025-10-15',
  endDate: '2025-10-19',
  coverImage: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1600&q=80',
  baseCurrency: 'TWD',
  targetCurrency: 'JPY',
  totalBudget: 85000,
  shareCode: 'TYO-8892',
  offlineReady: true,
  notes: '記得出發前填寫 Visit Japan Web，並準備 Suica 卡與防風保暖外套。',
  collaborators: [
    {
      id: 'user-1',
      name: '我 (Alex)',
      avatar: '🦊',
      role: 'owner',
      isOnline: true,
      color: '#3B82F6',
      currentViewing: 'Day 1',
    },
    {
      id: 'user-2',
      name: 'Emily Lin',
      avatar: '🐰',
      role: 'editor',
      isOnline: true,
      color: '#EC4899',
      currentViewing: '預算管理',
    },
    {
      id: 'user-3',
      name: 'Kenji Chen',
      avatar: '🐼',
      role: 'editor',
      isOnline: false,
      color: '#10B981',
      currentViewing: 'Day 3',
    },
  ],
  flights: [
    {
      id: 'fl-1',
      flightNumber: 'JX800',
      airline: '星宇航空 Starlux Airlines',
      departureAirport: 'TPE (桃園國際機場 T1)',
      departureCity: '台北 Taipei',
      departureTime: '2025-10-15 08:30',
      arrivalAirport: 'NRT (成田國際機場 T2)',
      arrivalCity: '東京 Tokyo',
      arrivalTime: '2025-10-15 12:45',
      terminal: 'T1 / T2',
      gate: 'B6',
      baggageClaim: 'Belt 4',
      status: 'ON_TIME',
      seat: '12A',
      bookingRef: 'STX8993K',
    },
    {
      id: 'fl-2',
      flightNumber: 'JX801',
      airline: '星宇航空 Starlux Airlines',
      departureAirport: 'NRT (成田國際機場 T2)',
      departureCity: '東京 Tokyo',
      departureTime: '2025-10-19 14:00',
      arrivalAirport: 'TPE (桃園國際機場 T1)',
      arrivalCity: '台北 Taipei',
      arrivalTime: '2025-10-19 16:50',
      terminal: 'T2',
      gate: '68',
      baggageClaim: 'Belt 2',
      status: 'ON_TIME',
      seat: '12B',
      bookingRef: 'STX8993K',
    },
  ],
  days: [
    {
      id: 'day-1',
      dayNumber: 1,
      date: '2025-10-15',
      themeTitle: '抵達東京、入住新宿與澀谷夜景',
      accommodation: {
        name: '新宿燦路都廣場大飯店 (Hotel Sunroute Plaza Shinjuku)',
        address: '2-3-1 Yoyogi, Shibuya-ku, Tokyo',
        coords: { lat: 35.6865, lng: 139.7005 },
        checkInTime: '15:00',
        phone: '+81 3-3375-3211',
      },
      items: [
        {
          id: 'item-1-1',
          time: '13:30',
          endTime: '14:45',
          title: '成田特快 N\'EX 前往新宿',
          category: 'transport',
          locationName: '成田機場第2航廈站',
          coords: { lat: 35.7647, lng: 140.3863 },
          cost: 3200,
          currency: 'JPY',
          notes: '已預約指定席車票，出關後直接前往 B1 JR 售票機取票。',
          transportToNext: {
            mode: 'bullet_train',
            durationMinutes: 65,
            distanceText: '75 km',
          },
        },
        {
          id: 'item-1-2',
          time: '15:00',
          endTime: '15:45',
          title: '飯店 Check-in & 寄放行李',
          category: 'stay',
          locationName: '新宿燦路都廣場大飯店',
          address: '東京都渋谷区代々木2-3-1',
          coords: { lat: 35.6865, lng: 139.7005 },
          notes: '出示 Agoda 訂房確認信，領取房卡。',
          transportToNext: {
            mode: 'subway',
            durationMinutes: 12,
            distanceText: 'JR 山手線 3 站',
          },
        },
        {
          id: 'item-1-3',
          time: '16:30',
          endTime: '18:30',
          title: 'SHIBUYA SKY 展望台俯瞰東京夕陽',
          category: 'sightseeing',
          locationName: '澀谷 Scramble Square 頂樓',
          address: '東京都渋谷区渋谷2-24-12',
          coords: { lat: 35.6585, lng: 139.7013 },
          cost: 2200,
          currency: 'JPY',
          notes: '已購 16:40 預約場次門票，記得攜帶防風外套，不可帶腳架與背包上頂樓。',
          transportToNext: {
            mode: 'walk',
            durationMinutes: 8,
            distanceText: '400 m',
          },
        },
        {
          id: 'item-1-4',
          time: '19:00',
          endTime: '20:30',
          title: '澀谷 炸牛元村 (牛かつ もと村)',
          category: 'food',
          locationName: '牛かつ もと村 渋谷分店',
          address: '東京都渋谷区渋谷3-18-10',
          coords: { lat: 35.6572, lng: 139.7032 },
          cost: 2600,
          currency: 'JPY',
          notes: '石板炙燒炸牛排定食，建議點 1.5 片大份量。',
          transportToNext: {
            mode: 'subway',
            durationMinutes: 15,
            distanceText: 'JR 回新宿',
          },
        },
      ],
    },
    {
      id: 'day-2',
      dayNumber: 2,
      date: '2025-10-16',
      themeTitle: '經典下町風情：淺草寺、晴空塔與秋葉原',
      items: [
        {
          id: 'item-2-1',
          time: '09:00',
          endTime: '11:30',
          title: '淺草寺雷門 & 仲見世商店街',
          category: 'sightseeing',
          locationName: '淺草寺 Senso-ji',
          address: '東京都台東区浅草2-3-1',
          coords: { lat: 35.7147, lng: 139.7966 },
          notes: '抽籤祈福、品嚐人形燒與抹茶冰淇淋。雷門大燈籠拍照留念。',
          transportToNext: {
            mode: 'walk',
            durationMinutes: 20,
            distanceText: '1.4 km 水上步道',
          },
        },
        {
          id: 'item-2-2',
          time: '12:00',
          endTime: '14:30',
          title: '東京晴空塔 Tokyo Skytree & 午餐',
          category: 'sightseeing',
          locationName: '東京晴空塔',
          address: '東京都墨田区押上1-1-2',
          coords: { lat: 35.7100, lng: 139.8107 },
          cost: 3100,
          currency: 'JPY',
          notes: '登 350m 天望甲板與 450m 天望迴廊，晴空塔商場 Solamachi 享用利久牛舌。',
          transportToNext: {
            mode: 'subway',
            durationMinutes: 18,
            distanceText: '半藏門線 / 總武線',
          },
        },
        {
          id: 'item-2-3',
          time: '15:30',
          endTime: '18:30',
          title: '秋葉原電器街 & 扭蛋大樓',
          category: 'shopping',
          locationName: '秋葉原 Radio Kaikan',
          address: '東京都千代田区外神田1-15-16',
          coords: { lat: 35.6983, lng: 139.7719 },
          notes: '尋找最新動漫公仔、任天堂周邊與 Switch 遊戲卡匣。',
          transportToNext: {
            mode: 'subway',
            durationMinutes: 20,
            distanceText: 'JR 山手線回新宿',
          },
        },
        {
          id: 'item-2-4',
          time: '19:30',
          endTime: '21:30',
          title: '新宿歌舞伎町 一蘭拉麵 & 居酒屋',
          category: 'food',
          locationName: '新宿歌舞伎町一番街',
          address: '東京都新宿区歌舞伎町1-22-7',
          coords: { lat: 35.6948, lng: 139.7029 },
          cost: 1800,
          currency: 'JPY',
          notes: '探索新宿繁華夜生活，體驗道地屋台串燒與生啤酒。',
        },
      ],
    },
    {
      id: 'day-3',
      dayNumber: 3,
      date: '2025-10-17',
      themeTitle: '台場 teamLab 沉浸光影與銀座奢華探訪',
      items: [
        {
          id: 'item-3-1',
          time: '10:00',
          endTime: '13:00',
          title: 'teamLab Planets TOKYO 光影展',
          category: 'entertainment',
          locationName: 'teamLab Planets 豐洲',
          address: '東京都江東区豊洲6-1-16',
          coords: { lat: 35.6491, lng: 139.7898 },
          cost: 3800,
          currency: 'JPY',
          notes: '赤腳涉水的光影沉浸體驗，建議穿著便於捲起褲管的衣物。',
          transportToNext: {
            mode: 'subway',
            durationMinutes: 20,
            distanceText: '百合海鷗號至銀座',
          },
        },
        {
          id: 'item-3-2',
          time: '13:30',
          endTime: '15:00',
          title: '銀座 篝 (Ginza Kagari) 雞白湯拉麵',
          category: 'food',
          locationName: '銀座 篝 本店',
          address: '東京都中央区銀座6-4-12',
          coords: { lat: 35.6712, lng: 139.7635 },
          cost: 1600,
          currency: 'JPY',
          notes: '米其林推薦特濃松露雞白湯拉麵，肉質鮮嫩無比。',
          transportToNext: {
            mode: 'walk',
            durationMinutes: 6,
            distanceText: '300 m',
          },
        },
        {
          id: 'item-3-3',
          time: '15:30',
          endTime: '18:30',
          title: 'Ginza Six 購物中心 & 蔦屋書店',
          category: 'shopping',
          locationName: 'GINZA SIX',
          address: '東京都中央区銀座6-10-1',
          coords: { lat: 35.6696, lng: 139.7640 },
          notes: '頂樓花園遠眺東京鐵塔，6 樓蔦屋書店挑選文具與伴手禮。',
        },
      ],
    },
    {
      id: 'day-4',
      dayNumber: 4,
      date: '2025-10-18',
      themeTitle: '原宿明治神宮、表參道咖啡巡禮與下北澤古著',
      items: [
        {
          id: 'item-4-1',
          time: '09:00',
          endTime: '11:00',
          title: '明治神宮 森林散步與參拜',
          category: 'sightseeing',
          locationName: '明治神宮',
          address: '東京都渋谷区代々木神園町1-1',
          coords: { lat: 35.6764, lng: 139.6993 },
          notes: '清晨漫步於都市森林中，觀賞壯觀日本大鳥居。',
          transportToNext: {
            mode: 'walk',
            durationMinutes: 10,
            distanceText: '竹下通入口',
          },
        },
        {
          id: 'item-4-2',
          time: '11:30',
          endTime: '14:30',
          title: '表參道精品街 & Blue Bottle 咖啡',
          category: 'food',
          locationName: 'Blue Bottle Coffee Aoyama Cafe',
          address: '東京都港区南青山3-13-14',
          coords: { lat: 35.6644, lng: 139.7132 },
          cost: 1200,
          currency: 'JPY',
          notes: '露天綠意座位品嚐手沖咖啡與現烤格子鬆餅。',
          transportToNext: {
            mode: 'subway',
            durationMinutes: 15,
            distanceText: '小田急線至下北澤',
          },
        },
        {
          id: 'item-4-3',
          time: '15:00',
          endTime: '18:30',
          title: '下北澤 古著店與咖哩探險',
          category: 'shopping',
          locationName: '下北澤一番街',
          address: '東京都世田谷区北沢2-14-5',
          coords: { lat: 35.6616, lng: 139.6672 },
          notes: '漫步巷弄挑選美式復古外套、品嚐名物香料湯咖哩。',
        },
      ],
    },
    {
      id: 'day-5',
      dayNumber: 5,
      date: '2025-10-19',
      themeTitle: '築地場外市場早午餐、退房與搭機返台',
      items: [
        {
          id: 'item-5-1',
          time: '08:30',
          endTime: '10:30',
          title: '築地場外市場 新鮮海鮮丼',
          category: 'food',
          locationName: '築地場外市場',
          address: '東京都中央区築地4-16-2',
          coords: { lat: 35.6655, lng: 139.7708 },
          cost: 3500,
          currency: 'JPY',
          notes: '品嚐玉子燒、生蠔以及特上黑鮪魚海膽雙拼丼。',
          transportToNext: {
            mode: 'subway',
            durationMinutes: 25,
            distanceText: '回新宿飯店整理行李',
          },
        },
        {
          id: 'item-5-2',
          time: '11:00',
          endTime: '11:45',
          title: '飯店退房 & 前往成田機場',
          category: 'transport',
          locationName: '新宿站 N\'EX 月台',
          coords: { lat: 35.6897, lng: 139.7006 },
          cost: 3200,
          currency: 'JPY',
          notes: '搭乘 11:39 發車之成田特快前往成田第 2 航廈。',
        },
        {
          id: 'item-5-3',
          time: '12:45',
          endTime: '14:00',
          title: '成田機場 T2 辦理登機 & 免稅店伴手禮',
          category: 'shopping',
          locationName: '成田國際機場 T2 出境大廳',
          coords: { lat: 35.7647, lng: 140.3863 },
          cost: 8000,
          currency: 'JPY',
          notes: '採購東京芭娜娜、白色戀人、獺祭二割三分清酒。',
        },
      ],
    },
  ],
  expenses: [
    {
      id: 'exp-1',
      date: '2025-10-15',
      title: '星宇航空來回機票 (兩人)',
      category: 'transport',
      amount: 32000,
      originalCurrency: 'TWD',
      convertedAmount: 32000,
      paidBy: '我 (Alex)',
      splitWith: ['我 (Alex)', 'Emily Lin'],
      notes: '含 23kg 托運行李與選位費',
    },
    {
      id: 'exp-2',
      date: '2025-10-15',
      title: '新宿飯店 4 晚住宿費',
      category: 'lodging',
      amount: 24500,
      originalCurrency: 'TWD',
      convertedAmount: 24500,
      paidBy: 'Emily Lin',
      splitWith: ['我 (Alex)', 'Emily Lin'],
      notes: '雙人標準大床房含早餐',
    },
    {
      id: 'exp-3',
      date: '2025-10-15',
      title: 'SHIBUYA SKY 門票 (3人)',
      category: 'ticket',
      amount: 6600,
      originalCurrency: 'JPY',
      convertedAmount: 1398,
      paidBy: '我 (Alex)',
      splitWith: ['我 (Alex)', 'Emily Lin', 'Kenji Chen'],
    },
    {
      id: 'exp-4',
      date: '2025-10-15',
      title: '澀谷 炸牛元村 晚餐',
      category: 'food',
      amount: 7800,
      originalCurrency: 'JPY',
      convertedAmount: 1652,
      paidBy: 'Kenji Chen',
      splitWith: ['我 (Alex)', 'Emily Lin', 'Kenji Chen'],
    },
    {
      id: 'exp-5',
      date: '2025-10-16',
      title: '晴空塔快速通關門票',
      category: 'ticket',
      amount: 9300,
      originalCurrency: 'JPY',
      convertedAmount: 1970,
      paidBy: '我 (Alex)',
      splitWith: ['我 (Alex)', 'Emily Lin', 'Kenji Chen'],
    },
    {
      id: 'exp-6',
      date: '2025-10-16',
      title: '秋葉原手辦公仔與盲盒',
      category: 'shopping',
      amount: 14500,
      originalCurrency: 'JPY',
      convertedAmount: 3072,
      paidBy: '我 (Alex)',
      splitWith: ['我 (Alex)'],
      notes: '個人專屬購物',
    },
    {
      id: 'exp-7',
      date: '2025-10-17',
      title: 'teamLab Planets 豐洲門票',
      category: 'ticket',
      amount: 11400,
      originalCurrency: 'JPY',
      convertedAmount: 2415,
      paidBy: 'Emily Lin',
      splitWith: ['我 (Alex)', 'Emily Lin', 'Kenji Chen'],
    },
  ],
  attractions: [
    {
      id: 'att-1',
      title: '淺草寺 Senso-ji',
      category: 'sightseeing',
      city: '東京都台東區',
      address: '東京都台東区浅草2-3-1',
      coords: { lat: 35.7147, lng: 139.7966 },
      rating: 4.8,
      openingHours: '06:00 - 17:00 (本堂)',
      notes: '東京最古老寺廟，求籤、雷門御守非常靈驗。',
      imageUrl: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=600&q=80',
      tags: ['古蹟', '地標', '拍照打卡'],
      isWishlist: false,
    },
    {
      id: 'att-2',
      title: 'SHIBUYA SKY 展望台',
      category: 'sightseeing',
      city: '東京都澀谷區',
      address: '東京都渋谷区渋谷2-24-12',
      coords: { lat: 35.6585, lng: 139.7013 },
      rating: 4.9,
      openingHours: '10:00 - 22:30',
      estimatedCost: 2200,
      currency: 'JPY',
      notes: '無敵 360 度俯瞰東京夜景與十字路口，必去！',
      imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80',
      tags: ['夜景', '夕陽', '展望台'],
      isWishlist: false,
    },
    {
      id: 'att-3',
      title: 'teamLab Planets TOKYO',
      category: 'entertainment',
      city: '東京都江東區',
      address: '東京都江東区豊洲6-1-16',
      coords: { lat: 35.6491, lng: 139.7898 },
      rating: 4.9,
      openingHours: '09:00 - 22:00',
      estimatedCost: 3800,
      currency: 'JPY',
      notes: '水上光影沉浸式展覽，水晶宇宙超好拍。',
      imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
      tags: ['藝術', '拍照', '光影展'],
      isWishlist: false,
    },
    {
      id: 'att-4',
      title: '吉卜力三鷹之森美術館',
      category: 'entertainment',
      city: '東京都三鷹市',
      address: '東京都三鷹市下連雀1-1-83',
      coords: { lat: 35.6963, lng: 139.5704 },
      rating: 4.9,
      openingHours: '10:00 - 18:00 (週二休)',
      estimatedCost: 1000,
      currency: 'JPY',
      notes: '需前一個月 10 號搶票，巨神兵頂樓雕像與龍貓巴士。',
      imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80',
      tags: ['吉卜力', '宮崎駿', '口袋清單'],
      isWishlist: true,
    },
    {
      id: 'att-5',
      title: '六本木之丘 森大樓展望台 & 東京鐵塔夜景',
      category: 'sightseeing',
      city: '東京都港區',
      address: '東京都港区六本木6-10-1',
      coords: { lat: 35.6605, lng: 139.7292 },
      rating: 4.7,
      openingHours: '10:00 - 22:00',
      estimatedCost: 2000,
      currency: 'JPY',
      notes: '欣賞東京鐵塔正對面的最佳位置，浪漫度破表。',
      imageUrl: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?auto=format&fit=crop&w=600&q=80',
      tags: ['夜景', '東京鐵塔', '約會'],
      isWishlist: true,
    },
    {
      id: 'att-6',
      title: '銀座 篝 本店 (雞白湯拉麵)',
      category: 'food',
      city: '東京都中央區',
      address: '東京都中央区銀座6-4-12',
      coords: { lat: 35.6712, lng: 139.7635 },
      rating: 4.8,
      openingHours: '11:00 - 21:30',
      estimatedCost: 1600,
      currency: 'JPY',
      notes: '濃郁絲滑雞白湯，搭配新鮮時令蔬菜與黑松露。',
      imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
      tags: ['拉麵', '米其林', '必吃美食'],
      isWishlist: false,
    },
    {
      id: 'att-7',
      title: 'Harbs 新宿店 (水果千層蛋糕)',
      category: 'food',
      city: '東京都新宿區',
      address: '東京都新宿区新宿3-38-1 Lumine Est B2',
      coords: { lat: 35.6917, lng: 139.7018 },
      rating: 4.7,
      openingHours: '11:00 - 20:30',
      estimatedCost: 1100,
      currency: 'JPY',
      notes: '層層滿滿當季新鮮水果與清爽卡士達奶油，下午茶首選。',
      imageUrl: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80',
      tags: ['甜點', '千層蛋糕', '咖啡廳'],
      isWishlist: true,
    },
  ],
};

const STORAGE_KEY = 'travel_planner_app_trips';
const ACTIVE_TRIP_KEY = 'travel_planner_active_trip_id';

export function loadSavedTrips(): Trip[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveTrips([INITIAL_TOKYO_TRIP]);
      return [INITIAL_TOKYO_TRIP];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Migrate old Unsplash avatars to cute Google-Sheet-style animal avatars
      const animalMap: Record<string, string> = {
        'Alex': '🦊',
        'Emily': '🐰',
        'Kenji': '🐼',
      };
      const animalFallbacks = ['🦊', '🐰', '🐼', '🐨', '🐱', '🐶', '🐻', '🐧', '🦉', '🦔'];
      
      const migrated = parsed.map((trip: Trip) => {
        if (!trip.collaborators) return trip;
        let hasChanges = false;
        const updatedCollabs = trip.collaborators.map((c, idx) => {
          if (c.avatar && (c.avatar.includes('images.unsplash.com') || c.avatar.includes('photo-'))) {
            hasChanges = true;
            let matched = animalFallbacks[idx % animalFallbacks.length];
            for (const [nameKey, emoji] of Object.entries(animalMap)) {
              if (c.name.includes(nameKey)) {
                matched = emoji;
                break;
              }
            }
            return { ...c, avatar: matched };
          }
          return c;
        });
        return hasChanges ? { ...trip, collaborators: updatedCollabs } : trip;
      });

      return migrated;
    }
    return [INITIAL_TOKYO_TRIP];
  } catch (e) {
    console.error('Failed to load trips from localStorage:', e);
    return [INITIAL_TOKYO_TRIP];
  }
}

export function saveTrips(trips: Trip[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
  } catch (e) {
    console.error('Failed to save trips:', e);
  }
}

export function getActiveTripId(): string {
  return localStorage.getItem(ACTIVE_TRIP_KEY) || INITIAL_TOKYO_TRIP.id;
}

export function setActiveTripId(id: string): void {
  localStorage.setItem(ACTIVE_TRIP_KEY, id);
}
