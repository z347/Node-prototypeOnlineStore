const router = require("express").Router(),
    crypto = require("crypto"),
    bcrypt = require("bcryptjs"),
    {validationResult} = require("express-validator"),
    nodemailer = require("nodemailer"),
    sendgrid = require("nodemailer-sendgrid-transport"),
    User = require("../Models/user"),
    keys = require("../Keys/index"),
    registerEmail = require("../Emails/registration"),
    resetEmail = require("../Emails/reset"),
    {registerValidators} = require("../Utils/validators"),

    transporter = nodemailer.createTransport(
        sendgrid({
            auth: {api_key: keys.SENDGRID_API_KEY}
        })
    );


router.get("/login", async (req, res) => {
    res.render("auth/login", {
        title: "Авторизація",
        isLogin: true,
        loginError: req.flash("loginError"),
        registerError: req.flash("registerError")
    });
});

router.post("/login", async (req, res) => {
    try {
        const {email, password} = req.body;
        const candidate = await User.findOne({email});
        if (candidate) {
            const areSame = await bcrypt.compare(password, candidate.password);
            if (areSame) {
                req.session.user = candidate;
                req.session.isAuthenticated = true;
                req.session.save(err => {
                    if (err) {
                        throw err;
                    }
                    res.redirect("/");
                });
            } else {
                req.flash("loginError", "Неверный пароль");
                res.redirect("/auth/login#login");
            }
        } else {
            req.flash("loginError", "Такого пользователя не существует");
            res.redirect("/auth/login#login");
        }
    } catch (e) {
        console.log(e);
    }
});

router.post("/register", registerValidators, async (req, res) => {
    try {
        const {email, password, name} = req.body;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.flash("registerError", errors.array()[0].msg);
            return res.status(422).redirect("/auth/login#register");
        }

        const hashPassword = await bcrypt.hash(password, 10);
        const user = new User({
            email,
            name,
            password: hashPassword,
            cart: {
                items: []
            }
        });
        await user.save();
        res.redirect("/auth/login#login");
        await transporter.sendMail(registerEmail(email));
    } catch (e) {
        console.log(e);
    }
});

router.get("/logout", async (req, res) => {
    req.session.destroy(() => {
        res.redirect("/auth/login#login");
    });
});

router.get("/reset", (req, res) => {
    res.render("auth/reset", {
        title: "Забыли пароль?",
        error: req.flash("error")
    });
});

router.post("/reset", (req, res) => {
    try {
        crypto.randomBytes(32, async (err, buffer) => {
            if (err) {
                req.flash("error", "Some faile");
                return res.redirect("auth/reset");
            }
            const token = buffer.toString("hex");
            const candidate = await User.findOne({email: req.body.email});
            if (candidate) {
                candidate.resetToken = token;
                candidate.resetTokenExp = Date.now() + 60 * 60 * 1000;
                await candidate.save();
                await transporter.sendMail(resetEmail(candidate.email, token));
                res.redirect("/auth/login");
            } else {
                req.flash("error", "Такого емейла - нету в базе данних");
                res.redirect("/auth/reset");
            }
        });
    } catch (e) {
        console.log(e);
    }
});

router.get("/password/:token", async (req, res) => {
    if (!req.params.token) {
        return res.redirect("/auth/login");
    }
    try {
        const user = await User.findOne({
            resetToken: req.params.token,
            resetTokenExp: {$gt: Date.now()}
        });
        if (!user) {
            return res.redirect("/auth/login");
        } else {
            res.render("auth/password", {
                title: "Востоновить доступ",
                error: req.flash("error"),
                userId: user._id.toString(),
                token: req.params.token
            });
        }
    } catch (e) {
        console.log(e);
    }
});

router.post("/password", async (req, res) => {
    try {
        const user = await User.findOne({
            _id: req.body.userId,
            resetToken: req.body.token,
            resetTokenExp: {$gt: Date.now()}
        });
        if (user) {
            user.password = await bcrypt.hash(req.body.password, 10);
            user.resetToken = undefined;
            user.resetTokenExp = undefined;
            await user.save();
            res.redirect("/auth/login");
        } else {
            req.flash("loginError", "Время жызни токена истекло");
            res.redirect("/auth/login");
        }
    } catch (e) {
        console.log(e);
    }
});

module.exports = router;
