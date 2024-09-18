const path = require("path")

const express = require("express")
const bodyParser = require("body-parser")
const session = require("express-session")
const MySQLStore = require("express-mysql-session")(session)
const csrf = require("csurf")
const flash = require("connect-flash")

const errorController = require("./controllers/error")
const sequelize = require("./util/database")
const Product = require("./models/product")
const User = require("./models/user")
const Cart = require("./models/cart")
const CartItem = require("./models/cart-item")
const Order = require("./models/order")
const OrderItem = require("./models/order-item")

const app = express()
const store = new MySQLStore({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "IslamIman1",
  database: "node-complete",
})
const csrfProtection = csrf()

app.set("view engine", "ejs")
app.set("views", "views")

const adminRoutes = require("./routes/admin")
const shopRoutes = require("./routes/shop")
const authRoutes = require("./routes/auth")

app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, "public")))
app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
)

app.use(csrfProtection)
app.use(flash())

app.use((req, res, next) => {
  if (!req.session.user) {
    return next()
  }
  User.findByPk(req.session.user.id)
    .then((user) => {
      req.user = user //Nacin za definisanje globalnog middleware,pomocu ovoga user i njegove instance iz baze podataka ce biti vidljive svuda u kodu
      next()
    })
    .catch((err) => console.log(err))
})

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn //'locals' je instanca koja omogucava da sacuvamo lokalnu varijab
  res.locals.csrfToken = req.csrfToken()
  next()
})

app.use("/admin", adminRoutes)
app.use(shopRoutes)
app.use(authRoutes)
app.use(errorController.get404)

Product.belongsTo(User, { constraints: true, onDelete: "CASCADE" })
User.hasMany(Product)
User.hasOne(Cart)
Cart.belongsTo(User)
Cart.belongsToMany(Product, { through: CartItem })
Product.belongsToMany(Cart, { through: CartItem })
Order.belongsTo(User)
User.hasMany(Order)
Order.belongsToMany(Product, { through: OrderItem })

sequelize
  .sync()
  .then((cart) => {
    app.listen(3000)
  })
  .catch((err) => {
    console.log(err)
  })
