const expressSwagger = require("express-swagger-generator");

module.exports.getBasePath = () => {
  return "/api/v1";
};

module.exports.setUpSwagger = (app, port) => {
  const swaggerOptions = {
    swaggerDefinition: {
      info: {
        description:
          "This is the prodcuts microservice, in charge on manage the catalog and new products added by roasters",
        title: "Coffaine - Products microservice API",
        version: "1.0.0",
      },
      host: process.env.HOSTNAME || "localhost:" + port,
      basePath: this.getBasePath(),
      produces: ["application/json"],
      schemes: [process.env.SCHEMA],
      securityDefinitions: {
        JWT: {
          type: "apiKey",
          in: "header",
          name: "Authorization",
          description: "",
        },
      },
    },
    basedir: __dirname, //app absolute path
    files: ["./routes/**/*.js"], //Path to the API handle folder
  };

  expressSwagger(app)(swaggerOptions);
};
