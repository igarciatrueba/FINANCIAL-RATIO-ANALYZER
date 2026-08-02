import type { FinancialAnalysisInput } from "@/domain";

export const demoCompanies = [
  {
    company: {
      id: "novatech-solutions",
      name: "NovaTech Solutions",
      industry: "Enterprise Software",
      currency: "EUR",
    },
    periods: [
      {
        year: 2022,
        incomeStatement: {
          revenue: 1280,
          costOfGoodsSold: 358,
          ebit: 294,
          interestExpense: 18,
          netIncome: 218,
        },
        balanceSheet: {
          cash: 260,
          accountsReceivable: 182,
          inventory: 24,
          currentAssets: 620,
          totalAssets: 1420,
          currentLiabilities: 228,
          totalDebt: 210,
          equity: 850,
        },
        cashFlow: {
          operatingCashFlow: 286,
          capitalExpenditure: 54,
        },
        workingCapital: {
          averageInventory: 22,
          averageReceivables: 171,
          averagePayables: 52,
        },
      },
      {
        year: 2023,
        incomeStatement: {
          revenue: 1540,
          costOfGoodsSold: 416,
          ebit: 370,
          interestExpense: 17,
          netIncome: 282,
        },
        balanceSheet: {
          cash: 338,
          accountsReceivable: 215,
          inventory: 27,
          currentAssets: 744,
          totalAssets: 1640,
          currentLiabilities: 246,
          totalDebt: 190,
          equity: 1010,
        },
        cashFlow: {
          operatingCashFlow: 366,
          capitalExpenditure: 62,
        },
        workingCapital: {
          averageInventory: 25,
          averageReceivables: 199,
          averagePayables: 58,
        },
      },
      {
        year: 2024,
        incomeStatement: {
          revenue: 1880,
          costOfGoodsSold: 489,
          ebit: 480,
          interestExpense: 15,
          netIncome: 372,
        },
        balanceSheet: {
          cash: 448,
          accountsReceivable: 252,
          inventory: 30,
          currentAssets: 906,
          totalAssets: 1900,
          currentLiabilities: 268,
          totalDebt: 168,
          equity: 1230,
        },
        cashFlow: {
          operatingCashFlow: 486,
          capitalExpenditure: 74,
        },
        workingCapital: {
          averageInventory: 29,
          averageReceivables: 233,
          averagePayables: 64,
        },
      },
    ],
  },
  {
    company: {
      id: "atlas-manufacturing-group",
      name: "Atlas Manufacturing Group",
      industry: "Industrial Manufacturing",
      currency: "EUR",
    },
    periods: [
      {
        year: 2022,
        incomeStatement: {
          revenue: 2140,
          costOfGoodsSold: 1420,
          ebit: 214,
          interestExpense: 58,
          netIncome: 112,
        },
        balanceSheet: {
          cash: 145,
          accountsReceivable: 338,
          inventory: 430,
          currentAssets: 1010,
          totalAssets: 2860,
          currentLiabilities: 640,
          totalDebt: 910,
          equity: 1180,
        },
        cashFlow: {
          operatingCashFlow: 178,
          capitalExpenditure: 132,
        },
        workingCapital: {
          averageInventory: 398,
          averageReceivables: 324,
          averagePayables: 236,
        },
      },
      {
        year: 2023,
        incomeStatement: {
          revenue: 2090,
          costOfGoodsSold: 1426,
          ebit: 178,
          interestExpense: 72,
          netIncome: 76,
        },
        balanceSheet: {
          cash: 118,
          accountsReceivable: 356,
          inventory: 486,
          currentAssets: 1064,
          totalAssets: 2960,
          currentLiabilities: 708,
          totalDebt: 1040,
          equity: 1110,
        },
        cashFlow: {
          operatingCashFlow: 144,
          capitalExpenditure: 148,
        },
        workingCapital: {
          averageInventory: 458,
          averageReceivables: 347,
          averagePayables: 251,
        },
      },
      {
        year: 2024,
        incomeStatement: {
          revenue: 2035,
          costOfGoodsSold: 1428,
          ebit: 132,
          interestExpense: 88,
          netIncome: 31,
        },
        balanceSheet: {
          cash: 92,
          accountsReceivable: 374,
          inventory: 552,
          currentAssets: 1102,
          totalAssets: 3040,
          currentLiabilities: 786,
          totalDebt: 1190,
          equity: 1035,
        },
        cashFlow: {
          operatingCashFlow: 102,
          capitalExpenditure: 154,
        },
        workingCapital: {
          averageInventory: 519,
          averageReceivables: 365,
          averagePayables: 270,
        },
      },
    ],
  },
] as const satisfies readonly FinancialAnalysisInput[];

export type DemoCompanyId = (typeof demoCompanies)[number]["company"]["id"];

export function cloneDemoCompany(id: DemoCompanyId): FinancialAnalysisInput {
  const demo = demoCompanies.find((company) => company.company.id === id);

  if (!demo) {
    throw new Error(`Unknown demo company: ${id}`);
  }

  return structuredClone(demo);
}
