import { Handler } from "aws-cdk-lib/aws-lambda";
import DDBClient from '../modules/DDBClient';
import { RECIPIENTS_TABLE } from '../constants';
import { EmailComposer } from "../modules/EmailComposer";

export const handlePoorExperience: Handler = async (event: any, context: any) => {
    const records = event.Records;
    const messages = records
        .map((r: any) => r?.Sns?.Message)
        .filter((m: any) => m !== undefined)
        .map((m: any) => JSON.parse(m));
    if (messages.length === 0) console.warn('No Messages from SNS!', event);
    messages.forEach((m: any) => handleBasedOnType(m));
}

function handleBasedOnType(message: any) {
    const type = message.notificationType.toLowerCase();
    switch (type) {
        case 'bounce':
            handleBounce(message.bounce);
            break;

        case 'complaint':
            handleComplaint(message.complaint);
            break;

        default:
            console.warn(`Hmm, no handler set for type: ${type}. Doing nothing!`);
            break;
    }
}

async function handleBounce(bounce: any) {
    if (!bounce) {
        console.warn('Oops! bounce object is falsy. Doing nothing.', bounce);
        return;
    }
    const bouncedEmails = bounce.bouncedRecipients?.map((b: any) => b.emailAddress);
    bouncedEmails.forEach(async (email: any) => {
        const dynamoDbClient = DDBClient.getDDBClient();
        const key = {
            email,
        }
        const didDelete: boolean = await dynamoDbClient.removeItemFromTable(key, RECIPIENTS_TABLE);
        if (!didDelete) {
            console.warn(`Could not unsubscribe ${email}`)
        }
    });
}

function handleComplaint(complaint: any) {
    if (!complaint) {
        console.warn('Oops! complaint object is falsy. Doing nothing.', complaint);
        return;
    }
    const complaintEmails = complaint.complainedRecipients?.map((c: any) => c.emailAddress);
    complaintEmails.forEach(async (email: any) => {
        const emailComposer = EmailComposer.getEmailComposer();
        const body = `HumpDayMusicDrop had a complaint from ${email}`;
        const subject = 'HDMD Complaint!';
        try {
            await emailComposer.sendViaSES(['pwhauman@gmail.com'], body, subject);
        } catch (error) {
            console.warn(`Failed to send email about complaint from ${email}`);
            throw error;
        }
    });
}



