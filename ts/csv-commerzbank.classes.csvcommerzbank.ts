import * as plugins from './csv-commerzbank.plugins';

import * as interfaces from './interfaces';
import { AcCsvParser } from '@financeplus/finplus-interfaces';

export class CsvCommerzbank extends AcCsvParser<interfaces.ICommerzbankTransaction> {
  // ========= STATIC ================
  /**
   * get the SpendeskData from an extracted direcotory
   * @param dirPath
   */
  public static async fromFile(filePath: string): Promise<CsvCommerzbank> {
    const reresolvedPath = plugins.path.resolve(filePath);
    const fileString = plugins.smartfile.fs.toStringSync(reresolvedPath);
    const csvCommerzbank = await CsvCommerzbank.fromCsvString(fileString);
    return csvCommerzbank;
  }

  /**
   * get the SpendeskData from an extracted direcotory
   * @param dirPath
   */
  public static async fromDir(dirPath: string): Promise<CsvCommerzbank> {
    const foundFiles: string[] = await plugins.smartfile.fs.listFileTree(
      dirPath,
      '**/commerzbank*',
      true // lets make this an array of absolute paths
    );

    if (foundFiles.length === 0) {
      throw new Error('no files found!');
    }

    const csvCommerzbanks: CsvCommerzbank[] = [];

    for (const foundFile of foundFiles) {
      const fileString = plugins.smartfile.fs.toStringSync(plugins.path.resolve(foundFile));
      plugins.path.join(dirPath, foundFile);
      csvCommerzbanks.push(await this.fromFile(foundFile));
    }

    let returnCsvCommerzbank: CsvCommerzbank;
    for (const csvCommerzbankInstance of csvCommerzbanks) {
      if (!returnCsvCommerzbank) {
        returnCsvCommerzbank = csvCommerzbankInstance;
      } else {
        await returnCsvCommerzbank.concat(csvCommerzbankInstance);
      }
    }
    return returnCsvCommerzbank;
  }

  public static async fromCsvString(csvStringArg: string): Promise<CsvCommerzbank> {
    // lets sanatize the csv string for bom markers
    csvStringArg = csvStringArg.replace(/^\uFEFF/, '');

    // lets parse the data from the directory
    const csvInstance = await plugins.smartcsv.Csv.createCsvFromString(csvStringArg, {
      headers: true
    });

    // lets differentiate between payments and credits
    const payments: interfaces.ICommerzbankOriginalTransaction[] = await csvInstance.exportAsObject();
    const finalTransactionArray: interfaces.ICommerzbankTransaction[] = [];
    for (const transaction of payments) {
        // transaction.Buchungstag = transaction.Wertstellung;
        // console.log(transaction.Buchungstag);
        const finalTransaction: interfaces.ICommerzbankTransaction = {
          simpleTransaction: null,
          transactionHash: null,
          original: transaction,
          amount: parseInt(transaction.Betrag, 10),
          currency: transaction.Währung,
          description: transaction.Buchungstext,
          transactionDate: plugins.smarttime.ExtendedDate.fromEuropeanDate(transaction.Buchungstag),
          valuationDate: plugins.smarttime.ExtendedDate.fromEuropeanDate(transaction.Wertstellung),
          transactionType: ((): interfaces.TTransactionType => {
            switch (transaction.Umsatzart) {
              case 'Gutschrift':
                return 'Credit';
              case 'Lastschrift':
                return 'Debit';
              case 'Zinsen/Entgelte':
                return 'BankFees';
              case 'Überweisung':
                return 'ActiveTransfer';
              default:
                throw new Error(`unknown transactiontype ${transaction.Umsatzart}`);
            }
          })()
        };

        // lets assign the transactionHash
        finalTransaction.transactionHash = await plugins.smarthash.sha265FromObject({
          description: finalTransaction.description,
          amount: finalTransaction.amount,
          date: finalTransaction.valuationDate
        });

        finalTransaction.simpleTransaction = {
          id: finalTransaction.transactionHash,
          accountId: null,
          name: finalTransaction.description,
          amount: finalTransaction.amount,
          description: finalTransaction.description,
          date: finalTransaction.transactionDate
        };
        finalTransactionArray.push(finalTransaction);
      }

    // lets preprocess those payments
    const csvCommerzbankInstance = new CsvCommerzbank(finalTransactionArray);
    return csvCommerzbankInstance;
  }

  /**
   * get the SpendeskData from Spendesk.com
   * @param dirPath
   */
  public static async fromAPI(dirPath: string) {
    // TODO:
  }

  // INSTANCE
  public paymentProviderName = 'Commerzbank';
  public transactionArray: interfaces.ICommerzbankTransaction[] = [];

  constructor(transactionsArg: interfaces.ICommerzbankTransaction[]) {
    super();
    this.transactionArray = transactionsArg;
  }

  /**
   * gets the transactions of this instance
   */
  public async getTransactions() {
    return this.transactionArray;
  }

  /**
   * concats the transactionArray of this instance with the transactionarray of another one
   */
  public async concat(csvCommerzbankArg: CsvCommerzbank): Promise<CsvCommerzbank> {
    this.transactionArray = this.transactionArray.concat(csvCommerzbankArg.transactionArray);
    return this;
  }
}
