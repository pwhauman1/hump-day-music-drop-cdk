import { Handler } from "aws-cdk-lib/aws-lambda";
import DDBClient from '../modules/DDBClient';
import { DROPS_TABLE } from '../constants';
import { makeLambdaBaseResponse } from "../modules/Utils";

export const deleteDrop: Handler = async (event: any, context: any) => {
    const body = JSON.parse(event.body);
    const sendDateKey = parseInt(body.sendDateKey);
    const albumId = body.albumId;
    if(sendDateKey === undefined || sendDateKey === null || typeof sendDateKey !== 'number') {
        throw new Error(`sendDateKey parameter not a number! Got: ${sendDateKey}`);
    }
    if(!albumId || typeof albumId !== 'string') {
        throw new Error(`albumId parameter not a string! Got: ${albumId}`);
    }
    
    const dynamoDbClient = DDBClient.getDDBClient();
    const key = {
        sendDateKey,
        albumId,
    }
    const didDelete: boolean = await dynamoDbClient.removeItemFromTable(key, DROPS_TABLE);
    if (didDelete) {
        const infoMessage = `Successfully deleted album ${albumId} with sendDateKey ${sendDateKey}`;
        return makeLambdaBaseResponse({infoMessage});
    } else {
        throw new Error(`Failed to delete album ${albumId} with sendDateKey ${sendDateKey}. Failed to delete item from the database.`);
    }
}

