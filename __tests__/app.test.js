require("jest-extended")
const matchers = require("jest-sorted")
expect.extend(matchers)
const endpointsJson = require("../endpoints.json")
const db = require("../db/connection")
/* Set up your test imports here */

const request = require('supertest')
const seed = require("../db/seeds/seed")
const data = require("../db/data/test-data/index")
const app = require("../app/app")

/* Set up your beforeEach & afterAll functions here */
beforeEach(()=>{
  return seed(data)
})
afterAll(()=>{
  return db.end()
})

describe("GET /api", () => {
  test("200: Responds with an object detailing the documentation for each endpoint", () => {
    return request(app)
      .get("/api")
      .expect(200)
      .then(({ body: { endpoints } }) => {
        expect(endpoints).toEqual(endpointsJson)
      })
  })
})
describe("GET /api/topics", () => {
  test("200: Responds with an array of topic objects", () => {
    return request(app)
      .get("/api/topics")
      .expect(200)
      .then((response)=>{
        const topics = response.body.topics
        expect(topics).toHaveLength(3)
        topics.forEach((topic)=>{
          expect(topic).toMatchObject({
            description: expect.any(String),
            slug: expect.any(String)
        })  
        })
    })
  })
})
describe("GET /api/articles/:article_id", () => {
  test("200: Responds with an an article object with properties", () => {
    return request(app)
      .get("/api/articles/1")
      .expect(200)
      .then((response)=>{
        expect(response.body.article).toHaveProperty('author')
        expect(response.body.article).toHaveProperty('title')
        expect(response.body.article).toHaveProperty('article_id')
        expect(response.body.article).toHaveProperty('body')
        expect(response.body.article).toHaveProperty('topic')
        expect(response.body.article).toHaveProperty('created_at')
        expect(response.body.article).toHaveProperty('votes')
        expect(response.body.article).toHaveProperty('article_img_url')
    })
  })
  test('404: responds with 404 not found for invalid article_id', () => {
    return request(app)
      .get('/api/articles/9999') 
      .expect(404)
      .then((response) => {
        expect(response.body.msg).toBe('not found')
      })
  })
  test('400: Bad Request when article_id is not a number', () => {
    return request(app)
      .get('/api/articles/invalid_id')  
      .expect(400)
      .then((response) => {
        expect(response.body.msg).toBe('bad request')
      })
  })
})
describe("GET /api/articles", () => {
  test("200: Responds with an array of article objects", () => {
    return request(app)
      .get("/api/articles")
      .expect(200)
      .then((response)=>{
        const articles = response.body.articles
        articles.forEach((article)=>{
        expect(article).toHaveProperty('author')
        expect(article).toHaveProperty('title')
        expect(article).toHaveProperty('article_id')
        expect(article).toHaveProperty('topic')
        expect(article).toHaveProperty('created_at')
        expect(article).toHaveProperty('votes')
        expect(article).toHaveProperty('article_img_url')
        expect(article).toHaveProperty('comment_count')
        })
    })
  })
  test("400: Bad Request when given an invalid article type id", () => {
    return request(app)
      .get("/api/articles/nan")
      .expect(400)
      .then((res) => {
        expect(res.body.msg).toBe("bad request")
      })
  })
  
  test("404: Bad Request when given a nonexistent article id", () => {
    return request(app)
      .get("/api/articles/9999")
      .expect(404)
      .then((res) => {
        expect(res.body.msg).toBe("not found")
      })
  })
})

describe("GET /api/articles/:article_id/comments", () => {
  test("200: responds with an array of comments for a valid article_id, sorted by date descending", () => {
    return request(app)
      .get("/api/articles/1/comments")
      .expect(200)
      .then((res) => {
        const { comments } = res.body
        expect(Array.isArray(comments)).toBe(true)
        comments.forEach((comment) => {
          expect(comment).toEqual(
            expect.objectContaining({
              comment_id: expect.any(Number),
              votes: expect.any(Number),
              created_at: expect.any(String),
              author: expect.any(String),
              body: expect.any(String),
              article_id: 1
            })
          )
        })
        const dates = comments.map((c) => new Date(c.created_at))
        expect(dates).toEqual([...dates].sort((a, b) => b - a))
      })
  })

  test("200: responds with an empty array when the article has no comments", () => {
    return request(app)
      .get("/api/articles/2/comments") 
      .expect(200)
      .then((res) => {
        expect(res.body.comments).toEqual([])
      })
  })

  test("404: article_id does not exist", () => {
    return request(app)
      .get("/api/articles/9999/comments")
      .expect(404)
      .then((res) => {
        expect(res.body.msg).toBe("not found")
      })
  })

  test("400: article_id is not a number", () => {
    return request(app)
      .get("/api/articles/not-a-number/comments")
      .expect(400)
      .then((res) => {
        expect(res.body.msg).toBe("bad request")
      })
  })
})
//add test for invalid user
describe('POST /api/articles/:article_id/comments', () => {
  test('201: responds with the posted comment', () => {
    return request(app)
      .post('/api/articles/1/comments')
      .send({
        username: 'butter_bridge',
        body: 'Nice article!'
      })
      .expect(201)
      .then((res) => {
        const comment = res.body.comment
        expect(comment).toEqual(
          expect.objectContaining({
            comment_id: expect.any(Number),
            author: 'butter_bridge',
            body: 'Nice article!',
            article_id: 1,
            votes: 0,
            created_at: expect.any(String)
          })
        )
      })
  })

  test('400: missing body or username', () => {
    return request(app)
      .post('/api/articles/1/comments')
      .send({})
      .expect(400)
      .then((res) => {
        expect(res.body.msg).toBe('missing required fields')
      })
  })

  test('404: article_id does not exist', () => {
    return request(app)
      .post('/api/articles/9999/comments')
      .send({
        username: 'butter_bridge',
        body: 'Test comment'
      })
      .expect(404)
      .then((res) => {
        expect(res.body.msg).toBe('article not found')
      })
  })

  test('400: invalid article_id (non-numeric)', () => {
    return request(app)
      .post('/api/articles/not-a-number/comments')
      .send({
        username: 'butter_bridge',
        body: 'Invalid test'
      })
      .expect(400)
      .then((res) => {
        expect(res.body.msg).toBe('bad request')
      })
  })
})
describe('PATCH /api/articles/:article_id', () => {
  test('200: responds with the updated article with incremented votes', () => {
    return request(app)
      .patch('/api/articles/1')
      .send({ inc_votes: 10 })
      .expect(200)
      .then(({ body }) => {
        expect(body.article).toMatchObject({
          article_id: 1,
          votes: expect.any(Number),
          title: expect.any(String),
          topic: expect.any(String),
          author: expect.any(String),
          body: expect.any(String),
          created_at: expect.any(String),
          article_img_url: expect.any(String)
        })
        expect(body.article.votes).toBe(110)
      })
  })

  test('200: responds with the updated article with decremented votes', () => {
    return request(app)
      .patch('/api/articles/1')
      .send({ inc_votes: -150 })
      .expect(200)
      .then(({ body }) => {
        expect(body.article.votes).toBeLessThan(0)
      })
  })

  test('400: responds with bad request for invalid inc_votes value', () => {
    return request(app)
      .patch('/api/articles/1')
      .send({ inc_votes: 'banana' })
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe('bad request')
      })
  })

  test('400: responds with bad request when inc_votes is missing', () => {
    return request(app)
      .patch('/api/articles/1')
      .send({})
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe('bad request')
      })
  })

  test('404: responds with not found when article_id does not exist', () => {
    return request(app)
      .patch('/api/articles/9999')
      .send({ inc_votes: 1 })
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe('not found')
      })
  })

  test('400: responds with bad request when article_id is invalid', () => {
    return request(app)
      .patch('/api/articles/notanid')
      .send({ inc_votes: 1 })
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe('bad request')
      })
  })
})
describe('DELETE /api/comments/:comment_id', () => {
  test('204: responds with no content for valid comment_id', () => {
    return request(app)
      .delete('/api/comments/1')
      .expect(204)
      .then((res) => {
        expect(res.body).toEqual({})
      })
  })

  test('404: comment_id not found', () => {
    return request(app)
      .delete('/api/comments/9999')
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe('comment not found')
      })
  })

  test('400: invalid comment_id (not a number)', () => {
    return request(app)
      .delete('/api/comments/not-a-number')
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe('bad request')
      })
  })
})
describe('GET /api/users', () => {
  test('200: responds with an array of user objects with expected properties', () => {
    return request(app)
      .get('/api/users')
      .expect(200)
      .then(({ body }) => {
        expect(Array.isArray(body.users)).toBe(true)
        expect(body.users.length).toBeGreaterThan(0)

        body.users.forEach((user) => {
          expect(user).toEqual(
            expect.objectContaining({
              username: expect.any(String),
              name: expect.any(String),
              avatar_url: expect.any(String),
            })
          )
        })
      })
  })
})
describe('GET /api/articles with queries', () => {
  test('200: responds with sorted articles by votes in ascending order', () => {
    return request(app)
      .get('/api/articles?sort_by=votes&order=asc')
      .expect(200)
      .then(({ body }) => {
        expect(body.articles).toBeSortedBy('votes',{ ascending: true })
      })
  })

  test('400: responds with error for invalid sort_by', () => {
    return request(app)
      .get('/api/articles?sort_by=bananas')
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe('Invalid sort_by')
      })
  })

  test('400: responds with error for invalid order', () => {
    return request(app)
      .get('/api/articles?order=sideways')
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe('Invalid order query')
      })
  })
})
