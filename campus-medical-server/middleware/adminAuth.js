const adminAuth = (req, res, next) => {
  const roleStr = req.body.roleValue ?? req.query.roleValue ?? req.headers['x-role'];
  const roleNum = parseInt(roleStr, 10);
  const roleMap = { 0: 0, 1: 1, 2: 2, student: 0, doctor: 1, admin: 2 };

  let finalRole = roleNum;
  if (isNaN(roleNum) && typeof roleStr === 'string') {
    finalRole = roleMap[roleStr];
  }

  if (finalRole !== 2) {
    return res.fail('无权访问');
  }

  next();
};

module.exports = adminAuth;