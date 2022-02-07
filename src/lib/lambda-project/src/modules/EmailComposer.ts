import { IDrop, IDropHTML } from '../interfaces';
import * as Handlebars from 'handlebars';
import { getRandomWelcome, paginate } from './Utils';
import { readFileSync } from 'fs-extra';
import { resolve } from 'path';
import * as aws from 'aws-sdk';
import { MAX_SEND_TO_LENGTH } from '../constants';

const HTML_TEMPLATE_PATH = resolve('src', 'templates', 'htmlTemplate.handlebars');

export class EmailComposer {
    private sesClient: aws.SES;
    private static instance: EmailComposer;

    private constructor() {
        this.sesClient = new aws.SES();
    }

    public static getEmailComposer = () => {
        if (!EmailComposer.instance) EmailComposer.instance = new EmailComposer();
        return EmailComposer.instance;
    }

    public getHTML(drop: IDrop) {
        console.log('CWD: ' + process.cwd());
        const dropData: IDropHTML = {
            ...drop,
            hdmdWelcome: getRandomWelcome(),
        }
        const template = Handlebars.compile(readFileSync(HTML_TEMPLATE_PATH).toString());
        return template(dropData);
    }

    public async sendViaSES(recipients: string[], body: string): Promise<Promise<any>[]> {
        const paginatedRecipients = paginate(recipients, MAX_SEND_TO_LENGTH);
        console.log('[INFO] Pagenated Results', paginatedRecipients);
        const promises: Promise<any>[] = [];
        var params: aws.SES.Types.SendEmailRequest = {
            Destination: {
                BccAddresses: []
            },
            Message: {
                Body: {
                    Html: {
                        Charset: "UTF-8",
                        Data: body,
                    },
                },
                Subject: {
                    Charset: "UTF-8",
                    Data: "HUMP DAY MUSIC DROP"
                }
            },
            Source: "humpday.musicdrop@gmail.com",
        };
        paginatedRecipients.forEach((page: string[]) => {
            console.log('Sending to', page);
            params.Destination.BccAddresses = page;
            promises.push(this.sesClient.sendEmail(params).promise());
        });
        return promises;
    }
}
