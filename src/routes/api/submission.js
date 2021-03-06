const Promise = require('bluebird');
const express = require('express');
const db      = require('../../db');
const auth    = require('../../auth');
const pagination = require('../../middleware/pagination');
const searchResults = require('../../middleware/search-results');

let router = express.Router({mergeParams: true});

router.route('/')

// list submissions
// --------------
	.get(auth.can('submissions:list'))
	.get(pagination.init)
	.get(function(req, res, next) {
		let where = {};
		req.scope = ['defaultScope'];
		db.Submission
			.scope(...req.scope)
			.findAndCountAll({ where, offset: req.pagination.offset, limit: req.pagination.limit })
			.then(function( result ) {
        req.results = result.rows;
        req.pagination.count = result.count;
        return next();
			})
			.catch(next);
	})
	.get(searchResults)
	.get(pagination.paginateResults)
	.get(function(req, res, next) {
    let records = req.results.records || req.results
		records.forEach((record, i) => {
      records[i] = record.toJSON();
		});
		res.json(req.results);
  })

// create submission
// ---------------
  .post(auth.can('submissions:create'))
	.post(function(req, res, next) {
		let data = {
			submittedData     : req.body.submittedData,
			siteId      			: req.params.siteId,
			userId      			: req.user.id,
		};

		db.Submission
			.create(data)
			.then(result => {
				res.json(result);
			})
	})

	// with one existing submission
	// --------------------------
	router.route('/:submissionId(\\d+)')
		.all(function(req, res, next) {
			var submissionId = parseInt(req.params.submissionId);

			req.scope = ['defaultScope'];
			req.scope.push({method: ['forSiteId', req.params.siteId]});

		//	let where = { siteId }


			db.Submission
				.scope(...req.scope)
		//		.find({ where })
        .find()
				.then(found => {
					if ( !found ) throw new Error('Submission not found');
					req.submission = found;
					next();
				})
				.catch(next);
		})

	// view submission
	// -------------
		.get(auth.can('submissions:view'))
		.get(function(req, res, next) {
			res.json(req.submission);
		})

	// update submission
	// ---------------
		.put(auth.can('submissions:edit'))
		.put(function(req, res, next) {
			req.submission
				.update(req.body)
				.then(result => {
					res.json(result);
				})
				.catch(next);
		})

	// delete submission
	// ---------------
		.delete(auth.can('submissions:delete'))
		.delete(function(req, res, next) {
			req.submission
				.destroy()
				.then(() => {
					res.json({ "submission": "deleted" });
				})
				.catch(next);
		})

module.exports = router;
