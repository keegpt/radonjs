import * as express from 'express';

export interface IServerOptions {
    app: express.Application;
    path: string;
}

export interface IEventOptions {
    name: string;
}

export interface IClient {
    uid: string;
    host: string;
    port: string;
    path: string;
}

export interface IEvent {
    name: string;
    mode: EventModeEnum;
}

export enum EventModeEnum {
    ACKNOWLEDGE,
    LOAD_BALANCE
}

export interface IEventOptions {
    name: string;
}

export interface ISubscriber {
    client: IClient;
    mode: EventModeEnum;
}

export interface IQueueItemPayload {
    cid: string;
    data: any
}

export interface IQueueItem {
    payload: IQueueItemPayload;
    timeout?: number
}

export interface QueueOptions {
    handler: (payload: IQueueItemPayload, next: () => void, onCancel: (cb: () => void) => void) => void;
    concurrency?: number;
    timeout?: number;
    delay?: number;
}

export interface IQueueStats {
    processing: number;
    running: boolean;
}

export interface IClientOptions {
    app: express.Application;
    serverHost: string;
    serverPort: number;
    serverPath: string;
    host: string;
    port: number;
    path: string;
}

export interface IClientEvent {
    name: string;
    mode: EventModeEnum;
    callback?: (cid: string, data: any) => any;
}