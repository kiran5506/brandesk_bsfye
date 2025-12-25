const dotenv = require("dotenv").config();
const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization') && req.header('Authorization').split(' ')[1];
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) return res.status(403).json({ status:409, message: 'token is invalid' });
            req.user = user;
            next();
        });        
    } else {
        res.status(401).json({ status: false, message: 'No token provided' });
    }
};

module.exports = authenticateJWT;