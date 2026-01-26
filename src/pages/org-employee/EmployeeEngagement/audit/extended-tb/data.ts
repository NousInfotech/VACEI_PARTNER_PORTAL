export interface ExtendedTBRow {
    id: number;
    code: string;
    accountName: string;
    currentYear: number;
    reClassification: number;
    adjustments: number;
    finalBalance: number;
    priorYear: number;
    classification: string;
    actions: string[];
}

export const financialMockData: ExtendedTBRow[] = [
    {
        id: 1,
        code: "1",
        accountName: "Cash and cash equivalents",
        currentYear: 265769,
        reClassification: 0,
        adjustments: 0,
        finalBalance: 265769,
        priorYear: 217685,
        classification: "Assets > Non-current > Intangible assets > Intangible assets - Cost",

        actions: []
    },
    {
        id: 2,
        code: "2",
        accountName: "Accruals",
        currentYear: -5285,
        reClassification: 0,
        adjustments: 0,
        finalBalance: -5285,
        priorYear: -4285,
        classification: "Equity > Equity > Share capital",

        actions: ["Add Level"]
    },
    {
        id: 3,
        code: "3",
        accountName: "FSS & NI DUE",
        currentYear: -14740,
        reClassification: 0,
        adjustments: 0,
        finalBalance: -14740,
        priorYear: -12852,
        classification: "Equity",

        actions: ["Add Level"]
    },
    {
        id: 4,
        code: "4",
        accountName: "Shareholders' Loan",
        currentYear: -453816,
        reClassification: 0,
        adjustments: 0,
        finalBalance: -453816,
        priorYear: -407575,
        classification: "Equity",

        actions: ["Add Level"]
    },
    {
        id: 5,
        code: "5",
        accountName: "Other payables",
        currentYear: -8671,
        reClassification: 0,
        adjustments: 0,
        finalBalance: -8671,
        priorYear: -8671,
        classification: "Equity",

        actions: ["Add Level"]
    },
    {
        id: 6,
        code: "6",
        accountName: "Opening Balance Equity",
        currentYear: 216983,
        reClassification: 0,
        adjustments: 0,
        finalBalance: 216983,
        priorYear: 215938,
        classification: "Equity",

        actions: ["Add Level"]
    },
    {
        id: 7,
        code: "7",
        accountName: "Share capital",
        currentYear: -240,
        reClassification: 0,
        adjustments: 0,
        finalBalance: -240,
        priorYear: -240,
        classification: "Equity",

        actions: ["Add Level"]
    },
    {
        id: 8,
        code: "8",
        accountName: "Sales",
        currentYear: -60000,
        reClassification: 0,
        adjustments: 0,
        finalBalance: -60000,
        priorYear: 0,
        classification: "Income",

        actions: ["Add Level"]
    },
    {
        id: 9,
        code: "9",
        accountName: "Administrative Expenses: Professional Fees",
        currentYear: 0,
        reClassification: 0,
        adjustments: 0,
        finalBalance: 0,
        priorYear: 0,
        classification: "Expenses",

        actions: ["Add Level"]
    },
    {
        id: 10,
        code: "10",
        accountName: "Administrative Expenses: Tax Return Fee",
        currentYear: 385,
        reClassification: 0,
        adjustments: 0,
        finalBalance: 385,
        priorYear: 385,
        classification: "Expenses",

        actions: ["Add Level"]
    },
    {
        id: 11,
        code: "11",
        accountName: "Administrative Expenses: Annual Return Fee",
        currentYear: 100,
        reClassification: 0,
        adjustments: 0,
        finalBalance: 100,
        priorYear: 100,
        classification: "Expenses",

        actions: ["Add Level"]
    },
    {
        id: 12,
        code: "12",
        accountName: "Audit Fees",
        currentYear: 1100,
        reClassification: 0,
        adjustments: 0,
        finalBalance: 1100,
        priorYear: 1100,
        classification: "Expenses",

        actions: ["Add Level"]
    },
    {
        id: 13,
        code: "13",
        accountName: "Wage expenses: 6000 Gross Salary",
        currentYear: 64962,
        reClassification: 0,
        adjustments: 0,
        finalBalance: 64962,
        priorYear: 64151,
        classification: "Expenses",

        actions: ["Add Level"]
    },
    {
        id: 14,
        code: "14",
        accountName: "Other Income: Other Income (not taxable)",
        currentYear: -4917,
        reClassification: 0,
        adjustments: 0,
        finalBalance: -4917,
        priorYear: -4073,
        classification: "Income",

        actions: ["Add Level"]
    }
];
