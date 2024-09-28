const User = require("../models/user")

module.exports = (req, res, next) => {
  if (!req.session.user) {
    return next() //koristi se return next,da se ne bi bilo koji kod kasnije izvrsio
  }
  User.findByPk(req.session.user.id) //Trazimo korisnika u bazi i ako njegova sesija nije istekla(znaci da je prijavljen),koristimo izraz req.user kako bi lakse pristupali svim instancama korisnika
    .then((user) => {
      req.user = user //Nacin za definisanje globalnog middleware,pomocu ovoga user i njegove instance iz baze podataka ce biti vidljive svuda u kodu
      next()
    })
    .catch((err) => console.log(err))
}
