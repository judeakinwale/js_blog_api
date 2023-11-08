// * general utilities for mongoose and mongoose operations

exports.updateOptions = { new: true, runValidators: true };
exports.upsertOptions = { ...this.updateOptions, upsert: true };
exports.timestampOptions = { timestamps: true };
