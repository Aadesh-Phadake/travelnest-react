const joi=require('joi');

module.exports.listingSchema=joi.object({
    title:joi.string().required(),
    description:joi.string().required(),
    images:joi.array().items(joi.string().allow("",null)).max(20),
    price:joi.number().required().min(0),
    location:joi.string().required(),
    country:joi.string().required(),
    hotelLicense:joi.string().allow("",null).optional(),
    rooms:joi.number().min(1).optional(),
    roomTypes:joi.object({
        single: joi.number().min(0).optional(),
        double: joi.number().min(0).optional(),
        triple: joi.number().min(0).optional()
    }).optional()
}).required();

module.exports.reviewSchema=joi.object({
    comment:joi.string().required(),
    rating:joi.number().required().min(1).max(5)
}).required();