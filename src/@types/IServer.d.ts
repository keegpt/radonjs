import * as express from 'express';

interface IServer {
    app?: express.Application;
    port: number;
    path: string;
}