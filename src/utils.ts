import * as cuid from 'cuid';

export const getId = (): string => {
    return cuid();
}