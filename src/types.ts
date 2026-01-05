export interface SenderDetails {
  name: string;
  street: string;
  postalCode: string;
  city: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface RecipientDetails {
  name: string;
  addressLine2?: string;
  street: string;
  postalCode: string;
  city: string;
  country?: string;
}

export interface TaxIdentifiers {
  steuernummer?: string;
  ustIdNr?: string;
}

export interface BankDetails {
  bankName: string;
  iban: string;
  bic: string;
  accountHolder?: string;
}

export interface LegalInfo {
  legalForm?: string;
  registerNumber?: string;
  registerCourt?: string;
  managingDirector?: string;
}

export interface LineItem {
  position?: number;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxRate: number;
}

export interface LogoConfig {
  logoPath?: string | null;
  logoBase64?: string | null;
  maxWidth?: number;
  maxHeight?: number;
}

export interface InvoiceData {
  language?: Language;
  invoiceNumber: string;
  orderNumber?: string;
  issueDate: string;
  deliveryDate: string;
  dueDate?: string;
  paymentTerms?: string;
  sender: SenderDetails;
  recipient: RecipientDetails;
  taxIdentifiers: TaxIdentifiers;
  bankDetails: BankDetails;
  legalInfo?: LegalInfo;
  lineItems: LineItem[];
  logo?: LogoConfig;
  currency?: string;
  notes?: string;
  accentColor?: string;
  shipping?: ShippingCost;
}

export interface ShippingCost {
  amount: number;
  description?: string;
}

export type Language = 'de' | 'en';

// Unit translations mapping
export const unitTranslations: Record<string, Record<Language, string>> = {
  'Stück': { de: 'Stück', en: 'Piece' },
  'Stk.': { de: 'Stk.', en: 'Pcs.' },
  'Stunden': { de: 'Stunden', en: 'Hours' },
  'Std.': { de: 'Std.', en: 'Hrs.' },
  'Tage': { de: 'Tage', en: 'Days' },
  'Pauschal': { de: 'Pauschal', en: 'Flat' },
  'Monat': { de: 'Monat', en: 'Month' },
  'Jahr': { de: 'Jahr', en: 'Year' },
  'kg': { de: 'kg', en: 'kg' },
  'm': { de: 'm', en: 'm' },
  'm²': { de: 'm²', en: 'm²' },
  'Liter': { de: 'Liter', en: 'Liter' },
};

export function translateUnit(unit: string, language: Language): string {
  const translation = unitTranslations[unit];
  return translation ? translation[language] : unit;
}

export interface Translations {
  invoice: string;
  invoiceNumber: string;
  orderNumber: string;
  invoiceDate: string;
  deliveryDate: string;
  position: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  vat: string;
  totalGross: string;
  totalNet: string;
  vatAmount: string;
  invoiceTotal: string;
  notes: string;
  vatId: string;
  taxNumber: string;
  iban: string;
  bic: string;
}

export const translations: Record<Language, Translations> = {
  de: {
    invoice: 'RECHNUNG',
    invoiceNumber: 'Rechnungsnummer:',
    orderNumber: 'Bestellnummer:',
    invoiceDate: 'Rechnungsdatum:',
    deliveryDate: 'Lieferdatum:',
    position: 'Pos.',
    description: 'Beschreibung',
    quantity: 'Menge',
    unit: 'Einheit',
    unitPrice: 'Einzelpreis',
    vat: 'USt.',
    totalGross: 'Gesamt (brutto)',
    totalNet: 'Gesamt Netto:',
    vatAmount: 'Umsatzsteuer:',
    invoiceTotal: 'Rechnungsbetrag:',
    notes: 'HINWEISE',
    vatId: 'USt.-IdNr.:',
    taxNumber: 'Steuernummer:',
    iban: 'IBAN:',
    bic: 'BIC:',
  },
  en: {
    invoice: 'INVOICE',
    invoiceNumber: 'Invoice Number:',
    orderNumber: 'Order Number:',
    invoiceDate: 'Invoice Date:',
    deliveryDate: 'Delivery Date:',
    position: 'Pos.',
    description: 'Description',
    quantity: 'Qty',
    unit: 'Unit',
    unitPrice: 'Unit Price',
    vat: 'VAT',
    totalGross: 'Total (gross)',
    totalNet: 'Total Net:',
    vatAmount: 'VAT:',
    invoiceTotal: 'Invoice Total:',
    notes: 'NOTES',
    vatId: 'VAT ID:',
    taxNumber: 'Tax Number:',
    iban: 'IBAN:',
    bic: 'BIC:',
  },
};

export interface InvoiceTotals {
  itemsGrossTotal: number;
  netTotal: number;
  taxAmounts: Map<number, number>;
  grossTotal: number;
  shipping: {
    gross: number;
    net: number;
    tax: number;
    taxRate: number;
  };
}
