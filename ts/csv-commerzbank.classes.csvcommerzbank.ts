import * as plugins from './csv-commerzbank.plugins';

import * as interfaces from './interfaces';

export class CsvCommerzbank {
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
    const foundFiles: string[] = await plugins.smartfile.fs.listFileTree(dirPath, '**/Spendesk*', true);
    
    if (foundFiles.length === 0) {
      throw new Error('no files found!');
    }

    const csvCommerzbanks: CsvCommerzbank[] = [];

    for (const foundFile of foundFiles) {
      const fileString = plugins.smartfile.fs.toStringSync(plugins.path.resolve(foundFile));
      plugins.path.join(dirPath, foundFile);
      csvCommerzbanks.push(await this.fromFile(foundFile)) ;
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
    // lets parse the data from the directory
    const csvInstance = await plugins.smartcsv.Csv.createCsvFromString(csvStringArg, {
      headers: true
    });

    // lets differentiate between payments and credits
    let payments: interfaces.ICommerzbankTransaction[] = await csvInstance.exportAsObject();

    // lets preprocess those payments
    payments = await helpers.preprocessPaymentArray(payments);
    payments = await helpers.attachSimplifiedTransactions(payments);
    const csvCommerzbankInstance = new CsvCommerzbank(payments);
    return csvCommerzbankInstance;
  }

  /**
   * get the SpendeskData from Spendesk.com
   * @param dirPath
   */
  public static async fromSpendeskCom(dirPath: string) {
    // TODO:
  }

  // Instance
  transactionArray: interfaces.ICommerzbankTransaction[] = [];

  constructor() {};
}