const Subscription = require("../models/Subscription");
const SubscriptionType = require("../models/SubscriptionType");
const Tenant = require("../models/Tenant");
const User = require("../models/User");
const { addMonthsToDate } = require("./dateUtils");

exports.getTenantByDomain = async (domain) => {
  if (!domain) throw new Error("No Tenant Domain Provided");

  const tenant = await Tenant.findOne({ domain });
  if (!tenant) throw new Error("Tenant not found!");
  // console.log({ tenant });
  return tenant;
};

exports.getTenantByEmail = async (email) => {
  if (!email) throw new Error("No Email Provided: Could not get Tenant");
  email = email?.toLowerCase();

  const domain = String(email).split("@")[1];
  return await this.getTenantByDomain(domain);
};

exports.updateTenantStaffSubscription = async (
  tenant,
  tenantStaff = undefined
) => {
  tenantStaff = tenantStaff || (await User.find({ tenant }));
  const tenantSubscription = tenant?.subscription;

  const response = await Promise.all(
    tenantStaff.map(async (t) => {
      // console.log({ "t?._id": t?._id });
      t.subscription = tenantSubscription;
      t.isSubscribed = true;
      await t.save();
      return t;
    })
  );
  console.log({ responseLength: response.length });
  return response;
};

exports.createTenantSubscription = async (tenant) => {
  if (!tenant) throw new Error("Invalid Tenant!");

  const now = new Date();
  // console.log("starting");
  if (tenant?.subscription && tenant?.subscriptionExpiry > now) return;

  if (!tenant?.subscriptionType)
    throw new Error("Please update Tenant with a subscription type!");

  const subscriptionType = await SubscriptionType.findById(
    tenant?.subscriptionType
  );
  if (!subscriptionType) throw new Error("Invalid SubscriptionType provided!");

  // console.log({
  //   "tenant?.subscriptionStart": tenant?.subscriptionStart,
  //   "subscriptionType?.duration": subscriptionType?.duration,
  // });
  const endDate = addMonthsToDate(
    tenant?.subscriptionStart,
    subscriptionType?.duration
  );

  const tenantStaff = await User.find({ tenant });

  const payload = {
    type: tenant?.subscriptionType,
    users: tenantStaff?.map((t) => t?._id),
    tenant: tenant?._id,
    startDate: tenant?.subscriptionStart,
    endDate: endDate,
  };
  console.log({ payload });

  const tenantSubscription = await Subscription.create(payload);
  console.log({ tenantSubscription });

  tenant.subscriptionExpiry = endDate;
  tenant.subscription = tenantSubscription;
  await tenant.save();
  console.log(tenant);

  await this.updateTenantStaffSubscription(tenant, tenantStaff);

  return tenant;
};
