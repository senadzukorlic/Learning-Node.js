module.exports = (req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn //izraz levo od = se koristi da bismo mogli isAuthenticated da prosledimo kao odgovor u nasim view fajlovima.Res se koristi jer ono sto se nalazi u view fajlovima se salje klijentu,pa samim tim je to response,a izraz desno se koristi da pristupi sesijskom objektu korisnika i proverava da li je korisnik trenutno prijavljen,sto znaci da isLoggenIn moze biti samo true ili false.'locals' je instanca koja omogucava da sacuvamo lokalnu varijab
  res.locals.csrfToken = req.csrfToken() //Isto kao gore navedenog objasnjna
  next()
}
