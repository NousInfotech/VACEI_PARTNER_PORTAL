export interface AccountingCycle {
  id: string;
  engagementId: string;
  companyId: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  transactionsCount?: number;
  company?: { id: string; name: string };
}

export interface TransactionLineItem {
  id?: string;
  chartAccountId: string;
  description?: string | null;
  quantity?: number | null;
  unitPrice?: number | null;
  amount: number;
}

export interface AccountingTransaction {
  id: string;
  accountingCycleId: string;
  companyId: string;
  type: string;
  vendor: string | null;
  customer: string | null;
  docNumber: string | null;
  txnDate: string;
  dueDate: string | null;
  totalAmount: number;
  taxAmount: number | null;
  currency: string;
  description: string | null;
  quickbooksSyncStatus: string | null;
  lineItems: TransactionLineItem[];
}

export interface ChartAccount {
  id: string;
  companyId: string;
  code: string;
  name: string;
  classification: string;
  accountType: string | null;
  active: boolean;
}

export interface QuickbooksSyncHistoryRow {
  id: string;
  syncStartTime: string;
  syncEndTime: string | null;
  status: number;
  syncMessage: string | null;
  syncedEntities: Record<string, number> | null;
}

export type QBReportRow = {
  Header?: { ColData?: { value?: string }[] };
  Rows?: { Row?: QBReportRow[] };
  Summary?: { ColData?: { value?: string }[] };
  ColData?: { value?: string; id?: string }[];
  type?: string;
};

export interface QBInvoiceDetail {
  Id?: string;
  DocNumber?: string;
  TxnDate?: string;
  DueDate?: string;
  TotalAmt?: number;
  Balance?: number;
  CurrencyRef?: { value?: string; name?: string };
  CustomerRef?: { value?: string; name?: string };
  BillAddr?: { Line1?: string; Line2?: string; Line3?: string; Line4?: string };
  ShipAddr?: { Line1?: string; City?: string; CountrySubDivisionCode?: string; PostalCode?: string };
  BillEmail?: { Address?: string };
  CustomerMemo?: { value?: string };
  SalesTermRef?: { value?: string; name?: string };
  TxnTaxDetail?: { TotalTax?: number; TaxLine?: Array<{ Amount?: number; TaxLineDetail?: { TaxPercent?: number } }> };
  Line?: Array<{
    Id?: string;
    LineNum?: number;
    Description?: string;
    Amount?: number;
    DetailType?: string;
    SalesItemLineDetail?: { ItemRef?: { name?: string }; UnitPrice?: number; Qty?: number; ItemAccountRef?: { name?: string }; TaxCodeRef?: { value?: string } };
    SubTotalLineDetail?: Record<string, unknown>;
  }>;
  MetaData?: { CreateTime?: string; LastUpdatedTime?: string };
}

export interface QBBillDetail {
  Id?: string;
  DocNumber?: string;
  TxnDate?: string;
  DueDate?: string;
  TotalAmt?: number;
  Balance?: number;
  CurrencyRef?: { value?: string; name?: string };
  VendorRef?: { value?: string; name?: string };
  VendorAddr?: { Line1?: string; City?: string; CountrySubDivisionCode?: string; PostalCode?: string };
  APAccountRef?: { value?: string; name?: string };
  Line?: Array<{
    Id?: string;
    LineNum?: number;
    Description?: string;
    Amount?: number;
    DetailType?: string;
    AccountBasedExpenseLineDetail?: { AccountRef?: { value?: string; name?: string }; BillableStatus?: string; TaxCodeRef?: { value?: string } };
  }>;
  MetaData?: { CreateTime?: string; LastUpdatedTime?: string };
}
