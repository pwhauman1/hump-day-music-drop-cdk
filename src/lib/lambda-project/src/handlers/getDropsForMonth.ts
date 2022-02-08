import { Handler } from "aws-cdk-lib/aws-lambda";
import { IDrop } from "../interfaces";
import DDBClient from '../modules/DDBClient';
import { makeLambdaBaseResponse } from "../modules/Utils";

export const getDropsForMonth: Handler = async (event: any, context: any) => {
    const month = parseInt(event?.queryStringParameters?.month);
    const year = parseInt(event?.queryStringParameters?.year);
    // anything not a number will trigger the if statement
    if (!(month >= 1 || month <= 12)) {
        const msg = `Invalid month passed to lambda. Must pass a number between 1 and 12 inclusive. Got ${month}`;
        throw new Error(msg);
    }
    if (typeof year !== 'number') {
        const msg = `Year must be a number. Got ${year} as a ${typeof year}`;
        throw new Error(msg);
    }
    const monthAsString = month >= 10 ? '' + month : '0' + month;
    const lowerBound = parseInt('' + year + monthAsString + '00');
    const upperBound = parseInt('' + year + monthAsString + '99');
    const dynamoDbClient = DDBClient.getDDBClient();
    const drops: IDrop[] = await dynamoDbClient.getDropsForRange(lowerBound, upperBound);
    const returnContent = {
        infoMessage: `Recieved ${drops.length}`,
        drops,
    }
    return makeLambdaBaseResponse(returnContent);
}

