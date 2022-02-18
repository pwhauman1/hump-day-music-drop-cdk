import { IDrop, IDropHTML } from '../interfaces';
import * as Handlebars from 'handlebars';
import { getRandomWelcome, paginate } from './Utils';
import { readFileSync } from 'fs-extra';
import { resolve } from 'path';
import * as aws from 'aws-sdk';
import { MAX_SEND_TO_LENGTH } from '../constants';
const inlineCss = require('inline-css');

const HTML_TEMPLATE_PATH = resolve('src', 'htmlAssets', 'dropEmail.handlebars');
const CSS_PATH = resolve('src', 'htmlAssets', 'dropEmail.css');
// color scheme: https://coolors.co/ee4266-5db7de-2a1e5c-f39237-faf3dd

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

    public async getHTML(drop: IDrop) {
        console.log('Getting HTML. Current Working Directory: ' + process.cwd());
        console.log('CSS PATH', CSS_PATH);
        const dropData: IDropHTML = {
            ...drop,
            hdmdWelcome: getRandomWelcome(),
            cssSource: CSS_PATH,
        }
        const template = Handlebars.compile(readFileSync(HTML_TEMPLATE_PATH).toString());
        const html = template(dropData);
        const htmlWithInline = await inlineCss(html, {url: 'file://'});
        return htmlWithInline;
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

console.log('TESTING EC');
const ec = EmailComposer.getEmailComposer();
ec.getHTML({
    "sendDateKey": 20220207,
    "albumId": "7G7lPTcJta35qGZ8LMIJ4y",
    "artist": "Indigo De Souza",
    "imageUrl": "https://i.scdn.co/image/ab67616d0000b2738be26b6c162ff72ca4666ba6",
    "favoriteSong": "Pretty Pictures",
    "albumName": "Any Shape You Take",
    "spotifyUrl": "https://open.spotify.com/album/7G7lPTcJta35qGZ8LMIJ4y?si=oLRZwz5jT36v8GyS4_I2WQ",
    "favoriteLyric": "Please! Send! Help! To! Me! *rock drop*",
    "desc": "A melancholic album that you'll wanna listen to after a Tuesday thrift haul"
}).then((html) => {
    console.log('html: ');
    console.log(html);
});
