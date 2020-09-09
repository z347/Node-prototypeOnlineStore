const keys = require("../Keys/index");

module.exports = function(email) {
    return {
        to: email,
        from: keys.EMAIL_FROM,
        subject: "Акаунт создан",
        html: `
            <h1>Добро пожаловать в наш магазин</h1>
            <p>Вы успешно создали аккаунт c email - ${email}</p>
            <hr/>
            <a href="${keys.BASE_URL}">Магазин курсов</a>
        `
    };
};
