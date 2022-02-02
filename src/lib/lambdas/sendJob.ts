// import { Handler } from "aws-cdk-lib/aws-lambda";

// const sendJobHandler: Handler = async (event: any) => {
//     const msg = 'Hello World! I am deployed locally!';
//     console.log(msg);
//     console.log('Event: ', event);
//     return msg;
// }

// export default sendJobHandler;

export const handler = async (request: any, context: any) => {
    return {
        statusCode: 200,
        body: {
            message: 'Oh hoy lads',
        },
    };
};

