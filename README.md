# German Invoice Generator

TypeScript-basierter PDF-Generator für rechtskonforme deutsche Rechnungen nach §14 UStG.

## Installation

Von GitHub installieren:

```bash
npm install github:username/custom_invoice_gen
```

Oder Repository klonen:

```bash
git clone https://github.com/username/custom_invoice_gen.git
cd custom_invoice_gen
npm install
npm run build
```

## Verwendung

### CLI

```bash
npm run generate
npm run generate -- input.json
npm run generate -- input.json output.pdf
```

### Programmatisch

```typescript
import { generateInvoice, InvoiceData } from "custom-invoice-generator";

const data: InvoiceData = {
    invoiceNumber: "RE-000001",
    issueDate: "2025-12-30",
    deliveryDate: "30.12.2025",
    sender: {
        name: "Firma GmbH",
        street: "Beispielstr. 1",
        postalCode: "12345",
        city: "Berlin",
        email: "info@firma.de",
    },
    recipient: {
        name: "Kunde AG",
        street: "Kundenweg 2",
        postalCode: "67890",
        city: "Hamburg",
    },
    taxIdentifiers: {
        ustIdNr: "DE123456789",
    },
    bankDetails: {
        bankName: "Beispielbank",
        iban: "DE89370400440532013000",
        bic: "COBADEFFXXX",
    },
    lineItems: [
        {
            description: "Produkt A",
            quantity: 2,
            unit: "Stück",
            unitPrice: 119.0,
            taxRate: 19,
        },
    ],
    currency: "EUR",
};

await generateInvoice(data, "rechnung.pdf");
```

## Datenstruktur

Minimale Anforderungen:

```json
{
    "invoiceNumber": "RE-000001",
    "issueDate": "2025-12-30",
    "deliveryDate": "30.12.2025",
    "sender": {
        "name": "string",
        "street": "string",
        "postalCode": "string",
        "city": "string"
    },
    "recipient": {
        "name": "string",
        "street": "string",
        "postalCode": "string",
        "city": "string"
    },
    "taxIdentifiers": {
        "ustIdNr": "string"
    },
    "bankDetails": {
        "bankName": "string",
        "iban": "string",
        "bic": "string"
    },
    "lineItems": [
        {
            "description": "string",
            "quantity": 1,
            "unit": "Stück",
            "unitPrice": 100.0,
            "taxRate": 19
        }
    ]
}
```

Optionale Felder:

-   `orderNumber`: Bestellnummer
-   `shipping.amount`: Versandkosten (brutto)
-   `shipping.description`: Versandkostenbeschreibung
-   `logo.logoPath`: Pfad zu Logo-Datei (PNG/JPG)
-   `logo.logoBase64`: Base64-kodiertes Logo
-   `accentColor`: Hex-Farbcode für Design-Akzente
-   `notes`: Zusätzliche Hinweise auf der Rechnung

## Features

-   Automatische Netto/Brutto-Berechnung aus Bruttopreisen
-   Mehrere Steuersätze pro Rechnung
-   Versandkosten mit automatischer Steuerberechnung (dominanter Steuersatz)
-   Logo-Einbindung (Dateipfad oder Base64)
-   DIN A4 Hochformat
-   Pflichtangaben nach §14 UStG

## Steuerberechnung

Alle `unitPrice` Werte sind Bruttopreise (inkl. MwSt). Die Steuer wird automatisch berechnet:

```
Netto = Brutto / (1 + Steuersatz/100)
Steuer = Brutto - Netto
```

Versandkosten werden mit dem dominanten Steuersatz berechnet (Steuersatz mit dem höchsten Brutto-Anteil).

## Typen

Vollständige TypeScript-Definitionen in `src/types.ts`:

-   `InvoiceData`
-   `SenderDetails`
-   `RecipientDetails`
-   `TaxIdentifiers`
-   `BankDetails`
-   `LineItem`
-   `ShippingCost`
-   `LogoConfig`

## Lizenz

MIT-License
