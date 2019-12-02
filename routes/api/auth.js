const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');

const User = require('../../models/User');

// @route  GET api/auth
// @desc   Test route
// @access Public
router.route('/').get(auth, async (req, res) => {
	try {
		const user = await User.findById(req.user.id).select('-password');
		res.json(user);
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

// @route  POST api/auth
// @desc   Authenticate user & get token
// @access Public
router
	.route('/')
	.post(
		[
			check('email', 'Please included a valid email').isEmail(),
			check('password', 'Password is required').exists()
		],
		async (req, res) => {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({ errors: errors.array() });
			}

			const { email, password } = req.body;

			try {
				// See if user exists
				let user = await User.findOne({ email });
				if (!user) {
					return res.status(400).json({ errors: [ { msg: 'Invalid Credentials' } ] });
				}

				// Check passwords match
				const isMatch = await bcrypt.compare(password, user.password);

				if (!isMatch) {
					return res.status(400).json({ errors: [ { msg: 'Invalid Credentials' } ] });
				}

				// Json web token for authentication
				const payload = {
					user: {
						id: user.id
					}
				};
				jwt.sign(payload, config.get('jwtSecret'), { expiresIn: 3600000 }, (err, token) => {
					if (err) throw err;
					res.json({ token });
				});
			} catch (err) {
				console.error(err.message);
				res.status(500).send('Server error');
			}
		}
	);

module.exports = router;
