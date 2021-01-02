# Products Management Microservice
![Deploy on Heroku](https://github.com/Proyecto-FIS/products/workflows/Deploy%20on%20Heroku/badge.svg)


## Product Schema
```
Product:
    _id:  UUID
    name: String
    description: String
    stock: int
    imageUrl: String
    _providerId: UUID
    grind: String
    format: Object
        name: String
        price: Double
```

## Running Locally

To run the backend, you must create these environment files in the backend/env folder:

devel.env for the environment variables in development environment<br/>
prod.env for the environment variables in production environment<br/>
test.env for the environment variables in testing environment

**Environment variables**:

NODE_ENV: development, test or production<br/>
PORT: port to attach to the server. In production environment, this one is provided by Heroku<br/>
DBSTRING: database connection string. Example: mongodb://localhost:27017/coffaine-sales<br/>
HOSTNAME: only needed in production environment. It shouldn't be set in any other one<br/>
SWAGGER_SCHEMA: http or https. It is used for Swagger "Try it" operations<br/>
USERS_MS: URL pointing to the users microservice (including /api/version)<br/>
TEST_USERNAME: Test username (only in test environment)<br/>
TEST_PASSWORD: Test user password (only in test environment)

## API URL
[Coffaine Products](https://coffaine-products.herokuapp.com/)

## API Documentation
[Swagger doc](https://coffaine-products.herokuapp.com/api-docs)
