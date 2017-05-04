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
		// in this example, send a message with subject containing "xyzzy" to the displayed address
		return mailbox.waitForEmail(function(m) {
			return (m.mail_subject.indexOf('xyzzy') != -1);
		});
	})
	.then(function(mail) {
		// log out the entire object of the email which matched
		// including mail_body, which is the content
		console.log(JSON.stringify(mail, null, 2));
		
		// delete the resulting email
		mailbox.deleteMail(mail.mail_id);
	});
```
