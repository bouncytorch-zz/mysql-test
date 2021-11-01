const mysql = require('mysql');
const bcrypt = require('bcrypt');
const connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'rootUser',
	password : 'passwow',
	database : 'maindb',
});
connection.connect(function(err) {
	if (err) throw err;
});
exports.signup = async (req, res) => {
	const password = req.body.password;
	const encryptedPassword = await bcrypt.hash(password, 12);
	const usernameregTest = /^[a-z0-9_]+$/i;
	const emailregTest = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	const passregTest = /^[a-z0-9#$%&'()*+,-./:;<=>?@[\]^_`{|}~]{8,}$/i;
	if (usernameregTest.test(req.body.username) && emailregTest.test(req.body.email) && passregTest.test(req.body.password)) {
		connection.query(`SELECT username, email, password FROM accounts WHERE username = '${req.body.username}' OR email = '${req.body.email}';`, (error, results) => {
			if (error) throw error;
			if (results.length > 0) {
				res.redirect('/auth?signup=&err=1');
			}
			else {
				connection.query(`INSERT INTO \`accounts\` (\`username\`, \`password\`, \`email\`) VALUES ('${req.body.username}', '${encryptedPassword}', '${req.body.email}');`, (err) => {
					if (err) {
						res.send({
							'code':400,
							'failed':'error ocurred',
						});
					}
					else {
						console.log(`User ${req.body.username} registered with ${req.body.email}`);
						exports.signin(req, res);
					}
				});
			}
		});
	}
	else {
		res.redirect('/auth?signup=&err=2');
	}
};

exports.signin = (req, res, callback) => {
	const password = req.body.password;
	let login;
	if (('username' in req.body) || ('email' in req.body)) {
		login = req.body.username;
	}
	else { login = req.body.login; }
	let type;
	const types = {
		email: /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
		username: /^[a-z0-9]+$/,
	};
	if (types.email.test(login)) {
		type = 'email';
	}
	else if (types.username.test(login)) {
		type = 'username';
	}
	connection.query(`SELECT * FROM accounts WHERE ${type} = ?`, [login], async (error, results) => {
		if (error) {
			throw error;
		}
		else if (results.length > 0) {
			const comparision = bcrypt.compare(password, results[0].password);
			if (comparision) {
				return callback('success', results[0]);
			}
			else {
				// error 1 - password mismatch.
				return callback('error1');
			}
		}
		else {
			// error 2 - nonexistent login.
			return callback('error2');
		}
	});

};

exports.check = {
	email: (req, res) => {
		connection.query('SELECT * FROM accounts WHERE email = ?', [req.body.email], (error, results) => {
			if (error) console.log(error);
			if (results.length > 0) {
				res.json({
					exists: true,
				});
			}
			else {
				res.json({
					exists: false,
				});
			}
		});
	},
	username: (req, res) => {
		connection.query('SELECT * FROM accounts WHERE username = ?', [req.body.username], (error, results) => {
			if (error) console.log(error);
			if (results.length > 0) {
				res.json({
					exists: true,
				});
			}
			else {
				res.json({
					exists: false,
				});
			}
		});
	},
};

exports.getInfo = (req, res, callback) => {
	connection.query('SELECT * FROM accounts WHERE username = ?', [req.session.username], (error, results) => {
		if (error) console.log(error);
		return callback(results[0]);
	});
};