import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import { SENDER_JOB_LAMBDA_NAME } from '../constants';

export class HumpDayMusicDropCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const sendJobLambda = new lambda.Function(this, SENDER_JOB_LAMBDA_NAME, {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset(path.join(__dirname, './lambdas')),
      handler: 'index.sendJobHandler',
    });
  }
}
