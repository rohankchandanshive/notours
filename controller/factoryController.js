const ApiFeature = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const asyncFunctionHandler = require('../utils/asyncFunctionHandler');

module.exports.deleteOne = (Model) =>
  asyncFunctionHandler(async (req, res, next) => {
    console.log('deleteOne called >>>');
    const id = req.params.id;
    if (!id) {
      return next(new AppError('Invalid id', 400));
    }
    const doc = await Model.findOne({ _id: id });

    if (!doc) {
      return next(new AppError('No document found with this id', 404));
    }
    const deletedDoc = await Model.findOneAndDelete({ _id: doc._id });
    res.status(201).json({
      status: 'success',
      data: null,
    });
  });

module.exports.updateOne = (Model) =>
  asyncFunctionHandler(async (req, res, next) => {
    const updatedDoc = await Model.findOneAndUpdate(
      {
        _id: req.params.id,
      },
      { ...req.body },
      { returnNewDocument: true },
    );

    if (!updatedDoc) {
      return next(new AppError('No document found with this id', 404));
    }

    res.status(200).json({
      status: 'success',
      data: updatedDoc,
    });
  });

module.exports.findOne = (Model) =>
  asyncFunctionHandler(async (req, res, next) => {
    let query= { _id: req.params.id };
    if(req.body.tourId) query = {tourId: req.body.tour};
    //next is passed to throw custom error to global error handler which in return send's to client
    const doc = await Model.findById(query); //2nd param is propogation(display specific properties of each doc)
    if (!doc) {
      return next(new AppError('No document present with this Id', 404)); // This is cutom error created to throw if the id is invalid rather than getting null/undefined from the mongo query
    }
    res.status(200).json({
      status: 'success',
      data: doc,
    });
  });

module.exports.createOne = Model => asyncFunctionHandler(
async(req,res,next) => {
    console.log('createOne',req.body)
    const doc = await Model.create({
        ...req.body,
      });
    
      res.status(201).json({
        status: 'success',
        message: 'Document created successfully!',
        data: doc,
      });
}
    
)

module.exports.findAll = (Model) =>
  asyncFunctionHandler(async (req, res, next) => {
    // console.log('req.query', req.query);
    if(req.body.tour) req.query.tour = req.body.tour
    let features = new ApiFeature(Model.find(), req.query)
      .filtering()
      .sorting()
      .fields()
      .pagination();
    const docs = await features.query;
    
    if (!docs.length) {
      return next(new AppError('No document found!', 404));
    }

    res.status(200).json({
      status: 'success',
      length: docs.length,
      data: docs,
    });
  });
