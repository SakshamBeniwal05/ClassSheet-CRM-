import { createClient, type RedisClientOptions } from 'redis';

const username: string = process.env.REDIS_USERNAME || "default";
const password: string = process.env.REDIS_PASSWORD || "";
const host: string = process.env.REDIS_HOST || "localhost";
const port: number = Number(process.env.REDIS_PORT) || 6379;

const redisClient = createClient({
    username,
    password,
    socket: {
        host,
        port
    }
});

redisClient.on('error', err => console.log('Redis Client Error', err));

await redisClient.connect();

export default redisClient;


// await redisClient.set('foo', 'bar');
// const result = await redisClient.get('foo');
// console.log(result)
