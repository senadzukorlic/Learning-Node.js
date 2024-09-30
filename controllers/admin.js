const Product = require("../models/product")
const User = require("../models/user")

const { validationResult } = require("express-validator")

exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    errorMessage: null,
    hasError: false,
    validationErrors: [],
    editing: false, //Varijabla pomocu koje se vrsi kondicionalni rendering i prikazuje ejs fajl koji je forma za kreiranje produkta
  })
}

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title
  const imageUrl = req.body.imageUrl
  const price = req.body.price
  const description = req.body.description
  const errors = validationResult(req) //provjerava rezultate svih prethodno definiranih validacija za trenutni zahtjev (req) i vraća objekt koji sadrži informacije o svim pronađenim greškama
  if (!errors.isEmpty()) {
    //statusni kod koji pokazuje da validacija nije uspela,i renderuje view gde se prikazuje poruke o greskama prilikom validacije
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/edit-product",
      editing: false,
      hasError: true,
      product: {
        title: title,
        imageUrl: imageUrl,
        price: price,
        description: description,
      },
      errorMessage: errors.array()[0].msg, //varijabla u kojoj prikazujemo samo prvu gresku proizvedenu prilikom validacije
      validationErrors: errors.array(), //varijabla koju koristimo kao niz sa greskama proizvedenih kroz proces validacije.
    })
    //Znaci u slucaju da prilikom pokusaja kreiranja proizvoda ima neispravno unetih podataka,renderujemo greske i ostavljamo pogresno ili delimicno pogresno unete informacije o prozivodu,radi boljeg korisnickog iskustva
  }
  req.user //instanca za korisnika kreirana u app
    .createProduct({
      //Funkcija koja pripada Sequelize za kreiranje produkta
      title: title,
      price: price,
      imageUrl: imageUrl,
      description: description,
    })
    .then((result) => {
      console.log("Created Product")
      res.redirect("/admin/products")
    })
    .catch((err) => {
      // res.redirect("/500")//ovo nacin prikazivanja gresaka kada su u pitanju vece greske
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(error)
    })
  //Inace ako je validacija prolsa kako treba,dopustamo korisniku da kreira proizvod
}

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit //edit se koristi kao parametar u url kako bi imali kontrolu prikaza
  if (!editMode) {
    return res.redirect("/")
  }
  const prodId = req.params.productId
  req.user
    .getProducts({ where: { id: prodId } }) //Takodje funckija koja pripada Sequelize,"{ where: { id: prodId } }",je deo koji sluzi za "filtriranje" produkta koji se preuzimaju,samo ako je id jednak pordId.Sto znaci da ce se preuzeti samo produkt na ciji edit button je kliknuto
    .then((products) => {
      const product = products[0] //getProducts funckija uvek vraca niz,zato je potrebno izdvojiti produkt koji zelimo izmeniti,formulacijom products[0].Takodje ova formulacija se vrsi zato sto moze biti da ima vise proukata sa istim id,a nama je potreban prvi u ovom slucaju
      if (!product) {
        return res.redirect("/")
      }
      res.render("admin/edit-product", {
        pageTitle: "Edit Product",
        path: "/admin/edit-product",
        editing: editMode,
        product: product,
        hasError: false,
        errorMessage: null,
        validationErrors: [],
      })
    })
    .catch((err) => {
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(error)
    })
}

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId //U ovom slucaju se "id" uzima iz body,a ne iz params jer je u pitanju post metoda,pa se zajedno sa podacima koji se salju na server,u body nalazi i "id"servera.Id je postavljen u vidu inputa sa type="hidden",kako nebi bio vidljiv
  const updatedTitle = req.body.title //Nakon unsoa izmenjena,izmene ostaju u html/ejs kodu,pa zato pristupamo sa parametrom body,da bi dosli do izmena i radili sa njima
  const updatedPrice = req.body.price
  const updatedImageUrl = req.body.imageUrl
  const updatedDesc = req.body.description
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Edit Product",
      path: "/admin/edit-product",
      editing: true,
      hasError: true,
      product: {
        title: updatedTitle,
        imageUrl: updatedImageUrl,
        price: updatedPrice,
        description: updatedDesc,
        id: prodId,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    })
  }
  Product.findByPk(prodId) //Da bi sacuvali izmene koje je korisnik napravio,moramo pristupiti tom proizvodu u bazi podataka(gde ga cuvamo) i rucno sacuvati izmene na dole prikazan nacin
    .then((product) => {
      if (product.userId !== req.user.id) {
        //Linija kojom proveravamo da li je user koji je prijavljen,vlasnik tog producta,ako nije preusmerice nas na pocetnu stranicu,return obezbedjuje da se ostatak koda ne izvrsi ako je gore navedeni uslov tacan
        return res.redirect("/")
      }
      product.title = updatedTitle
      product.price = updatedPrice
      product.description = updatedDesc
      product.imageUrl = updatedImageUrl
      return product
        .save() //Sequelize metoda koja cuva u bazi podataka
        .then((result) => {
          console.log("UPDATED PRODUCT!")
          res.redirect("/admin/products")
        })
    })

    .catch((err) => {
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(error)
    })
}

exports.getProducts = (req, res, next) => {
  req.user
    .getProducts({ where: { userId: req.user.id } }) //Provera(autorizacija)
    .then((products) => {
      res.render("admin/products", {
        prods: products,
        pageTitle: "Admin Products",
        path: "/admin/products",
      })
    })
    .catch((err) => {
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(error)
    })
}

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId
  Product.findOne({ where: { id: prodId, userId: req.user.id } })
    .then((product) => {
      return product.destroy() //Takodje Sequelize funkcija koja sluzi za brisanje iz baze
    })
    .then((result) => {
      console.log("DESTROYED PRODUCT")
      res.redirect("/admin/products")
    })
    .catch((err) => {
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(error)
    })
}

//VAZNO
//1.Napomenuti da ovakakv nacin pristupanja elementima u bazi podataka:"req.user.getProducts({ where: { id: prodId } })" je isti kao i ovaj nacin:"Product.findByPk(prodId)"
//2.
