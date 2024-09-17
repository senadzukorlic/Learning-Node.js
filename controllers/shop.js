const Product = require("../models/product")

exports.getProducts = (req, res, next) => {
  Product.findAll()
    .then((products) => {
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "All Products",
        path: "/products",
        isAuthenticated: req.session.isLoggedIn,
      })
    })
    .catch((err) => {
      console.log(err)
    })
}

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId
  Product.findByPk(prodId)
    .then((product) => {
      res.render("shop/product-detail", {
        product: product,
        pageTitle: product.title,
        path: "/products",
        isAuthenticated: req.session.isLoggedIn,
      })
    })
    .catch((err) => console.log(err))
}

exports.getIndex = (req, res, next) => {
  Product.findAll()
    .then((products) => {
      res.render("shop/index", {
        prods: products,
        pageTitle: "Shop",
        path: "/",
      })
    })
    .catch((err) => {
      console.log(err)
    })
}

exports.getCart = (req, res, next) => {
  req.user
    .getCart() //Sequelize metoda za dohvatanje korpe
    .then((cart) => {
      if (!cart) {
        return req.user.createCart()
      }
      return cart
    })
    .then((cart) => {
      return cart.getProducts() //Sequelize metoda za dohvatanje stvari iz korpe
    })
    .then((products) => {
      res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Your Cart",
        products: products,
        isAuthenticated: req.session.isLoggedIn,
      })
    })
    .catch((err) => console.log(err))
}

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId
  let fetchedCart
  let newQuantity = 1
  req.user
    .getCart() //Preuzimamo trenutnu korpu proizvoda
    .then((cart) => {
      console.log(cart)

      fetchedCart = cart
      return cart.getProducts({ where: { id: prodId } }) //Provera da li proizvod sa tim id postoji u korpi,i vracamo to stanje korpe,koje se cuva u varijacbli fetchedCart
    })
    .then((products) => {
      //Ako proizvod postoji,uzima se samo prvi proizvod
      let product
      if (products.length > 0) {
        product = products[0]
      }

      if (product) {
        //Proveravamo da li taj proizvod postoji u korpi

        const oldQuantity = product.cartItem.quantity //Ako proizvod postoji u korpi uzima se njegova trenunta kolicina
        newQuantity = oldQuantity + 1 //Nakon toga trenutnu kolicinu uvecavamo za 1 i cuvamo u novoj varijabli,sto znaci da ce se newQuantity azurirati samo u ovom slucaju kada je produkt vec pristuan u korpi.U slucaju kada nije,njena vrednost ce ostati 1
        return product //Vracamo produkt sa azuriranom kolicinom
      }
      return Product.findByPk(prodId) //Ako proizvod ne postoji u korpi,koristi se findByPk da bi se proivod preuzeo iz baze podataka
    })
    .then((product) => {
      return fetchedCart.addProduct(product, {
        //Dodavanje novog proizvoda u korpu ili azuriranje kolicine starog proizvoda,koristeci newQuantity vraijablu,koja u prvom slucaju iznosi 1 a ukoliko proizvod vec postoji u korpi povecava se za 1
        through: { quantity: newQuantity },
      })
    })
    .then(() => {
      res.redirect("/cart")
    })
    .catch((err) => console.log(err))
}

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId
  req.user
    .getCart()
    .then((cart) => {
      return cart.getProducts({ where: { id: prodId } })
    })
    .then((products) => {
      const product = products[0]
      return product.cartItem.destroy()
    })
    .then((result) => {
      res.redirect("/cart")
    })
    .catch((err) => console.log(err))
}

exports.postOrder = (req, res, next) => {
  let fetchedCart
  req.user
    .getCart()
    .then((cart) => {
      fetchedCart = cart
      return cart.getProducts() //Dohvatamo sve proizvode iz jedne korpe i cuvamo ih u fetchedCart varijabli
    })
    .then((products) => {
      return req.user
        .createOrder() //Kreiramo porudzbinu
        .then((order) => {
          return order.addProducts(
            //Svakoj porudzbini dodajemo produkte
            products.map((product) => {
              //Prolazimo kroz svaki produkt pomocu map
              product.orderItem = { quantity: product.cartItem.quantity } //Dodajemo kolicinu proizvoda u orderItem da bude ekvivalentna kolicini iz cartItem
              return product
            })
          )
        })
        .catch((err) => console.log(err))
    })
    .then((result) => {
      return fetchedCart.setProducts(null) //Brisanje proizvoda iz korpe
    })
    .then((result) => {
      res.redirect("/orders")
    })
    .catch((err) => console.log(err))
}

exports.getOrders = (req, res, next) => {
  req.user
    .getOrders({ include: ["products"] })
    .then((orders) => {
      res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
        orders: orders,
        isAuthenticated: req.session.isLoggedIn,
      })
    })
    .catch((err) => console.log(err))
}
