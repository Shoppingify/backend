exports.formatValidationErrors = (e) => {
  return {
    status: "error",
    field: e.details[0].path[0],
    message: e.details[0].message,
  };
};
