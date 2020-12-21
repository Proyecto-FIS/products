const hystrixjs = require("hystrixjs");
const CommandFactory = hystrixjs.commandFactory;
const axios = require("axios");
var hystrixSSEStream = require("hystrixjs").hystrixSSEStream;

const hystrixStreamResponse = (request, response) => {
  response.append("Content-Type", "text/event-stream;charset=UTF-8");
  response.append(
    "Cache-Control",
    "no-cache, no-store, max-age=0, must-revalidate"
  );
  response.append("Pragma", "no-cache");
  return hystrixSSEStream.toObservable().subscribe(
    function onNext(sseData) {
      response.write("data: " + sseData + "\n\n");
    },
    function onError(error) {
      console.log(error);
    },
    function onComplete() {
      return response.end();
    }
  );
};

const configure = (service) => {
  const makeRequest = () => axios.get(service.url);

  const fallback = (err, args) => {
    console.log("error in fallback", err);
    return Promise.resolve(service.fallback);
  };

  const commandBuilder = CommandFactory.getOrCreate(service.name)
    .run(makeRequest)
    .timeout(service.timeout)
    .fallbackTo(fallback);

  return commandBuilder;
};

module.exports.configure = configure;
module.exports.hystrixStreamResponse = hystrixStreamResponse;
