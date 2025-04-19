const jwt = require('jsonwebtoken');

exports.login = (req, res) => {
  const { username, password } = req.body;

  // Replace this with your actual user authentication logic
  if (username === 'admin' && password === 'password') {
    const token = jwt.sign({ username }, 'ABCD', { expiresIn: '1h' }); // Replace 'your_secret_key' with your actual secret key
    return res.json({ token });
  }

  return res.status(401).json({ message: 'Invalid credentials' });
};