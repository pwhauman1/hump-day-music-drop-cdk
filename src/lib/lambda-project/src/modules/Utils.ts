export const getDateKey = (): number => {
    // now is in UTC time since Lambda's don't have a timezone
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth() + 1; // month is zero indexed
    const year = now.getFullYear();
    let dateKey = '' + year;
    dateKey += month <= 9 ? '0' + month : '' + month;
    dateKey += day <= 9 ? '0' + day : '' + day;
    return parseInt(dateKey);
}