import * as express from 'express';

interface IServerOptions {
    app?: express.Application;
    port?: number;
    path?: string;
    healthcheckEnabled?: boolean;
    healthcheckInterval?: number;
}