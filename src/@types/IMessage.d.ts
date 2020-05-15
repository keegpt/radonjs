interface IMessage {
    uid: string;
    cid: string;
    data?: any;
    error?: IError;
    timestamp: string;
}