import { Handler } from "aws-cdk-lib/aws-lambda";
import DDBClient from '../modules/DDBClient';
import { DROPS_TABLE } from '../constants';

export const deleteDrop: Handler = async (event: any, context: any) => {
    const sendDateKey = event?.input?.body?.sendDateKey;
    const albumId = event?.input?.body?.albumId;
    if(!sendDateKey || typeof sendDateKey !== 'number') {
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
        const response = {
            status: 200,
            message: `Successfully deleted album ${albumId} with sendDateKey ${sendDateKey}`,
        };
        return response;
    } else {
        const response = {
            status: 400,
            message: `Failed to delete album ${albumId} with sendDateKey ${sendDateKey}. Failed to delete item from the database.`,
        }
        return response;
    }
}

