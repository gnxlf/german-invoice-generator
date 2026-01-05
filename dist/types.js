"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.translations = exports.unitTranslations = void 0;
exports.translateUnit = translateUnit;
// Unit translations mapping
exports.unitTranslations = {
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
function translateUnit(unit, language) {
    const translation = exports.unitTranslations[unit];
    return translation ? translation[language] : unit;
}
exports.translations = {
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
//# sourceMappingURL=types.js.map