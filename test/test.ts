// tslint:disable-next-line: no-implicit-dependencies
import { expect, tap } from '@pushrocks/tapbundle';
import * as csvCommerzbank from '../ts/index';
import * as path from 'path';

const test1 = tap.test('should correctly parse a directory', async tools => {
  if (process.env.CI) {
    return;
  }
  const csvSpendeskInstance = await csvCommerzbank.CsvCommerzbank.fromDir(
    path.join(__dirname, '../.nogit/')
  );
  console.log(csvSpendeskInstance.transactionArray);
  console.log(csvSpendeskInstance.transactionArray.map(transaction => {
    return transaction.simpleTransaction;
  }));
  return csvSpendeskInstance.transactionArray;
});

tap.start();
