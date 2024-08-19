const express = require("express")
const rootDir = require("../util/path")
const router = express.Router()
const path = require("path")
const adminData = require("./admin")

router.get("/", (req, res, next) => {
  const product = adminData.products
  res.render("shop", { prods: product, pageTitle: "Shop", path: "/" })
})

module.exports = router
