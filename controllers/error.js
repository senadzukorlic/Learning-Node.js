exports.get404 = (req, res, next) => {
  res.status(404).render("404", {
    pageTitle: "Page Not Found",
    path: "/404",
    isAuthe,
  })
}

exports.get500 = (req, res, next) => {
  res.status().render("500", {
    pageTitle: "Error",
    path: "/500",
  })
}
