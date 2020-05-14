interface IMessage {
    cid: string;
    data?: any;
    error?: IError;
    timestamp: string;
}