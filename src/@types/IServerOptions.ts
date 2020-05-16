import * as express from 'express';

export interface IServerOptions {
    app?: express.Application;
    port?: number;
    path?: string;
    healthcheckEnabled?: boolean;
    healthcheckInterval?: number;
}