const express = require('express');
const cors = require('cors');
const app = express();
const bcrypt = require('bcryptjs');
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

app.use(cors())
app.use(express.json());


const uri = "mongodb+srv://locanto:locanto11923@cluster0.nlwnpbl.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    await client.connect();
    const categoriesCollection = client.db('Locanto').collection('categories');
    const subCategoriesCollection = client.db('Locanto').collection('sub-categories');
    const mainCategoriesCollection = client.db('Locanto').collection('main-categories');
    const usersCollection = client.db('Locanto').collection('users');
    const adsCollection = client.db('Locanto').collection('ads');

    try {

        // get all categories
        app.get('/main-categories', async (req, res) => {
            const query = {};
            const cursor = mainCategoriesCollection.find(query);
            const categories = await cursor.toArray();
            res.send(categories);
        })

        // get all sub categories
        app.get('/sub-categories', async (req, res) => {
            const query = {};
            const cursor = subCategoriesCollection.find(query);
            const subCategories = await cursor.toArray();
            res.send(subCategories);
        })

        // get all categories
        app.get('/categories', async (req, res) => {
            const query = {};
            const cursor = categoriesCollection.find(query);
            const categories = await cursor.toArray();
            res.send(categories);
        })

        // post a sub category
        app.post('/sub-categories', async (req, res) => {
            const newSubCategory = req?.body;
            newSubCategory?.categories.split(',').map(async c => {
                const catInserting = await categoriesCollection.insertOne({ title: c, subCategory: req?.body?.title });
            })
            const result = await subCategoriesCollection.insertOne(newSubCategory);
            res.send(result);
        })

        // post a category
        app.post('/categories', async (req, res) => {
            const newCategory = req?.body;
            const result = await categoriesCollection.insertOne(newCategory);
            res.send(result);
        })

        // update category api
        app.delete('/sub-categories/:id', async (req, res) => {
            const id = req.params.id;
            if (ObjectId.isValid(id)) {
                const query = { _id: ObjectId(id) };
                const result = await subCategoriesCollection.deleteOne(query);
                res.send(result);
            }
            else {
                console.log('id invalid')
            }
        })

        // update category api
        app.delete('/categories/:id', async (req, res) => {
            const id = req.params.id;
            if (ObjectId.isValid(id)) {
                const query = { _id: ObjectId(id) };
                const result = await categoriesCollection.deleteOne(query);
                res.send(result);
            }
            else {
                console.log('id invalid')
            }
        })


        // get single main category api
        app.get('/main-categories/:id', async (req, res) => {
            const id = req?.params?.id;
            if (ObjectId.isValid(id)) {
                const query = { _id: ObjectId(id) };
                const category = await mainCategoriesCollection.findOne(query);
                res.send(category);
            }
            else {
                console.log('id not valid')
            }
        })

        // post a main category
        app.post('/main-categories', async (req, res) => {
            const newCategory = req?.body;
            const result = await mainCategoriesCollection.insertOne(newCategory);
            res.send(result);
        })

        // update category api
        app.put('/main-categories/:id', async (req, res) => {
            const id = req.params.id;
            const updatedCategory = req.body;
            if (ObjectId.isValid(id)) {
                const query = { _id: ObjectId(id) };
                const options = { upsert: true };
                const updateDoc = {
                    $set: updatedCategory
                };
                const result = await mainCategoriesCollection.updateOne(query, updateDoc, options);
                res.send(result);
                console.log(updatedCategory)
            }
            else {
                console.log('id not valid')
            }
        })

        // update category api
        app.delete('/main-categories/:id', async (req, res) => {
            const id = req.params.id;
            if (ObjectId.isValid(id)) {
                const query = { _id: ObjectId(id) };
                const result = await mainCategoriesCollection.deleteOne(query);
                res.send(result);
            }
            else {
                console.log('id invalid')
            }
        })


        // register user
        app.post('/register', async (req, res) => {
            const name = req.body.name;
            const email = req.body.email;
            const userCheck = await usersCollection.findOne({ email });
            if (userCheck) {
                res.send({ message: 'user already exists' })
            }
            else {
                const password = bcrypt.hashSync(req.body.password, 10);
                const token = jwt.sign({ email: email }, process.env.SECRET_ACCESS_TOKEN, { expiresIn: '1d' });
                const result = await usersCollection.insertOne({ name, email, password });
                res.send({ result, token });
            }
        })

        // all registered users
        app.get('/users', async (req, res) => {
            const cursor = usersCollection.find({});
            const users = await cursor.toArray();
            res.send(users);
        })

        // update user
        app.put('/users/:email', async (req, res) => {
            const email = req.params.email;
            const updatedUser = req.body;
            const updateDoc = {
                $set: updatedUser
            };
            const result = await usersCollection.updateOne({email}, updateDoc);
            res.send(result);
        })

        // post api for login
        app.post('/login', async (req, res) => {
            const email = req?.body?.email;
            const password = bcrypt.hashSync(req?.body?.password, 10);
            const user = await usersCollection.findOne({ email });
            if (user) {
                if (password === user?.password) {
                    const token = jwt.sign({ email: email }, process.env.SECRET_ACCESS_TOKEN, { expiresIn: '1d' });
                    res.send({ token, message: 'User found' });
                }
                else {
                    res.send({ message: 'password does not match' })
                }
            }
            else {
                res.send({ message: 'No user found' })
            }
        })

        // post user api google login
        app.post('/google-sign-in', async (req, res) => {
            const email = req.body.email;
            const query = { email };
            const signedUser = req.body;
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email: email }, process.env.SECRET_ACCESS_TOKEN, { expiresIn: '1d' });
                res.send({ token, message: 'User found' })
            }
            else {
                const token = jwt.sign({ email: email }, process.env.SECRET_ACCESS_TOKEN, { expiresIn: '1d' });
                const result = await usersCollection.insertOne(signedUser);
                res.send({ result, token, message: 'user created' });
            }
        })

        // delete user api
        app.post('/add-user', async (req, res) => {
            const newUser = req.body;
            const result = await usersCollection.insertOne(newUser);
            res.send(result);
        })

        // delete user api
        app.delete('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        })


        // get all ad
        app.get('/ads', async (req, res) => {
            const result = await adsCollection.find({}).toArray();
            res.send(result);
        })

        // post an ad
        app.post('/ads', async (req, res) => {
            const ad = req?.body;
            const result = await adsCollection.insertOne(ad);
            res.send(result);
        })
    }

    finally {
    }
}
run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('Running Locanto server')
})

app.listen(port, () => {
    console.log('Listening on port', port);
})

// app.use('/', AuthRoute);