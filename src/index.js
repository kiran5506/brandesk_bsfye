const express = require('express');
const dotenv = require("dotenv").config();
//const bodyParser = require('body-parser');
//const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');

const connectDB = require('./config/mongodb');
//const authenticateJWT =  require('./middlewares/authToken');

const authRouter = require('./routes/authRouter');
const sliderRouter = require('./routes/sliderRouter');

const vendorAuthRouter = require('./routes/vendorAuthRouter');
const vendorRouter = require('./routes/vendorRouter');

const adminAuthRouter = require('./routes/adminAuthRouter');

const app = express();
const PORT = process.env.PORT || 5003;

app.use(cors());
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
}));

app.use("/uploads", express.static('uploads'));

//app.use("/images", cors(), express.static(path.join(__dirname, "uploads")));

connectDB();
/** User Module */
app.use("/api", authRouter);
app.use("/api/slider", sliderRouter);

/** Vendor Module */
app.use("/api/vendorauth", vendorAuthRouter);
app.use("/api/vendor", vendorRouter);

/** Admin Module */
app.use("/api/admin", adminAuthRouter);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})