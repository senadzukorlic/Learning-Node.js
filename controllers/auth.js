const bcrypt = require("bcryptjs")
const crypto = require("crypto")
const User = require("..//models/user")
const { Op } = require("sequelize")
const { sendEmail } = require("../mailer")
const { validationResult } = require("express-validator")

exports.getLogin = (req, res, next) => {
  let message = req.flash("error") // kada se koristi ovaj izraz req.flash("error"),bez vrednosti vec samo sa kljucem (error),to znaci da samo preuzimamo sve poruke koje su ranije postavljene pod kljucem error(to su slucajevi kada se trebaju prikazati greske koje su napravljene prilikom post zahteva).posto se flash poruke cuvaju u nizu([]),izdvojicemo text iz niza,da bi rukovali njegovim prikazivanjem,ako to ne uradimo,prikazivace se div od 'flasha',cak i kada su podaci ispravni i nema poruke o gresi
  if (message.length > 0) {
    message = message[0]
  } else {
    message = null
  }
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    errorMessage: message,
    oldInput: { email: "", password: "" },
    validationErrors: [],
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
    oldInput: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    validationErrors: [],
  })
}

exports.postLogin = (req, res, next) => {
  const email = req.body.email
  const password = req.body.password

  const errors = validationResult(req) //provjerava rezultate svih prethodno definiranih validacija za trenutni zahtjev (req) i vraća objekt koji sadrži informacije o svim pronađenim greškama
  if (!errors.isEmpty()) {
    //Ako errors nije prazan
    return res.status(422).render("auth/login", {
      //redneruj stranicu login
      path: "/login",
      pageTitle: "Login",
      errorMessage: errors.array()[0].msg, //u errorMessage divu prikazi prvu gresku iz niza errors(mora ovakav nacin)
      oldInput: { email: email, password: password }, //nakon sto se izvrsi zahtev za postavljanje,vrati vrednosti u input koje je korisnik prethodno uneo,zbog boljeg korisnickog iskustva
      validationErrors: errors.array(), //instanca koja se koristi u view za rukovanje prikaza crvenog bordera kada postoji errorMessage
    })
    //U slucaju da ima validacionih gresaka,renderujemo te greske i cuvamo prvobitno unete vrednosti zbog boljeg korisnickog iskustva
  }
  User.findOne({ where: { email: email } })
    .then((user) => {
      if (!user) {
        return res.status(422).render("auth/login", {
          path: "/login",
          pageTitle: "Login",
          errorMessage:
            errors.array().length > 0
              ? errors.array()[0].msg //U slucaju da nije pronadjen korisnik,ili ispisi poruku koja je sacuvana u error nizu ili je u pitanju neispravna input vrednost
              : "Invalid email or password",
          oldInput: { email: email, password: password },
          validationErrors: [],
        })
      }
      bcrypt
        .compare(password, user.password) //koristi se za proveru da li je prva vrednosti(password) koju je korisnik uneo,jednaka hesiranoj verziji lozinke koja se nalazi u bazi podataka.Znaci proveravamo lozinku korisnika koja je sacuvana u bazi pri registraciji instancom user.password,sa lozinkom koju je user uneo neposredno pre slanja zateva serveru
        .then((doMatch) => {
          if (doMatch) {
            //Ako je lozinka odgovarajuca,postavljamo loggedIn na true i postavljamo sesiju korisnika
            req.session.isLoggedIn = true //ovo sluzi samo kao flag u view engine,tj. kao znak da je sesija aktivna,da bi kasnije mogli da ogranicavamo funkcionalnosti korisnika na osnovu toga imaju li aktivnu sesiju ili ne
            req.session.user = user //ovim izrazom cuvamo korisnice informacije u sesiji(kao sto su predmeti,korpe,narudzbine...)
            return req.session.save((err) => {
              //neophodno je sacuvati sesiju
              console.log(err)
              res.redirect("/")
            })
          }
          // u slucaju da se uneta lozinka ne podudara sa hesiranom,ispisati da je problem u unosu i sacuvati stare pogresno unete vrednosti
          return res.status(422).render("auth/login", {
            path: "/login",
            pageTitle: "Login",
            errorMessage: "Invalid email or password.",
            oldInput: { email: email, password: password },
            validationErrors: [],
          })
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
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/signup", {
      //statusni kod koji pokazuje da validacija nije uspela,i renderuje view gde se prikazuje poruke o greskama prilikom validacije
      path: "/signup",
      pageTitle: "Signup",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        confirmPassword: req.body.confirmPassword,
      },
      validationErrors: errors.array(),
    })
  }
  // User.findOne({ where: { email: email } })
  //   .then((userDoc) => {
  //     if (userDoc) {
  //       req.flash("error", "E-mail exists already,please pick a different one.")
  //       return res.redirect("/signup")
  //     }
  bcrypt
    .hash(password, 12) //nacin za hesiranje lozinke,ako ne postoji user sa unetim emailom,sifru koju je uneo cemo hesirati ovim postupkom.Broj 12 se odnosi na broj puta koliko bcrypt primeni svoj alogirtam na lozinku.Sto vise puta to je sigurnije,ali sporije,zbog toga 12 idealno.
    // })
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
    //kreiranje nasumicnog niza bajtova duzine 32,u pitanju je asinhorna funkcija koja koristi callback funckiju koja se poziva kada je generisanje završeno ili ako se desi greška.
    if (err) {
      console.log(err)
      return res.redirect("/reset")
    }
    const token = buffer.toString("hex") //pretvaranje bajtova u string,cime dobijamo jedinstveni token koji se koristi za resetovanje lozinke
    const email = req.body.email
    User.findOne({ where: { email: email } })
      .then((user) => {
        if (!user) {
          req.flash("error", "No account with that email found")
          return res.redirect("/reset")
        }
        user.resetToken = token
        user.resetTokenExpiration = Date.now() + 3600000
        return user.save() //cuvamo usera sa novopostavljenim tokenima
      })
      .then((result) => {
        res.redirect("/")
        const html = `
        <p>You requested a password reset</p>
        <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password</p>
      `
        return sendEmail(email, html) //na mail korisnika se salje se link sa jedinstvenim tokenom koji je dodeljen korisniku ciji je mail unet u obrazac za resetovanje loznike
      })
      .catch((err) => console.log(err))
  })
}

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token //token koji se nalazi u url
  User.findOne({
    where: { resetToken: token, resetTokenExpiration: { [Op.gt]: Date.now() } }, //trazimo usera ciji reset token pripada onom definisanom u url-u i ciji resetToken veci od trenutnog vremena(koji jos traje)
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
      const email = resetUser.email
      const html = "<p>You have successfully changed your password.</p>"
      return sendEmail(email, html)
    })
    .catch((err) => console.log(err))
}

//VAZNE STVARI ZA NAPOMENU:

//ZA REGISTRACIJU NALOGA
//1.Provera se da li uneta email adresa vec postoji u bazi
//2.Lozinka se hesira
//3.Nakon te dve provere,kreiramo novog korisnika sa unetim mailom i hesiranom vrednosti

//ZA REGISTRACIJU NALOGA
//1.Provera se da li uneta email adresa vec postoji u bazi
//2.Proverava se da li je lozinka jednaka hesiranoj vrednosti lozinke koja je sacuvana u u bazi.
//3.Ako jeste cuvamo podatke korisnika u sesiji,a zatim cuvamo sesiju

//ODJAVLJIVANJE SA NALOGA
//1.Samo unistavamo sesiju

//RESETOVANJE LOZINKE
//1.Prvo se napravi funkcija u kojoj se kreira jedinstveni token preko crypto bajtova,koje kasnije pretvaramo u heksimalni string(token).Zatim pronalazimo korisnika preko unetog maila u bazi podataka i korisnikovoj instanci koja se nalazi u bazi podataka dodeljujemo vrednost tog tokena i dodeljujemo vrednost tokena koji vremenski oznacava koliko traje token i cuvamo korisnika sa novim tokenima.Zatim saljemo mail korisniku sa linkom koji je zapravo url sa tokenom na kraju url-a.

//2.Zatim pravimo funckiju u kojoj prikazujemo view za postavljanje nove loznike,ali samo ako korisnikov token odgovara tokenu koji je poslat u url-u i resetToken i dalje vazeci,time cemo sacuvati korisnika od raznih napada

//3.Pravimo trecu funkcijuu kojoj u konacno postavljamo novu lozinku.Prvobitno trazimo korisnika ciji token,reset token i id koji su u bazi,odgovaraju onima koji se nalaze na frontendu (view enginu).Zatim hesiramo novu lozinku,cuvamo je kao korisnicku instancu i i postavljamo instance tokena i resetTokena na nedefinisane i na kraju cuvamo korisnika.Ovom radnjom smo promenili sifru korisnika
