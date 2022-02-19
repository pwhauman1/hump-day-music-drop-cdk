import { hdmdWelcomeStrings } from "../constants";
import { ILambdaOutputFormatForProxy, ILambdaResponseBody, ILambdaResponseContent } from "../interfaces";

export const getDateKey = (): number => {
  // now is in UTC time since Lambda's don't have a timezone
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth() + 1; // month is zero indexed
  const year = now.getFullYear();
  let dateKey = '' + year;
  dateKey += month <= 9 ? '0' + month : '' + month;
  dateKey += day <= 9 ? '0' + day : '' + day;
  return parseInt(dateKey);
}

export const getRandomWelcome = (): string => {
  const length = hdmdWelcomeStrings.length;
  return hdmdWelcomeStrings[Math.floor(Math.random() * length)];
}

export const paginate = (arr: any[], split: number) => {
  if (arr.length == null) throw new Error(`Cannot Paginate something that isn\'t an Array\nGot: ${arr}`);
  const paginatedArr = [];
  let i = 0;
  while (i < arr.length) {
    paginatedArr.push(arr.slice(i, i += split));
  }
  return paginatedArr.filter(a => a.length > 0);
}

export const makeLambdaBaseResponse = (content: ILambdaResponseContent): ILambdaOutputFormatForProxy => {
  const lambdaBody: ILambdaResponseBody = {
    content,
  }
  const retVal: ILambdaOutputFormatForProxy = {
    body: JSON.stringify(lambdaBody),
    headers: {
      "Access-Control-Allow-Headers" : "Content-Type",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET,DELETE,PUT"
    },
    statusCode: 200,
    isBase64Encoded: false,
  }
  return retVal;
}