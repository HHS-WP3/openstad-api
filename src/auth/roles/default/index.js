var config   = require('config');
var RolePlay = require('../../RolePlay');

var auth = new RolePlay({
	defaultError    : 'Geen toegang',
	defaultRoleName : 'unknown'
});

var unknown   = auth.role('unknown');
var anonymous = unknown.role('anonymous');
var member    = anonymous.role('member');

var admin     = member.role('admin');
var editor    = member.role('editor');
var moderator = member.role('moderator');

var helpers = {

	needsToCompleteRegistration: function( user ) {
		return !user.hasCompletedRegistration();
	},

	mayMutateArticle: function( user, article ) {

		if( !article.isOpen() ) {
			return false;
		}

		// TODO: Time sensitivity?
		var isOwner   = helpers.isArticleOwner(user, article);
		var canEditAfterFirstLikeOrArg = article.site && article.site.config && article.site.config.articles ? article.site.config.articles.canEditAfterFirstLikeOrArg : false;
		var voteCount = article.no + article.yes;
		var argCount  = article.argumentsFor && article.argumentsFor.length && article.argumentsAgainst && article.argumentsAgainst.length;
		return isOwner && ( canEditAfterFirstLikeOrArg || ( !voteCount && !argCount ) );
	},


	// check if same user editing it's own data
	// 	//WARNING: this currently doesnt work
	// 	user resource is always logged in user

	//mayMutateUser: function(user, editUser) {
	//	return user.id === editUser.id;
	//},


	mayMutateIdea: function( user, idea ) {

    if( !idea.isOpen() ) {
			return false;
		}

		// TODO: Time sensitivity?
		var isOwner   = helpers.isIdeaOwner(user, idea);
		var canEditAfterFirstLikeOrArg = idea.site && idea.site.config && idea.site.config.ideas ? idea.site.config.ideas.canEditAfterFirstLikeOrArg : false;
		var voteCount = idea.no + idea.yes;
		var argCount  = idea.argumentsFor && idea.argumentsFor.length && idea.argumentsAgainst && idea.argumentsAgainst.length;
		return isOwner && ( canEditAfterFirstLikeOrArg || ( !voteCount && !argCount ) );
	},

	mayVoteIdea: function( user, idea ) {
		return idea.isOpen();
	},

	mayMutateArgument: function( user, argument ) {
		var isOwner   = helpers.isArgumentOwner(user, argument);
		return isOwner;
	},

	maySeeArgForm: function( user, idea ) {
		return idea.isRunning();
	},

	maySeeReplyForm: function( user, idea ) {
		return idea.isRunning();
	},

	mayAddArgument: function( user, idea ) {
		if (process.NODE_ENV == 'stemtool') {
			return idea.isRunning();
		} else {
			return idea.isRunning() && ( ( user && user.id != 1 ) || ( config.arguments && config.arguments.user && config.arguments.user.anonymousAllowed ) );
		}
	},

	mayReplyToArgument: function( user, idea, argument ) {
		return !argument.parentId &&
		       idea.isRunning();
	},

	// TODO: Deny when arg replies exist.
	mayMutateArgument: function( user, argument, idea ) {
		return user.id === argument.userId &&
		       idea.isRunning();
	},

	mayVoteArgument: function( user, idea, argument ) {
		return !argument.parentId;
	},

	isIdeaOwner: function( user, idea ) {
		return user.id === idea.userId;
	},

	isArticleOwner: function( user, article ) {
		return user.id === article.userId;
	},

	isArgumentOwner: function( user, argument ) {
		return user.id === argument.userId;
	},

};

require('./default-unknown')(helpers, unknown);
require('./anonymous')(helpers, anonymous);
require('./member')(helpers, member);
require('./admin')(helpers, admin);
require('./editor')(helpers, editor);
require('./moderator')(helpers, moderator);


module.exports = auth;
