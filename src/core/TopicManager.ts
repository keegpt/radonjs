import monitor from "../monitor";
import ClientManager from "./ClientManager";
import Topic from './Topic';

export default class TopicManager {
    clientManager: ClientManager;
    topics: Topic[] = [];

    constructor(clientManager: ClientManager) {
        this.clientManager = clientManager;
    }

    findTopic(name: string) {
        return this.topics.find((topic) => topic.getName() === name);
    }

    publish(topicName: string, message: IMessage) {
        const topic = this.findTopic(topicName);

        if (!topic) {
            monitor(`Topic ${topicName} not found`);
            return;
        }

        topic.publish(message);
    }

    subscribe(uid: string, topicName: string) {
        const topic = this.findTopic(topicName) || new Topic({ name: topicName }, this.clientManager);
        topic.subscribe(uid);
    }

    unsubscribe(uid: string, topicName: string) {
        const topic = this.findTopic(topicName);

        if (!topic) {
            monitor(`Topic ${topicName} not found`);
            return;
        }

        topic.unsubscribe(uid);
    }
}