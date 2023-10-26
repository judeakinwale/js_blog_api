// * Create audit trail for Create, Update and Delete db operations

const AuditTrail = require("../models/AuditTrail");
const User = require("../models/User");

exports.generateAudit = async (payload) => {
  const audit = await AuditTrail.create(payload);
  return audit;
};

exports.getUser = async (user) => {
  if (user?.email) return user;
  return await User.findById(user);
};

exports.updatePayloadAndGenerateAudit = async (user, payload) => {
  payload = {
    ...payload,
    user,
    email: user?.email,
    createdBy: user,
    createdAt: new Date(),
  };

  const response = await this.generateAudit(payload);
  // console.log({ auditResponse: response });
  return response;
};

exports.audit = {
  create: async (user, resourceName, changes = undefined) => {
    user = await this.getUser(user);
    const payload = {
      resourceName,
      operation: "create",
      changes,
    };
    payload.description = `${resourceName} Created`;
    if (user) {
      payload.description = `${resourceName} Created By ${user.lastname} ${user.firstname}`;
    }
    return this.updatePayloadAndGenerateAudit(user, payload);
  },
  update: async (user, resourceName, resourceId, changes = undefined) => {
    user = await this.getUser(user);
    const payload = {
      resourceName,
      operation: "update",
      changes,
    };
    payload.description = `${resourceName} with id: ${resourceId} Updated`;
    if (user) {
      payload.description = `${resourceName} with id: ${resourceId} Updated By ${user.lastname} ${user.firstname}`;
    }
    return this.updatePayloadAndGenerateAudit(user, payload);
  },
  delete: async (user, resourceName, resourceId, changes = undefined) => {
    user = await this.getUser(user);
    const payload = {
      resourceName,
      operation: "delete",
      changes,
    };
    payload.description = `${resourceName} with id: ${resourceId} Deleted`;
    if (user) {
      payload.description = `${resourceName} with id: ${resourceId} Deleted By ${user.lastname} ${user.firstname}`;
    }
    return this.updatePayloadAndGenerateAudit(user, payload);
  },
  login: async (user) => {
    user = await this.getUser(user);
    const payload = {
      operation: "login",
      description: `${user.lastname} ${user.firstname} logged in`,
    };
    return this.updatePayloadAndGenerateAudit(user, payload);
  },
  logout: async (user) => {
    user = await this.getUser(user);
    const payload = {
      operation: "login",
      description: `${user.lastname} ${user.firstname} logged out`,
    };
    return this.updatePayloadAndGenerateAudit(user, payload);
  },
};
