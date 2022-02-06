import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';
import * as path from 'path';
import { DROPS_TABLE, RECIPIENTS_TABLE, SENDER_JOB_LAMBDA_NAME } from '../constants';

export class HumpDayMusicDropCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const recipientsTable = new ddb.Table(this, RECIPIENTS_TABLE, {
      tableName: RECIPIENTS_TABLE,
      partitionKey: {
        name: 'email',
        type: ddb.AttributeType.STRING,
        // TODO add srever side encryption
      }
    });

    const dropsTable = new ddb.Table(this, DROPS_TABLE, {
      tableName: DROPS_TABLE,
      partitionKey: {
        name: 'sendDateKey',
        type: ddb.AttributeType.NUMBER,
      },
      sortKey: {
        name: 'albumId',
        type: ddb.AttributeType.STRING,
      }
    });

    const sendJobLambda = new lambda.Function(this, SENDER_JOB_LAMBDA_NAME, {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset(path.join(__dirname, './lambda-project')),
      handler: 'index.sendJobHandler',
    });

    recipientsTable.grantReadData(sendJobLambda);
    dropsTable.grantReadData(sendJobLambda);
  }
}
