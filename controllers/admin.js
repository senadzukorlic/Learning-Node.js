const Product = require("../models/product")

exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-product", {
    //Nebitno je ime view fajlova
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false, //Varijabla pomocu koje se vrsi kondicionalni rendering i prikazuje html/ejs fajl koji je forma za kreiranje produkta
    isAuthenticated: req.session.isLoggedIn,
  })
}

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title
  const imageUrl = req.body.imageUrl
  const price = req.body.price
  const description = req.body.description
  req.user
    .createProduct({
      //Funkcija koja pripada Sequelize i to pomocu definisanja u app
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
      console.log(err)
    })
}

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit
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
        isAuthenticated: req.session.isLoggedIn,
      })
    })
    .catch((err) => console.log(err))
}

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId //U ovom slucaju se "id" uzima iz body,a ne iz params jer je u pitanju post metoda,pa se zajedno sa podacima koji se salju na server,u body nalazi i "id"servera.Id je postavljen u vidu inputa sa type="hidden",kako nebi bio vidljiv
  const updatedTitle = req.body.title //Nakon unsoa izmenjena,izmene ostaju u html/ejs kodu,pa zato pristupamo sa parametrom body,da bi dosli do izmena i radili sa njima
  const updatedPrice = req.body.price
  const updatedImageUrl = req.body.imageUrl
  const updatedDesc = req.body.description
  Product.findByPk(prodId) //Da bi sacuvali izmene koje je korisnik napravio,moramo pristupiti tom proizvodu u bazi podataka(gde ga cuvamo) i rucno sacuvati izmene na dole prikazan nacin
    .then((product) => {
      product.title = updatedTitle
      product.price = updatedPrice
      product.description = updatedDesc
      product.imageUrl = updatedImageUrl
      return product.save() //Sequelize metoda koja cuva u bazi podataka
    })
    .then((result) => {
      console.log("UPDATED PRODUCT!")
      res.redirect("/admin/products")
    })
    .catch((err) => console.log(err))
}

exports.getProducts = (req, res, next) => {
  req.user
    .getProducts()
    .then((products) => {
      res.render("admin/products", {
        prods: products,
        pageTitle: "Admin Products",
        path: "/admin/products",
        isAuthenticated: req.session.isLoggedIn,
      })
    })
    .catch((err) => console.log(err))
}

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId
  Product.findByPk(prodId)
    .then((product) => {
      return product.destroy() //Takodje Sequelize funkcija koja sluzi za brisanje iz baze
    })
    .then((result) => {
      console.log("DESTROYED PRODUCT")
      res.redirect("/admin/products")
    })
    .catch((err) => console.log(err))
}

//Vazno napomenuti da ovakakv nacin pristupanja elementima u bazi podataka:"req.user.getProducts({ where: { id: prodId } })" je isti kao i ovaj nacin:"Product.findByPk(prodId)"
