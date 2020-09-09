const router = require("express").Router();
const Order = require("../Models/order");
const auth = require("../Middleware/auth");

router.get("/", auth, async (req, res) => {
    try {
        const orders = await Order.find({
            "user.userId": req.user._id
        }).populate("user.userId");

        res.render("orders", {
            isOrder: true,
            title: "Orders",
            orders: orders.map(o => {
                return {
                    ...o._doc,
                    price: o.courses.reduce((total, c) => {
                        return (total += c.count * c.course.price);
                    }, 0)
                };
            })
        });
    } catch (e) {
        console.log(e);
    }
});

router.post("/", auth, async (req, res) => {
    try {
        const user = await req.user
            .populate("cart.items.courseId")
            .execPopulate();
        const courses = user.cart.items.map(i => ({
            count: i.count,
            course: { ...i.courseId._doc }
        }));
        const oreder = new Order({
            user: {
                name: req.user.name,
                userId: req.user
            },
            courses: courses
        });
        await oreder.save();
        await req.user.clearCart();
        res.redirect("/orders");
    } catch (e) {
        console.log(e);
    }
});

module.exports = router;
