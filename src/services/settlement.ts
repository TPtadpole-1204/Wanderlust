import type { Collaborator, Expense } from '../types.ts';
import { formatMoney, convertCurrency, getCachedRates } from './currency.ts';

export interface SettlementTransfer {
  from: string; // Member who owes money
  to: string;   // Member who should receive money
  amount: number; // Amount in trip base currency
}

export interface MemberSettlementSummary {
  member: Collaborator;
  totalPaid: number;
  totalConsumed: number;
  balance: number; // positive = should receive, negative = should pay
  paidExpenses: Expense[];
  sharedExpenses: {
    expense: Expense;
    shareAmount: number;
  }[];
  transfersIn: SettlementTransfer[];  // transfers to this member
  transfersOut: SettlementTransfer[]; // transfers from this member
}

export interface TripSettlementResult {
  balances: Record<string, number>;
  totalPaidByMember: Record<string, number>;
  totalConsumedByMember: Record<string, number>;
  transfers: SettlementTransfer[];
  getMemberSummary: (memberName: string) => MemberSettlementSummary | null;
}

/**
 * Calculates net balances, debt simplification transfers, and per-member breakdown
 */
export function calculateTripSettlement(
  collaborators: Collaborator[],
  expenses: Expense[],
  settlementCurrency?: string,
  rates: Record<string, number> = getCachedRates().rates
): TripSettlementResult {
  const balances: Record<string, number> = {};
  const totalPaidByMember: Record<string, number> = {};
  const totalConsumedByMember: Record<string, number> = {};

  // Initialize all collaborators
  collaborators.forEach((c) => {
    balances[c.name] = 0;
    totalPaidByMember[c.name] = 0;
    totalConsumedByMember[c.name] = 0;
  });

  // Calculate debts and credits
  expenses.forEach((exp) => {
    // Use target currency if specified, else use base currency (which is convertedAmount if no settlementCurrency is passed)
    const totalCost = settlementCurrency 
      ? convertCurrency(exp.amount, exp.originalCurrency, settlementCurrency, rates) 
      : exp.convertedAmount;
    const splitList = exp.splitWith && exp.splitWith.length > 0 ? exp.splitWith : [exp.paidBy];
    const splitCount = splitList.length;
    const perPerson = splitCount > 0 ? totalCost / splitCount : 0;

    // Credit payer
    if (balances[exp.paidBy] === undefined) {
      balances[exp.paidBy] = 0;
      totalPaidByMember[exp.paidBy] = 0;
      totalConsumedByMember[exp.paidBy] = 0;
    }
    balances[exp.paidBy] += totalCost;
    totalPaidByMember[exp.paidBy] += totalCost;

    // Debit consumers
    splitList.forEach((person) => {
      if (balances[person] === undefined) {
        balances[person] = 0;
        totalPaidByMember[person] = 0;
        totalConsumedByMember[person] = 0;
      }
      balances[person] -= perPerson;
      totalConsumedByMember[person] += perPerson;
    });
  });

  // Clean rounding
  Object.keys(balances).forEach((k) => {
    balances[k] = Math.round(balances[k] * 100) / 100;
    totalPaidByMember[k] = Math.round((totalPaidByMember[k] || 0) * 100) / 100;
    totalConsumedByMember[k] = Math.round((totalConsumedByMember[k] || 0) * 100) / 100;
  });

  // Calculate transfers using greedy algorithm to minimize transactions
  const debtors: { name: string; amount: number }[] = [];
  const creditors: { name: string; amount: number }[] = [];

  Object.entries(balances).forEach(([name, bal]) => {
    if (bal < -0.01) {
      debtors.push({ name, amount: -bal });
    } else if (bal > 0.01) {
      creditors.push({ name, amount: bal });
    }
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transfers: SettlementTransfer[] = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];
    const transferAmount = Math.min(debtor.amount, creditor.amount);

    if (transferAmount > 0.01) {
      transfers.push({
        from: debtor.name,
        to: creditor.name,
        amount: Math.round(transferAmount * 100) / 100,
      });
    }

    debtor.amount -= transferAmount;
    creditor.amount -= transferAmount;

    if (debtor.amount <= 0.01) dIdx++;
    if (creditor.amount <= 0.01) cIdx++;
  }

  const getMemberSummary = (memberName: string): MemberSettlementSummary | null => {
    const member = collaborators.find((c) => c.name === memberName) || {
      id: `anon-${memberName}`,
      name: memberName,
      avatar: '',
      role: 'editor' as const,
      isOnline: false,
      color: '#3B82F6',
    };

    const paidExpenses = expenses.filter((e) => e.paidBy === memberName);
    const sharedExpenses = expenses
      .filter((e) => (e.splitWith && e.splitWith.length > 0 ? e.splitWith : [e.paidBy]).includes(memberName))
      .map((e) => {
        const splitList = e.splitWith && e.splitWith.length > 0 ? e.splitWith : [e.paidBy];
        return {
          expense: e,
          shareAmount: Math.round(((settlementCurrency ? convertCurrency(e.amount, e.originalCurrency, settlementCurrency, rates) : e.convertedAmount) / splitList.length) * 100) / 100,
        };
      });

    const transfersIn = transfers.filter((t) => t.to === memberName);
    const transfersOut = transfers.filter((t) => t.from === memberName);

    return {
      member,
      totalPaid: totalPaidByMember[memberName] || 0,
      totalConsumed: totalConsumedByMember[memberName] || 0,
      balance: balances[memberName] || 0,
      paidExpenses,
      sharedExpenses,
      transfersIn,
      transfersOut,
    };
  };

  return {
    balances,
    totalPaidByMember,
    totalConsumedByMember,
    transfers,
    getMemberSummary,
  };
}

/**
 * Generate a clean, easy-to-share clipboard report for communication (LINE, WhatsApp, Notes)
 */
export function generateMemberSettlementText(
  tripTitle: string,
  baseCurrency: string,
  summary: MemberSettlementSummary
): string {
  const { member, totalPaid, totalConsumed, balance, transfersIn, transfersOut } = summary;
  const balanceText =
    balance > 0.01
      ? `應收回 +${formatMoney(balance, baseCurrency)}`
      : balance < -0.01
      ? `應支付 -${formatMoney(Math.abs(balance), baseCurrency)}`
      : `收支完全平帳 ($0)`;

  let text = `✈️【${tripTitle}】個人分帳結算單\n`;
  text += `👤 成員：${member.name}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `💰 代付總額：${formatMoney(totalPaid, baseCurrency)} (${summary.paidExpenses.length} 筆)\n`;
  text += `🍽️ 分攤應付：${formatMoney(totalConsumed, baseCurrency)} (${summary.sharedExpenses.length} 筆)\n`;
  text += `📊 結算結果：${balanceText}\n`;

  if (transfersIn.length > 0 || transfersOut.length > 0) {
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🔄 轉帳清算建議：\n`;
    transfersIn.forEach((t) => {
      text += ` • ${t.from} 應支付給 ${member.name}：${formatMoney(t.amount, baseCurrency)}\n`;
    });
    transfersOut.forEach((t) => {
      text += ` • ${member.name} 應支付給 ${t.to}：${formatMoney(t.amount, baseCurrency)}\n`;
    });
  }

  return text.trim();
}

/**
 * Generate all members settlement summary for sharing
 */
export function generateAllSettlementText(
  tripTitle: string,
  baseCurrency: string,
  collaborators: Collaborator[],
  settlement: TripSettlementResult
): string {
  let text = `✈️【${tripTitle}】全員 AA 分帳結算表\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `👥 各自應收 / 應付淨額：\n`;

  collaborators.forEach((c) => {
    const bal = settlement.balances[c.name] || 0;
    const balStr =
      bal > 0.01
        ? `應收 +${formatMoney(bal, baseCurrency)}`
        : bal < -0.01
        ? `應付 -${formatMoney(Math.abs(bal), baseCurrency)}`
        : `平衡 $0`;
    text += ` • ${c.name}：${balStr}\n`;
  });

  if (settlement.transfers.length > 0) {
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🔄 推薦平帳轉帳方式 (最少筆數)：\n`;
    settlement.transfers.forEach((t, i) => {
      text += ` ${i + 1}. ${t.from} ➜ 轉帳給 ${t.to}：${formatMoney(t.amount, baseCurrency)}\n`;
    });
  } else {
    text += `\n✨ 目前全員帳目已平衡，無需任何轉帳！\n`;
  }

  return text.trim();
}
