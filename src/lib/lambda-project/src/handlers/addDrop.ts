import { Handler } from "aws-cdk-lib/aws-lambda";
import DDBClient from '../modules/DDBClient';
import { DROPS_TABLE } from '../constants';
import { IDrop } from "../interfaces";
import { makeLambdaBaseResponse } from "../modules/Utils";

export const addDrop: Handler = async (event: any, context: any) => {
    const body = JSON.parse(event.body);
    const drop = body.drop;
    const cleanedDrop = cleanDrop(drop);
    const dynamoDbClient = DDBClient.getDDBClient();

    const didPut: boolean = await dynamoDbClient.addItemToTable(cleanedDrop, DROPS_TABLE);
    if (didPut) {
        const infoMessage = `Successfully added drop ${cleanedDrop.albumName}`;
        return makeLambdaBaseResponse({ infoMessage });
    } else {
        throw new Error(`Failed to add drop ${cleanedDrop.albumName}. Could not put item in database.`);
    }
}

const cleanDrop = (drop: any) => {
    console.log('Cleaning Drop', drop);
    if (!drop.sendDateKey && drop.sendDateKey !== 0) throw new Error('Drop is missing sendDateKey');
    if (!drop.albumId) throw new Error('Drop is missing albumId');
    if (!drop.albumName) throw new Error('Drop is missing albumName');
    if (!drop.artist) throw new Error('Drop is missing artist');
    if (!drop.imageUrl) throw new Error('Drop is missing imageUrl');
    if (!drop.spotifyUrl) throw new Error('Drop is missing spotifyUrl');
    const cleanDrop: IDrop = {
        sendDateKey: drop.sendDateKey,
        albumId: drop.albumId,
        albumName: drop.albumName,
        artist: drop.artist,
        imageUrl: drop.imageUrl,
        spotifyUrl: drop.spotifyUrl,
    }
    if (drop.favoriteSong) cleanDrop.favoriteSong = drop.favoriteSong;
    if (drop.desc) cleanDrop.desc = drop.desc;
    if (drop.favoriteLyric) cleanDrop.favoriteLyric = drop.favoriteLyric;
    return cleanDrop;
}

