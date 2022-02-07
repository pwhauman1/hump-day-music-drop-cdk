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