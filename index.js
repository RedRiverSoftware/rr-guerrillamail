var superagent = require('superagent');
var Promise = require('bluebird');


function TempMailbox() {
	var init = Promise.defer();
	var first_fetch = Promise.defer();
	var me = this;
	
	this.agent = superagent.agent();
	this.sequence = 0;
	this.init_promise = init.promise;
	this.messages = [];
	this.fetch_outstanding = true;
	this.current_fetch_promise = first_fetch.promise;
	this.filter_welcome_email = true;
	
	this.agent
		.get('http://api.guerrillamail.com/ajax.php')
		.query({
			f: 'get_email_address',
			ip: '127.0.0.1',
			agent: 'rr-guerrillamail'
		})
		.end(function(err, res) {
			if (err) { init.reject("init failed"); return; }
			
			me.email_addr = res.body.email_addr;
			me.sid_token = res.body.sid_token;
			me.email_timestamp = res.body.email_timestamp;
			me.alias = res.body.alias;

			init.resolve(true);
			
			me.fetch_outstanding = false;
			me.checkMail().then(function() {
				first_fetch.resolve();
			});
		});
}

TempMailbox.prototype.getEmailAddress = function() {
	var me = this;
	return this.init_promise.then(function(){
		return me.email_addr;
	});
};

TempMailbox.prototype.checkMail = function() {
	var me = this;
	
	if (this.fetch_outstanding) {
		return this.current_fetch_promise;
	}
	
	this.fetch_outstanding = true;
	
	var defer = Promise.defer();
	
	this.agent
		.get('http://api.guerrillamail.com/ajax.php')
		.query({
			f: 'check_email',
			seq: this.sequence
		})
		.end(function(err, res) {
			if (err) { defer.reject("request failed"); return; }
			
			res.body.list.forEach(function(m) {
				if (me.filter_welcome_email) {
					if (m.mail_id == 1) return;
				}
				me.messages.push(m);
				me.sequence = m.mail_id;
			});
			
			me.fetch_outstanding = false;
			defer.resolve(true);
		});
	
	this.current_fetch_promise = this.init_promise.then(function() { return defer.promise; });
	return this.current_fetch_promise;
};

TempMailbox.prototype.getNextMailSummary = function() {
	var me = this;
	
	if (this.messages.length > 0) {
		return new Promise(function(res,rej) { res(me.messages.shift()); });
	}
	
	return this.checkMail().then(function() {
		if (me.messages.length != 0) {
			return me.getNextMailSummary();
		}
		return null;
	});
};

TempMailbox.prototype.getMailDetail = function(id) {
	var defer = Promise.defer();
	
	this.agent
		.get('http://api.guerrillamail.com/ajax.php')
		.query({
			f: 'fetch_email',
			email_id: id
		})
		.end(function(err, res) {
			if (err) { defer.reject("request failed"); return; }
			
			defer.resolve(res.body);
		});
	
	return this.init_promise.then(function() { return defer.promise; });
};

TempMailbox.prototype.waitForEmail = function(summaryFilter, iterationDelay) {
	var me = this;
	
	iterationDelay = iterationDelay || 2500;
	
	function checkLoop(mail) {
		if (mail) {
			var match = summaryFilter(mail);
			if (match) {
				return me.getMailDetail(mail.mail_id);
			}
			return me.getNextMailSummary().then(checkLoop);
		}
		
		return Promise.delay(iterationDelay).then(function() { return me.getNextMailSummary(); }).then(checkLoop);
	}
	
	return this.init_promise
		.then(function() { return me.getNextMailSummary(); })
		.then(checkLoop);
};

TempMailbox.prototype.deleteMail = function(id) {
	var defer = Promise.defer();
	
	this.agent
		.get('http://api.guerrillamail.com/ajax.php')
		.query({
			f: 'del_email',
			email_ids: id
		})
		.end(function(err, res) {
			if (err) { defer.reject("request failed"); return; }
			
			defer.resolve(res.body);
		});
	
	return this.init_promise.then(function() { return defer.promise; });
};

module.exports = TempMailbox;
/*
var mailbox = new TempMailbox();

mailbox.getEmailAddress()
	.then(function(addr) { console.log('email addr: ' + addr); })
	.then(function() {
		return mailbox.waitForEmail(function(m) {
			return (m.mail_subject.indexOf('xyzzy') != -1);
		});
	})
	.then(function(mail) {
		console.log(mail.mail_body);
	});
	*/
