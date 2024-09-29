const path = require("path")

const express = require("express")
const bodyParser = require("body-parser")
const session = require("express-session")
const MySQLStore = require("express-mysql-session")(session) //dodatak koji omogućava čuvanje sesija u MySQL bazi
const csrf = require("csurf") //Paket koji sluzi za zastitu korisnika,koristi se da obezbedi korisnika tako što osigurava da svaka forma ili zahtev koji menja stanje na serveru dolazi iz legitimnog izvora
const flash = require("connect-flash") // paket koji omogućava čuvanje i prikazivanje poruka između različitih HTTP zahteva

const errorController = require("./controllers/error")
const sequelize = require("./util/database")
const Product = require("./models/product")
const User = require("./models/user")
const Cart = require("./models/cart")
const CartItem = require("./models/cart-item")
const Order = require("./models/order")
const OrderItem = require("./models/order-item")

const store = new MySQLStore({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "IslamIman1",
  database: "node-complete",
})
const csrfProtection = csrf()

const app = express()

app.set("view engine", "ejs")
app.set("views", "views")

const adminRoutes = require("./routes/admin")
const shopRoutes = require("./routes/shop")
const authRoutes = require("./routes/auth")

app.use(bodyParser.urlencoded({ extended: false })) //omogućava vašoj aplikaciji da parsira podatke iz formulara i stavlja ih u req.body
app.use(express.static(path.join(__dirname, "public"))) //omogućava vašoj aplikaciji da služi statičke datoteke iz navedenog direktorijuma klijentima.
app.use(
  session({
    secret: "my secret", // tajni ključ koji se koristi za potpisivanje ID-a sesije
    resave: false, // sesija neće biti sačuvana ponovo ako se nije menjala
    saveUninitialized: false, // nečuvanje neinicijalizovanih sesija
    store: store,
  })
)

app.use(csrfProtection)
app.use(flash())

const userSession = require("./middleware/user-session")
app.use(userSession)

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn //izraz levo od = se koristi da bismo mogli isAuthenticated da prosledimo kao odgovor u nasim view fajlovima.Res se koristi jer ono sto se nalazi u view fajlovima se salje klijentu,pa samim tim je to response,a izraz desno se koristi da pristupi sesijskom objektu korisnika i proverava da li je korisnik trenutno prijavljen,sto znaci da isLoggenIn moze biti samo true ili false.'locals' je instanca koja omogucava da sacuvamo lokalnu varijab
  res.locals.csrfToken = req.csrfToken() //Isto kao gore navedenog objasnjna
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

//VAZNE STVARI ZA NAPOMENU:
//1.Csrf (CsrfProtection) middleware se koristi da kreira csrf token,koji ce se ugraditi da bude sastavni deo fomri koje se renderuju klijentu (frontendu) i u kojima klijent unosi svoje osetljive podatke,kada forme sa korisnickim podacima budu nazad poslate serveru(bekendu),one ce sadrzati csrf token.CsrfProtection midlleware koji je definisan u app,uporedice prvobinto scrfToken koji se nalazio na frontendu pre nego sto je forma poslata,sa scrfToken koji je poslat serveru,ako token ne budu iste vrednosti radnja ce se ponistiti i time ce se korisnik zastitit od potencijalnih napada.
