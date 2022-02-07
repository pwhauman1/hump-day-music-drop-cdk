import { Handler } from "aws-cdk-lib/aws-lambda";
import DDBClient from '../modules/DDBClient';
import { RECIPIENTS_TABLE } from '../constants';

export const unsubscribe: Handler = async (event: any, context: any) => {
    const email = event?.input?.body?.email;
    if(!email || typeof email !== 'string') {
        throw new Error(`Email parameter not a string! Got: ${email}`);
    }
    
    const dynamoDbClient = DDBClient.getDDBClient();
    const key = {
        email,
    }
    const didDelete: boolean = await dynamoDbClient.removeItemFromTable(key, RECIPIENTS_TABLE);
    if (didDelete) {
        const response = {
            status: 200,
            message: `Successfully unsubscribed ${email}`,
        };
        return response;
    } else {
        const response = {
            status: 400,
            message: `Failed to unsubscribe ${email}. Failed to delete item in database.`,
        }
        return response;
    }
}

