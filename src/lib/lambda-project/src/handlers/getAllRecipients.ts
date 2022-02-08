import { Handler } from "aws-cdk-lib/aws-lambda";
import DDBClient from '../modules/DDBClient';
import { makeLambdaBaseResponse } from "../modules/Utils";

export const getAllRecipients: Handler = async (event: any, context: any) => {
    const dynamoDbClient = DDBClient.getDDBClient();
    const recipients: string[] = await dynamoDbClient.getAllRecipients();
    const returnContent = {
        infoMessage: `Found ${recipients.length} items`,
        recipients,
    }
    return makeLambdaBaseResponse(returnContent);
}

