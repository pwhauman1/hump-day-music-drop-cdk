import { Handler } from "aws-cdk-lib/aws-lambda";
import DDBClient from '../modules/DDBClient';
import { EMAIL_REG_EXP, RECIPIENTS_TABLE } from '../constants';
import { makeLambdaBaseResponse } from "../modules/Utils";

export const subscribe: Handler = async (event: any, context: any) => {
    const body = JSON.parse(event.body);
    const email = body.email;

    if (!email || typeof email !== 'string') {
        throw new Error(`Email parameter not a string! Got: ${email}`);
    }
    if (!email.match(EMAIL_REG_EXP)) {
        throw new Error(`Email is not of the form [not a whitespace]@[not a whitespace].[a-z]. Got: ${email}`);
    }
    const dynamoDbClient = DDBClient.getDDBClient();
    const item = {
        email,
    }
    const didPut: boolean = await dynamoDbClient.addItemToTable(item, RECIPIENTS_TABLE);
    if (didPut) {
        const infoMessage = `Successfully subscribed ${email}`;
        return makeLambdaBaseResponse({ infoMessage });
    } else {
        throw new Error(`Failed to subscribe ${email}. Could not put item in database.`);
    }
}

