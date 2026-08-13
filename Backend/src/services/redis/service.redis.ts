import { createClient } from 'redis';

const redisClient = createClient({
    username: 'default',
    password: '3kmI2fGMCOVBydil0pxO6J9PV8mvODmb',
    socket: {
        host: 'independent-ruddy-cats-30976.db.redis.io',
        port: 15040
    }
});

redisClient.on('error', err => console.log('Redis Client Error', err));

await redisClient.connect();

export default redisClient;


await redisClient.set('foo', 'bar');
const result = await redisClient.get('foo');
console.log(result)