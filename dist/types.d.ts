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
    company?: string;
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
export type Language = 'de' | 'en';
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
export declare const unitTranslations: Record<string, Record<Language, string>>;
export declare function translateUnit(unit: string, language: Language): string;
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
export declare const translations: Record<Language, Translations>;
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
//# sourceMappingURL=types.d.ts.map