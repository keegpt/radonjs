import cuid = require("cuid");

export default class ClientManager {
    private clients: IClient[] = [];

    constructor() {

    }

    findClient(uid: string) {
        return this.clients.find((client) => client.uid === uid);
    }

    filterClients(uid: string[]) {
        return this.clients.filter((client) => uid.includes(client.uid));
    }

    createClient(host: string, port: string, path: string) {
        const client = this.clients.find((client) => client.host === host && client.port === port && client.path === path);

        if (client) {
            throw new Error('Client already exists');
        }

        const uid = cuid();

        this.clients.push({
            uid,
            host,
            port,
            path
        });

        return uid;
    }

    deleteClient(uid: string) {
        const index = this.clients.findIndex((client) => client.uid === uid);

        if (index > -1) {
            this.clients.splice(index, 1);
        }
    }
}