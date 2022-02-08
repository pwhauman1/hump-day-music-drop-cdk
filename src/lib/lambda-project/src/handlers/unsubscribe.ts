import { Handler } from "aws-cdk-lib/aws-lambda";
import DDBClient from '../modules/DDBClient';
import { RECIPIENTS_TABLE } from '../constants';
import { makeLambdaBaseResponse } from "../modules/Utils";

export const unsubscribe: Handler = async (event: any, context: any) => {
    const body = JSON.parse(event.body);
    const email = body.email;
    if (!email || typeof email !== 'string') {
        throw new Error(`Email parameter not a string! Got: ${email}`);
    }

    const dynamoDbClient = DDBClient.getDDBClient();
    const key = {
        email,
    }
    const didDelete: boolean = await dynamoDbClient.removeItemFromTable(key, RECIPIENTS_TABLE);
    if (didDelete) {
        const infoMessage = `Successfully unsubscribed ${email}`;
        return makeLambdaBaseResponse({ infoMessage });
    } else {
        throw new Error(`Failed to unsubscribe ${email}. Failed to delete item in database.`);
    }
}

