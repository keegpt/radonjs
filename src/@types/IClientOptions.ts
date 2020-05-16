import * as express from 'express';

export interface IClientOptions {
    app?: express.Application;
    host?: string;
    port?: number;
    path?: string;
    serverHost?: string;
    serverPort?: number;
    serverPath?: string;
}