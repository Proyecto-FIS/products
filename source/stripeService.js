const createCircuitBreaker = require("./circuitBreaker").createCircuitBreaker;

module.exports.stripeProductsCreate = createCircuitBreaker({
    name: "stripeProductsCreate",
    errorThreshold: 20,
    timeout: 20000,
    healthRequests: 5,
    sleepTimeMS: 100,
    maxRequests: 0,
    errorHandler: (err) => false,
    request: (stripe, data) => stripe.products.create(data),
    fallback: (err, args) => {
        console.log(err);
        if (err && err.isAxiosError) throw err;
        throw {
            response: {
                status: 503,
            },
        };
    },
});

module.exports.stripeProductsUpdate = createCircuitBreaker({
    name: "stripeProductsUpdate",
    errorThreshold: 20,
    timeout: 20000,
    healthRequests: 5,
    sleepTimeMS: 100,
    maxRequests: 0,
    errorHandler: (err) => false,
    request: (stripe, id, data) => stripe.products.update(id, data),
    fallback: (err, args) => {
        if (err && err.isAxiosError) throw err;
        throw {
            response: {
                status: 503,
            },
        };
    },
});

module.exports.stripePricesCreate = createCircuitBreaker({
    name: "stripePricesCreate",
    errorThreshold: 20,
    timeout: 20000,
    healthRequests: 5,
    sleepTimeMS: 100,
    maxRequests: 0,
    errorHandler: (err) => false,
    request: (stripe, data) => stripe.prices.create(data),
    fallback: (err, args) => {
        if (err && err.isAxiosError) throw err;
        throw {
            response: {
                status: 503,
            },
        };
    },
});

module.exports.stripePricesUpdate = createCircuitBreaker({
    name: "stripePricesUpdate",
    errorThreshold: 20,
    timeout: 20000,
    healthRequests: 5,
    sleepTimeMS: 100,
    maxRequests: 0,
    errorHandler: (err) => false,
    request: (stripe, id, data) => stripe.prices.update(id, data),
    fallback: (err, args) => {
        if (err && err.isAxiosError) throw err;
        throw {
            response: {
                status: 503,
            },
        };
    },
});
