import { createClient, type RedisClientOptions } from 'redis';

const username:string = process.env.REDIS_USERNAME
const password:string = process.env.REDIS_PASSWORD
const host:string = process.env.REDIS_HOST
const port:number = process.env.REDIS_PORT

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
