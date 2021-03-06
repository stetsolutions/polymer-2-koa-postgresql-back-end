const path = require('path')

const argon2 = require('argon2')
const passport = require('koa-passport')

const LocalStrategy = require('passport-local').Strategy

const authService = require(path.resolve('./modules/authentication/services/authentication.service.js'))
const roleService = require(path.resolve('./modules/role/services/role.service.js'))
const userService = require(path.resolve('./modules/user/services/user.service.js'))

passport.use(
  new LocalStrategy(async (username, password, done) => {
    const credentials = {
      password: password,
      username: username
    }

    const result = await validate(credentials)

    if (!result) {
      return done('invalid', false)
    }

    return done(null, result)
  })
)

/**
 * Get User by id
 * @param   {integer} userId
 * @returns {object}
 */
const getUserById = async (userId) => {
  let roles = []

  const resultA = await userService.getUserById(userId)
  const resultB = await roleService.getRolesByUserId(userId)

  let user = resultA.rows[0]

  resultB.rows.forEach((row) => {
    roles.push(row.role_name)
  })

  if (user) {
    user.roles = roles
  }

  return user
}

/**
 * Validate
 * @param   {object} credentials
 * @returns {boolean|object}
 */
const validate = async (credentials) => {
  const result = await authService.getUserByUsername(credentials.username)

  if (!result.rowCount) {
    return false
  } else {
    const verify = await argon2.verify(result.rows[0].password, credentials.password)

    if (verify === true) {
      const user = await getUserById(result.rows[0].id)

      return user
    }

    return false
  }
}
