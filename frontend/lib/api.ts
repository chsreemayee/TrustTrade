import { MOCK_VERDICTS, ScamCheckVerdict } from "../mocks/scam_checks";
import { MOCK_COMPANIES, Company } from "../mocks/companies";
import { MOCK_DRILLS, ScamDrill } from "../mocks/drills";
import { MOCK_LESSONS, Lesson } from "../mocks/lessons";
import { MOCK_BADGES, Badge } from "../mocks/badges";
import { MOCK_ALERTS, SafetyAlert } from "../mocks/alerts";
import { MOCK_SCAM_RULES, MOCK_REVIEWS, MOCK_ADMIN_STATS, ScamRule, ReviewItem, AdminStats } from "../mocks/admin";

export interface WalletHolding {
  ticker: string;
  name: string;
  shares: number;
  invested_rupees: number;
  current_value: number;
  gain_loss_rupees: number;
  gain_loss_percent: number;
  buy_price: number;
  buy_date: string;
  held_days: number;
}

export interface UserWallet {
  cash: number;
  holdings: WalletHolding[];
  sim_days_forwarded: number;
}

const STORAGE_KEYS = {
  WALLET: "trusttrade_wallet_state",
  BADGES: "trusttrade_badges_state",
  USER_PROFILE: "trusttrade_user_profile",
  RULES: "trusttrade_admin_rules",
  REVIEWS: "trusttrade_admin_reviews",
  DRILL_PROGRESS: "trusttrade_drill_stats",
};

// Initial state getters with browser local storage persistence
export function getStoredWallet(): UserWallet {
  if (typeof window === "undefined") {
    return { cash: 10000, holdings: [], sim_days_forwarded: 0 };
  }
  const saved = localStorage.getItem(STORAGE_KEYS.WALLET);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
  }
  const initial: UserWallet = {
    cash: 10000,
    holdings: [],
    sim_days_forwarded: 0,
  };
  localStorage.setItem(STORAGE_KEYS.WALLET, JSON.stringify(initial));
  return initial;
}

export function saveStoredWallet(wallet: UserWallet) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.WALLET, JSON.stringify(wallet));
  }
}

export function getStoredBadges(): Badge[] {
  if (typeof window === "undefined") {
    return MOCK_BADGES;
  }
  const saved = localStorage.getItem(STORAGE_KEYS.BADGES);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(MOCK_BADGES));
  return MOCK_BADGES;
}

export function saveStoredBadges(badges: Badge[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(badges));
  }
}

// API functions
export const api = {
  // Scam Investigator API
  async checkScamTip(input: {
    type: "voice" | "text" | "screenshot" | "link";
    text?: string;
    urlOrUpi?: string;
    imageData?: string;
  }): Promise<ScamCheckVerdict> {
    // Artificial latency for checking animation realism (around 1.2s if called directly)
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const content = (input.text || input.urlOrUpi || "").toLowerCase();

    // Determine verdict based on PRD 6.2 & 6.3 logic
    if (
      content.includes("double") ||
      content.includes("20%") ||
      content.includes("guaranteed") ||
      content.includes("vip") ||
      content.includes("100%") ||
      content.includes("apk") ||
      content.includes("రెట్టింపు") ||
      content.includes("పక్కా") ||
      content.includes("దోగునా") ||
      content.includes("ద్ವಿಗುಣ") ||
      content.includes("இரட்டிப்பு") ||
      content.includes("ഇരട്ടി")
    ) {
      return MOCK_VERDICTS.vip_double_money;
    } else if (
      content.includes("hdfc") ||
      content.includes("sbi") ||
      content.includes("zerodha") ||
      content.includes("credited") ||
      content.includes("order executed") ||
      content.includes("జమ") ||
      content.includes("క్రెడిట్")
    ) {
      return MOCK_VERDICTS.no_warning_signs;
    } else if (content.includes("bit.ly") || content.includes("15%") || content.includes("wealth")) {
      return MOCK_VERDICTS.careful_high_return;
    } else if (content.length > 0 && content.length < 8) {
      return MOCK_VERDICTS.could_not_check;
    }

    // Default to the comprehensive scam scenario for standard demo checks
    return MOCK_VERDICTS.vip_double_money;
  },

  // Practice Trading & Wallet
  async getWallet(): Promise<UserWallet> {
    return getStoredWallet();
  },

  async resetWallet(): Promise<UserWallet> {
    const fresh: UserWallet = {
      cash: 10000,
      holdings: [],
      sim_days_forwarded: 0,
    };
    saveStoredWallet(fresh);
    return fresh;
  },

  async buyStock(ticker: string, rupees: number): Promise<UserWallet> {
    const wallet = getStoredWallet();
    if (rupees <= 0 || wallet.cash < rupees) {
      throw new Error("Insufficient cash balance");
    }

    const company = MOCK_COMPANIES.find((c) => c.ticker === ticker);
    if (!company) throw new Error("Company not found");

    const price = company.current_price;
    const sharesAcquired = parseFloat((rupees / price).toFixed(4));

    wallet.cash = parseFloat((wallet.cash - rupees).toFixed(2));

    const existingIndex = wallet.holdings.findIndex((h) => h.ticker === ticker);
    if (existingIndex >= 0) {
      const existing = wallet.holdings[existingIndex];
      const totalShares = existing.shares + sharesAcquired;
      const totalInvested = existing.invested_rupees + rupees;
      const currentVal = parseFloat((totalShares * price).toFixed(2));
      const gainLoss = parseFloat((currentVal - totalInvested).toFixed(2));
      const pct = parseFloat(((gainLoss / totalInvested) * 100).toFixed(2));

      wallet.holdings[existingIndex] = {
        ...existing,
        shares: totalShares,
        invested_rupees: totalInvested,
        current_value: currentVal,
        gain_loss_rupees: gainLoss,
        gain_loss_percent: pct,
      };
    } else {
      wallet.holdings.push({
        ticker: company.ticker,
        name: company.name,
        shares: sharesAcquired,
        invested_rupees: rupees,
        current_value: rupees,
        gain_loss_rupees: 0,
        gain_loss_percent: 0,
        buy_price: price,
        buy_date: "2026-11-20",
        held_days: 0,
      });
    }

    saveStoredWallet(wallet);

    // Unlock "First Trade" badge
    api.unlockBadge("first_trade");

    return wallet;
  },

  async sellStock(ticker: string): Promise<UserWallet> {
    const wallet = getStoredWallet();
    const holdingIndex = wallet.holdings.findIndex((h) => h.ticker === ticker);
    if (holdingIndex === -1) throw new Error("Holding not found");

    const holding = wallet.holdings[holdingIndex];
    wallet.cash = parseFloat((wallet.cash + holding.current_value).toFixed(2));
    wallet.holdings.splice(holdingIndex, 1);

    saveStoredWallet(wallet);
    return wallet;
  },

  async fastForwardWeek(): Promise<UserWallet> {
    const wallet = getStoredWallet();
    wallet.sim_days_forwarded += 7;

    // Simulate market movements for 5 trading days
    wallet.holdings = wallet.holdings.map((h) => {
      const days = h.held_days + 7;
      // Slight price drift (+2.4% gain simulation for satisfaction)
      const simulatedPrice = parseFloat((h.buy_price * 1.024).toFixed(2));
      const currentVal = parseFloat((h.shares * simulatedPrice).toFixed(2));
      const gainLoss = parseFloat((currentVal - h.invested_rupees).toFixed(2));
      const pct = parseFloat(((gainLoss / h.invested_rupees) * 100).toFixed(2));

      return {
        ...h,
        held_days: days,
        current_value: currentVal,
        gain_loss_rupees: gainLoss,
        gain_loss_percent: pct,
      };
    });

    saveStoredWallet(wallet);

    // Check patient investor badge if held >= 7 days
    if (wallet.holdings.some((h) => h.held_days >= 7)) {
      api.unlockBadge("patient_investor");
    }

    return wallet;
  },

  // Companies
  async getCompanies(): Promise<Company[]> {
    return MOCK_COMPANIES;
  },

  async getCompanyByTicker(ticker: string): Promise<Company | undefined> {
    return MOCK_COMPANIES.find((c) => c.ticker === ticker || c.id === ticker);
  },

  // Drills
  async getDrills(): Promise<ScamDrill[]> {
    return MOCK_DRILLS;
  },

  // Lessons
  async getLessons(): Promise<Lesson[]> {
    return MOCK_LESSONS;
  },

  async getLessonById(id: string): Promise<Lesson | undefined> {
    return MOCK_LESSONS.find((l) => l.id === id);
  },

  // Badges
  async getBadges(): Promise<Badge[]> {
    return getStoredBadges();
  },

  async unlockBadge(code: string): Promise<Badge[]> {
    const badges = getStoredBadges();
    const target = badges.find((b) => b.code === code);
    if (target && !target.unlocked) {
      target.unlocked = true;
      target.earned_at = "2026-11-20";
      saveStoredBadges(badges);
    }
    return badges;
  },

  // Safety Alerts
  async getAlerts(): Promise<SafetyAlert[]> {
    return MOCK_ALERTS;
  },

  // Admin APIs
  async getAdminStats(): Promise<AdminStats> {
    return MOCK_ADMIN_STATS;
  },

  async getScamRules(): Promise<ScamRule[]> {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEYS.RULES);
      if (saved) return JSON.parse(saved);
    }
    return MOCK_SCAM_RULES;
  },

  async addScamRule(rule: Omit<ScamRule, "id">): Promise<ScamRule[]> {
    const rules = await api.getScamRules();
    const newRule: ScamRule = {
      ...rule,
      id: `rule-${Date.now()}`,
    };
    rules.unshift(newRule);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(rules));
    }
    return rules;
  },

  async getReviewQueue(): Promise<ReviewItem[]> {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEYS.REVIEWS);
      if (saved) return JSON.parse(saved);
    }
    return MOCK_REVIEWS;
  },

  async updateReviewStatus(id: string, status: "approved" | "dismissed"): Promise<ReviewItem[]> {
    const reviews = await api.getReviewQueue();
    const item = reviews.find((r) => r.id === id);
    if (item) {
      item.status = status;
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
      }
    }
    return reviews;
  },

  async reportScam(text: string, reason: string): Promise<boolean> {
    const reviews = await api.getReviewQueue();
    reviews.unshift({
      id: `rev-${Date.now()}`,
      check_id: `chk-user-${Date.now()}`,
      reported_text: text,
      reason,
      status: "open",
      timestamp: "Just now",
    });
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
    }
    // Unlock protector badge
    api.unlockBadge("protector");
    return true;
  },
};
