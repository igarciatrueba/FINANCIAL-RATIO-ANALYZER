import type { CorpusGroundTruth, DirectGroundTruthValue, DerivableGroundTruthValue, GroundTruthValue } from "@/features/annual-report-ingestion/lib/corpus-validation";
import type { CanonicalFieldKey, FiscalPeriodIdentity, StatementSource } from "@/features/annual-report-ingestion/types";

type DirectLine = readonly [CanonicalFieldKey, 0 | 1 | 2, string, string, string, string?];

type SourceContext = {
  fiscalPeriod: FiscalPeriodIdentity;
  currency: "EUR" | "USD" | "GBP";
  scale: "units" | "thousands" | "millions" | "billions";
  sourcePage: number;
  sourceStatement: StatementSource;
};

function direct(source: SourceContext, lines: readonly DirectLine[]): DirectGroundTruthValue[] {
  return lines.map(([canonicalFieldKey, periodSlotIndex, canonicalValue, sourceValue, sourceLabel, normalization]) => ({
    canonicalFieldKey,
    periodSlotIndex,
    classification: "PRESENT_DIRECT",
    canonicalValue,
    sourceValue,
    sourceLabel,
    ...source,
    ...(normalization ? { normalization } : {}),
  }));
}

function derivable(input: Omit<DerivableGroundTruthValue, "classification">): DerivableGroundTruthValue {
  return { ...input, classification: "PRESENT_DERIVABLE" };
}

function ambiguous(canonicalFieldKey: CanonicalFieldKey, periodSlotIndex: 0 | 1 | 2, reason: string): GroundTruthValue {
  return { canonicalFieldKey, periodSlotIndex, classification: "AMBIGUOUS", reason };
}

export type AnnualReportCorpusEntry = {
  id: string;
  company: string;
  filename: string;
  sha256: string;
  sourceUrl: string;
  periodSlots: readonly ({ slotIndex: 0 | 1 | 2; fiscalPeriod: FiscalPeriodIdentity | null })[];
  groundTruth: CorpusGroundTruth;
};

/**
 * Manual source-of-truth transcription from the cited audited primary statements.
 * `sourcePage` is the one-indexed PDF page, not the printed report-page number.
 * Unlisted canonical slots intentionally materialize as NOT_PRESENT in the validator.
 */
export const annualReportCorpus: readonly AnnualReportCorpusEntry[] = [
  {
    id: "microsoft-2024-usd",
    company: "Microsoft",
    filename: "microsoft-2024.pdf",
    sha256: "979a3f8199702397e080719dc1212242eb2580bed78b5dab92d3f576d6abf5bc",
    sourceUrl: "https://www.sec.gov/Archives/edgar/data/789019/000119312524242888/d815777dars.pdf",
    periodSlots: [
      { slotIndex: 0, fiscalPeriod: { label: "2022", year: 2022, endDate: "2022-06-30" } },
      { slotIndex: 1, fiscalPeriod: { label: "2023", year: 2023, endDate: "2023-06-30" } },
      { slotIndex: 2, fiscalPeriod: { label: "2024", year: 2024, endDate: "2024-06-30" } },
    ],
    groundTruth: {
      defaultClassification: "NOT_PRESENT",
      values: [
        ...direct({ fiscalPeriod: { label: "2022", year: 2022, endDate: "2022-06-30" }, currency: "USD", scale: "millions", sourcePage: 48, sourceStatement: "income_statement" }, [
          ["revenue", 0, "198270000000", "198,270", "Total revenue"],
          ["costOfGoodsSold", 0, "62650000000", "62,650", "Total cost of revenue"],
          ["ebit", 0, "83383000000", "83,383", "Operating income"],
          ["netIncome", 0, "72738000000", "72,738", "Net income"],
        ]),
        ...direct({ fiscalPeriod: { label: "2023", year: 2023, endDate: "2023-06-30" }, currency: "USD", scale: "millions", sourcePage: 48, sourceStatement: "income_statement" }, [
          ["revenue", 1, "211915000000", "211,915", "Total revenue"],
          ["costOfGoodsSold", 1, "65863000000", "65,863", "Total cost of revenue"],
          ["ebit", 1, "88523000000", "88,523", "Operating income"],
          ["netIncome", 1, "72361000000", "72,361", "Net income"],
        ]),
        ...direct({ fiscalPeriod: { label: "2024", year: 2024, endDate: "2024-06-30" }, currency: "USD", scale: "millions", sourcePage: 48, sourceStatement: "income_statement" }, [
          ["revenue", 2, "245122000000", "245,122", "Total revenue"],
          ["costOfGoodsSold", 2, "74114000000", "74,114", "Total cost of revenue"],
          ["ebit", 2, "109433000000", "109,433", "Operating income"],
          ["netIncome", 2, "88136000000", "88,136", "Net income"],
        ]),
        ...direct({ fiscalPeriod: { label: "2022", year: 2022, endDate: "2022-06-30" }, currency: "USD", scale: "millions", sourcePage: 51, sourceStatement: "cash_flow" }, [
          ["cash", 0, "13931000000", "13,931", "Cash and cash equivalents, end of period"],
          ["operatingCashFlow", 0, "89035000000", "89,035", "Net cash from operations"],
          ["capitalExpenditure", 0, "23886000000", "(23,886)", "Additions to property and equipment", "Cash outflow is represented as a positive capital expenditure."],
        ]),
        ...direct({ fiscalPeriod: { label: "2023", year: 2023, endDate: "2023-06-30" }, currency: "USD", scale: "millions", sourcePage: 50, sourceStatement: "balance_sheet" }, [
          ["cash", 1, "34704000000", "34,704", "Cash and cash equivalents"],
          ["accountsReceivable", 1, "48688000000", "48,688", "Accounts receivable, net"],
          ["inventory", 1, "2500000000", "2,500", "Inventories"],
          ["currentAssets", 1, "184257000000", "184,257", "Total current assets"],
          ["totalAssets", 1, "411976000000", "411,976", "Total assets"],
          ["currentLiabilities", 1, "104149000000", "104,149", "Total current liabilities"],
          ["equity", 1, "206223000000", "206,223", "Total stockholders' equity"],
        ]),
        ...direct({ fiscalPeriod: { label: "2024", year: 2024, endDate: "2024-06-30" }, currency: "USD", scale: "millions", sourcePage: 50, sourceStatement: "balance_sheet" }, [
          ["cash", 2, "18315000000", "18,315", "Cash and cash equivalents"],
          ["accountsReceivable", 2, "56924000000", "56,924", "Accounts receivable, net"],
          ["inventory", 2, "1246000000", "1,246", "Inventories"],
          ["currentAssets", 2, "159734000000", "159,734", "Total current assets"],
          ["totalAssets", 2, "512163000000", "512,163", "Total assets"],
          ["currentLiabilities", 2, "125286000000", "125,286", "Total current liabilities"],
          ["equity", 2, "268477000000", "268,477", "Total stockholders' equity"],
        ]),
        ...direct({ fiscalPeriod: { label: "2023", year: 2023, endDate: "2023-06-30" }, currency: "USD", scale: "millions", sourcePage: 51, sourceStatement: "cash_flow" }, [
          ["operatingCashFlow", 1, "87582000000", "87,582", "Net cash from operations"],
          ["capitalExpenditure", 1, "28107000000", "(28,107)", "Additions to property and equipment", "Cash outflow is represented as a positive capital expenditure."],
        ]),
        ...direct({ fiscalPeriod: { label: "2024", year: 2024, endDate: "2024-06-30" }, currency: "USD", scale: "millions", sourcePage: 51, sourceStatement: "cash_flow" }, [
          ["operatingCashFlow", 2, "118548000000", "118,548", "Net cash from operations"],
          ["capitalExpenditure", 2, "44477000000", "(44,477)", "Additions to property and equipment", "Cash outflow is represented as a positive capital expenditure."],
        ]),
        derivable({ canonicalFieldKey: "totalDebt", periodSlotIndex: 1, canonicalValue: "47237000000", fiscalPeriod: { label: "2023", year: 2023, endDate: "2023-06-30" }, currency: "USD", rule: "Sum explicitly disclosed short-term debt, current long-term maturities and long-term debt as positive debt magnitudes.", components: [
          { sourcePage: 50, sourceStatement: "balance_sheet", sourceLabel: "Short-term debt", sourceValue: "0" },
          { sourcePage: 50, sourceStatement: "balance_sheet", sourceLabel: "Current portion of long-term debt", sourceValue: "5,247" },
          { sourcePage: 50, sourceStatement: "balance_sheet", sourceLabel: "Long-term debt", sourceValue: "41,990" },
        ] }),
        derivable({ canonicalFieldKey: "totalDebt", periodSlotIndex: 2, canonicalValue: "51630000000", fiscalPeriod: { label: "2024", year: 2024, endDate: "2024-06-30" }, currency: "USD", rule: "Sum explicitly disclosed short-term debt, current long-term maturities and long-term debt as positive debt magnitudes.", components: [
          { sourcePage: 50, sourceStatement: "balance_sheet", sourceLabel: "Short-term debt", sourceValue: "6,693" },
          { sourcePage: 50, sourceStatement: "balance_sheet", sourceLabel: "Current portion of long-term debt", sourceValue: "2,249" },
          { sourcePage: 50, sourceStatement: "balance_sheet", sourceLabel: "Long-term debt", sourceValue: "42,688" },
        ] }),
        derivable({ canonicalFieldKey: "averageInventory", periodSlotIndex: 2, canonicalValue: "1873000000", fiscalPeriod: { label: "2024", year: 2024, endDate: "2024-06-30" }, currency: "USD", rule: "Average of evidenced 2023 and 2024 closing inventories.", components: [
          { sourcePage: 50, sourceStatement: "balance_sheet", sourceLabel: "Inventories (2023)", sourceValue: "2,500" },
          { sourcePage: 50, sourceStatement: "balance_sheet", sourceLabel: "Inventories (2024)", sourceValue: "1,246" },
        ] }),
        derivable({ canonicalFieldKey: "averageReceivables", periodSlotIndex: 2, canonicalValue: "52806000000", fiscalPeriod: { label: "2024", year: 2024, endDate: "2024-06-30" }, currency: "USD", rule: "Average of evidenced 2023 and 2024 closing accounts receivable balances.", components: [
          { sourcePage: 50, sourceStatement: "balance_sheet", sourceLabel: "Accounts receivable, net (2023)", sourceValue: "48,688" },
          { sourcePage: 50, sourceStatement: "balance_sheet", sourceLabel: "Accounts receivable, net (2024)", sourceValue: "56,924" },
        ] }),
        derivable({ canonicalFieldKey: "averagePayables", periodSlotIndex: 2, canonicalValue: "20045500000", fiscalPeriod: { label: "2024", year: 2024, endDate: "2024-06-30" }, currency: "USD", rule: "Average of evidenced 2023 and 2024 closing accounts payable balances.", components: [
          { sourcePage: 50, sourceStatement: "balance_sheet", sourceLabel: "Accounts payable (2023)", sourceValue: "18,095" },
          { sourcePage: 50, sourceStatement: "balance_sheet", sourceLabel: "Accounts payable (2024)", sourceValue: "21,996" },
        ] }),
      ],
    },
  },
  {
    id: "siemens-2024-eur",
    company: "Siemens",
    filename: "siemens-2024.pdf",
    sha256: "75f568180a8d35287f970a4812817dcd2b5c690ec937bf80f17b6fe68f42521e",
    sourceUrl: "https://assets.new.siemens.com/siemens/assets/api/uuid:344347ec-a1bd-44cb-aaaa-711d1b3ec1b8/Siemens-Annual-Report-2024.pdf",
    periodSlots: [
      { slotIndex: 0, fiscalPeriod: null },
      { slotIndex: 1, fiscalPeriod: { label: "2023", year: 2023, endDate: "2023-09-30" } },
      { slotIndex: 2, fiscalPeriod: { label: "2024", year: 2024, endDate: "2024-09-30" } },
    ],
    groundTruth: {
      defaultClassification: "NOT_PRESENT",
      values: [
        ...direct({ fiscalPeriod: { label: "2023", year: 2023, endDate: "2023-09-30" }, currency: "EUR", scale: "millions", sourcePage: 49, sourceStatement: "income_statement" }, [
          ["revenue", 1, "74882000000", "74,882", "Revenue"],
          ["costOfGoodsSold", 1, "45766000000", "(45,766)", "Cost of sales", "Expense is represented as a positive canonical cost."],
          ["interestExpense", 1, "1369000000", "(1,369)", "Interest expenses", "Expense is represented as a positive canonical interest expense."],
          ["netIncome", 1, "8529000000", "8,529", "Net income"],
        ]),
        ...direct({ fiscalPeriod: { label: "2024", year: 2024, endDate: "2024-09-30" }, currency: "EUR", scale: "millions", sourcePage: 49, sourceStatement: "income_statement" }, [
          ["revenue", 2, "75930000000", "75,930", "Revenue"],
          ["costOfGoodsSold", 2, "46107000000", "(46,107)", "Cost of sales", "Expense is represented as a positive canonical cost."],
          ["interestExpense", 2, "1785000000", "(1,785)", "Interest expenses", "Expense is represented as a positive canonical interest expense."],
          ["netIncome", 2, "8992000000", "8,992", "Net income"],
        ]),
        ...direct({ fiscalPeriod: { label: "2023", year: 2023, endDate: "2023-09-30" }, currency: "EUR", scale: "millions", sourcePage: 50, sourceStatement: "balance_sheet" }, [
          ["cash", 1, "10084000000", "10,084", "Cash and cash equivalents"],
          ["inventory", 1, "11548000000", "11,548", "Inventories"],
          ["currentAssets", 1, "60639000000", "60,639", "Total current assets"],
          ["totalAssets", 1, "145071000000", "145,071", "Total assets"],
          ["currentLiabilities", 1, "44913000000", "44,913", "Total current liabilities"],
          ["equity", 1, "53052000000", "53,052", "Total equity"],
        ]),
        ...direct({ fiscalPeriod: { label: "2024", year: 2024, endDate: "2024-09-30" }, currency: "EUR", scale: "millions", sourcePage: 50, sourceStatement: "balance_sheet" }, [
          ["cash", 2, "9156000000", "9,156", "Cash and cash equivalents"],
          ["inventory", 2, "10923000000", "10,923", "Inventories"],
          ["currentAssets", 2, "61353000000", "61,353", "Total current assets"],
          ["totalAssets", 2, "147812000000", "147,812", "Total assets"],
          ["currentLiabilities", 2, "43913000000", "43,913", "Total current liabilities"],
          ["equity", 2, "56231000000", "56,231", "Total equity"],
        ]),
        ...direct({ fiscalPeriod: { label: "2023", year: 2023, endDate: "2023-09-30" }, currency: "EUR", scale: "millions", sourcePage: 51, sourceStatement: "cash_flow" }, [
          ["operatingCashFlow", 1, "12239000000", "12,239", "Cash flows from operating activities - continuing and discontinued operations"],
          ["capitalExpenditure", 1, "2146000000", "(2,146)", "Additions to intangible assets and property, plant and equipment", "Cash outflow is represented as a positive capital expenditure."],
        ]),
        ...direct({ fiscalPeriod: { label: "2024", year: 2024, endDate: "2024-09-30" }, currency: "EUR", scale: "millions", sourcePage: 51, sourceStatement: "cash_flow" }, [
          ["operatingCashFlow", 2, "11665000000", "11,665", "Cash flows from operating activities - continuing and discontinued operations"],
          ["capitalExpenditure", 2, "2088000000", "(2,088)", "Additions to intangible assets and property, plant and equipment", "Cash outflow is represented as a positive capital expenditure."],
        ]),
        derivable({ canonicalFieldKey: "totalDebt", periodSlotIndex: 1, canonicalValue: "46596000000", fiscalPeriod: { label: "2023", year: 2023, endDate: "2023-09-30" }, currency: "EUR", rule: "Current debt plus long-term debt from the consolidated statement of financial position.", components: [
          { sourcePage: 50, sourceStatement: "balance_sheet", sourceLabel: "Short-term debt and current maturities of long-term debt", sourceValue: "7,483" },
          { sourcePage: 50, sourceStatement: "balance_sheet", sourceLabel: "Long-term debt", sourceValue: "39,113" },
        ] }),
        derivable({ canonicalFieldKey: "totalDebt", periodSlotIndex: 2, canonicalValue: "47919000000", fiscalPeriod: { label: "2024", year: 2024, endDate: "2024-09-30" }, currency: "EUR", rule: "Current debt plus long-term debt from the consolidated statement of financial position.", components: [
          { sourcePage: 50, sourceStatement: "balance_sheet", sourceLabel: "Short-term debt and current maturities of long-term debt", sourceValue: "6,598" },
          { sourcePage: 50, sourceStatement: "balance_sheet", sourceLabel: "Long-term debt", sourceValue: "41,321" },
        ] }),
        derivable({ canonicalFieldKey: "averageInventory", periodSlotIndex: 2, canonicalValue: "11235500000", fiscalPeriod: { label: "2024", year: 2024, endDate: "2024-09-30" }, currency: "EUR", rule: "Average of evidenced 2023 and 2024 closing inventories.", components: [
          { sourcePage: 50, sourceStatement: "balance_sheet", sourceLabel: "Inventories (2023)", sourceValue: "11,548" },
          { sourcePage: 50, sourceStatement: "balance_sheet", sourceLabel: "Inventories (2024)", sourceValue: "10,923" },
        ] }),
        derivable({ canonicalFieldKey: "averagePayables", periodSlotIndex: 2, canonicalValue: "9486500000", fiscalPeriod: { label: "2024", year: 2024, endDate: "2024-09-30" }, currency: "EUR", rule: "Average of evidenced 2023 and 2024 trade payables.", components: [
          { sourcePage: 50, sourceStatement: "balance_sheet", sourceLabel: "Trade payables (2023)", sourceValue: "10,130" },
          { sourcePage: 50, sourceStatement: "balance_sheet", sourceLabel: "Trade payables (2024)", sourceValue: "8,843" },
        ] }),
        ambiguous("accountsReceivable", 1, "The consolidated statement combines trade and other receivables."),
        ambiguous("accountsReceivable", 2, "The consolidated statement combines trade and other receivables."),
        ambiguous("averageReceivables", 2, "The two available closing balances combine trade and other receivables."),
      ],
    },
  },
  {
    id: "inditex-2024-eur",
    company: "Inditex",
    filename: "inditex-2024.pdf",
    sha256: "f8622e93b8215ce7cc87d08f58c80605c068b5b9d43c1b9483e69b7534e60cff",
    sourceUrl: "https://www.inditex.com/itxcomweb/api/media/84135f02-0208-4439-b9c0-b13608fbfeb5/Annualaccountsanddirectorsreport2024consolidated.pdf?t=1742203067340",
    periodSlots: [
      { slotIndex: 0, fiscalPeriod: null },
      { slotIndex: 1, fiscalPeriod: { label: "2023", year: 2023, endDate: "2024-01-31" } },
      { slotIndex: 2, fiscalPeriod: { label: "2024", year: 2024, endDate: "2025-01-31" } },
    ],
    groundTruth: {
      defaultClassification: "NOT_PRESENT",
      values: [
        ...direct({ fiscalPeriod: { label: "2023", year: 2023, endDate: "2024-01-31" }, currency: "EUR", scale: "millions", sourcePage: 16, sourceStatement: "income_statement" }, [
          ["revenue", 1, "35947000000", "35,947", "Net sales"],
          ["costOfGoodsSold", 1, "15186000000", "(15,186)", "Cost of sales", "Expense is represented as a positive canonical cost."],
          ["ebit", 1, "6809000000", "6,809", "NET OPERATING PROFIT (EBIT)"],
          ["netIncome", 1, "5395000000", "5,395", "NET PROFIT"],
        ]),
        ...direct({ fiscalPeriod: { label: "2024", year: 2024, endDate: "2025-01-31" }, currency: "EUR", scale: "millions", sourcePage: 16, sourceStatement: "income_statement" }, [
          ["revenue", 2, "38632000000", "38,632", "Net sales"],
          ["costOfGoodsSold", 2, "16288000000", "(16,288)", "Cost of sales", "Expense is represented as a positive canonical cost."],
          ["ebit", 2, "7554000000", "7,554", "NET OPERATING PROFIT (EBIT)"],
          ["netIncome", 2, "5877000000", "5,877", "NET PROFIT"],
        ]),
        ...direct({ fiscalPeriod: { label: "2023", year: 2023, endDate: "2024-01-31" }, currency: "EUR", scale: "millions", sourcePage: 20, sourceStatement: "balance_sheet" }, [
          ["cash", 1, "7007000000", "7,007", "Cash and cash equivalents"],
          ["inventory", 1, "2966000000", "2,966", "Inventories"],
          ["currentAssets", 1, "16016000000", "16,016", "CURRENT ASSETS"],
          ["totalAssets", 1, "32735000000", "32,735", "TOTAL ASSETS"],
          ["currentLiabilities", 1, "8937000000", "8,937", "CURRENT LIABILITIES"],
          ["equity", 1, "18672000000", "18,672", "EQUITY"],
        ]),
        ...direct({ fiscalPeriod: { label: "2024", year: 2024, endDate: "2025-01-31" }, currency: "EUR", scale: "millions", sourcePage: 20, sourceStatement: "balance_sheet" }, [
          ["cash", 2, "6382000000", "6,382", "Cash and cash equivalents"],
          ["inventory", 2, "3321000000", "3,321", "Inventories"],
          ["currentAssets", 2, "16356000000", "16,356", "CURRENT ASSETS"],
          ["totalAssets", 2, "34714000000", "34,714", "TOTAL ASSETS"],
          ["currentLiabilities", 2, "10187000000", "10,187", "CURRENT LIABILITIES"],
          ["equity", 2, "19676000000", "19,676", "EQUITY"],
        ]),
        ...direct({ fiscalPeriod: { label: "2023", year: 2023, endDate: "2024-01-31" }, currency: "EUR", scale: "millions", sourcePage: 22, sourceStatement: "cash_flow" }, [
          ["operatingCashFlow", 1, "8667000000", "8,667", "Cash flows from operating activities"],
          ["capitalExpenditure", 1, "1399000000", "(1,399)", "Payments relating to investments in property, plant and equipment", "Cash outflow is represented as a positive capital expenditure."],
        ]),
        ...direct({ fiscalPeriod: { label: "2024", year: 2024, endDate: "2025-01-31" }, currency: "EUR", scale: "millions", sourcePage: 22, sourceStatement: "cash_flow" }, [
          ["operatingCashFlow", 2, "9288000000", "9,288", "Cash flows from operating activities"],
          ["capitalExpenditure", 2, "2207000000", "(2,207)", "Payments relating to investments in property, plant and equipment", "Cash outflow is represented as a positive capital expenditure."],
        ]),
        derivable({ canonicalFieldKey: "averageInventory", periodSlotIndex: 2, canonicalValue: "3143500000", fiscalPeriod: { label: "2024", year: 2024, endDate: "2025-01-31" }, currency: "EUR", rule: "Average of evidenced 2023 and 2024 closing inventories.", components: [
          { sourcePage: 20, sourceStatement: "balance_sheet", sourceLabel: "Inventories (2023)", sourceValue: "2,966" },
          { sourcePage: 20, sourceStatement: "balance_sheet", sourceLabel: "Inventories (2024)", sourceValue: "3,321" },
        ] }),
        ambiguous("accountsReceivable", 1, "The balance sheet combines trade and other receivables."),
        ambiguous("accountsReceivable", 2, "The balance sheet combines trade and other receivables."),
        ambiguous("totalDebt", 1, "The report gives current financial debt and an em dash for non-current financial debt; the canonical debt-component inclusion is not explicit."),
        ambiguous("totalDebt", 2, "The report gives current financial debt and an em dash for non-current financial debt; the canonical debt-component inclusion is not explicit."),
        ambiguous("averageReceivables", 2, "The two available closing balances combine trade and other receivables."),
        ambiguous("averagePayables", 2, "The two available closing balances combine trade and other payables."),
      ],
    },
  },
  {
    id: "diageo-2024-gbp",
    company: "Diageo",
    filename: "diageo-2024.pdf",
    sha256: "94b8147ed3b8f42e30b937c6f03a8ad34a466bf9671124672ec2afa26f7d8658",
    sourceUrl: "https://www.diageo.com/~/media/Files/D/Diageo-V2/Diageo-Corp/investors/results-reports-and-events/annual-reports/diageo-annual-report-2024.pdf",
    periodSlots: [
      { slotIndex: 0, fiscalPeriod: { label: "2022", year: 2022, endDate: "2022-06-30" } },
      { slotIndex: 1, fiscalPeriod: { label: "2023", year: 2023, endDate: "2023-06-30" } },
      { slotIndex: 2, fiscalPeriod: { label: "2024", year: 2024, endDate: "2024-06-30" } },
    ],
    groundTruth: {
      defaultClassification: "NOT_PRESENT",
      values: [
        ...direct({ fiscalPeriod: { label: "2022", year: 2022, endDate: "2022-06-30" }, currency: "USD", scale: "millions", sourcePage: 82, sourceStatement: "income_statement" }, [
          ["revenue", 0, "20516000000", "20,516", "Net sales"],
          ["costOfGoodsSold", 0, "7923000000", "(7,923)", "Cost of sales", "Expense is represented as a positive canonical cost."],
          ["ebit", 0, "5897000000", "5,897", "Operating profit"],
          ["interestExpense", 0, "1217000000", "(1,217)", "Finance charges", "Expense is represented as a positive canonical interest expense."],
          ["netIncome", 0, "4410000000", "4,410", "Profit for the year"],
        ]),
        ...direct({ fiscalPeriod: { label: "2023", year: 2023, endDate: "2023-06-30" }, currency: "USD", scale: "millions", sourcePage: 82, sourceStatement: "income_statement" }, [
          ["revenue", 1, "20555000000", "20,555", "Net sales"],
          ["costOfGoodsSold", 1, "8289000000", "(8,289)", "Cost of sales", "Expense is represented as a positive canonical cost."],
          ["ebit", 1, "5547000000", "5,547", "Operating profit"],
          ["interestExpense", 1, "1121000000", "(1,121)", "Finance charges", "Expense is represented as a positive canonical interest expense."],
          ["netIncome", 1, "4479000000", "4,479", "Profit for the year"],
        ]),
        ...direct({ fiscalPeriod: { label: "2024", year: 2024, endDate: "2024-06-30" }, currency: "USD", scale: "millions", sourcePage: 82, sourceStatement: "income_statement" }, [
          ["revenue", 2, "20269000000", "20,269", "Net sales"],
          ["costOfGoodsSold", 2, "8071000000", "(8,071)", "Cost of sales", "Expense is represented as a positive canonical cost."],
          ["ebit", 2, "6001000000", "6,001", "Operating profit"],
          ["interestExpense", 2, "1285000000", "(1,285)", "Finance charges", "Expense is represented as a positive canonical interest expense."],
          ["netIncome", 2, "4166000000", "4,166", "Profit for the year"],
        ]),
        ...direct({ fiscalPeriod: { label: "2023", year: 2023, endDate: "2023-06-30" }, currency: "USD", scale: "millions", sourcePage: 83, sourceStatement: "balance_sheet" }, [
          ["cash", 1, "1813000000", "1,813", "Cash and cash equivalents"],
          ["inventory", 1, "9653000000", "9,653", "Inventories"],
          ["currentAssets", 1, "15622000000", "15,622", "Current assets"],
          ["totalAssets", 1, "44883000000", "44,883", "Total assets"],
          ["currentLiabilities", 1, "9593000000", "(9,593)", "Current liabilities", "Liability is represented as a positive canonical magnitude."],
          ["equity", 1, "11709000000", "11,709", "Total equity"],
        ]),
        ...direct({ fiscalPeriod: { label: "2024", year: 2024, endDate: "2024-06-30" }, currency: "USD", scale: "millions", sourcePage: 83, sourceStatement: "balance_sheet" }, [
          ["cash", 2, "1130000000", "1,130", "Cash and cash equivalents"],
          ["inventory", 2, "9720000000", "9,720", "Inventories"],
          ["currentAssets", 2, "15126000000", "15,126", "Current assets"],
          ["totalAssets", 2, "45474000000", "45,474", "Total assets"],
          ["currentLiabilities", 2, "9868000000", "(9,868)", "Current liabilities", "Liability is represented as a positive canonical magnitude."],
          ["equity", 2, "12070000000", "12,070", "Total equity"],
        ]),
        ...direct({ fiscalPeriod: { label: "2022", year: 2022, endDate: "2022-06-30" }, currency: "USD", scale: "millions", sourcePage: 84, sourceStatement: "cash_flow" }, [
          ["operatingCashFlow", 0, "5213000000", "5,213", "Net cash inflow from operating activities"],
          ["capitalExpenditure", 0, "1457000000", "(1,457)", "Purchase of property, plant and equipment and computer software", "Cash outflow is represented as a positive capital expenditure."],
        ]),
        ...direct({ fiscalPeriod: { label: "2023", year: 2023, endDate: "2023-06-30" }, currency: "USD", scale: "millions", sourcePage: 84, sourceStatement: "cash_flow" }, [
          ["operatingCashFlow", 1, "3636000000", "3,636", "Net cash inflow from operating activities"],
          ["capitalExpenditure", 1, "1417000000", "(1,417)", "Purchase of property, plant and equipment and computer software", "Cash outflow is represented as a positive capital expenditure."],
        ]),
        ...direct({ fiscalPeriod: { label: "2024", year: 2024, endDate: "2024-06-30" }, currency: "USD", scale: "millions", sourcePage: 84, sourceStatement: "cash_flow" }, [
          ["operatingCashFlow", 2, "4105000000", "4,105", "Net cash inflow from operating activities"],
          ["capitalExpenditure", 2, "1510000000", "(1,510)", "Purchase of property, plant and equipment and computer software", "Cash outflow is represented as a positive capital expenditure."],
        ]),
        derivable({ canonicalFieldKey: "totalDebt", periodSlotIndex: 1, canonicalValue: "20791000000", fiscalPeriod: { label: "2023", year: 2023, endDate: "2023-06-30" }, currency: "USD", rule: "Sum current borrowings and non-current borrowings as positive debt magnitudes.", components: [
          { sourcePage: 83, sourceStatement: "balance_sheet", sourceLabel: "Borrowings and bank overdrafts", sourceValue: "(2,142)" },
          { sourcePage: 83, sourceStatement: "balance_sheet", sourceLabel: "Borrowings", sourceValue: "(18,649)" },
        ] }),
        derivable({ canonicalFieldKey: "totalDebt", periodSlotIndex: 2, canonicalValue: "21501000000", fiscalPeriod: { label: "2024", year: 2024, endDate: "2024-06-30" }, currency: "USD", rule: "Sum current borrowings and non-current borrowings as positive debt magnitudes.", components: [
          { sourcePage: 83, sourceStatement: "balance_sheet", sourceLabel: "Borrowings and bank overdrafts", sourceValue: "(2,885)" },
          { sourcePage: 83, sourceStatement: "balance_sheet", sourceLabel: "Borrowings", sourceValue: "(18,616)" },
        ] }),
        derivable({ canonicalFieldKey: "averageInventory", periodSlotIndex: 2, canonicalValue: "9686500000", fiscalPeriod: { label: "2024", year: 2024, endDate: "2024-06-30" }, currency: "USD", rule: "Average of evidenced 2023 and 2024 closing inventories.", components: [
          { sourcePage: 83, sourceStatement: "balance_sheet", sourceLabel: "Inventories (2023)", sourceValue: "9,653" },
          { sourcePage: 83, sourceStatement: "balance_sheet", sourceLabel: "Inventories (2024)", sourceValue: "9,720" },
        ] }),
        ambiguous("cash", 0, "The balance sheet gives 1 July 2022, an opening balance rather than the FY2022 closing balance."),
        ambiguous("accountsReceivable", 0, "The balance sheet combines trade and other receivables."),
        ambiguous("accountsReceivable", 1, "The balance sheet combines trade and other receivables."),
        ambiguous("accountsReceivable", 2, "The balance sheet combines trade and other receivables."),
        ambiguous("inventory", 0, "The balance sheet gives 1 July 2022, an opening balance rather than the FY2022 closing balance."),
        ambiguous("currentAssets", 0, "The balance sheet gives 1 July 2022, an opening balance rather than the FY2022 closing balance."),
        ambiguous("totalAssets", 0, "The balance sheet gives 1 July 2022, an opening balance rather than the FY2022 closing balance."),
        ambiguous("currentLiabilities", 0, "The balance sheet gives 1 July 2022, an opening balance rather than the FY2022 closing balance."),
        ambiguous("totalDebt", 0, "The balance sheet gives 1 July 2022, an opening balance rather than the FY2022 closing balance."),
        ambiguous("equity", 0, "The balance sheet gives 1 July 2022, an opening balance rather than the FY2022 closing balance."),
        ambiguous("averageReceivables", 0, "The report does not isolate accounts receivable from other receivables."),
        ambiguous("averageReceivables", 1, "The report does not isolate accounts receivable from other receivables."),
        ambiguous("averageReceivables", 2, "The report does not isolate accounts receivable from other receivables."),
        ambiguous("averagePayables", 0, "The report does not isolate accounts payable from other payables."),
        ambiguous("averagePayables", 1, "The report does not isolate accounts payable from other payables."),
        ambiguous("averagePayables", 2, "The report does not isolate accounts payable from other payables."),
      ],
    },
  },
] as const;
