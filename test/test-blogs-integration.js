const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const should = chai.should();

const {BlogPost} = require('../models');
const {DATABASE_URL} = require('../config');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

function seedBlogPostData() {
	console.info('seeding blog post data');
	const seedData = [];

	for (let i=1; i<=10; i++) {
		seedData.push({
			author: {
				firstName: faker.name.firstName(),
				lastName: faker.name.lastName()
			}
			title: faker.lorem.sentence(),
			content: faker.lorem.text()
		});
	}
	return BlogPost.insertMany(seedData);
}

function generatePostData() {
	return {
		title: faker.lorem.sentence(),
        author: {
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
        },
        content: faker.lorem.text()
	}
}

function tearDownDb() {
	console.warn('Deleting database');
	return mongoose.connection.dropDatabase();
}

describe('Blog Post API resource', function() {

	before(function() {
		return runServer(TEST_DATABASE_URL);
	});

	beforeEach(function() {
		return seedBlogPostData();
	});

	afterEach(function() {
		return tearDownDb();
	});

	after(function() {
		return closeServer();
	})

	describe('GET endpoint', function() {

		it('should return all existing blog posts', function() {
			let res;
			return chai.request(app)
				.get('/posts')
				.then(function(_res) {
					res = _res;
					res.should.have.status(200);
					res.body.should.have.length.of.at.least(1);
					return BlogPost.count();
				})
				.then(function(count) {
					res.body.should.have.length.of(count);
				});
		});

		it('should return blog posts with right fields', function() {
			let resPost;
			return chai.request(app)
				.get('/posts')
				.then(function(res) {
					res.should.have.status(200);
					res.should.be.json;
					res.body.should.be.a('array');
					res.body.should.have.length.of.at.least(1);
					res.body.forEach(function(post) {
						post.should.be.a('object');
						post.should.include.keys('id', 'title', 'author', 'content', 'created');
					});
					resPost = res.body[0];
					return BlogPost.findById(resPost.id);
				})
				.then(function(post) {
					resPost.id.should.equal(post.id);
					resPost.title.should.equal(post.title);
					resPost.content.should.equal(post.content);
					resPost.author.should.equal(post.authorName);
				});
		});
	});

	describe('POST endpoint', function() {

		it('should add a new blog post', function() {
			const newPost = generatePostData();
			return chai.request(app)
				.post('/posts')
				.send(newPost)
				.then(function(res) {
					res.should.have.status(201);
					res.should.be.json;
					res.body.should.be.a('obect');
					res.body.should.include.keys('id', 'title', 'author', 'content', 'created');
					res.body.title.should.equal(newPost.title);
					res.body.id.should.not.be.null;
					res.body.author.should.equal(`${newPost.author.firstName} ${newPost.author.lastName}`);
					res.body.content.should.equal(newPost.content)
					return BlogPost.findById(res.body.id);
				})
				.then(function(post) {
					post.title.should.equal(newPost.title);
					post.content.should.equal(newPost.content);
					post.author.firstName.should.equal(newPost.auhtor.firstName);
					post.author.lastName.should.equal(newPost.auhtor.lastName);
				});
		});
	});

	describe('PUT endpoint', function() {
		it('should update fields you send over' function() {
			const updateData = {
				title: 'bizz bar',
				content: 'buzz buzz buzz',
				author: {firstName: 'foo', lastName: 'bar'}
			};
			return BlogPost
				.findOne()
				.exec()
				.then(function(post) {
					updateData.id = post.id;
					return chai.request(app)
						.put(`/posts/${post.id}`)
						.send(updateData);
				})
				.then(function(res) {
					res.should.have.status(204);
					return BlogPost.findById(updateData.id).exec();
				})
				.then(function(post) {
					post.title.should.equal(updateData.title);
					post.content.should.equal(updateData.content);
					post.author.firstName.should.equal(updateData.author.firstName);
					post.author.lastName.should.equal(updateData.author.lastName);
				});
		});
	});

	
})












