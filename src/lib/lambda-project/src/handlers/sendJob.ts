import { Handler } from "aws-cdk-lib/aws-lambda";
import DDBClient from '../modules/DDBClient';
import { EmailComposer } from "../modules/EmailComposer";
import { getDateKey } from '../modules/Utils';

export const sendJobHandler: Handler = async (event: any) => {
    const dynamoDbClient = DDBClient.getDDBClient();
    const recipients: string[] = await dynamoDbClient.getAllRecipients();
    const dateKey: number = getDateKey();
    // TODO, if none are available, get backup
    const drop = await dynamoDbClient.getDrop(dateKey);
    const emailComposer = new EmailComposer();
    if (!drop) {
        const response = {
            statusCode: 200,
            body: 'No Drop to send. Skipping!',
            recipients,
            drop,
            dateKey,
        }
        return response;
    }
    const html = emailComposer.getHTML(drop);
    const response = {
        statusCode: 200,
        recipients,
        drop,
        dateKey,
        html,
    }
    return response;
}

