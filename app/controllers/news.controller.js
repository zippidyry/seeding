const endpointsJson = require('../../endpoints.json')
const {selectTopics,selectArticles,selectArticleById, selectCommentsByArticleId,insertCommentByArticleId,updateArticleVotes,removeCommentById,selectUsers} = require('../models/news.model')
const getApi = (req,res,next)=>{
    res.status(200).send({ endpoints: endpointsJson })
}
const getTopics = (req,res,next) =>{
    const {sort_by} = req.query
    return selectTopics(sort_by).then((topics)=>{
        res.status(200).send({ topics })
    })
    .catch((err)=>{
        next(err)
    })
}
const getArticlesById= (req,res,next) =>{
    const { article_id } = req.params
    return selectArticleById(article_id).then((article)=>{
        res.status(200).send({ article })
    })
    .catch((err)=>{
        next(err)
    })
}
const getArticles= (req,res,next) =>{
    const { sort_by = 'created_at', order = 'desc' } = req.query
    return selectArticles(sort_by,order).then((articles)=>{
        res.status(200).send({ articles })
    })
    .catch((err)=>{
        next(err)
    })
}
const getCommentsByArticleId = (req, res, next) => {
    const { article_id } = req.params
  
    if (isNaN(Number(article_id))) {
      return next({ status: 400, msg: 'bad request' })
    }
  
    return selectCommentsByArticleId(article_id)
      .then((comments) => {
        res.status(200).send({ comments })
      })
      .catch((err) => {
        next(err)
      })
  }
const postCommentByArticleId = (req, res, next) => {
    const { article_id } = req.params
    const { username, body } = req.body
  
    if (isNaN(Number(article_id))) {
      return next({ status: 400, msg: 'bad request' })
    }
  
    insertCommentByArticleId(article_id, username, body)
      .then((comment) => {
        res.status(201).send({ comment })
      })
      .catch(next)
  }
const patchArticleById = (req, res, next) => {
    const { article_id } = req.params
    const { inc_votes } = req.body
  
    updateArticleVotes(article_id, inc_votes)
      .then((updatedArticle) => {
        res.status(200).send({ article: updatedArticle })
      })
      .catch(next)
  }
const deleteComment = (req, res, next) => {
    const { comment_id } = req.params
  
    removeCommentById(comment_id)
      .then(() => {
        res.status(204).send()
      })
      .catch((err) => {
        next(err)
      })
  }
const getUsers = (req, res, next) => {
    selectUsers()
      .then((users) => {
        res.status(200).send({ users })
      })
      .catch(next)
  }

module.exports = {getApi,getTopics,getArticlesById,getArticles,getCommentsByArticleId,postCommentByArticleId,patchArticleById,deleteComment,getUsers}