import { Handler } from "aws-cdk-lib/aws-lambda";
import DDBClient from '../modules/DDBClient';

export const getAllRecipients: Handler = async (event: any, context: any) => {
    const dynamoDbClient = DDBClient.getDDBClient();
    const recipients: string[] = await dynamoDbClient.getAllRecipients();
    const response = {
        status: 200,
        recipients,
    }
    return response;
}

