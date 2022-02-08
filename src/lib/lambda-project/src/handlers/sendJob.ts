import { Handler } from "aws-cdk-lib/aws-lambda";
import DDBClient from '../modules/DDBClient';
import { EmailComposer } from "../modules/EmailComposer";
import { getDateKey } from '../modules/Utils';
import { makeLambdaBaseResponse } from "../modules/Utils";

export const sendJob: Handler = async (event: any, context: any) => {
    const dynamoDbClient = DDBClient.getDDBClient();
    const recipients: string[] = await dynamoDbClient.getAllRecipients();
    const dateKey: number = getDateKey();
    // TODO, if none are available, get backup
    const drop = await dynamoDbClient.getDrop(dateKey);
    const emailComposer = EmailComposer.getEmailComposer();
    if (!drop) {
        const infoMessage = 'No drop to send. Skipping!';
        return makeLambdaBaseResponse({ infoMessage });
    }
    const html = emailComposer.getHTML(drop);
    try {
        const emailResponses = await emailComposer.sendViaSES(recipients, html);
        const sendEmailRetVals = await Promise.all(emailResponses);
        console.log(`Email Promises Response`, sendEmailRetVals);
    } catch (e) {
        console.error('Uh Oh, failed to send emails');
        throw e;
    }
    const infoMessage = 'Successfully Sent Emails';
    return makeLambdaBaseResponse({ infoMessage });
}

