// import { Handler } from "aws-cdk-lib/aws-lambda";

// const sendJobHandler: Handler = async (event: any) => {
//     const msg = 'Hello World! I am deployed locally!';
//     console.log(msg);
//     console.log('Event: ', event);
//     return msg;
// }

// export default sendJobHandler;

import * as path from 'path';

export const sendJobHandler = async (request: any, context: any) => {
    const str = path.join('will', 'this', 'work');
    return {
        statusCode: 200,
        body: {
            message: str,
        },
    };
};

