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
const categoryRouter = require('./routes/categoryRouter');
const eventRouter = require('./routes/eventRouter');
const leadPackageRouter = require('./routes/leadPackageRouter');
const skillRouter = require('./routes/skillRouter');
const tutorialRouter = require('./routes/tutorialRouter');
const languageRouter = require('./routes/languageRouter');
const testimonialRouter = require('./routes/testimonialRouter');

const vendorAuthRouter = require('./routes/vendorAuthRouter');
const vendorRouter = require('./routes/vendorRouter');
const businessProfileRouter = require('./routes/businessProfileRoutes');
const businessPortfolioRouter = require('./routes/businessPortfolioRoutes');
const businessPackageRouter = require('./routes/businessPackageRoutes');

const userRouter = require('./routes/userRouter');
const employeeRouter = require('./routes/employeeRouter');

const adminAuthRouter = require('./routes/adminAuthRouter');
const customerInquiryRouter = require('./routes/customerInquiryRouter');
const customerRouter = require('./routes/customerRouter');
const customerAuthRouter = require('./routes/customerAuthRouter');
const contactSupportRouter = require('./routes/contactSupportRouter');
const feedbackRouter = require('./routes/feedbackRouter');
const reviewRouter = require('./routes/reviewRouter');
const freelancerRouter = require('./routes/freelancerRouter');
const suggestionRouter = require('./routes/suggestionRouter');
const videoRouter = require('./routes/videoRouter');
const paymentRouter = require('./routes/paymentRouter');
const statsRouter = require('./routes/statsRouter');
const wishlistRouter = require('./routes/wishlistRouter');
const leadAssignmentRouter = require('./routes/leadAssignmentRouter');

const app = express();
// Default to 4000 when PORT is not provided by the environment
const PORT = process.env.PORT || 4000;
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger UI setup
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpec, { explorer: true }));

app.use(cors({
  origin: [
    "https://bsfye.com",
    "https://api.bsfye.com"
  ],
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
app.use("/api/category", categoryRouter);
app.use("/api/event", eventRouter);
app.use("/api/leadpackage", leadPackageRouter);
app.use("/api/skill", skillRouter);
app.use("/api/tutorial", tutorialRouter);
app.use("/api/language", languageRouter);
app.use("/api/testimonial", testimonialRouter);

/** Vendor Module */
app.use("/api/vendorauth", vendorAuthRouter);
app.use("/api/vendor", vendorRouter);
app.use("/api/business-profile", businessProfileRouter);
app.use("/api/business-portfolio", businessPortfolioRouter);
app.use("/api/business-packages", businessPackageRouter);

/** User Module */
app.use("/api/user", userRouter);
app.use("/api/employee", employeeRouter);

/** Admin Module */
app.use("/api/admin", adminAuthRouter);

/** Customer Inquiry Module */
app.use("/api/inquiry", customerInquiryRouter);

/** Customer Module */
app.use("/api/customerauth", customerAuthRouter);
app.use("/api/customer", customerRouter);

/** Contact Support Module */
app.use("/api/contact-support", contactSupportRouter);

/** Feedback Module */
app.use("/api/feedback", feedbackRouter);

/** Review Module */
app.use("/api/review", reviewRouter);
app.use("/api/freelancers", freelancerRouter);
app.use("/api/suggestions", suggestionRouter);
app.use("/api/video", videoRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/stats", statsRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/lead-assignments", leadAssignmentRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Connected to BASE_URL at ${process.env.BASE_URL}`);
  console.log(`NODE_ENV=${process.env.NODE_ENV || 'development'} BASE_URL=${process.env.BASE_URL || ''}`);
});