const Coupon = require("../models/Coupon");
const Course = require("../models/Course");
const UserCourse = require("../models/UserCourse");
const UserBook = require("../models/UserBook");
const UserWebinar = require("../models/UserWebinar");
const ErrorResponse = require("./errorResponse");

exports.convertCouponCodeToId = async (couponCode) => {
  const coupon = await Coupon.findOne({ code: couponCode });
  if (!coupon) throw new ErrorResponse(`Invalid Coupon provided!`, 400);

  return coupon?._id;
};

exports.checkCouponTimeValidity = (coupon) => {
  const today = new Date();

  if (coupon.endDate < today)
    throw new ErrorResponse(`Expired Coupon provided!`, 400);
  if (coupon.startDate > today)
    throw new ErrorResponse(
      `Coupon not active. Coupon will be active from ${today.toISOString()}!`,
      400
    );

  return true;
};

exports.isGeneralCoupon = async (couponId) => {
  if (!couponId) return false;

  const coupon = await Coupon.findById(couponId);
  if (!coupon) throw new ErrorResponse(`Invalid Coupon provided!`, 400);

  this.checkCouponTimeValidity(coupon);

  if (!coupon?.isGeneral)
    throw new ErrorResponse(`This coupon is not applicable!`, 400);

  return true;
  // return coupon
};

exports.isResourceCoupon = async (couponId, resourceId) => {
  if (!couponId || !resourceId) return false;

  const coupon = await Coupon.findById(couponId);
  if (!coupon) throw new ErrorResponse(`Invalid Coupon provided!`, 400);

  this.checkCouponTimeValidity(coupon);

  const applicableResourceIds =
    coupon.applicableItems.map((i) => i.source) || [];
  if (!applicableResourceIds.contains(resourceId))
    throw new ErrorResponse(`This coupon is not applicable!`, 400);

  return true;
  // return coupon
};

exports.calculateCouponDiscount = async (couponId, price) => {
  if (!couponId) return 0;

  const coupon = await Coupon.findById(couponId);
  if (!coupon) throw new ErrorResponse(`Invalid Coupon provided!`, 400);
  if (!coupon?.value || !price) return 0;

  let discount = 0;
  if (coupon.type === "percentage") {
    discount = Number(price * (coupon?.value / 100));
  }
  if (coupon.type === "fixed") {
    discount = Number(coupon?.value);
  }
  return discount;
};

exports.calculateFinalPrice = async (couponId, price) => {
  const discount = await this.calculateCouponDiscount(couponId, price);
  const finalPrice = price - discount;
  return finalPrice;
};

exports.updateOrderItems = async (orderItems) => {
  if (!orderItems || orderItems?.length < 1) return false;

  for (const orderItem of orderItems) {
    const minPrice = salePrice || price;
    const finalPrice = await this.calculateFinalPrice(
      orderItem?.coupon,
      minPrice
    );
    const payload = {
      finalPrice,
      salePrice: orderItem?.salePrice,
      price: orderItem?.price,
      coupon: orderItem?.coupon,
    };
    switch (orderItem.type) {
      case "Course":
        const course = await UserCourse.findByIdAndUpdate(
          orderItem?.source,
          payload
        );
        break;

      case "Book":
        const book = await UserBook.findByIdAndUpdate(
          orderItem?.source,
          payload
        );
        break;

      case "Webinar":
        const webinar = await UserWebinar.findByIdAndUpdate(
          orderItem?.source,
          payload
        );
        break;

      default:
        break;
    }
  }
  return true;
};
