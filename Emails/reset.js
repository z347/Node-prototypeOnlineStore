const keys = require("../Keys/index");

module.exports = function(email, token) {
    return {
        to: email,
        from: keys.EMAIL_FROM,
        subject: "Востоновления пароля",
        html: `
            <h1>Вы забыли пароль?</h1>
            <p>Если нет, проигнорируйте данное письмо</p>
            <p>Иначе нажмите на ссилку:</p>
            <p><a href="${keys.BASE_URL}/auth/password/${token}">Востоновить пароль</a></p>
            <hr/>
            <a href="${keys.BASE_URL}">Магазин курсов</a>
        `
    };
};
