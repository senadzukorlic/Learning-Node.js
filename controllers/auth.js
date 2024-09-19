const bcrypt = require("bcryptjs")
const User = require("../models/user")
const nodemailer = require("nodemailer")
const mailgunTransport = require("nodemailer-mailgun-transport")

const transporter = nodemailer.createTransport(
  mailgunTransport({
    auth: {
      api_key: "9a8b4d50d90a048e9d2de6198e8a63e7-7a3af442-763d69ba",
      domain: "sandbox82f0563902d4430782a3f16198a37928.mailgun.org",
    },
  })
)

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
        .compare(password, user.password) //koristi se za proveru da li je prva vrednosti(password) koju je korisnik uneo,jednaka hesiranoj verziji lozinke koja se nalazi u bazi podataka.
        .then((doMatch) => {
          if (doMatch) {
            //Ako je lozinka odgovarajuca,postavljamo loggedIn na true i postavljamo sesiju korisnika
            req.session.isLoggedIn = true
            req.session.user = user
            return req.session.save((err) => {
              //neophodno je sacuvati sesiju
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
      return bcrypt.hash(password, 12) //nacin za hesiranje lozinke,ako ne postoji user sa unetim emailom,sifru koju je uneo cemo hesirati ovim postupkom.Broj 12 se odnosi na broj puta koliko bcrypt primeni svoj alogirtam na lozinku.Sto vise puta to je sigurnije,ali sporije,zbog toga 12 idealno.
    })
    .then((hashedPassword) => {
      return User.create({ email: email, password: hashedPassword }) //Nakon toga kreiramo novog korisnika sa emailom koji je uneo, i sifrom,koju smo hesirali
    })
    .then((result) => {
      res.redirect("/login")
      console.log("Attempting to send email...")
      return transporter
        .sendMail({
          to: email,
          from: "shop@node-complete.com",
          subject: "Signup succeeded!",
          html: "<h1>You successfully signed up!</h1>",
        })
        .then((info) => {
          console.log("Email sent successfully:", info)
        })
        .catch((err) => {
          console.log("Error sending email:", err)
        })
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

exports.getReset = (req, res, next) => {
  let message = req.flash("error")
  if (message.length > 0) {
    message = message[0]
  } else {
    message = null
  }
  res.render("auth/reset", {
    path: "/reset",
    pageTitle: "Reset Password",
    errorMessage: message,
  })
}
