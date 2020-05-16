interface IClient {
    uid: string;
    host: string;
    port: string;
    path: string;
    healthcheck?: Date;
}