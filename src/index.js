const express = require('express');
const dotenv = require("dotenv").config();
//const bodyParser = require('body-parser');
//const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swaggerConfig');

const connectDB = require('./config/mongodb');
//const authenticateJWT =  require('./middlewares/authToken');

const authRouter = require('./routes/authRouter');
const sliderRouter = require('./routes/sliderRouter');
const serviceRouter = require('./routes/serviceRouter');
const cityRouter = require('./routes/cityRouter');
const eventRouter = require('./routes/eventRouter');
const leadPackageRouter = require('./routes/leadPackageRouter');
const skillRouter = require('./routes/skillRouter');
const tutorialRouter = require('./routes/tutorialRouter');
const languageRouter = require('./routes/languageRouter');

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

// Swagger UI setup
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpec, { explorer: true }));

app.use(cors({
  origin: ['http://localhost:3000', 'https://your-production-domain.com'],
  credentials: true
}));

app.use("/uploads", express.static('uploads'));

//app.use("/images", cors(), express.static(path.join(__dirname, "uploads")));

connectDB();
/** User Module */
app.use("/api", authRouter);
app.use("/api/slider", sliderRouter);
app.use("/api/service", serviceRouter);
app.use("/api/city", cityRouter);
app.use("/api/event", eventRouter);
app.use("/api/leadpackage", leadPackageRouter);
app.use("/api/skill", skillRouter);
app.use("/api/tutorial", tutorialRouter);
app.use("/api/language", languageRouter);

/** Vendor Module */
app.use("/api/vendorauth", vendorAuthRouter);
app.use("/api/vendor", vendorRouter);

/** Admin Module */
app.use("/api/admin", adminAuthRouter);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})