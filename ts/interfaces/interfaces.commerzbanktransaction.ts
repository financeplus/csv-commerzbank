import * as plugins from '../csv-commerzbank.plugins';

export interface ICommerzbankOriginalTransaction {
  Buchungstag: string;
  Wertstellung: string;
  Umsatzart: 'Überweisung' | 'Gutschrift' | 'Lastschrift' | 'Zinsen/Entgelte';
  Buchungstext: string;
  Betrag: string;
  Währung: string;
  Auftraggeberkonto: string;
  'Bankleitzahl Auftraggeberkonto': string;
  'IBAN Auftraggeberkonto': string;
  Kategorie: string;
}

export type TTransactionType = 'Credit' | 'Debit' | 'ActiveTransfer' | 'BankFees';

export interface ICommerzbankTransaction {
  simpleTransaction: plugins.tsclass.ITransaction;
  original: ICommerzbankOriginalTransaction;

  // translated to English
  transactionDate: plugins.smarttime.ExtendedDate;
  valuationDate: plugins.smarttime.ExtendedDate;
  transactionType: TTransactionType;
  description: string;
  amount: number;
  currency: string;
}
