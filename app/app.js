const express = require('express')
const app = express()
const {getApi,getTopics,getArticlesById,getArticles,getCommentsByArticleId,postCommentByArticleId,patchArticleById,deleteComment,getUsers} = require("../app/controllers/news.controller")

app.use(express.json())

app.get('/api',getApi)

app.get("/api/topics",getTopics)

app.get("/api/articles/:article_id",getArticlesById)

app.get("/api/articles",getArticles)

app.get("/api/articles/:article_id/comments",getCommentsByArticleId)

app.post('/api/articles/:article_id/comments', postCommentByArticleId)

app.patch('/api/articles/:article_id', patchArticleById)

app.delete('/api/comments/:comment_id', deleteComment)

app.get('/api/users', getUsers)

app.all('/*splat', (req, res)=>{
    res.status(404).send({ msg: 'Route not found' })
})
  
app.use((err,req,res,next) => {
    if(err.code==='22P02'){
        res.status(400).send({msg:'bad request'})
    }
    else{
        next(err)
    }
})

app.use((err,req,res,next)=>{
    if(err.status && err.msg){
        res.status(err.status).send({msg:err.msg})
    }
    else{
        next(err)
    }
})
app.use((err,req,res,next)=>{
   
    res.status(500).send({msg:'Internal server error'})
})

module.exports = app