const db = require('../../db/connection')
const selectTopics = ()=>{
    return db.query('SELECT slug, description FROM topics').then((result)=>{
        if(result.rows.length===0){
            return Promise.reject({status:404,msg:'not found'})
        }
        return result.rows
    })
}

const selectArticles = (sort_by = 'created_at', order = 'desc') => {
    const validSortBy = [
      'article_id',
      'title',
      'topic',
      'author',
      'body',
      'created_at',
      'votes',
      'comment_count',
      'article_img_url'
    ]
    const validOrder = ['asc', 'desc']
  
    if (!validSortBy.includes(sort_by)) {
      return Promise.reject({ status: 400, msg: 'Invalid sort_by' })
    }
  
    if (!validOrder.includes(order)) {
      return Promise.reject({ status: 400, msg: 'Invalid order query' })
    }
  
    const queryStr = `
      SELECT articles.article_id, articles.title, articles.topic, articles.author,
             articles.created_at, articles.votes, articles.article_img_url,
             COUNT(comments.comment_id)::INT AS comment_count
      FROM articles
      LEFT JOIN comments ON comments.article_id = articles.article_id
      GROUP BY articles.article_id
      ORDER BY ${sort_by} ${order}
    `
    return db.query(queryStr).then(({ rows }) => {
      return rows
    })
  }
 
const selectArticleById = (article_id) => {
    return db.query(`
      SELECT 
        a.author, 
        a.title, 
        a.article_id, 
        a.body, 
        a.topic, 
        a.created_at, 
        a.votes, 
        a.article_img_url,
        COUNT(c.comment_id) AS comment_count
      FROM articles AS a
      LEFT JOIN comments AS c ON a.article_id = c.article_id
      WHERE a.article_id = $1
      GROUP BY a.article_id
    `, [article_id]).then((result) => {
      if (result.rows.length === 0) {
        return Promise.reject({ status: 404, msg: 'not found' })
      }
      return result.rows[0]
    })
  }
  
const selectCommentsByArticleId = (article_id) => {
    return db
      .query(`SELECT * FROM articles WHERE article_id = $1`, [article_id])
      .then((articleResult) => {
        if (articleResult.rows.length === 0) {
          return Promise.reject({ status: 404, msg: 'not found' })
        }
  
        return db.query(
          `
          SELECT comment_id, votes, created_at, author, body, article_id
          FROM comments
          WHERE article_id = $1
          ORDER BY created_at DESC
          `,
          [article_id]
        )
      })
      .then((commentResult) => {
        return commentResult.rows
      })
  }
const insertCommentByArticleId = (article_id, username, body) => {
    if (!username || !body) {
      return Promise.reject({ status: 400, msg: 'missing required fields' })
    }
    return db
      .query(`SELECT * FROM articles WHERE article_id = $1`, [article_id])
      .then((result) => {
        if (result.rows.length === 0) {
          return Promise.reject({ status: 404, msg: 'article not found' })
        }
  
        return db.query(
          `
          INSERT INTO comments (author, body, article_id)
          VALUES ($1, $2, $3)
          RETURNING comment_id, author, body, article_id, votes, created_at
          `,
          [username, body, article_id]
        )
      })
      .then((result) => {
        return result.rows[0]
      })
  }
const updateArticleVotes = (article_id, inc_votes) => {
    if (typeof inc_votes !== 'number') {
      return Promise.reject({ status: 400, msg: 'bad request' })
    }
  
    return db.query(
      `
      UPDATE articles
      SET votes = votes + $1
      WHERE article_id = $2
      RETURNING *
      `,
      [inc_votes, article_id]
    ).then((result) => {
      if (result.rows.length === 0) {
        return Promise.reject({ status: 404, msg: 'not found' })
      }
      return result.rows[0]
    })
  }
const removeCommentById = (comment_id) => {
    return db.query(
      'DELETE FROM comments WHERE comment_id = $1 RETURNING *',
      [comment_id]
    ).then((result) => {
      if (result.rows.length === 0) {
        return Promise.reject({ status: 404, msg: 'comment not found' })
      }
    })
  }
const selectUsers = () => {
    return db.query(`SELECT username, name, avatar_url FROM users`)
      .then(({ rows }) => {
        return rows
      })
  }
module.exports = {selectTopics,selectArticles,selectArticleById,selectCommentsByArticleId,insertCommentByArticleId,updateArticleVotes,removeCommentById,selectUsers}