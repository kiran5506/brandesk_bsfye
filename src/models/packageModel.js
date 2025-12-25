const mongoose = require('mongoose');

const packageSchema = new  mongoose.Schema({
    name: { type: String, required: true },
    price: {type: Number, required: true },
    courseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    description: {type: String, required: false},
    direct_amount: {type: String, required: false},
    passive_amount: {type: String, required: false},

},{
    timestamps: true
})

module.exports = mongoose.model('Package', packageSchema);
