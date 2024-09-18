const bcrypt = require("bcryptjs")
const User = require("../models/user")

exports.getLogin = (req, res, next) => {
  let message = req.flash("error") // posto se flash poruke cuvaju u nizu([]),izdvojicemo text iz niza,da bi rukovali njegovim prikazivanjem,ako to ne uradimo,prikazivace se div od 'flasha',cak i kada su podaci ispravni i nema poruke o gresi
  if (message.length > 0) {
    message = message[0]
  } else {
    message = null
  }
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    errorMessage: message,
  })
}
exports.getSignup = (req, res, next) => {
  let message = req.flash("error")
  if (message.length > 0) {
    message = message[0]
  } else {
    message = null
  }
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    errorMessage: message,
  })
}

exports.postLogin = (req, res, next) => {
  const email = req.body.email
  const password = req.body.password
  User.findOne({ where: { email: email } })
    .then((user) => {
      if (!user) {
        req.flash("error", "Invalid email or password.") //error je kljuc koji se koristi za prepoznavanje
        return res.redirect("/login")
      }
      bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          if (doMatch) {
            req.session.isLoggedIn = true
            req.session.user = { id: user.id, email: user.email }
            return req.session.save((err) => {
              console.log(err)
              res.redirect("/")
            })
          }
          req.flash("error", "Invalid email or password.")
          res.redirect("/login")
        })
        .catch((err) => {
          console.log(err)
          res.redirect("/login")
        })
    })
    .catch((err) => console.log(err))
}

exports.postSignup = (req, res, next) => {
  const email = req.body.email
  const password = req.body.password
  const confrimPassword = req.body.confrimPassword
  User.findOne({ where: { email: email } })
    .then((userDoc) => {
      if (userDoc) {
        req.flash("error", "E-mail exists already,please pick a different one.")
        return res.redirect("/signup")
      }
      return bcrypt.hash(password, 12) //nacin za hesiranje lozinke
    })
    .then((hashedPassword) => {
      return User.create({ email: email, password: hashedPassword })
    })
    .then((result) => {
      res.redirect("/login")
    })
    .catch((err) => {
      console.log(err)
    })
}

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err)
    res.redirect("/")
  })
}
