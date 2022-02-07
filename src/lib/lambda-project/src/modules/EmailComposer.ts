import { IDrop, IDropHTML } from '../interfaces';
import * as Handlebars from 'handlebars';
import { getRandomWelcome } from './Utils';
// var compiledTemplate =  require('../templates/htmlTemplate.handlebars');
import { readFileSync } from 'fs-extra';
import { resolve } from 'path';

const HTML_TEMPLATE_PATH = resolve('src', 'templates', 'htmlTemplate.handlebars');

export class EmailComposer {
    public getHTML(drop: IDrop) {
        console.log('CWD: ' + process.cwd());
        const dropData: IDropHTML = {
            ...drop,
            hdmdWelcome: 'HUMP DAY MUSIC DROP',
        }
        const template = Handlebars.compile(readFileSync(HTML_TEMPLATE_PATH).toString());
        return template(dropData);
    }
}
