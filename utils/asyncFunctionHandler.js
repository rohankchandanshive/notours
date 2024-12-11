module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res,next).catch(next); //If err occur's next passed it to the Global Error Handler
  };
};
