import express, { Request, Response } from 'express';
import { Db, MongoClient, ObjectId } from 'mongodb';
import path from 'path';

const app = express();
const PORT = 8000;
app.use(express.json());
app.use(express.static(path.join(__dirname, '/src/build')));

type ArticleName = 'learn-react' | 'learn-node' | 'my-thoughts-on-resumes';
type Params = { name: ArticleName };

type ArticleComment = {
  username: string;
  text: string;
};

type ArticleFromMongoDB = {
  _id: ObjectId;
  name: ArticleName;
  upvotes: number;
  comments: ArticleComment[];
};

const withDB = async (
  operations: { (db: any): Promise<void>; (arg0: Db): any },
  res: Response
) => {
  try {
    const client = await MongoClient.connect('mongodb://localhost:27017');
    const db = client.db('linkedin-learning-my-blog');

    await operations(db);
    client.close();
  } catch (error) {
    res.status(500).json({ message: 'Error connecting to db', error });
  }
};

app.get('/api/articles/:name', async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;
    const articleInfo = await db
      .collection('articles')
      .findOne({ name: articleName });
    res.status(200).json(articleInfo);
  }, res);
});

app.post('/api/articles/:name/upvote', async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;

    const articleInfo = (await db
      .collection('articles')
      .findOne({ name: articleName })) as ArticleFromMongoDB;

    await db.collection('articles').updateOne(
      { name: articleName },
      {
        $set: {
          upvotes: articleInfo.upvotes + 1,
        },
      }
    );
    const updatedArticleInfo = await db
      .collection('articles')
      .findOne({ name: articleName });

    res.status(200).json(updatedArticleInfo);
  }, res);
});

app.post('/api/articles/:name/add-comment', async (req, res) => {
  const articleName = req.params.name;
  const { username, text } = req.body;

  withDB(async (db) => {
    const articleInfo = await db
      .collection('articles')
      .findOne({ name: articleName });
    // console.log('articleInfo >>>>>>>>>', articleInfo);

    await db.collection('articles').updateOne(
      { name: articleName },
      {
        $set: {
          comments: articleInfo.comments.concat({ username, text }), // concat is add to object {}
        },
      }
    );

    const updatedArticleInfo = await db
      .collection('articles')
      .findOne({ name: articleName });
    // console.log('updatedArticleInfo >>>>>>>', updatedArticleInfo);

    res.status(200).json(updatedArticleInfo);
  }, res);
});

// // before refactoring
// app.get('/api/articles/:name', async (req, res) => {
//   try {
//     const articleName = req.params.name;
//     const client = await MongoClient.connect('mongodb://localhost:27017');
//     const db = client.db('linkedin-learning-my-blog');
//     const articleInfo = await db
//       .collection('articles')
//       .findOne({ name: articleName });
//     res.status(200).json(articleInfo);
//     client.close();
//   } catch (error) {
//     res.status(500).json({ message: 'Error connecting to db', error });
//   }
// });

// // before refactoring
// app.post('/api/articles/:name/upvote', async (req: Request<Params>, res) => {
//   try {
//     const articleName = req.params.name;

//     const client = await MongoClient.connect('mongodb://localhost:27017');
//     const db = client.db('linkedin-learning-my-blog');
//     const articleInfo = (await db
//       .collection('articles')
//       .findOne({ name: articleName })) as ArticleFromMongoDB;
//     // console.log(articleInfo);

//     await db.collection('articles').updateOne(
//       { name: articleName },
//       {
//         $set: {
//           upvotes: articleInfo.upvotes + 1,
//         },
//       }
//     );
//     const updatedArticleInfo = await db
//       .collection('articles')
//       .findOne({ name: articleName });
//     // console.log(updatedArticleInfo);

//     res.status(200).json({ updatedArticleInfo });

//     client.close();
//   } catch (error) {
//     res.status(500).json({ message: 'Error connecting to db', error });
//   }
// });

// // mock data
// const articlesInfo = {
//   'learn-react': {
//     upvotes: 0,
//     comments: [],
//   },
//   'learn-node': {
//     upvotes: 0,
//     comments: [],
//   },
//   'my-thoughts-on-resumes': {
//     upvotes: 0,
//     comments: [],
//   },
// };

// // initial test
// app.get('/', (req, res) => {
//   res.send('Yoooooo!!! 🍳');
// });

// // initial test
// app.get('/hello/:name', (req, res) => {
//   const name = req.params.name; // take from url
//   res.send(`Hi ${name}`);
// });

// // initial test
// app.post('/hello', (req, res) => {
//   const name = req.body.name; // take from body json obj
//   res.send(`Helloooooo ${name}!`);
// });

// // local testing
// app.post(
//   '/api/articles/:name/upvote',
//   (req: Request<Params, {}, {}, {}>, res) => {
//     const articleName = req.params.name;
//     console.log(articleName);
//     articlesInfo[articleName].upvotes += 1;

//     res
//       .status(200)
//       .send(
//         `${articleName} now has ${articlesInfo[articleName].upvotes} upvotes!!!`
//       );
//   }
// );

// // local testing
// app.post(
//   '/api/articles/:name/add-comment',
//   (req: Request<Params, {}, ArticleComment, {}>, res) => {
//     const articleName = req.params.name;
//     const newComments = articlesInfo[articleName].comments as ArticleComment[];
//     const { username, text } = req.body;

//     newComments.push({
//       username,
//       text,
//     });
//     res.status(200).send(articlesInfo[articleName]);
//   }
// );

// all other paths that don't match, send to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname + '/src/build/index.html'));
});

app.listen(PORT, () =>
  console.log(`App has started on port ${PORT} at ${new Date()}`)
);

// to run server: npx babel-node server.js
// to run server: npm start
// to run server: nodemon ./server.ts localhost 8000
