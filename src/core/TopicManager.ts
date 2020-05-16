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
        let topic = this.findTopic(topicName);

        if(!topic) {
            topic = new Topic({ name: topicName }, this.clientManager);
            this.topics.push(topic);
        }

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