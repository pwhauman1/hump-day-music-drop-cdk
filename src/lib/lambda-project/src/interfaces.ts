export interface IDrop {
    sendDateKey: number,
    albumId: string,
    albumName: string,
    artist: string,
    imageUrl: string,
    spotifyUrl: string,
    favoriteSong?: string,
    desc?: string,
    favoriteLyric?: string,
}

export interface IDropHTML extends IDrop {
    hdmdWelcome: string,
}

export interface ILambdaResponseContent {
    infoMessage: string,
    [props: string]: any,
}

export interface ILambdaResponseBody {
    content: ILambdaResponseContent,
}

export interface ILambdaOutputFormatForProxy {
    isBase64Encoded?: boolean,
    statusCode: number,
    headers?: string[],
    multiValueHeaders?: {
        [mvh: string]: string[]
    },
    body: String
}