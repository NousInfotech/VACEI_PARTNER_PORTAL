/**
 * Map hierarchical classifications to procedure keys (matches REFERENCE-PORTAL).
 */
export function mapClassificationToProcedureKey(classification: string): string {
  const mapping: Record<string, string> = {
    "Assets > Current > Cash & Cash Equivalents": "Bank and Cash",
    "Assets > Current > Trade Receivables": "Receivables",
    "Assets > Current > Other Receivables": "Receivables",
    "Assets > Current > Prepayments": "Receivables",
    "Assets > Current > Inventory": "Inventory",
    "Assets > Current > Recoverable VAT/Tax": "Taxation",
    "Assets > Non-current > Property, Plant & Equipment": "PPE",
    "Assets > Non-current > Intangible Assets": "Intangible Assets",
    "Assets > Non-current > Investments": "Investments",
    "Assets > Non-current > Deferred Tax Asset": "Taxation",
    "Assets > Non-current > Long-term Receivables/Deposits": "Receivables",
    "Liabilities > Current > Trade Payables": "Payables",
    "Liabilities > Current > Accruals": "Payables",
    "Liabilities > Current > Taxes Payable": "Taxation",
    "Liabilities > Current > Short-term Borrowings/Overdraft": "Borrowings and Loans",
    "Liabilities > Current > Other Payables": "Payables",
    "Liabilities > Non-current > Borrowings (Long-term)": "Borrowings and Loans",
    "Liabilities > Non-current > Provisions": "Payables",
    "Liabilities > Non-current > Deferred Tax Liability": "Taxation",
    "Liabilities > Non-current > Lease Liabilities": "Borrowings and Loans",
    "Equity > Share Capital": "Equity",
    "Equity > Share Premium": "Equity",
    "Equity > Reserves": "Equity",
    "Equity > Retained Earnings": "Equity",
    "Income > Operating > Revenue (Goods)": "Profit and Loss",
    "Income > Operating > Revenue (Services)": "Profit and Loss",
    "Income > Operating > Other Operating Income": "Profit and Loss",
    "Income > Non-operating > Other Income": "Profit and Loss",
    "Income > Non-operating > FX Gains": "Profit and Loss",
    "Expenses > Cost of Sales > Materials/Purchases": "Profit and Loss",
    "Expenses > Cost of Sales > Freight Inwards": "Profit and Loss",
    "Expenses > Cost of Sales > Manufacturing Labour": "Profit and Loss",
    "Expenses > Cost of Sales > Production Overheads": "Profit and Loss",
    "Expenses > Direct Costs": "Profit and Loss",
    "Expenses > Administrative Expenses > Payroll": "Profit and Loss",
    "Expenses > Administrative Expenses > Rent & Utilities": "Profit and Loss",
    "Expenses > Administrative Expenses > Office/Admin": "Profit and Loss",
    "Expenses > Administrative Expenses > Marketing": "Profit and Loss",
    "Expenses > Administrative Expenses > Repairs & Maintenance": "Profit and Loss",
    "Expenses > Administrative Expenses > IT & Software": "Profit and Loss",
    "Expenses > Administrative Expenses > Insurance": "Profit and Loss",
    "Expenses > Administrative Expenses > Professional Fees": "Profit and Loss",
    "Expenses > Administrative Expenses > Depreciation & Amortisation": "Profit and Loss",
    "Expenses > Administrative Expenses > Research & Development": "Profit and Loss",
    "Expenses > Administrative Expenses > Lease Expenses": "Profit and Loss",
    "Expenses > Administrative Expenses > Bank Charges": "Profit and Loss",
    "Expenses > Administrative Expenses > Travel & Entertainment": "Profit and Loss",
    "Expenses > Administrative Expenses > Training & Staff Welfare": "Profit and Loss",
    "Expenses > Administrative Expenses > Telephone & Communication": "Profit and Loss",
    "Expenses > Administrative Expenses > Subscriptions & Memberships": "Profit and Loss",
    "Expenses > Administrative Expenses > Bad Debt Written Off": "Profit and Loss",
    "Expenses > Administrative Expenses > Stationery & Printing": "Profit and Loss",
    "Expenses > Finance Costs": "Profit and Loss",
    "Expenses > Other > FX Losses": "Profit and Loss",
    "Expenses > Other > Exceptional/Impairment": "Profit and Loss",
  };
  return mapping[classification] ?? "default";
}

/** Matches REFERENCE-PORTAL: for 3+ parts return 3rd segment (index 2), else last part. */
export function formatClassificationForDisplay(classification?: string): string {
  if (!classification) return "General";
  const parts = classification.split(" > ");
  return parts.length >= 3 ? parts[2] : parts[parts.length - 1];
}
