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

## API Documentation
[Swagger doc](https://coffaine-products.herokuapp.com/api-docs)
