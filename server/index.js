const express = require("express");




const keys = require("./keys");
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());


const { Pool,Client } = require('pg');
// const pgClient = new Client(`postgres://${keys.pgUser}:${keys.pgPassword}@{keys.pgDatabase}:5432/${keys.pgDatabase}`);
// pgClient.connect(function(err){
//     if(err){
//         console.log("error in connect")
//         console.log(err);
//     }
// })

// const pgClient = new Pool({
//     user: keys.pgUser,
//     // user: 'postgres',
//     host: keys.pgHost,
//     database: keys.pgDatabase,
//     // database: 'postgres',
//     // password: encodeURIComponent(keys.pgPassword),
//     password: keys.pgPassword,
//     port: 6379
// });

const connectingString = `postgres://${keys.pgUser}:${keys.pgPassword}@${keys.host}/${keys.pgDatabase}`;

const pgClient = new Client({
    connectionString: connectingString
});

// const pgClient = new Pool({
//     user: keys.pgUser,
//     host: keys.pgHost,
//     database: keys.pgDatabase,
//     password: keys.pgPassword,
//     port: keys.pgPort
// });

// const pgPoolWrapper = {
//     async connect() {
//         for (let nRetry = 1; ; nRetry++) {
//             try {
//                 const client = await pgClient.connect();
//                 if (nRetry > 1) {
//                     console.info('Now successfully connected to Postgres');
//                 }
//                 return client;
//             } catch (e) {
//                 if (e.toString().includes('ECONNREFUSED') && nRetry < 5) {
//                     console.info('ECONNREFUSED connecting to Postgres, ' +
//                         'maybe container is not ready yet, will retry ' + nRetry);
//                     // Wait 1 second
//                     await new Promise(resolve => setTimeout(resolve, 1000));
//                 } else {
//                     throw e;
//                 }
//             }
//         }
//     }
// };



pgClient.on('error',()=>console.log('Lost PG connection'));



 pgClient.query("CREATE TABLE IF NOT EXISTS values (number INT)")
    .catch(error=>{
        console.log(error);
        console.log("Error in creating Table in postgres");
    });



const redis  = require('redis');
const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000
});

const redisPublisher = redisClient.duplicate();
app.get('/',(req,res)=>{
    res.send("Hi");
});

try{
    app.get('/values/all',async(req,res)=>{
        // console.log(pgClient);
        const values = await pgClient.query('SELECT * from values')
                                     .catch(e=>{
                                         console.log(e);
                                         console.log("error in select query");
                                     });
        console.log("value"+values.rows);
        res.send(values.rows);
    });
}

catch(error){
    console.log("Error occured here in all");
    console.log(error);
};


try{
    app.get('/values/current',async(req,res)=>{
        redisClient.hgetall('values',(err,values)=>{
            // console.log("Current values"+ JSON.parse(values));
            res.send(values);
        });
    });
}
catch(error){
    console.log("Error occured here in current");
    console.log(error);
}


app.post('/values',async(req,res)=>{
    
    const index = req.body.index;
    console.log(index);

    if(parseInt(index)  > 40){
        return res.status(422).send('Index too high');
    }

    redisClient.hset('values',index,'Nothing yet!');
    redisPublisher.publish('insert',index);


    redisClient.hgetall('values',(err,values)=>{
        console.log("Current values"+ values);
    });


    pgClient.query('INSERT INTO values(number) VALUES($1)',[index]);

    res.send({working: true});

});

app.listen(5000,err => {
    console.log('Listening at 5000');
})




