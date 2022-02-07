import { Handler } from "aws-cdk-lib/aws-lambda";
import DDBClient from '../modules/DDBClient';
import { EMAIL_REG_EXP, RECIPIENTS_TABLE } from '../constants';

export const subscribe: Handler = async (event: any, context: any) => {
    const email = event?.input?.body?.email;
    if(!email || typeof email !== 'string') {
        throw new Error(`Email parameter not a string! Got: ${email}`);
    }
    if(!email.match(EMAIL_REG_EXP)) {
        throw new Error(`Email is not of the form [not a whitespace]@[not a whitespace].[a-z]. Got: ${email}`);
    }
    const dynamoDbClient = DDBClient.getDDBClient();
    const item = {
        email,
    }
    const didPut: boolean = await dynamoDbClient.addItemToTable(item, RECIPIENTS_TABLE);
    if (didPut) {
        const response = {
            status: 200,
            message: `Successfully subscribed ${email}`,
        };
        return response;
    } else {
        const response = {
            status: 400,
            message: `Failed to subscribe ${email}. Could not put item in database.`,
        }
        return response;
    }
}

