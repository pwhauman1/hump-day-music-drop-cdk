import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as s3Deployment from 'aws-cdk-lib/aws-s3-deployment'
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as path from 'path';
import { DROPS_TABLE, HDMD_PATH_TO_WEB, RECIPIENTS_TABLE, S3_BUCKET, SENDER_JOB_LAMBDA_NAME } from '../constants';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { RestApi, LambdaIntegration, LambdaIntegrationOptions, Cors } from 'aws-cdk-lib/aws-apigateway';

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

    // S3 bucket to host static assets
    const webBucket = new s3.Bucket(this, S3_BUCKET, {
      publicReadAccess: true,
      removalPolicy: RemovalPolicy.DESTROY,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
    });

    const hdmdAssetPath = process.env[HDMD_PATH_TO_WEB];
    if (!hdmdAssetPath) throw new Error('Oops, HDMD_PATH_TO_WEB doesn\'t exist');
    const deployment = new s3Deployment.BucketDeployment(this, "deployStaticWebsite", {
      sources: [s3Deployment.Source.asset(hdmdAssetPath)],
      destinationBucket: webBucket
    });

    // SNS topic for complaints and bounces
    const poorExperienceTopic = new sns.Topic(this, 'HDMD_PoorExperienceTopic', {
      fifo: false,
      topicName: 'HDMD_PoorExperienceTopic',
    });


    // Lambda for our Restful service
    const poorExperienceLambda = new lambda.Function(this, 'HDMDPoorExperienceLambda', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset(path.join(__dirname, './lambda-project')),
      handler: 'index.handlePoorExperience',
    });

    const poorExperienceSubscription = new subscriptions.LambdaSubscription(poorExperienceLambda);

    poorExperienceTopic.addSubscription(poorExperienceSubscription);

    // Lambda that will invoke SES to send an email to everyone subscribed
    const sendJobLambda = new lambda.Function(this, SENDER_JOB_LAMBDA_NAME, {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset(path.join(__dirname, './lambda-project')),
      handler: 'index.sendJob',
    });

    const sendEmailPermissions = new iam.Policy(this, 'SendEmailPermissions', {
      statements: [new iam.PolicyStatement({
        actions: ['ses:SendEmail'],
        resources: ['*']
      })]
    });

    if (!sendJobLambda.role) throw new Error('Send Job Lambda does not have a role');
    sendJobLambda.role.attachInlinePolicy(sendEmailPermissions);

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

    // API gateway and resources we attach our methods to
    const api = new RestApi(this, 'HDMD-api', {
      defaultCorsPreflightOptions: {
        allowMethods: Cors.ALL_METHODS,
        allowOrigins: Cors.ALL_ORIGINS,
      }
    });
    const recipientsApiResource = api.root.addResource('recipients');
    const dropsApiResource = api.root.addResource('drops');

    const lambdaIntegOptions: LambdaIntegrationOptions = {
      allowTestInvoke: true,
      proxy: true,
    }

    // Lambda for our Restful service
    const getAllRecipientsLambda = new lambda.Function(this, 'HDMDGetAllRecipientsLambda', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset(path.join(__dirname, './lambda-project')),
      handler: 'index.getAllRecipients',
    });
    recipientsTable.grantReadData(getAllRecipientsLambda);
    recipientsApiResource.addMethod('GET', new LambdaIntegration(getAllRecipientsLambda, lambdaIntegOptions));

    // Lambda for our Restful service
    const addDropLambda = new lambda.Function(this, 'HDMDAddDropLambda', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset(path.join(__dirname, './lambda-project')),
      handler: 'index.addDrop',
    });
    dropsTable.grantWriteData(addDropLambda);
    dropsApiResource.addMethod('PUT', new LambdaIntegration(addDropLambda, lambdaIntegOptions));

    // Lambda for our Restful service
    const deleteDropLambda = new lambda.Function(this, 'HDMDDeleteDropLambda', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset(path.join(__dirname, './lambda-project')),
      handler: 'index.deleteDrop',
    });
    dropsTable.grantWriteData(deleteDropLambda);
    dropsApiResource.addMethod('DELETE', new LambdaIntegration(deleteDropLambda, lambdaIntegOptions));

    // Lambda for our Restful service
    const getDropsForMonthLambda = new lambda.Function(this, 'HDMDGetDropsForMonthLambda', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset(path.join(__dirname, './lambda-project')),
      handler: 'index.getDropsForMonth',
    });
    dropsTable.grantReadData(getDropsForMonthLambda);
    dropsApiResource.addMethod('GET', new LambdaIntegration(getDropsForMonthLambda, lambdaIntegOptions));

    // Lambda for our Restful service
    const subscribeLambda = new lambda.Function(this, 'HDMDSubscribeLambda', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset(path.join(__dirname, './lambda-project')),
      handler: 'index.subscribe',
    });
    recipientsTable.grantWriteData(subscribeLambda);
    recipientsApiResource.addMethod('PUT', new LambdaIntegration(subscribeLambda, lambdaIntegOptions));

    // Lambda for our Restful service
    const unsubscribeLambda = new lambda.Function(this, 'HDMDUnsubscribeLambda', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset(path.join(__dirname, './lambda-project')),
      handler: 'index.unsubscribe',
    });
    recipientsTable.grantWriteData(unsubscribeLambda);
    recipientsApiResource.addMethod('DELETE', new LambdaIntegration(unsubscribeLambda, lambdaIntegOptions));
  }
}
