const express = require("express");
const path = require("path");
const csrf = require("csurf");
const flash = require("connect-flash");
const exphbs = require("express-handlebars");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongodb-session")(session);

const homeRoutes = require("./Routes/home");
const addRoutes = require("./Routes/add");
const coursesRoutes = require("./Routes/courses");
const cardRoutes = require("./Routes/card");
const ordersRoutes = require("./Routes/orders");
const authRoutes = require("./Routes/auth");
const profileRoutes = require("./Routes/profile");

const varMiddleware = require("./Middleware/variables");
const userMiddleware = require("./Middleware/user");
const errorHandler = require("./Middleware/error");
const fileMiddleware = require("./Middleware/file");

const keys = require("./Keys/index");

const app = express();
const PORT = process.env.port || 5000;

const hbs = exphbs.create({
    defaultLayout: "main",
    extname: "hbs",
    helpers: require("./Utils/hbs-helpers")
});

const store = new MongoStore({
    collection: "sessions",
    uri: keys.MONGODB_URI
});

app.engine("hbs", hbs.engine);
app.set("view engine", "hbs");
app.set("views", "views");

app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(express.urlencoded({extended: true}));

app.use(
    session({
        secret: keys.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store
    })
);
app.use(fileMiddleware.single("avatar"));
app.use(csrf());
app.use(flash());
app.use(varMiddleware);
app.use(userMiddleware);

app.use("/", homeRoutes);
app.use("/add", addRoutes);
app.use("/courses", coursesRoutes);
app.use("/card", cardRoutes);
app.use("/orders", ordersRoutes);
app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);
app.use(errorHandler);

async function start() {
    try {
        await mongoose.connect(keys.MONGODB_URI, {
            useNewUrlParser: true,
            useFindAndModify: false,
            useUnifiedTopology: true
        });
        app.listen(PORT, () => console.log(`Server is running at ${PORT}`));
    } catch (e) {
        console.log(e);
    }
}

start();
