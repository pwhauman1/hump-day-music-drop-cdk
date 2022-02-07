import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';
import * as path from 'path';
import { DROPS_TABLE, RECIPIENTS_TABLE, SENDER_JOB_LAMBDA_NAME } from '../constants';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';

export class HumpDayMusicDropCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Table to store recipients
    const recipientsTable = new ddb.Table(this, RECIPIENTS_TABLE, {
      tableName: RECIPIENTS_TABLE,
      partitionKey: {
        name: 'email',
        type: ddb.AttributeType.STRING,
        // TODO add srever side encryption
      }
    });

    // Table to store the drops that we can pull from
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

    // Lambda that will invoke SES to send an email to everyone subscribed
    const sendJobLambda = new lambda.Function(this, SENDER_JOB_LAMBDA_NAME, {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset(path.join(__dirname, './lambda-project')),
      handler: 'index.sendJobHandler',
    });

    const sendEmailPermissions = new iam.Policy(this, 'SendEmailPermissions', {
      statements: [new iam.PolicyStatement({
        actions: ['ses:SendEmail'],
        resources: ['*']
      })]
    });

    if (!sendJobLambda.role) throw new Error('Send Job Lambda does not have a role');
    sendJobLambda.role.attachInlinePolicy(sendEmailPermissions)

    recipientsTable.grantReadData(sendJobLambda);
    dropsTable.grantReadData(sendJobLambda);

    const scheduleRule = new Rule(this, 'SendJobLambdaScheduler', {
      schedule: Schedule.cron({
        weekDay: 'wednesday',
        hour: '17', // time is in GMT
        minute: '0',
      }),
      targets: [new LambdaFunction(sendJobLambda)]
    });
  }
}
