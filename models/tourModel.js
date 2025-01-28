const mongoose = require("mongoose");
const slugify = require("slugify");

const User = require('./userModel')

const tourSchema = new mongoose.Schema(
  {
    //? tour schema
    name: {
      type: String,
      required: [true, "A tour must have a name"],
      unique: true, //* not a validator
      trim: true,
      maxlength: [40, "A Tour Name Must Have Lesss Or Equal Then 40 Characters"],
      minlength: [8, "A Tour Name Must Have More Or Equal Then 10 Characters"],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, "A tour must have a duration"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size"],
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty Must Be Easy, Medium Or Difficult",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating Must Be Above 1.0"],
      max: [5, "Rating Must Be Below 5.0"],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "A tour must have a price"],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (value) {
          //! this function will not work in update method only work when create a new tour
          return value < this.price;
        },
        message: "Price Discount {VALUE} Must Be Less Than Price",
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, "A tour must have a summary"],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, "A tour must have a cover image"],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now,
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation:{
      //GeoJSON
      type:{
        type:String,
        default:'Point',
        enum:['Point'],
      },
      coordinates:[Number],
      address:String,
      description:String,
    },
    locations:[
      //* by specifying basically an arry of objects, this will then create brand new documents inside of the parent document

      {
        type:{
          type: String,
          default:'Point',
          enum:['Point'],
        },
        coordinates:[Number],
        address:String,
        description:String,
        day:Number,
      }
    ],
    guides:Array
  },
  {
    toJSON: {virtuals: true}, //? to include virtual properties in the json output
    toObject: {virtuals: true},
  },
);

//? virtual Properties NOTE: we define a regular function here not an arrow function because we need to this keyword
//? also we cannot use this vurtual property in a query like tour.find where durationWeek is = 1 because it is not a part of our DB
tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

//? Document MiddleWare: only runs before .save() and .create() and dont run in .insertMany() , update ...
tourSchema.pre("save", function (next) {
  this.slug = slugify(this.name, {lower: true}); //* Slug : conver the name from Test Tour 1 to test-tour-1
  next();
});

tourSchema.pre('save',async function(next){
  const guidesPromises = this.guides.map(async id => await User.findById(id));
  this.guides = await Promise.all(guidesPromises);

  next();
})

// post middleware function are executed after all the pre middleware functions have completed
// tourSchema.post("save", function (doc, next) {
//   console.log(doc);
//   next();
// });

//? Query middleware
tourSchema.pre(/^find/, function (next) {
  // tourSchema.pre('find',function(next){
  this.find({secretTour: {$ne: true}});
  next();
});

// tourSchema.post(/^find/, function (docs, next) {
//   console.log("Query executed:", docs);
//   next();
// });

//? aggregation pipeline middleware like (getTourStats,getMonthlyPlan)
tourSchema.pre("aggregate", function (next) {
  this.pipeline().unshift({$match: {secretTour: {$ne: true}}});
  next();
});

const Tour = mongoose.model("Tour", tourSchema); //? tour model

module.exports = Tour;
