# rr-guerrillamail
Node library for interacting with Guerrilla Mail - creates and checks temporary email mailboxes

Quick example
-------------
```
// create a temporary email mailbox
var mailbox = new TempMailbox();

// get the address
mailbox.getEmailAddress()
	.then(function(addr) { console.log('email addr: ' + addr); })
	.then(function() {
		// wait for an email matching the predicate
		return mailbox.waitForEmail(function(m) {
			return (m.mail_subject.indexOf('xyzzy') != -1);
		});
	})
	.then(function(mail) {
		// log out the content of the email which matched
		console.log(mail.mail_body);
	});
```
