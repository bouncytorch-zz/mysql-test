/* eslint-disable no-empty-function */
const express = require('express');
const app = express();
const uuid = require('uuid').v4;
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const path = require('path');
const auth = require('./assets/scripts/auth');
app.use(express.static(path.join(__dirname, '/assets/home/assets/')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({
	genid: () => {
		return uuid();
	},
	store: new FileStore({
		reapInterval: 10,
		logFn: function() {},
	}),
	cookie: {
		maxAge: 1 * 60 * 60 * 1000,
	},
	secret: 'dfe54f0c7a37e3cd619b28375842586c0d76a6b110ecc84ab7aa4b3d59bcd311',
	resave: false,
	saveUninitialized: true,
	username: 'none',
}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/assets/home/'));

app.post('/auth', async (req, res) => {
	if (req.session.username != undefined) {
		res.render('views/login', {
			errCode: 0,
			redirect: 1,
		});
	}
	const query = req.query;
	if ('signin' in query) {
		auth.signin(req, res, async (dat, result) => {
			if (dat == 'success') {
				if ('check' in req.body) {
					req.session.cookie.maxAge = 300000000000;
				}
				req.session.username = result.username;
				res.render('views/login', {
					errCode: 0,
					redirect: 1,
				});
			}
			else if (dat == 'error1') {
				res.redirect('auth?signin=&err=1');
			}
			else if (dat == 'error2') {
				res.redirect('auth?signin=&err=2');
			}
		});
	}
	else if ('signup' in query) {
		auth.signup(req, res);
	}
});
app.post('/check', (req, res) => {
	if (req.session.username != undefined) {
		res.render('views/login', {
			errCode: 0,
			redirect: 1,
		});
	}
	const query = req.query;
	if (req.body && Object.keys(req.body).length === 0 && Object.getPrototypeOf(req.body) === Object.prototype) {
		//
	}
	else if ('email' in query) {
		auth.check.email(req, res);
	}
	else if ('username' in query) {
		auth.check.username(req, res);
	}
});

app.get('/', (req, res) => {
	// eslint-disable-next-line prefer-const
	let opts = {
		name: undefined,
		email: undefined,
		maxage: req.session.cookie.maxAge,
		id: req.session.id,
	};
	if (req.session.username != undefined) {
		auth.getInfo(req, res, (result) => {
			opts.name = result.username;
			opts.email = result.email;
			res.render('index', opts);
		});
	}
	else {
		res.render('index', opts);
	}
});
app.get('/auth', (req, res) => {
	if (req.session.username != undefined) {
		res.render('views/login', {
			errCode: 0,
			redirect: 1,
		});
	}
	else {
		const query = req.query;
		let errCode = 0;
		if ('err' in query) {
			errCode = query.err;
		}
		if ('signin' in query) {
			res.render('views/login', { errCode: errCode, redirect: 0 });
		}
		else if ('signup' in query) {
			res.render('views/register', { errCode: errCode });
		}
		else {
			res.status(404).send('404: Not Found.');
		}
	}
});

app.get('/logout', (req, res) => {
	req.session.destroy();
	res.render('views/login', {
		errCode: 0,
		redirect: 1,
	});
});

app.get('*', function(req, res) {
	res.status(404).send('404: Not Found.');
});

app.listen(3000, () => {
	console.log('Listening on localhost:3000');
});