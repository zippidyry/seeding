const db = require("../connection")

const {convertTimestampToDate,createRef} = require('./utils')
const format = require('pg-format')
const seed = ({ topicData, userData, articleData, commentData }) => {
  return db.query('DROP TABLE IF EXISTS comments;').then(()=>{
    return db.query('DROP TABLE IF EXISTS articles;').then(()=>{
      return db.query('DROP TABLE IF EXISTS users;')
    })
  }).then(()=>{
    return db.query('DROP TABLE IF EXISTS topics;')
  }).then(()=>{
    return db.query('CREATE TABLE topics(slug VARCHAR PRIMARY KEY,description VARCHAR,img_url VARCHAR(1000));')
  }).then(()=>{
    return db.query('CREATE TABLE users(username VARCHAR PRIMARY KEY,name VARCHAR,avatar_url VARCHAR(1000));')
  }).then(()=>{
    return db.query('CREATE TABLE articles(article_id SERIAL PRIMARY KEY,title VARCHAR,topic VARCHAR REFERENCES topics(slug),author VARCHAR REFERENCES users(username),body TEXT,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,votes INT DEFAULT 0,article_img_url VARCHAR(1000));')
  }).then(()=>{
    return db.query('CREATE TABLE comments(comment_id SERIAL PRIMARY KEY, article_id INT REFERENCES articles(article_id),body TEXT,votes INT DEFAULT 0,author VARCHAR REFERENCES users(username),created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);')
  }).then(()=>{
    const formattedTopics = topicData.map((topic)=>{return [topic.slug,topic.description,topic.img_url]})
    const insertTopicsQuery = format('INSERT INTO topics(slug,description,img_url) VALUES %L',formattedTopics)
    return db.query(insertTopicsQuery)
  }).then(()=>{
    const formattedUsers = userData.map((user)=>{return [user.username,user.name,user.avatar_url]})
    const insertUsersQuery = format('INSERT INTO users(username,name,avatar_url) VALUES %L',formattedUsers)
    return db.query(insertUsersQuery)
  }).then(()=>{
    const formattedArticles = articleData.map((article)=>{
      const articleCorrected = convertTimestampToDate(article)
      return [articleCorrected.title,articleCorrected.topic,articleCorrected.author,articleCorrected.body,articleCorrected.created_at,articleCorrected.votes,articleCorrected.article_img_url]})
    const insertArticlesQuery = format('INSERT INTO articles(title,topic,author,body,created_at,votes,article_img_url) VALUES %L RETURNING *',formattedArticles)
    return db.query(insertArticlesQuery)//assigned article_id
  }).then((result)=>{//want article id instead of article title using article title
     // Result{rows:[{}]}
     console.log(result.rows)
    const articleRefObject = createRef(result.rows)
    const formattedComments = commentData.map((comment)=>{
      const article_id = articleRefObject[comment.article_title]
      const commentCorrected = convertTimestampToDate(comment)
      return [commentCorrected.body,commentCorrected.votes,commentCorrected.author,commentCorrected.created_at,article_id]})
    const insertCommentsQuery = format('INSERT INTO comments(body,votes,author,created_at,article_id) VALUES %L',formattedComments)
    return db.query(insertCommentsQuery)
  }) 
};
module.exports = seed;
