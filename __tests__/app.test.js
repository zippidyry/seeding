const endpointsJson = require("../endpoints.json");
const db = require("../db/connection")
/* Set up your test imports here */
const request = require('supertest')
const seed = require("../db/seeds/seed")
const data = require("../db/data/test-data/index")
const app = require("../db/app")
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
        expect(endpoints).toEqual(endpointsJson);
      });
  });
});