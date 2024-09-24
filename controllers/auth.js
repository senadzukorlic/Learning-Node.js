const bcrypt = require("bcryptjs")
const crypto = require("crypto")
const User = require("..//models/user")
const { Op } = require("sequelize")
const { sendEmail } = require("../mailer")

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
              const html = "<h1>Your successfully login</h1>"
              return sendEmail(email, html)
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

      const html = "<h1>Your successfully signed up</h1>"
      return sendEmail(email, html)
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

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err)
      return res.redirect("/reset")
    }
    const token = buffer.toString("hex")
    const email = req.body.email
    User.findOne({ where: { email: email } })
      .then((user) => {
        if (!user) {
          req.flash("error", "No account with that email found")
          return res.redirect("/reset")
        }
        user.resetToken = token
        user.resetTokenExpiration = Date.now() + 3600000
        return user.save()
      })
      .then((result) => {
        res.redirect("/")
        const html = `
        <p>You requested a password reset</p>
        <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password</p>
      `
        return sendEmail(email, html)
      })
      .catch((err) => console.log(err))
  })
}

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token
  User.findOne({
    where: { resetToken: token, resetTokenExpiration: { [Op.gt]: Date.now() } },
  })
    .then((user) => {
      let message = req.flash("error")
      if (message.length > 0) {
        message = message[0]
      } else {
        message = null
      }
      res.render("auth/new-password", {
        path: "/new-password",
        pageTitle: "New Password",
        errorMessage: message,
        userId: user.id.toString(),
        passwordToken: token,
      })
    })
    .catch((err) => console.log(err))
}

// exports.postNewPassword = (req, res, next) => {
//   const newPassword = req.body.password
//   const userId = req.body.userId
//   const passwordToken = req.body.passwordToken

//   let resetUser
//   User.findOne({
//     resetToken: passwordToken,
//     resetTokenExpiration: { [Op.gt]: Date.now(), id: userId },
//   })
//     .then((user) => {
//       resetUser = user
//       bcrypt.hash(newPassword, 12)
//     })
//     .then((hashedPassword) => {
//       resetUser.password = hashedPassword
//       resetUser.resetToken = undefined
//       resetUser.resetTokenExpiration = undefined
//       return resetUser.save
//     })
//     .then((result) => {
//       res.redirect("/login")
//       const email = resetUser.email // Pribavljanje email adrese korisnika
//       const html = "<p>You have successfully changed your password.</p>"
//       return sendEmail(email, html)
//     })
//     .catch((err) => console.log(err))
// }

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password
  const userId = req.body.userId
  const passwordToken = req.body.passwordToken
  let resetUser

  User.findOne({
    where: {
      resetToken: passwordToken,
      resetTokenExpiration: { [Op.gt]: Date.now() },
      id: userId,
    },
  })
    .then((user) => {
      resetUser = user
      return bcrypt.hash(newPassword, 12)
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword
      resetUser.resetToken = undefined
      resetUser.resetTokenExpiration = undefined
      return resetUser.save()
    })
    .then((result) => {
      res.redirect("/login")
      const email = resetUser.email // Pribavljanje email adrese korisnika
      const html = "<p>You have successfully changed your password.</p>"
      return sendEmail(email, html)
    })
    .catch((err) => console.log(err))
}

// zukorlic.sen123@gmail.com
