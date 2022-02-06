// aws-sdk is automatically installed in
import * as aws from 'aws-sdk';
import { DROPS_TABLE, EMAIL_REG_EXP, RECIPIENTS_TABLE } from '../constants';
import { IDrop } from '../interfaces';

export default class DDBClient {
    private dynamo: aws.DynamoDB.DocumentClient;
    private static instance: DDBClient;

    private constructor() {
        this.dynamo = new aws.DynamoDB.DocumentClient();
    }

    public static getDDBClient = () => {
        if (!DDBClient.instance) DDBClient.instance = new DDBClient();
        return DDBClient.instance;
    }

    /**
     * 
     * @returns A list of all recipients with valid email
     */
    public getAllRecipients = async (): Promise<string[]> => {
        const scanResult = await this.dynamo.scan({ 'TableName': RECIPIENTS_TABLE }).promise();
        console.log(`Found ${scanResult.Count} addresses`);
        if (!scanResult.Items || scanResult.Items.length  === 0) {
            console.log('Hmm, no recipients found');
            return [];
        }
        const recipients: string[] = scanResult.Items
            .filter(item => !!item.email)
            .map(item => item.email)
            .filter(item => {
                const matches = item.match(EMAIL_REG_EXP);
                return matches != null && matches.length == 1;
            });
        console.log('Valid Recipients: ', recipients);
        return recipients;
    }

    /**
     * 
     * @param key The partition key of the Drop in question
     * @returns The first drop found, or undefined if not any
     */
    public getDrop = async (key: number): Promise<IDrop | undefined> => {
        const params = {
            TableName: DROPS_TABLE,
            ExpressionAttributeValues: {
                ':dateKey': key
            },
            KeyConditionExpression: "sendDateKey = :dateKey"
        }
        const queryResults = await this.dynamo.query(params).promise();
        if(!queryResults.Items || queryResults.Items.length === 0) {
            console.log('Hmm, no drops found');
            return undefined;
        }
        console.log(`Found ${queryResults.Items.length} Drops`);
        const drop = queryResults.Items[0];
        return (drop as IDrop | undefined);
    }
}